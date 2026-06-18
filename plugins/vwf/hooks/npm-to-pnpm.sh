#!/usr/bin/env bash
# PreToolUse hook: transparently rewrite npm/npx commands to pnpm equivalents
# npx <pkg>        → pnpm dlx <pkg>
# npm <cmd>        → pnpm <cmd>
# npm run <script> → pnpm run <script>  (pnpm is compatible, no change needed)
# npm install      → pnpm install
# npm ci           → pnpm install --frozen-lockfile

set -euo pipefail

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // ""')

# --- npx → pnpm dlx ---
rewritten=$(echo "$command" | sed -E \
  's/(^|[;&|][[:space:]]*|\$\([[:space:]]*)npx([[:space:]]+(-y|--yes)[[:space:]]+|[[:space:]]+--[[:space:]]+|[[:space:]]+)/\1pnpm dlx\2/g
   s/(^|[;&|][[:space:]]*|\$\([[:space:]]*)npx[[:space:]]+/\1pnpm dlx /g')

# --- npm ci → pnpm install --frozen-lockfile ---
rewritten=$(echo "$rewritten" | sed -E \
  's/(^|[;&|][[:space:]]*|\$\([[:space:]]*)npm ci([[:space:]]|$)/\1pnpm install --frozen-lockfile\2/g')

# --- npm → pnpm (all remaining npm invocations) ---
rewritten=$(echo "$rewritten" | sed -E \
  's/(^|[;&|][[:space:]]*|\$\([[:space:]]*)npm[[:space:]]+/\1pnpm /g')

if [[ "$rewritten" == "$command" ]]; then
  echo '{}'
  exit 0
fi

jq -n \
  --arg cmd "$rewritten" \
  '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: "npm/npx → pnpm (project uses pnpm)",
      updatedInput: { command: $cmd }
    }
  }'
