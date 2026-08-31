---
name: vwf-plugin
description: The vwf plugin's own shape — its skills, agents, assets, hooks
  and
  vendored code, the docs tree its commands maintain, the two format stamps, the
  workflow ordering and what each gate means, and why it depends on exactly two
  plugins. Auto-applies when editing anything under plugins/vwf/.
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "plugins/vwf/**"
---

# The vwf Plugin

`vwf` is the flagship plugin — a full Product → Blueprint → Plan → Execute
workflow, with post-deploy verify and production-feedback intake closing the
loop. It names **no** technology: no stack templates, no language list.

**Each SKILL.md, agent file and asset is authoritative for its own behavior.**
The references below are an index of which file owns what, not a second copy of
their contents — a prose copy of the skill table drifted twice in one session
before it was cut.

| Read                         | For                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`skills-and-agents.md`][sa] | the `/vwf:` workflow skills and their gates, the subagents, the auto-applying doctrine skills            |
| [`assets.md`][as]            | `assets/` — which file owns which doctrine — plus `hooks/` and `vendor/`                                 |
| [`docs-tree.md`][dt]         | the `docs/blueprint/` tree vwf writes, the OKF profile, and the two format stamps                        |
| [`dependencies.md`][de]      | why `devtools` and `stackgen`, what the retired dependencies became, the memory layer, the vendored code |

[sa]: references/skills-and-agents.md
[as]: references/assets.md
[dt]: references/docs-tree.md
[de]: references/dependencies.md

Adding a skill and picking its invocation mode is in
[`CLAUDE.md`](../../../CLAUDE.md); the ten checker rules and the authoring traps
are the sibling `plugin-authoring` skill.

**Foundations & ordering.** The workflow is
`setup → product → architecture → design-system → blueprint → plan → execute`,
with `verify` (post-deploy) and `feedback` (production intake) closing the loop
back into `product`/`blueprint`/`plan`. `setup` is the Phase-0 bootstrapper — it
onboards a repo (detect-or-ask topology via MCQ, consent-gated reconciliation
into the `docs/blueprint/` format, `/devtools:scaffold` for the mise config, the
CLAUDE.md vwf section, the memory tree and `mempalace.yaml`, the
`environment.md` bootstrap) and is **re-runnable**: re-running *is* the resume
mechanism, since Step 0 re-resolves the mode from what is on disk and a
conforming repo resolves to `current`. **It runs none of the foundations** — it
ends by printing the chain and offering to start `/vwf:product`, because each of
those commands resolves its own mode and reports what it did, which a gate
inside setup could only guess at on their behalf. `product.md` (the Phase −1
outcome contract, type `vwf-product`, gated by the `product-reviewer`) and
`architecture` (the registry) are both unconditionally required before
`blueprint` — every **flow's** Purpose must `Serves:`-link a product goal anchor
(entities trace to goals transitively via their `Used by:` flow links), which
the `blueprint-reviewer` verifies and the minimalism check traces to.
`design-system` is a second foundation, **required once the registry has a UI
project** (some project declares a **screen platform**): `blueprint` halts on a
flow with a Screens surface if `docs/blueprint/design-system.md` is missing.
`environment.md` (the per-project env-var/secret catalog, type
`vwf-environment`) is a third foundation, **required once the registry declares
an external integration or a secrets-manager `config`** — `setup` bootstraps it
from the repo's existing env-var/secret usage (names only, never values) and
`blueprint` maintains it as flows add integrations, with `conventions.md#config`
holding only the injection mechanism. **Everything up to `blueprint` is done in
full before planning**: a blueprint run sweeps until whole-product coverage
holds (every goal served by a flow, every referenced entity/schema/API operation
authored + reviewed, every registry surface represented, the coherence review
clean) and stamps it; `plan` hard-halts on a partial stamp and chains its
slice's unimplemented dependencies as their own plans, so per-slice execution
never builds on an unblueprinted or unbuilt dependency. The blueprint is a
**code-independent technical contract** — it records only decisions that have
more than one reasonable answer *and* are true regardless of how the code is
written today; reuse/placement/ordering/library choices are `plan`'s job. The
`blueprint-reviewer` gate enforces the per-doc completeness bars (flow steps,
acceptance, screens, jobs; entity lifecycle, relationships, concurrency, schema;
API errors + idempotency), the goal-traceability bars (`Serves:` on flows,
`Used by:` on entities), and the code-independence guardrail (no
file/class/library/CSS/pixel leakage); the `blueprint-coherence-reviewer` closes
the sweep with the cross-doc pass (flow↔lifecycle↔schema↔operationId agreement,
catalog/erDiagram sync, the released-API additive-only diff).
