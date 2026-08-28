# Pack Format

A **pack** is a curated, pre-created **component** — the dispatch rule's
preferred path, one pack per component: `typescript`, `pnpm`, `postgres`,
`cloud-run`. A whole stack is never one pack: a **bundle** is a recorded
composition of component refs, not a directory (see Bundles below). Packs
ship as stackgen **assets**, not live plugin skills: installing stackgen
floods no session with every stack's doctrine, because nothing under
`stacks/` is discovered by Claude Code — it only reaches a session once the
materializer copies it into a repo's `.claude/` tree.

**No packs ship yet.** Until the merge waves land them, the curated plugins
remain the covered path and this file is the contract they will be folded
into. The format is stated now so Wave B/C authors target a shape the
materializer already reads.

## Layout

```text
stacks/<type>/<slug>/
├── pack.yaml            # metadata — everything the payload needs but prose
├── conventions.md       # this component's conventions: prose, verbatim into the payload
├── skills/<name>/…      # optional: skills to copy into .claude/skills/
├── agents/<name>.md     # optional: subagents to copy into .claude/agents/
├── rules/<name>.md      # optional: rules to copy into .claude/rules/
└── hooks/               # optional: hook scripts + their settings entries
    ├── <name>.sh        #   the script, copied into .claude/hooks/
    └── hooks.yaml       #   the settings.json hook entries it needs (consent-gated)
```

`<type>` is a component type from
`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`. The slug is unique within the
plugin. The artifact set is closed to the output vocabulary
(`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`): skills, agents, hooks,
rules — **never MCP or LSP configuration**.

**Hook scripts are pack-only.** A pack may ship them because they were
curated and tested here; generation never emits an executable — a generated
"hook" is at most a recommendation in the conventions prose. The
`hooks.yaml` entries land in `.claude/settings.json` only behind the
materializer's separate settings-consent line.

## `pack.yaml`

The component's classification (`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`),
its version, and the payload fields this component contributes — each
carried only by the component type that owns it:

```yaml
name: <display name>
summary: <one line — why you would pick it>
version: <semver — what sync diffs against, per component>
type: <component type> # assets/taxonomy.md
category: <token> # required where the type has categories
capability: <token> # the vwf capability realized — where one applies
kind: language-bundle | database | cloud-provider | repo-gate # the bundle kind it composes into (assets/kinds.md)
axis: project | backing | deploy | repo
platforms: [ <platform> ] # language components only — the bundle root
languages: # language components only
  - token: <language token>
    facts: # what /vwf:doctor verifies for this language
      lsp: <how a language server is provided — or n/a>
      mise_tool: <the mise tool name — or n/a>
      manifest: <the manifest file doctor checks deps against — or n/a>
package_manager: <token> # package-manager components only
artifact: <token> # deploy-side cloud-service components only
harness:
  <capability>: { task: <name>, mechanism: <one line> } # what this component satisfies — or n/a
```

The bundle-level lists the previous format carried per pack — `frameworks`,
`dependencies`, `optional_languages`, `capabilities` — are **derived at
composition time** now: a bundle's `frameworks:` is its framework
components' slugs, its `capabilities:` its components' `capability` tokens.
A pack states only what its own component is.

## Bundles — a composition, never a directory

A bundle is the composition rooted per kind
(`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`): a Language-Bundle is a
`language` component + its `package-manager`, `framework` and
`toolchain-gate` components; a Cloud-Bundle a `cloud-provider` + its
`cloud-service`s; a Datastore-Bundle category doctrine + an instance
component. No bundle directory exists anywhere: the materializer folds the
resolved composition into **one** `.claude/stackgen/templates/<slug>.md` —
the vwf payload as frontmatter, including the `components:` refs
(`<type>/<slug>@<version>`, or `@generated`), with the components'
conventions as body — copies each component's artifact directories into
`.claude/`, and records every landing in the lockfile **per component**,
which is the grain `stackgen-sync` acts at.

## Rules

- **A pack is copied, never referenced in place.** The repo owns its copy;
  upgrades arrive only through the explicit sync diff, keyed on the pack's
  `version` and the lockfile's landing hashes — per component, so one
  pack's bump never churns the rest of its bundle.
- **Structure follows the kind; the slice follows the type.** A pack
  declares the bundle `kind` it composes into and ships the structural
  slice its `type` owns within that kind — the reviewer bar generated
  output meets is the bar curated packs meet too.
- **One component per pack, and thin.** A framework pack never restates the
  language baseline beside it; an instance component cites its category's
  doctrine rather than restating it. Anything two components would both say
  belongs to the category level, written once.
- **Judgment, not API surface.** A pack's conventions and skills carry the
  decisions a reader cannot look up — layout, placement, testing shape, what
  bills and what breaks. API reference belongs to Context7 at use time.
- **Facts are per language and honest.** `n/a` is an answer; an invented
  mise tool or manifest name surfaces as a doctor finding in every repo that
  pins the pack.
