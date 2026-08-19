# Pack Format

A **pack** is a curated, pre-created stack — the dispatch rule's preferred
path. Packs ship as stackgen **assets**, not live plugin skills: installing
stackgen floods no session with every stack's doctrine, because nothing under
`stacks/` is discovered by Claude Code — it only reaches a session once the
materializer copies it into a repo's `.claude/` tree.

**No packs ship yet.** Until the merge waves land them, the curated plugins
remain the covered-stack path and this file is the contract they will be
folded into. The format is stated now so Wave B/C authors target a shape the
materializer already reads.

## Layout

```text
stacks/<axis>/<slug>/
├── pack.yaml            # metadata — everything the payload needs but prose
├── conventions.md       # the conventions: prose, verbatim into the payload
├── skills/<name>/…      # optional: skills to copy into .claude/skills/
├── agents/<name>.md     # optional: subagents to copy into .claude/agents/
├── rules/<name>.md      # optional: rules to copy into .claude/rules/
└── hooks/               # optional: hook scripts + their settings entries
    ├── <name>.sh        #   the script, copied into .claude/hooks/
    └── hooks.yaml       #   the settings.json hook entries it needs (consent-gated)
```

`<axis>` is one of `project` / `backing` / `deploy` / `repo` — the four vwf
axes. The slug is unique within the plugin. The artifact set is closed to the
output vocabulary (`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`): skills,
agents, hooks, rules — **never MCP or LSP configuration**.

**Hook scripts are pack-only.** A pack may ship them because they were
curated and tested here; generation never emits an executable — a generated
"hook" is at most a recommendation in the conventions prose. The
`hooks.yaml` entries land in `.claude/settings.json` only behind the
materializer's separate settings-consent line.

## `pack.yaml`

Every non-prose field of the stack-adapter template payload, plus the pack's
**kind** and version, plus the facts doctor needs per language:

```yaml
name: <display name>
summary: <one line — why you would pick it>
version: <semver — what sync diffs against>
kind: language-bundle | database | cloud-provider # assets/kinds.md
axis: project | backing | deploy | repo
platforms: [ <platform> ] # project axis only
languages:
  - token: <language token>
    facts: # what /vwf:doctor verifies for this language
      lsp: <how a language server is provided — or n/a>
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
`.claude/stackgen/templates/<slug>.md` (frontmatter + body) and copies the
artifact directories into `.claude/`, recording every landing in the
lockfile.

## Rules

- **A pack is copied, never referenced in place.** The repo owns its copy;
  upgrades arrive only through the explicit sync diff, keyed on the pack's
  `version` and the lockfile's landing hashes.
- **Structure follows the kind.** A pack declares its `kind` and ships the
  structure that kind defines — the reviewer bar generated output meets is
  the bar curated packs meet too.
- **Judgment, not API surface.** A pack's conventions and skills carry the
  decisions a reader cannot look up — layout, placement, testing shape, what
  bills and what breaks. API reference belongs to Context7 at use time.
- **Facts are per language and honest.** `n/a` is an answer; an invented
  mise tool or manifest name surfaces as a doctor finding in every repo that
  pins the pack.
