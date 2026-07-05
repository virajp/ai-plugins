/**
 * MemPalace auto-save for OpenCode — the OpenCode-plugin port of mempalace's
 * Claude Code hooks (installed by `@askviraj/ai-plugins --platform opencode`
 * into `<configDir>/plugin/`). Loaded by OpenCode's plugin loader
 * (https://opencode.ai/docs/plugins), which is Bun — ESM with node builtins.
 *
 * What the Claude hooks do and how they map here:
 *  - Stop hook (save every N human messages, by blocking the stop with a
 *    "save checkpoint" reason) → on the `session.idle` bus event, count the
 *    session's user messages via the server API; every SAVE_INTERVAL, inject
 *    the same checkpoint prompt as a user message. The injected prompt itself
 *    advances the count past the threshold, so no loop guard beyond tracking
 *    the count at the last save is needed — but we also skip when the latest
 *    user message IS the checkpoint prompt, so an idle fired right after the
 *    injection never double-fires.
 *  - PreCompact hook (emergency save before compaction) → OpenCode exposes
 *    `session.compacted` (after the fact); inject a checkpoint prompt so what
 *    the model still holds is persisted. Weaker than Claude's pre-compaction
 *    mine — documented limitation.
 *  - SessionEnd hook → no OpenCode equivalent event usable at exit; covered
 *    indirectly by the interval saves. Documented limitation.
 *
 * Opt-out honors mempalace's own contract: MEMPALACE_HOOKS_AUTO_SAVE=false
 * (or 0/no), or `{"hooks": {"auto_save": false}}` in ~/.mempalace/config.json.
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Mirrors mempal_save_hook.sh (SAVE_INTERVAL and the block "reason" text),
// with an added pointer at the MCP tools since OpenCode shows this as a plain
// user message rather than a stop-hook system message.
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

function autoSaveEnabled() {
  const env = process.env.MEMPALACE_HOOKS_AUTO_SAVE;
  if (env !== undefined) {
    return !["false", "0", "no"].includes(env.toLowerCase());
  }
  try {
    const cfg = JSON.parse(
      readFileSync(join(homedir(), ".mempalace", "config.json"), "utf8"),
    );
    return cfg?.hooks?.auto_save !== false;
  }
  catch {
    return true; // no config → enabled, matching the shell hook
  }
}

export const MempalaceAutoSave = async ({ serverUrl }) => {
  // sessionID → user-message count at the last checkpoint we injected.
  const savedAt = new Map();

  const api = path => new URL(path, serverUrl);

  async function userMessages(sessionID) {
    const res = await fetch(api(`/session/${sessionID}/message`));
    if (!res.ok) {
      return null;
    }
    const messages = await res.json();
    return messages.filter(m => m?.info?.role === "user");
  }

  async function inject(sessionID, text) {
    await fetch(api(`/session/${sessionID}/message`), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ parts: [{ type: "text", text }] }),
    });
  }

  const textOf = m =>
    (m?.parts || [])
      .filter(p => p?.type === "text")
      .map(p => p.text)
      .join("\n");

  return {
    event: async ({ event }) => {
      if (!autoSaveEnabled()) {
        return;
      }
      const sessionID = event?.properties?.sessionID
        ?? event?.properties?.info?.id;
      if (!sessionID) {
        return;
      }

      if (event.type === "session.idle") {
        const users = await userMessages(sessionID);
        if (!users || !users.length) {
          return;
        }
        // Never re-fire off the idle that follows our own injection.
        if (textOf(users[users.length - 1]).startsWith("MemPalace save")) {
          savedAt.set(sessionID, users.length);
          return;
        }
        const last = savedAt.get(sessionID) ?? 0;
        if (users.length - last >= SAVE_INTERVAL) {
          savedAt.set(sessionID, users.length + 1); // +1 = the injected prompt
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
