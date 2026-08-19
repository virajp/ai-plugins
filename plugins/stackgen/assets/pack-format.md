# Pack Format

A **pack** is a curated, pre-created stack — the dispatch rule's preferred
path. Packs ship as stackgen **assets**, not live plugin skills: installing
stackgen floods no session with every stack's doctrine, because nothing under
`stacks/` is discovered by Claude Code — it only reaches a session once the
materializer copies it into a repo's `.agents/` tree.

**No packs ship yet.** Until the merge waves land them, the curated plugins
remain the covered-stack path and this file is the contract they will be
folded into. The format is stated now so Wave B/C authors target a shape the
materializer already reads.

## Layout

```text
stacks/<axis>/<slug>/
├── pack.yaml            # metadata — everything the payload needs but prose
├── conventions.md       # the conventions: prose, verbatim into the payload
├── skills/<name>/…      # optional: skills to copy into .agents/skills/
└── agents/<name>.md     # optional: subagents to copy into .agents/agents/
```

`<axis>` is one of `project` / `backing` / `deploy` / `repo` — the four vwf
axes. The slug is unique within the plugin.

## `pack.yaml`

Every non-prose field of the stack-adapter template payload, plus the facts
doctor needs, emitted per language:

```yaml
name: <display name>
summary: <one line — why you would pick it>
axis: project | backing | deploy | repo
platforms: [ <platform> ] # project axis only
languages:
  - token: <language token>
    facts: # what /vwf:doctor verifies for this language
      lsp: <how the language server is provided — or n/a>
      mise_tool: <the mise tool name — or n/a>
      manifest: <the manifest file doctor checks deps against — or n/a>
optional_languages: []
frameworks: []
dependencies: []
capabilities: [] # backing axis
artifact: <token> # deploy axis
package_manager: <token> # repo axis
harness:
  <capability>: { task: <name>, mechanism: <one line> } # or n/a
```

The materializer folds `pack.yaml` + `conventions.md` into
`.agents/templates/<slug>.md` (frontmatter + body — see
`${CLAUDE_PLUGIN_ROOT}/assets/agents-tree.md`) and copies `skills/` and
`agents/` entries into the `.agents/` tree, wiring the symlinks.

## Rules

- **A pack is copied, never referenced in place.** The repo owns its copy;
  upgrades arrive only through the explicit sync diff.
- **Judgment, not API surface.** A pack's conventions and skills carry the
  decisions a reader cannot look up — layout, placement, testing shape, what
  bills and what breaks. API reference belongs to Context7 at use time.
- **Facts are per language and honest.** `n/a` is an answer; an invented
  mise tool or manifest name surfaces as a doctor finding in every repo that
  pins the pack.
