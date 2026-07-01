---
description: Onboard a repo into vwf's format and keep it current — detect or ask
  (MCQ) the project topology, migrate to the docs/blueprint structure with
  consent, orchestrate the foundations (mise, architecture, design-system), and
  author CLAUDE.md + README. Re-runnable: detects format drift and migrates when
  the vwf format evolves.
argument-hint: ""
model: sonnet
effort: xhigh
---

# init — Onboard & Keep a Repo in vwf Format

Bring any repo — new or existing — into vwf's structure, and re-run any time the
vwf format evolves to migrate the gap. `init` is the Phase-0 bootstrapper:
`init → architecture → design-system → blueprint → plan → execute`.

You own the user conversation. Every change is **consent-gated and
worktree-safe** — present a dry-run plan and wait for approval before writing;
never delete; never overwrite without consent. Apply the **project-init** skill
throughout.

## Doc Paths

| Doc               | Path                                                       |
| ----------------- | ---------------------------------------------------------- |
| Registry          | `docs/blueprint/architecture.md`                           |
| Environment       | `docs/blueprint/environment.md`                            |
| Env. template     | `${CLAUDE_PLUGIN_ROOT}/assets/templates/environment.md`    |
| Format stamp      | `docs/blueprint/.vwf.yml`                                  |
| CLAUDE.md section | `${CLAUDE_PLUGIN_ROOT}/assets/templates/project-claude.md` |

Doctrine: the **project-init** skill (topology-detection, migration-and-consent,
format-versioning, claude-md).

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

---

## Pipeline

### 1. Detect topology

Per the project-init skill (topology-detection), read repo signals —
`package.json`, `pnpm-workspace.yaml`, `pubspec.yaml`, `go.mod`, `Cargo.toml`,
dir layout — plus any existing `docs/blueprint/` or legacy `docs/specs/`. Infer:
monorepo vs polyrepo, the project types present (schema/contract, service/API,
worker, frontend/app), and the stack per project.

### 2. Confirm & fill (MCQ)

Present what you detected and confirm or correct it with the user via **MCQ**,
following `${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md` — one question at a
time, options + "Other". Pin down anything detection could not: missing project
types, stacks, and **whether a UI surface exists** (it makes the design system
mandatory). Never assume UI — confirm it.

### 3. Reconcile format & legacy

Read `docs/blueprint/.vwf.yml` if present. Per the project-init skill
(format-versioning), compute the **migration delta** between the repo's current
format and the format this vwf ships — a legacy `docs/specs/` tree to upgrade, a
missing `design-system.md` / `environment.md` / `integration.md`, entity docs
lacking Relationships / Concurrency, the **`1 → 2`** delta (docs missing OKF
frontmatter and relationships/references not yet written as markdown links), or
the **`2 → 3`** delta (a missing `environment.md` when the registry declares
integrations or a secrets-manager `config`). Fold in any old or partial
structure.

An entity already in the **folder form** (`docs/blueprint/<entity>/` with
`index.md` + surface files) is a conforming layout, not drift — leave it as a
folder; never collapse it into a single file. Each surface file still gets its
own frontmatter under the `1 → 2` delta.

### 4. Build the migration plan (dry-run)

Enumerate every action: `docs/blueprint` scaffolding, code-restructuring moves
to match the registry topology, tooling (mise), CLAUDE.md merge, README. Present
the plan and **wait for approval**. Then set up an isolated worktree via
`/vwf:git-workflow`.

### 5. Tooling

If mise config is missing or incomplete, invoke **mise:scaffold**. Note any
other runtimes the detected stacks need — do not install them.

### 6. Migrate (consent-gated)

Scaffold the `docs/blueprint` tree (architecture, conventions, design-system,
environment, integration skeletons from templates) plus `docs/plans/` and
`docs/plans/archived/`. Restructure source per the approved plan, **one batch at
a time with approval** — move with `git mv` (preserve history), never delete.

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

Run `/vwf:architecture` to author the registry. If the topology has a
frontend/app project (UI), run `/vwf:design-system`. These are interactive —
hand off, then resume.

### 8. Author CLAUDE.md & README

Merge the vwf section (from the project-claude template) into the repo's
`CLAUDE.md`, **preserving existing content**. Generate or update the README via
**markdown:readme**.

### 9. Stamp the format version

Write `docs/blueprint/.vwf.yml` with the `blueprint_format` version and a
topology summary (`ui` if a UI surface exists, `integrations` if the registry
declares integrations or a secrets-manager `config` — i.e. `environment.md` is
required), per format-versioning — the thing a future `init` run diffs against.

### 10. Validate

Confirm the registry parses and the required foundations exist for the detected
topology (design-system present if UI; `environment.md` present if the registry
declares integrations or a secrets-manager `config`). Confirm the migration
produced a well-formed **OKF bundle**: every `docs/blueprint/` doc opens with
valid frontmatter (mandatory `type` from the vocabulary, `title`, `description`,
`status`) and every relationship/reference link resolves to an existing
doc/anchor — per the project-init skill (format-versioning) and the
blueprint-authoring frontmatter-and-links reference. Confirm `environment.md`
carries **no secret values**. Report anything still open.

### 11. Approval gate & commit

Summarize everything created / moved / updated and wait for approval. Commit via
`/vwf:git-workflow` with an `init:` or `chore(vwf):` message. Keep the worktree
local; do not push.
