---
name: setup
description: Onboard a repo into vwf's format and keep it current — detect or
  ask (MCQ) the
  project topology, migrate to the docs/blueprint structure with consent,
  orchestrate the foundations (mise, product, architecture, design-system),
  and author CLAUDE.md + README. Re-runnable; detects format drift and
  migrates when the vwf format evolves.
model: sonnet
effort: high
invocation: user
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

| Doc               | Path                                                           |
| ----------------- | -------------------------------------------------------------- |
| Registry          | `docs/blueprint/registry.yaml`                                 |
| Environment       | `docs/blueprint/environment.md`                                |
| Env. template     | `<%= it.root %>/assets/templates/environment.md`        |
| vwf config        | `.config/vwf.yaml` (legacy stamp: `docs/blueprint/.vwf.yml`)   |
| Config schema     | `<%= it.root %>/assets/vwf-config.md`                   |
| CLAUDE.md section | `<%= it.root %>/assets/templates/project-claude.md`     |
| Stack templates   | from the installed stack plugins, never from vwf                |
| Stack vocabulary  | `<%= it.root %>/assets/stack-vocabulary.md`             |
| Memory protocol   | `<%= it.root %>/assets/memory.md`                       |
| mempalace config  | `mempalace.yaml` (parent **and** each submodule)               |
| Harness contract  | `<%= it.root %>/assets/harness.md`                      |

Doctrine: the **project-setup** skill — a router. Read each reference at the
step that needs it, not upfront: `topology-detection` + `structure` at §1,
`migration-and-consent` at §4, `claude-md` at §8. Read **`format-versioning`**
(~430 lines of per-version deltas) **only when §3 finds actual drift**, and only
the deltas between the repo's stamp and the shipped format — an already-current
repo never needs it.

This skill's own references follow the same rule:

| Reference                                                  | Read it when                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| [format-reconcile](references/format-reconcile.md)         | §3 — computing the delta and judging layout drift                  |
| [environment-bootstrap](references/environment-bootstrap.md) | §6 — the registry declares integrations or a secrets-manager config |
| [memory-tree](references/memory-tree.md)                   | §9 — writing `docs/memory/` and each repo's `mempalace.yaml`       |

## Hard Rules

- **Consent + dry-run.** Present the full migration plan (every create / move /
  update) and get approval before any write. Code restructuring is approved
  **per batch**.
- **Worktree-safe; all git via `git-workflow`.** Operate in an isolated
  worktree; never delete; never overwrite without consent. Keep the worktree
  local.
- **Don't duplicate tools.** Use `devtools:scaffold` for mise config and
  `<%= it.cmd("vwf:readme") %>` for the README — orchestrate, don't reimplement.
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

**Recall.** Per `<%= it.root %>/assets/memory.md`, recall room
`decisions` (prior topology / UI / stack confirmations and their rationale)
before detecting — build on them, don't re-ask resolved questions. Skip silently
if mempalace is unavailable.

**Graph-first.** Per `<%= it.root %>/assets/graphify.md`, when the repo
already carries `graphify-out/graph.json`, query it for the system shape first —
the projects present, their stacks, and who depends on whom — then confirm what
it reports against the manifests below; fall back silently when no graph exists.

Per the project-setup skill (topology-detection), read repo signals — the root
manifests and lockfiles the installed stack plugins recognise, `.gitmodules`,
dir layout — plus any
existing `docs/blueprint/` or legacy `docs/specs/`. Infer: monorepo vs polyrepo
vs **workspace** (a parent repo with submodule children — classify each child on
its own signals), the project **roles** present (`service`, `worker`,
`packages`, `site`, `frontend`, `iac` — a list per project, order
significant), and the stack per project.

**`iac` placement.** For every project detected as `iac`, resolve which repo's
working tree its directory falls in. One sitting inside another project's repo
violates the own-repo rule (`<%= it.root %>/assets/topologies/`) — record
it here and carry it into the step-4 plan as a restructure proposal (§4).

**Harness detection.** Detect the repo's verification-harness capabilities per
`<%= it.root %>/assets/harness.md` (dev task, local E2E + stack, staging
E2E, health endpoints, screenshot capability) — recorded in the stamp at step 9.
For a **new/empty repo**, the harness is scaffolded as part of the enforced
structure (fold it into the step-4 migration plan); for an existing repo,
missing capabilities are only **recorded** — `<%= it.cmd("vwf:plan") %>` injects their bootstrap
steps when a cycle first needs them.

### 2. Confirm & fill (MCQ)

Present what you detected and confirm or correct it with the user via **MCQ**,
following `<%= it.root %>/assets/elicitation.md` — one question at a
time, options + "Other". Pin down anything detection could not: missing project
types, stacks, and **whether a UI surface exists** (it makes the design system
mandatory). Never assume UI — confirm it.

**New/empty repo.** When detection finds no manifests and no source, apply the
**topology menu** per the project-setup skill (structure) as one confirmation —
present the three templates and let the user pick, exactly as with stacks. There
is no default and nothing to object to, so no `enforcement` entry: record
`topology` and `topology_reason`.

**Stacks are elicited, never stated.** For each project, present the templates
the installed stack plugins offer for that role as a menu with an
**other (describe)** option, plus their repo-level menus. vwf ships no stack
template of its own, no default, and nothing to object to, so there
is no `enforcement` entry for a stack. `<%= it.cmd("vwf:architecture") %>` owns this elicitation
— hand off to it at step 7 rather than duplicating it here; what this step needs
is only enough detection to populate the menu's starting point.

**Existing non-conforming repo.** When an existing repo does not match the
selected topology template's suggested layout, fold a consent-gated restructure
proposal into the step-4 migration plan (batched; moves that are risky or cross
repo boundaries — e.g. a submodule split — become written recommendations
instead, per migration-and-consent). A decline is recorded as a structure
deviation in the registry and not re-proposed on later runs.

### 3. Reconcile format & legacy

Read `.config/vwf.yaml` (or the legacy `docs/blueprint/.vwf.yml`) if present and
compute the **migration delta** between the repo's current format and the format
this vwf ships. The deltas to compute, and what counts as drift in the current
layout, are in [format reconcile](references/format-reconcile.md) — read it
here, together with only the project-setup skill's `format-versioning` deltas
between the repo's stamp and the shipped format. Fold in any old or partial
structure.

`19 → 20` ships with the config's **`12 → 13`** migration (per the vwf-config
asset): the backing, deploy, design and CI axes move down to per-project keys.
Run the two together — a repo on one but not the other is a state neither
migration expects.

Any YAML artifact a migration writes must parse — validate them in step 10.

### 4. Build the migration plan (dry-run)

Enumerate every action: `docs/blueprint` scaffolding, code-restructuring moves
to match the registry topology (grouped into **batches**, see the Hard Rules),
tooling (mise), CLAUDE.md merge, README. **Write the plan to a scratch artifact
`docs/blueprint/.vwf-migration-plan.md`** (deleted on completion, step 11) and
present it **section by section** — do not keep it chat-only. **Wait for
approval.**

**An `iac` project inside another repo** enters the plan as its own batch: a
proposal to extract that directory into its own repo and add it back as a
submodule of the product parent. Present it as a dry run like every other batch
— the moves, the resulting `.gitmodules` entry, and the registry `path` that
changes — and **never apply it uninvited**; a repo split rewrites history
boundaries and is the least reversible thing setup can do, so it is never
bundled with anything else. A decline is recorded and not re-proposed on later
runs; `<%= it.cmd("vwf:doctor") %>` keeps reporting it as blocking, which is the honest state.
The rule and its rationale live in `<%= it.root %>/assets/topologies/`.

**Dirty-tree guard.** Before creating the worktree, run `git status`. If the
working tree is dirty, **stop and ask** whether to commit, stash, or proceed —
never migrate over uncommitted changes silently. Once clean (or the user
consents), set up an isolated worktree via `<%= it.cmd("vwf:git-workflow") %>`.

### 5. Tooling

If mise config is missing or incomplete, invoke **devtools:scaffold**. Note any
other runtimes the detected stacks need — do not install them. If
`devtools:scaffold` fails, report the error, offer to continue without it (leaving
mise config for the user), and record the skip in `setup_progress`.

### 6. Migrate (consent-gated)

Scaffold the `docs/blueprint` tree (architecture, conventions, design-system,
environment skeletons from templates, plus `flows/index.md`,
`entities/index.md`, and the empty `apis/` + `apis/released/` dirs) plus
`docs/plans/` and `docs/plans/archived/`. Restructure source per the approved
plan, **one batch at a time with approval** — move with `git mv` (preserve
history), never delete.

**On batch rejection.** If the user rejects a batch, **stop** — apply no further
batches. Report which batches were applied and which remain pending, leave the
worktree intact for the user to inspect, and record the stop (applied/pending)
in `setup_progress`.

**Bootstrap the environment catalog.** When the registry declares integrations
or a secrets-manager `config` (the `2 → 3` trigger), scaffold
`docs/blueprint/environment.md` and populate it from the repo's existing usage
per [environment bootstrap](references/environment-bootstrap.md) — read it when
that trigger holds. Record variable names only; **never copy a value**.

### 7. Orchestrate foundations

Gate each foundation on the **step-3 delta** — a conforming repo runs neither,
yielding an empty plan (the idempotence Hard Rule):

- Run `<%= it.cmd("vwf:product") %>` only if `docs/blueprint/product.md` is **missing** (the
  `4 → 5` delta) or the migration surfaced a product-level change. It comes
  **first** — the goals it pins anchor everything downstream.
- Run `<%= it.cmd("vwf:architecture") %>` only if the registry is **missing** or the delta
  requires a registry change (a new/changed project, capability, or
  cross-cutting decision).
- Run `<%= it.cmd("vwf:design-system") %>` only if the topology has a **UI surface**
  (`ui: true`) **and** `docs/blueprint/design-system.md` is missing or stale. It
  **imports** the product's design system from its design tool (pick or build one on
  claude.ai/design first); with no surface connected it halts with connect
  instructions — tell the user, and record the skip in `setup_progress` so a
  later run resumes it.

These are interactive — hand off, then resume. If a foundation command fails,
report the error, offer to continue without it (leaving that foundation for a
later run), and record the skip in `setup_progress`.

### 8. Author CLAUDE.md & README

Merge the vwf section (from the project-claude template) into the repo's
`CLAUDE.md`, **preserving existing content**. Generate or update the README via
**`<%= it.cmd("vwf:readme") %>`**; if it fails, report the error, offer to continue without it
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
- **per-project nuances** the run surfaced — a `coverage_target` override, a
  non-conventional `harness.health` path, a `package_manager` override —
  elicited when ambiguous, never assumed. A project's **`platforms:` is not one
  of them**: it is a system-shape fact and lives only in
  `docs/blueprint/registry.yaml`, written by `<%= it.cmd("vwf:architecture") %>` (format 19
  removed the duplicate key from this file);
- the **`stack` block for every project** and the repo-level **`repo.stack`**,
  as `<%= it.cmd("vwf:architecture") %>` elicited them at step 7 — write them out in full, for
  every project the registry declares. Since config-format 13 that block carries
  **all three technology axes per project**: `template`, `backing_template` (a
  list — `[]` when the project talks to no backing service) and
  `deploy_template` (`n/a` for a `frontend` on a screen platform and for an
  `iac` project). An absent block is not "the default"; it is what leaves
  `<%= it.cmd("vwf:doctor") %>` with nothing to check;
- the per-project **`design`** (UI projects only — the design tool token the
  adapter resolves) and **`cicd`** (the CI system) keys, likewise per project
  since config-format 13. Never write a product-wide `backing:`, `deploy:` or
  `design.tool` key: those are `12` drift, and step 3's `12 → 13` migration is
  what removes them from a repo that has them;
- leave `pipeline` / `environments` / `docs_sync` absent unless the user pinned
  them.

**Write the memory tree and the mempalace config.** `docs/memory/` with its
seven room directories (three of them gitignored), and a `mempalace.yaml` in
**each repo root** — the parent and every submodule — all naming the single
confirmed `memory.wing`. The layout, the seeded rooms, and the two routing traps
are in [the memory tree](references/memory-tree.md); read it at this step. Two
rules hold regardless: present the files as part of the step-4 dry-run and
confirm the wing (one MCQ) before writing, and an existing `mempalace.yaml` is
**merged, never overwritten**.

On the `5 → 6` migration, `git mv` the legacy stamp to the new path first (move,
never delete), then restructure — per format-versioning. Also migrate any
`config_format` drift per the vwf-config asset's migration notes (e.g. `1 → 2`
renames `pipeline.autopilot_caps` → `pipeline.execute_caps`).

**Persist.** Per `<%= it.root %>/assets/memory.md`, store the durable
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
frontmatter-and-links reference. Confirm every YAML artifact the migration wrote
(`entities/*/schema.yaml`, `apis/*.openapi.yaml`) parses. Confirm
`environment.md` carries **no secret values**.

Then run **`<%= it.cmd("vwf:doctor") %>`** over the whole repo — it checks the config just
written against what the repo actually is (LSP servers and toolchains per
declared language, frameworks/dependencies against each manifest, repo tooling,
harness task names, health paths). Setup **records** most of what it reports and
does not gate on it: a missing LSP plugin or an unbuilt harness capability is a
normal state for a freshly onboarded repo. Fold anything it finds into the
step-11 summary. Report anything still open.

**Halt on a `blocking` finding.** Mandated tooling — mise, the graphify CLI — is
what the whole pipeline runs on, and by this step everything setup can fix has
already been attempted. A remaining blocking finding means the repo cannot run
vwf: report it with its remedy and stop, rather than stamping a config that
describes a repo nothing can execute against.

**One exception: a declined graph build.** The graph step offers and the user
may refuse; a recorded decline is a settled choice, not an unmet mandate. Note
it as a degradation and finish normally — halting there would override consent
the user already gave.

### 11. Approval gate & commit

Summarize everything created / moved / updated and wait for approval. On
approval, **finalize resumability state**: remove the transient
`setup_progress:` key from `.config/vwf.yaml` and delete the scratch
`docs/blueprint/.vwf-migration-plan.md`. Then commit via `<%= it.cmd("vwf:git-workflow") %>`
with a `chore(vwf):` or `docs:` message. Keep the worktree local; do not push.

**Knowledge graph.** Per `<%= it.root %>/assets/graphify.md`, `setup` is
the **only** vwf command that builds graphs. After the commit, if
`graphify-out/graph.json` is missing and the `graphify` CLI is on `PATH`, offer
— consent-gated; it is a long, LLM-driven build — to build it (invoke the
`graphify` skill on the repo root of the **main checkout**, never the worktree)
and install the post-commit refresh hook (`graphify hook install`). A decline is
honored without re-asking this run; every other vwf surface falls back to direct
reads when no graph exists, so absence never blocks anything.

**Chain forward.** With the foundations in place, offer to continue straight
into `<%= it.cmd("vwf:blueprint") %>` (the full-product sweep — the next step of the pipeline);
the user can decline and blueprint later.
