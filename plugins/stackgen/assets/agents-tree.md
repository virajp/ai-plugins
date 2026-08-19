# The `.agents/` Tree

Everything stackgen materializes — skills, agents, template payloads — lands in
**one committed, repo-owned tree** at the repo root:

```text
.agents/
├── skills/<name>/SKILL.md    # materialized skills (references/ beside them)
├── agents/<name>.md          # materialized subagents
└── templates/<slug>.md       # materialized template payloads (see below)
```

**Repo-owned means exactly that.** The copies are committed, the project may
edit them, and collaborators need no plugin installed for them to work — the
tree is plain files Claude Code discovers through the symlinks below. stackgen
never edits the tree outside an explicit, consent-gated run, and never
overwrites a repo's edits silently: divergence from a pack is surfaced by
`/stackgen:stackgen-sync` as a diff, and the user decides.

## The `.claude/` wiring — symlinks

Claude Code discovers skills and agents under `.claude/`; the repo-owned tree
lives in `.agents/`. The wiring is **relative symlinks, created by stackgen and
committed**:

```text
.claude/skills/<name>  →  ../../.agents/skills/<name>
.claude/agents/<name>.md  →  ../../.agents/agents/<name>.md
```

**The mechanism is verified against the real tool** (2026-08-19): a skill whose
`.claude/skills/<name>` entry is a symlink into `.agents/` is discovered,
listed, and invocable by Claude Code exactly like a plain directory. If a
future Claude Code release breaks symlink discovery, the fallback is
**sync-maintained copies** — `.claude/` holds real files that
`/stackgen:stackgen-sync` keeps identical to `.agents/` — with the same
ownership rules; the `.agents/` tree stays authoritative either way.

**Windows checkouts** materialize git symlinks as text files. Accepted: this
toolkit already assumes a POSIX/macOS toolchain. Noted here so it reads as a
decision, not a surprise.

## The template payload file

`templates/<slug>.md` is what makes a materialized stack answer the
stack-adapter contract without re-running anything. Its **frontmatter carries
every payload field except the conventions** — axis, `languages` (plus the
facts doctor verifies against them: LSP plugin/binary, mise tool, manifest
shape — emitted from pack metadata or from generation research),
`platforms` (project axis), `frameworks`, `dependencies`, `capabilities`,
`artifact`, `package_manager`, and the `harness` block. The **body is the
`conventions:` prose** — what `plan` sizes against and `execute` writes to.

A fetch of a materialized slug is therefore a file read: frontmatter + body →
payload. No research, no network, no regeneration. Regeneration happens only
through the sync skill, explicitly.

## Slugs and the two paths in one namespace

| Slug shape           | Path                                                            |
| -------------------- | --------------------------------------------------------------- |
| `<pack-slug>`        | copied from a shipped pack (`stacks/…` in this plugin)          |
| `generated/<tech>`   | generated — research → catalog instantiation → the reviewer gate |

Both end as the same artifacts in `.agents/`; after materialization the
origin only matters to sync (packs diff against the pack, generated entries
are offered regeneration).
