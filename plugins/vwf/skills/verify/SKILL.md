---
name: verify
description: Verify a deployed environment against the blueprint —
  health-check each
  deployed project and re-run the flows' acceptance criteria in staging mode.
  Run after you (or CI) deploy; vwf never deploys. Failures route through the
  feedback machinery.
argument-hint: "[environment, e.g. staging]"
model: sonnet
effort: xhigh
disable-model-invocation: true
---

# verify — Check a Deployed Environment Against the Blueprint

Run **after a deploy** (yours or CI's) to answer: does the deployed product
still do what the blueprint promises? vwf never deploys — deployment is yours;
this command only observes and verifies.

Two passes: **health** (is every deployed project up) and **acceptance** (do the
blueprint's flow criteria hold against the real environment). A failure here is
production feedback — it routes exactly like `/vwf:feedback` input.

## Halt Conditions

- No `docs/blueprint/integration.md` with Acceptance blocks **and** no
  deployable project in the registry → nothing to verify; say so and stop.
- `$ARGUMENTS` names no environment and more than one is plausible → ask which
  (staging, production, …) and wait.

## Format Check

Run the preflight in `${CLAUDE_PLUGIN_ROOT}/assets/format-check.md`; nudge
`/vwf:setup` on drift (proceed unless the needed Acceptance blocks are missing —
a pre-format-4 repo has nothing to verify flows against; offer `/vwf:setup` then
stop).

## Pipeline

### 1. Resolve the target

Read the registry (`docs/blueprint/architecture.md`) for the deployed projects
(cloud types: `service`, `worker`, `site`, `console`) and the flows' Acceptance
blocks in `integration.md`. Resolve each project's base URL for the named
environment from the **`environments:` block in `.config/vwf.yaml`** first (per
the vwf-config asset); fall back to the repo's own configuration (deploy
manifests, env files by **name** via `docs/blueprint/environment.md`, mise
tasks) — ask the user for anything unresolvable, never guess a hostname, and
**offer to pin what was resolved/asked into the config** so the next run asks
nothing. Health probes honor any per-project override
(`projects.<name>.harness.health` — a declared `n/a` is reported as such, not
"unverifiable").

**Recall.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, recall rooms `gaps`
and `problems` for still-open items — a criterion already known-failing is
reported as **known**, not rediscovered. Skip silently if mempalace is down.

### 2. Health pass

For each deployed project: probe its health/readiness endpoint (or root) and
record up/down + version where exposed. A `worker` with no HTTP surface is
checked by its own observable (its queue/schedule heartbeat if the repo exposes
one) or reported `unverifiable — no health surface` (a candidate gap, not a
silent skip).

### 3. Acceptance pass (against the environment)

Dispatch `execute-acceptance-verifier` in **environment mode**: pass the
Acceptance blocks of **every** flow (regressions in untouched flows are the
point — not just the last plan's), the registry, the target environment's base
URLs, and the repo's staging-mode E2E mechanism per the harness contract
(`${CLAUDE_PLUGIN_ROOT}/assets/harness.md` — the canonical `test:e2e:staging`
task, else the stamped equivalent; the `.config/vwf.yaml` `harness:` block says
whether `e2e_staging` exists at all) — it runs the suite against the deployed
environment, never against local emulators, and returns the standard
per-criterion `PASS` / `FAIL` / `NOT-COVERED` block. `n/a — no staging
harness`
→ report what is missing (the harness is a gap).

### 4. Report & route

Present: per-project health, then per-criterion results. Route every failure per
the **feedback routing** (`/vwf:feedback`'s rules — this command's failures are
just automated feedback):

- **Criterion FAIL** (behavior regression) → file to room `gaps`; offer the fix
  path now — `/vwf:blueprint <entity>` if the blueprint is wrong,
  `/vwf:plan <slice>` for a fix cycle. Deferred → record one line in the target
  entity doc's **Open Questions** (or the flow in `integration.md`) so it
  survives a mempalace outage.
- **Health down / infra failure** → report precisely (project, probe, error);
  this is operational, not a blueprint gap — do not file it as one.
- **NOT-COVERED / no harness** → a testing gap; file to room `gaps` and offer a
  plan step next cycle.

**Persist.** Store the run's outcome (environment, per-criterion results,
routing) to mempalace room `problems`, and each gap to room `gaps`. Skip
silently if mempalace is down — the routed doc edits are the durable record.

If any doc was edited (deferred routings), commit via `/vwf:git-workflow`.
Verify is otherwise read-only.
