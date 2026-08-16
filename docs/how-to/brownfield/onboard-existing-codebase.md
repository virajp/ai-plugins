# Adopt vwf in a codebase that already works

You have a product in production, a team that knows it, and no vwf history at
all. This is the most common real entry point, and it inverts the greenfield
order: the system already exists, so the early commands are not deciding it —
they are writing down what is true, correcting it where the repo disagrees with
itself, and stopping at the point where the workflow can take over.

The worked example is **Bookable**, a booking product for studios. One pnpm
monorepo holds `apps/api` (an Express service), `apps/web` (a React app) and
`packages/shared`; it has real environment variables, a partial test suite, and
two years of history. At the end you have a stamped repo, a product contract, a
registry derived from it, a blueprint that describes what Bookable actually
does, and a first cycle plan that is small — because the surveyor found most of
the slice already built.

Mechanics — flags, halt conditions, config keys, file formats — live in the
[vwf plugin manual](../../plugins/vwf.md). Where a stretch of this journey is
identical to starting from nothing, this guide links
[the greenfield spine](../greenfield/single-repo.md) rather than repeating it.

## The journey

### 1. Install the plugin that owns each language first

```sh
pnpx @askviraj/ai-plugins --all \
  --user typescript --user datastore --user design-tools
```

The flag surface and scopes are the same as the greenfield run —
[install the plugins](../greenfield/single-repo.md#install-the-plugins) — but
the ordering matters more here, because the repo already has languages in it. A
language no installed stack plugin declares is recorded honestly by detection
and then **blocks** the doctor run inside setup's own spine, which halts the
onboard. Bookable is TypeScript throughout, so `typescript` covers both apps and
the shared package; `datastore` supplies the backing axis for the API's
Postgres; `design-tools` answers the design import that `apps/web` will make
mandatory.

Restart Claude Code, then `cd` into the Bookable repo — on a clean working tree,
since setup will ask what to do with a dirty one before it isolates a worktree.

### 2. /vwf:setup — detection, then confirmation

```text
/vwf:setup
```

Bookable has manifests and source directories, so setup takes its **code**
sub-path: it reads the repo and comes back with proposals, each carrying the
evidence that produced it, and you correct them one at a time by MCQ. Detection
is a starting point, never the truth — nothing it infers is recorded until you
have said so.

What Bookable's run proposes, and what the team answers:

- **Topology** — `monorepo`, from the pnpm workspace declaration. Accepted.
- **`apps/api`** — platforms `[service]`, role `backend`, with a project-axis
  template candidate narrowed by its manifest. Accepted.
- **`apps/web`** — platforms `[webapp]`, role `frontend`. A screen platform is
  never assumed, so this one is confirmed explicitly; confirming it is what
  makes the design system mandatory later.
- **`packages/shared`** — platforms `[packages]`, and the role is **asked, not
  guessed**. The same package consumed from both sides is a judgment call vwf
  refuses to make. Bookable answers `backend`, since the validation schemas
  originate with the API contract. The role is an index — the platforms are what
  everything downstream branches on — so the answer costs little either way.

Then the writes, and every one of them is shown first as a dry-run plan covering
each file created, moved and updated. Nothing lands until you approve. For
Bookable that plan holds the `docs/blueprint/` and `docs/plans/` trees, the
memory tree and the product's `mempalace.yaml`, a vwf section merged into the
existing `CLAUDE.md` (merged, not overwritten), and the mise config through
`/devtools:scaffold`.

Two brownfield-only items appear in that plan. **Harness detection** records
which verification capabilities the repo can already run: Bookable's `dev` task
and its API health endpoint are found, its missing local end-to-end stack is
recorded and **not** built — `/vwf:plan` injects the bootstrap when a cycle
first needs it. And because Bookable's API talks to outside services, the
**environment catalog** is bootstrapped from the env usage already in the repo —
`.env.example`, the config schema, the CI variables — as variable *names* with
their purpose and consumer. No value is ever copied into `environment.md`.

What setup will not do is move a single source file. Bookable's `apps/` grouping
differs from its topology template's, so the run ends with that written up as a
recommendation, naming the target layout and why it is worth the work. Full
mechanics: [`/vwf:setup`](../../plugins/vwf.md#vwfsetup) and
[Structure](../../plugins/vwf.md#structure).

After the approval gate and the commit, accept the graph build when it is
offered — setup is the only command that builds one, and the commands that
follow query it. What exists now: a stamped `.config/vwf.yaml`, the blueprint
and plan trees, the memory tree, and a recommendations report. No behaviour has
been described yet, and no code has moved.

### 3. /vwf:product — the contract for a product that already ships

```text
/vwf:product
```

The temptation here is to describe the software. Resist it: this doc pins the
**outcome**, and its reviewer subagent rejects a solution-shaped problem
statement whether or not the solution is already running in production.

Bookable's answers:

- **Problem** — studios take bookings by phone and message, so slots get
  double-booked and after-hours requests go unanswered until the next morning.
- **Users** — studio owners, who publish availability and manage bookings;
  clients, who book and reschedule.
- **Goals** — `#goal-no-double-booking` (no confirmed booking overlaps another
  for the same room; measured as overlapping confirmed bookings per month,
  target zero) and `#goal-self-serve-reschedule` (a client changes a booking
  without contacting the studio; measured as the share of reschedules completed
  in-app, target 80% within a quarter).
- **Slice priority** — reschedule first, then studio-side availability rules,
  then reminders.
- **Non-goals** — payments, staff scheduling, a marketplace.

Slice priority reads differently on a live product than on an empty repo: it
ranks the work **ahead**, not the work already done. What already ships still
gets blueprinted — it is the contract the rest of the product stands on — but it
is not what the priority orders. The ranking test is the same one the spine
uses: [slice priority](../greenfield/single-repo.md#slice-priority).

Output: `docs/blueprint/product.md`. See
[`/vwf:product`](../../plugins/vwf.md#vwfproduct).

### 4. /vwf:architecture — derivation, grounded twice

```text
/vwf:architecture
```

With `product.md` written and no registry yet, this command **derives rather
than interviews**: it reads the structural answers out of the contract you just
approved and hands each one back as a proposal quoting the sentence it rests on.
A value with no line behind it is left unresolved and elicited instead of filled
in, which is what lets you tell a reading from an invention.

Brownfield gives that derivation two more sources of grounding, and both are
worth knowing about because they are the difference between a second interview
and a review. Setup persisted its confirmed topology, roles, platforms and stack
pins to the `decisions` room, and this command recalls that room before
eliciting anything — so what you already settled comes back settled. It also
queries the knowledge graph for the system's actual shape, confirming every
graph-derived fact with you (or with the file it points at) before recording it.

Bookable's registry lands as three projects, `apps/api`, `apps/web` and
`packages/shared`, with `apps/api` carrying the capabilities its flows imply.
The stack axes are the one part the derivation only *narrows*: for whatever the
recorded pins do not already settle, it filters what the closed menu offers and
the menu still answers. Why the axes never merge:
[stack templates](../../plugins/vwf.md#stack-templates), and the practical
consequence at install time is in
[stack pins, one axis at a time](../greenfield/single-repo.md#stack-pins-one-axis-at-a-time).

Last comes the product-foundations walk — twelve concerns, one accept / adapt /
not-applicable question each, listed with a worked set of answers under
[the twelve foundations](../greenfield/single-repo.md#the-twelve-foundations).
Answer for the product you have. Bookable already writes an audit trail for
booking cancellations, so accepting that foundation records a contract the
blueprint then describes; the fact that the code exists shows up later as an
empty delta, not as a reason to skip the question.

Output: `docs/blueprint/registry.yaml`, `docs/blueprint/architecture.md`, and
the stack block in `.config/vwf.yaml`. This is the one doc that names
technologies — see [`/vwf:architecture`](../../plugins/vwf.md#vwfarchitecture).

### 5. /vwf:design-system

```text
/vwf:design-system
```

`apps/web` declares `webapp`, so this is a foundation rather than an option. The
command is import-only — the design tool configured for the project authors the
visual language and vwf distills what it returns into the offline contract that
the reviewers and the execute UX gate read.

The brownfield friction is real and worth naming: Bookable's visual language
currently lives in its stylesheets, and this command will not read it from
there. Someone has to represent the product's existing tokens and component
behaviours in the design tool, then import. Doing that badly is worse than doing
it late — the imported contract is what the UX gate judges every future screen
against. The stage otherwise runs exactly as it does on an empty repo:
[`/vwf:design-system` in the spine](../greenfield/single-repo.md#vwfdesign-system),
mechanics at [`/vwf:design-system`](../../plugins/vwf.md#vwfdesign-system).

### 6. /vwf:blueprint — describe what is true, not what is coded

```text
/vwf:blueprint
```

The longest stage, and on a brownfield repo the one that decides how much value
the rest of the workflow can give you. A run is a sweep: it works a coverage
worklist flow by flow until whole-product coverage holds and the coherence
review passes, then stamps coverage in `.config/vwf.yaml`. The shape of the
sweep, the per-doc reviewer gates and the standard-flow vocabulary are the same
as in the spine's [`/vwf:blueprint`](../greenfield/single-repo.md#vwfblueprint)
stretch.

What differs is where the answers come from. Bookable's flows —
`120-book-a-slot`, `130-reschedule`, `140-availability` — already run in
production, so the code is the best available evidence of what the product does.
It is evidence, not text to transcribe: the blueprint records the **contract**,
so a step whose behaviour the code decides accidentally still has to be decided
deliberately here, and none of it may name a file, a class, a library or a CSS
value. That bar is what keeps these docs true after the next refactor, and the
reviewer enforces it.

Two things surprise people the first time. Behaviour that already ships is
described exactly like behaviour that does not, and the `implementation:` stamp
on those new docs starts at `none` regardless — it is the pipeline's build-state
stamp, not a claim about your repo, and step 7 is where it gets corrected. And
the sweep will surface questions the code answers two different ways in two
places; those are contract holes, and settling them here is most of what this
stage buys you.

Full mechanics, including the density bars:
[`/vwf:blueprint`](../../plugins/vwf.md#vwfblueprint).

### 7. /vwf:plan — the payoff

```text
/vwf:plan reschedule
```

This is the stage that pays for the previous three. A plan is a diff — the
blueprint slice against the code the registry maps it to — and on a repo that
already implements most of the slice, the diff is small.

Bookable's run resolves the slice's dependency chain first: `130-reschedule`
stands on the `booking` entity, whose doc is stamped `none`, so it enters the
chain as its own element. Then a `plan-surveyor` subagent surveys each element
and returns the delta as terse `PRESENT` / `PARTIAL` / `ABSENT` lines with
`file:line` pointers — never code. For the `booking` entity every element comes
back `PRESENT`, the computed delta is empty, and the run offers to heal that
doc's stamp to `complete` and drop the element from the chain. Two years of
existing work stops being invisible to the workflow at that point.

The `130-reschedule` element is the real plan, and it is short: the surveyor
finds the reschedule endpoint `PARTIAL` — it exists but does not enforce the
notice window the blueprint pins — and the client-facing confirmation step
`ABSENT`, alongside reuse candidates the steps should build on rather than
duplicate. The plan also carries one bootstrap step vwf added itself, because
the acceptance criteria need a local end-to-end harness Bookable does not have
yet.

Two returns from a brownfield survey deserve a slow read at the approval gate.
`CONTRADICTIONS` means landed code asserts something the blueprint denies — see
[the drift the blueprint exposes](#the-drift-the-blueprint-exposes) below. And
the dependency list is where you consent to each new third-party package, which
matters more in a mature repo where something equivalent is often already
installed. See [`/vwf:plan`](../../plugins/vwf.md#vwfplan) and
[plan approval](../greenfield/single-repo.md#plan-approval).

### 8. /vwf:execute

```text
/vwf:execute
```

From here nothing is brownfield-specific: the run works the approved plan in a
dedicated worktree and ends at one human merge gate. Both are covered in the
spine — [`/vwf:execute`](../greenfield/single-repo.md#vwfexecute) and
[the execute merge gate](../greenfield/single-repo.md#the-execute-merge-gate) —
with the stage table and pause conditions at
[`/vwf:execute`](../../plugins/vwf.md#vwfexecute).

Bookable's first run merges with one gap: the blueprint never said whether a
reschedule inside the notice window is refused or escalated to the studio. It is
recorded rather than guessed at, and closing it at its source through
`/vwf:blueprint` is the offer at the gate.

Bookable deploys itself, as it always has; once the slice is live, the
post-deploy check is the spine's
[`/vwf:verify`](../greenfield/single-repo.md#vwfverify) stage, and from there
the loop is production talking back — route what it says with
[the production feedback loop](../operate/production-feedback-loop.md), and hand
a long session off rather than losing it with
[sessions and handoff](../operate/sessions-and-handoff.md).

## Decision points

### Blueprint what exists, or what should be

The single most consequential choice in this whole guide, and it is made per
flow, not once. Writing what the product **does today** gives you an accurate
contract: deltas come back empty, stamps heal, and the first plans are small and
real. Writing what the product **should do** gives you a wish list that the very
next plan will try to build — every improvement you smuggled into the contract
becomes work in the diff, scheduled without anyone deciding to schedule it.

The rule that makes the choice matter: the blueprint is the source of truth and
code follows it. So the honest sequence is to blueprint current behaviour, let
`plan` prove the code matches, and then change the contract deliberately through
another `/vwf:blueprint` pass when you want different behaviour. That second
pass demotes the affected doc's implementation stamp, and the next plan picks up
exactly that delta — which is the same mechanism, used on purpose.

The one place to break the rule is behaviour that is currently a **bug** by
anyone's reading. Pin the correct contract there; the drift becomes a plan step,
which is precisely where you want a bug fix to appear.

### The drift the blueprint exposes

Onboarding an existing codebase reliably surfaces places where the code and any
defensible contract disagree — the surveyor reports them as `CONTRADICTIONS`.
Nothing is resolved silently in either direction: the plan never bends the
blueprint to match the code, and it never resolves the contradiction inside
itself either. Your two options are to let the plan carry steps that conform the
code, or to consciously amend the contract through `/vwf:blueprint`. Either way
every contradiction is listed under the plan's risks and drift section with the
step or the amendment that resolves it, so nothing is settled by omission.

Expect the count to be highest on the first two or three slices and to fall off
sharply. A contradiction you would rather not fix yet is still worth recording
as drift, because the alternative — quietly editing the contract down to what
the code does — throws away the only signal that told you.

### Consent during reconciliation

Setup is the only command in this journey that touches files it did not create,
so it is worth knowing exactly what it may do. It creates and moves
**documentation**, always behind a dry-run plan you approve first, grouped by
kind. It never deletes: something superseded is moved, and the original stays
discoverable. It never overwrites without consent — your `CLAUDE.md` is merged,
not replaced. A doc move is a `git mv`, so history survives and only the links
the move broke are touched.

It moves **no source file at all**. Anything that would relocate code — an
in-repo regrouping, splitting a repo, extracting an `iac` project into its own —
is written up as a recommendation and never performed. A docs tool that moves
source can break a build it cannot test.

Saying no is therefore cheap, and it means one specific thing: the proposal
stops recurring, the underlying finding does not. A decline is recorded in
`.config/vwf.yaml` under `enforcement:` with your reason, and `/vwf:doctor`
keeps reporting the arrangement as a warning on every run — which is the honest
state of a repo that chose its own shape. Declining the whole dry-run plan
writes nothing at all; setup is re-runnable, and re-running is how you resume.

## When things halt

Each of these is a genuine stop this journey can hit, and each is explained
where it is enforced.

- **Setup halts and reverts its own stamp on a blocking `/vwf:doctor` finding**
  — a language no installed stack plugin declares is the one an
  otherwise-onboarded repo reaches.
  [`/vwf:setup`](../../plugins/vwf.md#vwfsetup)
- **A stack axis or platform with nothing fitting on the menu halts** rather
  than recording a free-text pin.
  [Stack templates](../../plugins/vwf.md#stack-templates)
- **Design-system halts with no registry**, and again if the project's design
  tool has no adapter answering it.
  [`/vwf:design-system`](../../plugins/vwf.md#vwfdesign-system)
- **Blueprint halts without `product.md`**, and again on the first flow with
  screens if the design system does not exist yet.
  [`/vwf:blueprint`](../../plugins/vwf.md#vwfblueprint)
- **Plan halts unless the blueprint coverage stamp reads complete**, and on any
  blocking doctor finding across the chain's projects.
  [`/vwf:plan`](../../plugins/vwf.md#vwfplan)
- **Execute halts on a plan whose prerequisite plans have not landed** — the
  chained entity plan before the flow that stands on it.
  [`/vwf:execute`](../../plugins/vwf.md#vwfexecute)
