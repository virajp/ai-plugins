# Packs

Packs — the dispatch rule's preferred, pre-created path, one pack per
**component** — arrive here in the merge waves, one wave at a time, in the
shape `../assets/pack-format.md` defines (`<type>/<slug>/pack.yaml` + prose
+ optional skills/agents).

**Landed so far — `toolchain-gate`, kind `repo-gate` (Wave A):** `dprint`,
`gitleaks`, `grype`, `pre-commit`. Their doctrine still ships from the
`devtools` plugin too; the copies here are the destination the no-skill-lost
rule requires **before** that plugin can retire, not a replacement yet.

`eslint` is deliberately absent: it is JS/TS-only, so it is topic 10 of the
TypeScript language bundle rather than a repo gate. See the `repo-gate` seam
in `../assets/kinds.md`.

Everything else remains the curated plugins' until its wave lands, and
stackgen's standing value is the uncovered tail:
`generated/<technology-slug>`.
