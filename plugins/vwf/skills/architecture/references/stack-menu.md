# The Stack Menu & the Per-Project Config Keys

Read this at step 3b, once the registry rows are settled and the stack, `design`
and `cicd` keys are the next thing to elicit. An update run that touches no
project's technology never needs it.

## The stack is a menu — elicited, and it lives in config, not the registry

Since format 19 a stack is composed from **four independent axes**
(`${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md`), each its own menu:

| Axis        | Scope       | Menu                    | Recorded as                              |
| ----------- | ----------- | ----------------------- | ---------------------------------------- |
| **project** | per project | the plugins' `project/` | `projects.<name>.stack.template`         |
| **backing** | per project | the plugins' `backing/` | `projects.<name>.stack.backing_template` |
| **deploy**  | per project | the plugins' `deploy/`  | `projects.<name>.stack.deploy_template`  |
| **repo**    | per repo    | the plugins' `repo/`    | `repo.stack.template`                    |

Elicit each as its **own** round (per `assets/elicitation.md` — one decision),
and per §3a of that protocol **every question names the project it decides**.
A stack round is the one kind that carries **no other (describe) option**: the
axes are closed to what the installed plugins ship (see Recording it below).
What it offers instead of free text is *defer this axis*, below.
Since format 13 the three
technology axes are per project, so "which datastore?" is never a question about
the product — it is a question about `api`, or about `website`:

- **project** — once per project, filtered to that project's `role`.
- **backing** — once per project, filtered to the capabilities that project
  declares in the registry. Records a **list**: one slug per capability it needs
  (datastore, identity, queue, object storage, telemetry sink). A project that
  talks to no backing service records `[]`.
- **deploy** — once per project, keyed on the **platform**, never the role.
  Records a **list** since format 16 — one slug per **delivery mechanism** the
  project ships through, since a project routinely has more than one. A project
  whose platforms are all screen platforms other than `site`/`webapp` records
  `[]`, shipping through a store rather than to a deploy target, as does an
  `iac` project, which *is* the deploy path. A project declaring `cli` **pins a
  deploy template for its package registry** — **which one is the stack
  plugin's answer**, and **vwf names no slug on this axis or any other**.
- **repo** — once per repo, filtered to templates whose `topologies` include
  this repo's.
- **design** — once per project, for **UI projects only** (a project declaring
  a screen platform). A project with no screen platform is not asked.
- **cicd** — once per project, for a project the pipeline builds. Ask once and
  offer the same answer for the rest; in a monorepo they will all match.

**Offer the previous project's answer as the default on the next.** Most
products do run every project on one cloud, and re-asking from scratch per
project would be tedious for the common case — but the answer is recorded per
project either way, so the moment one diverges the config can say so. Never
collapse the recorded values back into a shared pin.

## Every stack round also offers *defer this axis*

Alongside the menu entries, each of the four stack rounds offers one more
option: **defer this axis**, recorded as `unresolved`
(`${CLAUDE_PLUGIN_ROOT}/assets/vwf-config.md`, "The three axis states"). It is
not the retired *other (describe)* returning — that recorded a stack vwf had no
template for; this records no stack at all, out loud. Defining the product runs
to completion with every axis deferred, and `/vwf:plan` and `/vwf:execute` are
where it stops being optional.

**Say what would unlock the axis** rather than leaving the user to guess: which
stack plugin would have to be installed to offer a fitting template, or that no
installed plugin answers this axis at all. A user deferring because the menu was
empty and a user deferring because they have not decided land in the same config
state, and only the first can act on an install.

**Deferral is per axis, never per project.** One axis may read `unresolved`
while its siblings are pinned, and nothing about a sibling is inferred from it —
a deferred deploy axis says nothing about the project axis. On the two list axes
record the **bare scalar** — `deploy_template: unresolved`, never
`[ unresolved ]` — because deferral is a property of the axis, not of one
mechanism within it, so a list never mixes slugs with it. `[]` is the opposite
value, not a neighbour: it is a completed decision.

**A deferred project axis records `languages: []`.** That is the one legal empty
languages list — the plugin that would claim a token is exactly what has not
been chosen. Never carry tokens forward against an unresolved project axis.

**Re-running is how it gets answered later.** An update run re-asks only the
axes that read `unresolved`; the ones already pinned are settled, and are not
re-litigated.

## The two tool axes record into their own keys

`design` and `cicd` are ordinary axes at the menu — closed to what the installed
plugins ship, no *other (describe)* option — but they record into
`projects.<name>.design` and `projects.<name>.cicd` rather than into the
`stack` block, because they are chosen independently of a project's stack: two
projects on the same stack routinely use different design tools.

**The slug is the value.** A menu entry on these axes takes as its slug the very
token the config key holds, so recording the pick *is* writing the key. There is
one value and no second spelling to drift against — which is the whole reason
they are axes rather than free text.

**Never name a tool here.** The options come from the menu; this file lists
none, and vwf learns nothing about what any of them mean. `design` is read by
the design adapter, whose contract is
`${CLAUDE_PLUGIN_ROOT}/assets/design-adapter.md`; `cicd` is read by whatever
implements the delivery-pipeline contract vwf states and never implements.

The axes are orthogonal by construction — a project template never names a
vendor, a backing template never names a framework — so there is nothing to
merge and no precedence to resolve.

## Recording it

Record all of it in `.config/vwf.yaml` per the vwf-config asset. **Always write
the project block**, for every project: it is what `/vwf:doctor` checks the repo
against, and it cannot check what was never recorded.

vwf ships no default and marks no template recommended. Picking a project
template fills its four frontmatter axes, and a `languages` token is whatever the
stack plugin owning that language declares.

**The menu is the whole answer — there is no *other (describe)*.** Every axis
must resolve to a template an installed plugin ships, and every `languages` token
to one an installed plugin declares — or to a **materialized** template whose
payload carries `language_facts` for it (the materialized-template variant in
`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`). A materializing adapter's menu
may include its one open entry — *generate for an uncovered technology*, pinned
as `generated/<technology-slug>` — which is a legitimate pick, not a free-text
escape: the pin only resolves once the adapter's consent-gated materialization
lands, and the invocation passes the principles-catalog paths per the catalog
handover in that same asset. When nothing on any menu fits and no installed
adapter offers generation, say so and name the **three** ways forward: install
the stack plugin that has it, write one
(`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`, "Writing a stack plugin"), or
**defer the axis** and carry on defining the product. Before `config_format` 16
only the first two existed, so an empty menu was a halt; the third is what makes
it a postponement instead. Never record a free-text axis, never write
`template: custom` (retired
in `config_format` 14), and never record a language token no plugin declares —
each of those writes a config `/vwf:doctor` blocks on immediately, which is a
worse outcome than the halt because it arrives one command later. Why the menu is
closed at all is in `${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md`.

A pick off the menu needs no justification and gets **no** `enforcement` entry.
Use the optional `note` only when the reason isn't obvious from the template
name. A recorded stack is settled — never re-litigate it on update runs. In
update mode, a project whose manifest has clearly moved away from its recorded
stack is a delta to raise: align the config or ask.
