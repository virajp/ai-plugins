# Packs

Packs — the dispatch rule's preferred, pre-created path, one pack per
**component** — arrive here in the merge waves, one wave at a time, in the
shape `../assets/pack-format.md` defines (`<type>/<slug>/pack.yaml` + prose
+ optional skills/agents).

**Wave A — `toolchain-gate/`, kind `repo-gate`:** `dprint`, `gitleaks`,
`grype`, `pre-commit`.

**Wave B — `datastore/`, kind `database`:** `postgres`. And
`capability-provider/`, kind `capability-provider`: `oidc` (identity),
`otel-lgtm` (telemetry), `temporal` (workflow). The neutral contracts they
cite live once, in `../assets/contracts/`.

Most packs' doctrine **also shipped from a curated plugin** while that plugin
still existed. That copy is the destination the no-skill-lost rule requires
**before** a retirement, never a replacement on landing — and the backstop is
now spent: every curated stack plugin has retired, so for every pack here the
pack is the only home. Three packs went straight there, deleting their source
in the same commit because the pack plus a contract together carry everything
that source said: Wave D's `container-image` (with `contracts/local-stack.md`),
`doppler` (with `contracts/secrets.md`), and `github-actions` (with
`contracts/release-trigger.md`) — the third being the first to retire not a
skill but a **whole plugin**, `cicd` having been exactly one kind wearing a
manifest.

**Wave C — `ci-system/`, kind `ci-system`:** `github-actions`. Exactly one CI
system per repo, so this bundle never composes two. Its neutral contract is
`../assets/contracts/release-trigger.md`, landed later with the `cicd`
dissolution: it holds the recommended release-trigger mechanism — tag grammar,
branch mapping, release task names, how far a deploy path may be split — that
vwf's delivery-pipeline rules deliberately stopped mandating. Like
`local-stack.md` it is a **kind** contract rather than a capability one, and it
is what makes a second CI system one component rather than a second copy of the
release shape.

**`cicd` dissolved in the same landing** — the third plugin to go, and the
first to go whole rather than by skill: the kind *was* the plugin. Its neutral
rules, its resolution discipline and its one implemented system are the pack
and the contract above; what did not come across is its worked YAML, by the
same rule every pack follows — a pack carries judgment, and the vendor's own
syntax comes from Context7 at use time.

**Wave C — the TypeScript Language-Bundle**, five components across four
directories: `language/typescript`, `package-manager/pnpm`,
`toolchain-gate/tsconfig` (topic 9), `toolchain-gate/eslint` (topic 10) and
`framework/effect` (topic 2).

Note `toolchain-gate` appears under **two** kinds, which is the seam working
rather than a mistake: `dprint`/`gitleaks`/`grype`/`pre-commit` run over any
repo and compose into `repo-gate`, while `eslint` and `tsconfig` are
meaningful for exactly one toolchain and compose into its language bundle.

**Wave C — `app-framework/flutter`**, kind `app-framework`, with
`package-manager/pub` and `toolchain-gate/analysis-options`. The one bundle
whose root is not a language: Flutter owns the manifest and the build, so Dart
is a `primary` member and Kotlin and Swift are `platform-edge` members with
their own boundary-scoped skills.

Its integration references are **wiring only** — 45 files kept from 160, the
other 115 being API surface that Context7 serves current at use time. What was
kept is setup order, platform configuration (manifest entries, entitlements,
permissions) and anti-patterns: the half a per-package lookup gives piecemeal.

**The UX gate is materialized, not delegated.** The two curated `-ux-gate`
skills moved into their packs as an unprefixed `ux-gate`, landed into the
repo's own `.claude/skills/`. vwf invokes that fixed name instead of building
`<plugin>-ux-gate` from the stack pin — once stacks are packs there is no
plugin name to build from, and a name assembled from configuration is one that
can silently resolve to nothing.

**Wave D — `deploy-target/container-image`**, kind `deploy-target`, the
eighth kind. Folded from the Docker/OCI doctrine of the `devtools` plugin
(since dissolved into this one), and the fold split it in two, because that
skill was two skills wearing one hat:

- **The deploy artifact** — the build file, its ignore file, and promoting
  one digest rather than rebuilding per environment — is this pack, and it
  turns `container-generic`'s `@generated` ref into a curated one.
- **The local stack** — Compose behind `wait-on` readiness gates — is *not*.
  It went to `../assets/contracts/local-stack.md`, because a repo needs a
  local stack whether or not it pins a container deploy target, and welding
  the two is the exact conflation the retired skill's own opening paragraph
  warned about. That contract is the one file in `contracts/` that is a
  **harness** contract rather than a capability one.

`deploy-target` is also the first kind whose bundle has **no second half** —
one component, standing alone, because there is no category above a
provider-neutral target to write doctrine at. Its scope fence does the work a
pairing does elsewhere. Fixing it exposed that both deploy bundles had been
declaring `kind: language-bundle` as a placeholder; `npm-package` now declares
`deploy-target` too, with its ref still `@generated`.

**Wave D — the `claude-code` plugin dissolved**, and its doctrine split along
a line the plugin had blurred. Plugin *creation* is the authoring repo's own
business and is deliberately not distributed, so how a plugin is packaged and
registered went back to that repo's private `.claude/`. What **is**
distributed is `../assets/artifact-doctrine.md`: the host rules deciding
whether a skill, agent or hook is **valid at all** — strict-YAML frontmatter,
the invocation states and their silent failure, fixed rather than constructed
skill names, hook verdict shapes, and MCP/LSP wiring. stackgen generates those
artifacts, so it is stackgen that has to know.

It is an **asset, never a pack**: it governs stackgen's output rather than
being part of it, and it applies to every generation run whatever the stack.
`kinds.md` decides what an artifact must *cover*; this decides whether it
works. The reviewer gained a ninth check for it.

The `claude-code-plugin` bundle survives, trimmed to stack facts. It is what
lets the authoring repo stay onboarded on vwf, and it is not a special case —
every bundle here is a stack its author uses.

**Wave D — `design-tool/`, kind `design-tool`:** `claude-design`, `lovable`,
`stitch`. Each carries the three import skills at the **fixed names** vwf
delegates to — `design-import-screens`, `design-import-design-system`,
`design-import-conversations` — landed in the repo's own `.claude/`. That is the
`ux-gate` seam reused rather than a second one invented: vwf now names no design
tool anywhere, and the technology-free guard's allowlist got **smaller**, which
is the intended direction whenever an exception stops feeling arguable.

`claude-design` also declares an MCP server, which the materializer writes into
the project's own `.mcp.json` behind its own consent line. That is the charter
change Wave D made deliberately (`../assets/output-tree.md`): a curated registry
of servers fails on **scaling** before it fails on charter, since a list can only
hold what someone curated. LSP configuration stays out of the repo — no
project file can express one — and reaches the developer's machine through
the generated local plugin instead, the third output target Wave E added.

**Secrets — `capability-provider/`, category `secrets-manager`:** `doppler` and
`fnox`, the second pair to land in a category rather than one instance, and the
first landing where the choice between them is the whole point. Their neutral
contract is `../assets/contracts/secrets.md`, whose clauses both are judged
against; the axis that separates them is **where the secret lives and what
onboarding a teammate costs**, and the contract deliberately declines to rank
them.

Two things are worth knowing here rather than discovering later. The contract
carries an **encrypt-into-git allowance** under four conditions, and only `fnox`
engages it — a pack storing nothing in the repository emits no scanner allowlist
and claims no exemption, so a committed plaintext secrets file stays a finding
whichever pack is pinned. And `doppler`'s scope is **`development` only**, which
its contract-satisfaction topic states as a **named gap** on clauses 1 and 2
rather than omitting them: deployed environments take their secrets from the
platform that runs them. That is the contract's "a clause a tool cannot satisfy
is stated as such" rule doing what it exists for.

The `devtools` plugin lost its `doppler` skill in the same landing — the
second pack to retire its source skill on arrival. That plugin has since
dissolved into this one entirely; nothing named `devtools` ships any more.

**The two tool axes, and the stranded pack that forced them.** `design:` and
`cicd:` are per-project config keys outside the four stack axes, and the bundle
menu was the only door a template could come through — so `ci-system/github-actions`
landed in Wave C and **nothing could ever materialize it**. Not an error;
invisible. The `design` and `cicd` axes close that door, and their bundle slug
**is** the config token, so the menu pick and the config key are one value rather
than two that can disagree.

**Bundles — `bundles/`, the recorded compositions users actually pick.** Every
curated option survives the merge — the twelve TypeScript ones, the Flutter app,
the provider-neutral container deploy and the Claude Code plugin template, the
four Wave D added on the two tool axes, the `secrets-manager` pair above, and
the five Wave E added for the two clouds. Each names its components as refs,
mixing shipped packs (copied verbatim) with `@generated` ones (researched on
first fetch) — which is the dispatch rule working at bundle scale rather than a
gap.

A component answers *what is TypeScript*; a bundle answers *what is a
TypeScript service*. The menu lists bundles only — offering bare components
would ask a user to assemble a stack rather than choose one.

**Wave E — `cloud-provider/` and `cloud-service/`**, kind `cloud-provider`, the
ninth kind and the last one that had been defined but never authored against.
`cloud-provider` carries the account, IAM, billing and emulator judgment that
spans a provider's services — `gcp` and `cloudflare` — and `cloud-service`
carries one component per service: `cloud-run`, `cloud-sql`, `firestore`,
`firebase-auth`, `firebase-messaging`, `firebase-storage`, `gke` and
`zero-trust-access`. Wave D deferred this deliberately, because folding the two
clouds honestly needed per-topic research with citations rather than a fold of
their four ~80-line service templates.

Two `cloud-service` categories were minted for it (`../assets/taxonomy.md`):
`document`, for Firestore, and `access`, for Zero Trust Access, which is none of
compute/sql/queue/object-storage/cdn. `access` leaves `capability` unset and
stays that way — minting a capability token is vwf's move, never the taxonomy's.

**Every stack adapter has now retired**, and `stackgen` is the only plugin left
shipping a `-stack-menu` / `-stack-template` pair. The retirement test stayed
mechanical rather than a judgement — an adapter retires only when **every** slug
it offered has a bundle — and `gcp` and `cloudflare`, which failed it at Wave D,
pass it here; `typescript` and `flutter` retired in the same wave on the same
test. The checker's stack-adapter rule gained an **inverse direction** alongside
this, since with one adapter left, deleting its keyword would otherwise have
switched the whole rule off while the checker still passed.

`object-storage` still gets no pack of its own, and will not: every object store
is a cloud's, so its flavour arrives from `cloud-service/firebase-storage` or
whichever provider's equivalent lands next. Its contract sits in
`../assets/contracts/` regardless, because the clauses are the same whoever
provides it.

`eslint` is deliberately absent: it is JS/TS-only, so it is topic 10 of the
TypeScript language bundle rather than a repo gate. See the `repo-gate` seam
in `../assets/kinds.md`.

**36 packs and 32 bundles, across all eleven kinds.** No curated plugin
stands behind any of them any more, so the covered path is exactly this tree,
and stackgen's standing value beyond it is the uncovered tail:
`generated/<technology-slug>`.
