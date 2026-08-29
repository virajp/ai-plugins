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

Every landed pack's doctrine **still ships from its curated plugin too**. The
copies here are the destination the no-skill-lost rule requires **before**
that plugin can retire, not a replacement yet.

**Wave C — `ci-system/`, kind `ci-system`:** `github-actions`. Exactly one CI
system per repo, so this bundle never composes two.

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

**Deferred — `gcp` and `cloudflare`.** Their `cloud-provider` bar wants ~30
and ~9 artifacts; the curated plugins supply three provider skills and four
~80-line service templates. Folding them honestly needs per-topic research
with citations, which is its own piece of work rather than a fold. Until then
those two plugins stay the covered path for their clouds, and Wave D's census
blocks on them by design.

`object-storage` has no pack and will not get one: every object store is a
cloud's, so its flavour arrives from `gcp` or `cloudflare`. Its contract sits
in `../assets/contracts/` regardless, because the clauses are the same
whoever provides it.

`eslint` is deliberately absent: it is JS/TS-only, so it is topic 10 of the
TypeScript language bundle rather than a repo gate. See the `repo-gate` seam
in `../assets/kinds.md`.

Everything else remains the curated plugins' until its wave lands, and
stackgen's standing value is the uncovered tail:
`generated/<technology-slug>`.
