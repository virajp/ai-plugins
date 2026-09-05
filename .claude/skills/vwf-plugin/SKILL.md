---
name: vwf-plugin
description: The vwf plugin's own shape — its skills, agents, assets, hooks
  and vendored code, the docs tree its commands maintain, the two format
  stamps, the workflow ordering and what each gate means, how to add a skill
  and pick its invocation mode, and why it depends on exactly one plugin.
  Auto-applies when editing anything under plugins/vwf/.
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "plugins/vwf/**"
---

# The vwf Plugin

`vwf` is the flagship plugin — a full Product → Blueprint → Plan → Execute
workflow: slash-invocable workflow skills, auto-applying doctrine skills, the
subagents they delegate to, the shared doctrine in `assets/`, the guarded `rtk`
hook, the two mempalace auto-save hooks, and two MCP servers. It names **no**
technology — no stack templates, no language list; what each axis offers comes
from a stack plugin behind the stack-adapter contract, and `plugins:check`'s
technology-free guard enforces it.

**Each SKILL.md, agent file and asset is authoritative for its own behavior.**
The references below are an index of which file owns what, not a second copy of
their contents — a prose copy of the skill table drifted twice in one session
before it was cut.

| Read                         | For                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| [`skills-and-agents.md`][sa] | the `/vwf:` workflow skills and their gates, the subagents, the auto-applying doctrine skills |
| [`assets.md`][as]            | `assets/` — which file owns which doctrine — plus `hooks/` and `vendor/`                      |
| [`docs-tree.md`][dt]         | the `docs/blueprint/` tree vwf writes, the OKF profile, and the two format stamps             |
| [`dependencies.md`][de]      | why `stackgen`, what the retired dependencies became, the memory layer, the vendored code     |

[sa]: references/skills-and-agents.md
[as]: references/assets.md
[dt]: references/docs-tree.md
[de]: references/dependencies.md

The twelve checker rules, the two mise gates and the authoring traps are the
sibling `plugin-authoring` skill, which also applies here. The user-facing
reference is `site/src/content/docs/plugins/vwf.md`, published at
`https://claude-plugins.virajp.dev/plugins/vwf/`.

## Dependencies

vwf depends on exactly one plugin, `stackgen`, resolved from this marketplace —
declared in `plugin.json` with `"marketplace": "virajp-plugins"`, which
`plugins:check` asserts resolves. `devtools` was the other until it dissolved
into stackgen. `mempalace` and `andrej-karpathy-skills` are **vendored** rather
than depended on, with provenance under `vendor/`; `markdown` and `context7`
were **absorbed**. The reasoning is [`dependencies.md`][de].

## Foundations & ordering

The workflow is
`init → setup → product → architecture → design-system → blueprint → plan → execute`,
with `verify` (post-deploy) and `feedback` (production intake) closing the loop
back into `product`/`blueprint`/`plan`. `init` shapes the **base repo** and
`setup` sets up **vwf** in it — two different things, and a repo can have either
without the other. `init` materializes the three unconditional bundles through
the stack adapter by the fixed slugs `mise`, `repo-gates` and `repo-hygiene`,
fills the marked positions those packs leave it, merges the pre-commit
fragments, and writes a two-line readme stub; it names no tool, and every file
it lays down is a pack's. `setup` is the Phase-0 bootstrapper — it onboards a
repo (a Step-0 shape check that offers `/vwf:init` when any of the three slugs
is missing, detect-or-ask topology via MCQ, consent-gated reconciliation into
the `docs/blueprint/` format, the CLAUDE.md vwf section, the memory tree and
`mempalace.yaml`, the `environment.md` bootstrap) and is **re-runnable**:
re-running *is* the resume mechanism, since Step 0 re-resolves the mode from
what is on disk and a conforming repo resolves to `current`. **It runs none of
the foundations** — it ends by printing the chain and offering to start
`/vwf:product`, because each of those commands resolves its own mode and reports
what it did, which a gate inside setup could only guess at on their behalf.
`product.md` (the Phase −1 outcome contract, type `vwf-product`, gated by the
`product-reviewer`) and `architecture` (the registry) are both unconditionally
required before `blueprint` — every **flow's** Purpose must `Serves:`-link a
product goal anchor (entities trace to goals transitively via their `Used by:`
flow links), which the `blueprint-reviewer` verifies and the minimalism check
traces to. `design-system` is a second foundation, **required once the registry
has a UI project** (some project declares a **screen platform**): `blueprint`
halts on a flow with a Screens surface if `docs/blueprint/design-system.md` is
missing. `environment.md` (the per-project env-var/secret catalog, type
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
catalog/erDiagram sync, goal-counter resolution, and the additive-only diff
against released APIs and released entity schemas).

## Adding a skill

Create `skills/<name>/SKILL.md` — no other registration is needed
(auto-discovered by directory convention; this repo has no `commands/` dirs, a
former command is a skill so one artifact serves both invocation paths). Then
pick the invocation mode per the policy below, and run `mise run plugins:check`
— strict-YAML frontmatter drops a skill **silently** when it fails to parse.

### Invocation policy

Claude spells this with two independent booleans, and the useful states are
three:

| State              | Frontmatter                        | For                      |
| ------------------ | ---------------------------------- | ------------------------ |
| user **and** model | `disable-model-invocation: false`  | anything delegated to    |
| model only         | `user-invocable: false` + `paths:` | auto-applying doctrine   |
| user only          | `disable-model-invocation: true`   | the user owns the timing |

It is **not cosmetic**: a user-only skill is removed from the model's context
entirely, so it **cannot be invoked by another skill**, and the failure is
**silent** — the caller simply cannot see it. The rule: model-invocable when
anything delegates to it, user-only when nothing does.

Cross-plugin skill-name uniqueness is no longer required — Claude scopes a skill
to its plugin. The `<plugin>-` prefix on adapter skill names is readability now,
not correctness, and `prefixSkillNames` is gone.

> The host rules behind this — the three states and the silent failure — are
> `plugins/stackgen/assets/artifact-doctrine.md` §2. The per-skill rulings and
> the two contracts the checker enforces (the design adapter's three import
> skills, the stack adapter's menu + template pair) are
> `.claude/skills/plugin-authoring/references/checks.md`.

## Hooks

`hooks/hooks.json` is authored directly in Claude's own format, with the scripts
beside it: the guarded `rtk` Bash hook, and the two mempalace auto-save hooks
(`Stop` and `PreCompact`). Plugin hooks are auto-discovered from that file and
**never written to `settings.json`**, so verify them with `/hooks`.

The verdict trap that shipped here: **a script's verdict shape is decided by its
event**. `hookSpecificOutput.permissionDecision` is `PreToolUse`-only — `Stop`
and `PreCompact` deny with the top-level `decision`/`reason`, and Claude rejects
the whole verdict if a `hookSpecificOutput` arrives without a matching
`hookEventName`. The mempalace checkpoint hook shipped with that mistake, where
a rejected verdict reads exactly like a hook that decided to stay quiet. Its
shell-script test lives at `installer/src/mempalace-checkpoint-script.test.ts`,
because `vitest.config.mts` collects only `{installer,scripts}/src/**`.

Why the mempalace hooks are reimplemented rather than vendored, and the host
rules a hook must satisfy (BSD `sed`, the per-event verdict shapes), are
`plugins/stackgen/assets/artifact-doctrine.md` §4 and the `plugin-authoring`
skill.

## Documentation

Any change to vwf's behaviour must reconcile `readme.md`, `CLAUDE.md` and
`site/src/content/docs/plugins/vwf.md` in the **same commit** — the repo's hard
rule. Delegate the sweep to the `docs-reconciler` agent rather than reading
those files inline; that file is large enough that loading it costs the rest of
the session. A behaviour change also bumps `version` in `plugin.json` (plain
`X.Y.Z`) and regenerates the marketplace with `mise run plugins:marketplace`.
