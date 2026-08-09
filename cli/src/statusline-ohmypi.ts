/**
 * The Oh-My-Pi statusline.
 *
 * Like its Claude sibling this is **not a plugin, and therefore not an
 * adapter** — it installs no bundle and is wired straight from the router. What
 * differs is everything below that: Oh-My-Pi has no scriptable status surface
 * to point at, so there is no script to copy and no `settings.json` to merge.
 * It ships a segment renderer of its own, configured through `omp config set`,
 * which writes a global `config.yml` this tool never opens.
 *
 * **Information parity, not visual parity.** The powerline styling is
 * deliberately dropped: Oh-My-Pi draws its own separators and palette, and
 * reproducing ours would mean fighting a renderer we do not own. What is
 * mirrored is the *content* of the Claude bar — `tools/statusline/statusline`'s
 * `SEGMENTS` registry and the `lines` layout in `statusline.json`:
 *
 * | Ours                  | Oh-My-Pi                        | Note                                   |
 * | --------------------- | ------------------------------- | -------------------------------------- |
 * | `model` (+ `effort`)  | `model`                         | `showThinkingLevel` carries the effort |
 * | `project`, `worktree` | `path`                          | abbreviated, work prefix stripped      |
 * | `branch`              | `git`                           | built in there; we shell out to git    |
 * | `context`             | `context_pct` + `context_total` | one segment there is two here          |
 * | `cost`                | `cost`                          |                                        |
 * | `duration`            | `time_spent`                    | active agent time, not wall clock      |
 * | `session`             | `session_name`                  |                                        |
 * | `rl5h` + `rl7d`       | `usage`                         | **not parity** — see below             |
 *
 * `usage` is the closest available and is **not** an equivalent: Oh-My-Pi
 * exposes no Anthropic 5-hour / 7-day window percentages, and what `usage`
 * reports is provider-dependent. That is a known gap, recorded here rather than
 * papered over.
 *
 * **`context-caps` is Claude-only and stays that way.** It reads a usage file
 * the Claude bar writes, and there is no equivalent sensor here.
 *
 * Two things about `omp config` are load-bearing, both verified by running it
 * against a throwaway `PI_CODING_AGENT_DIR`:
 *
 * - **`omp config get <key>` prints exactly the form `set` takes back** — a
 *   bare token for an enum, compact JSON for an array or record. That is what
 *   makes an undo a value-level restore rather than a re-derivation.
 * - **`omp config reset <key>` does not remove the key**; it writes the default
 *   back as explicit YAML. So on a machine with no `config.yml` at all, undoing
 *   key by key would leave a file behind that was not there before. The one
 *   entry that files a path rather than a command exists for that case, and
 *   only that case.
 *
 * That second point is the one place the receipt invariant bends, and it is
 * worth stating plainly: **byte-identity on uninstall holds when `config.yml`
 * did not exist** (the common case — the file is created lazily on first
 * `set`), and when it did exist but already carried the key. A key that was
 * *absent from an existing file* comes back as its explicit default, because
 * Oh-My-Pi offers no way to delete a key. That is semantically identical and
 * not byte-identical, and it is the price of restoring key by key rather than
 * rewriting the file: a user who retuned their theme between install and
 * uninstall keeps that change.
 *
 * **Segment names are not validated.** `omp config set` accepts
 * `["bogus_segment"]` and reports success; the typo surfaces as a segment that
 * silently never draws. Nothing here can catch that, so the names above are
 * transcribed rather than constructed.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  Action,
  AdapterContext,
  ApplyResult,
} from "./adapters/types.ts";
import type { Receipt } from "./receipt.ts";
import {
  ReceiptBuilder,
  revert as revertReceipt,
} from "./receipt.ts";

const BIN = "omp";

/**
 * The four keys this sets, in the order they are written.
 *
 * `preset: custom` is what makes the other three take effect — the named
 * presets ignore the segment lists entirely.
 */
const KEYS: readonly (readonly [string, unknown])[] = [
  ["statusLine.preset", "custom"],
  ["statusLine.leftSegments", ["model", "path", "git"]],
  ["statusLine.rightSegments", [
    "context_pct",
    "context_total",
    "usage",
    "cost",
    "time_spent",
    "session_name",
  ]],
  ["statusLine.segmentOptions", {
    model: { showThinkingLevel: true },
    path: { abbreviate: true, maxLength: 40, stripWorkPrefix: true },
    git: {
      showBranch: true,
      showStaged: true,
      showUnstaged: true,
      showUntracked: true,
    },
  }],
];

/** What `install` would do, without doing it. Drives `--dry-run`. */
export function planStatuslineOhmypi(
  context: AdapterContext,
): readonly Action[] {
  return run(context, true).actions;
}

/** Configure the Oh-My-Pi status line to mirror the Claude bar's content. */
export function installStatuslineOhmypi(context: AdapterContext): ApplyResult {
  return run(context, false);
}

/** Undo an install from its receipt, through `omp` itself. */
export function revertStatuslineOhmypi(
  context: AdapterContext,
  receipt: Receipt,
): void {
  revertReceipt(receipt, {
    restoreKey() {
      // Oh-My-Pi's config is written by its own CLI, never key-by-key here.
    },
    runUndo(undo) {
      runOrThrow(context, undo);
    },
  });
}

/**
 * One code path for planning and applying, so `--dry-run` cannot describe
 * something other than what happens.
 */
function run(context: AdapterContext, dryRun: boolean): ApplyResult {
  const receipt = new ReceiptBuilder();
  const actions: Action[] = [];

  const config = configFile(context);
  // Recorded first, so revert replays it last — after every `omp config set`
  // undo has rewritten the file, deleting it is what leaves a machine that
  // never had one as we found it. Recorded only when it is genuinely absent:
  // a `config.yml` that already exists holds the user's own settings.
  if (!dryRun && !existsSync(config)) {
    receipt.createdFile(config);
  }

  for (const [key, value] of KEYS) {
    const desired = serialize(value);
    const previous = read(context, key);
    // Re-setting an identical value is a no-op whose undo would put back
    // whatever we happened to read — i.e. clobber a choice the user made
    // themselves, on an uninstall that changed nothing.
    if (previous === desired) {
      continue;
    }
    const set = ["config", "set", key, desired];
    actions.push({ summary: `${BIN} ${set.join(" ")}` });
    if (!dryRun) {
      runOrThrow(context, set);
      receipt.command(set, ["config", "set", key, previous]);
    }
  }

  return { receipt: receipt.build(context.now), actions };
}

/** The form `omp config set` takes: bare for a string, compact JSON otherwise. */
function serialize(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

/**
 * The current value of one key, as `set` would take it back.
 *
 * A failure here is fatal rather than defaulted: `omp config get` errors only
 * on a key it does not know, which means this mapping no longer matches the
 * installed Oh-My-Pi — and guessing past that would write a status line made of
 * keys that do nothing.
 */
function read(context: AdapterContext, key: string): string {
  return runOrThrow(context, ["config", "get", key]).trim();
}

/**
 * Where `omp` keeps `config.yml`.
 *
 * Asked for rather than assumed: `PI_CODING_AGENT_DIR` redirects it wholesale,
 * and it is otherwise `$HOME/.omp/agent` — a layout that is Oh-My-Pi's to
 * change.
 */
function configFile(context: AdapterContext): string {
  return join(runOrThrow(context, ["config", "path"]).trim(), "config.yml");
}

/**
 * `omp` resolves its config from `HOME`, so passing the injected one is what
 * keeps a test — and any install driven with a redirected home — off the
 * developer's own `~/.omp`.
 */
function runOrThrow(context: AdapterContext, args: readonly string[]): string {
  const result = context.exec(BIN, args, {
    env: { ...process.env, HOME: context.home },
  });
  if (result.status !== 0) {
    throw new Error(
      `\`${BIN} ${args.join(" ")}\` failed (${result.status}): `
        + `${result.stderr.trim() || result.stdout.trim()}`,
    );
  }
  return result.stdout;
}
