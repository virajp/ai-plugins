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
Since format 13 all three
technology axes are per project, so "which datastore?" is never a question about
the product — it is a question about `api`, or about `website`:

- **project** — once per project, filtered to that project's `role`.
- **backing** — once per project, filtered to the capabilities that project
  declares in the registry. Records a **list**: one slug per capability it needs
  (datastore, identity, queue, object storage, telemetry sink). A project that
  talks to no backing service records `[]`.
- **deploy** — once per project. A `frontend` on a screen platform records
  `n/a`, a `cli` frontend `deploy/npm-package`, an `iac` project `n/a`.
- **repo** — once per repo, filtered to templates whose `topologies` include
  this repo's.

**Offer the previous project's answer as the default on the next.** Most
products do run every project on one cloud, and re-asking from scratch per
project would be tedious for the common case — but the answer is recorded per
project either way, so the moment one diverges the config can say so. Never
collapse the recorded values back into a shared pin.

## Two more per-project keys, elicited alongside the axes

- **`design`** — the design tool, for each **UI** project only (`site`,
  `fullstack`, `frontend`). A tool token — `claude-design`, `lovable`, `stitch`
  — resolved inside the design adapter, never a plugin name
  (`${CLAUDE_PLUGIN_ROOT}/assets/design-adapter.md`). A product may design its
  website in one tool and its app in another; ask per project.
- **`cicd`** — the CI system that builds and releases the project
  (`github-actions`, …). vwf owns the delivery-pipeline *contract* and never the
  mechanism, so this value is read only by the `cicd` plugin. Ask once and offer
  the same answer for every project; in a monorepo they will all match.

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
to one an installed plugin declares. When nothing on the menu fits, **halt** and
say so, naming the two ways forward: install the stack plugin that has it, or
write one (`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`, "Writing a stack
plugin"). Never record a free-text axis, never write `template: custom` (retired
in `config_format` 14), and never record a language token no plugin declares —
each of those writes a config `/vwf:doctor` blocks on immediately, which is a
worse outcome than the halt because it arrives one command later. Why the menu is
closed at all is in `${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md`.

A pick off the menu needs no justification and gets **no** `enforcement` entry.
Use the optional `note` only when the reason isn't obvious from the template
name. A recorded stack is settled — never re-litigate it on update runs. In
update mode, a project whose manifest has clearly moved away from its recorded
stack is a delta to raise: align the config or ask.
