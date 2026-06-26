#!/usr/bin/env node
"use strict";

/**
 * vwf context / rate-limit caps — PostToolUse actuator (semi-auto).
 *
 * Bundled with the main `statusLine` install (see bin/installer.js). The
 * context_window and rate_limits figures arrive ONLY on the statusline payload,
 * never on hook stdin, so the statusline mirrors them to
 *   $AI_PLUGINS_USAGE_DIR/<session_id>.json
 * (see tools/statusline/statusline → writeUsageFile). This hook reads that file
 * after each tool call and, when a cap is breached, injects a directive telling
 * the agent to snapshot via vwf:handoff and then halt. A hook cannot clear the
 * context or invoke slash commands, so "continue" is a one-keystroke resume by
 * the user (/clear, or wait for reset, then /vwf:recall).
 *
 * Caps (most severe wins):
 *   7-day   > 80%  -> handoff, then STOP (weekly limit nearly exhausted)
 *   5-hour  > 90%  -> handoff, then PAUSE until the window resets
 *   context > 65%  -> handoff, then /clear + /vwf:recall in a fresh session
 *
 * Inert (no output) when AI_PLUGINS_USAGE_DIR is unset or no usage file exists.
 * Level-debounced per session (state file) so the directive fires once per
 * escalation, not on every tool call during the handoff itself.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const CTX_CAP = 65;
const FIVE_H_CAP = 90;
const SEVEN_D_CAP = 80;

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  }
  catch {
    return {};
  }
}

// Expand a leading ~, $HOME, or ${HOME} so the env value works whether or not
// Claude Code expanded it before exporting.
function expandHome(p) {
  return p
    .replace(/^~(?=\/|$)/, os.homedir())
    .replace(/^\$\{?HOME\}?(?=\/|$)/, os.homedir());
}

// Epoch (seconds or millis) -> "4h36m" / "5d2h" / "now".
function humanIn(resetsAt) {
  if (resetsAt == null) {
    return "soon";
  }
  const n = Number(resetsAt);
  if (isNaN(n)) {
    return "soon";
  }
  let s = Math.floor(((n > 1e12 ? n : n * 1000) - Date.now()) / 1000);
  if (s <= 0) {
    return "now";
  }
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  return d > 0 ? `${d}d${h}h` : h > 0 ? `${h}h${m}m` : `${m}m`;
}

function emit(text) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: text,
    },
  }));
}

function main() {
  let dir = process.env.AI_PLUGINS_USAGE_DIR;
  const sid = readStdin().session_id;
  if (!dir || !sid) {
    return;
  }
  dir = expandHome(dir);

  let u;
  try {
    u = JSON.parse(fs.readFileSync(path.join(dir, `${sid}.json`), "utf8"));
  }
  catch {
    return;
  } // statusline hasn't written yet

  // Highest breached cap: 3=7-day, 2=5-hour, 1=context, 0=none.
  let level = 0;
  let directive = null;
  if ((u.sevenDayPct ?? 0) > SEVEN_D_CAP) {
    level = 3;
    directive =
      `⛔ 7-DAY LIMIT CAP — weekly usage at ${u.sevenDayPct}% (cap ${SEVEN_D_CAP}%), resets in `
      + `${
        humanIn(u.sevenDayResetsAt)
      }. Finish ONLY the current step, then: (1) invoke the vwf:handoff `
      + `skill to snapshot state to mempalace; (2) STOP and tell the user the 7-day limit is nearly `
      + `exhausted and work is halted until it resets. Do NOT start a new vwf stage or keep coding.`;
  }
  else if ((u.fiveHourPct ?? 0) > FIVE_H_CAP) {
    level = 2;
    directive =
      `⚠ 5-HOUR LIMIT CAP — 5h usage at ${u.fiveHourPct}% (cap ${FIVE_H_CAP}%), resets in `
      + `${
        humanIn(u.fiveHourResetsAt)
      }. Finish ONLY the current step, then: (1) invoke the vwf:handoff `
      + `skill to snapshot state; (2) STOP and tell the user work is paused until the 5-hour window `
      + `resets (~${
        humanIn(u.fiveHourResetsAt)
      }) — resume with /vwf:recall after reset. Do NOT continue now.`;
  }
  else if ((u.ctxPct ?? 0) > CTX_CAP) {
    level = 1;
    directive = `⚠ CONTEXT CAP — context window at ${
      Math.round(
        u.ctxPct,
      )
    }% (cap ${CTX_CAP}%). Finish ONLY the `
      + `current step, then: (1) invoke the vwf:handoff skill to snapshot state to mempalace; (2) STOP and `
      + `tell the user to run /clear (or /compact) then /vwf:recall in a fresh session to continue — the `
      + `context cannot be cleared from inside this session. Do NOT start a new vwf stage.`;
  }

  if (level === 0) {
    return;
  }

  // Debounce: (re)inject only when escalating above the last-emitted level.
  const stateFile = path.join(dir, `${sid}.state.json`);
  let last = 0;
  try {
    last = JSON.parse(fs.readFileSync(stateFile, "utf8")).level || 0;
  }
  catch { /* ignore */ }
  if (level <= last) {
    return;
  }
  try {
    fs.writeFileSync(stateFile, JSON.stringify({ level, ts: Date.now() }));
  }
  catch { /* ignore */ }

  emit(directive);
}

main();
