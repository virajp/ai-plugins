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
 * Two citty details it has to work around, both confirmed against its docs:
 *
 * - citty documents no `multiple:` argument kind. A repeated `--user a --user b`
 *   arrives as an array, a single one as a string — so every list flag is
 *   normalised through `toList`.
 * - The tri-state `--statusline` needs a boolean with **no default**, so
 *   "absent" stays `undefined` and can defer to `--all`. Giving it
 *   `default: false` would make an unset flag indistinguishable from
 *   `--no-statusline`.
 */
import type { TargetId } from "@ai-plugins/schema";
import {
  defineCommand,
  runMain,
} from "citty";
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
} from "./adapters/support.ts";
import type {
  Adapter,
  AdapterContext,
  AdapterPlan,
} from "./adapters/types.ts";
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
  upgradeJobs,
} from "./executor.ts";
import { setupGraphify } from "./graphify.ts";
import type { PlanRequest } from "./plan.ts";
import {
  readPluginIndex,
  resolvePlan,
} from "./plan.ts";
import {
  buildVersionReport,
  cmpVer,
  fetchJson,
  NPM_LATEST_URL,
  readCliVersion,
  renderVersionReport,
} from "./version.ts";

/** The published package, used to locate its root from either build layout. */
const PACKAGE_NAME = "@askviraj/ai-plugins";

export const ADAPTERS: readonly Adapter[] = [
  claude,
  cursor,
  ohmypi,
  opencode,
];

/**
 * Repeated flags arrive as an array, single ones as a string, absent ones as
 * `undefined`. One shape out, so callers never branch on citty's.
 */
export function toList(value: unknown): string[] {
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return (Array.isArray(value) ? value : [value]).map(String).filter(v =>
    v.length > 0
  );
}

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
  return adapters.map(adapter => {
    const plan = resolvePlan(index, adapter.id as TargetId, request, {
      expandDependencies: adapter.id !== "claude",
      localOnly: adapter.id === "opencode",
      log,
    });
    return [adapter, plan] as const;
  });
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

const main = defineCommand({
  meta: {
    name: "ai-plugins",
    description: "Install the virajp-plugins toolkit across AI coding agents",
  },
  args: {
    all: {
      type: "boolean",
      description: "Install every user-scoped plugin (excludes opt-in ones)",
      default: false,
    },
    user: {
      type: "string",
      description: "Install a plugin at user scope (repeatable)",
    },
    project: {
      type: "string",
      description: "Install a plugin at project scope (repeatable)",
    },
    platform: {
      type: "string",
      description:
        "Target an agent: claude, cursor, ohmypi, opencode (repeatable). Defaults to every one installed",
    },
    statusline: {
      type: "boolean",
      description: "Install the statusline",
      negativeDescription: "Skip the statusline",
    },
    uninstall: {
      type: "boolean",
      description: "Undo a previous install, from its receipt",
      default: false,
    },
    "dry-run": {
      type: "boolean",
      description: "Show the full diff without writing anything",
      default: false,
    },
    force: {
      type: "boolean",
      description: "Act on a target whose tool is not on PATH",
      default: false,
    },
    version: {
      type: "boolean",
      alias: "v",
      description:
        "Report this CLI's version and every plugin's, vs the latest",
      default: false,
    },
    upgrade: {
      type: "boolean",
      description: "Re-install whatever each target's receipt recorded",
      default: false,
    },
  },
  async run({ args }) {
    const context: AdapterContext = {
      sourceRoot: packageRoot(),
      home: homedir(),
      cwd: process.cwd(),
      now: new Date().toISOString(),
      // stderr: progress is not data.
      log: message => process.stderr.write(`${message}\n`),
      exec: execCommand,
    };

    const options = {
      context,
      dryRun: args["dry-run"] === true,
      receiptDir: receiptDir(),
      force: args.force === true,
    };

    if (args.version === true) {
      const report = await buildVersionReport(context.sourceRoot);
      // Data to stdout; the reason the remote half is missing is not data.
      process.stdout.write(`${renderVersionReport(report)}\n`);
      // Non-zero without the network, as the documented contract has it: a
      // report that could not compare against anything answered half the
      // question, and a script checking for updates should notice.
      process.exit(report.remoteError === undefined ? 0 : 1);
    }

    const adapters = selectAdapters(toList(args.platform), context);
    if (adapters.length === 0) {
      // Never hang waiting for input that is not coming.
      process.stderr.write(
        "no supported agent found on PATH; name one with --platform\n",
      );
      process.exit(1);
    }

    const statusline = statuslineSelected(
      wantsStatusline(
        args.statusline as boolean | undefined,
        args.all === true,
      ),
      args.statusline === true,
      adapters,
      context.log,
    );

    if (args.uninstall === true) {
      const outcomes = revert(adapters, options);
      if (statusline.claude) {
        outcomes.push(revertStatuslineInstall(options));
      }
      if (statusline.ohmypi) {
        outcomes.push(revertStatuslineOhmypiInstall(options));
      }
      if (statusline.opencode) {
        outcomes.push(revertStatuslineOpencodeInstall(options));
      }
      process.stderr.write(`${renderProgress(outcomes)}\n`);
      process.exit(failed(outcomes) ? 1 : 0);
    }

    const request: PlanRequest = {
      all: args.all === true,
      user: toList(args.user),
      project: toList(args.project),
    };
    const named = request.all === true
      || (request.user?.length ?? 0) > 0
      || (request.project?.length ?? 0) > 0;

    // `--upgrade` alone replays the receipts. Combined with an install request
    // it adds nothing to the plugins — installing already reads the current
    // render — so the install phase runs instead, and only the newer-CLI note
    // below is kept.
    if (args.upgrade === true && !named) {
      const { jobs, unrecorded } = upgradeJobs(adapters, options);
      for (const target of unrecorded) {
        context.log(
          `${target}: installed before this CLI recorded plans; `
            + "re-run the install once to make it upgradable",
        );
      }
      const outcomes = execute(jobs, options);
      if (statuslineInstalled(options)) {
        outcomes.push(executeStatusline(options));
      }
      if (ohmypiStatuslineInstalled(options)) {
        outcomes.push(executeStatuslineOhmypi(options));
      }
      if (opencodeStatuslineInstalled(options)) {
        outcomes.push(executeStatuslineOpencode(options));
      }
      if (outcomes.length === 0) {
        context.log("nothing installed by this CLI yet — nothing to upgrade");
      }
      else {
        if (options.dryRun) {
          process.stdout.write(`${renderDiff(outcomes)}\n`);
        }
        process.stderr.write(`${renderProgress(outcomes)}\n`);
      }
      await noteNewerCli(context);
      process.exit(failed(outcomes) ? 1 : 0);
    }

    if (
      !named
      // `--statusline` on its own is a complete request: it is not a plugin.
      && !statusline.claude
      && !statusline.ohmypi
      && !statusline.opencode
    ) {
      process.stderr.write(
        "nothing to install: pass --all, --statusline, or name plugins with --user/--project\n",
      );
      process.exit(1);
    }

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

    const outcomes = execute(jobs, options);
    if (statusline.claude) {
      outcomes.push(executeStatusline(options));
    }
    if (statusline.ohmypi) {
      outcomes.push(executeStatuslineOhmypi(options));
    }
    if (statusline.opencode) {
      outcomes.push(executeStatuslineOpencode(options));
    }

    // After the install, and only for targets that actually took it: vwf's
    // commands halt at their own entry gate without this.
    if (!options.dryRun && wanted.includes("vwf")) {
      setupGraphify(
        context,
        outcomes
          .filter(o => o.error === undefined && o.skipped === undefined)
          .map(o => o.target),
      );
    }

    if (options.dryRun) {
      // Data to stdout, so it can be piped or diffed.
      process.stdout.write(`${renderDiff(outcomes)}\n`);
    }
    process.stderr.write(`${renderProgress(outcomes)}\n`);
    if (args.upgrade === true) {
      await noteNewerCli(context);
    }
    process.exit(failed(outcomes) ? 1 : 0);
  },
});

/**
 * Mention a newer published CLI, if there is one.
 *
 * Best-effort and never fatal: the upgrade itself is local, so a machine that
 * cannot reach npm has still done everything it was asked to. `--version` is
 * where a failed check is worth an exit code.
 */
async function noteNewerCli(context: AdapterContext): Promise<void> {
  try {
    const current = readCliVersion(context.sourceRoot);
    const latest = await fetchJson<{ version: string; }>(NPM_LATEST_URL);
    if (cmpVer(latest.version, current) > 0) {
      context.log(
        `\nA newer CLI is available: ${current} → ${latest.version}\n`
          + "Re-run with: npx @askviraj/ai-plugins@latest --upgrade",
      );
    }
  }
  catch {
    // No network is not an upgrade failure.
  }
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
  const base = process.env["XDG_CONFIG_HOME"] ?? join(homedir(), ".config");
  return join(base, "ai-plugins", "receipts");
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

if (isEntrypoint()) {
  runMain(main);
}
