# Plugin Contract

A **plugin project** (registry platform `plugin`) extends a host application
rather than running on its own. Its flows are its **invocable** extension points
— one flow per registration something can *trigger*: a command, a skill a user
or the model can invoke, a hook the host fires. Named for what it does. Every
one is `index.md` alone: `plugin` is screenless, so it takes no
`<platform>.md`, and never reaches `/vwf:screens`, `/vwf:mockups`, the canvas or
the scratchpad.

**Invocable is the whole test, and it follows from what a flow is** — a journey
to an observable outcome. Two kinds of registration are therefore **not** flows,
and putting them in their own flow doc is the error this rule exists to prevent:

| Registration                                                     | Where it belongs                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| A **subagent** — dispatched by another extension point           | a **step** of each flow that dispatches it, named there                          |
| **Auto-applying doctrine** — read automatically while editing    | a **Reference** on the flows it governs                                          |

Neither has a trigger or an outcome of its own. A subagent is a subroutine of
the journey that dispatched it; doctrine is a constraint on other journeys. A
flow doc for either describes something nobody can start.

**Why this is stated rather than left to judgment.** The earlier reading — one
flow per skill, agent or hook — was measured on a repo shipping fifteen plugins
from one project: **102 flows at roughly 250k tokens each**, which is not a
sweep anyone completes. Cutting to invocable points more than halves it while
*losing nothing*, because the excluded registrations are still fully described —
just in the flow that uses them, which is also where their inputs and gates
actually mean something.

A repo where even the invocable set is unmanageable is a signal to split the
registry project (see **Registry** below), not to coarsen the flows.

`plugin` is the **one** `system` platform the surveyor covers. An unrepresented
`plugin` project is a hole, not an exemption.

**Numbers, not standard slugs.** The standard-flows vocabulary is screen
journeys, so none of it is mandated here — a plugin flow is named by the
extension point it registers. It still takes a number on the project's own
number line, assigned in the order the flows read.

This bar is **host-agnostic**. Which extension mechanisms exist, what each
supplies, and how invocation is spelled are the **stack template's** business,
resolved from the project's pin — not vwf's.

**But the mechanism is named, and this is the one place code-independence
yields.** Read the two rules together or the required sections become
unwritable: *Host & extension point* and *Invocation surface* must name **which**
mechanism this flow registers against, in the host's own vocabulary, because
each supplies different inputs and offers different invocation states. A flow
that says only "an extension point" has recorded nothing — and the wrong choice
here is the failure most hosts report as *nothing at all*, so the naming **is**
the contract.

The line, stated so it does not have to be re-derived:

- **Name** the mechanism and the invocation state — the host's vocabulary for
  its own extension model, which is a fact about the host, not about this
  product's code.
- **Do not name** the host's version, its file layout, its frontmatter keys or
  field spellings, or any command string. Those are realization.

Naming a *framework* in a service flow is still the violation it always was;
this carve-out is the extension model only, and it exists because a plugin flow
has nothing left to say without it.

## Per-flow sections

A plugin flow carries the flow contract's **Purpose**, **Trigger & Actors**,
**Steps**, **Guarantees**, **Diagram**, **Acceptance**, **References** and
**Open Questions** unchanged — read [Flow contract](flow-contract.md) for those.
It omits **Platforms** (screenless) and, unless the host runs one, **Background
Jobs**. On top, it must pin down five things a service flow has no equivalent
for:

- **Host & extension point** — which host application, and which of its
  extension mechanisms this flow registers against. One line. The mechanism is
  named in the host's own vocabulary, taken from the stack template.
- **Invocation surface** — who can trigger this extension point and how, plus
  **why that surface and not another**. Where a host offers more than one
  invocation state, name the one chosen and the consequence of the others: a
  wrong choice here is the failure mode most hosts report as *nothing at all*,
  so the reasoning is the contract, not decoration.
- **What the host supplies** — the inputs the extension point hands over, and
  which are guaranteed present versus conditional. This is the plugin's
  equivalent of a request body; a flow that reads something the host does not
  supply is a defect the contract should have caught.
- **Gates & halts** — every condition under which the flow **refuses to
  proceed**, each with what the user is told. For a workflow plugin this is
  most of the contract. State the halt, not the remedy's implementation.
- **Artifacts written** — what lands on disk, where, and whether it is
  committed or ignored. This is what makes a plugin flow's effects observable
  and therefore acceptance-testable; a flow writing nothing says
  `none — <what it returns instead>`.

## Acceptance for a screenless extension point

The same Given/When/Then bar, read against the two things a host makes
observable: **the artifacts written** and **the halts taken**. "The skill runs"
is not a criterion; "given no `product.md`, the flow halts and names
`/vwf:product`" is. Every gate declared above is worth one criterion, since a
halt nobody tested is a halt that silently stopped happening.

## What stays out

- **Directory layout, file names, frontmatter keys, manifest fields.** All
  realization — `plan`'s business, and mostly the host's own convention.
- **Prose the artifact itself carries.** A skill's instructions are its
  implementation; the blueprint records what it must decide and refuse, never
  the wording it decides in.
- **The host's version, and any per-version behaviour.** That is a stack fact.

## Registry

A plugin project is `role: system`, `platforms: [ plugin ]`. It publishes no
API contract and declares no health path — `service` obligations do not follow
from being covered. Where one repo ships several plugins against the same host,
that is a judgment call between one project with many flows and one project
each: split when they are versioned and installed independently.
