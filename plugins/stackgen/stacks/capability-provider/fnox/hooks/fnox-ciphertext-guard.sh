#!/usr/bin/env sh
# fnox-ciphertext-guard — the encrypt-into-git gate.
#
# Condition 3 of the secrets contract's encrypt-into-git allowance
# (assets/contracts/secrets.md): encrypt-into-git fails OPEN, so a value
# written before it is encrypted is a real leak at the one path the scanner
# was just told to ignore. This proves the committed file holds no plaintext.
#
# It also asserts conditions 1, 2 and 4 are actually in place, because those
# are repo-wide config edits and a repo that lands fnox without them has an
# allowlisted path that nothing is checking.
#
# Wired as a repo-local pre-commit hook; see the fnox skill's
# contract-satisfaction reference for the exact entry. Portable to BSD tools:
# POSIX sh, no `\s`, no `\b`, no GNU-only flags.

set -eu

FNOX_FILE="${FNOX_FILE:-fnox.toml}"
GITLEAKS_CONFIG="${GITLEAKS_CONFIG:-.config/gitleaks.toml}"
MEMPALACE_CONFIG="${MEMPALACE_CONFIG:-mempalace.yaml}"
GITIGNORE="${GITIGNORE:-.gitignore}"

fail=0

say() {
  printf '%s\n' "$*" >&2
}

flag() {
  fail=1
  say "fnox-ciphertext-guard: $*"
}

# Does the config at $1 name the fnox file? Matched as a fixed string in both
# spellings —
# plain, and regex-escaped, since a gitleaks `paths` entry writes the dot as
# `\.` and a plain grep for `fnox.toml` does not find `fnox\.toml`.
names_fnox_file() {
  grep -Fq "$FNOX_FILE" "$1" ||
    grep -Fq "$(printf '%s' "$FNOX_FILE" | sed 's/\./\\./g')" "$1"
}

# No fnox config, nothing to guard. A repo that has not pinned fnox — or one
# using only remote references in a file named something else — passes.
if [ ! -f "$FNOX_FILE" ]; then
  exit 0
fi

# --- Condition 3: every secret entry is ciphertext or a reference -----------
#
# The mechanical rule: every entry inside `[secrets]` or
# `[profiles.<name>.secrets]` carries `provider = "..."`. That bans a bare
# `default = "..."` outright. fnox permits one as a plaintext local value;
# this repo does not, because the guard cannot tell a throwaway from a real
# credential and a gate that has to guess is not a gate.
#
# TOML inline tables are single-line, so a line is a whole entry.
plaintext=$(
  awk '
    /^[[:space:]]*#/ { next }
    /^[[:space:]]*\[/ {
      header = $0
      sub(/^[[:space:]]+/, "", header)
      in_secrets = (header ~ /^\[secrets\]/ || header ~ /^\[profiles\.[^]]+\.secrets\]/)
      next
    }
    in_secrets && /=/ {
      if ($0 !~ /provider[[:space:]]*=[[:space:]]*"/) {
        name = $0
        sub(/[[:space:]]*=.*$/, "", name)
        sub(/^[[:space:]]+/, "", name)
        sub(/[[:space:]]+$/, "", name)
        if (name != "") print name
      }
    }
  ' "$FNOX_FILE"
)

if [ -n "$plaintext" ]; then
  flag "plaintext in $FNOX_FILE — these entries carry no provider:"
  printf '%s\n' "$plaintext" | while IFS= read -r name; do
    say "    $name"
  done
  say "  Encrypt them (fnox set ... --provider age), or move non-secret"
  say "  configuration to the mise env, where it belongs."
fi

# --- Condition 1: the scanner allowlists this file, by path ----------------
if [ ! -f "$GITLEAKS_CONFIG" ]; then
  flag "$GITLEAKS_CONFIG is missing — $FNOX_FILE holds committed ciphertext"
  say "  and needs a path allowlist. See the fnox skill, condition 1."
elif ! names_fnox_file "$GITLEAKS_CONFIG"; then
  flag "$GITLEAKS_CONFIG does not allowlist $FNOX_FILE by path — every commit"
  say "  will fail the secret scanner. See the fnox skill, condition 1."
fi

# --- Condition 2: no allowlist entry covers a decryption identity ----------
#
# What makes the ciphertext safe to commit is that the key is not beside it,
# so a scanner hit on an identity is ALWAYS real and must never be silenced.
if [ -f "$GITLEAKS_CONFIG" ] &&
  grep -Eq 'age\\?\.txt|AGE-SECRET-KEY|\\?\.fnox/|key_file' "$GITLEAKS_CONFIG"; then
  flag "$GITLEAKS_CONFIG appears to allowlist a decryption identity."
  say "  The allowlist covers $FNOX_FILE and nothing else. A hit on an age"
  say "  identity is always real. See the fnox skill, condition 2."
fi

if [ -f "$GITIGNORE" ] && ! grep -q 'age\.txt' "$GITIGNORE"; then
  flag "$GITIGNORE does not ignore age.txt — the decryption identity must be"
  say "  fully gitignored. See the fnox skill, condition 2."
fi

# --- Condition 4: the committed file is excluded from mining ---------------
#
# The denylist vwf seeds carries *secret* and *credentials*, and NEITHER
# matches fnox.toml — the existing backstop does not catch this file by
# accident, so the entry has to be explicit.
if [ -f "$MEMPALACE_CONFIG" ] && ! names_fnox_file "$MEMPALACE_CONFIG"; then
  flag "$MEMPALACE_CONFIG does not exclude $FNOX_FILE from mining. The seeded"
  say "  *secret* / *credentials* patterns do not match it. Add it to"
  say "  exclude_patterns. See the fnox skill, condition 4."
fi

if [ "$fail" -ne 0 ]; then
  say ""
  say "fnox-ciphertext-guard: refusing the commit."
  exit 1
fi

exit 0
