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
 * - **Machine state starts selected; git-tracked files do not.** The user asked
 *   to uninstall, so making them re-name each piece would turn a cleanup into a
 *   quiz — but a row whose removal edits a file the current checkout *tracks*
 *   would dirty their working tree, which is not a cleanup. Those start off. See
 *   `Item.tracked`. The numbers **toggle**.
 * - **Removal goes through the owner.** A plugin leaves by
 *   `claude plugin uninstall`, never by editing `enabledPlugins` — Claude keeps
 *   bookkeeping beside that key and hand-editing it strands the two apart. A
 *   receipted install leaves by **being reverted**, so what the user had before
 *   comes back; a bare delete would leave them with nothing there at all and no
 *   way to tell what it had been.
 * - **No TTY fails rather than guesses** — but only once there is something to
 *   remove. A run that finds nothing has nothing to ask about, so it says so and
 *   exits 0 whether or not anyone is watching.
 *
 * ## The legacy-receipt reader
 *
 * **This CLI writes no receipts.** It installs plugins by driving Claude's own
 * commands and wires graphify by driving graphify's, and both tools keep their
 * own records — so every receipt in the receipt directory is the record of an
 * install by an *older* version: the statusline it used to ship, and the copied
 * Claude marketplace payload. Those mechanisms are discontinued, and this
 * reader is deliberately kept: without it a machine carrying them is orphaned
 * rather than cleaned, because nothing else on earth knows those paths.
 *
 * **Only Claude Code is supported**, so the retired targets — OpenCode, Cursor,
 * Oh-My-Pi — lost their named entries. A receipt of theirs still on disk is
 * still enumerated and still reverted, under a generic label: the map is a
 * label lookup, not an allowlist, and a machine carrying one is the machine
 * most in need of cleaning.
 *
 * `statusline.json` is the newest of them and the one most machines will have.
 * It records the statusline the user had *before* ours displaced it, so
 * reverting it is what puts their own bar back — the one behaviour the
 * statusline's removal had to not break.
 *
 * **Drop this once no supported version can have written one** — concretely,
 * two releases after the statusline major, or as soon as the maintainer's own
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
import writeFileAtomic from "write-file-atomic";
import {
  claudeEnv,
  installedPlugins,
  marketplaceRegistered,
  projectSettingsFile,
  readSettings,
  userSettingsFile,
} from "./claude-settings.ts";
import {
  getPath,
  removeFromJsonArray,
  restoreJsonKey,
  setJsonPath,
} from "./config/json.ts";
import type {
  Context,
  RunOptions,
} from "./context.ts";
import {
  hasBin,
  MARKETPLACE_NAME,
} from "./context.ts";
import type { Receipt } from "./receipt.ts";
import {
  readReceipt,
  revert as revertReceipt,
} from "./receipt.ts";
import type { Outcome } from "./report.ts";

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
  /**
   * Replay a receipt an older version left behind.
   *
   * There is no `bin` any more. It named the CLI whose `command` entries a
   * receipt held — `omp`, for the two Oh-My-Pi receipts — and both went with
   * the discontinued targets. Every receipt still read is Claude Code's, and
   * neither replays a `command` entry: `claude.json` is `filesOnly`, and the
   * statusline's holds only files and config keys.
   */
  | {
    readonly kind: "receipt";
    readonly path: string;
  }
  /** graphify's own undo for the git hooks it installed. */
  | { readonly kind: "graphify-hook"; readonly cwd: string; }
  /** A path nothing else owns. */
  | {
    readonly kind: "delete";
    readonly path: string;
    readonly recursive: boolean;
  }
  /**
   * Unwire the statusline from `settings.json`.
   *
   * One removal rather than four rows, because the four edits are one thing:
   * a run that dropped `statusLine` but left the caps hook, or vice versa,
   * would leave a half-wired bar that is harder to reason about than either
   * end state. The **values are captured at enumeration time**, already
   * fingerprinted — see `statuslineSettingsItem` for why that matters.
   */
  | {
    readonly kind: "settings-edits";
    readonly file: string;
    /** Key paths to delete outright. */
    readonly keys: readonly (readonly (string | number)[])[];
    /** Exact array elements to drop, by the hooks event holding them. */
    readonly hookEntries: readonly {
      readonly path: readonly (string | number)[];
      readonly entry: unknown;
    }[];
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
  /**
   * Removing this edits a file **git tracks in the current checkout**, so it
   * starts *unselected* and has to be asked for by number.
   *
   * Everything else here is one machine's state, where all-selected is the right
   * default — the user asked to uninstall, and making them re-name each piece
   * would turn a cleanup into a quiz. Tracked files are categorically different:
   * `.graphifyignore` is committed, and the project-scope plugin rows are read
   * out of a committed `.claude/settings.json`, so accepting the defaults inside a
   * repo would silently dirty someone's working tree. That is not a cleanup, it is
   * an uncommitted change they did not ask for and may not notice.
   *
   * Found by a real-install verification run, which is also the only way it
   * could have been: the enumeration is correct, the removals are correct, and
   * only the *default* was wrong.
   */
  readonly tracked?: true;
}

/**
 * The receipts this reader can **name**, which is not the same as the ones it
 * will act on.
 *
 * This is a label lookup, **not an allowlist**. `legacyItems` enumerates every
 * readable `*.json` in the receipt directory; a name absent from this map still
 * gets a row, reverted the same way, under the generic
 * `an install recorded in <name>`. That is deliberate — a receipt records files
 * that may still be on disk, and refusing to read one because its target was
 * discontinued would strand exactly the machine most in need of cleaning.
 *
 * So the five entries for the retired targets — `cursor.json`, `ohmypi.json`,
 * `opencode.json`, `statusline-ohmypi.json`, `statusline-opencode.json` — were
 * dropped for their **labels and their `omp` plumbing**, not to stop them being
 * processed. Only Claude Code is supported now, and a row naming a tool this
 * project no longer ships for was describing a surface, not doing work.
 *
 * What went with them: the `bin` field, the `hasBin` skip, and the `runUndo`
 * hook. Both remaining receipts are Claude Code's and neither replays a
 * `command` entry.
 *
 * `claude.json` is the odd one: its `command` entries claim the marketplace
 * registration and the plugin installs, which the **user-level enumeration
 * above already covers** by reading Claude's settings directly. Replaying them
 * too would run `claude plugin uninstall` twice for one plugin and report the
 * second, failing, call as a broken uninstall. So it is `filesOnly` — replayed
 * for the copied marketplace payload under `~/.local/share/virajp/`, which
 * nothing else can see, and which a machine may still be resolving its
 * marketplace from.
 */
const LEGACY_RECEIPTS: Readonly<
  Record<
    string,
    {
      readonly label: string;
      readonly filesOnly?: boolean;
    }
  >
> = {
  "claude.json": {
    label: "the copied Claude marketplace payload",
    filesOnly: true,
  },
  // The newest of them, and the one most machines will carry: it records the
  // statusline the user had before this toolkit's displaced it, so reverting it
  // is what puts their own bar back. The scripts and the `settings.json` keys
  // are cleaned by `statuslineItems` whether or not this receipt exists; what
  // only the receipt can do is *restore*.
  "statusline.json": { label: "the Claude statusline" },
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

  if (marketplaceRegistered(settings)) {
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

  items.push(...statuslineItems(context, receiptDir));

  return items;
}

// ---------------------------------------------------------------------------
// The statusline's leftovers
// ---------------------------------------------------------------------------

/**
 * What the retired statusline left behind that **no receipt covers**.
 *
 * The statusline shipped until 6.0.0 and wrote four things. Its receipt records
 * the two script files and — on the machines checked — *nothing else*: the
 * `settings.json` keys were never captured, so reverting the receipt deletes
 * the scripts and leaves Claude pointing `statusLine` at a path that no longer
 * exists, trying to run it every few seconds. That is the gap this fills.
 *
 * **Configuration is deliberately left alone**, at both tiers, and it is not an
 * oversight. `~/.config/statusline.json` is the user's own palette after it is
 * seeded once — the install recorded nothing precisely so an uninstall could
 * not throw it away — and a repo's `.config/statusline.json` is the same kind
 * of thing scoped narrower: settings somebody chose, not an artifact this tool
 * placed. `~/.claude/usage/` is likewise accumulated history. All of it is
 * inert once nothing reads it, and all of it is a plausible input to whatever
 * the user configures next; deleting a file we did not write, to reclaim
 * nothing, is the wrong side of that trade.
 *
 * **What is cleaned is only ever what this toolkit wrote**: the two scripts,
 * and the `settings.json` keys pointing at them.
 */
function statuslineItems(context: Context, receiptDir: string): Item[] {
  const items: Item[] = [];
  const settingsItem = statuslineSettingsItem(context, receiptDir);
  if (settingsItem !== undefined) {
    items.push(settingsItem);
  }
  items.push(...orphanedStatuslineFiles(context, receiptDir));
  return items;
}

/** `~/.claude/scripts/statusline`, and the caps hook beside it. */
const STATUSLINE_SCRIPT = join(".claude", "scripts", "statusline");
const CAPS_HOOK = join(".claude", "hooks", "context-caps.js");

/**
 * The script and the caps hook, **only when no receipt claims them**.
 *
 * A machine whose `statusline.json` receipt is still present has these covered
 * by the legacy row, and listing them twice would read as two separate pieces
 * of debris when there is one. A machine that has already reverted that receipt
 * — or never had one — still has the files, and nothing else would ever find
 * them.
 */
function orphanedStatuslineFiles(
  context: Context,
  receiptDir: string,
): Item[] {
  if (readReceipt(join(receiptDir, "statusline.json")) !== undefined) {
    return [];
  }
  const items: Item[] = [];
  for (
    const [id, relative, label] of [
      ["statusline-script", STATUSLINE_SCRIPT, "the retired statusline script"],
      ["statusline-caps-hook", CAPS_HOOK, "the retired context-caps hook"],
    ] as const
  ) {
    const path = join(context.home, relative);
    if (!existsSync(path)) {
      continue;
    }
    items.push({
      id,
      level: "user",
      label: `${label} (${path})`,
      note: "left by a version before 6.0.0; the bar now ships separately",
      removal: { kind: "delete", path, recursive: false },
    });
  }
  return items;
}

/**
 * The `settings.json` keys the statusline wired, **fingerprinted before they
 * are offered**.
 *
 * Every key here is checked against the value *this* toolkit wrote before it is
 * listed. That is the whole safety property: the bar moved to
 * `@askviraj/claude-status`, which may reasonably claim the same
 * `statusLine` key, and a blind delete would silently unwire the tool the user
 * migrated to. A key holding someone else's value is not ours to remove, so it
 * is not offered at all.
 */
function statuslineSettingsItem(
  context: Context,
  receiptDir: string,
): Item | undefined {
  const file = userSettingsFile(context);
  const settings = readSettings(file);
  if (settings === undefined) {
    return undefined;
  }

  // A key the statusline receipt records belongs to the **receipt**, which
  // restores what was there before rather than deleting. Offering it here too
  // would be a second row for one key, and — read in isolation, which is how a
  // deselected list gets read — the wrong one: a delete where a restore was
  // available. Every key the receipt is silent about is ours to clean.
  const receipted = receiptedKeys(receiptDir, file);

  const keys: (readonly (string | number)[])[] = [];
  for (const key of ["statusLine", "subagentStatusLine"]) {
    if (!receipted.has(key) && isOurBar(getPath(settings, [key]))) {
      keys.push([key]);
    }
  }
  // Namespaced to this toolkit, so the name alone is the fingerprint.
  if (getPath(settings, ["env", USAGE_ENV_KEY]) !== undefined) {
    keys.push(["env", USAGE_ENV_KEY]);
  }

  const hookEntries = capsHookEntries(settings);
  if (keys.length === 0 && hookEntries.length === 0) {
    return undefined;
  }

  return {
    id: "statusline-settings",
    level: "user",
    label: "the retired statusline's settings.json wiring",
    note: `${describeWiring(keys, hookEntries)} — ${file}`,
    removal: { kind: "settings-edits", file, keys, hookEntries },
  };
}

const USAGE_ENV_KEY = "AI_PLUGINS_USAGE_DIR";

/**
 * The top-level settings keys the statusline receipt will restore itself.
 *
 * Only single-segment paths matter here: those are the two bar keys, the only
 * ones both surfaces could claim.
 */
function receiptedKeys(receiptDir: string, file: string): Set<string> {
  const claimed = new Set<string>();
  const receipt = readReceipt(join(receiptDir, "statusline.json"));
  for (const entry of receipt?.entries ?? []) {
    if (
      entry.kind === "configKey"
      && entry.file === file
      && entry.path.length === 1
      && typeof entry.path[0] === "string"
    ) {
      claimed.add(entry.path[0]);
    }
  }
  return claimed;
}

/** The two keys whose value has to be ours before it may be removed. */
function isBarKey(path: readonly (string | number)[]): boolean {
  return path.length === 1
    && (path[0] === "statusLine" || path[0] === "subagentStatusLine");
}

/** Is this `statusLine` value the bar this toolkit installed? */
function isOurBar(value: unknown): boolean {
  const command = (value as { command?: unknown; })?.command;
  return typeof command === "string" && command.includes(STATUSLINE_SCRIPT);
}

/**
 * The hook array elements whose command runs the caps hook.
 *
 * The exact element is captured, not its index: `removeFromJsonArray` matches
 * by deep equality, so an unrelated edit that reorders the array between
 * enumeration and removal cannot make this drop the wrong entry.
 */
function capsHookEntries(
  settings: Record<string, unknown>,
): { path: readonly (string | number)[]; entry: unknown; }[] {
  const found: { path: readonly (string | number)[]; entry: unknown; }[] = [];
  const hooks = getPath(settings, ["hooks"]);
  if (typeof hooks !== "object" || hooks === null) {
    return found;
  }
  for (const [event, value] of Object.entries(hooks)) {
    if (!Array.isArray(value)) {
      continue;
    }
    for (const entry of value) {
      const inner = (entry as { hooks?: unknown; })?.hooks;
      if (
        Array.isArray(inner)
        && inner.some(h =>
          typeof (h as { command?: unknown; })?.command === "string"
          && (h as { command: string; }).command.includes(CAPS_HOOK)
        )
      ) {
        found.push({ path: ["hooks", event], entry });
      }
    }
  }
  return found;
}

function describeWiring(
  keys: readonly (readonly (string | number)[])[],
  hookEntries: readonly unknown[],
): string {
  const named = keys.map(k => k[k.length - 1] as string);
  if (hookEntries.length > 0) {
    named.push("the context-caps hook");
  }
  return named.join(", ");
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
      // Read out of `<cwd>/.claude/settings.json`, which a repo usually commits.
      ...(tracks(context, projectSettingsFile(context))
        ? { tracked: true as const, note: "edits a git-tracked settings.json" }
        : {}),
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
      ...(tracks(context, ignore) ? { tracked: true as const } : {}),
    });
  }
  return items;
}

/**
 * One item per surviving receipt.
 *
 * Every receipt is a legacy one now — nothing this version installs writes one —
 * so there is no exclusion here. Described from the receipt's own `plugins` list
 * where it has one: that field was written by every adapter and read by nothing
 * for two versions, and this is what finally reads it.
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
      removal: { kind: "receipt", path },
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
  | { readonly kind: "toggle"; readonly toggle: ReadonlySet<number>; }
  /** Something in the answer was not a valid row number. */
  | { readonly kind: "invalid"; readonly tokens: readonly string[]; };

/**
 * Read an answer as the set of rows to **toggle**.
 *
 * An unparseable or out-of-range token is `invalid` rather than ignored, and the
 * caller refuses the run on it. Silently dropping a token would act on a list the
 * user did not see — in either direction now that rows have two possible defaults,
 * which is the worst available failure for a destructive command. Asking again
 * costs a second of their time.
 */
export function parseSelection(answer: string, count: number): Selection {
  const text = answer.trim();
  if (text.length === 0) {
    return { kind: "toggle", toggle: new Set() };
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
    : { kind: "toggle", toggle: keep };
}

/** Apply a toggle answer to the defaults, giving the rows to remove. */
export function resolveSelection(
  items: readonly Item[],
  toggle: ReadonlySet<number>,
): Item[] {
  return items.filter((item, index) =>
    toggle.has(index + 1) ? !defaultSelected(item) : defaultSelected(item)
  );
}

/** Is this row selected before the user says anything? */
export function defaultSelected(item: Item): boolean {
  return item.tracked !== true;
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
      `  ${number}  [${defaultSelected(item) ? "x" : " "}] ${item.label}`,
      ...(item.note === undefined ? [] : [`          ${item.note}`]),
    );
  });
  return lines.join("\n");
}

/**
 * The numbers **toggle**, rather than meaning "keep".
 *
 * It meant "keep" while every row started selected, which was simpler to explain.
 * Once tracked files start unselected there are two directions to move a row in,
 * and one prompt that toggles is honest about both — where "enter what to keep"
 * would leave a user no way to ask for the one row that is off.
 */
export const PROMPT =
  "\nEnter the numbers to TOGGLE, Enter to accept as shown, "
  + "or q to cancel: ";

/**
 * Is the terminal able to carry a question and an answer?
 *
 * The one guard `--uninstall` refuses on: a run with no terminal cannot be asked
 * which pieces to keep, and guessing is the worst available answer for a
 * destructive command. `--dry-run` is the scriptable path instead.
 */
export function interactive(): boolean {
  return process.stdin.isTTY === true && process.stderr.isTTY === true;
}

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
          env: claudeEnv(context),
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

    case "settings-edits":
      return editSettings(item, item.removal, options);

    case "receipt":
      return revertLegacyReceipt(item, options);
  }
}

/**
 * Drop the recorded keys and hook entries from one settings file.
 *
 * **Every edit is applied to one text, then written once.** Writing per edit
 * would leave a half-unwired `settings.json` behind if a later edit threw —
 * the exact state this item exists to prevent.
 */
function editSettings(
  item: Item,
  removal: Extract<Removal, { kind: "settings-edits"; }>,
  options: RunOptions,
): Outcome {
  const { file, keys, hookEntries } = removal;
  const action = {
    summary: `unwire the statusline from ${file}`,
    path: file,
  };
  if (options.dryRun) {
    return { name: item.id, actions: [action] };
  }
  if (!existsSync(file)) {
    return { name: item.id, actions: [] };
  }
  try {
    let text = readFileSync(file, "utf8");
    // Re-read and re-fingerprint rather than trusting the enumeration. A
    // `statusline.json` receipt reverted earlier in this same run may have just
    // put the user's OWN bar back under `statusLine`, and deleting that is the
    // one outcome this whole item exists to avoid. The enumeration is a
    // snapshot; the write is the moment that has to be right.
    const now = readSettings(file);
    for (const { path, entry } of hookEntries) {
      text = removeFromJsonArray(text, path, [entry]);
    }
    for (const path of keys) {
      if (isBarKey(path) && !isOurBar(getPath(now ?? {}, path))) {
        continue;
      }
      text = setJsonPath(text, path, undefined);
    }
    writeFileAtomic.sync(file, text);
    return { name: item.id, actions: [action] };
  }
  catch (error) {
    return { name: item.id, actions: [], error: (error as Error).message };
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
 * `restoreJsonKey` is the only hook passed, because every config a `configKey`
 * entry can name is JSON or JSONC. The one that never was is Oh-My-Pi's
 * `config.yml` — that adapter recorded `command` entries precisely because this
 * CLI ships no YAML parser, and with `omp` support gone there is no program to
 * run them against, so `revert` skips them.
 */
function revertLegacyReceipt(item: Item, options: RunOptions): Outcome {
  if (item.removal.kind !== "receipt") {
    throw new Error(`not a receipt removal: ${item.id}`);
  }
  const { path } = item.removal;
  const receipt = readReceipt(path);
  if (receipt === undefined) {
    return { name: item.id, actions: [], skipped: "empty" };
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
      // No `runUndo`: it existed for the retired targets' `command` entries,
      // and nothing still read replays one. A receipt that somehow holds one
      // is skipped by `revert` rather than run against a guessed program.
      { restoreKey: restoreJsonKey },
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

// The settings readers moved to `claude-settings.ts` when the install path
// returned; re-exported so the enumeration's callers keep one import site.
export { installedPlugins } from "./claude-settings.ts";

/**
 * Does git track this path in the checkout the run is inside?
 *
 * `--error-unmatch` is the cheap exact question — it exits non-zero for an
 * untracked or absent path and needs no diffing. Outside a repo, or when git is
 * missing, the answer is **false**: an unknown answer must not make a row default
 * to unselected, or a machine without git would quietly stop offering to clean
 * itself.
 */
function tracks(context: Context, path: string): boolean {
  return context
    .exec("git", ["ls-files", "--error-unmatch", path], {
      cwd: context.cwd,
    })
    .status === 0;
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
