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

`mempalace` is **user-level only** on both platforms — per-user memory has no
per-project install, so a `--project mempalace` request is redirected to user
scope with a note.

For **OpenCode**, `--platform opencode --user mempalace` (or installing `vwf`)
fetches the upstream repo and installs: its two skills, the `mempalace` MCP
server in the OpenCode config (launched as `mise x -- mempalace-mcp`), and an
OpenCode plugin (`plugin/mempalace-hooks.js`) that ports the Claude auto-save
hooks — a save checkpoint every 15 user messages (on `session.idle`) and a
safety save after compaction, honoring the same opt-out
(`MEMPALACE_HOOKS_AUTO_SAVE=false` or `hooks.auto_save` in
`~/.mempalace/config.json`). The Claude `SessionEnd` hook has no OpenCode
equivalent — the interval saves cover it.

## Running the server (HTTP daemon)

`vwf` declares mempalace over **HTTP**, not stdio — see its `mcpServers` block
in `templates/vwf/plugin.yaml`. You run the server yourself:

```sh
mempalace serve --host 127.0.0.1 --port 8765   # loopback bind needs no token
curl http://127.0.0.1:8765/healthz             # -> ok
```

Why not stdio: an stdio server is a **child process of Claude Code**, so when it
dies the connection stays dead for the rest of the session. Over HTTP it
reconnects, survives session restarts, and one daemon serves **every** Claude
Code instance at once — all repos, all worktrees, in parallel (mempalace
serializes concurrent writes). Its logs are also yours to read, which is what
makes a flaky memory layer diagnosable.

**Turn the plugin's own stdio server off.** The upstream `mempalace` plugin
bundles `{"command": "mempalace-mcp"}`, and mempalace holds a **single writer
lease** — its docs are explicit that two server processes must not point at the
same backend. Toggle it off in `/mcp`; Claude Code records that in
`~/.claude.json` under `disabledMcpServers` (which covers plugin servers) and
the plugin, including its skills, stays installed. The toggle is per project.
Confirm with `/mcp` that exactly **one** mempalace server is connected.

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
  token would mean committing a secret to `plugin.json`, which is worse.
- **The cache volume is not optional in practice.** The embedding model (~80 MB,
  ChromaDB's `minilm`) lazy-downloads under `$HOME/.cache` on first use; without
  a volume it re-downloads on every container recreate.

Run **one** server: stop any host-side `mempalace serve`, keep the mempalace
plugin's stdio server toggled off, and mine through the container
(`docker compose exec mempalace mempalace mine …`) rather than from the host, so
nothing else touches the palace while the server holds its writer lease.

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
- [vwf guide](../readme.md) — how the Product → Blueprint → Plan → Execute
  workflow uses memory.
- [MemPalace upstream](https://github.com/MemPalace/mempalace) — full feature
  and tool documentation.
