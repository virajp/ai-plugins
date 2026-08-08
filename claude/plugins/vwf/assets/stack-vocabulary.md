# Stack Vocabulary

The **shape of a language fact** — what vwf needs to know about any language, and
what it does when it knows nothing. vwf holds no list of languages. Frameworks
and dependencies are open too: any lowercase-kebab token is valid, because no
useful check exists for them beyond presence in a manifest.

## Languages — an open vocabulary

**vwf names no language.** A language token is whatever a stack template
declares, and the facts `/vwf:doctor` checks are supplied by the
**language plugin** that owns it, never by a table here. This file defines only
what such a fact consists of:

| Field        | Means                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| token        | The lowercase-kebab name the template's `languages:` frontmatter carries |
| LSP plugin   | The `virajp-plugins` plugin whose `lspServers` block covers the language |
| manifest     | The file whose presence identifies a project of that language           |
| toolchain    | The mise tool that installs it, where mise manages one                   |

Any of these may legitimately be absent. A language whose toolchain does not
come from mise has none; a language with no LSP in this marketplace is reported
as *unavailable here* rather than *missing*, because there is no install command
to suggest. Neither is a failure.

**An unrecognised token degrades, it never blocks.** vwf records it verbatim,
`doctor` checks nothing for it and says so, and topology detection classifies
the repo on its other signals rather than failing. That is what makes a language
nobody has written a plugin for usable today — the fallback is the feature, not
a gap waiting to be filled by a longer table.

Adding real support for a language means **shipping a plugin for it**, which is
what supplies the rows this file used to hardcode. It does not mean editing vwf.

## The four axes

A stack is **composed from four independent templates**, not one monolith. Each
axis answers a different question, and a project's `.config/vwf.yaml` `stack`
block pins one of each:

| Axis        | Scope       | Owns                                                    |
| ----------- | ----------- | ------------------------------------------------------- |
| **project** | per project | Language, framework, source layout, testing             |
| **backing** | per project | Datastore, identity, queue, storage, the local stack    |
| **deploy**  | per project | Build artifact, release pipeline, hosting, environments |
| **repo**    | per repo    | Package manager, task runner, lint/format, workspace    |

The templates themselves live in the **stack plugins**, never in vwf
(`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`). Since config_format 13 the
first three are pinned **per project** — a product may run its site on one cloud
and its API on another.

The split exists because these vary **independently**: one service framework
runs against any datastore, on any host. Folding them into one document is what
made the old templates specific to a single product while their frontmatter only
ever declared the language and framework.

The axes are genuinely orthogonal, so nothing merges and no precedence rule is
needed. Where one axis must refer to another it names the *axis*, not a vendor —
a project template says "the identity provider the backing axis selects", never
a provider by name.

## Template frontmatter

**Every template declares `axis:`**, whichever axis it is on — that key is what
says which menu it joins, and `plugins:check` enforces it. A project-axis
template carries `role:` *alongside* `axis:`, never instead of it: the role is
real data, but it is not the axis.

Every **project** template a stack plugin ships, at
`<plugin>/stacks/project/<role>/<slug>.md`, opens with:

```yaml
---
axis: project # which of the four menus this template joins
role: <registry role> # service | worker | packages | site | fullstack | frontend | iac
name: <display name> # what the menu shows
languages: [<token>] # open; the plugin owning the language defines its facts
optional_languages: [] # admitted by the template, not required — e.g. a mobile template's platform languages
frameworks: [] # open, lowercase-kebab; 0..n
dependencies: [] # open, lowercase-kebab; the few that characterize the stack
---
```

**Backing** templates declare which capability tokens they realize, so
`/vwf:architecture` can match a project's declared capabilities against them:

```yaml
---
axis: backing
name: <display name>
capabilities: [] # from ${CLAUDE_PLUGIN_ROOT}/assets/capability-vocabulary.md
local_stack: <mechanism> # how the local_stack harness capability is satisfied
---
```

**Deploy** templates declare the artifact they produce:

```yaml
---
axis: deploy
name: <display name>
artifact: <container-image | static-bundle | …>
private_plane: <mechanism> # how a non-public project is kept off the internet
---
```

**Repo** templates describe tooling, not a project:

```yaml
---
axis: repo
name: <display name>
topologies: [monorepo, workspace] # which topologies this template suits
package_manager: <token> # only where the language has one; see the vwf-config asset
tools: [] # the tooling that defines the template
---
```

The prose below the frontmatter is the template's **conventions**. `plan` and
`execute` read it for each of the four selected templates; nothing in
`docs/blueprint/` ever does.

## Frameworks vs dependencies

Within a project template these two fields are both open, and the distinction
only matters for how doctor checks a project — so keep it mechanical:

- **`frameworks`** — what the code is *written against*, and what shapes its
  file layout. Removing one means rewriting the project.
- **`dependencies`** — libraries the project *uses*. Removing one means losing a
  feature, not restructuring.
- Neither is exhaustive. Record what a new engineer needs to know before opening
  the repo; the manifest is the complete list and always wins on detail.

## What is deliberately absent

There is no "recommended" or "default" marker on any template. vwf ships a menu:
`/vwf:architecture` presents every template for a project's `role` and the user
picks, with an **other (describe)** path that records free-text axes and
`template: custom`. A repo whose stack matches nothing shipped is a normal
outcome, not a deviation — there is no `enforcement` entry for it and nothing to
justify.
