# The Generated Output

Everything stackgen materializes lands **directly in the repo's `.claude/`
tree** — committed, repo-owned, and working for every collaborator with no
plugin installed. There is no intermediate tree and no symlink wiring: what
Claude Code discovers is what the repo owns.

The output vocabulary is **closed to four artifact kinds** plus stackgen's
own bookkeeping, one **tier-2 project file** — `.mcp.json` — and one
**tier-3 target outside the repo entirely**: a generated local plugin on the
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
    └── citations/<slug>.yaml  # per-component research sources with URLs + fetch dates
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

## The three consent tiers

1. **Files in the tree above** land through the materializer's ordinary
   dry-run consent gate — every path listed, nothing written unapproved.
2. **`.claude/settings.json` and `.mcp.json` are NEVER modified without the
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
