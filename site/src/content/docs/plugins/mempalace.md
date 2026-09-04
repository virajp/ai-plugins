---
title: "mempalace"
description: "The AI memory system that backs vwf's cross-session memory, now folded into vwf itself rather than installed as a plugin."
order: 3
---

`mempalace` is an AI memory system — it mines projects and conversations into a
searchable "memory palace" so an agent can recall past decisions and findings
across sessions. It ships MCP tools and guided setup, and it is what backs
`vwf`'s cross-session memory.

**It is not a plugin in this marketplace.** It was one — a `url`-sourced
re-listing of the upstream repo, and a `vwf` dependency — until its memory layer
was folded into `vwf` itself. Two skills are now vendored under
`plugins/vwf/skills/`, the auto-save hooks are reimplemented in `vwf`, and the
MCP server is declared by `vwf`. There is nothing to install by name.

It is still maintained externally at
[MemPalace/mempalace](https://github.com/MemPalace/mempalace), under MIT.
Provenance, the version taken, the local edits and the resync policy are
recorded in `plugins/vwf/vendor/mempalace/`, which ships with the plugin.

## Why it is vendored

**The argument that first forced this is historical, and worth naming as such so
nobody re-litigates the decision against it.** This repo used to render one
plugin tree per agent, and a url-sourced plugin had no rendered tree to render —
so the OpenCode adapter, which could only copy one, skipped it. OpenCode users
got no memory layer at all, silently: the plugin was listed, the install printed
a skip note, and the thing `vwf` leans on hardest was simply absent. There is no
OpenCode adapter now, and no rendered trees; that failure mode is gone with
them.

What keeps the vendoring is a set of properties a re-listing never had:

- **The provenance travels with the code.** The version taken, the licence
  position, the local edits and the resync policy sit in
  `plugins/vwf/vendor/mempalace/`, inside the plugin a user installs — so the
  question "which upstream is this, and what was changed" is answerable from the
  install rather than from this repo's history.
- **Nothing has to be reachable at install time for memory to work.** The skills
  are files in the plugin. A dependency resolved from a URL is one more thing
  that can be moved, renamed or rate-limited between the day this ships and the
  day someone installs it.
- **A url source pins every reader to whatever ref it happened to resolve.** Two
  machines installing `vwf` a month apart could get different memory skills,
  with nothing in either install saying which. A vendored copy is one version,
  visible in review and diffable in a pull request.

It is a deliberate one-time fork, not a mirror and not a submodule — nothing
automated watches upstream, so the **Version taken** row in
`plugins/vwf/vendor/mempalace/README.md` is the only thing that makes drift
detectable, and it is the one edit a resync must not skip.

## Skills

Two, both from upstream, now shipped as `vwf` skills:

| Skill                   | What it does                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `/vwf:mempalace`        | Setup and mining — wings, rooms, drawers; turning projects and conversations into the palace. |
| `/vwf:mempalace-recall` | The recall protocol — search the palace before answering about past work or prior decisions.  |

Deliberately **not** taken: the Python package, the MCP server implementation,
and the `integrations/` tree. `vwf` declares the server itself; the daemon is
installed out-of-band by whatever tool manager the machine uses, and `vwf`
neither installs nor supervises it.

**Nothing checks for the daemon at install time**, and nothing ever will: the
install-time binary gate is retired, so `vwf` installs on a machine with no
mempalace on it and says nothing. That is the right shape — memory is
best-effort, and a missing daemon degrades rather than breaks. What does report
it is `/vwf:doctor`, which checks the memory **files** even when the server is
unreachable. The one Python-toolchain prerequisite `vwf` genuinely leans on
belongs to **graphify**, not to mempalace, and doctor §8 treats a missing
`graphify` CLI as a **blocking** finding with
`mise use -g pipx:graphifyy@latest` as the remedy.

## Auto-save

Upstream ships an auto-save hook; `vwf` **reimplements** it rather than
vendoring it. The reason used to be reach — upstream counts human messages by
parsing `transcript_path`, a Claude Code JSONL transcript, and no other agent
had one — and that argument is spent now that Claude Code is the only agent
here.

The conclusion outlives it, on three narrower grounds. Counting *stops* in a
state file needs nothing from the payload but a session id, where parsing a
transcript needs the transcript to exist, to be readable, and to keep its
current shape across Claude Code releases; it is **simpler**, in the sense that
there is less of it to be wrong; and it is what the tests actually cover
(`installer/src/mempalace-checkpoint-script.test.ts` drives the script
directly). Wrapping upstream's would mean owning a JSONL format nobody here
controls in order to answer a question a counter already answers.

The two shell hooks, declared in `plugins/vwf/hooks/hooks.json`, are all there
is:

- **`hooks/mempalace-checkpoint.sh`** — POSIX sh, on the `Stop` event. It counts
  stops in a state file under `$XDG_STATE_HOME/ai-plugins/mempalace`. Every 15th
  stop (`MEMPALACE_SAVE_INTERVAL` overrides) it asks the model to write a diary
  entry and persist it through the mempalace MCP tools. A payload carrying
  `stop_hook_active: true` resets the counter and passes, so a save cycle cannot
  re-trigger itself.
- **`hooks/mempalace-precompact.sh`** — the `PreCompact` half: always speaks,
  and resets the count. It is a one-line `exec` wrapper passing `--compact`
  rather than an argument in the hook declaration. That began as a constraint of
  the retired neutral hook schema, which named a script and passed it nothing;
  with hooks authored directly as `hooks.json` an argument is expressible, so
  this is now merely how it is — collapsing the two entries into one would be a
  fine simplification, and the tests cover the behaviour either way.

Both honour mempalace's own opt-out, so a user who turned auto-save off upstream
stays off here: `MEMPALACE_HOOKS_AUTO_SAVE=false|0|no`, or
`{"hooks": {"auto_save": false}}` in `~/.mempalace/config.json`. The config is
read with a substring test rather than a JSON parse — `jq` is not a dependency
of this toolkit — and a malformed config reads as *enabled*, which is the safe
direction: it saves too often rather than silently never.

Both are POSIX sh with BSD-portable tooling only, because they run on macOS,
where `sed` has no `\s`/`\b` and `grep -P` does not exist.

## Running the server (HTTP daemon)

`vwf` declares mempalace over **HTTP**, not stdio — see its `mcpServers` block
in `plugins/vwf/.claude-plugin/plugin.json`. You run the server yourself:

```sh
mempalace-mcp --transport http --host 127.0.0.1 --port 8765
curl http://127.0.0.1:8765/healthz   # -> ok
```

No palace or backend flags: the daemon is configured through
`~/.mempalace/config.json` and `MEMPALACE_*` environment variables — with a
per-setting precedence flip documented in the backend section below. See the
supervisor-env section for why the file matters.

Why not stdio: an stdio server is a **child process of the agent**, so when it
dies the connection stays dead for the rest of the session. Over HTTP it
reconnects, survives session restarts, and one daemon serves **every** Claude
Code instance at once — all repos, all worktrees, in parallel. Its logs are also
yours to read, which is what makes a flaky memory layer diagnosable.

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
script, with `~/.mempalace/config.json` carrying the same facts. The vendored
`mempalace` skill's Prerequisites is the authoritative statement of this setup.

**Which source wins differs by setting — the fact to reach for when debugging:**

- **Choosing the backend:** `--backend` flag → config.json `"backend"` →
  `MEMPALACE_BACKEND` → default `chroma`. The **file beats env**, so an env var
  cannot override a `"backend"` key the file already carries — and with neither
  present, the silent default is chroma.
- **Qdrant connection settings** (`qdrant_url`, `qdrant_api_key`,
  `qdrant_namespace`, `qdrant_timeout`): `MEMPALACE_QDRANT_*` env → config.json
  → defaults (`http://localhost:6333`, 10 s timeout). **Env beats the file** —
  the reverse of the backend choice.

Keeping the file and the env stating identical values is what makes the flip
unobservable; the moment they disagree, which side wins depends on which setting
you are looking at.

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
*daemon* changes nothing — you must restart the **supervisor**. The partial
resolution is `~/.mempalace/config.json`: the daemon reads the file fresh on
start whatever environment it inherited, so the palace path, the backend and the
qdrant URL live there —

```json
{
  "palace_path": "/Users/you/.local/share/mempalace",
  "collection_name": "mempalace_drawers",
  "backend": "qdrant",
  "qdrant_url": "http://127.0.0.1:6333"
}
```

— but *partial* because of the precedence flip above: the file settles the
backend choice outright, while a stale `MEMPALACE_QDRANT_*` variable in the
supervisor's captured environment still **outranks** the file for connection
settings. A daemon talking to the wrong qdrant despite a correct config.json is
this trap — restart the supervisor. A flagless run line plus the config file
still beats baking flags into the supervisor's run string: the file is one
canonical spelling, editable without touching the supervisor.

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
behind `.gitignore`; the protocol is `plugins/vwf/assets/memory.md`.

Memory is best-effort: if mempalace is unavailable, `vwf` skips every memory
step and proceeds. The one exception is `/vwf:handoff` and `/vwf:recall` — the
handoff *is* the deliverable, so when mempalace is down they fall back to
`docs/memory/handoff/<name>.md` on disk instead of skipping. The reserved `next`
handoff (written by a bare `/vwf:handoff`, resumed by `/vwf:recall next`) goes
further: it always writes **both** the drawer and `docs/memory/handoff/next.md`
(gitignored — a handoff is personal), so it survives an outage without a
fallback path.

## See also

- [readme.md](https://github.com/virajp/claude-plugins/blob/main/readme.md) —
  the marketplace overview and full plugin list.
- [vwf](./vwf.md) — how the Product → Blueprint → Plan → Execute workflow uses
  memory, and the `assets/memory.md` protocol that is authoritative for it.
- [karpathy-guidelines](./karpathy-guidelines.md) — the other vendored skill,
  folded into `vwf` on the same reasoning.
- [MemPalace upstream](https://github.com/MemPalace/mempalace) — full feature
  and tool documentation.
