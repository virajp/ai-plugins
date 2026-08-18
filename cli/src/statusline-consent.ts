/**
 * Consent before overwriting a statusline that is not ours.
 *
 * The bar is **installed** whenever it is asked for, but **configuring** it —
 * pointing the host tool at it — is gated, because that is the step that
 * displaces whatever the user already had.
 *
 * This reverses an earlier decision, and the reason it was safe to reverse is
 * worth stating. `statusline.ts` used to say: the old `bin/claude.mjs` prompted
 * before overwriting a `statusLine` it did not recognise *because it had no way
 * to put one back*, and the receipt made that prompt unnecessary. That is still
 * true of the **undo** — an uninstall restores the previous bar byte for byte —
 * but it was never true of the interval in between. Someone who ran `--all` for
 * the plugins got their status bar replaced silently and had to know that
 * `--uninstall` existed to get it back. Reversibility is not consent.
 *
 * Three rules hold it together:
 *
 * - **Ours is not foreign.** The test is what is on disk against what our own
 *   write would produce, never `existsSync` — the same ownership rule the
 *   receipt entries follow, and for the same reason: on the second run what is
 *   sitting there is the first run's own output. Without this every repeat run
 *   would prompt about the bar it installed itself.
 * - **`--statusline` is consent**, and the only thing that is. It used to share
 *   the job with `--all`, which asked for the whole toolkit — and the toolkit
 *   including a status bar is not the same as the user choosing to replace the
 *   one they have. `--all` is gone with the plugin installs, so **every install
 *   run is now explicit and this gate grants every time**. The asking branches
 *   are kept rather than deleted for one reachable reason and one latent one:
 *   clearing a refusal remembered by an older version is a live path, and the
 *   day anything other than the flag can trigger an install, deleting them would
 *   be the silent overwrite this file exists to prevent.
 * - **No TTY is a failure, not a default.** A run that cannot ask has no
 *   business guessing, in either direction — silently overwriting is the bug
 *   this exists to fix, and silently skipping would make an unattended install
 *   quietly incomplete.
 */
import {
  existsSync,
  readFileSync,
} from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createInterface } from "node:readline/promises";
import writeFileAtomic from "write-file-atomic";
import { readJsonc } from "./config/json.ts";
import type { Context } from "./context.ts";

/**
 * What to do about the bar.
 *
 * `skip` still installs the bar's files — it declines only to point Claude at
 * them, which is what leaves a declined machine one `--statusline` away from a
 * working bar rather than back at the start.
 */
export type Consent = "configure" | "skip" | "fail";

export interface ConsentQuestion {
  /**
   * What we would displace, described for the prompt — or `undefined` when
   * there is nothing there but our own work, which is the common case and the
   * one that must never ask.
   */
  readonly conflict: string | undefined;
  /** `--statusline` was passed. `--all` does not count. */
  readonly explicit: boolean;
  /** `autoConfigure: false` is remembered in `~/.config/statusline.json`. */
  readonly remembered: boolean;
  /** Both ends of the terminal are a TTY, so a prompt can be answered. */
  readonly interactive: boolean;
}

/**
 * The decision, with no I/O in it so every branch is testable.
 *
 * Order matters. `explicit` is checked before `remembered` because the flag is
 * how a remembered refusal is undone; checking memory first would make the
 * refusal permanent and the flag a lie.
 */
export function resolveConsent(
  question: ConsentQuestion,
): Consent | "ask" {
  if (question.conflict === undefined) {
    // Nothing of the user's is at stake. Asking here would be asking for
    // permission to touch our own file.
    return "configure";
  }
  if (question.explicit) {
    return "configure";
  }
  if (question.remembered) {
    return "skip";
  }
  return question.interactive ? "ask" : "fail";
}

/** Is the terminal able to carry a question and an answer? */
export function interactive(): boolean {
  return process.stdin.isTTY === true && process.stderr.isTTY === true;
}

/**
 * Ask, on stderr.
 *
 * stderr rather than stdout because stdout is this tool's data channel — the
 * dry-run diff and the version report go there, and a prompt in the middle of
 * a piped diff would corrupt it.
 */
export async function ask(conflict: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    const answer = await rl.question(
      "\nClaude Code already has a statusline configured:\n"
        + `  ${conflict}\n`
        + "Replace it? It is captured in the receipt, so --uninstall puts it "
        + "back. [y/N] ",
    );
    return /^y(es)?$/i.test(answer.trim());
  }
  finally {
    rl.close();
  }
}

/**
 * `~/.config/statusline.json` — the bar's own config, and where a refusal is
 * remembered.
 *
 * Not under the receipt directory, and not namespaced under `ai-plugins/`:
 * this is the file the statusline script itself reads at render time, so it
 * lives where that script looks. `$HOME` rather than `XDG_CONFIG_HOME`, for
 * the same reason — `tools/statusline/statusline` resolves it from `$HOME`.
 */
export function userConfigFile(context: Context): string {
  return `${context.home}/.config/statusline.json`;
}

/**
 * Has the user declined, and not since changed their mind?
 *
 * A malformed or missing file reads as *allowed* — the safe direction, since the
 * worst case is being asked again rather than silently never configuring
 * anything. The key is deliberately not per surface: it was one flag across the
 * three bars this CLI used to install, so declining once was declining, and a
 * machine still carrying it from then is cleared by the next `--statusline`.
 */
export function autoConfigureAllowed(context: Context): boolean {
  const config = readUserConfig(context);
  return config?.["autoConfigure"] !== false;
}

/** Persist a refusal, or clear one. Deep-merge is unnecessary: one key. */
export function setAutoConfigure(
  context: Context,
  allowed: boolean,
): void {
  const file = userConfigFile(context);
  const config = readUserConfig(context) ?? {};
  const next = { ...config };
  if (allowed) {
    // Removed rather than set to `true`: absent is the default, and leaving a
    // `true` behind would put a key in the user's config saying nothing.
    delete next["autoConfigure"];
  }
  else {
    next["autoConfigure"] = false;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileAtomic.sync(file, `${JSON.stringify(next, null, 2)}\n`);
}

function readUserConfig(
  context: Context,
): Record<string, unknown> | undefined {
  const file = userConfigFile(context);
  if (!existsSync(file)) {
    return undefined;
  }
  return readJsonc<Record<string, unknown>>(readFileSync(file, "utf8"));
}
