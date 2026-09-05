# The Generated Output

Every artifact stackgen materializes lands **directly in the repo's
`.claude/` tree** — committed, repo-owned, and working for every collaborator
with no plugin installed. There is no intermediate tree and no symlink
wiring: what Claude Code discovers is what the repo owns.

The output vocabulary is **closed to four artifact kinds** plus stackgen's
own bookkeeping, one **tier-2 project file** — `.mcp.json` — a **fourth
target**, the repo config files a pack declares (below), and one **tier-3
target outside the repo entirely**: a generated local plugin on the
developer's machine (below).

LSP server configuration stays **excluded from the repo**: a language server
is a plugin-manifest feature no project file can express, so no `.claude/`
artifact and no `.mcp.json` key can carry one. The need still travels as
`language_facts` in the template payload for `/vwf:doctor` to read — that
tells doctor *how* a server is provided and provides nothing itself. What
actually provides one is the local plugin.

**`.mcp.json` was excluded and is not any more**, decided at Wave D. The
reasoning that changed: an MCP server is genuinely a project file — this
toolkit's own installer already treats `.mcp.json` as one of the user's
project files — and the alternative was a curated registry of servers, which
fails on **scaling** before it fails on charter. A list can only ever hold
what someone curated, and stackgen exists for the tail nobody curated. So a
pack that needs a server declares it, and the materializer writes it into the
project's `.mcp.json` **behind its own separate consent line** (tier 2 below,
the same treatment `.claude/settings.json` gets). It **merges, never owns**:
the server keys stackgen added are recorded in the lockfile, so sync and
removal touch only those. A declined wiring leaves the skills landed and says
the tool will be unreachable — never a silent partial landing.

```text
.claude/
├── skills/<name>/SKILL.md     # doctrine with references; auto-discovered
├── agents/<name>.md           # subagents; auto-discovered
├── hooks/<name>.sh            # hook SCRIPTS (pack-sourced only, never generated)
├── rules/<name>.md            # short path-scoped constraints
└── stackgen/                  # bookkeeping — not discovered by Claude Code
    ├── lock.yaml              # the materialization record (below)
    ├── templates/<slug>.md    # template payloads: frontmatter (incl. the
    │                          #   components: composition) + conventions body
    └── citations/<component-slug>.yaml  # per-component research sources with URLs + fetch dates
```

**Skills vs rules — one mechanism per content, never both.** Doctrine that
needs references and judgment is a paths-scoped skill; a one-screen
constraint bound to a glob is a rule. The kind definitions
(`${CLAUDE_PLUGIN_ROOT}/assets/kinds.md`) say which each kind uses.

## The third target — the generated local plugin

An LSP server can only be declared in a plugin manifest, so the one way to
provide one is to **be** a plugin. stackgen generates a local plugin on the
developer's machine and registers it with Claude:

```text
~/.claude/plugins/local/stackgen-lsp/
└── .claude-plugin/
    ├── plugin.json       # lspServers + mcpServers, union across the user's stacks
    └── marketplace.json  # a single-plugin directory marketplace, also stackgen-lsp
```

Registration is two commands, and **stackgen prints them and asks — it never
runs them unprompted**:

```sh
claude plugin marketplace add ~/.claude/plugins/local/stackgen-lsp --scope user
claude plugin install stackgen-lsp@stackgen-lsp --scope user
```

The path and the plugin name are **fixed**, never constructed from the stack
pin — one plugin per machine, holding the union.

**Scope is `user`, and the trade is taken knowingly.** Collaborators get
nothing by pulling: a teammate's language server is their own machine's
business, which is the same line every editor already draws. What user scope
buys is one registration serving every repo, instead of a per-repo
obligation nobody would maintain.

**The extension map is what makes user scope safe.** A server declared with
an `extensionToLanguage` map never starts in a repo with no matching files,
so a user-scoped declaration costs a repo that does not need it nothing. A
generated LSP declaration **without** one is forbidden
(`${CLAUDE_PLUGIN_ROOT}/assets/artifact-doctrine.md` §5) — it would start
unconditionally in every session in every repo, which is exactly the
objection user scope would otherwise deserve.

**MCP rides the same mechanism, and the two paths are not interchangeable.**
`.mcp.json` stays the path for **project-scoped** servers the repo should
own and collaborators should get; the local plugin is for **user-scoped**
ones the repo should not own. Which a server is belongs to the component
that declares it, not to the materializer.

**It merges, never owns.** The manifest is a union across every repo that
materialized into it, so a landing adds its keys and leaves the rest;
removal removes exactly the keys this repo's lockfile recorded, and takes
the directory and the registration down only when the last key goes.

## The fourth target — repo config files

`.claude/`, `.mcp.json` and the local plugin are the three targets above, and
a repo's own configuration is none of them. A toolchain manager's config and
its file-based task library are repo files a component genuinely owns, so a
pack declares them in a **`config/` tree that mirrors the repo root**
(`${CLAUDE_PLUGIN_ROOT}/assets/pack-format.md`):

```text
stacks/<type>/<slug>/
└── config/              # tree mirrors the repo root
```

`config/.config/mise/tasks/code/format` lands at
`<repo>/.config/mise/tasks/code/format`, the same way `skills/` mirrors
`.claude/skills/`.

**What the tier covers**, since it is wider than the toolchain manager it
started as:

- **(a) The toolchain manager's config split and its task library** — the
  `mise.*.toml` layers and every file under `.config/mise/tasks/`.
- **(b) A gate's own config file** — `.config/dprint.json`,
  `.config/taplo.toml`, `.config/pre-commit-config.yaml`,
  `.config/git-conventional-commits.yaml`, `.config/gitleaks.toml`,
  `.config/grype.yaml`. A gate whose doctrine ships without the file that
  configures it is doctrine about a gate nobody has.
- **(c) The hygiene files a repo carries whatever its stack is** —
  `.gitignore`, `.editorconfig`, `.gitattributes`, `SECURITY.md`, `LICENSE`,
  and `.config/renovate.json`. Everything landing at the **repo root** is on
  the fixed allowlist below; everything else goes under `.config/`.
- **(d) Environment fragments a provider contributes** —
  `.config/mise/conf.d/<pack>.toml`, which the manager auto-loads, so a
  provider adds its own variables without any component editing the
  manager's own `mise.toml`.
- **(e) Hook fragments** — `.config/pre-commit.d/<pack>.yaml`, each a
  standalone `repos:` list. The materializer **copies these verbatim and
  stops**; `/vwf:init` is what merges them into
  `.config/pre-commit-config.yaml`, between its markers. Nothing in stackgen
  edits that file, which is what keeps a fragment a fragment.

**The root allowlist** is the hygiene doctrine's, and the materializer
enforces it as a ceiling. These files, and only these, may sit at a shaped
repo's root: `.gitignore`, `.editorconfig`, `.gitattributes`, `LICENSE`,
`SECURITY.md`, `readme.md`, `CLAUDE.md`, `fnox.toml`, `eslint.config.mjs`,
`wrangler.jsonc`, and the manifests and lockfiles a language mandates. A
`config/` tree landing a root path that is not on this list is a **pack
authoring error**: the materializer refuses it and reports it, rather than
quietly adding one more dotfile to a place the doctrine says is closed.
Everything else a pack configures lives under `.config/`.

`wrangler.jsonc` joined on 2026-09-05, and it is the same exception
`eslint.config.mjs` already is: a deploy tool that discovers its config only
at the repo root leaves a pack two ways to ship one — the root file, or
`--config` on every invocation any caller might type — and a flag every
caller has to remember is the worse of the two.

Being on that list is a ceiling, never a licence: `readme.md` and `CLAUDE.md`
are on it because a shaped repo has them, and **no pack may ship either** —
they belong to `/vwf:readme` and `/vwf:setup`, and the ban on writing
CLAUDE.md below is unchanged. The rule reaches `wrangler.jsonc` unchanged:
being on the list makes it landable, not standard, and only a
`static-hosting` service pack ships one.

The rules mirror the ones the other targets already have:

- **It merges, never owns.** Only the paths this repo's lockfile recorded are
  touched by sync or removal; a landing set colliding with an unlisted path is
  a conflict for the user, not a write.
- **Recorded in the lockfile per file**, with the **component** that supplied
  it — the same grain sync acts at everywhere else, and what makes a tree two
  components both write auditable.
- **Its own consent line**, the same tier `.claude/settings.json` and
  `.mcp.json` get (tier 2 below). A declined config write leaves the skills
  landed and says the tasks will be absent — never a silent partial landing.
- **Mode is preserved.** `.config/mise/tasks/**` must land executable (755) or
  `mise run <task>` fails as an *unknown task* rather than as a permission
  error. `plugins:check` asserts the bit on the authored packs, because an
  invisible exec bit has cleared every other gate in this repo before.

**Composition order, since more than one component may write one tree.**
By component type: `toolchain-manager`, then `toolchain-gate` (the
`repo-gate` kind's components), then `repo-hygiene`, then
`package-manager` / `language`, then `app-framework`, then
`capability-provider`, then `cloud-provider`, then `cloud-service` — a
later component's file wins, and the lockfile records per file which
component supplied the version that landed.

The two ends are what the order is for. The **manager goes first** because
it ships the baseline every overlay overlays — the whole task library,
including the slots a stack fills in. The **deploy target goes last**
because it is the most specific thing a repo pins: a `cloud-service` pack's
`wrangler.jsonc`, and the `p/<id>/deploy` overlay beside it, are the answer
to how this repo actually ships, and nothing may overwrite that. The
**secrets provider still outranks everything before it**, for the reason it
always did — a secrets overlay is the most specific answer anything gives
to `setup/secrets`, whatever a language pack thought that task should do.

The two cloud types were absent from this order until 2026-09-05, for a
plain reason rather than an oversight: no `cloud-provider` or
`cloud-service` pack shipped a `config/` tree, so there was nothing of
theirs to compose. `cloud-service/workers-static-assets` is the first that
does, and is what put them on it.

**Precedent, and its limit.** The `capability-provider/fnox` and
`package-manager/pnpm` packs already ship hook scripts copied into a target
repo, so packs already write outside `.claude/`. This generalizes that from
`hooks/` to a declared tree, the same move `.mcp.json` got at Wave D, and for
the same reason: the alternative is that the one thing which writes a repo's
config lives in a plugin that exists for no other reason.

**The fence, and where it now runs.** The tier originally stopped at the
toolchain manager: a gate pack named its config file as a prerequisite and
wrote nothing. That line was **opened on 2026-09-05, deliberately and once**,
for gate and provider config files — the (b), (c), (d) and (e) rows above —
because a gate that ships its doctrine and not its config leaves every repo
to hand-write the file the doctrine describes, which is the failure the
tier exists to prevent.

Four things stay **outside** the fence, and they are the whole of it:

1. **`package.json` and every language manifest** — `pyproject.toml`,
   `Cargo.toml`, `pubspec.yaml`, `go.mod`. A manifest is the project's own
   declaration of what it is; a pack that writes one is deciding the
   project's dependencies for it.
2. **CI workflow files.** A pack states which task names CI must run; the
   workflow that runs them is the repo's, and a generated pipeline nobody
   maintains is worse than none.
3. **Editor settings.** A repo's editor configuration belongs to the people
   typing in it, and no pack ships one — there is no editor setting that
   would point at a config under `.config/` in the first place.
4. **`CLAUDE.md`** — vwf's, out of scope outright, as it always was.

**Charters ratchet**, which is why the four are enumerated rather than left
to judgment: each file the tier absorbs makes the argument for the next one
easier, and "gate configs went in, so why not the manifest" is exactly the
argument this list exists to answer. Moving one of the four is a decision on
the record, never an implementer's call.

**The lockfile is what tells a caller the repo is shaped.** `/vwf:init` lays
the tier down by fetching the three `unconditional:` bundles by fixed slug —
`mise`, `repo-gates`, `repo-hygiene`
(`${CLAUDE_PLUGIN_ROOT}/assets/pack-format.md`) — and every landing is
recorded here. So the shape test is a lockfile read: **all three slugs
present = shaped**, any missing = not, and nothing has to infer a repo's
state from which files happen to sit in it. That matters because `.config/`
holds the repo's own files too, and presence in the tree has never meant
stackgen put it there.

## The three consent tiers

1. **Files in the tree above** land through the materializer's ordinary
   dry-run consent gate — every path listed, nothing written unapproved.
2. **`.claude/settings.json`, `.mcp.json` and a pack's `config/` tree are
   NEVER modified without the
   user's explicit consent, as their own separate lines in the gate.** Hook *scripts* are files
   (tier 1); the settings entry that wires a hook to its event is a
   settings.json edit (tier 2), presented separately and skippable — a
   declined wiring leaves the script landed but inert, and says so. When
   stackgen does edit settings.json it **merges, never owns**: the keys it
   added are recorded in the lockfile so sync and removal touch only those.
   A hooks entry merges **event by event, by appending** — never replacing
   an event's list, and never coalescing two groups whose matchers happen to
   agree, either of which would silently rewrite a hook the user owns. Its
   lockfile spelling is `hooks.<Event>[<matcher>]`, since a hooks entry is
   not a top-level key and removal needs a name for exactly one group.
3. **The local plugin gets its own, larger gate** — writing outside the repo
   and registering with a user-scoped tool is a bigger act than editing a
   project file, and is gated as two separate items: the manifest write, and
   the registration. Declining either is fine and leaves the rest landed; a
   declined registration leaves a valid plugin directory nobody has
   installed, and says so, with the two commands printed for later.

**CLAUDE.md is vwf's domain.** stackgen never writes it. After a
materialization lands, stackgen recommends `/vwf:setup` as the next step —
that is where the repo's CLAUDE.md and workspace wiring get reconciled.

## The lockfile

`.claude/stackgen/lock.yaml` is what makes ownership real. `.claude/` also
holds the user's own hand-written skills, agents and rules, so nothing may
be inferred from presence in the tree. One record per materialized path,
each carrying the **component** it landed for — the grain sync acts at:

```yaml
entries:
  - path: .claude/skills/go/SKILL.md
    slug: generated/go # the template (bundle) it landed with
    component: language/go # the component ref — <type>/<slug> (assets/taxonomy.md)
    source: generated # or pack/<type>/<slug>@<version>
    hash: <content hash at landing>
  - path: .config/mise/tasks/code/format # a `config/` tier file — outside .claude/
    slug: generated/mise
    component: toolchain-manager/mise # which component's version won, per file
    source: pack/toolchain-manager/mise@0.1.0
    hash: <content hash at landing>
    mode: "755" # preserved for .config/mise/tasks/** — mise runs the file itself
settings_keys: [] # exact settings.json keys stackgen added, with consent — a hooks entry is spelled `hooks.<Event>[<matcher>]`
mcp_servers: [] # exact .mcp.json server keys stackgen added, with consent
local_plugin: # the generated local plugin — absent when none was written
  path: ~/.claude/plugins/local/stackgen-lsp # fixed; recorded so removal has a target
  marketplace: stackgen-lsp # the name given to `claude plugin marketplace add`
  plugin: stackgen-lsp@stackgen-lsp # what `claude plugin install` was given
  scope: user
  lsp_servers: [] # exact lspServers keys THIS repo contributed to the union
  mcp_servers: [] # exact mcpServers keys THIS repo contributed to the union
  registered: true # false when the manifest landed but registration was declined
```

`local_plugin.mcp_servers` and the top-level `mcp_servers` are different
lists and must not be conflated: the top-level one names project-scoped
keys in the repo's own `.mcp.json`, the nested one names user-scoped keys in
the generated manifest.

Rules the lockfile enforces:

- **Sync diffs against the lockfile, mechanically, per component**:
  unchanged / pack moved / repo edited are hash comparisons, not inference,
  and one component's drift never churns the rest of its bundle.
- **Anything not in the lockfile is not stackgen's** — never diffed, never
  overwritten, never removed. A landing set that collides with an unlisted
  path is a conflict for the user, not a write.
- **Removal removes exactly the listed entries**, `settings_keys` and
  `mcp_servers`, nothing else — the same receipt invariant this repo's
  installer CLI lives by.
- **The local plugin is removed by subtraction, not deletion.** Removal drops
  only the keys under `local_plugin.lsp_servers` and
  `local_plugin.mcp_servers` from the generated manifest — another repo's
  keys stay. Only when that leaves the manifest with no servers at all is the
  plugin uninstalled, the marketplace removed and the directory deleted:

  ```sh
  claude plugin uninstall stackgen-lsp@stackgen-lsp --scope user
  claude plugin marketplace remove stackgen-lsp
  ```

  Those two are printed and confirmed, exactly as the registration pair is;
  the directory is stackgen's own and is deleted outright once they succeed.
  A `local_plugin` block absent from a lockfile means this repo contributed
  nothing, so removal touches the machine not at all.
