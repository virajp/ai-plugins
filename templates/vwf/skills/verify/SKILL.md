---
name: verify
description: Verify a deployed environment against the blueprint —
  health-check each
  deployed project and re-run the flows' acceptance criteria in staging mode.
  Run after you (or CI) deploy; vwf never deploys. A clean pass against the
  production environment offers to record a release, freezing each deployed
  service's API contract into docs/blueprint/apis/released/. Failures route
  through the feedback machinery.
argumentHint: "[environment, e.g. staging]"
model: sonnet
effort: medium
invocation: user
---

# verify — Check a Deployed Environment Against the Blueprint

Run **after a deploy** (yours or CI's) to answer: does the deployed product
still do what the blueprint promises? vwf never deploys — deployment is yours;
this command only observes and verifies.

Two passes: **health** (is every deployed project up) and **acceptance** (do the
blueprint's flow criteria hold against the real environment). A failure here is
production feedback — it routes exactly like `<%= it.cmd("vwf:feedback") %>` input. A clean run
against **production** additionally offers to record a **release** (§5) —
freezing each deployed service's API contract, the point from which backward
compatibility is enforced.

## Halt Conditions

- No flow docs with Acceptance blocks under `docs/blueprint/flows/` **and** no
  deployable project in the registry → nothing to verify; say so and stop.
- `$ARGUMENTS` names no environment and more than one is plausible → ask which
  (staging, production, …) and wait.

## Format Check

Run the preflight in `<%= it.root %>/assets/format-check.md`; nudge
`<%= it.cmd("vwf:setup") %>` on drift (proceed unless the needed Acceptance blocks are missing —
a pre-format-4 repo has nothing to verify flows against; tell the user to run
`<%= it.cmd("vwf:setup") %>` then stop).

## Pipeline

### 1. Resolve the target

Read the registry (`docs/blueprint/registry.yaml`) for the deployed projects
(any project whose `role` is `service`, `worker`, `site`, `fullstack` or
`iac`) and the Acceptance blocks of every flow under
`docs/blueprint/flows/*/*/index.md`. Resolve each project's base URL for the
named environment from the **`environments:` block in `.config/vwf.yaml`** first
(per the vwf-config asset); fall back to the repo's own configuration (deploy
manifests, env files by **name** via `docs/blueprint/environment.md`, mise
tasks) — ask the user for anything unresolvable, never guess a hostname, and
**offer to pin what was resolved/asked into the config** so the next run asks
nothing. Health probes honor any per-project override
(`projects.<name>.harness.health` — a declared `n/a` is reported as such, not
"unverifiable").

**Environment names are canonical** per
`<%= it.root %>/assets/delivery-pipeline.md`: `development` / `staging` /
`production`. Resolve a synonym the user types (`dev`, `test`, `stage`, `prod`)
to its canonical environment, and flag a synonym **key** in the config's
`environments:` block as drift (offer the rename; never normalize silently).

**The release environment** is the one named `production`, unless the config's
`production_env:` key names another (per the vwf-config asset). Note whether
this run targets it — §5 fires only then. A staging run is never a release
(`pipeline/staging-is-not-a-release`).

**Recall.** Per `<%= it.root %>/assets/memory.md`, recall rooms `gaps`
and `problems` for still-open items — a criterion already known-failing is
reported as **known**, not rediscovered. Skip silently if mempalace is down.

### 2. Health pass

For each deployed project: probe its health/readiness endpoint (or root) and
record up/down + version where exposed. The probes are independent — **issue
them all in a single message** so they run concurrently rather than serially
down the registry. A `worker` with no HTTP surface is checked by its own
observable (its queue/schedule heartbeat if the repo exposes one) or reported
`unverifiable — no health surface` (a candidate gap, not a silent skip).

**Version cross-check (report-only).** Where a `service` project exposes a
version and has a living contract `docs/blueprint/apis/<project>.openapi.yaml`,
compare the deployed version to the contract's `info.version` — a mismatch is
reported as a warning (deploys lag contracts), never a halt.

**Reliability targets (report-only).** When `conventions.md#reliability` exists
(the reliability-targets foundation), judge the health pass against it: a probe
that succeeds but breaches the service's stated latency SLO is reported as a
**warning**, never a pass — and never a halt.

### 3. Acceptance pass (against the environment)

Dispatch `execute-acceptance-verifier` in **environment mode**: pass the
Acceptance blocks of **every** flow (`docs/blueprint/flows/*/*/index.md` —
regressions in untouched flows are the point, not just the last plan's), the
registry, the target environment's base URLs, and the repo's staging-mode E2E
mechanism per the harness contract (`<%= it.root %>/assets/harness.md` —
the canonical `test:e2e:staging` task, else the stamped equivalent; the
`.config/vwf.yaml` `harness:` block says whether `e2e_staging` exists at all) —
it runs the suite against the deployed environment, never against local
emulators, and returns the standard per-criterion `PASS` / `FAIL` /
`NOT-COVERED` block. `n/a — no staging
harness` → report what is missing (the
harness is a gap).

### 4. Report & route

Present: per-project health, then per-criterion results. Route every failure per
the **feedback routing** (`<%= it.cmd("vwf:feedback") %>`'s rules — this command's failures are
just automated feedback):

- **Criterion FAIL** (behavior regression) → file to room `gaps`; offer the fix
  path now — `<%= it.cmd("vwf:blueprint") %> <flow|entity>` if the blueprint is wrong,
  `<%= it.cmd("vwf:plan") %> <slice>` for a fix cycle. Deferred → record one line in the owning
  flow doc's **Open Questions** so it survives a mempalace outage.
- **Health down / infrastructure failure** → report precisely (project, probe,
  error); this is operational, not a blueprint gap — do not file it as one.
- **NOT-COVERED / no harness** → a testing gap; file to room `gaps` and offer a
  plan step next cycle.

### 5. Release (production only)

Runs only when this run targeted the **release environment** (§1) **and** both
passes came back clean (every probed project healthy, every criterion `PASS`).
Only then, read [Release freeze](references/release-freeze.md) and follow it —
the confirmation prompt, the per-`service` snapshot into `apis/released/`, and
the never-overwrite rule. A staging run, or any run with a failure, skips this
section entirely.

**Persist.** Store the run's outcome (environment, per-criterion results,
routing, any release recorded) to mempalace room `problems` (releases also to
room `decisions`), and each gap to room `gaps`. Skip silently if mempalace is
down — the routed doc edits are the durable record.

If any doc was edited (deferred routings, release snapshots), commit via
`<%= it.cmd("vwf:git-workflow") %>`. Verify is otherwise read-only.
