# Plan: migrating the four stack plugins into stackgen

**Status: awaiting approval. Nothing here has been executed.**

This migrates `typescript`, `flutter`, `gcp` and `cloudflare` into stackgen
packs and retires them as plugins, taking the marketplace from **7 plugins to
3** (`vwf`, `devtools`, `stackgen`).

The four are not one problem. **Two are largely already migrated** — Wave C
landed `language/typescript`, `framework/effect`, `package-manager/{pnpm,pub}`,
`toolchain-gate/{tsconfig,eslint,dprint,analysis-options}` and
`app-framework/flutter`, so what remains there is an audit, a backfill and a
deletion. **Two have no pack at all** — `stacks/cloud-provider/` and
`stacks/cloud-service/` do not exist in stackgen today, so gcp and cloudflare
are net-new authoring against a kind that has never been exercised.

One thing blocks all four and is the reason this plan exists rather than a
straight move: **four LSP servers cannot become packs.** Section B is the answer
that unblocks it, and it is a charter change for stackgen, not a port.

---

## A. What the audit found

Measured against the working tree on 2026-08-31.

| Plugin       | Size                                     | stackgen counterpart                                                                                         | Work                                                    |
| ------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `typescript` | 6 skills, 1,432 md lines                 | `language/typescript`, `framework/effect`, `package-manager/pnpm`, `toolchain-gate/{tsconfig,eslint,dprint}` | audit, move one hook, delete                            |
| `flutter`    | 6 skills, **216 md files**, 10,148 lines | `app-framework/flutter` (32 files, 4,953 lines), `package-manager/pub`, `toolchain-gate/analysis-options`    | audit, **backfill**, delete                             |
| `gcp`        | 5 skills, 799 lines, 4 templates         | **none**                                                                                                     | author 1 provider + 7 service components + bundles      |
| `cloudflare` | 2 skills, 229 lines, 1 template          | **none**                                                                                                     | mint a taxonomy category, author 1 provider + 1 service |

### typescript is effectively covered already

Per-skill, plugin against pack:

| Plugin skill   | Lines | Pack destination                                         | Pack lines   |
| -------------- | ----- | -------------------------------------------------------- | ------------ |
| `typescript`   | 344   | `language/typescript`                                    | 689          |
| `effect`       | 550   | `framework/effect`                                       | 566          |
| `pnpm`         | 186   | `package-manager/pnpm`                                   | 209          |
| `tsconfig`     | 149   | `toolchain-gate/tsconfig`                                | 166          |
| `lint-format`  | 90    | `toolchain-gate/eslint` + `toolchain-gate/dprint`        | 111 + 115    |
| `package-json` | 113   | `package-manager/pnpm/references/manifest-discipline.md` | (within 209) |

Every pack meets or exceeds its source. The audit (U3) confirms fidelity rather
than expecting gaps; `package-json` is the one to check closely, since it folded
into another component rather than getting its own.

### flutter is a deliberate condensation that needs proving

The pack collapsed each multi-file directory into a single file —
`firebase-auth/` 17 files into `integrations/firebase-auth.md`,
`swift/references/xcode/` 12 files into `flutter-ios/references/xcode.md`, and
the same for `getx`, `webrtc`, `revenuecat`, `image-handling`,
`json-serializable`, `maps-and-location`, `webview`, and the other four
`firebase-*` suites.

**Filename mismatch is not content loss** — `navigation-and-routing` →
`navigation.md`, `managing-state` → `state-management.md`, `http-and-json` →
`data-and-networking.md`, `native-interop` → `platform-interop.md`,
`architecting-apps` → `standards-and-architecture.md`, and `theming` +
`building-layouts` → `ui-composition.md` are all renames.

What is not settled is the **5,195 missing lines**. Two rules bear on it:
`no-line-caps` says a large artifact is *decomposed into a router plus on-demand
references, never trimmed*; `CLAUDE.md`'s no-skill-lost rule says a pack must be
a real destination **before** retirement. So U4 audits per topic and U6
backfills only what is genuinely absent — `dart/references/animate/` (462 lines,
10 files, name-checked once in `ui-composition.md`) is the leading candidate and
the audit's first target.

**Ruling: audit first, backfill real gaps, then retire.** Nothing is deleted
until its destination is proven.

---

## B. The LSP problem, and the generated local plugin

`typescript` declares `typescript-lsp`; `flutter` declares `dart-lsp`,
`kotlin-lsp` and `sourcekit-lsp`. All four are `mise x`-invoked with
`extensionToLanguage` maps.

**None of them can become a pack.** `assets/output-tree.md:11` excludes LSP
configuration because a language server is a plugin-manifest feature no project
file can express — verified: every `lspServers` occurrence in this repo and
across every cached installed plugin sits inside a `plugin.json`.
`language_facts.lsp` only tells `/vwf:doctor` *how a server is provided*; it
provides nothing.

**Ruling: stackgen generates a local plugin on the developer's machine and
registers it with Claude.**

This is feasible and persistent — `claude plugin marketplace add` accepts a path
with `--scope user|project|local`, and `known_marketplaces.json` already carries
a `"source": "directory"` entry today. No `--plugin-dir` flag per session.

```text
~/.claude/plugins/local/stackgen-lsp/
└── .claude-plugin/
    ├── plugin.json        # lspServers + mcpServers, union across the user's stacks
    └── marketplace.json

claude plugin marketplace add ~/.claude/plugins/local/stackgen-lsp --scope user
claude plugin install stackgen-lsp@stackgen-lsp --scope user
```

**Scope is `user`, on the laptop.** The trade taken knowingly: collaborators get
nothing by pulling, so a teammate's LSP is their own machine's business. What it
buys is one registration serving every repo.

**The §5 objection does not apply here, and the reason should be recorded.**
`artifact-doctrine.md` §5 says *"an LSP declaration must not start a server in a
repo with no matching files."* All four servers carry `extensionToLanguage`
maps, so a repo with no `.dart` file never starts `dart-lsp`. The extension map
**is** the guard, which is what makes user scope safe. A generated declaration
without one would not be.

### What this changes in stackgen

This is the plan's only charter change, and it is deliberate:

- **`assets/output-tree.md`** — a **third target** beside `.claude/` and
  `.mcp.json`: the generated local plugin directory. Today the file says
  "Nothing lands outside `.claude/` except `.mcp.json`."
- **`materializer.md`** — a landing step, and its **own consent line**. Writing
  outside the repo, and registering with a user-scoped tool, is a bigger act
  than a project file and gets a bigger gate.
- **`lock.yaml`** — a new key recording the plugin path, the declared server
  keys, and the marketplace registration, so the receipt invariant holds:
  removal removes exactly what was added.
- **`artifact-doctrine.md` §5** — the installer pattern already anticipates this
  ("generates the installer rather than the config"); it gains the local-plugin
  form and the extension-map requirement as a hard rule.

**MCP rides the same mechanism.** `.mcp.json` remains the project-scoped path
for project-scoped servers; the generated plugin is for user-scoped ones the
repo should not own.

---

## C. gcp — a provider plus capability-split services

No `cloud-provider` or `cloud-service` pack has ever been authored, so U7 is the
kind's first exercise. `assets/kinds.md:185` already defines the
`cloud-provider` topic bar (axis `backing` + `deploy`, everything
model-invocable, nothing paths-scoped) and `taxonomy.md` already defines the
Cloud-Bundle as *a `cloud-provider` component + `cloud-service` components*.

**The provider component** carries what spans services — the existing `gcp-cost`
(104 lines), `gcp-iam` (123) and `gcp-local-stack` (107) skills are exactly that
judgment and fold in here.

**The service components**, from the plugin's four templates:

| Component                          | Type            | Category         | Capability             |
| ---------------------------------- | --------------- | ---------------- | ---------------------- |
| `cloud-service/cloud-run`          | `cloud-service` | `compute`        | —                      |
| `cloud-service/gke`                | `cloud-service` | `compute`        | —                      |
| `cloud-service/cloud-sql`          | `cloud-service` | `sql`            | `relational-datastore` |
| `cloud-service/firestore`          | `cloud-service` | `document`       | `document-datastore`   |
| `cloud-service/firebase-auth`      | `cloud-service` | —                | `third-party-auth`     |
| `cloud-service/firebase-storage`   | `cloud-service` | `object-storage` | `object-file-storage`  |
| `cloud-service/firebase-messaging` | `cloud-service` | —                | `push-notifications`   |

**Firebase splits by capability.** `taxonomy.md`'s capability seam says a
component's `capability` field names **the** vwf token it realizes — singular.
One `firebase` component would silently realize four, which `/vwf:doctor`'s "a
declared B capability should have a provider" check cannot see. Splitting also
makes each independently substitutable: a product can take Firebase Auth without
Firestore.

**Do not confuse these with the flutter pack's `integrations/firebase-*.md`.**
Those are client-side Flutter wiring; these are backing-service doctrine. Both
survive, and U7 must not merge them.

Observability stays OTLP-only — GCP services are sinks, never SDKs — per the
existing rule this plan does not revisit.

---

## D. cloudflare — and a minted taxonomy category

Cloudflare's scope is deliberately parked at Zero Trust Access: a private plane
in front of a project that must not be publicly reachable. Workers, Pages, R2,
D1, KV, Durable Objects, Queues, Images and Stream are **not** in scope and
arrive under their own plan. The menu states what it does not cover rather than
coming back quietly short — that property must survive the migration.

**Ruling: `cloud-provider/cloudflare` + `cloud-service/zero-trust-access`, under
a newly minted `access` category.**

Zero Trust Access is not compute, sql, queue, object-storage or cdn, so
`taxonomy.md`'s closed `cloud-service` category list gains a sixth value. That
file says a new type or category is **"an edit to this file, reviewed like any
contract change — never a value a generation run invents because nothing here
fit."** So U1 makes that edit as its own reviewed step, ahead of any pack
authoring, and U8 consumes it.

The alternative considered and rejected: `capability-provider`/`identity` beside
the `oidc` pack. It needs no taxonomy edit, but it would classify a cloud
product as a bare capability and leave nowhere for Workers/R2/D1 to land later
without re-classifying.

---

## E. What retirement breaks

Enumerated so no unit rediscovers it mid-run.

1. **`scripts/src/check.ts:477` — the stack-adapter rule keys on the
   `vwf-stack-adapter` keyword.** After deletion only `stackgen` carries it. The
   rule keeps working, but note the standing hazard already recorded in memory:
   *a keyword-bound rule can be disabled by the same diff that breaks it*, and
   `plugins:check` asserts nothing about a plugin having content. U10 reviews
   the rule; it does not silently inherit a weaker checker.
2. **`.config/mise/tasks/typescript/test:19`** hardcodes
   `plugins/typescript/hooks/npm-normalize.sh`, and `plugins.yml` runs that
   task. The hook and its table test both move; the task is repointed at the
   pack. Packs may ship hook scripts — `pack-format.md` permits it, and
   `capability-provider/fnox` already does.
3. **`.claude-plugin/marketplace.json`** regenerates from 7 entries to 3.
   `plugins:marketplace --check` fails until it does.
4. **`docs/plugins/{typescript,flutter,gcp,cloudflare}.md`** — 35 KB across four
   files — plus 14 mentions in `readme.md` and 13 in `CLAUDE.md`, including the
   "Available plugin names" install list.
5. **vwf's `stacks:` roster** — `assets/stack-adapter.md:55` uses
   `stacks: [ stackgen, gcp, cloudflare ]` as its worked example. It is an
   example, not a registration, but it becomes a false one.
6. **No tags are deleted.** `typescript-v3.3.0` and the rest stay as history;
   they simply stop being referenced. A user on an old pin keeps working.

---

## F. Executing this — the delegation plan

**The orchestrator must not read this work, only decide it.** The flutter plugin
alone is 216 files and 10,148 lines; `docs/plugins/vwf.md` is 111 KB. Reading
them inline costs the context once and re-costs it every later turn. Same
argument vwf already makes for its own subagents: delegation is *"a latency and
context strategy as much as a quality one."*

Every unit below is one subagent, dispatched with the **Agent** tool. The
orchestrator holds the rulings, the gates and the verification — never the file
contents. **No unit's work is done inline**, including the small ones: a unit
the orchestrator "just does itself" is a unit whose file loads are in context
for the rest of the run, which is the cost this whole structure exists to avoid.

### The units

| Id      | Section | Touches                                                                                                                                  | Depends on |
| ------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **U1**  | C, D    | `stackgen/assets/taxonomy.md` — mint `cloud-service` category `access`; verify the `cloud-provider` topic bar in `kinds.md` is complete  | —          |
| **U2**  | B       | `stackgen/assets/{output-tree,artifact-doctrine}.md`, `materializer.md` — the generated-local-plugin charter, consent line, lockfile key | —          |
| **U3**  | A       | **Audit only, writes nothing** — `typescript` 6 skills vs their 6 pack destinations; per-topic carried / condensed / ABSENT              | —          |
| **U4**  | A       | **Audit only, writes nothing** — `flutter` 216 files vs the 32-file pack; per-topic verdict, `animate` first                             | —          |
| **U5**  | A       | typescript backfill (U3's ABSENT set only) + move `npm-normalize.sh` and its table test into `package-manager/pnpm`                      | U3         |
| **U6**  | A       | flutter backfill (U4's ABSENT set only), as router-plus-references — **never a trim**                                                    | U4         |
| **U7**  | C       | `stacks/cloud-provider/gcp/` + 7 `stacks/cloud-service/` components + their bundles                                                      | U1         |
| **U8**  | D       | `stacks/cloud-provider/cloudflare/` + `stacks/cloud-service/zero-trust-access/` + bundle                                                 | U1         |
| **U9**  | B       | The generator/materializer implementation for the local LSP+MCP plugin, and its `stackgen-sync` + removal path                           | U2         |
| **U10** | E       | Delete the 4 plugins, regenerate the marketplace, repoint `typescript:test`, review the keyword-bound checker rule                       | U5–U9      |
| **U11** | E       | Doc reconciliation — delete 4 `docs/plugins/*.md`, fix `readme.md`, `CLAUDE.md`, vwf's `stack-adapter.md` roster example                 | U10        |

### How each unit is dispatched

One `Agent` call per unit, `subagent_type: "general-purpose"`, `name: "U<n>"`. A
whole wave goes out in **one message with multiple tool uses**, which is what
makes it concurrent rather than sequential.

Two units get a different type: **U11** is `docs-reconciler` (that is the agent
this repo already has for doc drift), and **U10** additionally invokes
`target-verifier` before returning, since deleting four plugins from the
marketplace is exactly the "prove it against the real `claude` CLI" case that
agent exists for.

**No `isolation: "worktree"`.** The units in a wave write to disjoint
directories, so a shared checkout has no file conflicts, and worktree isolation
would mean merging four trees back by hand. Instead the **orchestrator** creates
one worktree for the whole plan up front via `/vwf:git-workflow` — the repo's
rule is never to work in the main checkout — and every unit works inside it.

### The shared-file rule, which is what makes a wave safe

Four wave-2 units all write inside `plugins/stackgen/`. Disjoint subdirectories
are fine; three shared files are not, and each is reserved to the orchestrator:

| File                                   | Why it collides                                            | Owner                     |
| -------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| `plugins/*/.claude-plugin/plugin.json` | four units bumping one `version` is a lost update          | orchestrator, once a wave |
| `.claude-plugin/marketplace.json`      | generated from every manifest; regenerating mid-wave races | **U10 only**              |
| `plugins/stackgen/assets/taxonomy.md`  | U1 writes it; U7 and U8 only read it                       | U1, wave 1                |

So **no unit bumps a version and no unit runs `plugins:marketplace`** (the
generator — `--check` is fine and is required). The orchestrator bumps once per
wave, after the wave's reports are in. This also keeps
`plugins:marketplace --check` green *inside* each unit: with no version moved,
the committed manifest still matches.

### Waves

Each wave is one message. The orchestrator waits for every report in a wave,
runs the wave gate, then dispatches the next.

1. **U1 ‖ U2 ‖ U3 ‖ U4.** No shared files; the two audits write nothing, so they
   cannot collide with the two doctrine edits.
2. **U5 ‖ U6 ‖ U7 ‖ U8.** Each waits only on its own predecessor. Four packs,
   four disjoint directories.
3. **U9** — needs U2's charter settled before implementing against it.
4. **U10** — the only destructive unit, and it runs last on purpose. Nothing is
   deleted until every destination exists and every audit is clean.
5. **U11** — docs, after reality.

**The wave gate**, run by the orchestrator between waves:
`mise run
plugins:check`, `mise run plugins:marketplace --check`,
`mise run vitest run`, and every unit's report read for `UNRESOLVED:`. **A wave
with any `UNRESOLVED:` does not advance** — an unresolved finding is a ruling
the orchestrator owes, and carrying it into the next wave is how a wrong
assumption gets built on.

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
   `plugins:marketplace` (the generator).
5. **The return contract** below.

U5 and U6 additionally get their audit's ABSENT list verbatim, so neither
re-runs the survey. U7 gets the component table from section C verbatim, so it
does not re-derive the capability split. U8 gets U1's minted `access` category
as landed text, so it does not re-open the classification.

**Returns:** a terse report — files changed, decisions taken inside the scope,
anything it could not resolve as `UNRESOLVED:`. Never file contents, never a
diff dump.

**Every unit, before returning:**

- `mise run plugins:check` and `mise run plugins:marketplace --check` pass
- `mise run vitest run` passes where it touched `scripts/` or `cli/`
- it reports which docs its change falsified — but **does not edit them**, and
  does not read `CLAUDE.md` or `docs/plugins/vwf.md` to find out. Doc
  reconciliation is U11's whole job, and eleven units each editing `CLAUDE.md`
  is the collision the shared-file rule exists to prevent. The repo's
  docs-ship-with-the-change rule is satisfied by U11 landing in the same plan,
  not by each unit landing its own edit.
- it does **not** bump a version and does **not** run `plugins:marketplace` —
  both are the orchestrator's, per the shared-file rule

**U3 and U4 return a report and nothing else.** An audit that edits is an audit
whose findings can no longer be checked.

### Gates that stay with the orchestrator

- **U4's verdict on the 5,195 lines.** If the audit finds the condensation was
  lossy in contract rather than in prose, the backfill scope is a ruling, not a
  mechanical edit. U4 reports; it does not decide.
- **U9's registration UX.** Whether the local plugin is registered automatically
  on consent or the command is printed for the user to run is a decision about
  acting on a machine outside the repo. Default: **print and confirm**, never
  auto-register.
- **The version bumps and the release.** Per `CLAUDE.md`, `plugins:release` and
  `i:release` are never run without asking. The bumps themselves are the
  orchestrator's per the shared-file rule; the release is the user's.
- **The worktree and every commit.** Units write files; the orchestrator lands
  them through `/vwf:git-workflow`. No unit commits, so a failed wave is
  discarded by throwing away uncommitted work rather than by reverting four
  agents' separate commits.
- **Any `UNRESOLVED:` in a report.** By construction: a unit that could resolve
  it would not have raised it.

---

## G. Out of scope

- **Retiring `devtools`.** It is a `vwf` dependency and Wave C/D already moved
  its stack adapter, docker and doppler doctrine. What remains is the mise skill
  and the repo gates, which is its own plan.
- **Cloudflare beyond Zero Trust Access.** Workers, Pages, R2, D1, KV, Durable
  Objects, Queues, Images, Stream — named here only so the parked scope stays
  explicit.
- **Deleting any git tag.** History stays.
- **The `cloud-service` components' own deploy pipelines.** The `deploy-target`
  kind and `contracts/release-trigger.md` already own that seam.

## H. Risks

- **The `access` category is minted for one component.** If cloudflare's scope
  never widens, a taxonomy value exists for a single pack. Accepted knowingly:
  the alternative misclassifies a cloud product to avoid a reviewed edit.
- **User-scoped LSP means collaborators get none.** A teammate cloning the repo
  gets the `.claude/` packs but no language servers until they run the installer
  themselves. This is the direct cost of the `--scope user` ruling.
- **The `cloud-provider` kind is unexercised.** U7 is its first real use, so its
  topic bar may prove wrong in ways only authoring reveals. U7 reports bar
  problems as `UNRESOLVED:` rather than editing `kinds.md` mid-run.
- **U10 is irreversible in one commit.** Four plugins leave the marketplace at
  once. Mitigated by ordering it last and by every tag remaining valid.
