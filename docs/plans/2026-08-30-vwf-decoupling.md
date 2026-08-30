# Plan: what vwf should not be holding

**Status: draft, 2026-08-30. Every gate is answered; A–G await execution.**
Shipped so far: stackgen as a `vwf` dependency (H), the `common/` task library
with its slot contract (I), and `git-workflow`'s two-pass `code:precommit`.
Everything else is the write-up, not the change — each section says which it is,
and **J** is how it gets executed.

It comes out of an audit asking whether `vwf` is generic or pinned to a tech
stack. The answer was **generic on the product's stack, pinned on the
developer's toolchain** — the technology-free guard (`scripts/src/check.ts:660`)
really does keep languages, frameworks, datastores and test runners out of vwf,
and the four-axis stack-adapter seam really does delegate them. What it never
looked at is the second category: the tools vwf itself shells out to.

Thirteen of those were reviewed. **Eight are confirmed correct** and are not in
scope here — see [What stays](#what-stays). Sections A–E are the five that are
not; F is the checker hole that let two of them through; G moves secrets out of
`devtools`; and H is the framing the rest follow from — **vwf defines the
product, so its hard dependencies should be document-management ones** — plus
the `setup` and `doctor` split that framing implies. I is the `common/` task
library, and J is how the rest gets executed: **ten subagent units in four
waves**, so the orchestrator holds the rulings and never the files.

## A. Context7's runner is not the user's choice

**Today.** `plugins/vwf/.claude-plugin/plugin.json` declares the docs server as
`"command": "pnpm"`, `"args": ["dlx", "@upstash/context7-mcp"]`. A bun user gets
a server that will not start, and the failure is opaque — nothing checks pnpm,
so it surfaces as a dead MCP server rather than a missing prerequisite.

**Ruling.** The dependency is fine; the runner is the user's. `pnpm`/`node` stay
the recommendation, `bunx` and anything else Context7 supports must work.

**The mechanism, verified.** Claude Code expands `${VAR}` and `${VAR:-default}`
in `command`, `args`, `env`, `url` and `headers` of an MCP server config — so
this is expressible, but not as a per-token swap: `args` is a fixed-length
array, and `pnpm dlx X` (3 tokens), `bunx X` (2) and `npx -y X` (3) do not share
a shape.

**Recommended:** one variable holding the whole runner phrase.

```json
{
  "command": "sh",
  "args": ["-c", "${CONTEXT7_RUNNER:-pnpm dlx} @upstash/context7-mcp"]
}
```

Covers `pnpm dlx`, `bunx`, `npx -y`, `deno run -A npm:`, and an absolute path to
a globally installed binary. Costs an `sh -c` layer, which this repo's hooks
already assume.

**Rejected:** splitting command and subcommand across two variables (`bunx` has
no subcommand, and an empty argv element is not the same as an absent one), and
dropping the server so users wire it in their own `.mcp.json` (purest, but every
existing user silently loses the docs server).

**Open.** Does `plugins:check` start reading manifest `command`/`args`? The
technology-free guard reads `.md` only, which is exactly why `pnpm` sat in the
manifest unnoticed. Enforcing this ruling means widening the guard's input, not
just editing the file.

## B. rtk is invoked but never named

**Today.** `plugins/vwf/hooks/hooks.json:7` runs
`command -v rtk >/dev/null 2>&1 && rtk hook claude || true`. That is the
**only** occurrence of the string `rtk` in the entire plugin — no doctor check,
no prose, no install hint. `CLAUDE.md` claims its absence "degrades to a warning
by design"; there is no warning. It is silent.

**Ruling.** Recommended, not required. Alert when missing; never block.

**Change.** Add a non-blocking `/vwf:doctor` finding, and give rtk a sentence
somewhere a user will read it — what it is and how to install it. The hook's
`|| true` guard stays as-is; it is correct.

**Open.** Which doctor section? §3–5 is stack tooling, §8 is code intelligence.
rtk is neither. Either a new subsection or a "recommended tooling" group under
§5.

## C. `pipeline/mise-built` belongs to CI/CD

**Today.** `assets/delivery-pipeline.md:28` — rule 1 names **`jdx/mise-action`**
and `MISE_ENV: ci`, and bans language-setup actions, `apt-get` and global
installs. That is a GitHub Actions implementation detail sitting in vwf's
contract asset.

**Ruling.** mise stays mandatory as vwf's own tool (that ruling was confirmed);
*how CI installs it* is the CI system's business.

**Change.** vwf keeps the requirement — every tool a job uses is declared in the
repo's tool manifest and installed from it, never ad hoc. The named action and
the env variant move to the CI/CD side.

## D. The tag-triggered model becomes a recommendation

**Today.** `assets/delivery-pipeline.md:32,41` — rules 2 and 3 mandate the tag
shape `<project>-<env>-v<semver>`, the trigger globs `*-stage-v*`/`*-prod-v*`,
and branch validation via
`git merge-base --is-ancestor <tag-commit> origin/<branch>` against `develop`
and `main`. The environments table (line 17) hardcodes the same two branches as
the source of each environment.

**Ruling.** Recommend the git-tag model; let the user choose another. Whatever
they choose must support multi-repo and multi-environment. The shape belongs to
the CI/CD stack as a base.

**Change.** vwf keeps the *requirement* those rules exist to serve — a deploy is
deliberate, traceable to a validated commit, and never fired by a branch push —
plus rules 4 and 5, which are release semantics rather than mechanism and stay
vwf's. The tag grammar, the globs, the branch mapping and the `merge-base` check
become the recommended default on the CI/CD side.

Note the cicd plugin already has the fallback half of this:
`plugins/cicd/skills/workflow/references/delivery-pipeline.md:50` — *"Without
the contract, release triggers are elicited as normal — but offer this shape as
the recommended default."* The ruling makes that the general case rather than
the exception.

**Resolved — and the answer is bigger than the question.** I asked which of two
plugins should hold the base. The answer was that one of them should not exist:
*"cicd is also not a plugin, it's subset of stackgen. There will be only 2
plugins: `vwf` and `stackgen`."*

So `plugins/cicd` **dissolves**. The mechanism rules land in stackgen's
`ci-system` kind (`assets/kinds.md:388`), which already exists on the `cicd`
axis and already ships a `github-actions` component and bundle — `gitlab-ci` and
the rest join it as siblings. The overlap that made the question hard was two
plugins describing the same pipeline; removing one removes the overlap.

**The roster this implies is not yet planned.** Two plugins means `devtools`,
`typescript`, `flutter`, `gcp` and `cloudflare` dissolve into stackgen packs
too, and vwf ends with no plugin dependency at all. That is several waves beyond
this plan, and `devtools` is load-bearing today — `/vwf:setup` calls
`/devtools:scaffold`, and a skill vwf cannot see fails silently. **Do not start
it from this paragraph**; it needs its own plan, and the sequencing question
(what replaces the scaffold call) has to be answered before the first plugin
goes.

**Also open.** Rules 1–3 have `enforcement.rules` waiver ids
(`pipeline/mise-built`, `pipeline/tag-triggered-deploys`,
`pipeline/branch-validated`). If they stop being vwf mandates, existing waivers
naming them dangle. That folds into the same `config_format` bump as U4.

## E. OTLP becomes recommended, and moves

**Today.** `assets/capability-vocabulary.md:53` — *"The product emits OTLP and a
sink receives"*. `skills/architecture/SKILL.md:243` templates the capability
slug as `otlp-to-<sink>`.
`skills/product-foundations/references/observability.md:30` names
`OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_API_KEY`;
`assets/templates/conventions.md:81` seeds "structured logs no-PII **via
OTel**".

**Ruling.** OTLP is recommended, not the only option — a product may choose
provider-specific tooling. The judgment moves to stackgen.

**Smaller than it looks.** Most of vwf's wording is already neutral ("one
vendor-neutral telemetry standard" — `engineering-baseline.md:143`,
`product-foundations/SKILL.md:38`). Four places name the protocol outright: the
two above plus the slug shape and the seeded conventions line.

**Already built on the stackgen side.** `assets/contracts/observability.md`
holds the neutral capability contract, and `stacks/bundles/otel-lgtm.md` is a
concrete sink. What does *not* exist is a non-OTLP alternative, so the ruling
creates an option nothing currently fills.

**Resolved.** The no-vendor-SDK rule stops being the contract's headline law and
becomes **what choosing OTEL buys you**: *"whoever wants to follow that rule
will select OTEL instead of vendor provided SDKs."* The contract states the
neutral requirements; the lock-in argument moves into the OTEL provider pack,
where it is a reason to pick that pack rather than a law binding every product.

Two consequences: `otlp-to-<sink>` becomes **`telemetry-to-<sink>`**, so the
capability slug names no protocol; and the argument itself is preserved rather
than deleted — it was well made, it just belongs to the option, not to the
contract.

## F. The guard has a hyphen-shaped hole

`prescribes()` anchors on `(^|[^a-z0-9-])token([^a-z0-9-]|$)`
(`scripts/src/check.ts:625`). The trailing class **excludes `-`**, so a banned
token used as the head of a compound never matches. Two real escapes today:

1. `skills/product-foundations/references/observability.md:45` — *"Alerting and
   dashboards: **Grafana-side by default**"*. `grafana` is in `TOOL_TOKENS`;
   `Grafana-side` is not. This is a stated default, so a product on another
   backend is being nudged. Ties into E.
2. **`deploy/npm-package`** — a hardcoded deploy-axis slug vwf prescribes for
   `cli` platforms in four places:
   `skills/architecture/references/platforms.md:80`,
   `skills/architecture/references/stack-menu.md:34`,
   `skills/doctor/references/stack-checks.md:84` (*"should pin
   `deploy/npm-package`"* — a doctor check), and `assets/vwf-config.md:334`.
   `npm` is banned; `npm-package` is not. A `cli` project publishing to
   crates.io or PyPI is told to pin an npm-named slug.

**Change.** Drop `-` from the *trailing* character class only — keep it leading,
so `axe-core` still anchors. Then both escapes above surface as findings and get
decided on their merits. Same hole would swallow `docker-compose`,
`postgres-backed`, `terraform-managed`.

**Resolved, and it exposed a second defect.** vwf names **no slug at all**. The
requirement is that a `cli` project pins a deploy template for its package
registry; *which* template is the stack's answer, the same rule as everywhere
else. `stack-checks.md:84` stops prescribing `deploy/npm-package` and checks
that the axis is answered, not what it was answered with.

The second defect is bigger: **`deploy_template` is a single slug, and it should
be a list.** *"We will have more than 1 type of package deployment. In fact a
CLI or any other type of repo can have multiple types of delivery mechanisms."*
A CLI may ship to a package registry **and** a container image **and** a signed
archive; today the config can record one. This is the shape change
`backing_template` already made in `config_format` 13, so it is precedented
rather than novel — and it folds into the same bump as H's `unresolved`, since
both are edits to the same block.

## G. Secrets: doppler leaves devtools, fnox joins it

**Ruling.** Move `doppler` out of `devtools` and into stackgen. Add **`fnox`**
as the alternative. **Secret management is mandatory; which tool serves it is
the user's selection.** They deserve their own category.

### What each actually does

Both looked up through Context7 rather than recalled.

**Doppler** (`/dopplerhq/cli`) — a hosted SecretOps platform. `doppler login`
then `doppler setup` links a working directory to a project + config;
`doppler run -- <cmd>` executes a process with secrets injected as environment
variables; per-config **service tokens** give CI non-interactive read access.
Adds environments/configs, versioning, fine-grained access control, and activity
and audit logs. The secrets live on Doppler's servers and an account is
required.

**fnox** (`/jdx/fnox` — same author as mise) — local-first, configured by a
`fnox.toml` committed to the repo. Two storage modes, mixable per secret:
**encrypted directly into git** (age, AWS KMS) or **a reference to a remote
manager** (AWS Secrets Manager / Parameter Store, Azure, GCP, 1Password,
Bitwarden, Infisical, HashiCorp Vault). `[profiles.<env>.secrets]` blocks
separate development / staging / production. `fnox activate <shell>` loads
secrets on directory change; a per-user daemon caches decryption. Team
onboarding is adding a member's age public key to `recipients` and running
`fnox reencrypt`.

### The axis that separates them

**Where the secret lives, and what onboarding a teammate costs.** Doppler: a
vendor holds them; onboarding is an org invite; CI gets a service token. fnox:
you hold them, in git or in your own cloud; onboarding is an age public key and
a re-encrypt; CI gets a decryption key. Neither is better — they are different
answers to "do we want a third party in the loop", which is exactly the kind of
question that belongs on a menu.

### The neutral contract, which has to exist first

Whatever the tool, the requirements are the same: **secrets reach a process as
environment variables, never read from a committed plaintext file**; each
environment resolves its own set; CI authenticates non-interactively; and no
secret *value* ever appears in a vwf doc — `environment.md` catalogs names only,
and that stays true.

**Recommended placement.** `capability-provider` with a new category
`secrets-manager`, plus `assets/contracts/secrets.md`. That mirrors the
observability shape exactly — a neutral contract plus one pack per provider —
and doppler and fnox become its first two packs. A new *type* is not warranted:
a secrets manager is the flavour half of a capability, which is what
`capability-provider` already means.

**Open — and it needs answering in the contract.** fnox's encrypt-into-git mode
collides head-on with two existing rules: the gitleaks doctrine, and the memory
asset's `exclude_patterns` secret denylist. An age-encrypted value in a
committed `fnox.toml` is not a leak, but it reads exactly like one to every
scanner in the repo. The contract has to state the allowance, or the two packs
will fight.

**Also open.** "Mandatory" is a vwf-side statement — a product foundation or an
`engineering-baseline` rule saying every product has a secrets mechanism — while
*which tool* is stackgen's menu. Same split as E, and it should be written the
same way.

## H. The boundary: vwf defines, stackgen builds

The framing that generates A–G rather than following from them: **vwf's job is
to define the product, so its hard dependencies should be document-management
ones.** Anything build-facing is either delegated at runtime or degrades.

### The inventory

**Stays — document management.** Markdown + YAML frontmatter (the OKF profile),
`documentation-standards`, mermaid, OpenAPI and the JSON-Schema-shaped
`schema.yaml`, the format stamps, `readme`, `docs-sync`, `archive`.

**Stays — product definition.** `product`, `architecture` and the registry,
`blueprint` with flows/entities/apis, `design-system`, `conventions`,
`environment` (names only), `product-foundations`, `engineering-baseline`,
`principles`, `minimalism`, `elicitation`, `standard-flows`,
`capability-vocabulary`, `rest-api-design`, and the two authoring doctrines.
None of it names a technology today and none of it should.

**Stays — the agent's own working environment.** `git-workflow`, `memory` +
mempalace, `graphify`, `handoff`/`recall`. These are vwf's tools the way an
editor is: they serve the *author*, not the product. Worth saying plainly though
— under a strict document-management framing, blocking a doc-only user on a
Python code-intelligence CLI is the hardest of these to defend.

**Should move or delegate.** The harness *mechanisms* (what satisfies `dev`,
`e2e_local`, `local_stack`, `screenshots`, `goldens` — vwf keeps the capability
*names*, since its verifiers speak them); the delivery-pipeline mechanism rules
(C, D); OTLP (E); `deploy/npm-package` (F); doppler and the secrets menu (G);
the per-language half of `devtools:scaffold` — its Node/Python/Flutter
detection, `npm.package_manager`, `node.gpg_verify` and the
`assets/tasks/{node,python,flutter}/` templates are stack content sitting in a
vwf dependency.

**Contested, and left open.** `/vwf:execute` writes code, which is not defining
a product — but its stages are *verification against the contract*, and they
already acquire stack knowledge through resolved conventions and materialized
skills rather than through a dependency. That seam looks right; the framing
question is whether execute belongs in vwf at all, and it is too big for this
plan.

### The vwf-first problem, which is already real

Adoption goes vwf first, stackgen later. Today that path has a hole:
**installing vwf alone leaves the stack menu empty.** vwf's only dependency is
`devtools`, whose stack adapter retired in Wave C, so no installed plugin
answers `-stack-menu`. The four axes are closed and carry no *other (describe)*
option since `config_format` 14, so `/vwf:architecture` step 3b asks a question
the user cannot answer.

**Resolution, half of it landed.** Two moves: make stackgen a dependency, and
make the stack answer deferrable. Installing is not using — stackgen acts only
when an axis is pinned — so this serves the practical path better than leaving
it uninstalled, which produces an empty menu rather than a deferral.

**stackgen is now a `vwf` dependency** (vwf `19.3.0`, alongside `devtools`,
resolved from `virajp-plugins`). That closes the empty-menu hole for a fresh
install and nothing else; the deferral below is still to build, and it is the
piece the rest of this plan waits on.

### The deferral mechanism

**The state to add: `unresolved`.** Every stack axis today has exactly two
states — a template slug, or `n/a` (decided: none). There is no way to say *not
yet*, which is why an unanswerable question has to be answered anyway. Add a
third:

| Value        | Means                                                |
| ------------ | ---------------------------------------------------- |
| `<slug>`     | pinned                                               |
| `n/a`        | decided: this axis does not apply                    |
| `unresolved` | **deferred** — not asked yet, or asked and postponed |

`unresolved` is a `config_format` bump, and it needs the migration written with
it: existing configs have no such value, so nothing upgrades into it — it only
ever arrives from an `architecture` run.

**What each surface does with it.**

- **`/vwf:architecture`** — offers *defer this* alongside the menu entries on
  every axis round, and records `unresolved` when taken. It says what unlocks
  the axis (which plugin, or that the menu is empty) rather than leaving the
  user to guess. Re-running is how you answer it later; the axis rounds it
  already resolved are not re-asked.
- **`/vwf:doctor`** — an `unresolved` axis is a **degradation**, reported every
  run, never blocking. It is the record of a decision postponed, not of a repo
  in a bad state. The stack sections that depend on it report
  `not checked — no
  stack resolved` (see
  [Splitting `doctor`](#splitting-doctor)).
- **`/vwf:setup`** — the tooling step records what it could not provision and
  names the unlock, instead of halting or silently continuing.
- **`/vwf:plan` and `/vwf:execute`** — this is the one place `unresolved` must
  still **halt**, and it is a different halt from today's. Both resolve their
  stack's `conventions:` before writing or building; an unresolved axis means
  there are none to read, and code sized against conventions nobody read is the
  exact failure the closed menu exists to prevent. So: **defining the product
  works with every axis unresolved; building it does not.** The halt message
  names the axis and points at `/vwf:architecture`, not at an install.

**The line this draws** is the one the whole plan is about: `product`,
`architecture`, `blueprint` and every doc surface run to completion with no
stack chosen at all. `plan` and `execute` are where a stack stops being
optional. That is exactly the vwf-defines / stackgen-builds boundary, expressed
as a config state rather than as prose.

**Open.** Does `unresolved` need to be per-axis or is per-project enough?
Per-axis is more precise and costs nothing to record, but it means four possible
deferral states per project, and `doctor` has to report them without turning
into a nag. Per-axis is the recommendation; the reporting shape is the part to
get right.

### Splitting `setup`

`/vwf:setup` already separates cleanly, because one step is doing the work of
the other half:

| Stays in vwf                                                                                                                                                                                                      | Defers to the stack side                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Mode resolution (`onboard`/`migrate`/`current`), the `docs/blueprint/` tree, `.config/vwf.yaml`, the CLAUDE.md section, the memory tree + `mempalace.yaml`, `.graphifyignore`, the git commit, printing the chain | `onboard-pipeline.md:24`'s tooling step — the mise config, the task library, harness provisioning |

The change is that the tooling step becomes **deferrable rather than
skippable**: it records what is unresolved and names what unlocks it, instead of
either halting or silently continuing.

### Splitting `doctor`

Doctor's nine sections already group by owner:

| Sections                                | Owner                           |
| --------------------------------------- | ------------------------------- |
| §1–2 membership, format stamp           | vwf                             |
| §3–5 languages, manifests, repo tooling | stack                           |
| §6 harness                              | stack mechanism, vwf task names |
| §7 memory                               | vwf                             |
| §8 code intelligence                    | vwf                             |

**Proposed: one command, adapter-delegated.** `/vwf:doctor` runs its own
sections and invokes a fixed-name `stack-doctor` skill in the repo's own
`.claude/`, materialized by whichever pack owns the stack — the same seam as
`ux-gate` and the three design-import names, reused rather than reinvented. With
no stack resolved, those sections report **`not checked — no stack resolved`**:
a degradation, never a blocking finding. Two doctors would be worse; a user
should not have to know which one to run.

**The inversions that vwf-first requires.** Today an **unknown language** is
blocking (`stack-checks.md:30`) and so is **mise** (`stack-checks.md:152`).
Under deferred adoption neither can be, until the user has pinned a stack —
otherwise `/vwf:doctor` halts `setup` and `execute` on day one for a product
nobody has chosen a stack for yet. The rule becomes conditional: blocking **once
an axis is pinned or a harness capability is claimed**, a degradation before
that.

**Open.** Does graphify stay blocking under the document-management framing? It
is the one mandate with no relationship to either the product's stack or the
docs — it indexes code that may not exist yet.

## I. The `common/` task library: slots and fills

H said the per-language half of `devtools:scaffold` is stack content in a vwf
dependency. This is the other half of that: **what the shared task library is**,
once you stop treating it as a pile of scripts and start treating it as a
contract.

### The rule

**A task name is vwf's; a task's mechanism is the stack's.** Same split as
`harness.md` makes for capabilities, applied to the task library. That gives
every file in `common/` one of two jobs:

- a **fill** — it does the work, and the work does not change when the stack
  does (git, mise, bash);
- a **slot** — the name is the contract, the mechanism comes from whichever
  stack the repo pins. It ships as a **placeholder**.

### Placement

Derived by scanning six repos — `95octane`, `95octane/wiki`, `ai-plugins`,
`claude-status`, `linter`, `macos-setup`.

| Task                   | Kind               | Why                                                                    |
| ---------------------- | ------------------ | ---------------------------------------------------------------------- |
| `_scripts/helpers`     | fill               | bash only; the library's own prelude                                   |
| `_scripts/placeholder` | fill               | the slot-notice mechanism                                              |
| `setup/all`            | fill (slot caller) | names no tool — only the tasks it calls, in order                      |
| `setup/ai`             | fill               | `claude` only, which is vwf's host                                     |
| `setup/mise`           | fill               | mise only                                                              |
| `setup/precommit`      | slot caller        | requirement is vwf's; the hook runner is pinned                        |
| `setup/secrets`        | **slot**           | mandatory capability, chosen tool (ruling G)                           |
| `setup/deps/all`       | fill (slot caller) | the package-manager aggregator; runs `install`, probes for the rest    |
| `setup/deps/install`   | **slot**           | install from the lockfile — the one verb every manager has             |
| `setup/external/*`     | **absent**         | optional surface; not shipped, probed by name (see below)              |
| `code/all`             | fill (slot caller) | names only `code:format`, `code:lint`, `code:sec`                      |
| `code/format`          | fill               | dprint over markdown — one binary, and every repo has markdown day one |
| `code/lint`            | **slot**           | every linter worth running belongs to a language                       |
| `code/sec`             | **slot**           | scanning is mandatory; the scanners are a choice                       |
| `code/precommit`       | fill               | pre-commit invocation; now fails when a hook fails                     |
| `code/git-config`      | fill               | git only — rejects identity/signing keys from *local* config           |
| `code/worktrees`       | fill               | git only, submodule-aware                                              |
| `worktree/init`        | slot caller        | **vwf already probes this name** at `worktree-setup.md:99`             |

Rejected as common, with reasons, in the session that produced this:
`code/count` (hardcodes `*.ts`/`*.dart` and `backend/`/`frontend/`; no contract
behind it), `setup/cleanup` (`docker system prune`, no caller), `setup/doppler`
(superseded by `setup/secrets`), and everything per-repo (`build/*`, `site/*`,
`release/*`, `i/*`, `p/*`, `brew/*`, `dotfiles/*`).

### `deps` and `external`, and the two wrong turns getting there

`setup/deps/*` was first rejected — read as the docker-compose lifecycle
`95octane` uses it for, and routed to stackgen's `contracts/local-stack.md`.
Then it was adopted as the *whole* dependency surface, package manager and
services together. **Both were wrong**, and the correction is the vocabulary:

- **`setup/deps/*` — the language's package manager, and only that.** Always
  present. Verbs: `all`, `install` (required), and optionally `upgrade`,
  `outdated`, `audit`, `cleanup`.
- **`setup/external/*` — emulators, containers, local queues.** *"External is
  optional, not all products will need it so if it is required then wire it
  otherwise it must not exist."* Verbs: `update`, `pull`, `check`, `start`,
  `stop`, `restart`.

They are siblings because a repo routinely has one and not the other, in both
directions — a docs product has neither, a CLI has deps only, a service running
against a local emulator has both.

**The tool name leaves the task path.** `setup/pnpm/*`, `setup/uv/*` and
`setup/app/*` all dissolve into `deps/`, so `setup:deps:install` reads the same
on every stack. One task library serves one package manager; a polyglot monorepo
already gets one library per project via `mise run --cd <project> setup:all`.

**`external/` is not a slot, and that distinction is now load-bearing.** A slot
ships as a placeholder because the capability is mandatory and only the tool is
unchosen. `external/` is an optional *surface*: a repo without one has no
folder, no marker and no message. `setup:all` probes `setup:external:update` by
name, so absence is silent rather than announced. Only `update` is wired — it
pulls and builds; starting services is a deliberate act, not a side effect of
refreshing a toolchain.

**The same reasoning demoted four `deps` verbs.** `upgrade`, `outdated`, `audit`
and `cleanup` are probed rather than shipped as placeholders. An overlay with no
`upgrade` is not unconfigured — pnpm does not separate installing from upgrading
— and a placeholder there would report a gap that does not exist. The rule that
falls out: **a slot means the tool is unchosen; absence means this tool has no
such verb.**

### Placeholders exit 0

An unconfigured repo must run `code:all` and `setup:all` end to end. The docs a
product is defined in get formatted and gated from day one; the unfilled slots
announce themselves rather than halting the aggregator that called them. Running
any one placeholder lists **every** unconfigured task in the repo, because a
user who hits one will hit the rest and one round of setup answers all of them.

This is deliberately the opposite call from `code/precommit`, where the swallow
was removed so a failing gate fails. The difference: a failing hook is a result,
an unfilled slot is an unanswered question.

### Landed 2026-08-30 — in `devtools`, pending H

The tasks are written and shipping (`devtools` `1.4.0`). **Where they live is
still H's question** — they sit in `plugins/devtools/assets/tasks/` because that
is where the task library is today, not because that is where the split puts
them.

`common/` is 17 files: `_scripts/{helpers,placeholder}`,
`setup/{all,ai,mise,precommit,secrets}`, `setup/deps/{all,install}`,
`code/{all,format,lint,sec,precommit,git-config,worktrees}`, `worktree/init`.
The overlays are `code/{format,lint}` plus their own `setup/deps/*`.

Three departures from the reviewed table, all flagged rather than folded in:

- **`setup/deps/` was added.** The three overlays each defined their own
  `setup/all`, which would have overwritten the common orchestrator and taken
  the submodule fan-out with it. Extracting the slot the overlays fill was the
  minimum to make the approved `setup/all` work.
- **`code/lint` ships as a slot, not a markdown default.** Formatting has a
  default that costs nothing; linting does not. The linter this ecosystem uses
  for prose would drag a package manager into a repo holding only docs.
- **Only `deps:install` ships as a placeholder**, not the full verb set shown in
  the reviewed preview. See the slot-vs-absence rule above — placeholders for
  verbs a package manager does not have would report gaps that do not exist.

**Judgment call worth naming:** `flutter/setup/flutter` (SDK configuration) was
folded into `flutter/setup/deps/install` rather than kept as a standalone task.
`flutter pub get` resolves against whichever platforms the SDK has enabled, so
configuring after fetching would leave the fetch describing a different app than
the one that builds — they are one step, not two. Reversible if you want the
config re-runnable on its own.

**Migration scope, as ruled: shipped templates only.** This repo's own
`.config/mise/tasks/` is deliberately left on the old shape — the `_helpers`
spelling, no slots, no `deps/`. Existing repos keep working because each sources
its own copy, so this is divergence rather than breakage, and it gets tested
here before it gets adopted here.

## What stays

Confirmed correct and explicitly out of scope: **mise** (blocking, though H
makes the blocking *conditional*), **graphify** and its Python/uv chain,
**mempalace + Qdrant + a container runtime** (blocking config checks), **git**
with worktrees and submodules, **Claude Code** as the host, the **Anthropic
model tiers** pinned in all 17 agent frontmatters, and **OpenAPI +
JSON-Schema-shaped `schema.yaml`**. **devtools** stays a hard dependency by
ruling; what it should still *contain* is H's question, not that one's.

## J. Executing this — the delegation plan

**The orchestrator must not read this work, only decide it.** The files these
rulings touch are among the largest in the repo — `assets/vwf-config.md` alone
is 37 KB, `docs/plugins/vwf.md` is bigger, and `CLAUDE.md` is loaded every
session. Reading them inline costs the context once and then re-costs it on
every later turn. This is the same argument vwf already makes for its own
subagents: delegation is *"a latency and context strategy as much as a quality
one — read-heavy scans and mechanical writing run in a subagent so their file
loads never enter the orchestrator's context."*

So: every unit below is one subagent. The orchestrator holds the rulings, the
gates, and the verification — never the file contents.

### The units

| Id      | Section | Touches                                                                                                                                                                                                                     | Depends on |
| ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **U1**  | F       | `scripts/src/check.ts` (trailing anchor), `scripts/src/check.test.ts`                                                                                                                                                       | —          |
| **U2**  | B       | `plugins/vwf/skills/doctor/` (a non-blocking rtk check), `readme.md` caveat, the false `CLAUDE.md` claim                                                                                                                    | —          |
| **U3**  | A       | `plugins/vwf/.claude-plugin/plugin.json`, marketplace regen, the guard widened to read manifest `command`/`args`                                                                                                            | U1         |
| **U4**  | H, F    | **Config doctrine** — `assets/vwf-config.md`: `unresolved` as a third axis state, `deploy_template` becoming a **list**, the `config_format` 15 → 16 bump and its migration; plus `stack-vocabulary.md`, `stack-adapter.md` | —          |
| **U5**  | H       | **Surface wiring** — `architecture/references/stack-menu.md` (a *defer* option), `doctor/references/stack-checks.md` (conditional blocking), `plan`/`execute` halts, `setup/references/onboard-pipeline.md`                 | U4         |
| **U6**  | G       | stackgen `assets/taxonomy.md` (category `secrets-manager`) + `assets/contracts/secrets.md`                                                                                                                                  | U5         |
| **U7**  | G       | `stacks/capability-provider/doppler/` + its bundle; delete `plugins/devtools/skills/doppler/`                                                                                                                               | U6         |
| **U8**  | G       | `stacks/capability-provider/fnox/` + its bundle                                                                                                                                                                             | U6         |
| **U9**  | C, D    | `assets/delivery-pipeline.md`; the mechanism rules move to stackgen's `ci-system` kind. **`plugins/cicd` dissolves** — see the roster note below                                                                            | U5         |
| **U10** | E       | `capability-vocabulary.md`, `architecture/SKILL.md` (`otlp-to-` → `telemetry-to-`), `observability.md`, `templates/conventions.md`, stackgen `contracts/observability.md`                                                   | U5         |

### Waves

1. **U1, U2, U4 in parallel.** No shared files, no shared decisions.
2. **U3, U5.** Each waits only on its own predecessor, so they also run
   together.
3. **U6**, then **U7 ‖ U8** — two packs, same contract, no shared files.
4. **U9, U10** — both gates were answered 2026-08-30, so this wave is no longer
   blocked on a decision, only on U5.

### What every unit gets, and returns

**Given:** its ruling quoted from this plan, its file scope, and the facts the
audit already established — U7 and U8 in particular get the doppler/fnox
capability findings from section G verbatim, so neither re-runs that research.

**Returns:** a terse report — files changed, decisions taken inside the scope,
anything it could not resolve as `UNRESOLVED:`. Never file contents, never a
diff dump.

**Every unit, before returning:**

- `mise run plugins:check` and `mise run plugins:marketplace --check` pass
- docs reconciled **in the same change** — the repo's hard rule. A unit that
  changes plugin behaviour delegates the doc survey to `docs-reconciler` and
  applies what comes back; it does not read `CLAUDE.md` or `docs/plugins/vwf.md`
  itself
- the plugin's `version` bumped if its behaviour changed

### What stays with the orchestrator

**Settled 2026-08-30, so no longer gates:** the `config_format` bump is
approved; the no-vendor-SDK rule moves into the OTEL pack (E); `deploy/*` loses
its prescribed slug and gains list cardinality (F); and `cicd` is not a plugin —
it dissolves into stackgen, which answers U9's home question.

What remains the orchestrator's: **`Grafana-side by default`**, the other
finding U1 surfaces. Fixing the anchor turns it into a check failure, and
whether the observability doctrine keeps a named default at all is a ruling, not
a mechanical edit. U1 reports it; it does not decide it.
