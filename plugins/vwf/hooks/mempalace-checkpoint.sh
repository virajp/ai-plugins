#!/bin/sh
# MemPalace save checkpoint — every Nth agent stop, tell the model to persist.
#
# Written for this toolkit rather than vendored. Upstream's hook parses
# `transcript_path`, a Claude Code JSONL transcript, to count human messages.
# Counting *stops* in a state file instead needs nothing from the payload but a
# session id, which is simpler and is what the tests cover
# (installer/src/mempalace-checkpoint-script.test.ts).
#
# Contract:
#   stdin  — JSON with `session_id`, and on a stop `stop_hook_active`
#   stdout — nothing to say nothing; otherwise a `gate` verdict carrying the
#            instruction, which each target renders as a block plus reason
#
# Invoked two ways, by `hooks.json`:
#   (no argument)  the stop hook — counts, and speaks every SAVE_INTERVAL
#   --compact      the pre-compact hook — always speaks, and resets the count
#
# POSIX sh with BSD-portable tooling only: this runs on macOS, where `sed` has
# no `\s`/`\b` and `grep -P` does not exist.

set -u

SAVE_INTERVAL=${MEMPALACE_SAVE_INTERVAL:-15}

STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/ai-plugins/mempalace"

SAVE_REASON='MemPalace save checkpoint. Write a brief session diary entry covering key topics, decisions, and code changes since the last save. Use verbatim quotes where possible, and persist it via the mempalace MCP tools. Continue after saving.'

COMPACT_REASON='The conversation is about to be compacted. MemPalace safety save: write a session diary entry covering the key topics, decisions, and code changes you still hold, and persist it via the mempalace MCP tools. Continue after saving.'

# Opt-out, matching mempalace's own contract so a user who turned auto-save off
# upstream stays off here.
auto_save_enabled() {
  case "${MEMPALACE_HOOKS_AUTO_SAVE:-}" in
    false | 0 | no | FALSE | NO) return 1 ;;
  esac
  config="$HOME/.mempalace/config.json"
  # Deliberately a substring test rather than a JSON parse: `jq` is not a
  # dependency of this toolkit, and the only thing being looked for is a
  # two-key literal. A malformed config reads as enabled, which is the safe
  # direction — it saves too often rather than silently never.
  if [ -f "$config" ] && tr -d ' \n\t' < "$config" |
    grep -q '"auto_save":false'; then
    return 1
  fi
  return 0
}

# Pull one string field out of the payload without a JSON parser. Values here
# are ids and booleans — no escapes, no nesting — so this stays honest.
field() {
  printf '%s' "$1" |
    tr ',{}' '\n\n\n' |
    grep "\"$2\"" |
    head -1 |
    sed -e 's/.*"'"$2"'"[[:space:]]*:[[:space:]]*//' \
      -e 's/^"//' -e 's/"$//' -e 's/[[:space:]]*$//'
}

# The gate verdict: top-level `decision`/`reason`, which is Claude's shape for
# a stop hook and the only shape it accepts here.
#
# This used to also emit a `hookSpecificOutput` carrying `permissionDecision`
# and `permissionDecisionReason`. Those belong to `PreToolUse`, which this hook
# is not, and Claude rejected the whole verdict for the missing `hookEventName`
# — so the checkpoint never fired. There is no `hookSpecificOutput` variant for
# `Stop` that carries a denial (its one field is `additionalContext`, which
# lets the stop through) and none at all for `PreCompact`, so the fix is to
# drop the block rather than name the event in it.
#
#
# `reason` is JSON-escaped for the two characters that can appear in it; the
# rest of the text is ASCII prose under our own control.
speak() {
  escaped=$(printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')
  printf '{"decision":"block","reason":"%s"}\n' "$escaped"
}

auto_save_enabled || exit 0

INPUT=$(cat)
SESSION=$(field "$INPUT" session_id)
[ -n "$SESSION" ] || SESSION=default

mkdir -p "$STATE_DIR" 2>/dev/null || exit 0
COUNTER="$STATE_DIR/$(printf '%s' "$SESSION" | tr -c 'A-Za-z0-9._-' '_').count"

if [ "${1:-}" = "--compact" ]; then
  echo 0 > "$COUNTER" 2>/dev/null
  speak "$COMPACT_REASON"
  exit 0
fi

# Already inside a save cycle: let the stop through, or the model can never
# finish. This is the loop guard, and it is why the counter resets here.
case "$(field "$INPUT" stop_hook_active)" in
  true)
    echo 0 > "$COUNTER" 2>/dev/null
    exit 0
    ;;
esac

count=0
[ -f "$COUNTER" ] && count=$(cat "$COUNTER" 2>/dev/null)
case "$count" in
  '' | *[!0-9]*) count=0 ;;
esac
count=$((count + 1))

if [ "$count" -ge "$SAVE_INTERVAL" ]; then
  echo 0 > "$COUNTER" 2>/dev/null
  speak "$SAVE_REASON"
else
  echo "$count" > "$COUNTER" 2>/dev/null
fi

exit 0
