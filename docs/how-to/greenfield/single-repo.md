# Start a product from an empty repo

You have an idea, an empty git repo, and `vwf` installed. This guide walks the
whole spine — install through first deploy verification — as one continuous
session log, so you can follow it without having read anything else. Every other
guide in `docs/how-to/` links into a stage of it.

The worked example is **Relay**, a team task manager. Relay is one repo holding
one project: a TypeScript service that serves both its own API and its web app,
backed by Postgres. At the end you have a described product, a complete
blueprint, one slice built and merged by `/vwf:execute`, and a verified staging
deploy.

Mechanics — flags, halt conditions, config keys, file formats — live in the
[vwf plugin manual](../../plugins/vwf.md). This guide covers the journey and the
decisions; when it names a command, the manual section is the link.

## The journey

### Install the plugins

One install brings everything Relay needs.

```sh
claude plugin marketplace add virajp/ai-plugins   # once

claude plugin install vwf@virajp-plugins
```

One name is the whole list: `stackgen` is a vwf dependency and arrives with it
at the same scope. `stackgen` is what supplies every bundle Relay will pin — the
project-axis template with its TypeScript language doctrine, Postgres on the
backing axis, and the design-tool pack that answers the design imports. vwf
ships no stack templates of its own, so without `stackgen` the stack menus come
back empty and, with no design pack materialized, `/vwf:design-system` cannot
run at all. Scopes and upgrades:
[the installer CLI](../../cli/usage.md#installing-plugins).

**Then run `/vwf:doctor`.** Nothing is checked at install time, so doctor is
what tells you whether the binaries vwf shells out to are actually on your
`PATH` — see [Prerequisites](../../plugins/vwf.md#prerequisites). The memory
daemon is yours to run.

Restart Claude Code, then `cd` into the empty Relay repo.

### /vwf:setup

```text
/vwf:setup
```

A repo with no manifest, no source directories and no `docs/blueprint/` is
*blank*, and setup treats it as such: it asks nothing about architecture,
because nothing is there to interrogate and those decisions belong to the two
commands that will have the product contract to derive them from. What it does
instead is make the repo ready for that conversation — tooling, the empty doc
trees, the memory tree, a `.graphifyignore` carrying the standard excludes, a
vwf section in `CLAUDE.md` — and stop there.

It asks exactly two questions, both proposed from the directory name. Relay
answers `relay` to both — the product name, and the memory wing.

Everything is shown for approval before it is written, and nothing is written
until you approve. Accept the graph build when it is offered — setup is the only
command that builds one. What the run stamps describes a repo that has been
bootstrapped and nothing more: the absence of a topology or project block is the
honest *structure-pending* state, not drift, and the commands that follow are
what fill it in. Details: [`/vwf:setup`](../../plugins/vwf.md#vwfsetup).

Relay now has a committed repo that the rest of the workflow can read, with the
blueprint and plan trees empty and waiting.

### /vwf:product

```text
/vwf:product
```

The Phase −1 outcome contract, and the first real conversation. It elicits the
problem and why now, the users, measurable goals under stable anchors, the slice
priority, non-goals, and the riskiest assumptions — one question per round.

Relay's answers:

- **Problem** — small teams track work in chat, so ownership and status live in
  someone's memory and are re-asked every standup.
- **Users** — team members, who create and complete tasks; team admins, who
  manage membership.
- **Goals** — `#goal-ownership-visible` (every open task shows one owner and one
  due date; measured as the share of open tasks with both, target 90% by week
  four of use) and `#goal-standup-free` (a team's open work is readable in one
  screen; measured as median time to answer "what is blocked", target under 30
  seconds).
- **Slice priority** — create and assign a task first, because nothing else in
  the product is worth anything without it; then the team board; then
  notifications.
- **Non-goals** — time tracking, billing, anything resembling a Gantt chart.

A `product-reviewer` subagent gates the doc: an unmeasurable metric or a
solution-shaped problem statement comes back as a gap, not a pass. Relay's first
draft failed on "make standups faster" and was reworked into the timing metric
above.

Output: `docs/blueprint/product.md`. Re-run it on any product change — see
[`/vwf:product`](../../plugins/vwf.md#vwfproduct).

### /vwf:architecture

```text
/vwf:architecture
```

With `product.md` written and no registry yet, this command **derives rather
than interviews**: it reads the structural answers out of the contract you just
approved and hands each one back as a proposal quoting the sentence it rests on.
You correct by MCQ, one decision per round; anything the contract
underdetermines falls back to the interview.

Relay's round of corrections:

- **Topology** — proposed `repo`, accepted. One codebase, one release cadence.
- **Projects** — one, named `relay`.
- **Platforms** — `[service, webapp]`. A screen platform is never assumed, so
  `webapp` is confirmed explicitly; confirming it is what makes the design
  system mandatory.
- **Capabilities** — task ownership implies accounts, so the auth capability
  goes on the registry entry. That decision reappears in the blueprint as a
  mandate.

Then the stack menu, one round per axis, presenting the union of what the
installed stack plugins offer. Relay pins `typescript-hono-refine` on the
project axis (it is the template that serves `service` and `webapp` from one
codebase), `postgres` on the backing axis and `container-generic` on the deploy
axis, both from `stackgen`. The repo axis is answered once for the checkout
rather than per project. What each axis means and why they never merge:
[stack templates](../../plugins/vwf.md#stack-templates).

Last comes the product-foundations walk — twelve concerns, one accept / adapt /
not-applicable question each. Relay's answers are in
[The twelve foundations](#the-twelve-foundations) below.

Output: `docs/blueprint/registry.yaml` (authoritative) and
`docs/blueprint/architecture.md` (its prose view, with a system-shape diagram),
plus the stack block in `.config/vwf.yaml`. This is the one doc that names
technologies — see [`/vwf:architecture`](../../plugins/vwf.md#vwfarchitecture).

### /vwf:design-system

```text
/vwf:design-system
```

Relay declared `webapp`, so the design system is a foundation, not an option:
the blueprint will halt on the first flow with screens until it exists. The
command is **import-only** — the design tool configured for the project authors
the visual language, and vwf distills what it returns into
`docs/blueprint/design-system.md` as the offline contract the reviewers, the
coder and the execute UX gate read without a network. It elicits only what a
canvas never decides, such as the accessibility conformance target; Relay
answers WCAG 2.2 AA.

Relay's team picks a stock design system in their tool, imports it, and moves
on. If you want to design Relay's screens on a canvas rather than review vwf's
contract-derived renders, that whole loop — briefs out, design, import back — is
its own guide: [design a UI with a design tool](./ui-with-design-tool.md).
Reference: [`/vwf:design-system`](../../plugins/vwf.md#vwfdesign-system).

### /vwf:blueprint

```text
/vwf:blueprint
```

The longest stage, and the one that decides how much `plan` and `execute` have
to guess. A run is a **sweep**: it derives a coverage worklist and works it flow
by flow until whole-product coverage holds and the whole-product coherence
review passes, then stamps the coverage in `.config/vwf.yaml`.

Relay's worklist opens with the standard flows its registry entry mandates —
`100-home`, which every project declaring a screen platform carries, and
`020-signin`, `030-recover-account`, `910-profile`, `940-delete-account`, which
the auth capability brings with it — then the product's own journeys from the
slice priority: `110-create-task`, `120-team-board`, and
`130-task-notifications`, which Relay elicits for itself rather than inheriting.

Per flow the conversation is the same shape: trigger and actors, the ordered
steps, what happens when each one fails, the screens and their components, the
jobs, the acceptance criteria. For `110-create-task` Relay pins that an
unassigned task is invalid — an owner is chosen at creation, not after — and
that a due date in the past is rejected at the boundary rather than coerced.
Each flow then derives what it stands on: the `task`, `team` and `user` entities
with their `schema.yaml` data models, the operations in
`apis/relay.openapi.yaml`, the catalog rows, the ER diagram.

Two gates run per doc — a completeness reviewer and, where screens changed, a
render-and-review pass that puts static HTML mockups in the gitignored
`docs/scratchpad/` tree for you to open in a browser. Relay's reviewer bounced
`120-team-board` once for a filter whose empty state nobody had pinned.

When the worklist empties, the coherence reviewer walks every flow end to end
across entities, schemas and contracts. Relay's first pass came back with one
gap: `130-task-notifications` sent on a status change the `task` lifecycle had
no transition for. Fixing the lifecycle cleared it, and coverage stamped
complete. Full mechanics, including the density bars and the standard-flow
vocabulary: [`/vwf:blueprint`](../../plugins/vwf.md#vwfblueprint).

Stopping early is fine — the stamp records what remains and the next run picks
it up. But `plan` will not run until it reads complete.

### /vwf:plan

```text
/vwf:plan create-task
```

A plan is a **diff**: desired state (the blueprint slice, its schemas, the API
contract, conventions, the registry) against actual state (the code the registry
maps it to), written as the delta and nothing else. On a greenfield repo the
delta is nearly everything, which is exactly why the dependency chain matters —
`110-create-task` stands on the `task` entity, which nothing has built, so that
entity becomes its own plan first, planned and approved behind its own gate and
linked to the flow's plan by frontmatter.

Relay reviews two plan docs in `docs/plans/`, in order. Each step names the
failing test that defines "done", and the plan names every third-party package
the run is allowed to install — approving the plan is where you consent to each
one. Relay approves the entity plan, then approves the flow plan straight into
execution. See [`/vwf:plan`](../../plugins/vwf.md#vwfplan).

### /vwf:execute

```text
/vwf:execute
```

This is the unattended stage. It runs in a dedicated worktree and works the
plan's steps in dependency order, each step through code, review and security,
looping findings back into the code. After all steps land, one acceptance and UX
pass runs against the whole slice. Nothing asks you anything unless it hits a
pause condition — those are listed under
[`/vwf:execute`](../../plugins/vwf.md#vwfexecute).

It ends at **one human gate**, where it reads the run back out of its journal:
per-step commits, coverage, the acceptance and UX results, the implementation
stamps it wrote onto the blueprint docs, and the consolidated gap list. Relay's
entity run reaches the gate clean; the flow run carries one gap — the blueprint
never said what happens to a task whose assignee leaves the team — recorded
rather than guessed at.

Relay approves both merges, then accepts the offer to close that gap at its
source through `/vwf:blueprint`. Approving hands the merge to
`/vwf:git-workflow`, which confirms once more; reject and the worktree is left
intact. The stage table and the resource caps:
[`/vwf:execute`](../../plugins/vwf.md#vwfexecute).

A long run can pause on a resource cap and hand off instead of finishing, which
needs an external caps hook (`brew install virajp/tap/claude-status`) —
[sessions and handoff](../operate/sessions-and-handoff.md) covers that.

### /vwf:verify

vwf never deploys. Relay's pipeline pushes a staging tag, and once the deploy is
live:

```text
/vwf:verify staging
```

It health-checks every deployed project in that environment, then re-runs the
blueprint's acceptance criteria against the real thing — **all** flows, not just
the one just built, so a regression in something untouched still surfaces. A
behaviour failure becomes a gap with a blueprint or plan offer; an
infrastructure failure is reported as operational and never filed as a blueprint
gap.

Relay's staging run passes. Later, after the first production deploy, a clean
`/vwf:verify production` offers to record a release, freezing each standalone
`service` project's contract so backward compatibility is enforceable from then
on. Relay is skipped: it declares `[service, webapp]`, so its API serves its own
UI in the same deployable and there is no independent consumer to protect.
Details: [`/vwf:verify`](../../plugins/vwf.md#vwfverify).

From here the loop is production talking back: route what it says with
[the production feedback loop](../operate/production-feedback-loop.md), and when
a session runs long, hand it off rather than losing it —
[sessions and handoff](../operate/sessions-and-handoff.md).

## Decision points

### The topology answer

Relay is one repo because its code shares one dependency graph and one release
cadence. That, not project count, is the deciding question: a second project
that ships on a different cadence — a mobile app beside this service — makes it
a multi-repo product, and that is a different guide. Getting it wrong is
recoverable but expensive, since the topology decides where the blueprint lives
and how `plan` maps a slice to code. The three templates and the multi-repo
linkage choice are in [Structure](../../plugins/vwf.md#structure).

Note where this question is *asked*: on a blank repo, `/vwf:setup` does not ask
it. `/vwf:architecture` derives it from `product.md` and confirms it with you.

### Stack pins, one axis at a time

The axes are independent by construction — a project template names no vendor, a
backing template names no framework — so Relay picking Hono does not silently
buy it a database or a deploy target. Each axis is its own question, answered
from a closed menu: the union of what your installed plugins offer *is* the
vocabulary. Nothing on the menu fitting is a halt, not a free-text pin, because
a stack no plugin defines supplies no conventions to plan against, no harness to
build against and no UX gate — and a run against it would lose every guarantee
while reporting itself healthy.

The practical consequence, and it has two halves: install the plugins that own
your technology, and list them in the product's `stacks:` roster, before you
reach `/vwf:architecture` — or the menu is short and you will pin something you
did not want. [Stack templates](../../plugins/vwf.md#stack-templates).

### The twelve foundations

`/vwf:architecture` walks twelve concerns every product eventually hits, each
with a default contract, as one accept / adapt / not-applicable question. They
are elicited defaults, not enforced rules — declining one is a recorded
decision. Relay's answers, and why:

| Foundation           | Relay                                                              |
| -------------------- | ------------------------------------------------------------------ |
| Users & operators    | Accept — members and admins, exactly the two classes product named |
| Observability        | Accept — the default is vendor-neutral, so it costs nothing now    |
| Audit logs           | Adapt — membership changes only; task edits are not privileged     |
| Change logs          | Accept                                                             |
| Background processes | Accept — notifications are durable work, so they get a worker      |
| Data retention & PII | Accept — delete by default, no PII in logs                         |
| Notifications        | Accept — email first, push deferred with the platform              |
| Runtime settings     | Accept                                                             |
| Rate limiting        | Accept                                                             |
| Reliability targets  | Adapt — one service, so one availability target, no per-tier SLOs  |
| DR & backup          | Accept — the datastore has an RPO/RTO, restores drilled quarterly  |
| Cost guardrails      | Not applicable — one small deployment, revisit at scale            |

Answer these honestly rather than accepting everything: each accepted foundation
becomes contract that `/vwf:blueprint` expands into `conventions.md` anchors and
per-flow surfaces, and every one of those is work. The reference per foundation
is the `product-foundations` skill, indexed under
[vwf skills](../../plugins/vwf.md#vwf-skills).

### Slice priority

Slice priority in `product.md` is the order the blueprint sweeps and the order
you plan in, so it is a build order, not a wish list. The test Relay used: which
slice, if it were the only thing that shipped, would still serve a goal? Task
creation with an owner does. A team board with nothing on it does not.

Re-ranking later is a `/vwf:product` update, and `/vwf:feedback` offers exactly
that when a metric reading misses.

### Plan approval

The plan gate is the last point where a *how* question is cheap. Two things are
worth reading closely before approving: the step order, since it is what
`execute` runs and each step's failing test is what "done" means; and the
dependency list, since the coder installs only the packages the plan names and
one it missed becomes a gap instead of an install.

A *what* question — a behaviour the blueprint never pinned — is never settled in
the plan. It routes back through `/vwf:blueprint` and the diff is re-derived, so
an approved plan carries no open decisions into an unattended run.

### The execute merge gate

The one human decision in an autonomous run, and it is a merge decision, not a
code review — the adversarial review already happened, twice, inside the run.
What you are judging is whether the run's account holds: the gap list, the
acceptance and UX results, and whether the stages that were skipped were skipped
for reasons you accept. If memory was down for part of the run, the report says
it is reconstructed; that changes how much weight it carries.

Gaps do not block the merge and should not be treated as blockers. Merge, then
take the offer to close each one at its source.

## When things halt

Each of these is a genuine stop, not a warning, and each is explained where it
is enforced.

- **Setup halts on a blocking `/vwf:doctor` finding.**
  [`/vwf:setup`](../../plugins/vwf.md#vwfsetup)
- **Blueprint halts without `product.md`**, and again on the first flow with
  screens if the design system does not exist yet.
  [`/vwf:blueprint`](../../plugins/vwf.md#vwfblueprint)
- **Design-system halts with no registry**, since it has nothing to check a UI
  project against. [`/vwf:design-system`](../../plugins/vwf.md#vwfdesign-system)
- **Plan halts unless the blueprint coverage stamp reads complete**, and on any
  blocking doctor finding across the chain's projects.
  [`/vwf:plan`](../../plugins/vwf.md#vwfplan)
- **Execute halts on a plan whose prerequisites have not landed.**
  [`/vwf:execute`](../../plugins/vwf.md#vwfexecute)
- **A stack axis with nothing fitting on the menu halts** rather than recording
  a free-text pin. [Stack templates](../../plugins/vwf.md#stack-templates)
