# Stack Vocabulary

The **shape of a language fact** — what vwf needs to know about any language, and
what it does when no installed plugin claims one. vwf holds no list of languages.
Frameworks and dependencies are open: any lowercase-kebab token is valid, because
no useful check exists for them beyond presence in a manifest.

## Languages — closed to what the installed plugins declare

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

Any of these may legitimately be absent, and no absence among them is a failure.
A language whose toolchain does not come from mise has none; a language with no
LSP in this marketplace is reported as *unavailable here* rather than *missing*,
because there is no install command to suggest.

**What is not open is the set of tokens.** vwf holds no list, but the union of
what the installed stack plugins declare **is** the list. A token outside it is
reported as `unknown`, and `unknown` is **blocking**: `doctor` raises it, and
`/vwf:setup` and `/vwf:execute` both halt on it.

**Why blocking rather than a graceful degrade.** vwf is an opinionated workflow
— it plans against a template's conventions, builds against its harness, and
gates a UI slice on its UX contract. A language no plugin claims supplies none of
those, so a run against it loses every one of those guarantees *while reporting
itself healthy*. That is worse than a refusal, because the run looks exactly like
every other run. The menu is deliberately closed: many options, all of them
defined by a plugin here. "Works with anything" is not a goal vwf has.

Adding a language means **shipping a plugin for it**, which is what supplies the
rows this file used to hardcode. It does not mean editing vwf. Until that plugin
exists, vwf declines the repo rather than half-running against it.

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
template carries `platforms:` *alongside* `axis:`, never instead of it: the
platform list is real data, but it is not the axis.

Every **project** template a stack plugin ships, at
`<plugin>/stacks/project/<slug>.md` — **flat, no role directory** since format
22, because one template routinely serves several platforms and a directory name
cannot say so — opens with:

```yaml
---
axis: project # which of the four menus this template joins
platforms: [ <platform>, <...> ] # which registry platforms this template serves; see assets/templates/registry.yaml for the closed per-role lists
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

The prose below the frontmatter is the template's **conventions**. It reaches
`/vwf:plan` and `/vwf:execute` as the `conventions:` field of the
template payload — neither reads a template file, and the config block records
only which template was picked, never what it says. The fetch rule (deduped by
slug, once per run, a failure halts) is *Resolving the conventions* in
`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`.

Nothing in `docs/blueprint/` ever reads it, and nothing should: the prose names
technology, which is exactly what a blueprint doc may not.

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
picks. There is **no free-text escape hatch** — no *other (describe)* option, and
`template: custom` is not a value the config accepts (retired in
`config_format` 14). A role for which no installed plugin ships a fitting
template is a **halt**, naming the two ways forward: install the stack plugin
that has one, or write it (`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`,
"Writing a stack plugin").

That refusal is the point. A `custom` pin recorded a stack vwf had no template
for — so no `conventions` prose for `plan` and `execute` to read, and no
`harness` block for `/vwf:doctor` to check — and the pipeline ran on with those
inputs missing and said nothing. Closing it makes the menu the whole vocabulary,
and makes adding to it a plugin rather than a config value.
