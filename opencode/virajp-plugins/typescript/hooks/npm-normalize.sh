#!/usr/bin/env bash
# PreToolUse hook: rewrite npm/npx commands to the repo's package manager.
#
# vwf allows exactly two JS/TS package managers — pnpm and bun — so this
# resolves which one this directory uses and rewrites accordingly:
#
#   pnpm:  npx <pkg> → pnpm dlx <pkg>   npm ci → pnpm install --frozen-lockfile
#   bun:   npx <pkg> → bunx <pkg>       npm ci → bun install --frozen-lockfile
#
# Resolution order (first hit wins):
#   1. a lockfile, walking up from cwd — bun.lock/bun.lockb → bun,
#      pnpm-lock.yaml → pnpm. The lockfile is ground truth: bun reuses npm's
#      `workspaces` field, so nothing else distinguishes them reliably.
#   2. `package_manager: bun` in .config/vwf.yaml — covers a project scaffolded
#      but not yet installed, where no lockfile exists.
#   3. pnpm, the default. vwf is user-scoped so this hook fires in every repo,
#      including ones that never heard of vwf; pnpm preserves prior behavior.
#
# BSD sed compatible: no \s, no \b (see CLAUDE.md).

set -euo pipefail

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // ""')

# --- resolve the package manager -------------------------------------------
resolve_pm() {
  local dir="${PWD}"
  while [[ "$dir" != "/" && -n "$dir" ]]; do
    if [[ -f "$dir/bun.lock" || -f "$dir/bun.lockb" ]]; then
      echo bun
      return
    fi
    if [[ -f "$dir/pnpm-lock.yaml" ]]; then
      echo pnpm
      return
    fi
    if [[ -f "$dir/.config/vwf.yaml" ]]; then
      if grep -qE '^[[:space:]]*package_manager:[[:space:]]*bun[[:space:]]*$' \
        "$dir/.config/vwf.yaml" 2>/dev/null; then
        echo bun
      else
        echo pnpm
      fi
      return
    fi
    dir="$(dirname "$dir")"
  done
  echo pnpm
}

pm=$(resolve_pm)

if [[ "$pm" == "bun" ]]; then
  dlx="bunx"
else
  dlx="pnpm dlx"
fi

# --- npx → <dlx> ------------------------------------------------------------
# One generic pattern: any flags after npx (-y/--yes/--) survive verbatim in
# command-argument position, e.g. `npx -y cowsay` → `bunx -y cowsay`.
rewritten=$(echo "$command" | sed -E \
  "s/(^|[;&|][[:space:]]*|\\\$\\([[:space:]]*)npx[[:space:]]+/\\1${dlx} /g")

# --- npm ci → <pm> install --frozen-lockfile --------------------------------
rewritten=$(echo "$rewritten" | sed -E \
  "s/(^|[;&|][[:space:]]*|\\\$\\([[:space:]]*)npm ci([[:space:]]|$)/\\1${pm} install --frozen-lockfile\\2/g")

# --- npm → <pm> (all remaining npm invocations) -----------------------------
rewritten=$(echo "$rewritten" | sed -E \
  "s/(^|[;&|][[:space:]]*|\\\$\\([[:space:]]*)npm[[:space:]]+/\\1${pm} /g")

if [[ "$rewritten" == "$command" ]]; then
  echo '{}'
  exit 0
fi

jq -n \
  --arg cmd "$rewritten" \
  --arg pm "$pm" \
  '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: ("npm/npx → " + $pm + " (resolved from this directory)"),
      updatedInput: { command: $cmd }
    }
  }'
