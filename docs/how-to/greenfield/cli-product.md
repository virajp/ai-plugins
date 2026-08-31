# Build a product whose only surface is a terminal

vwf's spine assumes screens in several places — the design system is a
foundation, the blueprint mandates a canonical screen vocabulary, and the
execute run ends with a UX conformance gate. A command-line tool meets none of
those assumptions, and `cli` is the platform that says so: it is a platform but
not a *screen* platform, and that one distinction is what every divergence below
comes from.

The worked example is **clockon**, a CLI time tracker for freelancers. One repo,
one TypeScript project, `platforms: [cli]`, published to a package registry and
run on the user's own machine. At the end you have a product contract, a
blueprint whose flows are clockon's commands, a Terminal UX contract its output
is held to, and one slice built and merged by `/vwf:execute`.

This is a **delta guide**: it narrates only where clockon's journey leaves the
spine. Follow [start a product from an empty repo](./single-repo.md) alongside
it — every stage that runs unchanged is one sentence and a link back into it.
Mechanics stay in the [vwf plugin manual](../../plugins/vwf.md).

## The journey

### 1. Install the plugins

clockon's **pin** list is genuinely shorter than the spine's, not merely
different; the install is the same one name:

```sh
claude plugin install vwf@virajp-plugins
```

`stackgen` supplies both axes clockon pins — `typescript-effect-cli` on the
project axis and `npm-package` on the deploy axis — language doctrine included.
There is no backing bundle because clockon talks to no backing service; it
writes to a per-user file on the machine it runs on. And no design tool is
pinned, which is the first consequence of `cli` and is unpacked at
[`/vwf:design-system`](#4-vwfdesign-system) below. Scopes, the post-install
`/vwf:doctor` run and the memory daemon are unchanged:
[the spine's install step](./single-repo.md#install-the-plugins).

### 2. /vwf:setup and /vwf:product

Both run exactly as they do on the spine — [setup](./single-repo.md#vwfsetup)
bootstraps a blank repo, [product](./single-repo.md#vwfproduct) elicits the
outcome contract. What clockon answers is worth carrying forward, because the
rest of the guide leans on it:

- **Problem** — freelancers reconstruct their week from memory on Friday, so
  billable hours are guessed and under-billed.
- **Goals** — `#goal-no-lost-hours` (time is recorded as it happens; measured as
  the share of tracked days with an entry started before noon, target 80%) and
  `#goal-invoice-in-one-command` (a month's billable total is producible without
  a spreadsheet; measured as commands run to get it, target one).
- **Slice priority** — start and stop a timer first; then the daily report; then
  export.
- **Non-goals** — team accounts, a web dashboard, anything with a server.

### 3. /vwf:architecture

One round decides everything downstream: **platforms**. clockon answers `[cli]`
and nothing else. A screen platform is never assumed, so nothing is assumed here
either — and because `cli` is not one, that single answer is what exempts every
later stage from screens.

The stack rounds fall out of it. clockon pins `typescript-effect-cli` on the
project axis, which is the template declaring `platforms: [cli]`; `[]` on the
backing axis, an empty list being a real answer rather than a missing one; and
`npm-package` on the deploy axis, because a CLI ships through a registry rather
than to a target you deploy into. The axes stay independent for the usual
reason:
[stack pins, one axis at a time](./single-repo.md#stack-pins-one-axis-at-a-time).

Topology and the twelve foundations run unchanged
([topology](./single-repo.md#the-topology-answer),
[foundations](./single-repo.md#the-twelve-foundations)), though clockon marks
three not-applicable with the same justification — there is no server to
instrument, nobody to notify, and no shared resource to rate-limit. Reference:
[`/vwf:architecture`](../../plugins/vwf.md#vwfarchitecture).

### 4. /vwf:design-system

The stage that diverges hardest, and it diverges in both directions.

**It is not a foundation for clockon.** The mandate keys on a project declaring
a screen platform, so with `[cli]` alone nothing downstream waits on
`docs/blueprint/design-system.md` — the blueprint gate that stops the spine at
its first flow with screens never fires here.

**But `cli` still requires one section of it.** A terminal is a UI: output
shape, color roles, progress behaviour, error format and exit codes are
product-wide decisions with more than one reasonable answer, and once any
project declares `cli` the design system's **Terminal UX** section is required.
That section is unlike every other one in the doc — it is always elicited in
conversation, never imported, because no canvas designs a terminal.

Which leaves the wrinkle to know before you hit it: `/vwf:design-system` is an
import command, and on a registry with no screen platform it first asks whether
a design system is needed at all, then, on proceeding, resolves which design
tool to import from by reading the projects that declare a screen platform. A
cli-only registry has none, so running it on clockon reaches that resolution
with nothing to resolve. Treat Terminal UX as something you pin deliberately
rather than something the import hands you — see
[the Terminal UX contract](#the-terminal-ux-contract). Reference:
[`/vwf:design-system`](../../plugins/vwf.md#vwfdesign-system).

### 5. /vwf:blueprint

The sweep works as it does on [the spine](./single-repo.md#vwfblueprint), with
two things absent and one thing moved.

**Absent: the standard-flow vocabulary and its mandates.** `splash`, `home`,
`signin`, `profile` and the rest are screen journeys — a first frame to gate on,
a center of the app to return to — which a terminal tool does not have, so a
cli-only project is exempt rather than waived out. clockon's worklist opens
straight on the product's own journeys, taken from the slice priority:
`110-track-time`, `120-daily-report`, `130-export`. They still take numbers on
the product band, because the numbering is a build order and clockon has one
like anything else.

**Absent: everything downstream of a screen.** No `<platform>.md` files, no
Screens sections, no per-screen components, no mockups in the scratchpad tree,
no canvas. clockon's flows are `index.md` alone — the same shape a backend
service's flows take, arrived at from the other direction in
[a headless service](./api-only-service.md#6-vwfblueprint).

**Moved: what carries the contract instead.** A flow's observable surface is its
commands, its flags, its stdout and stderr, and its exit codes, and those belong
in the flow contract as firmly as screens would. For `110-track-time` clockon
pins that starting a timer while one is already running is an error rather than
a silent switch, and that the machine-readable output mode is contract rather
than convenience — anything scripting clockon depends on its stability. What
that means for how you write a flow:
[what a flow is with no screens](#what-a-flow-is-with-no-screens).

The per-doc completeness reviewer and the closing whole-product coherence review
run unchanged; only the render-and-review pass, which fires on flows with
screens, never fires at all. Reference:
[`/vwf:blueprint`](../../plugins/vwf.md#vwfblueprint).

### 6. /vwf:plan

No divergence. clockon plans `110-track-time`, whose dependency chain pulls the
`entry` entity into its own plan first, and both are approved on the same terms
as the spine's ([spine](./single-repo.md#vwfplan),
[plan approval](./single-repo.md#plan-approval),
[`/vwf:plan`](../../plugins/vwf.md#vwfplan)).

### 7. /vwf:execute

One stage of the run does not happen: the UX conformance pass runs only for
slices that change screens on a screen platform, so clockon's runs end after
acceptance. Terminal conformance is not dropped — it moves into the code review
stage, which checks the diff against the design system's Terminal UX section
when the project declares `cli`.

That relocation is the practical reason to have pinned Terminal UX at all. With
no such section there is nothing for the reviewer to hold clockon's output to,
no reviewer renders a terminal to catch it visually, and nothing anywhere halts
to tell you the check quietly did not run.

Everything else — the worktree, the per-step code/review/security loop, the
single human merge gate and how to judge it — is the spine's
([spine](./single-repo.md#vwfexecute),
[the merge gate](./single-repo.md#the-execute-merge-gate),
[`/vwf:execute`](../../plugins/vwf.md#vwfexecute)).

### 8. Releasing clockon

`/vwf:verify` checks deployed surfaces in a named environment, and clockon has
neither: the surfaces it resolves are services, workers and browser platforms,
and a package registry is not an environment you can point a base URL at.
clockon's release record is the published version itself — immutable, superseded
by the next patch rather than corrected — so the acceptance suite that ran
inside `/vwf:execute` is its last gate. Run
[`/vwf:verify`](../../plugins/vwf.md#vwfverify) if clockon later grows a service
to sync against.

The loop back from users is unchanged:
[the production feedback loop](../operate/production-feedback-loop.md), and
[sessions and handoff](../operate/sessions-and-handoff.md) when a session runs
long.

## Decision points

### What a flow is with no screens

The temptation on a CLI is to let a flow become a man page — one flow per
command, listing its flags. Resist it. A flow is still the user's journey, and
what makes it one is unchanged: it serves a product goal, and the reviewer
checks the `Serves:` link that says so. clockon's `110-track-time` covers
starting, switching and stopping a timer in one flow because that is one job the
user does, even though it is three commands; `130-export` is a separate flow
because producing an invoice is a separate job, not because it is a separate
binary.

What does change is where the contract's edges live. With screens, the sad paths
are states you can point at — an empty list, a disabled control, an error
banner. In a terminal they are exit codes and text on stderr, which are
invisible unless the flow writes them down. Pin per step what the user sees when
it fails and what the process returns, the same way a service flow pins its
status codes and error envelope. The completeness bars the reviewer applies are
the blueprint-authoring skill's, indexed under
[vwf skills](../../plugins/vwf.md#vwf-skills).

### The Terminal UX contract

It is a section of `docs/blueprint/design-system.md`, and what goes in it are
answers rather than categories. clockon prints timings as a table on stdout and
gives `report` a `--json` mode for anything scripting it; errors go to stderr in
the shape *what happened, why, what to do next*, and starting a timer while one
is already running exits non-zero rather than switching silently — the case
`110-track-time` pins as a flow step, held here as the product-wide rule every
later command inherits. Color carries role names only, suppressed whenever
stdout is not a terminal, so a piped `report` is parseable by construction. What
the section has to cover in full — output modes, color semantics, progress
conventions, errors and exit codes, help and naming — is the
design-system-authoring skill's, indexed under
[vwf skills](../../plugins/vwf.md#vwf-skills).

Two things make it worth pinning early even though nothing halts if you skip it.
It is **product-wide**: a command added six months from now either matches the
first command's error shape or clockon reads as two tools wearing one name. And
it is **the only thing the execute code reviewer can measure clockon's output
against** — an unwritten contract is an unchecked one, and the absence is
silent.

Keep it a contract. The argument-parsing library, the rendering framework and
shell-completion mechanics are realization and belong to `/vwf:plan`. The
section records the rule, never the package that implements it.

## When things halt

Each is a genuine stop, and each is explained where it is enforced.

- **Blueprint halts without `product.md`.** The screens half of that gate cannot
  fire for clockon, since no flow has any.
  [`/vwf:blueprint`](../../plugins/vwf.md#vwfblueprint)
- **Design-system halts with no registry**, which is the halt to expect if you
  reach for it before `/vwf:architecture` has declared clockon's platforms.
  [`/vwf:design-system`](../../plugins/vwf.md#vwfdesign-system)
- **Plan halts unless the blueprint coverage stamp reads complete**, and on any
  blocking doctor finding. [`/vwf:plan`](../../plugins/vwf.md#vwfplan)
- **Execute halts on a plan whose prerequisites have not landed.**
  [`/vwf:execute`](../../plugins/vwf.md#vwfexecute)
- **A stack axis with nothing fitting on the menu halts** rather than recording
  a free-text pin, which is what makes having `stackgen` installed before
  `/vwf:architecture` a prerequisite rather than a convenience —
  [stack pins, one axis at a time](./single-repo.md#stack-pins-one-axis-at-a-time)
