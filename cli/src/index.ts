#!/usr/bin/env node
/**
 * The CLI entrypoint.
 *
 * This file is the *source*; `bin/` holds what tsup builds from it, and `bin/`
 * is what npm publishes. The hashbang above is not decoration — tsup copies it
 * through and marks the output executable, which is what lets `package.json`'s
 * `bin` entry point straight at the bundle.
 *
 * Everything below this file is already built and tested: `plan.ts` turns flags
 * into one `AdapterPlan` per target, `executor.ts` runs them and renders the
 * result. So this stays a router: parse, resolve, execute, report, exit.
 *
 * Argument parsing lives in `args.ts`, on `node:util`'s `parseArgs`. It used to
 * be citty, which cannot express a repeatable flag and silently kept only the
 * last `--user` — see that file for the whole story.
 */
import type { TargetId } from "@ai-plugins/schema";
import {
  existsSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { homedir } from "node:os";
import {
  dirname,
  join,
} from "node:path";
import { fileURLToPath } from "node:url";
import { claude } from "./adapters/claude.ts";
import { cursor } from "./adapters/cursor.ts";
import { ohmypi } from "./adapters/ohmypi.ts";
import { opencode } from "./adapters/opencode.ts";
import {
  execCommand,
  hasBin,
  PACKAGE_NAME,
} from "./adapters/support.ts";
import type {
  Adapter,
  AdapterContext,
  AdapterPlan,
} from "./adapters/types.ts";
import type { Args } from "./args.ts";
import {
  parse,
  renderUsage,
} from "./args.ts";
import {
  missingTools,
  renderMissing,
  requiredTools,
} from "./deps.ts";
import {
  execute,
  executeStatusline,
  executeStatuslineOhmypi,
  executeStatuslineOpencode,
  failed,
  ohmypiStatuslineInstalled,
  opencodeStatuslineInstalled,
  renderDiff,
  renderProgress,
  revert,
  revertStatuslineInstall,
  revertStatuslineOhmypiInstall,
  revertStatuslineOpencodeInstall,
  statuslineInstalled,
} from "./executor.ts";
import type { TargetOutcome } from "./executor.ts";
import { setupGraphify } from "./graphify.ts";
import type { PlanRequest } from "./plan.ts";
import {
  readPluginIndex,
  resolvePlan,
} from "./plan.ts";
import { createProgress } from "./progress.ts";
import {
  ask,
  autoConfigureAllowed,
  interactive,
  resolveConsent,
  setAutoConfigure,
  SURFACE_LABEL,
} from "./statusline-consent.ts";
import type { Surface } from "./statusline-consent.ts";
import { ohmypiStatuslineConflict } from "./statusline-ohmypi.ts";
import { opencodeStatuslineConflict } from "./statusline-opencode.ts";
import { claudeStatuslineConflict } from "./statusline.ts";
import {
  buildVersionReport,
  readCliVersion,
  renderVersionReport,
} from "./version.ts";

export { PACKAGE_NAME } from "./adapters/support.ts";

export const ADAPTERS: readonly Adapter[] = [
  claude,
  cursor,
  ohmypi,
  opencode,
];

/**
 * Resolve the tri-state statusline flag.
 *
 * Unset defers to `--all`, which means the whole toolkit and therefore the bar
 * too. `--no-statusline` refuses it even under `--all`.
 */
export function wantsStatusline(
  flag: boolean | undefined,
  all: boolean,
): boolean {
  return flag ?? all;
}

/**
 * Should an uninstall undo a statusline surface?
 *
 * The install-side question is `wantsStatusline`; this is the other end of it,
 * and it is not the same question. On the way in an unset flag defers to
 * `--all`. On the way out there is no `--all`, so deferring to it meant a plain
 * `--uninstall` left every statusline installed — the user had to know to pass
 * `--statusline` to remove something they never separately asked to install.
 *
 * The gate is the **receipt**: uninstall undoes what this tool did, and the
 * receipt is the record of that.
 * `--no-statusline` still refuses outright, and `reachable` keeps a run that
 * names one target from stripping another's bar.
 */
export function revertsStatusline(
  reachable: boolean,
  selected: boolean,
  refused: boolean,
  installed: () => boolean,
): boolean {
  if (refused || !reachable) {
    return false;
  }
  return selected || installed();
}

/**
 * Whether each selected surface may be **configured** — pointed at the bar.
 *
 * `undefined` is the refusal: a surface needed an answer and could not get one,
 * so the caller stops the run. Anything else is per-surface, because the three
 * are independent installs and a foreign bar in one says nothing about another.
 *
 * The remembered refusal is deliberately *not* per surface — one flag, so
 * declining once is declining — but `--statusline` clears it, which is why the
 * clear happens here rather than inside the loop: it is an answer about the
 * user's intent for the run, not about whichever surface asked first.
 *
 * A dry run never asks and never writes. It reports what an answered run would
 * do at its most complete, which is the same choice the missing-tools gate
 * makes just above: describe the whole diff, refuse nothing.
 */
export async function resolveStatuslineConsent(
  context: AdapterContext,
  selected: StatuslineSelection,
  explicit: boolean,
  dryRun: boolean,
): Promise<Record<Surface, boolean> | undefined> {
  const granted = { claude: true, ohmypi: true, opencode: true };
  if (dryRun) {
    return granted;
  }
  if (explicit) {
    setAutoConfigure(context, true);
  }

  const remembered = !autoConfigureAllowed(context);
  const conflicts: Record<Surface, (c: AdapterContext) => string | undefined> =
    {
      claude: claudeStatuslineConflict,
      ohmypi: ohmypiStatuslineConflict,
      opencode: opencodeStatuslineConflict,
    };

  let declined = false;
  for (const surface of ["claude", "ohmypi", "opencode"] as const) {
    if (!selected[surface]) {
      continue;
    }
    const conflict = conflicts[surface](context);
    const verdict = resolveConsent({
      conflict,
      explicit,
      remembered,
      interactive: interactive(),
    });
    if (verdict === "fail") {
      return undefined;
    }
    if (verdict === "configure") {
      continue;
    }
    if (verdict === "skip" || !await ask(surface, conflict as string)) {
      granted[surface] = false;
      declined = true;
      context.log(
        `${SURFACE_LABEL[surface]}: kept your statusline; re-run with `
          + "--statusline to replace it",
      );
    }
  }
  if (declined) {
    setAutoConfigure(context, false);
  }
  return granted;
}

/** Which targets to act on: those named, else every tool actually present. */
export function selectAdapters(
  platforms: readonly string[],
  context: AdapterContext,
  adapters: readonly Adapter[] = ADAPTERS,
): Adapter[] {
  if (platforms.length === 0) {
    return adapters.filter(a => a.detect(context));
  }
  return platforms.map(name => {
    const adapter = adapters.find(a => a.id === name);
    if (adapter === undefined) {
      throw new Error(
        `unknown platform \`${name}\` — expected one of: ${
          adapters.map(a => a.id).join(", ")
        }`,
      );
    }
    return adapter;
  });
}

/**
 * One plan per adapter.
 *
 * The two per-target rules live here rather than in `resolvePlan`, because they
 * are facts about the *target*, not about the request: Claude's CLI installs
 * dependencies itself, and only a copy-based target needs a rendered bundle.
 */
export function buildJobs(
  adapters: readonly Adapter[],
  request: PlanRequest,
  sourceRoot: string,
  log: (message: string) => void,
): (readonly [Adapter, AdapterPlan])[] {
  const index = readPluginIndex(sourceRoot);
  // plugin → the targets that could not take it. Aggregated so the run says
  // "skipped on cursor, ohmypi and opencode" once, rather than repeating one
  // sentence per target and making a single fact look like three failures.
  const skips = new Map<string, string[]>();
  const jobs = adapters.map(adapter => {
    const plan = resolvePlan(index, adapter.id as TargetId, request, {
      expandDependencies: adapter.id !== "claude",
      // Only Claude can install a plugin hosted in someone else's repo: its
      // marketplace takes a `{source: "url"}` entry and fetches it. The other
      // three cannot, each for its own reason — OpenCode has no marketplace at
      // all and copies a rendered tree; Cursor's manifest is generated from
      // local plugins only; Oh-My-Pi's accepts a URL string and then silently
      // drops the entry, so `omp plugin discover` never lists it. Requesting
      // one there fails, and used to: `--all` died on both.
      localOnly: adapter.id !== "claude",
      log,
      onSkip: (plugin, target) =>
        skips.set(plugin, [...(skips.get(plugin) ?? []), target]),
    });
    return [adapter, plan] as const;
  });

  for (const [plugin, targets] of skips) {
    log(
      `${plugin} installs from its own repo, so it is skipped on `
        + `${list(targets)} — only Claude's marketplace can fetch a plugin `
        + "hosted elsewhere.",
    );
  }
  return jobs;
}

/** `a`, `a and b`, `a, b and c` — an English list, not a CSV. */
export function list(items: readonly string[]): string {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Which status surfaces a run reaches. None is a plugin, so none is a target. */
export interface StatuslineSelection {
  /** The copied script bar plus the caps hook. */
  readonly claude: boolean;
  /** `omp config` keys mirroring the same information. */
  readonly ohmypi: boolean;
  /** A TUI plugin copied in and registered in `tui.json`. */
  readonly opencode: boolean;
}

/**
 * Which status surfaces should this run touch?
 *
 * Resolved **per target**, because the three are different installs of the same
 * idea: Claude gets a script this CLI copies and points `settings.json` at,
 * Oh-My-Pi gets its own renderer configured through `omp config`, OpenCode gets
 * a TUI plugin registered in `tui.json`. **Cursor** is the one target left with
 * no status surface at all, so a run targeting only Cursor still has nothing to
 * install.
 *
 * The note is printed only for an **explicit** `--statusline`: under `--all` on
 * a machine with none of them, the bar was never separately asked for, and
 * saying so every time would be noise.
 */
export function statuslineSelected(
  wanted: boolean,
  explicit: boolean,
  adapters: readonly Adapter[],
  log: (message: string) => void,
): StatuslineSelection {
  if (!wanted) {
    return { claude: false, ohmypi: false, opencode: false };
  }
  const selection = {
    claude: adapters.some(a => a.id === "claude"),
    ohmypi: adapters.some(a => a.id === "ohmypi"),
    opencode: adapters.some(a => a.id === "opencode"),
  };
  const reached = selection.claude || selection.ohmypi || selection.opencode;
  if (explicit && !reached) {
    log(
      "statusline: skipped — Cursor is the only selected target with no "
        + "status surface to install into",
    );
  }
  return selection;
}

export async function run(args: Args): Promise<void> {
  const startedAt = Date.now();
  // Collected rather than written as they happen: a note printed mid-run
  // lands above the results, so you read caveats about an install before
  // knowing whether it worked. `renderProgress` places them after the table.
  const notes: string[] = [];
  const context: AdapterContext = {
    sourceRoot: packageRoot(),
    home: homedir(),
    cwd: process.cwd(),
    now: new Date().toISOString(),
    log: message => notes.push(message),
    exec: execCommand,
  };
  const progress = createProgress(process.stderr);
  const report = (outcomes: readonly TargetOutcome[]): void => {
    // Always erase the live step first: it shares stderr with the report,
    // and a half-written line would run into the header.
    progress.clear();
    process.stderr.write(
      `${
        renderProgress({
          outcomes,
          notes,
          version: readCliVersion(context.sourceRoot),
          elapsedMs: Date.now() - startedAt,
        })
      }\n`,
    );
  };

  const options = {
    context,
    dryRun: args.dryRun,
    receiptDir: receiptDir(),
    force: args.force,
    progress,
  };

  if (args.version) {
    const report = await buildVersionReport(context.sourceRoot);
    // Data to stdout; the reason the remote half is missing is not data.
    process.stdout.write(`${renderVersionReport(report)}\n`);
    // Non-zero without the network, as the documented contract has it: a
    // report that could not compare against anything answered half the
    // question, and a script checking for updates should notice.
    process.exit(report.remoteError === undefined ? 0 : 1);
  }

  const adapters = selectAdapters(args.platform, context);
  if (adapters.length === 0) {
    // Never hang waiting for input that is not coming.
    process.stderr.write(
      "no supported agent found on PATH; name one with --platform\n",
    );
    process.exit(1);
  }

  const statusline = statuslineSelected(
    wantsStatusline(args.statusline, args.all),
    args.statusline === true,
    adapters,
    context.log,
  );

  if (args.uninstall) {
    const outcomes = revert(adapters, options);
    // An uninstall undoes what this tool installed, so the gate is the
    // **receipt**, not `--all`. The tri-state still governs — an explicit
    // `--no-statusline` refuses — but an unset flag cannot mean "leave the
    // bar configured": on the way in it defers to `--all`, and there is no
    // `--all` on the way out, so a plain `--uninstall` silently left every
    // statusline surface installed. Gating on the receipt
    // this way; this is the same question asked at the other end.
    //
    // Still restricted to the selected targets: uninstalling Claude alone
    // must not strip the Oh-My-Pi bar.
    const reaches = (id: TargetId) => adapters.some(a => a.id === id);
    const refused = args.statusline === false;
    const undo: [boolean, boolean, () => boolean, () => TargetOutcome][] = [
      [
        reaches("claude"),
        statusline.claude,
        () => statuslineInstalled(options),
        () => revertStatuslineInstall(options),
      ],
      [
        reaches("ohmypi"),
        statusline.ohmypi,
        () => ohmypiStatuslineInstalled(options),
        () => revertStatuslineOhmypiInstall(options),
      ],
      [
        reaches("opencode"),
        statusline.opencode,
        () => opencodeStatuslineInstalled(options),
        () => revertStatuslineOpencodeInstall(options),
      ],
    ];
    for (const [reachable, selected, installed, run] of undo) {
      if (revertsStatusline(reachable, selected, refused, installed)) {
        outcomes.push(run());
      }
    }
    report(outcomes);
    process.exit(failed(outcomes) ? 1 : 0);
  }

  const request: PlanRequest = {
    all: args.all,
    user: args.user,
    project: args.project,
  };
  const named = request.all === true
    || (request.user?.length ?? 0) > 0
    || (request.project?.length ?? 0) > 0;

  // No install request at all. There is no separate install verb — naming
  // something *is* the request — so this covers both a bare invocation and
  // one carrying only modifiers, `--platform opencode` being the one that
  // reads like a request and is not: it says where to install, never what.
  //
  // The help comes with it because a run that installs nothing is a question
  // about the flags, and answering it with one line of correction assumes the
  // reader already knows the other nine.
  if (
    !named
    // `--statusline` on its own is a complete request: it is not a plugin.
    && !statusline.claude
    && !statusline.ohmypi
    && !statusline.opencode
  ) {
    process.stderr.write(`${renderUsage()}`);
    process.stderr.write(
      "\nnothing to install: pass --all, --statusline, or name plugins with --user/--project\n",
    );
    process.exit(1);
  }

  progress.step("resolving plugins");
  const jobs = buildJobs(adapters, request, context.sourceRoot, context.log);

  // Refuse before touching anything: a plugin whose tools are absent installs
  // cleanly and fails later, somewhere with no visible link to the install.
  //
  // Not overridable by `--force`, which means something narrower — act on a
  // target whose *own* CLI is missing. A plugin's runtime tools are a fact
  // about the plugin, not about the target, and there is no useful state on
  // the far side of installing vwf without graphify.
  const wanted = [
    ...new Set(jobs.flatMap(([, p]) => [...p.user, ...p.project])),
  ];
  const missing = missingTools(
    requiredTools(readPluginIndex(context.sourceRoot), wanted),
    hasBin,
  );
  if (missing.length > 0) {
    process.stderr.write(`${renderMissing(missing)}\n`);
    // A dry run reports it and carries on: it is showing what *would* happen,
    // and the rest of the diff is still worth seeing.
    if (!options.dryRun) {
      process.exit(1);
    }
  }

  // Consent before the installs, not between them: a run that is going to
  // refuse should refuse having written nothing, and the prompt has to reach
  // a terminal the progress spinner is not mid-line on.
  progress.clear();
  const consent = await resolveStatuslineConsent(
    context,
    statusline,
    args.statusline === true,
    options.dryRun,
  );
  if (consent === undefined) {
    process.stderr.write(
      "\nrefusing to replace a statusline that is not this installer's "
        + "without an answer.\nPass --statusline to replace it, or "
        + "--no-statusline to leave it alone.\n",
    );
    process.exit(1);
  }

  const outcomes = execute(jobs, options);
  if (statusline.claude) {
    outcomes.push(executeStatusline(options, consent.claude));
  }
  if (statusline.ohmypi && consent.ohmypi) {
    // The one surface with nothing to install when it is declined: it is
    // `omp config` keys and no files, so there is no half to leave behind.
    outcomes.push(executeStatuslineOhmypi(options));
  }
  if (statusline.opencode) {
    outcomes.push(executeStatuslineOpencode(options, consent.opencode));
  }

  // After the install, and only for targets that actually took it: vwf's
  // commands halt at their own entry gate without this.
  if (!options.dryRun && wanted.includes("vwf")) {
    // The slowest tail of a run, and previously the longest silence in it.
    progress.step("wiring graphify");
    setupGraphify(
      context,
      outcomes
        .filter(o => o.error === undefined && o.skipped === undefined)
        .map(o => o.target),
    );
  }

  if (options.dryRun) {
    // Data to stdout, so it can be piped or diffed.
    // The diff goes to stdout while the step sits on stderr; in a terminal
    // they share a screen, so an uncleared step runs into the first line.
    progress.clear();
    process.stdout.write(`${renderDiff(outcomes)}\n`);
  }
  report(outcomes);
  process.exit(failed(outcomes) ? 1 : 0);
}

/**
 * The package root — what holds the rendered trees, the marketplace manifests
 * and `tools/`.
 *
 * Found by walking up rather than by counting `..` segments, because this code
 * runs from two depths: `cli/src/index.ts` in the repo and `bin/ai-plugins.mjs`
 * once tsup has bundled it. A fixed offset would be right in one and silently
 * wrong in the other, resolving `sourceRoot` to a directory that exists but
 * holds none of the trees an adapter reads.
 *
 * Matched on the package *name*, so the workspace's own `cli/package.json` is
 * walked past rather than mistaken for the root.
 */
function packageRoot(): string {
  // Escape hatch, and the same name the old installer used for it. Needed
  // whenever the payload is not somewhere above this module — a checkout being
  // driven from elsewhere, as the tests do.
  const override = process.env["AI_PLUGINS_SOURCE_DIR"];
  if (override !== undefined && override.length > 0) {
    return override;
  }
  const start = import.meta.dirname;
  const found = walkUpForPackage(start);
  if (found !== undefined) {
    return found;
  }
  throw new Error(
    `could not locate the ${PACKAGE_NAME} package root from ${start}`,
  );
}

function walkUpForPackage(start: string): string | undefined {
  let dir = start;
  for (let depth = 0; depth < 6; depth++) {
    const manifest = join(dir, "package.json");
    if (existsSync(manifest)) {
      try {
        const parsed = JSON.parse(readFileSync(manifest, "utf8")) as {
          name?: string;
        };
        if (parsed.name === PACKAGE_NAME) {
          return dir;
        }
      }
      catch {
        // An unreadable package.json on the way up is somebody else's problem.
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
  return undefined;
}

/**
 * Where receipts live. Stable across runs by construction: an uninstall that
 * cannot find the receipt has nothing to restore from.
 */
function receiptDir(): string {
  return join(configBase(), "ai-plugins", "receipts");
}

/**
 * The config root, matching `dataDir`'s treatment of the data root.
 *
 * `XDG_CONFIG_HOME` wins, then the platform default. Windows gets `APPDATA`
 * rather than a literal `~/.config`, which is a POSIX convention that means
 * nothing there. Fixed alongside the data directory rather than separately:
 * one of the two following the OS and the other not is the kind of split that
 * only shows up as a bug report from the one platform nobody tests on.
 */
function configBase(): string {
  const xdg = process.env["XDG_CONFIG_HOME"];
  if (xdg !== undefined && xdg.length > 0) {
    return xdg;
  }
  if (process.platform === "win32") {
    const appData = process.env["APPDATA"];
    if (appData !== undefined && appData.length > 0) {
      return appData;
    }
    return join(homedir(), "AppData", "Roaming");
  }
  return join(homedir(), ".config");
}

/**
 * Only run when invoked directly, so importing this module — as the tests do,
 * for the pure helpers above — does not execute the CLI. `realpathSync` is what
 * makes it survive the symlink npm creates for a `bin` entry.
 *
 * A compiled binary takes the `catch`: its `argv[1]` is a path inside Bun's
 * virtual filesystem, so `realpathSync` throws ENOENT rather than returning
 * something to compare. Nothing else can produce an `argv[1]` that does not
 * exist — a bad script path never gets this far — so treating it as the
 * entrypoint is the only reading available.
 */
function isEntrypoint(): boolean {
  const invoked = process.argv[1];
  if (invoked === undefined) {
    return false;
  }
  try {
    return realpathSync(invoked) === fileURLToPath(import.meta.url);
  }
  catch {
    return true;
  }
}

/**
 * Parse, dispatch, and turn a failure into a sentence.
 *
 * citty owned this: it caught, printed and exited. Doing it here is what keeps
 * a bad flag from surfacing as a Node stack trace — `parseArgs` throws a real
 * `Error` for an unknown option, and the message already names the flag, so it
 * only needs the usage beside it.
 */
export async function main(argv: readonly string[]): Promise<void> {
  let args: Args;
  try {
    args = parse(argv);
  }
  catch (error) {
    process.stderr.write(`${renderUsage()}\n${(error as Error).message}\n`);
    process.exit(1);
  }
  if (args.help) {
    // Asked for, so it is the answer rather than a correction: stdout, exit 0.
    process.stdout.write(`${renderUsage()}`);
    process.exit(0);
  }
  await run(args);
}

if (isEntrypoint()) {
  void main(process.argv.slice(2));
}
