# mempalace

`mempalace` is an AI memory system — it mines projects and conversations into a
searchable "memory palace" so an agent can recall past decisions and findings
across sessions. It ships 33 MCP tools and guided setup, and it is what backs
`vwf`'s cross-session memory.

**It is not a plugin in this marketplace.** It was one — a `url`-sourced
re-listing of the upstream repo, and a `vwf` dependency — until its memory layer
was folded into `vwf` itself. Two skills are now vendored under
`templates/vwf/skills/`, the auto-save hooks are reimplemented in `vwf`, and the
MCP server is declared by `vwf`. There is nothing to install by name.

It is still maintained externally at
[MemPalace/mempalace](https://github.com/MemPalace/mempalace), under MIT.
Provenance, the version taken, the local edits and the resync policy are
recorded in `templates/vwf/vendor/mempalace/`, which ships in every rendered
bundle.

## Why it was vendored

A url-sourced plugin has no rendered bundle in this repo, and the OpenCode
adapter can only copy a rendered bundle — so `cli/src/plan.ts` skipped it (the
`localOnly` branch). The result was that **OpenCode users got no memory layer at
all**, silently: the plugin was listed, the install reported a skip note, and
the thing `vwf` leans on hardest was simply absent. The three marketplace
targets were fine, which is what made it easy to miss.

Vendoring is what makes memory ship on every target. It is a deliberate one-time
fork, not a mirror and not a submodule — nothing automated watches upstream, so
the **Version taken** row in `templates/vwf/vendor/mempalace/README.md` is the
only thing that makes drift detectable.

## Skills

Two, both from upstream, now shipped as `vwf` skills on every target:

| Skill                   | What it does                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `/vwf:mempalace`        | Setup and mining — wings, rooms, drawers; turning projects and conversations into the palace. |
| `/vwf:mempalace-recall` | The recall protocol — search the palace before answering about past work or prior decisions.  |

Deliberately **not** taken: the Python package, the MCP server implementation,
and the `integrations/` tree. `vwf` declares the server itself and the daemon is
installed out-of-band — which is why `uv`, mempalace's Python runtime, is one of
`vwf`'s `requires:`.

## Auto-save

Upstream ships an auto-save hook; `vwf` **reimplements** it rather than
vendoring it, because the upstream one works on exactly one target. It counts
human messages by parsing `transcript_path` — a Claude Code JSONL transcript —
and breaks its own save loop with `stop_hook_active`. Neither exists on Cursor,
Oh-My-Pi or OpenCode, so wrapping that script for them yields a hook that runs,
finds no transcript, and does nothing: green in a coverage report, dead in
practice.

What `vwf` ships instead:

- **`hooks/mempalace-checkpoint.sh`** — POSIX sh, on the neutral `stop` event.
  It counts *stops* in a state file under
  `$XDG_STATE_HOME/ai-plugins/mempalace`, which needs nothing from the payload
  but a session id, and every target supplies one. Every 15th stop
  (`MEMPALACE_SAVE_INTERVAL` overrides) it asks the model to write a diary entry
  and persist it through the mempalace MCP tools. A payload carrying
  `stop_hook_active: true` resets the counter and passes, so a save cycle cannot
  re-trigger itself.
- **`hooks/mempalace-precompact.sh`** — the `preCompact` half: always speaks,
  and resets the count. It is a one-line `exec` wrapper passing `--compact`
  rather than an argument in `hooks.yaml`, because the neutral hook schema names
  a script and passes it nothing.
- **`opencode-plugin/mempalace-autosave.ts`** — OpenCode only, which is why both
  shell hooks carry `skipTargets: [ opencode ]`. OpenCode has no stop to block;
  its equivalent surface is a bus event plus a server API you inject a message
  into. This counts real user messages via that API on `session.idle` and
  re-saves after `session.compacted`.

Both honour mempalace's own opt-out, so a user who turned auto-save off upstream
stays off here: `MEMPALACE_HOOKS_AUTO_SAVE=false|0|no`, or
`{"hooks": {"auto_save": false}}` in `~/.mempalace/config.json`.

Two OpenCode limits are documented rather than papered over: `session.compacted`
fires *after* compaction, so it persists only what the model still holds; and
there is no usable session-exit event, so the interval saves cover it
indirectly.

## Running the server (HTTP daemon)

`vwf` declares mempalace over **HTTP**, not stdio — see its `mcpServers` block
in `templates/vwf/plugin.yaml`. You run the server yourself:

```sh
mempalace serve --host 127.0.0.1 --port 8765   # loopback bind needs no token
curl http://127.0.0.1:8765/healthz             # -> ok
```

Why not stdio: an stdio server is a **child process of the agent**, so when it
dies the connection stays dead for the rest of the session. Over HTTP it
reconnects, survives session restarts, and one daemon serves **every** agent
instance at once — every target, all repos, all worktrees, in parallel
(mempalace serializes concurrent writes). Its logs are also yours to read, which
is what makes a flaky memory layer diagnosable.

**If you also install the upstream plugin, turn its stdio server off.** Nothing
here installs it any more, but the upstream `mempalace` plugin bundles
`{"command": "mempalace-mcp"}`, and mempalace holds a **single writer lease** —
its docs are explicit that two server processes must not point at the same
backend. Toggle it off in `/mcp`; Claude Code records that in `~/.claude.json`
under `disabledMcpServers` (which covers plugin servers). The toggle is per
project. Confirm with `/mcp` that exactly **one** mempalace server is connected.

**Keeping it alive.** The property that matters is restart-on-crash, since a
dead daemon is the failure you are designing out. Docker gives it with one key
(`restart: unless-stopped`); `launchd` gives it on macOS with `KeepAlive`;
[pitchfork](https://pitchfork.jdx.dev) has the nicest ergonomics (`run` / `list`
/ `logs` / `stop`) but its quickstart documents **no supervision**, and its
shell hook starts daemons on *directory entry* — the wrong shape for an
always-on service, so verify before relying on it. Upstream also ships
`deploy/mempalace-server.service` for systemd (Linux only).

### Docker (local, single user)

Upstream's `deploy/docker-compose.server.yml` is **team mode** — Qdrant,
`0.0.0.0`, bearer token. Solo and local, none of that is needed:

```yaml
services:
  mempalace:
    image: ghcr.io/mempalace/mempalace:latest
    restart: unless-stopped
    command: [ serve, --host, "0.0.0.0", --port, "8765", --allow-insecure ]
    ports:
      - "127.0.0.1:8765:8765" # loopback only — unreachable off this host
    volumes:
      - ${HOME}/.mempalace:/data/.mempalace # the existing palace
      - mempalace-cache:/data/.cache # embedding model, else re-downloads
    healthcheck:
      test: [
        CMD,
        python,
        -c,
        "import urllib.request,sys; sys.exit(0) if urllib.request.urlopen('http://127.0.0.1:8765/healthz').read().strip()==b'ok' else sys.exit(1)",
      ]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 40s

volumes:
  mempalace-cache:
```

Three things that are easy to get wrong:

- **Mount to `/data/.mempalace`, not `/data`.** The image sets `HOME=/data`, so
  the palace lives at `$HOME/.mempalace`. Mounting at `/data` yields a silently
  **empty** palace with the real one nested a level too deep.
- **`--allow-insecure` is required here, and is safe.** Docker port publishing
  only works if the process binds `0.0.0.0` *inside* the container, and
  mempalace refuses a non-loopback bind without a token unless this is passed.
  The actual boundary is `127.0.0.1:8765:8765` — nothing off the host can reach
  it, the same exposure as the palace already readable at `~/.mempalace`. A
  token would mean committing a secret to the manifest, which is worse.
- **The cache volume is not optional in practice.** The embedding model (~80 MB,
  ChromaDB's `minilm`) lazy-downloads under `$HOME/.cache` on first use; without
  a volume it re-downloads on every container recreate.

Run **one** server: stop any host-side `mempalace serve`, and mine through the
container (`docker compose exec mempalace mempalace mine …`) rather than from
the host, so nothing else touches the palace while the server holds its writer
lease.

If `docker pull` returns 401, the published image isn't reachable — build from a
clone instead (`docker build -t mempalace .`; the upstream `Dockerfile` is a
standard multi-stage uv build) and point `image:` at your local tag. The
container runs as uid 1000, which is transparent under VirtioFS on macOS but is
the first thing to check if writes fail.

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
| `doctor`    | `/vwf:doctor` findings per run, so a still-present one reports as *known* instead of being rediscovered                                    |
| `handoff`   | session handoffs for `/vwf:handoff` and `/vwf:recall`                                                                                      |

That set is **closed at seven**. mempalace creates a room implicitly on first
write, so a mistyped name succeeds silently and every later recall against the
real room comes back empty — which is why `/vwf:doctor` §7 checks each repo's
`mempalace.yaml` for exactly these, and flags near-misses (`decision`, `run`,
`handoffs`) as their own finding.

Memory is best-effort: if mempalace is unavailable, `vwf` skips every memory
step and proceeds. The one exception is `/vwf:handoff` and `/vwf:recall` — the
handoff *is* the deliverable, so when mempalace is down they fall back to
`docs/memory/handoff/<name>.md` on disk instead of skipping. The reserved `next`
handoff (written by a bare `/vwf:handoff`, resumed by `/vwf:recall next`) goes
further: it always writes **both** the drawer and the committed
`docs/memory/handoff/next.md`, so it survives an outage without a fallback path.

## See also

- [../readme.md](../readme.md) — the marketplace overview and full plugin list.
- [vwf](./vwf.md) — how the Product → Blueprint → Plan → Execute workflow uses
  memory, and the `assets/memory.md` protocol that is authoritative for it.
- [andrej-karpathy-skills](./andrej-karpathy-skills.md) — the one url-sourced
  `vwf` dependency that remains.
- [MemPalace upstream](https://github.com/MemPalace/mempalace) — full feature
  and tool documentation.
