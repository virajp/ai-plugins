# Vendored from MemPalace

vwf ships mempalace's memory layer directly rather than depending on the
upstream plugin. Before this, `mempalace` was a url-sourced entry in
`marketplace.yaml` and a vwf dependency — which meant **OpenCode users got no
memory at all**, because a url-sourced plugin has no rendered bundle and the
installer skips it (`cli/src/plan.ts`, the `localOnly` branch). Vendoring is
what makes memory ship on every target instead of only where a marketplace can
reach.

## Provenance

| | |
|---|---|
| **Upstream** | <https://github.com/MemPalace/mempalace> |
| **Version taken** | `3.7.0` |
| **Licence** | MIT — see [LICENSE](LICENSE), which ships with every rendered bundle |
| **Author** | MemPalace Contributors |

## What was taken

Two skills, and nothing else:

| Upstream path | Lands as |
|---|---|
| `skills/mempalace/SKILL.md` | `templates/vwf/skills/mempalace/` |
| `skills/mempalace-recall/SKILL.md` | `templates/vwf/skills/mempalace-recall/` |

Deliberately **not** taken: the Python package, the MCP server implementation,
and the `integrations/` tree. vwf declares the MCP server over HTTP in its own
`plugin.yaml`, and the daemon is installed out-of-band by whatever tool manager
the machine uses — vwf neither installs nor supervises it. (`uv` is in vwf's
`requires:` for **graphify's** Python runtime, per the comment in
`plugin.yaml`; it is not there for mempalace, whatever the install path
happens to be.) Only the agent-facing prose is vendored.

**The auto-save hooks are not vendored either — they are reimplemented.**
Upstream's `mempal_save_hook.sh` counts human messages by parsing
`transcript_path`, a Claude Code JSONL transcript, and breaks its own save loop
with `stop_hook_active`. Neither exists on Cursor, Oh-My-Pi or OpenCode, so
wrapping that script for them produces a hook that runs, finds no transcript,
and does nothing — working in the coverage report, dead in practice. vwf's
`hooks/mempalace-checkpoint.sh` counts *stops* in a state file instead, which
needs only a session id, and `opencode-plugin/mempalace-autosave.ts` counts
real messages through OpenCode's server API. Same behaviour, four targets, no
transcript dependency.

Also not taken: upstream's `.claude-plugin/hooks/hooks.json`. It references
`mempal-stop-hook.sh`, `mempal-session-end-hook.sh` and
`mempal-precompact-hook.sh` — hyphenated names that **do not exist** in the
`3.7.0` tree, where every script is underscored.

## Local edits

One addition, in `mempalace`: the **Prerequisites** section gains a second
install path beside upstream's `uv tool install` — the managed-tool install
(`mise use -g "pipx:mempalace@latest"`) plus running `mempalace-mcp` as a
supervised HTTP daemon, and the rule that the palace path is passed as a flag
rather than through the environment. Upstream documents only the stdio shape,
which is not the shape vwf uses: vwf declares the server over HTTP in its
`plugin.yaml`, so a reader following upstream's prose ends up with a
subprocess vwf never connects to. Re-apply this on any resync.

One word, in `mempalace-recall`: the adjective describing time-ordered
knowledge graphs was replaced with "time-aware". That adjective is spelled
exactly like one of the orchestration engines in `plugins:check`'s
no-tool-names guard, which cannot tell the two apart. The alternative was a
third entry in `TOOL_NAME_EXCEPTIONS`, a list kept deliberately narrow —
weakening a real guard to protect an incidental English word is the wrong
trade. Re-apply this on any resync.

## Resync policy

This is a **one-time fork, re-synced deliberately** — not a mirror and not a
submodule. Nothing automated watches upstream, so a change there is invisible
here until someone looks.

To re-sync: diff the two skills against the upstream tag, apply what matters,
and update the **Version taken** row. That row is the only thing that makes
drift detectable, so it is the one edit that must not be skipped.

The coupling that does survive is the **MCP tool names** the skills instruct
the model to call. Those are upstream's API, and a rename there makes the prose
wrong in a way no gate here can catch — `plugins:check` validates frontmatter
and links, not whether a named tool exists. Everything else is prose.
