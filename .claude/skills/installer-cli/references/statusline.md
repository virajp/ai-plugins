# Statusline

The statusline is **not a plugin** — it ships inside `@askviraj/ai-plugins`, is
wired straight from the router by `cli/src/statusline.ts`, and has **its own
receipt file**.

**There is one surface: Claude.** A config key pointing at the powerline script,
plus the caps hook. The OpenCode TUI plugin and Oh-My-Pi's four `omp config`
keys were discontinued in the Claude-first cutover — they are removed cleanly
rather than orphaned, by `--uninstall`'s legacy-receipt reader, but the surfaces
themselves do not come back. Cursor never had one; it exposes no status surface
at all.

Whatever you are tempted to add here, note what the multi-surface version cost:
two more foreign-detection tests with different semantics (one overwritten, one
appended-to), a `configure` flag threaded through two installers, a TUI file no
tsconfig could type-check, and a bug where a deep-equality `ours` test asked for
consent on every single run forever.

## The consent gate

`cli/src/statusline-consent.ts`. **Installing the bar and configuring Claude are
separate**, and only the second is gated: the private `run` takes a `configure`
flag and drops its last step when false, so a declined run still lands the
script and the caps hook.

This reinstates a prompt that was **deliberately removed**, and the reasoning is
worth keeping straight. The argument for removing it was that the old
`bin/claude.mjs` prompted only because it could not put the previous bar back,
and the receipt made that unnecessary. True of the *undo*; never true of the
interval before it. **Reversibility is not consent.**

Three rules, in `resolveConsent` — a pure function, so every branch is testable
without a terminal:

- **Ours is not foreign.** Compare what is on disk against what our own write
  would produce, never `existsSync`. Same ownership rule as the receipt entries,
  same reason: on run 2 what is sitting there is run 1's own output. Skip this
  and every repeat run prompts about the bar it installed itself.
- **`--statusline` is the only consent.** It is checked **before** the
  remembered refusal, or the flag could never undo one. (`--all` is again the
  thing that explicitly does *not* count as consent — it installs plugins and
  never the bar — so the ordering rule matters for the same reason it always
  did.)
- **No TTY fails the run.** Not overwrite, not skip. Overwriting silently is the
  bug; skipping silently makes an unattended install report success with the bar
  unconfigured.

A refusal is remembered as `"autoConfigure": false` in
`~/.config/statusline.json`, and the key is declared in
`schemas/statusline.schema.json`, which sets `additionalProperties: false` — so
an undeclared key would show as an error in the user's editor forever.
`setAutoConfigure(ctx, true)` *deletes* the key rather than writing `true`:
absent is the default, and a stray `true` says nothing.

## The script

`tools/statusline/statusline` is the executable Node script (node shebang) and
drives **both** Claude surfaces from one file: a stdin payload with a `tasks`
array renders the subagent panel, anything else the main two-line bar.
`--statusline` installs `statusLine` and `subagentStatusLine` plus
`tools/statusline/context-caps.js`, the `PostToolUse` caps hook.

**It reports its own version.** `--version` prints a hardcoded `VERSION`
constant and exits before anything else — checked first, and printing nothing
but the number, because the CLI parses it. `i:version` stamps that constant
during the bump, `i:release` commits the script alongside `package.json`, and
`i:test` asserts the two agree. Stamping at build time was rejected: the script
is a committed static asset copied verbatim to the user's machine, and stamping
during the build would make the committed file and the published one differ, so
a reader of the repo could never tell what a user actually has.

**The caps hook is Claude-only** by nature: its sensor is the Claude bar, which
mirrors `context_window` / `rate_limits` to a usage file.

**The `spend` segment is the one segment whose data is not on the stdin
payload.** The payload carries no spend fields, so the script reads the OAuth
usage endpoint Claude Code's own `/usage` uses — token from Claude Code's stored
credentials — through a machine-global cache (`~/.cache/ai-plugins/spend.json`,
`$AI_PLUGINS_SPEND_CACHE` override; the endpoint takes an
`$AI_PLUGINS_SPEND_URL` override) refreshed by a detached `--refresh-spend`
child on a file-based timer (`spend.refreshMinutes`, default 15). A render never
fetches: the endpoint throttles on accumulated usage and a tripped account stays
429 for 30+ minutes, so the child is single-flight behind a lock file and
records exponential backoff on 429. Under `show: "auto"` it renders only for
team/enterprise plans (the `subscriptionType` tag stored beside the token),
which is what lets it sit in the default layout. The script tests zero
`refreshMinutes` in their seeded config — the keychain is not `$HOME`-scoped, so
a spawned refresh would escape the fake home. A `monthly` transcript-ledger
segment existed briefly (v4.3.2) and was removed on request — codeburn's menubar
app owns that job.

## Config

Two layers, deep-merged low → high (objects merge key by key, arrays replace
wholesale; either layer may be absent):

1. `~/.config/statusline.json` — per user; the installer seeds this with the
   full defaults and deep-merges missing settings on re-run. The script reads
   defaults **only** from here, never from a file beside itself.
2. `<repo-root>/.config/statusline.json` — per repo, highest.

Uninstall deliberately **leaves** the seeded `~/.config/statusline.json`, since
it may hold user edits.

**Four files move together** when the config shape changes:

- `tools/statusline/statusline` (the script)
- `tools/statusline/statusline.json` (the bundled defaults)
- `schemas/statusline.schema.json` (at the repo root, consumed only via its raw
  GitHub URL from `$schema`)
- `docs/plugins/statusline.md` (the user-facing reference)
