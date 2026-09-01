# Plan: dissolving `devtools` into `stackgen`

**Status: approved 2026-09-01, not started.** Every design decision below is
settled. Execution runs **end to end** and stops only for the four gates named
in §I — never to re-ask something this document already answers.

This retires `devtools` as a plugin and lands everything it ships inside
`stackgen`, taking the marketplace from **3 plugins to 2** (`vwf`, `stackgen`)
and closing the north star recorded in the `stackgen-direction-agreed` memory.

The framing that produced it: devtools mixes two layers that were never
separated. **Layer 1** — some of its tools are mandatory whatever the stack
(`mise`, `dprint`), others are meaningful only for one toolchain (`eslint`).
**Layer 2** — even the mandatory ones are *configured* by the stack: which tools
mise installs, which formatter plugins dprint loads, which linter `code:lint`
runs. Layer 1 is already modelled correctly inside stackgen and duplicated in
devtools; layer 2 has no mechanism anywhere.

**The binding constraint is that nothing may be lost.** Every item in section A
has a named destination, and the three items with no destination today — `mise`,
the task library, and the python overlay — are what sections B, C and F exist to
build.

---

## A. What devtools ships, and where each piece goes

Measured against the working tree on 2026-09-01. `devtools` is 7 skills, 2
references, 34 task files and one manifest edge.

| Item                       | Lines | Destination                                            | Work                         |
| -------------------------- | ----- | ------------------------------------------------------ | ---------------------------- |
| `skills/dprint`            | 90    | `toolchain-gate/dprint` (exists)                       | delete; add one seam line    |
| `skills/grype`             | 80    | `toolchain-gate/grype` (exists)                        | delete                       |
| `skills/pre-commit`        | 87    | `toolchain-gate/pre-commit` (exists)                   | delete                       |
| `skills/gitleaks`          | 75    | `toolchain-gate/gitleaks` (exists)                     | delete                       |
| `skills/eslint`            | 77    | `toolchain-gate/eslint` (exists)                       | **merge, then delete**       |
| `skills/mise` + 2 refs     | 428   | `toolchain-manager/mise` (**new**)                     | new type, new kind, new pack |
| `skills/scaffold`          | 120   | `toolchain-manager/mise` payload                       | becomes materialization      |
| `assets/tasks/common` (17) | —     | `toolchain-manager/mise` payload                       | charter change (§C)          |
| `assets/tasks/node` (6)    | —     | `package-manager/pnpm` (exists)                        | move                         |
| `assets/tasks/flutter` (5) | —     | `app-framework/flutter` (exists)                       | move                         |
| `assets/tasks/python` (6)  | —     | `package-manager/uv` + `toolchain-gate/ruff` (**new**) | author both (§F)             |
| vwf's `dependencies` entry | —     | deleted                                                | manifest + docs              |

### Four of the five gates are already byte-identical duplicates

`dprint`, `grype` and `pre-commit` are **identical** between
`plugins/devtools/skills/<n>/SKILL.md` and
`plugins/stackgen/stacks/toolchain-gate/<n>/skills/<n>/SKILL.md`. `gitleaks`
differs by 8 lines and the **pack copy is the newer one** — it cites
`assets/contracts/secrets.md` and carries the encrypt-into-git allowlist rule
that devtools' copy predates. For all four, deletion loses nothing and there is
nothing to merge.

### `eslint` is the one real merge

The two files share a name and nothing else. devtools' is generic ESLint
judgment; the pack's is a how-to for the bundled house linter.

| Section                                   | devtools | pack |
| ----------------------------------------- | -------- | ---- |
| Flat config only                          | yes      | no   |
| Scope an override; never disable globally | yes      | no   |
| Where this stops                          | yes      | no   |
| Running it / Customizing / Remedies       | no       | yes  |

The three devtools-only sections and its `**/.config/linter.yaml` path entry
merge into the pack's skill before devtools' copy is deleted. This is the only
place in the plan where deleting first would lose judgment.

### Layer 1 was already correct in stackgen, and unreachable

`assets/taxonomy.md` already splits `toolchain-gate` components two ways: gates
that run over any repo compose into the `repo-gate` kind; a gate meaningful for
one toolchain is topic 10 of *that language's* bundle. That is exactly the
mandatory-vs-conditional cut, and `eslint`, `tsconfig` and `analysis-options`
already sit on the conditional side.

But **no bundle names the four repo gates as components.** The three repo-axis
bundles (`pnpm-workspace`, `pnpm-turbo`, `bun`) name only package managers, and
all three declare `kind: language-bundle` — the same placeholder mistake the
deploy bundles carried until Wave D. So the `repo-gate` kind is defined, its
four packs are authored, and nothing can materialize any of them. This is the
`ci-system` failure repeating: not an error, invisible. §D closes it.

---

## B. The taxonomy extension — `toolchain-manager`

No existing component type fits mise, and stretching one would break a closed
bar:

- **`toolchain-gate`** is "a repo-level gate: formatter, linter, secret scanner,
  vulnerability scanner, hook runner". mise gates nothing — it *runs* the gates
  — and `repo-gate`'s topic bar is closed at those five topics.
- **`build-orchestrator`** is the closest in spirit but is the turbo shape:
  "orchestration across a workspace's packages: caching, dependency-ordered
  runs". mise is a flat task namespace plus tool pinning plus env, and in this
  toolkit turbo runs *under* mise.
- **`package-manager`** installs and locks a language's dependencies. mise
  installs tools, not dependencies.

So: a new **type** and a new **kind**, both named `toolchain-manager`. Naming
them the same is the established pattern — `cloud-provider`,
`capability-provider`, `ci-system`, `deploy-target` and `design-tool` are each
both a type and a kind. Both edits are sanctioned moves: `taxonomy.md` states
the type list "is extended deliberately — a new type or category is an edit to
this file, reviewed like any contract change", and `kinds.md`'s reserved-kinds
section says to define a kind at the wave that needs it. Nothing reserved this
one, which is the same hole `repo-gate` had to be defined from scratch to fill.

**Scope of the type: all three of mise's jobs.** It pins tools, holds
environment values, and runs tasks. Alternatives split differently — asdf and
proto pin only, just and make run only, direnv holds env only — so the type has
to be wide enough for a combiner and a splitter both. A component covering only
one job records the other topics `n/a`, per the kind bar's existing "a topic the
repo has no surface for is recorded `n/a`, never silently absent" rule.

### The topic bar

Five topics, derived from devtools' `mise` skill and its two references so that
nothing in 428 lines is orphaned:

1. **Tool pinning & the config split** — which layer holds which tool, and the
   rule that nothing is duplicated across layers. *(from SKILL.md's three-file
   `MISE_ENV` split and its runtime-vs-dev-vs-ci placement rules)*
2. **Environment values** — variable names shared across layers, values split by
   layer, dev and prod overriding the same names. *(SKILL.md's env split)*
3. **The task library contract** — file-based tasks, the directory-to-name
   mapping, the `#MISE`/`#USAGE` headers, the shared helpers library, and the
   slot discipline with its `#PLACEHOLDER` marker.
   *(references/task-library.md)*
4. **The mandatory task set** — the `code/*` and `setup/*` names every repo
   ships, which is the vocabulary vwf invokes.
5. **Bootstrap & CI parity** — how the same tasks run in the pipeline, how the
   environment is selected, worktree init, and per-runtime workarounds such as
   Node's `gpg_verify` in CI. *(SKILL.md + references/config-files.md)*

**The seam with `repo-gate` topic 5**, which must be stated in both files or the
two will drift: `repo-gate` topic 5 asserts that *each gate is reachable as one
task name and CI runs the same names*. `toolchain-manager` topic 4 owns *what
the task library is and what the names are*. A gate says "I am reachable at
`code:sec`"; the manager ships `code/sec` and the contract it follows.

- **Axis**: `repo`.
- **Structure**: a router skill plus on-demand references, per the kind-general
  rule. devtools' shape — one SKILL plus two references — already matches.
- **Invocation**: paths-scoped to the mise config and task tree, not
  user-invocable, matching how the curated skill ships.
- **Facts & harness**: `harness: n/a`. What it contributes is the `repo`-axis
  fact that the task names exist at all.

### That "pickable" is partly theatre, and that is fine

vwf hardcodes `mise run` in `git-workflow`, `execute-coder` and `doctor`, and
doctor carries a **blocking** missing-mise finding. So the type ships exactly
one pack and vwf keeps naming mise. `ci-system` is the precedent — one kind, one
pack, "exactly one CI system per repo, so this bundle never composes two."
Moving vwf's invocations behind the task-name contract so `just` could answer is
a separate and much larger change; it is named in §J, not done here.

This is permitted by the checker: `mise` is not in `TOOL_TOKENS`, and neither
are `dprint`, `gitleaks`, `grype`, `eslint` or `pre-commit`. The technology-free
guard bans *product-stack* technologies (`firebase`, `hono`, `pnpm`, `postgres`,
`docker`) and deliberately does not ban the developer's harness. That line —
product stack versus developer harness — is the one this plan follows, and it is
already written into the guard.

---

## C. The charter change — repo config payloads

stackgen writes `.claude/`, `.mcp.json`, and the generated local LSP plugin. The
mise config and the task library are none of those, so `assets/output-tree.md`
gains a **fourth target**: repo config files a pack declares.

```text
stacks/<type>/<slug>/
└── config/              # NEW — tree mirrors the repo root
```

`config/.config/mise/tasks/code/format` lands at
`<repo>/.config/mise/tasks/code/format`, the same way `skills/` mirrors
`.claude/skills/`. The mise pack's `config/` holds the three mise files and the
17 `common/` task files.

Rules, each mirroring one the charter already has:

- **Merges, never owns.** Only the paths this repo's lockfile recorded are
  touched by sync or removal.
- **Recorded in `lock.yaml`** per file, with the component that supplied it —
  which is what makes §E's precedence auditable.
- **Its own consent line**, the same tier `.claude/settings.json` and
  `.mcp.json` get. A declined config write leaves the skills landed and says the
  tasks will be absent — never a silent partial landing.
- **Mode is preserved.** `.config/mise/tasks/**` must land executable (755) or
  `mise run <task>` fails in a way that reads as a missing task. Assert this in
  the checker; this repo has a history of executable bits being invisible to
  gates.

**Precedent, and its limit.** The `fnox` and `pnpm` packs already ship hook
scripts copied into a target repo, so packs already write outside `.claude/`.
This generalizes that from `hooks/` to a declared tree. It is the same move
`.mcp.json` got at Wave D, and the reasoning is the same: the alternative is
that the one thing which writes a repo's config lives in a plugin that exists
for no other reason.

**Deliberately not extended to gate configs.** Nothing today writes
`dprint.json` or `.config/pre-commit-config.yaml` — devtools' scaffold only
writes `.config/mise/**` and *names* the others as prerequisites the repo still
needs. Having gate packs own their config files would be new capability, not
preserved capability, and it is a separate call. §J.

---

## D. The repo baseline — how mise and the four gates reach every repo

The functionality most at risk in this whole move is **unconditional
availability**. devtools is installed at user scope beside vwf, so its seven
skills apply in every repo the moment you touch a matching file, with no stack
picked and no materialization run. A pack only reaches a repo when someone picks
a bundle. Left unaddressed, dissolution would mean a repo that has picked no
stack gets no formatter, scanner or hook doctrine at all — including this repo,
whose `.claude/skills/` holds no materialized gates and which is
dprint-formatted today purely because devtools is installed.

So mise and the four gates are **not a menu pick**. There is exactly one pack
per slot, and a one-entry menu is theatre.

Two reserved bundles, because a bundle declares one `kind` and these are two:

```yaml
# stacks/bundles/repo-gates.md
axis: repo
kind: repo-gate
unconditional: true
components:
  - toolchain-gate/dprint@0.1.0
  - toolchain-gate/gitleaks@0.1.0
  - toolchain-gate/grype@0.1.0
  - toolchain-gate/pre-commit@0.1.0
```

```yaml
# stacks/bundles/mise.md
axis: repo
kind: toolchain-manager
unconditional: true
components:
  - toolchain-manager/mise@0.1.0
```

`unconditional: true` is a new frontmatter key with two readers:
`stackgen-stack-menu` excludes such a bundle from the payload it returns (it
currently treats every file in `stacks/bundles/` as one menu entry), and
`/vwf:setup` fetches both by **fixed slug**. Fixed, never constructed — a name
assembled from configuration is one that can silently resolve to nothing, which
is the rule the `ux-gate` and design-adapter seams already follow.

**This works at setup time, which is the constraint that put scaffold in
devtools in the first place.** Two facts make it fit: `.config/vwf.yaml`'s
`repo` axis is elicited by **`setup`** per `assets/vwf-config.md`'s writer
table, and `stackgen-stack-menu` is already "invoked by `/vwf:architecture`
**and `/vwf:setup`**". A repo-axis bundle needs no project axis and no stack
knowledge, so it can be materialized on a blank repo — exactly what
`/devtools:scaffold` does today.

`repo.stack.template` is unchanged. It stays the elicited workspace and
package-manager pin it is today; the two unconditional bundles are recorded in
`lock.yaml` rather than in `.config/vwf.yaml`, because nothing was chosen and
there is no choice to record.

---

## E. The layer-2 seam — the task overlays

This is the mechanism the whole exercise was missing. Reading the overlays,
`code/format` in **every** one of them is dprint *plus* the language's own
formatter:

| Overlay   | `code/format` runs                        |
| --------- | ----------------------------------------- |
| `node`    | dprint, then `pnpm dlx sort-package-json` |
| `flutter` | dprint, then `dart format`                |
| `python`  | dprint, then `uv run ruff format`         |

So one task file is co-authored by the repo gate and the language. That is layer
2 showing up in the task file rather than only in the config.

**The seam is ownership-plus-contract, not fragment composition.** The language
or package-manager component **owns** `code/format` and `code/lint` wholesale;
the `dprint` pack's doctrine gains one line stating that the repo formatter runs
first in `code:format`. Assembling the file from contributed fragments would be
cleaner but invents a templating layer stackgen deliberately does not have — its
dispatch is copy-verbatim or generate, with nothing in between. The dprint block
is already duplicated three times today, so this preserves the status quo rather
than adding duplication.

**Precedence, since two packs now write into `.config/mise/tasks/`:** the
composition order is `toolchain-manager`, then `package-manager` / `language`,
then `app-framework`; a later component's file wins. That is exactly what
scaffold does today with `cp -R common/.` followed by `cp -R $STACK/.`, made
explicit and recorded per file in the lockfile.

`common/` (17 files) needs no stack knowledge and rides with the mise pack. It
is already built for this: `code/lint`, `code/sec`, `setup/secrets` and
`setup/deps/install` ship as **slots** carrying a `#PLACEHOLDER` marker that
prints what is unconfigured and exits 0, so `code:all` and `setup:all` run end
to end in a repo that has chosen nothing. The slot contract is what makes an
unconditional baseline honest rather than half-broken, and it already exists.

---

## F. python — the one orphan

`assets/tasks/python/` calls `ruff` and `uv`, and stackgen has neither a
`language/python` nor a `package-manager/uv`. Two new packs, split along the
line `eslint` already established:

- **`package-manager/uv`** — the 4 `setup/deps/*` tasks (`install` is
  `uv sync --all-extras`; plus `upgrade`, `outdated`, `cleanup`).
- **`toolchain-gate/ruff`**, `kind: language-bundle` — `code/lint` and
  `code/format`, as topic 10 of a python bundle. This is the same placement
  `eslint` has and for the same reason: a linter meaningful for exactly one
  toolchain is that language's, not the repo's.

Both are thin: the task payload plus a conventions file, no research-backed
topic bar, because neither is a language component.

**Stated plainly: they are authored but not yet reachable.** There is no
`language/python` component and no python bundle for them to compose into, so
nothing can materialize them until one exists. That is the same status the four
repo gates have had since Wave A, and §D fixes it only for the gates. The
alternative — authoring a full python language bundle against a 12-topic bar
with per-topic Context7 research — is a wave on its own. Recorded in §J and in
`docs/memory/gaps/`, so it is not rediscovered as a bug.

---

## G. What retirement breaks

The checker has **no** devtools coupling — `plugins:check` names neither the
plugin nor any of its skills — so nothing gates this mechanically. That cuts
both ways: per the `checker-cannot-see-empty-plugins` memory, no rule asserts a
plugin ships anything, so every item below must be verified by hand.

**vwf, which invokes devtools by name in two places.** Both are the silent
failure shape:

| File                                             | Line | Change                                              |
| ------------------------------------------------ | ---- | --------------------------------------------------- |
| `skills/setup/references/onboard-pipeline.md`    | 24   | fetch the two unconditional bundles                 |
| `skills/setup/SKILL.md`                          | 55   | same, in the hard rule                              |
| `skills/doctor/references/stack-checks.md`       | 208  | remedy no longer names `devtools:scaffold`          |
| `skills/doctor/references/harness-and-memory.md` | 56   | "the `devtools` plugin already ships that doctrine" |
| `assets/memory.md`                               | 228  | same phrase                                         |
| `.claude-plugin/plugin.json`                     | 29   | drop the `devtools` dependency                      |

The tooling step's **defer rather than halt** discipline in
`onboard-pipeline.md` is unchanged and now covers more: a declined config-write
consent is a deferral with a named unlock, exactly like a missing stack pin.

**The repo's own docs**, which the CLAUDE.md docs-ship-with-the-change rule
makes non-optional: `CLAUDE.md` (the plugin table, the tasks list, the
dependency prose), `.claude/docs/plugins.md`, `.claude/docs/repo-shape.md`,
`.claude/skills/plugin-authoring/references/language-plugins.md` (lines 79 and
111 assign the gates to devtools), `readme.md` (7 mentions), and
`docs/plugins/devtools.md` (14.1 KB, deleted — its content is now stackgen's).

**The installer**, which names devtools in prose and tests only — never as a
special case: `cli/src/install.ts:47`, `cli/src/args.ts:7,12,172`, and the four
test files. `--all` installs `vwf` and lets Claude resolve dependencies, so the
behaviour is unchanged; the fixtures and the help text are not.
`.claude/agents/target-verifier.md:96` asserts the dependency edge and must
assert the new one.

**The marketplace**: `plugins:marketplace` regenerates from the remaining two
manifests. Both bump — `stackgen` minor (0.19.0), `vwf` minor (19.9.1) for the
dependency and setup changes — and each needs its tag before the manifest ref
resolves.

---

## H. This supersedes the 2026-08-29 decision, and answers it

`docs/memory/decisions/2026-08-29-devtools-survives-the-waves.md` decided the
opposite five days before the `stackgen-direction-agreed` correction. Its
reasoning is the strongest case against this plan and is answered rather than
ignored. That doc gets a supersession header pointing here.

**"`mise` is a `/vwf:doctor` blocking mandate; doctrine that explains a halt
belongs next to the halt — moving it into stackgen means finding the explanation
in a plugin they may not have pinned."** Two things changed. `stackgen` is now a
declared vwf dependency alongside devtools, so installing vwf pulls it and "may
not have pinned" is no longer possible. And after §D the doctrine is
materialized into the repo's own committed `.claude/`, so it is present for
every collaborator with no plugin installed at all — strictly better
availability than a plugin-scoped skill, which is the argument's own standard.

**"`scaffold` is a live seam, not doctrine — a skill vwf cannot see fails
silently."** True, and unchanged in kind. vwf already invokes
`stackgen-stack-menu` and `stackgen-stack-template` by fixed name mid-run, and
the stack menu is *empty* without stackgen — the same seam, already
load-bearing, already accepted. The mitigation is the same one those skills
carry: `disable-model-invocation: false`, mandatory, called out in the skill
body.

**"It carries 28 task files, outside stackgen's `.claude/`-only output
vocabulary."** 34 today, and this is §C — the charter change the objection
correctly identified as the blocker. It is the `.mcp.json` move repeated, on the
same reasoning.

**"`scaffold` and `mise` cannot be split — separating them puts a writer and its
spec in different plugins."** They are not split. Both land in
`toolchain-manager/mise`: the skill is the spec, the `config/` tree is what the
writer wrote. They end up in one directory, closer than today, where the spec is
one skill and the writer is another.

**The cost that doc stated plainly is what this plan collects.** "Seven bundles
name mise in prose and **no component supplies it** … that hole is now permanent
by choice." §B supplies it.

---

## I. Executing this — the delegation plan

**The orchestrator must not read this work, only decide it.**
`docs/plugins/devtools.md` is 14.1 KB and `docs/plugins/vwf.md` is 111 KB;
devtools' seven skills plus two references are 857 lines and its task library is
34 files. Reading any of them inline costs the context once and re-costs it
every later turn. Same argument vwf already makes for its own subagents:
delegation is *"a latency and context strategy as much as a quality one."*

Every unit below is one subagent, dispatched with the **Agent** tool. The
orchestrator holds the rulings, the gates and the verification — never the file
contents. **No unit's work is done inline**, including the small ones: a unit
the orchestrator "just does itself" is a unit whose file loads sit in context
for the rest of the run, which is the cost this structure exists to avoid.

### The units

| Id      | Section | Touches                                                                                                                                                                                             | Depends on |
| ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **U1**  | B       | `stackgen/assets/taxonomy.md` — mint the `toolchain-manager` type; `assets/kinds.md` — define the kind, its five-topic bar, and the `repo-gate` topic-5 seam                                        | —          |
| **U2**  | C       | `stackgen/assets/{output-tree,pack-format}.md` — the `config/` payload tier, its four rules and the non-extension fence; plus the checker rule asserting mode 755 on `config/.config/mise/tasks/**` | —          |
| **U3**  | A       | **Audit only, writes nothing** — devtools' 7 skills and 2 references against their destinations; per-section carried / condensed / **ABSENT**                                                       | —          |
| **U4**  | B, C    | The `toolchain-manager/mise` pack — `pack.yaml`, the router skill, its two references, and the `config/` payload (3 mise files + 17 `common/` task files)                                           | U1, U2     |
| **U5**  | D       | `stacks/bundles/{mise,repo-gates}.md`; the `unconditional:` key in `skills/stackgen-stack-menu/`; the `kind:` fix on the three repo-axis bundles                                                    | U1         |
| **U6**  | E       | Move the node overlay into `package-manager/pnpm/config/` and the flutter overlay into `app-framework/flutter/config/`; write the ownership-plus-contract seam into each                            | U2         |
| **U7**  | F       | Author `package-manager/uv` and `toolchain-gate/ruff` carrying the 6 python task files                                                                                                              | U2         |
| **U8**  | A       | Merge devtools' eslint doctrine into `toolchain-gate/eslint`; add the formatter-ordering line to `toolchain-gate/dprint`                                                                            | U3         |
| **U9**  | G       | vwf — the five prose call sites and the `devtools` dependency in the manifest                                                                                                                       | U4, U5     |
| **U10** | G       | Delete `plugins/devtools/`; regenerate the marketplace                                                                                                                                              | U3–U9      |
| **U11** | G       | Doc reconciliation — `CLAUDE.md`, `.claude/docs/`, `readme.md`, `docs/plugins/`, the CLI prose, and the superseded decision doc                                                                     | U10        |

### How each unit is dispatched

One `Agent` call per unit, `subagent_type: "general-purpose"`, `name: "U<n>"`. A
whole wave goes out in **one message with multiple tool uses**, which is what
makes it concurrent rather than sequential.

Two units get a different type: **U11** is `docs-reconciler` — the agent this
repo already has for doc drift — and **U10** additionally invokes
`target-verifier` before returning, since removing a plugin from the marketplace
and changing vwf's dependency edge is exactly the "prove it against the real
`claude` CLI" case that agent exists for.

**No `isolation: "worktree"` per unit.** The units in a wave write to disjoint
directories, so a shared checkout has no file conflicts, and isolating five
would mean merging five trees back by hand. Instead the **orchestrator** creates
one worktree for the whole plan up front via `/vwf:git-workflow`, branched from
`develop`, and every unit works inside it.

### The shared-file rule, which is what makes a wave safe

Five wave-2 units all write inside `plugins/stackgen/`. Disjoint subdirectories
are fine; these are not, and each is reserved:

| File                                           | Why it collides                                             | Owner                     |
| ---------------------------------------------- | ----------------------------------------------------------- | ------------------------- |
| `plugins/*/.claude-plugin/plugin.json`         | several units bumping one `version` is a lost update        | orchestrator, once a wave |
| `.claude-plugin/marketplace.json`              | generated from every manifest; regenerating mid-wave races  | **U10 only**              |
| `stackgen/assets/{taxonomy,kinds}.md`          | U1 writes them; U4–U8 only read them                        | U1, wave 1                |
| `stackgen/assets/{output-tree,pack-format}.md` | U2 writes them; U4, U6, U7 author against them              | U2, wave 1                |
| `scripts/src/check.ts`                         | one new rule, one owner                                     | U2                        |
| `CLAUDE.md`, `readme.md`, `docs/plugins/**`    | eleven units editing one doc is the collision being avoided | **U11 only**              |

So **no unit bumps a version and no unit runs `plugins:marketplace`** (the
generator — `--check` is fine and is required). The orchestrator bumps once per
wave, after the wave's reports are in. That also keeps
`plugins:marketplace --check` green *inside* each unit: with no version moved,
the committed manifest still matches.

**U9 is the one exception, and it is scoped**: it edits
`plugins/vwf/.claude-plugin/plugin.json`'s `dependencies` array **only**, never
its `version`. The orchestrator bumps after wave 3.

### Waves

Each wave is one message. The orchestrator waits for every report in a wave,
runs the wave gate, then dispatches the next.

1. **U1 ‖ U2 ‖ U3.** No shared files; the audit writes nothing, so it cannot
   collide with the two doctrine edits.
2. **U4 ‖ U5 ‖ U6 ‖ U7 ‖ U8.** Five packs and one bundle set, all disjoint
   directories. Every unit here depends only on wave 1.
3. **U9** — vwf, once the destinations U4 and U5 built actually exist to point
   at.
4. **U10** — the only destructive unit, and it runs last on purpose. Nothing is
   deleted until every destination exists and the audit is clean.
5. **U11** — docs, after reality.

**The wave gate**, run by the orchestrator between waves:
`mise run plugins:check`, `mise run plugins:marketplace --check`,
`mise run vitest run`, and every unit's report read for `UNRESOLVED:`. **A wave
with any `UNRESOLVED:` does not advance** — an unresolved finding is a ruling
the orchestrator owes, and carrying it forward is how a wrong assumption gets
built on.

### What every unit gets, and returns

**A unit is stateless and inherits no conversation context.** Everything it
needs is in its prompt, or it will re-derive it — badly and expensively. Each
prompt carries, in this order:

1. **Its ruling, quoted from this plan**, not paraphrased.
2. **Its file scope** as explicit paths, plus the sentence *"touch nothing
   outside this list."*
3. **The facts section A already established**, so no unit re-counts what the
   audit already counted.
4. **The shared-file rule** above — do not bump a version, do not run
   `plugins:marketplace` (the generator), do not edit a doc.
5. **The return contract** below.

U4 additionally gets §B's five-topic bar verbatim, so it does not re-derive the
structure from the source skill. U6 and U7 get §E's ownership-plus-contract
ruling and the precedence order verbatim, so neither invents a
fragment-composition mechanism. U8 gets U3's ABSENT list verbatim, so it does
not re-run the survey.

**Returns:** a terse report — files changed, decisions taken inside the scope,
anything it could not resolve as `UNRESOLVED:`. Never file contents, never a
diff dump.

**Every unit, before returning:**

- `mise run plugins:check` and `mise run plugins:marketplace --check` pass
- `mise run vitest run` passes where it touched `scripts/` or `cli/`
- it reports which docs its change falsified — but **does not edit them**, and
  does not read `CLAUDE.md` or `docs/plugins/vwf.md` to find out. Doc
  reconciliation is U11's whole job.
- it does **not** bump a version and does **not** run `plugins:marketplace`

**U3 returns a report and nothing else.** An audit that edits is an audit whose
findings can no longer be checked.

**A payload-carrying unit copies bytes, it does not retype them.** U4, U6 and U7
move task files that work today. Each must `cp` from
`plugins/devtools/assets/tasks/` and then verify byte-identity plus mode, not
re-author the file from a reading of it. A silently reformatted task file is the
failure mode here, and it passes every gate this repo has.

### Gates that stay with the orchestrator

- **U3's no-skill-lost verdict.** Before U10 deletes anything, the audit must
  show every destination meets or exceeds its source. The `eslint` merge is the
  one expected to need work; the four identical gates are expected to need none.
  This is the gate the whole plan exists to satisfy, and a partial ABSENT list
  is a ruling, not a mechanical edit.
- **The materialization smoke test**, run by the orchestrator on a scratch repo
  before U10's work is merged: `/vwf:setup` on a blank tree must produce
  `.config/mise/` with **executable** tasks and the four gate skills in
  `.claude/skills/`. This proves §D actually replaces what devtools gave
  unconditionally, and it cannot be inferred from any diff. It is the plan's
  largest risk (§K) and the one gate that must not be delegated.
- **The version bumps and the release.** Per `CLAUDE.md`, `plugins:release` and
  `i:release` are never run without asking. The bumps are the orchestrator's per
  the shared-file rule; the release is the user's.
- **The worktree and every commit.** Units write files; the orchestrator lands
  them through `/vwf:git-workflow`. No unit commits, so a failed wave is
  discarded by throwing away uncommitted work rather than by reverting five
  agents' separate commits.
- **Any `UNRESOLVED:` in a report.** By construction: a unit that could resolve
  it would not have raised it.

### What does *not* stop the run

The plan is approved and every design decision in §§B–F is settled. The run goes
wave to wave without checking in, and specifically does **not** pause to:

- re-ask any of the four rulings, or re-open
  `docs/memory/decisions/2026-08-29-devtools-survives-the-waves.md` — §H answers
  it argument by argument
- confirm a unit's file scope, a bundle slug, a topic name, or the composition
  order — all are stated here
- report progress between waves, beyond running the wave gate
- ask whether to continue after a green gate

A failing wave gate is not a question either: fix it, or raise it as the
orchestrator's own `UNRESOLVED:` and stop once, with the specific ruling needed
— never a general "how should I proceed?".

---

## J. Out of scope

- **Making the task runner genuinely pickable.** vwf's `mise run` invocations in
  `git-workflow`, `execute-coder` and `doctor` stay hardcoded. Moving them
  behind the task-name contract so `just` or `make` could answer is the change
  that would make the `toolchain-manager` type more than one pack, and it
  belongs with the `vwf-portability-goal` work.
- **Gate packs owning their config files.** Nothing writes `dprint.json` or
  `.config/pre-commit-config.yaml` today; adding it is new capability (§C).
- **A python language bundle.** §F authors the two thin packs; the 12-topic
  language bundle that would make them reachable is its own wave.
- **This repo's own `.config/mise/tasks/`.** Explicitly deferred to the user's
  testing by the vwf-decoupling plan, and still deferred.
- **The `bun` overlay.** `package-manager/bun` is `@generated`; its task overlay
  arrives with the pack, if one is ever authored.

---

## K. Risks

**The unconditional baseline is the whole bet.** If §D's fixed-slug fetch does
not fire on a blank repo, dissolution is a straight loss of doctrine in every
repo that has not picked a stack. Gate 4 tests exactly this, on a scratch repo,
before U9's deletion is merged rather than after.

**The `config/` tier is a charter reopening, and charters ratchet.** Once packs
can write repo config files, the argument for letting them write `dprint.json`,
`package.json` or a CI workflow gets easier each time. §C's deliberate
non-extension is the fence; it needs to be stated in `output-tree.md` itself,
not only here.

**Two packs writing one tree is new.** `.config/mise/tasks/` is the first
destination more than one component contributes to, and precedence bugs there
are silent — a stale `common/code/format` shadowing a language's would simply
format less. The lockfile's per-file provenance is what makes it debuggable, and
it is why §C records per file rather than per pack.

**The executable bit.** Task files that land 644 fail as missing tasks, not as
permission errors. Asserted in U2, tested in gate 4.

**Deleting a 14 KB user-facing doc.** `docs/plugins/devtools.md` has no stackgen
equivalent for the mise half yet; U10 writes that content into
`docs/plugins/stackgen.md` rather than dropping it.
