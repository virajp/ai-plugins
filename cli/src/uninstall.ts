/**
 * `--uninstall`: enumerate what this toolkit put on the machine, let the user
 * deselect, then remove each piece through whatever owns it.
 *
 * **This replaced a receipt-driven, all-or-nothing flag**, and the reason is
 * that its premise stopped being true. It reverted one receipt per target, which
 * worked while every install went through this CLI; plugins are now installed by
 * `claude plugin install` from a GitHub-served marketplace, so the receipt knows
 * nothing about them and an uninstall that only reads receipts would report
 * success having left every plugin enabled.
 *
 * Four rules, and the last two are the ones easy to get wrong:
 *
 * - **Enumeration is a pure read.** `enumerate` answers "what can I see from
 *   here" against Claude's own settings and the filesystem, and returns data
 *   with no closures in it. Removal is a separate switch. That split is what
 *   makes the list testable against a fixture directory rather than only by
 *   performing it.
 * - **Everything starts selected**, so the interaction is deselection: the user
 *   asked to uninstall, and making them re-name each piece would turn a cleanup
 *   into a quiz. Numbers entered are what **stays**.
 * - **Removal goes through the owner.** A plugin leaves by
 *   `claude plugin uninstall`, never by editing `enabledPlugins` — Claude keeps
 *   bookkeeping beside that key and hand-editing it strands the two apart. The
 *   statusline leaves by **restoring its receipt**, so the bar the user had
 *   before comes back; a bare delete would leave them with no statusline at all
 *   and no way to tell what they had.
 * - **No TTY fails rather than guesses**, the same rule the statusline consent
 *   follows — but only once there is something to remove. A run that finds
 *   nothing has nothing to ask about, so it says so and exits 0 whether or not
 *   anyone is watching.
 *
 * ## The legacy-receipt reader
 *
 * Every receipt in the receipt directory **other than the statusline's** is the
 * record of an install by a multi-target version of this CLI: a copied OpenCode
 * plugin tree, the OpenCode TUI bar, the Oh-My-Pi `omp config` keys, a Cursor
 * `settings.json` entry, the copied Claude marketplace payload. Those surfaces
 * are discontinued, and this is the one piece of multi-target code deliberately
 * kept: without it a machine carrying them is orphaned rather than cleaned,
 * because nothing else on earth knows those paths.
 *
 * **Drop it once no supported version can have written one** — concretely, two
 * releases after the Claude-first major, or as soon as the maintainer's own
 * machine and any reported install have been through one `--uninstall`. What to
 * delete then: `LEGACY_RECEIPTS`, `legacyItems`, the `receipt` removal kind, and
 * the `tree` / `command` entry kinds in `receipt.ts` that exist only for these.
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
} from "node:fs";
import {
  basename,
  dirname,
  join,
} from "node:path";
import { createInterface } from "node:readline/promises";
import {
  getPath,
  readJsonc,
} from "./config/json.ts";
import type {
  Context,
  RunOptions,
} from "./context.ts";
import {
  claudeConfigDir,
  hasBin,
  MARKETPLACE_NAME,
} from "./context.ts";
import type { Receipt } from "./receipt.ts";
import {
  readReceipt,
  revert as revertReceipt,
} from "./receipt.ts";
import type { Outcome } from "./report.ts";
import {
  restoreJsonKey,
  revertStatuslineInstall,
  statuslineReceiptPath,
} from "./statusline.ts";

/** Which half of the machine a piece belongs to, and how the list is grouped. */
export type Level = "user" | "repo" | "legacy";

export const LEVEL_HEADING: Readonly<Record<Level, string>> = {
  user: "User",
  repo: "This repo",
  legacy: "Older multi-target installs",
};

/**
 * How one piece is removed.
 *
 * Data rather than a closure, so `enumerate` stays a pure read and a test can
 * assert *what* would be run without running it.
 */
export type Removal =
  /** Drive Claude's own CLI, which owns the bookkeeping beside what it edits. */
  | {
    readonly kind: "claude";
    readonly args: readonly string[];
    /** Project scope is resolved from the working directory Claude is given. */
    readonly cwd?: string;
  }
  /** Restore the statusline receipt, putting the user's own bar back. */
  | { readonly kind: "statusline"; }
  /**
   * Replay a receipt an older multi-target install left behind.
   *
   * `bin` is the CLI whose `command` entries the receipt holds — implied by
   * which receipt it is, since an adapter recorded `["plugin", "install", …]`
   * without the program in front of it.
   */
  | {
    readonly kind: "receipt";
    readonly path: string;
    readonly bin?: string;
  }
  /** graphify's own undo for the git hooks it installed. */
  | { readonly kind: "graphify-hook"; readonly cwd: string; }
  /** A path nothing else owns. */
  | {
    readonly kind: "delete";
    readonly path: string;
    readonly recursive: boolean;
  };

export interface Item {
  /** Stable across runs, so a test can name a row without counting. */
  readonly id: string;
  readonly level: Level;
  /** One line, shown in the list. */
  readonly label: string;
  /** What removing it means, when that is not obvious from the label. */
  readonly note?: string;
  readonly removal: Removal;
}

/**
 * The receipts a multi-target install could have left, and the CLI that has to
 * unmake each one.
 *
 * `claude.json` is the odd one: its `command` entries claim the marketplace
 * registration and the plugin installs, which the **user-level enumeration
 * above already covers** by reading Claude's settings directly. Replaying them
 * too would run `claude plugin uninstall` twice for one plugin and report the
 * second, failing, call as a broken uninstall. So it is replayed for its files
 * alone — the copied marketplace payload under `~/.local/share/virajp/`, which
 * nothing else can see.
 */
const LEGACY_RECEIPTS: Readonly<
  Record<
    string,
    {
      readonly label: string;
      readonly bin?: string;
      readonly filesOnly?: boolean;
    }
  >
> = {
  "claude.json": {
    label: "the copied Claude marketplace payload",
    filesOnly: true,
  },
  "cursor.json": { label: "Cursor plugin registration" },
  "ohmypi.json": { label: "Oh-My-Pi plugins and marketplace", bin: "omp" },
  "opencode.json": { label: "the copied OpenCode plugin tree" },
  "statusline-ohmypi.json": {
    label: "the Oh-My-Pi statusline",
    bin: "omp",
  },
  "statusline-opencode.json": { label: "the OpenCode statusline" },
};

/**
 * Everything this toolkit can be seen to have installed, from where the run is.
 *
 * A pure read: nothing here writes, spawns anything destructive, or decides. The
 * only subprocess is `git`, to answer whether there is a repo and where its root
 * is — which is the one question the filesystem cannot answer from `cwd` alone.
 */
export function enumerate(options: RunOptions): Item[] {
  return [
    ...userItems(options.context, options.receiptDir),
    ...repoItems(options.context),
    ...legacyItems(options.receiptDir),
  ];
}

function userItems(context: Context, receiptDir: string): Item[] {
  const items: Item[] = [];
  const settings = readSettings(userSettingsFile(context));

  if (
    getPath(settings, ["extraKnownMarketplaces", MARKETPLACE_NAME])
      !== undefined
  ) {
    items.push({
      id: "marketplace",
      level: "user",
      label: `the \`${MARKETPLACE_NAME}\` marketplace registration`,
      note: "plugins installed from it stop updating",
      removal: {
        kind: "claude",
        args: [
          "plugin",
          "marketplace",
          "remove",
          MARKETPLACE_NAME,
          // Without a scope this removes the declaration from *every* scope.
          "--scope",
          "user",
        ],
      },
    });
  }

  for (const name of installedPlugins(settings)) {
    items.push({
      id: `plugin:user:${name}`,
      level: "user",
      label: `plugin \`${name}\` (user scope)`,
      removal: {
        kind: "claude",
        args: ["plugin", "uninstall", name, "--scope", "user"],
      },
    });
  }

  const bar = statuslineItem(receiptDir);
  if (bar !== undefined) {
    items.push(bar);
  }
  return items;
}

function repoItems(context: Context): Item[] {
  const root = repoRoot(context);
  if (root === undefined) {
    return [];
  }
  const items: Item[] = [];

  // Project scope follows the **working directory**, not the repo root: that is
  // where `claude plugin install --scope project` wrote, so it is where the
  // enumeration has to look and where the uninstall has to run.
  for (
    const name of installedPlugins(readSettings(projectSettingsFile(context)))
  ) {
    items.push({
      id: `plugin:project:${name}`,
      level: "repo",
      label: `plugin \`${name}\` (project scope)`,
      removal: {
        kind: "claude",
        args: ["plugin", "uninstall", name, "--scope", "project"],
        cwd: context.cwd,
      },
    });
  }

  if (graphifyHookInstalled(context)) {
    items.push({
      id: "graphify-hook",
      level: "repo",
      label: "graphify's git hooks",
      removal: { kind: "graphify-hook", cwd: root },
    });
  }

  const graph = join(root, "graphify-out");
  if (existsSync(graph)) {
    items.push({
      id: "graph",
      level: "repo",
      label: `the graph (${graph})`,
      note: "regenerable — `graphify update .` rebuilds it",
      removal: { kind: "delete", path: graph, recursive: true },
    });
  }

  const ignore = join(root, ".graphifyignore");
  if (existsSync(ignore)) {
    items.push({
      id: "graphifyignore",
      level: "repo",
      label: `${ignore}`,
      // Written by `/vwf:setup`, not by this CLI, so there is no receipt to
      // restore from and removal is a plain delete. Listed anyway: it is part of
      // the toolkit's footprint, and the selection is the consent.
      note: "written by /vwf:setup; may hold your own edits",
      removal: { kind: "delete", path: ignore, recursive: false },
    });
  }
  return items;
}

/**
 * One item per surviving receipt that is not the statusline's.
 *
 * Described from the receipt's own `plugins` list where it has one — that field
 * was written by every adapter and read by nothing for two versions, and this is
 * what finally reads it.
 */
function legacyItems(receiptDir: string): Item[] {
  let names: string[];
  try {
    names = readdirSync(receiptDir).filter(n => n.endsWith(".json")).sort();
  }
  catch {
    return [];
  }

  const items: Item[] = [];
  for (const name of names) {
    if (name === "statusline.json") {
      continue;
    }
    const path = join(receiptDir, name);
    const receipt = readReceipt(path);
    if (receipt === undefined) {
      continue;
    }
    const known = LEGACY_RECEIPTS[name];
    items.push({
      id: `legacy:${name}`,
      level: "legacy",
      label: known?.label ?? `an install recorded in ${name}`,
      ...(describePlugins(receipt) === undefined
        ? { note: path }
        : { note: `${describePlugins(receipt) as string} — ${path}` }),
      removal: {
        kind: "receipt",
        path,
        ...(known?.bin === undefined ? {} : { bin: known.bin }),
      },
    });
  }
  return items;
}

function describePlugins(receipt: Receipt): string | undefined {
  const names = [...new Set((receipt.plugins ?? []).map(p => p.name))];
  return names.length === 0 ? undefined : names.join(", ");
}

// ---------------------------------------------------------------------------
// Choosing
// ---------------------------------------------------------------------------

export type Selection =
  | { readonly kind: "cancel"; }
  | { readonly kind: "keep"; readonly keep: ReadonlySet<number>; }
  /** Something in the answer was not a valid row number. */
  | { readonly kind: "invalid"; readonly tokens: readonly string[]; };

/**
 * Read an answer as a set of rows to **keep**.
 *
 * An unparseable or out-of-range token is `invalid` rather than ignored, and the
 * caller refuses the run on it. Dropping a token the user meant as "keep this"
 * would delete the one thing they were protecting, which is the worst available
 * failure for a destructive command; asking again costs a second of their time.
 */
export function parseSelection(answer: string, count: number): Selection {
  const text = answer.trim();
  if (text.length === 0) {
    return { kind: "keep", keep: new Set() };
  }
  if (/^(q|quit|cancel)$/i.test(text)) {
    return { kind: "cancel" };
  }

  const keep = new Set<number>();
  const bad: string[] = [];
  for (const token of text.split(/[\s,]+/).filter(t => t.length > 0)) {
    const n = /^\d+$/.test(token) ? Number.parseInt(token, 10) : Number.NaN;
    if (Number.isNaN(n) || n < 1 || n > count) {
      bad.push(token);
      continue;
    }
    keep.add(n);
  }
  return bad.length > 0
    ? { kind: "invalid", tokens: bad }
    : { kind: "keep", keep };
}

/** The list, grouped by level and numbered from one across the whole list. */
export function renderItems(items: readonly Item[]): string {
  const lines: string[] = [];
  let level: Level | undefined;
  items.forEach((item, index) => {
    if (item.level !== level) {
      level = item.level;
      lines.push(`  ${LEVEL_HEADING[level]}`);
    }
    const number = String(index + 1).padStart(2);
    lines.push(
      `  ${number}  [x] ${item.label}`,
      ...(item.note === undefined ? [] : [`          ${item.note}`]),
    );
  });
  return lines.join("\n");
}

export const PROMPT = "\nEverything above is selected. Enter the numbers to "
  + "KEEP, Enter to remove\nall of it, or q to cancel: ";

/** Ask, on stderr — stdout is the data channel the dry-run diff goes to. */
export async function askSelection(count: number): Promise<Selection> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    return parseSelection(await rl.question(PROMPT), count);
  }
  finally {
    rl.close();
  }
}

// ---------------------------------------------------------------------------
// Removing
// ---------------------------------------------------------------------------

/**
 * Remove each selected item, one outcome per item.
 *
 * **A failure does not abort the rest.** The pieces are independent — a plugin
 * that will not uninstall says nothing about the statusline — and stopping
 * halfway would leave a partly-cleaned machine with no record of which half.
 */
export function removeItems(
  items: readonly Item[],
  options: RunOptions,
): Outcome[] {
  const outcomes = items.map(item => {
    options.progress?.step(`removing ${item.label}`);
    return removeItem(item, options);
  });

  // No receipt can record the directory holding itself, so after the last one
  // is consumed they were left behind, empty. Only while empty, so a run that
  // kept a receipt keeps the directory it needs — and the parent only when it is
  // our own `ai-plugins/`, since walking up blindly would target whatever holds
  // the receipt dir (`/tmp`, under a test).
  if (!options.dryRun) {
    removeIfEmpty(options.receiptDir);
    const parent = dirname(options.receiptDir);
    if (basename(parent) === "ai-plugins") {
      removeIfEmpty(parent);
    }
  }
  return outcomes;
}

export function removeItem(item: Item, options: RunOptions): Outcome {
  const { context, dryRun } = options;

  switch (item.removal.kind) {
    case "statusline":
      return revertStatuslineInstall(options);

    case "claude":
      return runTool(
        item,
        options,
        "claude",
        item.removal.args,
        // The install wrote wherever `CLAUDE_CONFIG_DIR` pointed, so the undo
        // has to be handed the same one rather than Claude's default.
        {
          cwd: item.removal.cwd ?? context.cwd,
          env: {
            ...process.env,
            CLAUDE_CONFIG_DIR: claudeConfigDir(context.home),
          },
        },
      );

    case "graphify-hook":
      return runTool(item, options, "graphify", ["hook", "uninstall"], {
        cwd: item.removal.cwd,
      });

    case "delete": {
      const { path, recursive } = item.removal;
      const action = { summary: `remove ${path}`, path };
      if (dryRun) {
        return { name: item.id, actions: [action] };
      }
      try {
        rmSync(path, { recursive, force: true });
        return { name: item.id, actions: [action] };
      }
      catch (error) {
        return {
          name: item.id,
          actions: [],
          error: (error as Error).message,
        };
      }
    }

    case "receipt":
      return revertLegacyReceipt(item, options);
  }
}

/**
 * Drive another tool's CLI, or skip when it is not there.
 *
 * **Absent is a skip, not a failure**, and the reasoning is the same one the old
 * per-target loop used: a machine without `omp` cannot be asked to unmake an
 * `omp` install, and there is nothing this tool could do instead — hand-editing
 * the config would leave that tool's own records claiming an install that is
 * gone. Reporting it as failed would make an otherwise clean uninstall exit
 * non-zero over state nobody can reach.
 */
function runTool(
  item: Item,
  options: RunOptions,
  bin: string,
  args: readonly string[],
  execOptions: { readonly cwd?: string; readonly env?: NodeJS.ProcessEnv; },
): Outcome {
  const action = { summary: `${bin} ${args.join(" ")}` };
  if (!hasBin(bin)) {
    return { name: item.id, actions: [], skipped: "not-installed" };
  }
  if (options.dryRun) {
    return { name: item.id, actions: [action] };
  }
  const result = options.context.exec(bin, args, execOptions);
  if (result.status !== 0) {
    return {
      name: item.id,
      actions: [],
      error: `\`${bin} ${args.join(" ")}\` failed (${result.status}): `
        + `${result.stderr.trim() || result.stdout.trim()}`,
    };
  }
  return { name: item.id, actions: [action] };
}

/**
 * Replay one legacy receipt and consume it.
 *
 * The restore hook is the statusline's, because every config a retired adapter
 * touched is JSON or JSONC — `opencode.jsonc`, Cursor's `settings.json`,
 * OpenCode's `tui.json`. The one that is not is Oh-My-Pi's `config.yml`, and
 * that adapter recorded `command` entries precisely because this CLI ships no
 * YAML parser; those go to `runUndo`.
 */
function revertLegacyReceipt(item: Item, options: RunOptions): Outcome {
  if (item.removal.kind !== "receipt") {
    throw new Error(`not a receipt removal: ${item.id}`);
  }
  const { path, bin } = item.removal;
  const receipt = readReceipt(path);
  if (receipt === undefined) {
    return { name: item.id, actions: [], skipped: "empty" };
  }
  if (bin !== undefined && !hasBin(bin)) {
    return { name: item.id, actions: [], skipped: "not-installed" };
  }

  const filesOnly = LEGACY_RECEIPTS[basename(path)]?.filesOnly === true;
  const action = { summary: `revert ${item.label}`, path };
  if (options.dryRun) {
    return { name: item.id, actions: [action] };
  }

  try {
    revertReceipt(
      filesOnly
        // `command` entries dropped, not skipped at replay time: the user-level
        // enumeration owns the marketplace registration and the plugin
        // installs, and running both would uninstall a plugin twice.
        ? {
          ...receipt,
          entries: receipt.entries.filter(e => e.kind !== "command"),
        }
        : receipt,
      {
        restoreKey: restoreJsonKey,
        ...(bin === undefined ? {} : {
          runUndo: (undo: readonly string[]) => {
            options.context.exec(bin, undo);
          },
        }),
      },
    );
    // Consumed. A receipt describes an install that exists; leaving it behind
    // after undoing one makes every later run believe in it and offer it again.
    rmSync(path, { force: true });
    return { name: item.id, actions: [action] };
  }
  catch (error) {
    // Kept on failure, deliberately: a half-reverted install still has state to
    // undo, and throwing the record away would strand it.
    return { name: item.id, actions: [], error: (error as Error).message };
  }
}

/** Remove a directory only when nothing is left in it. Never throws. */
function removeIfEmpty(path: string): void {
  try {
    if (readdirSync(path).length === 0) {
      rmdirSync(path);
    }
  }
  catch {
    // Absent, not a directory, or not ours to remove: nothing to clean up.
  }
}

// ---------------------------------------------------------------------------
// Reading the machine
// ---------------------------------------------------------------------------

function userSettingsFile(context: Context): string {
  return join(claudeConfigDir(context.home), "settings.json");
}

function projectSettingsFile(context: Context): string {
  return join(context.cwd, ".claude", "settings.json");
}

function readSettings(path: string): Record<string, unknown> | undefined {
  if (!existsSync(path)) {
    return undefined;
  }
  return readJsonc<Record<string, unknown>>(readFileSync(path, "utf8"));
}

/**
 * The plugins enabled from our marketplace, by bare name.
 *
 * Claude keys these `<name>@<marketplace>`, and only entries carrying our
 * marketplace are ours to offer — a plugin the user installed from somewhere
 * else has nothing to do with this toolkit.
 */
export function installedPlugins(
  settings: Record<string, unknown> | undefined,
): string[] {
  const enabled = getPath(settings, ["enabledPlugins"]);
  if (typeof enabled !== "object" || enabled === null) {
    return [];
  }
  const suffix = `@${MARKETPLACE_NAME}`;
  return Object
    .keys(enabled as Record<string, unknown>)
    .filter(key => key.endsWith(suffix))
    .map(key => key.slice(0, -suffix.length))
    .sort();
}

/** The repo this run is inside, or `undefined` when it is not inside one. */
export function repoRoot(context: Context): string | undefined {
  const result = context.exec("git", ["rev-parse", "--show-toplevel"], {
    cwd: context.cwd,
  });
  const root = result.stdout.trim();
  return result.status === 0 && root.length > 0 ? root : undefined;
}

/**
 * Has graphify installed its hooks here?
 *
 * Answered by reading the hook files rather than by running
 * `graphify hook status`, for two reasons: it works when graphify is no longer
 * on PATH — which is exactly the machine that most needs cleaning — and the
 * enumeration stays a read.
 *
 * `--git-path` rather than `<root>/.git/hooks`, because in a **worktree** the
 * hooks live in the main checkout's git directory and a hardcoded path would
 * find nothing there.
 */
export function graphifyHookInstalled(context: Context): boolean {
  const result = context.exec("git", ["rev-parse", "--git-path", "hooks"], {
    cwd: context.cwd,
  });
  if (result.status !== 0) {
    return false;
  }
  const hooks = result.stdout.trim();
  const dir = hooks.startsWith("/") ? hooks : join(context.cwd, hooks);
  return ["post-commit", "post-checkout"].some(name => {
    const path = join(dir, name);
    try {
      return readFileSync(path, "utf8").includes("graphify");
    }
    catch {
      return false;
    }
  });
}

/** The statusline item, when there is a receipt to restore it from. */
export function statuslineItem(receiptDir: string): Item | undefined {
  if (!existsSync(statuslineReceiptPath(receiptDir))) {
    return undefined;
  }
  return {
    id: "statusline",
    level: "user",
    label: "the Claude statusline",
    note: "restores whatever statusline you had before it",
    removal: { kind: "statusline" },
  };
}
