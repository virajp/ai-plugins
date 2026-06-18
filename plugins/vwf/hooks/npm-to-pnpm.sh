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
  's/(^|[;&|]\s*|\$\(\s*)npx(\s+(-y|--yes)\s+|\s+--\s+|\s+)/\1pnpm dlx\2/g
   s/(^|[;&|]\s*|\$\(\s*)npx\s+/\1pnpm dlx /g')

# --- npm ci → pnpm install --frozen-lockfile ---
rewritten=$(echo "$rewritten" | sed -E \
  's/(^|[;&|]\s*|\$\(\s*)npm ci\b/\1pnpm install --frozen-lockfile/g')

# --- npm → pnpm (all remaining npm invocations) ---
rewritten=$(echo "$rewritten" | sed -E \
  's/(^|[;&|]\s*|\$\(\s*)npm\s+/\1pnpm /g')

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
