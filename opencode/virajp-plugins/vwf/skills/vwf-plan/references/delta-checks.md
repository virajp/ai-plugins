# §3's Conditional Checks

Four checks that run **after** the surveyor returns, each only when its trigger
is present. Read this once per chain element, while working §3 — the harness
preflight fires on every element, the other three only when their condition
holds.

## Stamp-heal (only when the computed delta is empty)

If the element's computed delta is **empty** — the code already conforms though
the stamp reads `none`/`partial` — offer (user-confirmed, never silent) to set
that doc's `implementation: complete` (a state-only frontmatter edit, committed
via `vwf-git-workflow`) and drop the element from the chain.
This self-heals conservative stamps.

## Released-contract check (only when the delta touches a released API)

When the delta touches an `apis/<project>.openapi.yaml` that has a released
snapshot (latest = highest semver under `apis/released/`), verify the desired
change is additive per the rest-api-design skill (reference 8). A breaking
desired change is a blueprint problem — route it per §4 (the sweep's coherence
review enforces the major-version bump); never plan code that breaks a released
contract.

## Harness preflight (every element)

Per `%%AI_PLUGINS_ROOT%%/assets/harness.md`, work out which harness
capabilities this element's gates will need (acceptance criteria → `e2e_local` +
`local_stack`; changed screens in a web UI → `dev` + `screenshots`; a touched
cloud project → `health`; flows + a deploy target → `e2e_staging`). Read the
`.config/vwf.yaml` `harness:` block (plus any per-project
`projects.<name>.harness` override) and **re-verify just those** against the
repo (the stamp may be stale). For each one missing, **inject a bootstrap step**
into the ordered steps — the coder builds it under the normal pipeline. Harness
steps are gate-required guardrails: the minimalism ladder never strikes them,
and they order **before** the steps whose verification depends on them.

## Visual-review advisory (only for a flow with platform files — soft, never a halt)

When the element is a flow that has platform files and any of them is **not**
listed under `design.flows_rendered` in `.config/vwf.yaml` as
`<project>/<NNN>-<flow>/<platform>` (or the block is absent — a legacy
`flows_pushed` key, or an entry without a platform leaf, read as drift), note it
for the §8 gate naming the unrendered platforms: those screens have no current
visual render — recommend the user run `/vwf-mockups <flow>` (a local scratchpad
render), or `vwf-screens import <flow>` when a
`docs/prompts/screens/<project>/<NNN>-<flow>/` brief has a design session
pending, before approving. Advisory only: planning and approval proceed
regardless (neither is ever a gate here).
