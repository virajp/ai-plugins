# The Generated Output

Everything stackgen materializes lands **directly in the repo's `.claude/`
tree** — committed, repo-owned, and working for every collaborator with no
plugin installed. There is no intermediate tree and no symlink wiring: what
Claude Code discovers is what the repo owns.

The output vocabulary is **closed to four artifact kinds** plus stackgen's
own bookkeeping. MCP server configuration and LSP server configuration are
**deliberately excluded** — stackgen never writes `.mcp.json`, and LSP
servers are a plugin-manifest feature no project file can express (the need
is carried as `language_facts` in the template payload, which `/vwf:doctor`
reads).

```text
.claude/
├── skills/<name>/SKILL.md     # doctrine with references; auto-discovered
├── agents/<name>.md           # subagents; auto-discovered
├── hooks/<name>.sh            # hook SCRIPTS (pack-sourced only, never generated)
├── rules/<name>.md            # short path-scoped constraints
└── stackgen/                  # bookkeeping — not discovered by Claude Code
    ├── lock.yaml              # the materialization record (below)
    ├── templates/<slug>.md    # template payloads: frontmatter + conventions body
    └── citations/<slug>.yaml  # per-entry research sources with URLs + fetch dates
```

**Skills vs rules — one mechanism per content, never both.** Doctrine that
needs references and judgment is a paths-scoped skill; a one-screen
constraint bound to a glob is a rule. The kind definitions
(`${CLAUDE_PLUGIN_ROOT}/assets/kinds.md`) say which each kind uses.

## The two consent tiers

1. **Files in the tree above** land through the materializer's ordinary
   dry-run consent gate — every path listed, nothing written unapproved.
2. **`.claude/settings.json` is NEVER modified without the user's explicit
   consent, as its own separate line in the gate.** Hook *scripts* are files
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
be inferred from presence in the tree. One record per materialized entry:

```yaml
entries:
  - path: .claude/skills/go-chi-sqlc/SKILL.md
    slug: generated/go-chi-sqlc # the template it landed with
    source: generated # or pack/<axis>/<slug>@<version>
    hash: <content hash at landing>
settings_keys: [] # exact settings.json keys stackgen added, with consent
```

Rules the lockfile enforces:

- **Sync diffs against the lockfile, mechanically**: unchanged / pack moved /
  repo edited are hash comparisons, not inference.
- **Anything not in the lockfile is not stackgen's** — never diffed, never
  overwritten, never removed. A landing set that collides with an unlisted
  path is a conflict for the user, not a write.
- Removal (a future concern) removes exactly the listed entries and
  `settings_keys`, nothing else — the same receipt invariant this repo's
  installer CLI lives by.
