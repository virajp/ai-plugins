/**
 * MemPalace auto-save for OpenCode.
 *
 * The other three targets run mempalace's own shell hooks, declared in
 * `hooks/hooks.yaml` and wrapped per target. OpenCode cannot: those scripts
 * speak Claude's Stop-hook payload and answer by *blocking the stop* with a
 * reason, and OpenCode has no stop to block — its equivalent surface is a bus
 * event plus a server API you inject a message into. So this is the one target
 * where the behaviour is reimplemented rather than wrapped, which is why the
 * hooks carry `skipTargets: [opencode]`.
 *
 * OpenCode discovers `{plugin,plugins}/*.{ts,js}` and its loader is Bun, so
 * this ships as authored TypeScript with no transform. Types are declared
 * locally rather than imported from `@opencode-ai/plugin`: that package is not
 * installed in a user's config dir, and a runtime import of it would fail.
 *
 * How the Claude hooks map here:
 *  - Stop (save every N human messages) → `session.idle`: count the session's
 *    user messages via the server API and inject the checkpoint prompt every
 *    SAVE_INTERVAL.
 *  - PreCompact (emergency save before compaction) → `session.compacted`, which
 *    fires *after* the fact, so what it can persist is only what the model
 *    still holds. Weaker than Claude's pre-compaction mine; a documented limit.
 *  - SessionEnd → no usable OpenCode event at exit; covered indirectly by the
 *    interval saves. Also a documented limit.
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Mirrors `mempal_save_hook.sh`'s interval and block reason, plus a pointer at
 * the MCP tools: OpenCode shows this as a plain user message rather than as a
 * stop-hook system message, so it has to say what to do on its own.
 */
const SAVE_INTERVAL = 15;

const SAVE_PROMPT =
  "MemPalace save checkpoint. Write a brief session diary entry covering key "
  + "topics, decisions, and code changes since the last save. Use verbatim "
  + "quotes where possible, and persist it via the mempalace MCP tools. "
  + "Continue after saving.";

const COMPACT_PROMPT =
  "The conversation was just compacted. MemPalace safety save: write a session "
  + "diary entry covering the key topics, decisions, and code changes you "
  + "still hold, and persist it via the mempalace MCP tools. Continue after "
  + "saving.";

/** Every injected prompt starts with this, which is how re-fires are detected. */
const PROMPT_MARKER = "MemPalace save";

interface MessagePart {
  readonly type?: string;
  readonly text?: string;
}

interface Message {
  readonly info?: { readonly role?: string; };
  readonly parts?: readonly MessagePart[];
}

interface BusEvent {
  readonly type?: string;
  readonly properties?: {
    readonly sessionID?: string;
    readonly info?: { readonly id?: string; };
  };
}

/** What an idle event should do, given the session's user messages so far. */
type Decision =
  | { readonly kind: "idle"; }
  | { readonly kind: "sync"; readonly savedAt: number; }
  | { readonly kind: "save"; readonly savedAt: number; };

/**
 * The whole auto-save rule, as a pure function.
 *
 * `savedAt` records the user-message count when we last injected. The injected
 * prompt is itself a user message and so advances the count past the threshold,
 * which is what stops a save from repeating — but an idle fires immediately
 * after our own injection too, and at that moment the count has not yet been
 * observed. Hence `sync`: recognise our own prompt as the latest message and
 * record the count without saving again.
 */
function decide(
  users: readonly Message[],
  savedAt: number,
): Decision {
  if (users.length === 0) {
    return { kind: "idle" };
  }
  const latest = users[users.length - 1];
  if (latest !== undefined && textOf(latest).startsWith(PROMPT_MARKER)) {
    return { kind: "sync", savedAt: users.length };
  }
  if (users.length - savedAt >= SAVE_INTERVAL) {
    // +1 accounts for the prompt this save is about to inject.
    return { kind: "save", savedAt: users.length + 1 };
  }
  return { kind: "idle" };
}

function textOf(message: Message): string {
  return (message.parts ?? [])
    .filter(part => part.type === "text")
    .map(part => part.text ?? "")
    .join("\n");
}

/**
 * mempalace's own opt-out contract: `MEMPALACE_HOOKS_AUTO_SAVE=false|0|no`, or
 * `{"hooks": {"auto_save": false}}` in `~/.mempalace/config.json`. Absent
 * config means enabled, matching the shell hook.
 */
function autoSaveEnabled(
  env: NodeJS.ProcessEnv = process.env,
  readConfig: () => string = () =>
    readFileSync(join(homedir(), ".mempalace", "config.json"), "utf8"),
): boolean {
  const flag = env["MEMPALACE_HOOKS_AUTO_SAVE"];
  if (flag !== undefined) {
    return !["false", "0", "no"].includes(flag.toLowerCase());
  }
  try {
    const config = JSON.parse(readConfig()) as {
      hooks?: { auto_save?: boolean; };
    };
    return config?.hooks?.auto_save !== false;
  }
  catch {
    return true;
  }
}

const MempalaceAutoSave = async (
  { serverUrl }: { serverUrl: string; },
) => {
  /** sessionID → user-message count at the last checkpoint we injected. */
  const savedAt = new Map<string, number>();

  const api = (path: string) => new URL(path, serverUrl);

  async function userMessages(
    sessionID: string,
  ): Promise<readonly Message[] | null> {
    const response = await fetch(api(`/session/${sessionID}/message`));
    if (!response.ok) {
      return null;
    }
    const messages = await response.json() as readonly Message[];
    return messages.filter(m => m?.info?.role === "user");
  }

  async function inject(sessionID: string, text: string): Promise<void> {
    await fetch(api(`/session/${sessionID}/message`), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ parts: [{ type: "text", text }] }),
    });
  }

  return {
    event: async ({ event }: { event: BusEvent; }): Promise<void> => {
      if (!autoSaveEnabled()) {
        return;
      }
      const sessionID = event?.properties?.sessionID
        ?? event?.properties?.info?.id;
      if (sessionID === undefined) {
        return;
      }

      if (event.type === "session.idle") {
        const users = await userMessages(sessionID);
        if (users === null) {
          return;
        }
        const decision = decide(users, savedAt.get(sessionID) ?? 0);
        if (decision.kind === "idle") {
          return;
        }
        savedAt.set(sessionID, decision.savedAt);
        if (decision.kind === "save") {
          await inject(sessionID, SAVE_PROMPT);
        }
      }

      if (event.type === "session.compacted") {
        const users = await userMessages(sessionID);
        savedAt.set(sessionID, (users?.length ?? 0) + 1);
        await inject(sessionID, COMPACT_PROMPT);
      }
    },
  };
};

/**
 * A default export carrying `server`, and **nothing else exported**.
 *
 * Both loader paths accept this shape: the v1 reader takes a default export
 * with a `server()` and then ignores named exports entirely, and the legacy
 * fallback's `getServerPlugin` unwraps `{ server }` just as happily. So it
 * works whichever version of OpenCode is installed.
 *
 * The "nothing else" half is the load-bearing part. The legacy path iterates
 * `Object.values(mod)` and calls **every** export as a plugin — a helper
 * exported for a unit test would be invoked with the plugin context and its
 * return value pushed into the hooks array. Upstream's own source says as much:
 * "extra test helpers cannot exist alongside plugin exports". The tests
 * therefore drive this module through `server()`, which is the honest surface
 * to test anyway.
 */
export default { server: MempalaceAutoSave };
