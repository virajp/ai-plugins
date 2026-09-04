#!/usr/bin/env node
/**
 * The CLI entrypoint.
 *
 * This file is the *source*; `bin/` holds what tsup builds from it, and `bin/`
 * is what npm publishes. The hashbang above is not decoration — tsup copies it
 * through and marks the output executable, which is what lets `package.json`'s
 * `bin` entry point straight at the bundle.
 *
 * **The CLI has three jobs**: plugins, graphify's wiring, and an interactive
 * `--uninstall`. Plugins are installed by **driving Claude Code's own commands**
 * against this repo on GitHub —
 * `claude plugin marketplace add virajp/claude-plugins` then `claude plugin
 * install` per plugin (`install.ts`) — so the four plugin adapters, the payload
 * copy, `--platform` and the `requires:` dependency gate stay gone, along with
 * `plan.ts` and `executor.ts`. What is left is short enough that `run` below
 * *is* the orchestration.
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
import type { InstallRequest } from "./install.ts";
import {
  executeInstall,
  planInstall,
  pluginsRequested,
  resolveRequest,
} from "./install.ts";
import { createProgress } from "./progress.ts";
import type { Outcome } from "./report.ts";
import {
  failed,
  renderDiff,
  renderProgress,
} from "./report.ts";
import {
  askSelection,
  enumerate,
  interactive,
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

  const request: InstallRequest = {
    all: args.all,
    user: args.user,
    project: args.project,
  };
  const wantsPlugins = pluginsRequested(request);

  if (!wantsPlugins) {
    // No request at all. There is no install verb — asking for something *is*
    // the request — so this covers a bare invocation and one carrying only
    // modifiers, `--dry-run` being the one that reads like a request and is not.
    //
    // The help comes with it because a run that does nothing is a question about
    // the flags, and answering it with one line of correction assumes the reader
    // already knows the others.
    process.stderr.write(`${renderUsage()}`);
    process.stderr.write(
      "\nnothing to do: pass --all, --user or --project to install plugins, "
        + "or --uninstall\n",
    );
    process.exit(1);
  }

  // Plugin installs *are* `claude` invocations, so there is nothing to fall back
  // to when it is absent: the run would fail either way, and refusing here fails
  // it before anything is written. That is why `--force` is retired — every
  // remaining install *is* a `claude` invocation, so there is nothing to force.
  if (!hasBin("claude")) {
    process.stderr.write(
      "claude is not on PATH, and plugin installs run claude itself.\n"
        + "Install Claude Code first.\n",
    );
    process.exit(1);
  }

  // Before anything runs: a mistyped plugin name fails the run having written
  // nothing, as one sentence rather than three failed commands.
  try {
    resolveRequest(request);
  }
  catch (error) {
    process.stderr.write(`${(error as Error).message}\n`);
    process.exit(1);
  }

  const outcomes: Outcome[] = [
    ...executeInstall(planInstall(request, options), options),
  ];

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
 * The package root — what holds this package's own `package.json`, which the
 * version report reads.
 *
 * Found by walking up rather than by counting `..` segments, because this code
 * runs from two depths: `installer/src/index.ts` in the repo and `bin/installer.mjs`
 * once tsup has bundled it. A fixed offset would be right in one and silently
 * wrong in the other, resolving `sourceRoot` to a directory that exists but
 * holds no manifest.
 *
 * Matched on the package *name*, so the workspace's own `installer/package.json` is
 * walked past rather than mistaken for the root.
 */
function packageRoot(): string {
  // Escape hatch, renamed with the package. Needed whenever the manifest is not
  // somewhere above this module — a checkout being driven from elsewhere, as
  // the tests do.
  const override = process.env["CLAUDE_PLUGINS_SOURCE_DIR"];
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
