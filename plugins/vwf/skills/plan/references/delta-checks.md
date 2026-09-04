# §3's Conditional Checks

Five checks that run **after** the surveyor returns, each only when its trigger
is present. Read this once per chain element, while working §3 — the harness
preflight fires on every element, the other four only when their condition
holds.

## Stamp-heal (only when the computed delta is empty)

If the element's computed delta is **empty** — the code already conforms though
the stamp reads `none`/`partial` — offer (user-confirmed, never silent) to set
that doc's `implementation: complete` (a state-only frontmatter edit, committed
via `/vwf:git-workflow`) and drop the element from the chain.
This self-heals conservative stamps.

## Released-contract check (only when the delta touches a released API)

When the delta touches an `apis/<project>.openapi.yaml` that has a released
snapshot (latest = highest semver under `apis/released/`), verify the desired
change is additive per the rest-api-design skill (reference 8). A breaking
desired change is a blueprint problem — route it per §4 (the sweep's coherence
review enforces the major-version bump); never plan code that breaks a released
contract.

## Released entity-schema check (only when the delta touches a released entity schema)

When the delta touches an entity whose `schema.yaml` has a released snapshot
(latest = latest date under `apis/released/entities/`), diff the desired schema
against that snapshot. Any **non-additive** delta — a removed or renamed
property, a type change, a new required property — forces the plan to spell
`baseline/expand-contract`'s three stages as **explicit ordered steps**, each
behind its own approval like any other step: an **expand release** (the new
form written alongside the old; readers tolerate both), a **backfill job**
(idempotent, resumable, progress checkpoints — the flow contract's Background
Jobs shape), then a **contract release** (the old form removed). Expand and
contract never share a release. Every backfill step carries acceptance
criteria — a completion metric or old-vs-new row-count parity — before the
contract step may run.

## Harness preflight (every element)

Per `${CLAUDE_PLUGIN_ROOT}/assets/harness.md`, work out which harness
capabilities this element's gates will need (acceptance criteria → `e2e_local` +
`local_stack`; changed screens in a web UI → `dev` + `screenshots`; a touched
cloud project → `health`; flows + a deploy target → `e2e_staging`; a flow whose
Guarantees table declares a peak rate meeting the delivery-pipeline's
load-validation threshold, ahead of its first production release →
`test:load`). Read the
`.config/vwf.yaml` `harness:` block (plus any per-project
`projects.<name>.harness` override) and **re-verify just those** against the
repo (the stamp may be stale). For each one missing, **inject a bootstrap step**
into the ordered steps — the coder builds it under the normal pipeline. Harness
steps are gate-required guardrails: the minimalism ladder never strikes them,
and they order **before** the steps whose verification depends on them.

## Deferred-core-token check (every element, when the slice is production-bound)

When this element's slice is production-bound, read the registry for any
`<foundation>: deferred-preprod` core token (per the product-foundations
skill). A deferred core token still on the registry is a **blocking** finding —
report it and halt, pointing at `/vwf:architecture` to resolve the deferral
(accept, adapt, or a conscious re-deferral is not available for a
production-bound slice). This mirrors `/vwf:verify production`'s same check
against the deployed environment.

## Visual-review advisory (only for a flow with platform files — soft, never a halt)

When the element is a flow that has platform files and any of them is **not**
listed under `design.flows_rendered` in `.config/vwf.yaml` as
`<project>/<NNN>-<flow>/<platform>` (or the block is absent — a legacy
`flows_pushed` key, or an entry without a platform leaf, read as drift), note it
for the §8 gate naming the unrendered platforms: those screens have no current
visual render — recommend the user run `/vwf:mockups <flow>` (a local scratchpad
render), or `/vwf:screens import <flow>` when a
`docs/prompts/screens/<project>/<NNN>-<flow>/` brief has a design session
pending, before approving. Advisory only: planning and approval proceed
regardless (neither is ever a gate here).
