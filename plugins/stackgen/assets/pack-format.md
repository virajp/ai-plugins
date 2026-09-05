# Pack Format

A **pack** is a curated, pre-created **component** — the dispatch rule's
preferred path, one pack per component: `typescript`, `pnpm`, `postgres`,
`cloud-run`. A whole stack is never one pack: a **bundle** is a recorded
composition of component refs, not a directory (see Bundles below). Packs
ship as stackgen **assets**, not live plugin skills: installing stackgen
floods no session with every stack's doctrine, because nothing under
`stacks/` is discovered by Claude Code — it only reaches a session once the
materializer copies it into a repo's `.claude/` tree.

**Every pack in the tree is authored here.** The `toolchain-gate` type ships
eight packs under `stacks/toolchain-gate/` — `analysis-options`, `dprint`,
`eslint`, `gitleaks`, `grype`, `pre-commit`, `ruff` and `tsconfig` — and no
curated plugin stands behind any pack: the tree is each pack's only home.
This file is the contract every pack is folded into, so an author targets a
shape the materializer already reads.

## Layout

```text
stacks/<type>/<slug>/
├── pack.yaml            # metadata — everything the payload needs but prose
├── conventions.md       # this component's conventions: prose, verbatim into the payload
├── skills/<name>/…      # optional: skills to copy into .claude/skills/
├── agents/<name>.md     # optional: subagents to copy into .claude/agents/
├── rules/<name>.md      # optional: rules to copy into .claude/rules/
├── hooks/               # optional: hook scripts + their settings entries
│   ├── <name>.sh        #   the script, copied into .claude/hooks/
│   └── hooks.yaml       #   the settings.json hook entries it needs (consent-gated)
└── config/              # optional: repo config files — tree mirrors the repo root
    ├── .config/…        #   e.g. .config/mise/tasks/code/format (consent-gated)
    ├── .config/mise/conf.d/<pack>.toml       #   env fragment, auto-loaded
    ├── .config/pre-commit.d/<pack>.yaml      #   hook fragment, merged by /vwf:init
    └── _<name>/…        #   pack-private payload — NEVER copied
```

**Three sub-conventions inside `config/`**, each a different contract:

- **`config/.config/…` and the root allowlist.** Everything under `config/`
  mirrors the repo root, so `config/.config/dprint.json` lands at
  `<repo>/.config/dprint.json` and `config/.gitignore` at `<repo>/.gitignore`.
  A path landing at the **root** must be on the fixed allowlist
  (`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`); anything else belongs
  under `.config/`, and the materializer refuses a root path that is not on
  it.
- **`config/_<name>/` is pack-private and is not copied.** A leading
  underscore **at the top of the tier** marks a payload a *reader* uses rather
  than a file the repo gets — `config/_licenses/MIT.txt` is the case that
  needs it: the hygiene pack carries both licence texts, and `/vwf:init`
  copies the one the user picked to `LICENSE` with the year and holder filled.
  Copying the directory wholesale would land two licences and answer a
  question nobody asked. Nested deeper, the same character means the
  opposite: `.config/mise/tasks/p/_project/` is a **marked position**, copied
  and renamed to the project's id as it lands, and the materializer's copy
  rules are where that behaviour is specified.
- **Fragments are named `<pack-name>.<ext>`, one per pack.**
  `.config/mise/conf.d/<pack>.toml` is an environment fragment the toolchain
  manager auto-loads, which is how a provider contributes variables without
  editing `mise.toml`. `.config/pre-commit.d/<pack>.yaml` is a hook fragment
  — a standalone `repos:` list, valid YAML on its own — that the materializer
  copies **verbatim** and `/vwf:init` merges into
  `.config/pre-commit-config.yaml` between markers. The pack name in the
  filename is what makes a fragment attributable at a glance and keeps two
  packs from colliding on one path.

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

**`config/` is a target, not a fifth artifact kind.** It mirrors the repo
root rather than `.claude/`, so `config/.config/mise/tasks/code/format` lands
at `<repo>/.config/mise/tasks/code/format`, behind its own consent line, and
merging never owning — the rules, the per-file lockfile record, the
composition order when two components write one tree, the root allowlist and
the four things the tier still may not write are
`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`. A gate pack **does** ship the
config file it governs, and a provider pack its environment fragment; what
stays out is a language manifest, a CI workflow, editor settings and
CLAUDE.md. **Mode is preserved**:
anything under `config/.config/mise/tasks/**` must be authored executable
(755), which `plugins:check` asserts, because mise runs a task file directly
and reports a non-executable one as an unknown task.

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
kind: language-bundle | database | cloud-provider | repo-gate | toolchain-manager | repo-hygiene | workspace | capability-provider | ci-system | app-framework | deploy-target | design-tool # the bundle kind it composes into (assets/kinds.md)
axis: project | backing | deploy | repo | design | cicd # omitted by cloud-provider components, which compose into both a backing- and a deploy-axis bundle; each bundle naming one declares its own
platforms: [ <platform> ] # language components only — the bundle root
languages: # language and app-framework components only
  - token: <language token>
    role: primary | platform-edge # app-framework components only
    facts: # what /vwf:doctor verifies for this language
      lsp: <how a language server is provided — or n/a>
      mise_tool: <the mise tool name — or n/a>
      manifest: <the manifest file doctor checks deps against — or n/a>
package_manager: <token> # package-manager components only
artifact: <token> # deploy-target components, and deploy-side cloud-service ones
mcp_servers: {} # design-tool and other components needing an MCP server — written into the project's .mcp.json behind tier-2 consent
user_mcp_servers: {} # user-scoped — the generated local plugin's mcpServers, tier 3
lsp_servers: {} # <name> -> the verbatim lspServers entry; extensionToLanguage mandatory — the generated local plugin's, tier 3
harness:
  <capability>: { task: <name>, mechanism: <one line> } # what this component satisfies — or n/a
```

**Servers are three sibling keys, never one key with a scope field.**
`mcp_servers:` is project-scoped and lands in the repo's own `.mcp.json`;
`user_mcp_servers:` and `lsp_servers:` are user-scoped and land in the
generated local plugin's manifest. Three keys make "a server belongs in
exactly one place" structural — landing in both would mean writing the name
twice, and a name appearing under both `mcp_servers:` and
`user_mcp_servers:` halts the run. This changes no artifact: the landed set
is still closed to skills, agents, hooks and rules, and these are payload
the materializer writes elsewhere.

The bundle-level lists the previous format carried per pack — `frameworks`,
`dependencies`, `optional_languages`, `capabilities` — are **derived at
composition time** now: a bundle's `frameworks:` is its framework
components' slugs, its `capabilities:` its components' `capability` tokens.
A pack states only what its own component is.

## Bundle files — the recorded composition

A bundle is **one file**, `stacks/bundles/<slug>.md`: YAML frontmatter naming
its component refs, and a body carrying the composition's own conventions —
what this combination is for, and what it decides that no single component
decides alone.

```yaml
name: <display name>
axis: project | backing | deploy | repo | design | cicd
kind: <bundle kind> # assets/kinds.md
platforms: [ <platform> ] # project axis only
artifact: <token> # deploy axis only
unconditional: true # omitted by every bundle a user picks — see below
components:
  - <type>/<slug>@<version> # a shipped pack, copied verbatim
  - <type>/<slug>@generated # no pack covers it — generated on first fetch
```

**This is what a user picks.** A component answers "what is TypeScript";
a bundle answers "what is a TypeScript service" — and those are different
questions, which is why a menu of components alone leaves nothing pickable.

**Except where `unconditional: true`.** That key marks the repo baseline —
a slot with exactly one pack, where a one-entry menu would be theatre and
where a repo that has picked no stack still needs the thing. It has two
readers: `stackgen-stack-menu` **excludes** such a bundle from the payload
it returns, and `/vwf:init` fetches it by **fixed slug**, never a slug
constructed from configuration. Three bundles carry it today, because a
bundle declares one `kind` and these are three: `mise` (`toolchain-manager`),
`repo-gates` (`repo-gate`) and `repo-hygiene` (`repo-hygiene`). Nothing about
them is recorded in `.config/vwf.yaml` — nothing was chosen — only in
`lock.yaml`, which is also what tells a caller whether the repo is shaped at
all: all three slugs present, or not shaped.

**A `@generated` ref is a first-class outcome, not a gap.** A bundle may mix
copied and generated components freely: the covered ones land verbatim, the
uncovered ones run the generation pipeline on first fetch, and the lockfile
records which was which per component. That mixing is the dispatch rule
working at bundle scale.

**No bundle directory exists**, which is what keeps a bundle a composition
rather than a fourth kind of artifact tree.

## Bundles — how the kinds compose

A bundle is the composition rooted per kind
(`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`): a Language-Bundle is a
`language` component + its `package-manager`, `framework` and
`toolchain-gate` components; a Cloud-Bundle a `cloud-provider` + its
`cloud-service`s; a Datastore-Bundle category doctrine + an instance
component; a Deploy-Bundle one `deploy-target` component alone; a
Design-Bundle one `design-tool` component alone, and a CI-Bundle one
`ci-system` — the two **tool axes**, whose bundle slug is the tool token the
project config already holds. No bundle directory exists anywhere: the materializer folds the
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
- **A generated pack may ship the `config/` tiers too.** Nothing about
  `config/.config/…`, `conf.d` or `pre-commit.d` is reserved to curated
  packs: a generated component that genuinely owns a config file may declare
  one, and it lands through the same consent line and the same lockfile
  record. Teaching the generator to **emit** them is a separate piece of work
  and is not done — so the honest statement today is that the format allows
  it and the pipeline does not yet produce it, which is a gap in the
  generator rather than a rule in the format.
