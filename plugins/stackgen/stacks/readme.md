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
