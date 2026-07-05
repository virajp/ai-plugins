# mempalace

`mempalace` is an AI memory system — it mines projects and conversations into a
searchable "memory palace" so Claude can recall past decisions and findings
across sessions. It ships 33 MCP tools, auto-save hooks, and guided setup.

It is maintained externally at
[MemPalace/mempalace](https://github.com/MemPalace/mempalace) and **re-listed**
in the `virajp-plugins` marketplace, so it installs from the same place as the
rest. It is also a dependency of `vwf`.

## Install

```sh
pnpx @askviraj/ai-plugins --user mempalace
```

When you install `vwf`, `mempalace` is pulled in and enabled automatically — you
only need this command to install it on its own.

For **OpenCode**, `--platform opencode --user mempalace` (or installing `vwf`)
fetches the upstream repo and installs: its two skills, the `mempalace` MCP
server in the OpenCode config (launched as `mise x -- mempalace-mcp`), and an
OpenCode plugin (`plugin/mempalace-hooks.js`) that ports the Claude auto-save
hooks — a save checkpoint every 15 user messages (on `session.idle`) and a
safety save after compaction, honoring the same opt-out
(`MEMPALACE_HOOKS_AUTO_SAVE=false` or `hooks.auto_save` in
`~/.mempalace/config.json`). The Claude `SessionEnd` hook has no OpenCode
equivalent — the interval saves cover it.

## How vwf uses it

`vwf` uses mempalace as cross-session memory: each cycle recalls prior context
before working and persists durable outcomes after, so detail doesn't pile up in
the conversation. Memory is keyed by your project (the **wing**) and split into
rooms:

| Room        | Holds                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `decisions` | design/architecture decisions and the *why*                                                                                                |
| `problems`  | review, security, acceptance, and UX findings, and how they were resolved                                                                  |
| `planning`  | plan rationale and deferred options (written by `/vwf:plan`)                                                                               |
| `gaps`      | blueprint/plan holes — surfaced during execution, routed in by `/vwf:verify`/`/vwf:feedback`, or parked as out-of-scope during elicitation |
| `runs`      | the `/vwf:execute` run journal — step order and per-step progress, for resuming a paused run                                               |
| `handoff`   | session handoffs for `/vwf:handoff` and `/vwf:recall`                                                                                      |

Memory is best-effort: if mempalace is unavailable, `vwf` skips every memory
step and proceeds. The one exception is `/vwf:handoff` and `/vwf:recall` — the
handoff *is* the deliverable, so when mempalace is down they fall back to
`docs/handoffs/<name>.md` on disk instead of skipping.

## See also

- [../readme.md](../readme.md) — the marketplace overview and full plugin list.
- [vwf guide](../readme.md) — how the Product → Blueprint → Plan → Execute
  workflow uses memory.
- [MemPalace upstream](https://github.com/MemPalace/mempalace) — full feature
  and tool documentation.
