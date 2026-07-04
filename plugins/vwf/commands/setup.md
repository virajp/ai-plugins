---
description: Onboard a repo into vwf's format and keep it current — detect or ask
  (MCQ) the project topology, migrate to the docs/blueprint structure with
  consent, orchestrate the foundations (mise, product, architecture,
  design-system), and
  author CLAUDE.md + README. Re-runnable: detects format drift and migrates when
  the vwf format evolves.
argument-hint: ""
model: sonnet
effort: xhigh
---

# setup — Onboard & Keep a Repo in vwf Format

Bring any repo — new or existing — into vwf's structure, and re-run any time the
vwf format evolves to migrate the gap. `setup` is the Phase-0 bootstrapper:
`setup → product → architecture → design-system → blueprint → plan → execute`.

You own the user conversation. Every change is **consent-gated and
worktree-safe** — present a dry-run plan and wait for approval before writing;
never delete; never overwrite without consent. Apply the **project-setup** skill
throughout.

## Doc Paths

| Doc               | Path                                                         |
| ----------------- | ------------------------------------------------------------ |
| Registry          | `docs/blueprint/architecture.md`                             |
| Environment       | `docs/blueprint/environment.md`                              |
| Env. template     | `${CLAUDE_PLUGIN_ROOT}/assets/templates/environment.md`      |
| vwf config        | `.config/vwf.yaml` (legacy stamp: `docs/blueprint/.vwf.yml`) |
| Config schema     | `${CLAUDE_PLUGIN_ROOT}/assets/vwf-config.md`                 |
| CLAUDE.md section | `${CLAUDE_PLUGIN_ROOT}/assets/templates/project-claude.md`   |
| Reference stacks  | `${CLAUDE_PLUGIN_ROOT}/assets/stacks/<type>.md`              |
| Harness contract  | `${CLAUDE_PLUGIN_ROOT}/assets/harness.md`                    |

Doctrine: the **project-setup** skill (topology-detection,
migration-and-consent, format-versioning, claude-md).

## Hard Rules

- **Consent + dry-run.** Present the full migration plan (every create / move /
  update) and get approval before any write. Code restructuring is approved
  **per batch**.
- **Worktree-safe; all git via `git-workflow`.** Operate in an isolated
  worktree; never delete; never overwrite without consent. Keep the worktree
  local.
- **Don't duplicate tools.** Use `mise:scaffold` for mise config and
  `markdown:readme` for the README — orchestrate, don't reimplement.
- **Idempotent.** A re-run detects what already conforms and migrates only the
  delta; a conforming repo yields an empty plan.
- **Resumable.** After each completed step, append its id to a transient
  `setup_progress:` list in `.config/vwf.yaml`; a re-run reads it and resumes
  from the first incomplete step. Keep it a plain list, not a journal. **Remove
  the key on successful completion** (step 11).

**What a batch is.** Code restructuring is approved and applied **one batch at a
time**. A batch is **one project's moves, or one logical rename group** — small
enough to review in a single screen. Never bundle unrelated projects or renames
into one approval.

---

## Pipeline

### 1. Detect topology

**Resume check.** Read `.config/vwf.yaml` (fall back to the legacy
`docs/blueprint/.vwf.yml`). If it carries a transient `setup_progress:` list
from an interrupted run, offer to resume from the first step **not** in that
list rather than restarting; re-confirm anything the user wants revisited.

**Recall.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, recall room
`decisions` (prior topology / UI / stack confirmations and their rationale)
before detecting — build on them, don't re-ask resolved questions. Skip silently
if mempalace is unavailable.

Per the project-setup skill (topology-detection), read repo signals —
`package.json`, `pnpm-workspace.yaml`, `pubspec.yaml`, `go.mod`, `Cargo.toml`,
`.gitmodules`, dir layout — plus any existing `docs/blueprint/` or legacy
`docs/specs/`. Infer: monorepo vs polyrepo vs **workspace** (a parent repo with
submodule children — classify each child on its own signals), the project types
present (schema/contract, service/API, worker, frontend/app, console/admin UI),
and the stack per project.

**Harness detection.** Detect the repo's verification-harness capabilities per
`${CLAUDE_PLUGIN_ROOT}/assets/harness.md` (dev task, local E2E + stack, staging
E2E, health endpoints, screenshot capability) — recorded in the stamp at step 9.
For a **new/empty repo**, the harness is scaffolded as part of the enforced
structure (fold it into the step-4 migration plan); for an existing repo,
missing capabilities are only **recorded** — `/vwf:plan` injects their bootstrap
steps when a cycle first needs them.

### 2. Confirm & fill (MCQ)

Present what you detected and confirm or correct it with the user via **MCQ**,
following `${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md` — one question at a
time, options + "Other". Pin down anything detection could not: missing project
types, stacks, and **whether a UI surface exists** (it makes the design system
mandatory). Never assume UI — confirm it.

**New/empty repo.** When detection finds no manifests and no source, apply the
**workspace structure** and its reference stacks per the project-setup skill
(workspace-structure) — the structure as one confirmation, the stacks stated
(from the per-type stack docs), not elicited. Both are enforced with an escape
hatch: an explicit objection is honored, recorded under `enforcement:` in
`.config/vwf.yaml`, and never re-asked.

**Existing non-conforming repo.** When an existing repo does not match the
workspace shape, fold a consent-gated restructure proposal toward it into the
step-4 migration plan (batched; moves that are risky or cross repo boundaries —
e.g. a submodule split — become written recommendations instead, per
migration-and-consent). A decline is recorded as a structure deviation in the
registry and not re-proposed on later runs.

### 3. Reconcile format & legacy

Read `.config/vwf.yaml` (or the legacy `docs/blueprint/.vwf.yml`) if present.
Per the project-setup skill (format-versioning), compute the **migration delta**
between the repo's current format and the format this vwf ships — a legacy
`docs/specs/` tree to upgrade, a missing `design-system.md` / `environment.md` /
`integration.md`, entity docs lacking Relationships / Concurrency, the
**`1 → 2`** delta (docs missing OKF frontmatter and relationships/references not
yet written as markdown links), or the **`2 → 3`** delta (a missing
`environment.md` when the registry declares integrations or a secrets-manager
`config`). Fold in any old or partial structure.

An entity already in the **folder form** (`docs/blueprint/<entity>/` with
`index.md` + surface files) is a conforming layout, not drift — leave it as a
folder; never collapse it into a single file. Each surface file still gets its
own frontmatter under the `1 → 2` delta. Conversely, since format 8 a **flat**
`<entity>.md` at the blueprint root **is** drift — the `7 → 8` delta `git mv`s
it to `<entity>/index.md` and mechanically rewrites the inbound/outbound links
(per format-versioning), leaving the root to the system docs alone.

### 4. Build the migration plan (dry-run)

Enumerate every action: `docs/blueprint` scaffolding, code-restructuring moves
to match the registry topology (grouped into **batches**, see the Hard Rules),
tooling (mise), CLAUDE.md merge, README. **Write the plan to a scratch artifact
`docs/blueprint/.vwf-migration-plan.md`** (deleted on completion, step 11) and
present it **section by section** — do not keep it chat-only. **Wait for
approval.**

**Dirty-tree guard.** Before creating the worktree, run `git status`. If the
working tree is dirty, **stop and ask** whether to commit, stash, or proceed —
never migrate over uncommitted changes silently. Once clean (or the user
consents), set up an isolated worktree via `/vwf:git-workflow`.

### 5. Tooling

If mise config is missing or incomplete, invoke **mise:scaffold**. Note any
other runtimes the detected stacks need — do not install them. If
`mise:scaffold` fails, report the error, offer to continue without it (leaving
mise config for the user), and record the skip in `setup_progress`.

### 6. Migrate (consent-gated)

Scaffold the `docs/blueprint` tree (architecture, conventions, design-system,
environment, integration skeletons from templates) plus `docs/plans/` and
`docs/plans/archived/`. Restructure source per the approved plan, **one batch at
a time with approval** — move with `git mv` (preserve history), never delete.

**On batch rejection.** If the user rejects a batch, **stop** — apply no further
batches. Report which batches were applied and which remain pending, leave the
worktree intact for the user to inspect, and record the stop (applied/pending)
in `setup_progress`.

**Bootstrap the environment catalog.** When the registry declares integrations
or a secrets-manager `config` (the `2 → 3` trigger), scaffold
`docs/blueprint/environment.md` from the environment template and **populate it
from the repo's existing usage** — scan config schemas, `.env`/`.env.example`,
mise env values, and CI secrets/variables for the variable *names* and infer
purpose/issuer/consumer/required/classification per the blueprint-authoring
**environment-catalog** reference. Record names only — **never copy a value**.
If a secrets/env-var catalog already lived in `conventions.md#config` (or
elsewhere), move those rows here and leave `#config` with the injection
mechanism alone.

### 7. Orchestrate foundations

Gate each foundation on the **step-3 delta** — a conforming repo runs neither,
yielding an empty plan (the idempotence Hard Rule):

- Run `/vwf:product` only if `docs/blueprint/product.md` is **missing** (the
  `4 → 5` delta) or the migration surfaced a product-level change. It comes
  **first** — the goals it pins anchor everything downstream.
- Run `/vwf:architecture` only if the registry is **missing** or the delta
  requires a registry change (a new/changed project, capability, or
  cross-cutting decision).
- Run `/vwf:design-system` only if the topology has a **UI surface**
  (`ui: true`) **and** `docs/blueprint/design-system.md` is missing or stale.

These are interactive — hand off, then resume. If a foundation command fails,
report the error, offer to continue without it (leaving that foundation for a
later run), and record the skip in `setup_progress`.

### 8. Author CLAUDE.md & README

Merge the vwf section (from the project-claude template) into the repo's
`CLAUDE.md`, **preserving existing content**. Generate or update the README via
**markdown:readme**; if it fails, report the error, offer to continue without it
(leaving the README for the user), and record the skip in `setup_progress`.

### 9. Write the vwf config

Write `.config/vwf.yaml` per the vwf-config asset — the thing a future `setup`
run diffs against, and how every vwf command operates in this repo:

- the stamp keys — `config_format`, `blueprint_format`, `topology`, `ui`,
  `integrations`;
- **`product.name` and `memory.wing`** — derive from the repo/registry name and
  **confirm with the user** (one MCQ);
- the **`harness:` block** from step-1 detection (per capability:
  `true`/`false`/`n/a`, plus any non-canonical task-name overrides found);
- any **`enforcement:`** entries recorded during this run (structure/stack
  declines, rule waivers);
- **per-project nuances** the run surfaced (e.g. a Flutter project's
  `platforms:` beyond ios/android — elicit when ambiguous, never assume);
- leave `pipeline` / `environments` / `docs_sync` absent unless the user pinned
  them.

On the `5 → 6` migration, `git mv` the legacy stamp to the new path first (move,
never delete), then restructure — per format-versioning. Also migrate any
`config_format` drift per the vwf-config asset's migration notes (e.g. `1 → 2`
renames `pipeline.autopilot_caps` → `pipeline.execute_caps`).

**Persist.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, store the durable
onboarding decisions and their rationale (confirmed topology, UI surface,
stacks, cross-cutting selections) to mempalace (room `decisions`) — skip what
the docs capture verbatim. Skip silently if mempalace is unavailable.

### 10. Validate

Confirm the registry parses and the required foundations exist for the detected
topology (`product.md` present unconditionally; design-system present if UI;
`environment.md` present if the registry declares integrations or a
secrets-manager `config`). Confirm the migration produced a well-formed **OKF
bundle**: every `docs/blueprint/` doc opens with valid frontmatter (mandatory
`type` from the vocabulary, `title`, `description`, `status`) and every
relationship/reference link resolves to an existing doc/anchor — per the
project-setup skill (format-versioning) and the blueprint-authoring
frontmatter-and-links reference. Confirm `environment.md` carries **no secret
values**. Report anything still open.

### 11. Approval gate & commit

Summarize everything created / moved / updated and wait for approval. On
approval, **finalize resumability state**: remove the transient
`setup_progress:` key from `.config/vwf.yaml` and delete the scratch
`docs/blueprint/.vwf-migration-plan.md`. Then commit via `/vwf:git-workflow`
with a `chore(vwf):` or `docs:` message. Keep the worktree local; do not push.

**Chain forward.** With the foundations in place, offer to continue straight
into `/vwf:blueprint` (the full-product sweep — the next step of the pipeline);
the user can decline and blueprint later.
