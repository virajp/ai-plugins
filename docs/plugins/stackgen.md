# stackgen plugin

The principles-driven stack materializer. stackgen implements vwf's
stack-adapter contract with one core rule — **the dispatch rule** — and one
output shape — **artifacts landing directly in the repo's committed `.claude/`
tree**, with three narrow targets beside it: the two things no repo file can
express, and the repo config a component genuinely owns. It makes a product
*executable* on stacks nobody curated, by generating project-level skills,
agents, hooks-wiring and rules from vwf's principles catalog and current
documentation, behind a reviewer gate and your consent.

Configure, not conjure: stackgen wires and documents existing tools — it never
implements a server, and it never invents a tool the ecosystem does not have.

## Install

```sh
claude plugin install stackgen@virajp-plugins
```

Independent of `vwf` at install time — but its two adapter skills exist to be
called by `/vwf:architecture`, `/vwf:setup`, `/vwf:plan` and `/vwf:execute`, so
in practice you list it in the product's roster:

```yaml
# .config/vwf.yaml
stacks: [ stackgen ] # the only stack plugin there is
```

## Components and bundles

**Components** are the atoms — the language, its package manager, each
framework, each toolchain gate, a datastore instance, a cloud service. Each is a
pack (or a generated artifact set) declaring a **type**, a finer **category**,
and the vwf **capability** token it realizes where one applies; the type and
category vocabularies are closed, in `assets/taxonomy.md`, extended
deliberately.

**Bundles** are recorded compositions of component refs —
`<type>/<slug>@<version>`, or `@generated` — never directories. Three bundle
shapes exist today: a Language-Bundle is the composition rooted at a language
component (language + package manager + framework components + toolchain gates);
a Cloud-Bundle is provider + service components; a Datastore-Bundle is
category-level doctrine + an instance component.

The taxonomy splits at the existing seam: **capability tokens stay vwf's**
(`capability-vocabulary.md`); the finer **category taxonomy is stackgen's**. vwf
never learns what an ORM is; stackgen never redefines a capability — the `cdn`,
`secrets-manager` and `access` categories' capability tokens are deliberately
unset until vwf defines them, because a category classifies what a component
*is*, never whether a product must have one. Categories make components
substitutable answers to one blueprint capability, which is what lets stack
menus become category-filtered queries instead of per-plugin lists.
Category-level doctrine is written once as curated knowledge; instance
components cite it and stay thin.

## The dispatch rule

Given a bundle a project pins, stackgen resolves its composition and dispatches
**per component**:

1. **Pre-created pack first, per component.** Curated packs ship as stackgen
   assets under its `stacks/` tree — one pack per component, assets, not live
   skills, so installing stackgen floods no session with every stack's doctrine.
   A component a pack covers is **copied** from its pack into the repo — never
   generated.
2. **Generation only for what no pack covers, per uncovered component.** The
   first template fetch runs the pipeline for each uncovered component: resolve
   the **kind** and its topic bar → detect the real stack (manifests + the
   graphify graph) → one Context7 research pass per bar topic → instantiate
   vwf's principles catalog with citations → the `stackgen-skill-reviewer` gate
   (capped at **four rounds**, after which residuals are reported rather than
   looped forever) → the same materialized tree. Context7 unreachable → **halt,
   never guess**. When the bundle root itself is uncovered, the pin is
   `generated/<technology-slug>`.

Mixed compositions are the ordinary case — a covered language beside an
uncovered framework copies the language's packs and generates only the
framework's artifact — so a later re-sync can act on one component alone.

**The full pack and bundle inventory is generated from the tree** —
[`stacks/inventory.md`](../../plugins/stackgen/stacks/inventory.md), never typed
by hand and guarded against drift in pre-commit and CI. The packs arrived in
waves, starting with `dprint`, `gitleaks`, `grype` and `pre-commit` — the
`repo-gate` kind's components — and closing with `cloud-provider`, the last kind
that had been defined but never authored against, which the `cloudflare` and
`gcp` packs filled. Along the way three packs each deleted a curated *skill* in
the same commit, because the pack plus a neutral contract carry everything that
source said — `deploy-target/container-image` with
`assets/contracts/local-stack.md`, `capability-provider/doppler` with
`assets/contracts/secrets.md`, and `ci-system/github-actions` with
`assets/contracts/release-trigger.md`. The third was the first to retire not a
skill but a **whole plugin**: `cicd` was exactly one kind wearing a manifest.

The retirement wave then took the four that were left — `typescript`, `flutter`,
`gcp` and `cloudflare` — each once its doctrine had landed as packs. That
ordering is the no-skill-lost rule: a pack is the destination that must exist
*before* a plugin retires, never a replacement the moment it lands.

The `devtools` plugin then dissolved into stackgen and was deleted, closing the
marketplace at two plugins. Its mise doctrine and its file-based task library
became the `toolchain-manager/mise` pack, its five repo gates the `repo-gates`
bundle, and `/devtools:scaffold` stopped being a command at all: laying the
toolchain into a repo is a materialization now, like every other pack. Two kinds
were minted on the way — `toolchain-manager` and `workspace` — and packs gained
a fourth output target so one could write a repo's own config files.

**stackgen is now the only stack plugin.** Its packs are the covered path, and
the menu keeps its open `generate` entry for the rest — the stack you use that
nobody wrote a pack for.

## Kinds — what can be generated, and its shape

Every pack and generation run declares a **kind**, and the kind — not the run —
decides the output's structure and scope, so generated output is deterministic
in shape while only content varies:

| Kind                  | vwf axis               | Shape                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `language-bundle`     | project (+ repo facts) | the composition rooted at a `language` component — a **12-topic bar** behind a lean router skill → on-demand references, plus paths-scoped doctrine per config file the toolchain owns (archetype: the `language/typescript` bundle)                                                                                                                                                                                      |
| `database`            | backing                | a **6-topic bar** on the instance component — pick & trade, data-model constraints, clause-by-clause satisfaction of the neutral datastore contract *by citation*, connection & access incl. credentials, cost shape, the Docker-composed `local_stack`                                                                                                                                                                   |
| `capability-provider` | backing                | the same two halves as `database` — the neutral capability contract plus one provider component that realizes it, citing rather than restating                                                                                                                                                                                                                                                                            |
| `cloud-provider`      | backing + deploy       | **4 provider topics** (cost, IAM, local-dev map, networking & private plane) + **5 per `cloud-service` component**, plus artifact/pipeline/health where the service's category is `compute` (archetype: the `cloud-provider/gcp` bundle)                                                                                                                                                                                  |
| `repo-gate`           | repo                   | the `toolchain-gate` components that run over the whole repo, composed together. A **language-specific** linter or formatter appearing here is a gap — it belongs to that language's bundle                                                                                                                                                                                                                               |
| `toolchain-manager`   | repo                   | **exactly one component, standing alone** — the thing that pins the repo's tools, holds the environment values they read, and runs its tasks. A **5-topic bar** behind a router skill: the config split, environment values, the task-library contract, the mandatory task set, and bootstrap/CI parity. A polyglot repo materializes it **once**                                                                         |
| `workspace`           | repo                   | the `package-manager` component that installs and locks the repo's members, plus a `build-orchestrator` where there is one — a **5-topic bar**, no router. The only repo-axis kind you **pick**: it is what `repo.stack.template` selects from. A single-package repo pins none, which is the kind's edge rather than a gap                                                                                               |
| `ci-system`           | cicd                   | the **release-trigger contract** + **exactly one** `ci-system` component, a **6-topic bar** behind a router skill with one reference per system. Three layers, none duplicated: vwf's delivery-pipeline rules say what a deploy must guarantee, the contract is the recommended mechanism above any one system, the component is how that system spells it. A second CI system in one bundle is a gap, not extra coverage |
| `app-framework`       | project                | rooted at the SDK that owns the manifest and build, carrying its languages as members with a `role` — one `primary`, any number of `platform-edge` (archetype: the `app-framework/flutter` bundle)                                                                                                                                                                                                                        |
| `deploy-target`       | deploy                 | **one component, standing alone** — the only bundle with no second half. A **6-topic bar** covering pick & trade, the artifact, hygiene, promotion, config/secrets and health. Its discipline is a scope fence: the pipeline, the cloud and the local stack each belong to a kind that already owns them                                                                                                                  |
| `design-tool`         | design                 | one component, standing alone — a **5-topic bar** on the three imports, reach & credentials, and the naming contract. Lands three skills at **fixed names** in the repo's `.claude/`, all mandatorily model-invocable, because a user-only one is invisible to vwf rather than a smaller feature                                                                                                                          |

Every kind in that table is defined; no reservations are outstanding. Two of the
six axes — `design` and `cicd` — are **tool axes**, where the bundle slug is the
token the project config already holds, so picking from the menu and writing the
config key are one act. Kinds compose through vwf's capability vocabulary — a
language bundle says "the datastore", never a database by name — so each stays
independently re-syncable.

Each kind's structure **is a topic bar**: a closed list of topics the output
must cover, one artifact per topic, lazy-loaded — a reference behind a lean
router skill, or a paths-scoped doctrine skill on the config file it governs. A
conditional topic the detected stack makes inapplicable is stated `n/a` with
why, never silently skipped. **No artifact carries a line cap.** A skill puts
only its description in context — its body loads on activation, a reference only
when something reads it — so length is not what costs; loading is, and lazy
hanging already pays that bill. A cap would only cap depth, pressuring research
to stop early. An artifact that has outgrown one sitting is decomposed into a
router skill plus on-demand references, never trimmed.

The **composition** covers the bar, whichever components supply each topic: the
language component owns standards, errors, async, testing, build and
config/observability wiring; the package-manager component owns the manifest and
workspace/supply-chain topics; toolchain-gate components own the compiler config
and lint/format gates; and each framework component supplies one usage reference
of its own.

The **framework ruling**: generation is selection-neutral and usage-opinionated
— it never opines on *which* framework (the pin and the packs own selection),
and every usage opinion traces to a source in precedence order: the repo's own
**detected** settled pattern, then the framework's **documented recommendation**
(cited), then a **catalog entry** instantiated (cited). A genuinely split
ecosystem choice with no detection signal is presented as an **open decision**
with real options — never fake consensus. Dependencies get no reference — a line
in manifest doctrine at most; frameworks are written against, dependencies are
looked up at use time.

## The output — `.claude/` first, and three targets beside it

The output vocabulary is **closed**: skills, agents, hooks (config + scripts),
and rules, all landing in the repo's own `.claude/` tree. Three things cannot be
`.claude/` files, and each is a separate target with its own consent line rather
than something that rides the landing:

- **An MCP server** goes into the project's own `.mcp.json`. It is genuinely a
  project file — collaborators should get it — and the alternative, a curated
  registry of servers, fails on scaling before it fails on charter: a list holds
  only what someone curated, and stackgen exists for the tail nobody did.
- **A language server** cannot be expressed by any project file at all —
  `lspServers` is a plugin-manifest feature — so the one way to provide one is
  to *be* a plugin. stackgen writes a small local plugin at the fixed path
  `~/.claude/plugins/local/stackgen-lsp/`, holding the union of what every repo
  you have materialized from contributed, and **prints the two registration
  commands rather than running them**.
- **A repo's own config files** belong to the repo, not to `.claude/`. A pack
  that owns some — the toolchain manager owns `.config/mise.toml` and the task
  library under `.config/mise/tasks/` — declares them in a `config/` tree
  mirroring the repo root, and they land there. Mode is preserved, because a
  task file arriving without its exec bit fails as an *unknown task* rather than
  as a permission error.

The need still travels as `language_facts` in the template payload for
`/vwf:doctor` to verify; the local plugin is what actually provides the server.
Its scope is `user`, so **your collaborators get none of it** — a teammate's
language server is their machine's business, the same line your editor already
draws, and what user scope buys is one registration serving every repo instead
of a per-repo obligation nobody maintains. What makes that safe is the
`extensionToLanguage` map every generated declaration must carry: a repo with no
matching files never starts the server, and a declaration without a map is
forbidden outright.

```text
.claude/
├── skills/  agents/  hooks/  rules/   # the artifacts, auto-discovered
└── stackgen/                          # bookkeeping, not discovered
    ├── lock.yaml                      # one entry per path, per component
    ├── templates/<slug>.md            # payload (incl. components:) + prose
    └── citations/<component>.yaml     # sources per component, keyed by topic
```

**Repo-owned means:** committed, editable by the project, and working for every
collaborator with no plugin installed. **Three consent tiers** guard a landing:

1. The `.claude/` file set is a dry-run plan you approve — every path listed,
   nothing written unapproved.
2. **`.claude/settings.json`, `.mcp.json` and a pack's `config/` tree are never
   written without your explicit, separate consent**, each as its own line in
   the gate. A hook script can land while its wiring is declined (it stays
   inert, and the plan says so); a declined MCP wiring leaves the skills landed
   and says the tool will be unreachable; a declined config write leaves the
   skills landed and says the tasks will be absent.
3. **The local plugin gets a larger gate still** — writing outside the repo and
   registering with a user-scoped tool is a bigger act than editing a project
   file — split into two separately declinable items: the manifest write, and
   the registration. Declining the registration leaves a valid plugin directory
   nobody has installed, and prints the two commands for later.

Every target **merges, never owns**: the keys stackgen added are recorded in the
lockfile, so sync and removal touch only those, and removal of the local plugin
is **by subtraction** — another repo's contributions to the union stay, and the
directory and its registration go only when the last key does. Hook *scripts*
come only from curated packs; generation never emits an executable.

**A pack may still need repo files the materializer will not write.** The
`config/` tree is what a pack *owns*, and the fence around it is deliberate:
nothing writes `dprint.json`, `.config/pre-commit-config.yaml`, `package.json`
or a CI workflow — a gate pack **names** its config file as a prerequisite the
repo still owns. So a pack whose correctness depends on a repo-wide edit it does
not own — a scanner allowlist, a `.gitignore` block, a pre-commit entry, a
mining exclude — carries that edit as a literal block in the reference that owns
it, and ships a gate that fails the first commit naming whichever block is
missing. `capability-provider/fnox` is the first: three of the four conditions
the secrets contract's encrypt-into-git allowance sets sit outside the boundary,
and its `fnox-ciphertext-guard.sh` is the first hook script any pack ships.

The **lockfile** is the ownership boundary: `.claude/` also holds your own
hand-written skills, so sync diffs only what the lockfile lists — anything else
is invisible to every stackgen write path. Each entry carries the component and
source it came from (`pack/<type>/<slug>@<version>` or `generated`), which is
the grain sync acts at — one framework's bump never churns the language
component beside it. **CLAUDE.md is vwf's domain**: stackgen never edits it, and
ends a materialization by recommending `/vwf:setup`.

`templates/<slug>.md` is what makes later fetches pure reads: frontmatter
carries every payload field (kind, axis, the `components:` refs this bundle
composes — `<type>/<slug>@<version>` or `@generated` — languages **with the
facts `/vwf:doctor` verifies** — LSP provision, mise tool, manifest — plus
harness tasks and mechanisms, with `frameworks`/`capabilities` derived from the
composition), and the body is the `conventions:` prose `plan` sizes against and
`execute` writes to. That emitted-facts block is the **materialized escape** in
vwf's stack vocabulary: a language no curated plugin claims is still *known*
when its pin carries these facts.

In a multi-repo product the target repo defaults to the current one; name a
member repo to materialize there instead. Each repo gets independent copies and
its own lockfile.

## The repo baseline — mise and the gates

Two bundles are **unconditional**: `stackgen-stack-menu` leaves them out of the
payload it returns, and `/vwf:setup` fetches them by their fixed slugs, `mise`
and `repo-gates`. Nothing is recorded in `.config/vwf.yaml` for either — nothing
was chosen, so there is no choice to record — and the landing goes in
`lock.yaml` like any other materialization.

They are unconditional because a repo that has picked no stack yet still needs a
formatter, a secret scanner, a vulnerability scanner, and a way to run them by
name. Left to the menu, "no stack chosen" and "this repo has no gates" would be
the same state and nothing would tell them apart. Neither bundle needs a project
axis or any stack knowledge, so both materialize onto a blank repo.

**`repo-gates`** composes the four gates that run over the whole repository:
**dprint** as the single formatter, **gitleaks** the secret scanner, **grype**
the dependency vulnerability scanner, and **pre-commit** the local gate that
runs them. Nothing there is language-specific — ESLint is JS/TS-only, so it is a
topic of the TypeScript language bundle rather than a repo gate. Getting that
backwards is how a polyglot repo ends up with three secret scanners, one per
language.

**`mise`** is the toolchain manager, and the rest of this section is its
subject: how the toolchain is pinned, where env values live, and the task
library everything else runs through. It lands as a `config/` tree — the config
files and the task library itself — plus a paths-scoped doctrine skill.

### The three-file split

mise config lives under `.config/`, where mise resolves `MISE_ENV` variants. A
repo built or deployed through CI/CD splits its config across three files. mise
loads `mise.toml` first, then deep-merges the active `MISE_ENV` variant on top,
so each variant holds only deltas — never a copy of the base. Never duplicate a
tool or setting across files; put it in the lowest layer that needs it.

| File            | Loads when         | Holds                                                                         |
| --------------- | ------------------ | ----------------------------------------------------------------------------- |
| `mise.toml`     | always (every env) | shared `[settings]`, runtime `[tools]`, common `[env]`, `[tasks.init]`        |
| `mise.dev.toml` | `MISE_ENV=dev`     | dev-only tooling, shell aliases, local/dev env values                         |
| `mise.ci.toml`  | `MISE_ENV=ci`      | CI/production-only settings + tools, the node-gpg workaround, prod env values |

Selecting the environment:

- **Developers** export `MISE_ENV=dev` in their shell, so the dev toolchain and
  local env values load automatically.
- **CI/CD pipelines and production runtimes** set `MISE_ENV=ci`, so the CI/prod
  overrides apply.
- With `MISE_ENV` unset, only `mise.toml` loads — the minimal, portable base.

A repo with no CI/CD and no deploy target needs only `mise.toml`. Add the
variants when a pipeline or deployed environment appears.

`mise.toml` carries the language **runtime only** in `[tools]`. Formatters,
linters, security scanners, and other dev tooling belong in `mise.dev.toml`, so
a fresh checkout or a CI build does not pull them. `[tasks.init]` is the
exception that lives in the base: file-based tasks must be executable under
`MISE_ENV=ci` too.

`mise.dev.toml` holds the **local values** of runtime env vars (verbose logging,
local hosts, test credentials). `mise.ci.toml` carries the **production values**
of those same keys. Dev and prod differ only in value, not in variable name.

### CI node-gpg workaround

For any **Node** project, `mise.ci.toml` must set:

```toml
[settings]
node.gpg_verify = false
```

CI runs on Linux, where mise's bundled Node release-key gpg import can fail with
"no valid OpenPGP data found". This disables **only** Node's signature check —
the tarball is still SHA256-verified. Keep the general `gpg_verify = true` in
`mise.toml` intact.

### The task library

Once tasks grow past one-liners, drive everything through executable task files
under `.config/mise/tasks/`. mise turns nested directories into colon-separated
names: `.config/mise/tasks/code/format` becomes `mise run code:format`. List
them with `mise tasks`. Reserve `[tasks.*]` toml entries for trivial run-strings
and `depends` aggregations.

Every repo ships the same mandatory set. The contract — helpers,
`#MISE`/`#USAGE` headers, flags — is identical across stacks; only the commands
inside `code/*` and `setup/*` change with the tech stack.

- **`code/*` — quality gates.** `code/format`, `code/lint`, `code/sec`,
  `code/precommit`, `code/git-config`, `code/worktrees`, and the `code/all`
  aggregator (`format` → `lint` → `sec`). `code:all` is the one-command gate;
  `precommit` and `git-config` are wired into the pre-commit hooks and `setup`,
  not into `code:all`. A stack's `code:sec` fill typically needs scanners from
  `mise.dev.toml` — run it under the dev toolchain (`MISE_ENV=dev`).
- **`setup/*` — bootstrap & upgrade.** `setup:all` is the entrypoint — run it on
  clone and to re-sync. It calls `setup:mise`, `setup:secrets`,
  `setup:deps:all`, `setup:external:update` (only if that exists),
  `setup:precommit` and `setup:ai` in order, and stays idempotent. `--clean`
  wipes deps and caches first; `--all` recurses into every git submodule. Alias
  it as `setup` (and `setup-all` where there are submodules).
- **`setup/deps/*` — the package manager, and only that.** `install` (the one
  required slot — install from the lockfile) plus whichever of `upgrade`,
  `outdated`, `audit` and `cleanup` that manager actually has; `setup:deps:all`
  runs `install` and probes for the rest. **The task path carries no tool name**
  — `setup:pnpm:*`, `setup:uv:*` and `setup:app:*` are gone, so the contract
  reads the same on every stack.
- **`setup/external/*` — services, and optional.** Emulators, containers, local
  queues, under `update` / `pull` / `check` / `start` / `stop` / `restart`. A
  repo that runs against none has **no such folder** — not a placeholder, just
  absent — and `setup:all` probes by name so that absence is silent. Only
  `update` is wired into setup: it pulls and builds, and starts nothing.
- **`worktree/init`.** The lighter sibling of `setup:all` for a fresh worktree —
  submodules, mise, `setup:deps:install`. vwf's git-workflow probes for it by
  name before falling back to `setup:all`.
- **Four tasks ship as slots.** `code/lint`, `code/sec`, `setup/secrets` and
  `setup/deps/install` carry a `#PLACEHOLDER` marker: the task name is the
  contract, the mechanism comes from whichever stack the repo pins. Running one
  prints every unconfigured task in the repo and **exits 0**, so `code:all` and
  `setup:all` work end to end before any stack is chosen. `code/format` is the
  exception that has a real default — dprint over the repo's markdown — because
  every repo has markdown from the first commit.
- **`_scripts/helpers`.** The `_scripts/` directory is underscore-prefixed, so
  mise treats it as **not a task**. It holds the shared shell library (colors
  plus `print_header` / `print_warn` / `print_error` / `line_sep`) that every
  task sources as its first real line for uniform output.
- **`[tasks.init]`.** A toml task in `mise.toml` that chmods every file under
  `.config/mise/tasks/` executable. It lives in the base so tasks run in every
  env, CI included; `setup:all` and others declare `#MISE depends=["init"]`.

**Who fills the slots.** The `mise` pack ships the common contract — the
`code/*` gates, `worktree/init`, `setup/*` and the helpers — and every other
pack with a `config/` tree fills in its own half on top: `package-manager/pnpm`
and `package-manager/uv` supply `setup/deps/*`, `toolchain-gate/ruff` and
`app-framework/flutter` supply the `code/format` and `code/lint` their toolchain
needs. Composition runs `toolchain-manager` first, then
`package-manager`/`language`, then `app-framework`, so a later component's file
wins and the lockfile records per file which component supplied it.

## Skills and the agent

| Name                      | Kind                     | Does                                                                                                                                                                                                                                                    |
| ------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stackgen-stack-menu`     | adapter, model-invocable | The packs + the one open `generate` entry, as a vwf menu payload. Answers the same in every product                                                                                                                                                     |
| `stackgen-stack-template` | adapter, model-invocable | The dispatch: materialized entry → pure read; a first pin resolves the bundle's composition and dispatches **per component** — packs copied, uncovered components generated — landing once behind one consent gate. Unknown slug → error, never a guess |
| `stackgen-sync`           | user-only                | The explicit re-sync, **per component**: lockfile-anchored diff against current component packs, regeneration offered per generated component, the delta presented for consent. Repo edits never overwritten by default                                 |
| `stackgen-skill-reviewer` | subagent                 | The stateless trust gate on generation: catalog fidelity, the **when-not-to-apply** checks, citations that resolve and support, honest emitted facts, **kind conformance**, and **topic-bar coverage** against the composition                          |

## Trust: how a generated skill earns its place

A generated artifact is only as good as its checks, so every one passes four
before it lands:

1. **The catalog.** Each judgment instantiates a principles-catalog entry (vwf's
   `assets/principles/`) and cites it — including the entry's *when not to apply
   it* section, so the skill yields where the stack's own idiom already covers
   the ground. The catalog is passed in by vwf; stackgen never reaches into
   another plugin's files.
2. **The citations.** Each technology claim cites current documentation fetched
   through Context7 during the run — the primary research channel, one pass per
   bar topic minimum — recorded durably under `.claude/stackgen/citations/`, one
   file per component keyed per topic. Supplementary sources are allowed only
   where that topic's Context7 coverage is thin, and both the supplement and the
   thinness are disclosed.
3. **Artifact validity.** Separately from what it covers, every artifact has to
   *work*: strict-YAML frontmatter (a rejected skill is dropped with no error),
   the invocation state its kind rules (a user-only skill is invisible to a
   delegating caller, silently), a **fixed** skill name rather than one
   assembled from configuration, and the hook verdict shape its event requires.
   These are host rules rather than stack rules, they live in
   `assets/artifact-doctrine.md`, and every one of them fails **silently at run
   time** — which is why they are gated here and nowhere downstream.
4. **The reviewer + you.** The `stackgen-skill-reviewer` agent returns `NO GAPS`
   or a numbered list — checking the kind's **topic-bar coverage**, artifact
   validity and the content — and generation loops under a convergence guard of
   **four rounds**, after which residuals are reported rather than looped
   forever or landed quietly; then the materializer shows the full landing set
   as a dry-run plan and writes nothing without your approval.

## Caveats

- **Generation needs Context7 and the catalog.** Missing either is a halt with
  its name, not a degraded run.
- **Drift is a feature with a viewport.** Your repo's copies may diverge from an
  upgraded pack by design; `/stackgen:stackgen-sync` is where the divergence
  becomes a diff you decide about.
- **Repo config is a fenced target, not a free one.** A pack writes only the
  config files its own component owns. Gate configs, the package manifest and CI
  workflows are named as prerequisites and left to you — deliberately, because
  each file the tier absorbs makes the argument for the next one easier.
