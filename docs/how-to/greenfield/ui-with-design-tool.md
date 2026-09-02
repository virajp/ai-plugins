# Design a product's screens in a design tool, then build them

Your product is mostly interface, and the visuals are decided on a canvas rather
than in a table. vwf supports that directly: the design tool authors the design
system and the screens, vwf imports both as contract, and every stage after that
reads the imported contract instead of the canvas.

The worked example is **Centwise**, a Flutter expense tracker for phones. One
repo, one project, one platform — `mobile` — with Claude Design as the design
tool, materialized by `stackgen`'s `claude-design` pack. At the end Centwise has
an imported design system, flow contracts whose screens were designed on the
canvas and folded back, and one slice built and merged with its screens checked
against those contracts by Flutter's own golden and accessibility tests.

This is a **delta guide**. The spine it diverges from is
[start a product from an empty repo](./single-repo.md), which walks setup
through verification for a product with no canvas in the loop; read it first.
Everything below narrates only where Centwise's journey differs. Mechanics —
flags, halt wording, config keys, payload shapes — stay in the
[vwf plugin manual](../../plugins/vwf.md) and the
[stackgen manual](../../plugins/stackgen.md).

## The journey

### 1. Install the plugins

Centwise's install is the spine's exactly — what differs is which bundles it
pins afterwards.

```sh
claude plugin install vwf@virajp-plugins
```

`stackgen` supplies the `dart-flutter` bundle — its Dart, Kotlin and Swift
doctrine, and the language servers it declares — plus the `ux-gate` that renders
Flutter screens, which matters at the end of the run, and the `claude-design`
pack, without which `/vwf:design-system` has nothing to import from. Scopes and
upgrades: [the installer CLI](../../cli/usage.md#installing-plugins); the rest
of this step is the spine's
[Install the plugins](./single-repo.md#install-the-plugins).

Then connect the canvas. Claude Design is a remote MCP server, and pinning the
`claude-design` bundle wires it into the repo's own `.mcp.json` behind its own
consent line; run `/mcp` and sign in once. Lovable and Stitch are packs of their
own and bring different surfaces.

### 2. /vwf:setup and /vwf:product

No divergence. Centwise bootstraps the repo
([`/vwf:setup`](./single-repo.md#vwfsetup)) and writes its outcome contract
([`/vwf:product`](./single-repo.md#vwfproduct)) exactly as Relay does. The goals
worth carrying forward are `#goal-capture-in-seconds` (an expense is recorded
without leaving the home screen) and `#goal-month-is-legible` (this month's
spend is readable at a glance), and the slice priority opens with capturing an
expense.

### 3. /vwf:architecture

```text
/vwf:architecture
```

The spine's [`/vwf:architecture`](./single-repo.md#vwfarchitecture) describes
the derive-and-correct shape. Two of Centwise's answers are the delta:

- **Platforms** — `[mobile]` alone. That is a **device** platform, not a browser
  one, and the choice reaches further than it looks: it decides which standard
  flows the blueprint mandates, that screens land in `mobile.md` files, and
  which toolchain checks the built screens in step 9.
- **Design tool** — `claude-design`, asked once per project that declares a
  screen platform and recorded against that project. It is a bundle slug, and
  the slug *is* the config token, so pinning it and writing the key are one act.
  A product with two UI projects can answer it twice with two different tools:
  [stackgen](../../plugins/stackgen.md).

On the stack menu Centwise pins `dart-flutter` on the project axis — the
stackgen bundle serving mobile, tablet, desktop and webapp from one codebase
([stack templates](../../plugins/vwf.md#stack-templates)). The other axes work
as in the spine's
[stack pins, one axis at a time](./single-repo.md#stack-pins-one-axis-at-a-time),
and the thirteen-foundation walk is unchanged from
[the thirteen foundations](./single-repo.md#the-thirteen-foundations).

### 4. /vwf:design-system

```text
/vwf:design-system
```

This is where the canvas takes over authoring. Before running it, Centwise's
designer opens claude.ai/design and settles the design system there — semantic
colors, type and spacing scales, motion, component behaviors. **vwf authors none
of that.** The command resolves the project's tool, delegates the read to the
adapter, and distills what comes back into `docs/blueprint/design-system.md`.

What that repo doc buys you is the reason the import exists: it is the offline
contract. The completeness reviewer, the coder, and the UX gate at the end of an
execute run all read it without a network call or a canvas login, and it is
diffable in review like any other file.

The import fills what the tool actually reported; anything it reported as
unknown is **elicited, never inferred**. Centwise answers two such questions —
WCAG 2.2 AA as the conformance target, and a short anti-pattern list its design
system never wrote down. A `design-system-reviewer` subagent then gates the doc:
a *decision* hole comes back as a question, but a *visual* gap is canvas rework
— you fix it in the design tool and import again. Because Claude Design stores
design systems as real objects, Centwise's import is a read of an authoritative
source rather than tokens reconstructed from generated code; tools without that
storage return a snapshot instead, which is a difference worth knowing before
you pick one.

The run ends by pinning the design system's identifier so the next import
resolves without asking. Reference:
[`/vwf:design-system`](../../plugins/vwf.md#vwfdesign-system).

### 5. /vwf:blueprint, up to the screens

```text
/vwf:blueprint
```

The sweep works as the spine describes
([`/vwf:blueprint`](./single-repo.md#vwfblueprint)), with one consequence of the
device platform: Centwise's mandated standard flows include `010-splash`
alongside `100-home`, which a browser-only product would not carry. Its own
journeys follow the slice priority — `110-capture-expense`, then
`120-month-summary`.

The divergence is at each flow's screens. A pass that touches screens normally
renders them itself and asks for your remarks; here you take the
**design-first** option instead, deferring that flow's screens to the canvas.
Which of the two you want, and when, is
[design first, or review the renders](#design-first-or-review-the-renders)
below.

### 6. /vwf:screens prompt

```text
/vwf:screens prompt capture-expense
```

This writes a design brief per platform — for Centwise, one `mobile.md` under
`docs/prompts/screens/` — and **the file is the deliverable**. vwf does not run
it against the canvas; you paste it into the canvas chat yourself. The brief is
always the flow's full screen blueprint rather than a change note, so re-running
it after the contract moves gives the canvas something to reconcile against
rather than a diff to interpret.

It also maintains a conventions file for the platform's canvas project — the
naming contract, the device frame, the standing tweaks — which you set as that
canvas project's own CLAUDE.md. The naming contract the brief carries is the
join key: break it on the canvas and the import has nothing to match on.

Nothing that steers the *visual* design is in the brief. Tokens, type and
spacing come from the design system the tool already holds; what the brief pins
is what each screen shows and how it behaves, because that is contract.
Reference: [`/vwf:screens`](../../plugins/vwf.md#vwfscreens).

### 7. Design on the canvas

Centwise's designer pastes the brief, iterates in the canvas chat until the
capture flow feels right, and in doing so decides things the contract left open
— that the amount field takes focus on open, that the category picker is a sheet
rather than a screen. Each platform's canvas project is pinned in
`.config/vwf.yaml`; `import` resolves that pin before it matches any page — one
canvas project per platform, never shared.

### 8. /vwf:screens import

```text
/vwf:screens import capture-expense
```

The import reads the designed pages back as data and diffs them against the
Screens contract at three levels: the screens themselves, the journey, and the
stitched index page. Every difference becomes one question — accept, reject, or
adapt — and every accepted one is handed to
[`/vwf:blueprint`](../../plugins/vwf.md#vwfblueprint) to apply. `screens` never
edits a flow doc itself, which is what keeps a design-driven change subject to
the same reviewer gate as a change you elicited in conversation.

For Centwise the sheet-versus-screen difference is accepted and the focus
behaviour is accepted; a frame the canvas added for a "recent merchants" list
nobody had specified is rejected, because it is product scope and belongs in the
blueprint conversation, not in a screen. What to do with each kind of difference
is [what to accept from a canvas diff](#what-to-accept-from-a-canvas-diff)
below. The import also offers to fold conventions the designer discovered back
into the repo-side conventions file — the one edit it makes on its own.

### 9. /vwf:mockups, when you want them

```text
/vwf:mockups
```

Optional here, and worth understanding as the *other* render surface. Mockups
are static HTML written into the repo's gitignored scratchpad tree, generated
from the Screens contract and the design system — never pushed to the design
tool, never committed, and never a gate for planning. In a canvas-designed
product they are mostly a batch tool: after Centwise changes a design-system
token, re-rendering shows every screen under the new value without touching the
canvas. They are realizations of the contract, so a remark about one routes back
through blueprint or design-system and then you re-render. Reference:
[`/vwf:mockups`](../../plugins/vwf.md#vwfmockups).

### 10. /vwf:plan and /vwf:execute

Planning is unchanged ([`/vwf:plan`](./single-repo.md#vwfplan),
[plan approval](./single-repo.md#plan-approval)), and so is the shape of an
execute run ([`/vwf:execute`](./single-repo.md#vwfexecute)), once the import has
closed the deferred screens and the sweep re-stamps coverage complete.

The delta is the UX gate at the end of the run. vwf's UX reviewer does not know
how to render anything — deliberately — so it delegates rendering and the
accessibility scan to the repo's own `ux-gate` skill, then judges what comes
back against `design-system.md` and the flow's Screens contract. For Centwise
that gate came from the `dart-flutter` bundle: it runs the project's golden
tests headlessly and Flutter's own accessibility guideline assertions —
contrast, tap-target size, labelled targets — rather than driving a browser. A
browser-platform project gets the same two gates from whichever bundle
materialized its stack, by a different mechanism; the rule that survives every
stack is that a changed screen with no visual check is reported, not passed.

Two consequences at the merge gate
([the execute merge gate](./single-repo.md#the-execute-merge-gate)): a changed
screen with no golden test is a finding, and a run that could not render at all
reaches you as an explicit unrendered result rather than a quietly code-only
review. Centwise's first slice takes one round of findings — a hardcoded colour
where a token existed — and merges clean.

### 11. /vwf:verify, then the canvas conversation

Verification is the spine's ([`/vwf:verify`](./single-repo.md#vwfverify)). What
this scenario adds afterwards is the adapter's third import: review remarks left
on the canvas are harvestable back into the same routes that handle production
feedback, rather than through any tool-specific call. See
[`/vwf:feedback`](../../plugins/vwf.md#vwffeedback).

## Decision points

### Which design tool

The choice is recorded per registry project, so a product with a marketing site
and a phone app can answer it twice. The tokens the adapter supports today are
`claude-design`, `lovable` and `stitch`, and they differ in two ways that matter
downstream.

The first is whether the tool **stores** a design system or the adapter has to
reconstruct one from what the tool generated. A stored system is authoritative
until someone changes it; a reconstructed one is a snapshot of one generation
and can drift the next time a screen is regenerated — vwf records which you got,
because the freshness guarantee is different. The second is whether designs can
carry the pinned screen codes back. Those codes are the join key for the import
diff; a tool whose output cannot recover them still imports, but reports the
screens without codes rather than guessing, and you match them by hand.

Support for a tool is a `design-tool` pack inside `stackgen`, not a vwf change
and not a new plugin — so "my tool isn't listed" is a small contribution, not a
fork. Three ship today: `claude-design`, `lovable` and `stitch`. What each reads
and how each authenticates: [stackgen](../../plugins/stackgen.md).

### Design first, or review the renders

Every flow with screens offers both, per flow — this is not a product-wide
setting. Reviewing vwf's renders keeps the whole conversation in one place and
one pass; going design-first costs a round trip through the canvas and buys
visual and interaction nuance the contract's tables were never going to capture.

The honest test is whether the flow's value is in its interaction. Centwise
takes `110-capture-expense` to the canvas, because the entire product goal is
that capture feels instant, and reviews the renders for `010-splash`, where
there is nothing to decide and a round trip would buy nothing. Deferring a flow
to the canvas is recorded as an open item, so whole-product coverage stays
honest until the import lands — it does not silently pass.

### When to re-import

**Drift is one-way.** The canvas is the source and the repo doc is its
distillation, for both the design system and the screens, so a hand-edit to
`design-system.md` is drift rather than an update — you change the design system
in the tool and import again.

Re-import the design system when the tool's version of it changed, not on a
schedule. The reason to be deliberate is the reconcile: an import that renamed
or removed a token reports every blueprint doc still pointing at the old name,
and each of those is real work. Re-import screens when a flow has been designed
or redesigned; because a brief is always the flow's full blueprint rather than a
delta, re-briefing a flow whose contract moved is cheap and is the intended way
to keep the canvas honest.

The one thing not to do is treat re-import as a sync loop you run on every
change. Each run asks you a question per difference, and questions you answer
without a reason to are how a contract acquires decisions nobody made.

### What to accept from a canvas diff

Three kinds of difference arrive, and only one of them is really a decision.

A difference where **the design decided something the contract left open** —
Centwise's category sheet, the focus behaviour — is what the round trip is for:
accept it, and the blueprint pass records it as contract. A difference where the
**canvas broke the naming or stitching rules** is canvas rework, not a contract
change; the contract stands and the fix is on the canvas. And a difference that
is **new product scope** — a screen serving a journey nobody blueprinted — is
neither: pixels carry no steps and no acceptance criteria, so a genuinely new
journey becomes a draft that a full blueprint pass has to complete before it
means anything.

Reject freely. A rejected difference costs one round of canvas rework; an
accepted one that nobody thought about becomes contract, then a plan step, then
code.

## When things halt

The spine's [halts](./single-repo.md#when-things-halt) all still apply. These
are the ones this scenario adds, each explained where it is enforced.

- **Design-system import halts when the project has no design tool configured**,
  when its token is one no adapter supports, or when the adapter returns nothing
  usable — each with its own message, because they need different fixes.
  [`/vwf:design-system`](../../plugins/vwf.md#vwfdesign-system),
  [stackgen](../../plugins/stackgen.md)
- **Design-system import halts when the design pack was never materialized**,
  since `/vwf:import-design-system` has no `design-import-design-system` skill
  in the repo's own `.claude/` to delegate to, and there is no offline authoring
  mode. [`/vwf:design-system`](../../plugins/vwf.md#vwfdesign-system)
- **`/vwf:screens` halts without a design system**, in either mode — screens
  reference it. [`/vwf:screens`](../../plugins/vwf.md#vwfscreens)
- **`prompt` halts on a flow that has no folder yet.** A brand-new journey is
  blueprinted first, even as a draft, so the brief has steps to describe.
  [`/vwf:screens`](../../plugins/vwf.md#vwfscreens)
- **`/vwf:mockups` halts without a blueprint or a design system**, having
  nothing to render or nothing to style it from.
  [`/vwf:mockups`](../../plugins/vwf.md#vwfmockups)
