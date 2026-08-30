# Plan: generalize vwf — the three menu gaps, decided before they are built

**Status: draft, 2026-08-26. Not approved. No step runs until the decisions in
Stage 1 are walked with the user.**

This is the fresh plan the WS1 section of
[2026-08-24-vwf-rewire-and-onboarding.md](../2026-08-24-vwf-rewire-and-onboarding.md)
said to write. That document is **evidence, not instructions** — it says so
itself — so this plan restates the gaps against the tree as it stands today and
corrects two premises that did not survive verification.

## Why now

Onboarding this repo onto its own workflow stopped inside `/vwf:architecture`,
twice, because vwf's closed menus had no honest answer for a repo of this shape.
The diagnosis then is the diagnosis now: **the menus were populated from one
reference stack**, which the 2026-08-17 north-star record predicted. WS2 (finish
the onboarding) is blocked on this; so is the only real test of whether the
blueprint format fits a plugin product.

## Scope, stated as a boundary

**This plan fixes what is known and stops.** It does not chase the gaps WS2 will
find — WS2 logs those to `docs/memory/gaps/` and a later pass batches them. The
rule that makes the discovery loop terminate: **during WS2, a missing template
or vocabulary token is recorded and worked around, never authored mid-sweep.**

Two things are explicitly **out**:

- **Authoring backing templates — at all.** Hardened from "beyond the minimum"
  to a flat prohibition on 2026-08-26, when the boundary against
  [the stackgen plan](../archived/2026-08-19-stackgen.md) was settled
  (`docs/memory/decisions/2026-08-26-generalization-vs-stackgen-wave-c-boundary.md`).
  A template written here is a file **Wave C** would convert to a pack, and
  "author the minimum" is what a gate wanting a pin talks you out of mid-sweep.
  Decide the taxonomy; author nothing. If 1a.3 turns out to need a store, it is
  a Wave C item and this repo re-declares its capability in the meantime.
- **Anything in `docs/design/language-plugins-and-product-templates.md`.** That
  doc is written against `templates/`, `schema/src/manifest.ts` and
  `plugins:render-clean`, none of which exist since claude-first. It is an input
  to read for Stage 1a and 1c — its "frameworks become a closed vocabulary"
  decision covers the same territory — not a plan to execute. Decide its fate at
  the end (Stage 4).

## Two corrections to the WS1 evidence

Both were verified against the tree on 2026-08-26. Both change what the work is.

### The recurring doctor finding does not exist

The WS1 section records one accepted debt: `document-datastore` declared on
`plugins` with `backing_template: []`, "knowing `/vwf:doctor` reports the
missing pin every run until 1a lands."

**There is no such check.**
`plugins/vwf/skills/doctor/references/stack-checks.md:83` states the opposite —
`backing_template` "may be `[]` but must be present, since an absent key and an
empty list mean different things (nobody decided, versus decided: none)".
Neither `doctor/SKILL.md` nor `stack-checks.md` mentions `capabilities` at all.
`[]` is a valid, final answer and nothing reports it.

This cuts both ways, and the second way is the more interesting one:

- The pressure behind 1a is **elicitation-time** — `/vwf:architecture` had
  nothing honest to offer — not a finding that recurs afterwards. There is no
  clock on it.
- **Nothing anywhere verifies that a declared capability has a provider.** A
  product can declare `document-datastore`, pin nothing, and pass every gate.
  That is a real hole, it is not in the WS1 list, and it is arguably the
  *actual* 1a. Stage 1a decides whether to close it.

### 1a is wider than `document-datastore`

Mapping every capability token in `assets/capability-vocabulary.md` against the
`capabilities:` frontmatter of the six backing templates that ship:

| Coverage             | Tokens                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Two or more          | `relational-datastore`, `object-file-storage`, `third-party-auth`, `custom-claims-rbac`, `distributed-tracing`                              |
| Exactly one          | `document-datastore` (`firebase`), `durable-workflows` + `scheduled-jobs` (`temporal`), `realtime-sync`, `push-notifications`               |
| Only inside a bundle | `cache-layer`, `message-queue` — both `cloud-sql` only, neither separable                                                                   |
| **Zero**             | `search-index`, `pub-sub`, `realtime-location`, `email`, `sms`, `voice-audio`, `operator-rbac`, `payments-subscriptions`, `maps-navigation` |

So `document-datastore`-without-a-cloud is one instance of a nine-token hole,
and treating it as a missing file would fix the instance and leave the shape.

**And some of those tokens should never pin a backing template.** `audit-log`,
`rate-limiting` and `runtime-settings` are `product-foundations` concerns
implemented in the product's own code; `ssr`, `ssg`, `seo`, `offline-first`,
`deep-linking` and `device-permissions` are project-axis facts. They sit in the
same flat list as `search-index`, which genuinely does want a provider. **That
is the vocabulary problem 1a was told to look for**, and it is a taxonomy
question, not a template-authoring one.

## Stage 1 — The decisions

Three, walked **one at a time** with the user, in this order. Nothing is
implemented until all three are settled: 1c can change the registry schema, and
that would land underneath the other two.

### 1c — Can the registry express supporting tooling? *(decide first)*

**The gap, concretely.** The role → platform list
(`plugins/vwf/agents/architecture-writer.md:103-107`) is closed, and `cli`
appears under `frontend` only. So this repo's `installer` — a tool whose entire
purpose is to deliver the other project — is typed `frontend`, "User-facing
surfaces." There is no `system` + `cli` pairing available. A build tool, a
scaffolder and a product surface are indistinguishable in the registry: each
carries a `role` and `platforms` and nothing else.

**Why this is expensive.** `registry.yaml` carries `vwf_registry: 2`. A new
field makes it `3` and bumps `blueprint_format` 23 → 24, which means a
`/vwf:setup` migrate pass for every existing repo. The 2026-08-24 note is right
that this needs a decision before it needs an implementation.

Options to put to the user:

1. **Add `cli` to the `system` role's platform list.** One token, no schema
   bump, no migration. `installer` becomes `system` / `[cli]` and reads
   correctly. Does not distinguish *delivers another project* from *is
   infrastructure* — but `system` already means "infrastructure and tooling",
   which is what an installer is.
2. **A registry field** (`delivers: [ <project> ]` or similar). Expresses the
   relationship exactly, and `depends_on` already proves the registry can hold
   inter-project edges. Costs `vwf_registry: 3`, blueprint format 24, and a
   migration — for a distinction nothing currently branches on.
3. **Nothing — prose only.** Record it in `architecture.md` and move on. Free,
   and honest if no vwf behaviour would ever key on it.

**Recommendation: option 1.** It removes the forced miscategorization for one
token's cost, and option 2 should wait until something actually branches on the
distinction. Ask what would read a `delivers` field before adding it.

### 1b — What `doc_unit` should a `cli` project take?

**The gap.** The default mapping is `site`/`webapp` → `page`; `packages`, `iac`,
`plugin` → `module`; **everything else → `entity`**. A CLI reaches `entity` by
falling off the end of that list, not by a decision, and `entity` fits a project
whose contract is commands rather than records poorly.

Stated in three places, which all move together:

- `plugins/vwf/skills/architecture/SKILL.md:149`
- `plugins/vwf/agents/architecture-writer.md:109`
- `plugins/vwf/assets/templates/registry.yaml:47` (comment only)

Semantics live in `plugins/vwf/skills/blueprint/references/platforms.md:48`.

**What the value actually controls** — this is what the decision should turn on,
and it is smaller than it looks. `doc_unit` is read by exactly two gates:

- `blueprint-surveyor.md:51` — a `schema.yaml` reading `N/A — <reason>` counts
  as present **only** on a `module` doc unit.
- `blueprint-surveyor.md:55` + `blueprint/SKILL.md:158` — a registry project
  needs a unit representing it per its `doc_unit`.

Plus `blueprint-reviewer.md:248` and `entity-writer.md:67`, which accept `N/A`
on unit-inapplicable surfaces once told the unit.

So the practical question is: **should a CLI's supporting contracts be allowed
to carry `schema.yaml: N/A`?** Under `entity` they may not; under `module` they
may. A CLI's flag surface and exit-code contract have no data shape, so under
today's default every one of them must invent a schema or fail the gate.

Options: `module` (commands are module boundaries, `N/A` schemas allowed);
`entity` made explicit rather than a fall-through; or a fourth token
(`command`), which costs a vocabulary addition everywhere `doc_unit` is read.

**Recommendation: `module`, added as an explicit row.** It is the value the
gates already behave correctly for, and no new token is needed. Whichever way it
lands, make it a stated row — the plan's requirement is that it stops being a
fall-through.

### 1a — Vocabulary or template?

Given the two corrections above, this is three questions, and only the third is
about files:

1. **Does the capability vocabulary need splitting?** Today one flat list mixes
   tokens that name a backing service (`search-index`), tokens that name a
   product-foundations concern (`audit-log`, `rate-limiting`,
   `runtime-settings`), and tokens that name a project-axis fact (`ssr`,
   `offline-first`). If the list marked which kind each token is, "this
   capability has no backing pin" becomes checkable rather than ambiguous.
2. **Should a declared capability be required to have a provider?** Nothing
   checks this today. If 1 lands, a doctor check becomes possible: a
   backing-kind capability with no `backing_template` entry declaring it is a
   finding. Decide whether it is a finding, a blocking one, or left alone.
3. **Does a non-cloud document store need a template now?** Only if this repo's
   memory layer is genuinely a `document-datastore`. It is markdown files under
   `docs/memory/` plus a Qdrant-backed semantic index — which reads far more
   like `search-index` (zero coverage) than like a document store. **Resolve
   what this repo actually declares before authoring anything**; the token may
   be wrong, in which case nothing needs writing.

**Recommendation: answer 1 and 2, defer 3.** The taxonomy is the durable fix and
survives the stackgen merge waves; a template written now is Wave C's problem
later. If 3 does turn out to need a file, the honest answer for this repo is
likely re-declaring the capability, not authoring a store.

**Boundary settled 2026-08-26**, before this stage ran
(`docs/memory/decisions/2026-08-26-generalization-vs-stackgen-wave-c-boundary.md`).
`plugins/stackgen/assets/taxonomy.md` already states the seam under *The
capability seam* — capability tokens are vwf's, categories are stackgen's,
*minting capabilities is vwf's move* — so **1 and 2 are vwf-side work Wave C
never owned**, and 1c and 1b touch no stackgen surface at all. Two rulings bind
this stage:

- **Deferring 3 is binding, not recommended** — see the scope boundary above.
- **1 restructures and mints nothing.** The kind classification lands; **no
  missing token is added**, including `cdn`, which `taxonomy.md` names as a
  known vwf-side hole. The parked audit
  (`docs/memory/gaps/2026-08-26-stack-vocabulary-coverage-audit.md`) then
  inherits a settled shape and shrinks to adding rows. Rejected: minting `cdn`
  here; folding the whole audit in, which the drawer itself argues against.

## Stage 2 — Implement what Stage 1 settled

No step here is specified further until Stage 1 lands; what follows is the
**blast radius** each decision carries, so the cost is visible while deciding.

| Decision    | Touches                                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1c option 1 | `architecture-writer.md` table, `architecture/SKILL.md` platform list, `templates/registry.yaml` comment block, `topology-detection.md` recognition table |
| 1c option 2 | All of the above **plus** `vwf_registry: 3`, `blueprint_format` 24, `format-lineage.md`, a `/vwf:setup` migrate path                                      |
| 1b          | The three default-mapping sites above; no consumer changes if the answer is `module`                                                                      |
| 1a.1        | `capability-vocabulary.md` (structure), `architecture/SKILL.md` §3b elicitation                                                                           |
| 1a.2        | `doctor/references/stack-checks.md` §5, `doctor/SKILL.md` finding table                                                                                   |
| Any of them | `plugins/vwf/.claude-plugin/plugin.json` version bump, `mise run plugins:marketplace`, and the docs that describe these surfaces                          |

**Docs ship with the change.** `CLAUDE.md`, `readme.md` and
`docs/plugins/vwf.md` all describe the registry, the capability vocabulary and
the stack axes. Reconcile them in the same commit — delegate to `/vwf:docs-sync`
at the end of the stage rather than hand-auditing.

## Stage 3 — Hand off to WS2

WS1 is done when the three decisions are recorded in `docs/memory/decisions/`
and whatever they implied has landed clean. Then WS2 resumes the chain —
`/vwf:architecture` → `/vwf:doctor` → `/vwf:design-system` → `/vwf:blueprint` —
under the log-don't-fix rule.

Carried forward, decided, **not to be re-elicited**: two projects (`plugins`
`system`/`[plugin]` at `plugins/`, pin `claude-code-plugin`, deploy `n/a`;
`installer` at `cli/`, pin `typescript-parseargs-cli`, deploy `npm-package`),
repo axis `pnpm-workspace`, both `depends_on: []`, `installer`
`capabilities: []`, `plugins`
`[runtime-settings, audit-log,
document-datastore]` — **subject to 1a.3
re-examining that last token**. `installer`'s role is subject to 1c.

**Re-run `/vwf:doctor` immediately after the registry exists.** §§3–5 have never
executed on this repo — the registry has never existed — so the `markdown`
unknown-language check that the `claude-code-plugin` template was written to
satisfy has still never run.

## Stage 4 — Close out the stale design doc

`docs/design/language-plugins-and-product-templates.md` is committed and
describes a tree that no longer exists. Once 1a and 1c are decided, either
rewrite it against the current shape or archive it with a note saying what
superseded it. **Do not leave it as-is** — a design doc describing `templates/`
and `schema/` reads as current to anyone who finds it.

**Done 2026-08-26 — archived, not rewritten.** It moved to
`docs/design/archived/2026-08-17-language-plugins-and-product-templates.md`
under a banner naming what superseded it. Rewriting was rejected: the doc
proposes **a plugin per language behind a nineteen-property mandate**, which is
the losing side of the two-plugin north star — its own header already called
stackgen "the narrower alternative it competes with". Rewriting it against the
current shape would have meant re-deciding a settled direction.

The banner also resolves the two things in it that were still live: its
**closed-frameworks** proposal was **not adopted** (`stack-vocabulary.md` keeps
`frameworks:` open by design — stackgen researches an uncovered framework rather
than rejecting it, so only the *languages* menu is closed), and its
capability-vocabulary overlap was settled by 1a.1 above.

## Verification

Per stage, and all of it before any commit:

```sh
mise run plugins:marketplace --check
mise run plugins:check
mise exec -- vitest run
mise run typescript:test
mise exec -- dprint check
```

Plus, specific to this plan:

- **1b**: `grep -rn doc_unit plugins/vwf/` shows no site still describing the
  mapping as a catch-all.
- **1c**: `/vwf:architecture` can type this repo's `installer` without a forced
  miscategorization — the concrete test the gap was found by.
- **1a.2**, if it lands: `/vwf:doctor` reports the missing provider on a
  backing-kind capability with an empty pin, and stays silent on
  `runtime-settings`.

## Constraints

- **Ask before any commit.** Do not push, tag or release.
- Work happens in the **main checkout**, not a worktree: the marketplace is a
  directory source pointing at this checkout, so a worktree hides plugin edits
  from the running tools. Deliberate, recorded, do not "fix" it.

  **Confirmed 2026-08-26, after one wrong turn.** A skill invoked mid-session
  reported its base directory as
  `~/.local/share/virajp/ai-plugins/claude/claude/plugins/vwf/...` — the retired
  render-tree install — which looked like proof that the checkout is never
  served, and this constraint was briefly (and wrongly) marked false. It is not:
  once `claude plugin marketplace update virajp-plugins` +
  `claude plugin update vwf@virajp-plugins` ran and the session restarted, the
  same skill reported `.../ai-plugins/plugins/vwf/skills/architecture` — **the
  checkout**. The premise holds; what had failed was the install resolving to a
  stale tree.

  Two facts worth keeping, since each misleads on its own:

  - **`installed_plugins.json`'s `installPath` is a version ledger, not the
    resolution path.** It names a cache directory even while skills load from
    the source directory. Do not diagnose from it.
  - **A stale resolution is silent.** There is no version banner on a skill
    invocation; the only tell is the announced base directory. Check it when a
    plugin edit appears not to have taken.
- `plugins/**/*.md` is **not** dprint-formatted — match the surrounding fold
  width by hand. `docs/**`, `CLAUDE.md` and `readme.md` are.
- Use the Write tool for whole-file writes; `cat > file <<EOF` writes ANSI
  escapes through this machine's `bat` alias.
  </content>
  </invoke>
