# vwf's dependencies, and the vendored code

Why vwf depends on exactly one plugin, what the retired dependencies became, and
why the memory layer and the Karpathy guidelines are vendored rather than
depended on.

## Dependencies

`vwf` depends on one plugin — `stackgen` — **resolved from the `virajp-plugins`
marketplace itself**, so installing `vwf` needs no other marketplace registered.
It is authored here.

**`stackgen` is a dependency because without it the stack menu is empty.** The
six stack axes are closed to what the installed stack plugins declare, and since
`config_format` 14 there is no *other (describe)* escape. Since 16 that is no
longer a dead end — the user can defer the axis as `unresolved` and keep
defining the product — but deferral only moves the wall: `plan` and `execute`
halt on an unresolved axis, so with no stack plugin installed nothing can be
built. The `devtools` plugin's adapter retired in Wave C, which left vwf
shipping with no answer to its own menu, and `devtools` itself has since
dissolved into stackgen. stackgen is the general-purpose stack plugin, so it is
the one that closes it. **Installing is not using**: stackgen acts only when an
axis is pinned, so a user adopting vwf first and choosing a stack later pays
nothing for having it present.

`mempalace` and `andrej-karpathy-skills` used to be on that list and are gone as
plugins: vwf **vendored** their skills. That is the one place third-party code
is vendored into this repo, and it buys something a dependency could not — see
The memory layer and The vendored guidelines below.

**stackgen is load-bearing at `init` too, not only at `architecture`.**
`/vwf:init` materializes three **unconditional** bundles through the stack
adapter, by the fixed slugs `mise`, `repo-gates` and `repo-hygiene` — the
toolchain manager and the repo gates the `devtools` plugin used to scaffold,
plus the hygiene files that had no home at all. Fixed rather than constructed,
because a name assembled from configuration can silently resolve to nothing,
which is the same failure a skill vwf cannot see already has. With no stack
adapter installed, `init` **halts** with the install command rather than
printing an empty plan that reads like an already-shaped repo. `/vwf:setup` no
longer fetches any of them: it checks the adapter's lockfile for all three and
offers `/vwf:init`, which is why `init` is model-invocable. Note that `mise`
legitimately appears in two different meanings: the **bundle** slug stackgen
materializes, and the **binary** `mise`, which is a mandate `/vwf:doctor` blocks
on once a stack axis is pinned.

**Required binaries are no longer gated at install time.** A plugin used to
declare `requires:`, and the CLI computed the union over the dependency-expanded
set and refused the install — explicitly not overridable by `--force`. That gate
stayed retired when the CLI's plugin installs came back as a thin wrapper.

**Doctor does not fully replace it, and the gap is worth stating precisely.** Of
the five binaries vwf shells out to, `/vwf:doctor` blocks on **`graphify` always
and `mise` conditionally** — since `config_format` 16 a missing `mise` is
blocking only once some axis in the repo is pinned or some harness capability is
claimed, and a degradation before that, since a repo with no stack has no
toolchain to resolve. A missing language server is an ordinary finding; `uv` is
named as a prerequisite of graphify's remedy rather than checked on its own; a
missing `rtk` is a **degradation** finding in §5 — its hook is guarded, so the
run is correct and merely costs more — and the **Context7 runner is not checked
at all**, a missing one surfacing as a dead MCP server. That runner is
`pnpm
dlx` by default and `${CONTEXT7_RUNNER}` overrides it, so what a check
would have to verify is whatever the user pinned, not `pnpm`.

So the trade is slightly worse than "doctor already blocked on it": one of five
blocks always, one once a stack is pinned, one degrades, one is named only as
another's remedy, and one is silent. It was still worth taking —
`claude plugin
install vwf` cannot now fail for a reason the user did not ask
about — but `readme.md`'s caveat states the gap rather than implying doctor
covers it, and that is the honest version. **If a Context7-runner check is ever
added to doctor, this paragraph is what should shrink.**

`markdown` and `context7` used to be on that list and are gone as plugins: vwf
**absorbed** them. Their two skills (`documentation-standards`, `readme`) are
vwf skills now, and the Context7 docs server is one of vwf's two `mcpServers`.
Both were authored here, required by the workflow, and useful only alongside it
— a separate plugin bought nothing but a dependency edge. `/markdown:readme` is
therefore `/vwf:readme`, and vwf-only; that is intended.

The dependency list is declared in **one** place —
`plugins/vwf/.claude-plugin/plugin.json` — and the marketplace entry is
generated from it, so the two can no longer drift. (They were once separate
files kept in sync by hand, which is what `plugins:check` used to compare.) The
checker now verifies each name resolves to a real plugin instead.

**`design-tools` is gone entirely, and vwf now names no design tool at all.**
Its three import skills became vwf's own in Wave C — `/vwf:import-screens`,
`/vwf:import-design-system`, `/vwf:import-conversations`, invoked only when a
project declares a `design:` tool. Wave D finished the job: the three per-tool
references left vwf for stackgen `design-tool` packs, and the manifest that
carried the Claude Design MCP server was deleted once `.mcp.json` became a
permitted target.

The seam is **two hops of fixed names**, and no constructed name anywhere. vwf
calls its own three skills; those delegate to three more fixed names in the
repo's own `.claude/` — `design-import-screens`, `design-import-design-system`,
`design-import-conversations` — which is what the project's `design:` pin
materializes. It is the same mechanism that dissolved `<plugin>-ux-gate`, reused
rather than reinvented.

Two consequences worth knowing. **The technology-free guard's allowlist got
smaller, not bigger** — the three exceptions those references needed are
retired, which is the intended direction whenever an entry stops feeling
arguable. And **the guard's MCP rule was generalized**: it matched the
plugin-scoped `mcp__plugin_design-tools_` prefix, which a project-scoped
`.mcp.json` server never produces, so matching only that would have quietly
stopped catching anything.

**There is no CI dependency edge at all any more.** vwf owns the
delivery-pipeline **contract** (`assets/delivery-pipeline.md`), which states
what a deploy must guarantee and names no mechanism; the mechanism belongs to
whichever CI system the project's `cicd` axis pins — since the `cicd` plugin
dissolved, a `stackgen` `ci-system` bundle behind
`contracts/release-trigger.md`. Nothing in vwf delegates to it, so nothing in
vwf has to force an install.

When `vwf` is enabled, Claude Code (≥ 2.1.143) **auto-installs and
auto-enables** these dependencies at the same scope. Key rules:

- **A new dep is one edit, not two.** Add a `{marketplace, name}` entry to
  `dependencies` in `plugins/vwf/.claude-plugin/plugin.json`; the marketplace
  entry is generated from it. Keep it inside `virajp-plugins`: a
  cross-marketplace dep is blocked at install time unless the **root**
  marketplace allowlists it via `allowCrossMarketplaceDependenciesOn`.
- **Auto-enable is event-driven**, firing only when the parent (`vwf`) is
  enabled — not on a continuous reconcile. If a dependency is later disabled on
  its own, re-enable it directly or toggle `vwf` off/on.

### The memory layer: vendored skills, vwf's server

The memory layer arrives in three pieces, from three different places, and it is
worth knowing which is which: **the skills are vendored**, **the MCP server is
declared by vwf**, and **the daemon is a process you run yourself**.

**Why vendored rather than depended on.** `mempalace` was a `url`-sourced entry
and a vwf dependency, and a url-sourced plugin had no rendered bundle for the
OpenCode adapter to copy — so **OpenCode users got no memory layer at all**,
silently: the plugin was listed, the install printed a skip note, and the thing
vwf leans on hardest was simply absent.

That reason is now historical, since there is one tree and one target. **The
vendoring stays**, and on its own merits: the provenance travels with the code,
nothing has to be reachable at install time for memory to work, and a url source
would pin every reader to whatever ref it resolved. Do not undo it on the
grounds that the original argument expired.

What was taken is **two skills and nothing else** — not the Python package, not
the server implementation, not `integrations/`. Provenance, the version taken,
the MIT licence, the local edits and the resync policy live in
`plugins/vwf/vendor/mempalace/`, which ships with the plugin. It is a one-time
fork, deliberately re-synced: nothing watches upstream, so the **Version taken**
row is the only thing that makes drift detectable, and it is the one edit a
resync must not skip.

**The auto-save hooks are reimplemented, not vendored** — see Hooks below for
why upstream's could not be wrapped.

vwf declares its own mempalace server in its `plugin.json` — `"type": "http"`
against `http://127.0.0.1:8765/mcp` — so the memory layer is a **long-lived
process you run yourself**, not a stdio subprocess Claude Code owns:

```sh
mempalace-mcp --transport http --host 127.0.0.1 --port 8765
```

Not `mempalace serve`: `serve` forks the real server as a child and holds PID 1
itself, so under a supervisor the server never sees `SIGTERM`. The daemon needs
no flags: it is configured through `~/.mempalace/config.json` (palace path,
`backend: qdrant`, the qdrant URL) plus `MEMPALACE_*` environment variables —
and the precedence **differs by setting**, which is the fact to reach for when
debugging. The backend choice runs `--backend` flag → config.json →
`MEMPALACE_BACKEND` → chroma default (**file beats env**); the qdrant connection
settings run `MEMPALACE_QDRANT_*` → config.json → defaults
(`http://localhost:6333`, 10 s) (**env beats file**). So the file is what a
supervised daemon reliably reads for the backend — but a stale
`MEMPALACE_QDRANT_URL` in the *supervisor's* inherited environment still
outranks a correct file, and fixing it means restarting the supervisor, not the
daemon. Keep file and env stating the same values so the flip never bites.
`MEMPALACE_MCP_HTTP_ALLOW_INSECURE_NO_TOKEN=1` is what lets the loopback daemon
run tokenless. The full setup — the mise-managed install, the qdrant container,
the config file and the env set — is the `mempalace` skill's Prerequisites,
which is authoritative for it.

Why: an stdio server is a child of the client, so when it dies the connection
stays dead for the rest of the session. Over HTTP it reconnects, it survives
session restarts, one daemon serves **every** Claude Code instance (all repos,
all worktrees, in parallel), and its logs are yours to read.

**Single-writer is no longer part of that argument, which is exactly what makes
stdio look switchable again.** On Chroma a second writer corrupted the store; on
Qdrant `palace.py`'s `_MULTI_PROCESS_WRITER_BACKENDS` opts the backend out, so
`backend_requires_single_writer()` is false and the lease is never taken.
Concurrent processes are safe *at the store* — and stdio is still wrong, because
**`hallways.json` is a lockless read-modify-write**: `_save_hallways` replaces
the whole file atomically but takes no lock, so one daemon serializes those
writes in-process while N processes race and last-writer-wins silently drops
entity edges. It is local JSON beside the palace, which Qdrant never sees;
tunnels are the same shape. stdio would also spawn one server per session, each
holding its own ~140 MB embedder.

**If the upstream mempalace plugin is separately installed, its own stdio server
must be turned off** — for that same hallway race, and because its docs say so
(*"don't point two server processes at the same backend collection"*). Nothing
here installs it any more, so this only bites a user who adds it themselves.
Toggle it off in `/mcp` — Claude Code records that in `~/.claude.json` under
`disabledMcpServers`, which covers plugin servers. The toggle is recorded **per
project**. Confirm with `/mcp` that exactly one mempalace server is connected.

**Tool names are scoped to whichever plugin declares the server**, so the
execute subagents' `tools:` lists carry **both** —
`mcp__plugin_vwf_mempalace__*` (this manifest) and
`mcp__plugin_mempalace_mempalace__*` (the upstream plugin's stdio server). An
allowlist entry for a server that isn't connected is inert, so carrying both
means vwf works under either wiring — which is exactly the case above. **Drop
one and the subagents silently lose memory**: the orchestrator still has it, so
recall keeps working while the findings loop-back quietly stops persisting.

### The vendored guidelines

**The Karpathy guidelines were vendored for the same reason as memory**, and the
same reasoning applies to keeping them: `andrej-karpathy-skills` was
url-sourced, so three of the four targets installed `vwf` and got **none** of
the behavioural guidelines it assumes are on — each failing quietly. That
failure mode is gone with the targets; the vendoring stays because the
provenance travelling with the code is worth more than the dependency edge.

`karpathy-guidelines` ships under `plugins/vwf/skills/`, taken **verbatim**,
with provenance in `plugins/vwf/vendor/andrej-karpathy-skills/`. One local edit
was needed: the repo's lint gate requires a language on every fence, so one bare
fence became `text`. It is recorded under **Local edits**, which is the only
thing that makes vendor drift survivable — an unrecorded edit is silently
reverted by the next resync.

The licence position differs from mempalace's and the difference is deliberate.
Upstream declares MIT in its skill frontmatter and its `plugin.json`, but
**publishes no licence text** — GitHub reports the repo as unlicensed. So this
vendor directory carries a `NOTICE.md` quoting both declarations verbatim rather
than a `LICENSE` file. Shipping an MIT text the upstream author never published
would be worse than an honest note.
