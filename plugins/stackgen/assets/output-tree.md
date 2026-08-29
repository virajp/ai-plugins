# The Generated Output

Everything stackgen materializes lands **directly in the repo's `.claude/`
tree** — committed, repo-owned, and working for every collaborator with no
plugin installed. There is no intermediate tree and no symlink wiring: what
Claude Code discovers is what the repo owns.

The output vocabulary is **closed to four artifact kinds** plus stackgen's
own bookkeeping, and one **tier-2 project file** — `.mcp.json`.

LSP server configuration stays **excluded**: a language server is a
plugin-manifest feature no project file can express, and the need is carried
as `language_facts` in the template payload, which `/vwf:doctor` reads.

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

## The two consent tiers

1. **Files in the tree above** land through the materializer's ordinary
   dry-run consent gate — every path listed, nothing written unapproved.
2. **`.claude/settings.json` and `.mcp.json` are NEVER modified without the
   user's explicit consent, as their own separate lines in the gate.** Hook *scripts* are files
   (tier 1); the settings entry that wires a hook to its event is a
   settings.json edit (tier 2), presented separately and skippable — a
   declined wiring leaves the script landed but inert, and says so. When
   stackgen does edit settings.json it **merges, never owns**: the keys it
   added are recorded in the lockfile so sync and removal touch only those.

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
settings_keys: [] # exact settings.json keys stackgen added, with consent
mcp_servers: [] # exact .mcp.json server keys stackgen added, with consent
```

Rules the lockfile enforces:

- **Sync diffs against the lockfile, mechanically, per component**:
  unchanged / pack moved / repo edited are hash comparisons, not inference,
  and one component's drift never churns the rest of its bundle.
- **Anything not in the lockfile is not stackgen's** — never diffed, never
  overwritten, never removed. A landing set that collides with an unlisted
  path is a conflict for the user, not a write.
- Removal (a future concern) removes exactly the listed entries,
  `settings_keys` and `mcp_servers`, nothing else — the same receipt invariant this repo's
  installer CLI lives by.
