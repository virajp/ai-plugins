#!/usr/bin/env node
/**
 * The CLI entrypoint.
 *
 * This file is the *source*; `bin/` holds what tsup builds from it, and `bin/`
 * is what npm publishes. The hashbang above is not decoration — tsup copies it
 * through and marks the output executable, which is what lets `package.json`'s
 * `bin` entry point straight at the bundle.
 *
 * **The CLI has three jobs**, down from "install the toolkit across four agents":
 * the Claude statusline, graphify's wiring, and an interactive `--uninstall`.
 * Plugins are installed by Claude Code itself from this repo on GitHub —
 * `claude plugin marketplace add virajp/ai-plugins` — so the four plugin
 * adapters, `--platform`, `--all` and the `requires:` dependency gate are all
 * gone, along with `plan.ts` and `executor.ts`. What is left is short enough that
 * `run` below *is* the orchestration: there is no plan to resolve, and one thing
 * to install.
 *
 * Argument parsing lives in `args.ts`, on `node:util`'s `parseArgs`.
 */
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
import type { Args } from "./args.ts";
import {
  parse,
  renderUsage,
} from "./args.ts";
import type {
  Context,
  RunOptions,
} from "./context.ts";
import {
  execCommand,
  hasBin,
  PACKAGE_NAME,
} from "./context.ts";
import { setupGraphify } from "./graphify.ts";
import { createProgress } from "./progress.ts";
import type { Outcome } from "./report.ts";
import {
  failed,
  renderDiff,
  renderProgress,
} from "./report.ts";
import {
  ask,
  autoConfigureAllowed,
  interactive,
  resolveConsent,
  setAutoConfigure,
} from "./statusline-consent.ts";
import {
  claudeStatuslineConflict,
  executeStatusline,
} from "./statusline.ts";
import {
  askSelection,
  enumerate,
  removeItems,
  renderItems,
  resolveSelection,
} from "./uninstall.ts";
import {
  buildVersionReport,
  readCliVersion,
  renderVersionReport,
} from "./version.ts";

export { PACKAGE_NAME } from "./context.ts";

/**
 * May the bar be **configured** — may Claude be pointed at it?
 *
 * `undefined` is the refusal: consent was needed and could not be got, so the
 * caller stops the run. It was a per-surface record when there were three bars;
 * with one, it is one answer.
 *
 * `--statusline` is the only way to ask for an install now, so `explicit` is
 * always true here and this grants every time — see `statusline-consent.ts` for
 * why the asking branches are kept rather than deleted. The reachable half is
 * the **clear**: a machine carrying `autoConfigure: false` from a version where
 * `--all` could install the bar has that refusal lifted here.
 *
 * A dry run never asks and never writes. It reports what an answered run would
 * do at its most complete.
 */
export async function resolveStatuslineConsent(
  context: Context,
  explicit: boolean,
  dryRun: boolean,
): Promise<boolean | undefined> {
  if (dryRun) {
    return true;
  }
  if (explicit) {
    setAutoConfigure(context, true);
  }

  const verdict = resolveConsent({
    conflict: claudeStatuslineConflict(context),
    explicit,
    remembered: !autoConfigureAllowed(context),
    interactive: interactive(),
  });
  if (verdict === "fail") {
    return undefined;
  }
  if (verdict === "configure") {
    return true;
  }
  if (
    verdict === "skip" || !await ask(claudeStatuslineConflict(context) ?? "")
  ) {
    setAutoConfigure(context, false);
    context.log(
      "statusline: kept your statusline; re-run with --statusline to replace it",
    );
    return false;
  }
  return true;
}

export async function run(args: Args): Promise<void> {
  const startedAt = Date.now();
  // Collected rather than written as they happen: a note printed mid-run lands
  // above the results, so you read caveats about an install before knowing
  // whether it worked. `renderProgress` places them after the table.
  const notes: string[] = [];
  const context: Context = {
    sourceRoot: packageRoot(),
    home: homedir(),
    cwd: process.cwd(),
    now: new Date().toISOString(),
    log: message => notes.push(message),
    exec: execCommand,
  };
  const progress = createProgress(process.stderr);
  const report = (outcomes: readonly Outcome[]): void => {
    // Always erase the live step first: it shares stderr with the report, and a
    // half-written line would run into the header.
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

  const options: RunOptions = {
    context,
    dryRun: args.dryRun,
    receiptDir: receiptDir(),
    progress,
  };

  if (args.version) {
    const report = await buildVersionReport({
      sourceRoot: context.sourceRoot,
      home: context.home,
    });
    // Data to stdout; the reason the remote half is missing is not data.
    process.stdout.write(`${renderVersionReport(report)}\n`);
    // Non-zero without the network, as the documented contract has it: a report
    // that could not compare against anything answered half the question, and a
    // script checking for updates should notice.
    process.exit(report.remoteError === undefined ? 0 : 1);
  }

  if (args.uninstall) {
    await uninstall(options, report);
    return;
  }

  if (args.statusline !== true) {
    // No request at all. There is no install verb — asking for something *is*
    // the request — so this covers a bare invocation and one carrying only
    // modifiers, `--dry-run` being the one that reads like a request and is not.
    //
    // The help comes with it because a run that does nothing is a question about
    // the flags, and answering it with one line of correction assumes the reader
    // already knows the others.
    process.stderr.write(`${renderUsage()}`);
    process.stderr.write(
      "\nnothing to do: pass --statusline to install the bar, or --uninstall\n",
    );
    process.exit(1);
  }

  // Writing into `~/.claude/settings.json` for a tool that is not on the machine
  // leaves config behind for something that will never read it. A skip rather
  // than a silent install, and `--force` is the override — for a machine where
  // Claude is installed somewhere off `PATH`.
  if (!hasBin("claude") && !args.force) {
    process.stderr.write(
      "claude is not on PATH, so there is nothing to configure the statusline "
        + "for.\nInstall Claude Code, or pass --force if it is installed "
        + "somewhere off PATH.\n",
    );
    process.exit(1);
  }

  // Consent before the install, not after: a run that is going to refuse should
  // refuse having written nothing, and the prompt has to reach a terminal the
  // progress spinner is not mid-line on.
  progress.clear();
  const consent = await resolveStatuslineConsent(
    context,
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

  const outcomes = [executeStatusline(options, consent)];

  // After the install: vwf's commands halt at their own entry gate without it.
  if (!options.dryRun) {
    // The slowest tail of a run, and previously the longest silence in it.
    progress.step("wiring graphify");
    setupGraphify(context);
  }

  if (options.dryRun) {
    // Data to stdout, so it can be piped or diffed. The diff goes to stdout
    // while the step sits on stderr; in a terminal they share a screen, so an
    // uncleared step runs into the first line.
    progress.clear();
    process.stdout.write(`${renderDiff(outcomes)}\n`);
  }
  report(outcomes);
  process.exit(failed(outcomes) ? 1 : 0);
}

/**
 * The `--uninstall` interaction: enumerate, show, ask, remove.
 *
 * The order of the two guards matters. **Nothing found** is answered before
 * **no TTY**, because a run with nothing to remove has nothing to guess about —
 * failing it for want of a terminal would make `--uninstall` unusable in a
 * script that is checking whether anything is left.
 */
async function uninstall(
  options: RunOptions,
  // The same reporter the install run uses, so an uninstall report carries the
  // version that produced it and is worth pasting into an issue.
  report: (outcomes: readonly Outcome[]) => void,
): Promise<void> {
  const { progress } = options;
  progress?.step("looking for what is installed");
  const items = enumerate(options);
  progress?.clear();

  if (items.length === 0) {
    process.stderr.write(
      "found nothing of the virajp-plugins toolkit installed from here.\n"
        + "Plugins enabled from another marketplace, and anything a different "
        + "tool\ninstalled, are deliberately not touched.\n",
    );
    process.exit(0);
  }

  process.stderr.write(
    `\nFound ${items.length} piece${items.length === 1 ? "" : "s"} of the `
      + `virajp-plugins toolkit:\n\n${renderItems(items)}\n`,
  );

  if (options.dryRun) {
    // Every removal described, nothing asked and nothing written — which is what
    // makes `--uninstall --dry-run` the safe way to see this in a script.
    // The same defaults the interactive path would start from, so `--dry-run`
    // describes the run you would get by pressing Enter — not a wider one.
    const outcomes = removeItems(resolveSelection(items, new Set()), options);
    process.stdout.write(`${renderDiff(outcomes)}\n`);
    process.exit(0);
  }

  if (!interactive()) {
    process.stderr.write(
      "\nrefusing to remove any of it without an answer: there is no terminal "
        + "to ask on.\nRe-run in a terminal, or pass --dry-run to see the list "
        + "alone.\n",
    );
    process.exit(1);
  }

  const selection = await askSelection(items.length);
  if (selection.kind === "cancel") {
    process.stderr.write("cancelled — nothing removed.\n");
    process.exit(0);
  }
  if (selection.kind === "invalid") {
    process.stderr.write(
      `did not understand: ${selection.tokens.join(", ")}\n`
        + `Expected numbers between 1 and ${items.length}. Nothing removed.\n`,
    );
    process.exit(1);
  }

  const selected = resolveSelection(items, selection.toggle);
  if (selected.length === 0) {
    process.stderr.write("nothing selected — nothing removed.\n");
    process.exit(0);
  }

  const outcomes = removeItems(selected, options);
  report(outcomes);
  process.exit(failed(outcomes) ? 1 : 0);
}

/**
 * The package root — what holds `tools/` and this package's own `package.json`.
 *
 * Found by walking up rather than by counting `..` segments, because this code
 * runs from two depths: `cli/src/index.ts` in the repo and `bin/ai-plugins.mjs`
 * once tsup has bundled it. A fixed offset would be right in one and silently
 * wrong in the other, resolving `sourceRoot` to a directory that exists but
 * holds none of the assets the statusline copies from.
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
 * The config root.
 *
 * `XDG_CONFIG_HOME` wins, then the platform default. Windows gets `APPDATA`
 * rather than a literal `~/.config`, which is a POSIX convention that means
 * nothing there.
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
