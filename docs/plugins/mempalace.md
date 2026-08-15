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
and the `integrations/` tree. `vwf` declares the server itself; the daemon is
installed out-of-band by whatever tool manager the machine uses, and `vwf`
neither installs nor supervises it. `uv` **is** one of `vwf`'s `requires:`, but
for **graphify's** Python runtime — `templates/vwf/plugin.yaml` says so in the
comment beside the entry. It is not there for mempalace, whichever installer you
reach for.

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
mempalace-mcp --transport http --host 127.0.0.1 --port 8765
curl http://127.0.0.1:8765/healthz   # -> ok
```

No palace or backend flags: the daemon is configured through
`~/.mempalace/config.json` and `MEMPALACE_*` environment variables — env takes
precedence. See the supervisor-env section below for why the file matters.

Why not stdio: an stdio server is a **child process of the agent**, so when it
dies the connection stays dead for the rest of the session. Over HTTP it
reconnects, survives session restarts, and one daemon serves **every** agent
instance at once — every target, all repos, all worktrees, in parallel. Its logs
are also yours to read, which is what makes a flaky memory layer diagnosable.

The other half of the reason is that the palace keeps local JSON state beside
the store — `hallways.json` and the tunnel file — which is rewritten whole with
no lock. One daemon serializes those writes in-process; N stdio processes race
and last-writer-wins silently drops entity edges. That holds on **every**
backend, including ones like Qdrant that coordinate concurrent clients
themselves and so never take mempalace's writer lease.

`mempalace-mcp`, not `mempalace serve`: `serve` forks the real server as a child
and holds PID 1 itself, so under a supervisor the server never sees `SIGTERM`.

### The shape that runs

One **host daemon** and one **container** — which is worth stating plainly,
because it is the reverse of what upstream's deploy manifests imply and the
reverse of what this page used to describe:

| Piece           | Runs as                                                              | Where                       |
| --------------- | -------------------------------------------------------------------- | --------------------------- |
| `mempalace-mcp` | a supervised **host process** (mempalace 3.7.0), HTTP on loopback    | `127.0.0.1:8765`            |
| Qdrant          | the **only** container — one `docker compose` service, loopback-only | `127.0.0.1:6333`            |
| The palace      | a directory of config + backend metadata (vectors live in Qdrant)    | `~/.local/share/mempalace`  |
| Mining          | the **host CLI**                                                     | run in the repo being mined |

**There is no mempalace container**, so any instruction of the form
`docker compose exec mempalace mempalace mine …` cannot work — mining is the
host CLI, run from the repo root (see [Mining](#mining) below).

The supervisor in practice is [pitchfork](https://pitchfork.jdx.dev): two
daemons, the MCP server declaring `depends = ["mempalace-qdrant"]` so Qdrant is
up first, both with `retry = true` and a readiness probe
(`ready_http = "http://127.0.0.1:8765/healthz"` for the server, `ready_port` for
Qdrant). Restart-on-crash is the property that matters — a dead daemon is the
failure the HTTP transport exists to survive — and any supervisor that gives you
that will do; the reference wiring lives in `dotfiles/pitchfork/config.toml`.

Qdrant is bound `127.0.0.1:6333`, never bare `6333:6333` (which binds `0.0.0.0`
and publishes the vector store to the network), and its storage is a **bind
mount** rather than a named volume, so the vectors survive even a compose
teardown that removes volumes.

### Backend: `MEMPALACE_BACKEND` and `MEMPALACE_QDRANT_URL` are a pair

**Qdrant is not "team mode".** It is a legitimate single-user backend and the
one this setup runs: a real vector database rather than a SQLite file, which is
what keeps search latency flat as the palace grows past a few thousand drawers
and lets a collection be inspected, counted and backed up with `curl`. The
ChromaDB default is genuinely fine for a small palace and needs no container at
all — that is the trade, not solo-versus-team.

If you choose Qdrant, set **both** variables:

```sh
MEMPALACE_BACKEND=qdrant
MEMPALACE_QDRANT_URL=http://127.0.0.1:6333
```

In practice the whole `MEMPALACE_*` set — these two plus
`MEMPALACE_PALACE_PATH`, `MEMPALACE_MAX_BACKUPS` and
`MEMPALACE_MCP_HTTP_ALLOW_INSECURE_NO_TOKEN` (what lets the loopback daemon run
tokenless) — lives in the global mise config's `[env]`, or the shell's startup
script; `~/.mempalace/config.json` carries the same facts as the file-based
fallback, and env wins when both are present. The vendored `mempalace` skill's
Prerequisites is the authoritative statement of this setup.

Setting the URL **without** the backend key **silently selects ChromaDB.** The
backend key is what chooses the backend; its default is `chroma`, and the unused
URL is not an error. This is the highest-cost trap in the area: it wrote 11,437
drawers into a 71 MB `chroma.sqlite3` and then left the server refusing to start
with a *backend mismatch*, because the palace directory had recorded one backend
and the process was asking for another. Nothing complained on the way in.

### The palace path string *is* the palace identity

Each palace directory holds a `qdrant_backend.json` recording:

```json
{
  "backend": "qdrant",
  "palace_id": "/Users/you/.local/share/mempalace",
  "qdrant": {
    "url": "http://127.0.0.1:6333",
    "palace_hash": "c0655d864595323b",
    "remote_prefix": "mempalace_c0655d864595323b"
  }
}
```

`palace_id` is the **absolute path as a string**, `palace_hash` is derived from
it, and `remote_prefix` names the Qdrant collections
(`mempalace_<hash>_mempalace_drawers`). Two processes therefore share a palace
only if the path **and** the URL strings match **exactly**. Four distinct
palaces were created in a single evening by four different spellings of the same
directory. **Never type a palace path by hand** — pass one canonical absolute
path, from one place, to everything that opens the palace.

### The supervisor-env trap (and the `~` that caused it)

A supervised daemon inherits its **supervisor's** environment, captured when the
supervisor started. So fixing a variable in your shell config and restarting the
*daemon* changes nothing — you must restart the **supervisor**. The resolution
is `~/.mempalace/config.json`: the daemon reads the file fresh on start whatever
environment it inherited, so the palace path, the backend and the qdrant URL
live there —

```json
{
  "palace_path": "/Users/you/.local/share/mempalace",
  "collection_name": "mempalace_drawers",
  "backend": "qdrant",
  "qdrant_url": "http://127.0.0.1:6333"
}
```

— with `MEMPALACE_*` environment variables overriding it when present. A
flagless run line plus the config file beats baking flags into the supervisor's
run string: the file is one canonical spelling, editable without touching the
supervisor.

Underneath this sits a plain shell fact worth stating outright: **`~` is
expanded only for unquoted text typed in a command, never for text arriving from
a variable.** A quoted `'~/.local/share/mempalace'` keeps its `~` as an ordinary
character, so it is a *relative* path, resolved **against the daemon's working
directory** — which is how a directory literally named
`~/.config/pitchfork/~/.local/share/mempalace/` came to exist, holding a fourth
empty palace. Use `$HOME`, or an absolute path.

### Reads fail loudly; writes fail silently

The single most important operational fact here. When the wiring is wrong:

- `mempalace_status` **errors clearly** — wrong backend, unreachable Qdrant,
  mismatched palace. Reads are the honest surface.
- `mempalace_diary_write` returned `"success": true` while creating a brand-new
  ChromaDB in a junk directory. `/healthz` and the MCP `initialize` handshake
  also pass in that state, because neither one opens the palace.

**A successful write is never evidence that the memory layer works.** Verify
with `mempalace_status` *plus* a point count straight from the store:

```sh
curl -s http://127.0.0.1:6333/collections   # the collection names
curl -s http://127.0.0.1:6333/collections/mempalace_<hash>_mempalace_drawers \
  | jq .result.points_count
```

### Mining

Mining is the **host CLI**, run in the repo:

```sh
mise x "pipx:mempalace@latest" -- mempalace mine .
```

It reads `mempalace.yaml` from the directory it is pointed at and **nowhere
else** — not `.config/`, not a parent, and there is no flag to name one. A
config anywhere else is silently inert: the mine runs, reports that it found no
config and is using auto-detected defaults, and files everything into `general`.
That is why `vwf` requires exactly one config, at the repo root, and why
`/vwf:doctor` treats a second one or a misplaced one as **blocking**.

Mining **honours `.gitignore` by default** (there is a flag to disable it; do
not use it on a repo), and `mempalace sync` prunes drawers whose source files
were gitignored, deleted or moved. Both of those work on the `source_path` each
drawer records, which is why you mine the **checkout itself** and never an
export or a copy — a copy points every recall at a path that does not exist and
breaks the prune.

### If you also install the upstream plugin, turn its stdio server off

Nothing here installs it any more, but the upstream `mempalace` plugin bundles
`{"command": "mempalace-mcp"}`, and its docs are explicit that two server
processes must not point at the same backend. On Chroma that is a **single
writer lease**; on Qdrant the lease is never taken (the backend coordinates its
own clients), but a second server is still wrong — the palace's local JSON state
beside the store, `hallways.json` and the tunnel file, is rewritten whole with
no lock, so two writers silently drop each other's entity edges. Toggle it off
in `/mcp`; Claude Code records that in `~/.claude.json` under
`disabledMcpServers` (which covers plugin servers). The toggle is per project.
Confirm with `/mcp` that exactly **one** mempalace server is connected.

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
real room comes back empty — which is why `/vwf:doctor` §7 checks the product's
`mempalace.yaml` for exactly these, and flags near-misses (`decision`, `run`,
`handoffs`, `plans` for `planning`) as their own finding. That is not
hypothetical: a live palace was found holding 13,312 mined drawers across eight
path-derived rooms and **not one** of the seven, so everything `vwf` wrote to it
had been landing in a room nothing ever read back.

A product has **exactly one** `mempalace.yaml`, at its repo root, mining the
whole tree including submodules — mining reads the config only from the
directory it is pointed at, so a second copy or a misplaced one is silently
inert rather than merely wrong, and `/vwf:doctor` reports either as
**blocking**. Its `exclude_patterns` carries a secret denylist as a backstop
behind `.gitignore`; the protocol is `templates/vwf/assets/memory.md`.

Memory is best-effort: if mempalace is unavailable, `vwf` skips every memory
step and proceeds. The one exception is `/vwf:handoff` and `/vwf:recall` — the
handoff *is* the deliverable, so when mempalace is down they fall back to
`docs/memory/handoff/<name>.md` on disk instead of skipping. The reserved `next`
handoff (written by a bare `/vwf:handoff`, resumed by `/vwf:recall next`) goes
further: it always writes **both** the drawer and `docs/memory/handoff/next.md`
(gitignored — a handoff is personal), so it survives an outage without a
fallback path.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and full plugin
  list.
- [vwf](./vwf.md) — how the Product → Blueprint → Plan → Execute workflow uses
  memory, and the `assets/memory.md` protocol that is authoritative for it.
- [karpathy-guidelines](./karpathy-guidelines.md) — the other vendored skill,
  folded into `vwf` for the same reason.
- [MemPalace upstream](https://github.com/MemPalace/mempalace) — full feature
  and tool documentation.
