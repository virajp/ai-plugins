---
name: create-plan
description: Turn a change request into an autonomous-executable plan under
  docs/plans/<date>-<name>/ — survey the repo, interview the user one question
  at a time until the checklist is discharged, compute which projects need a
  release, record consent, and write index.md plus one file per subagent unit.
  Run when the user wants to plan a change to this repo; the result is what
  /execute-plan runs in a fresh session.
argument-hint: "[what to plan]"
allowed-tools: Read Grep Glob Bash Write Edit Agent AskUserQuestion
---

# create-plan

Produce a plan that `/execute-plan <folder>` can run **without you present**.
That sentence is the whole bar: every decision, ruling, file scope, gate and
consent the run will need is written into the folder, or the run will stop and
ask for it — which defeats the point. This skill is the part that talks to the
user; execute-plan is the part that does not.

The plan folder is the contract. `index.md` is the entry point and carries
everything execute-plan reads mechanically; the unit files carry what each
subagent reads. Nothing lives in conversation.

## Procedure

### 1. Survey before asking

Do not ask a question the repo can answer. Dispatch **Explore** subagents (one
message, concurrent) to map, for the request in `$ARGUMENTS`:

- the trees the change touches, and which project each belongs to —
  `plugins/vwf/`, `plugins/stackgen/`, `installer/`, `scripts/`, `.claude/`,
  root docs
- the gates that already cover those trees (`mise tasks`, the checker rules in
  `.claude/skills/plugin-authoring/references/checks.md`, `plugins.yml`)
- the docs that describe the current behaviour — `readme.md`, `CLAUDE.md`,
  `docs/plugins/`, `docs/installer/`, `.claude/docs/`, the project's home skill
- the last plan in `docs/plans/archived/` that touched the same tree, for the
  shape it used and any "out of scope" item this request may be picking up

Hold the findings; they ground the questions and become the plan's facts
section. Do not read the files yourself — the survey exists so the orchestrator
context stays small, and the same rule binds execute-plan.

### 2. Interview, one question at a time

Work through [the checklist](references/interview.md) top to bottom. Each item
is one `AskUserQuestion` call with a recommended option first, or a prose
question when the answer is open-ended. **Never batch** — one decision per turn,
and never assume one. An item the survey already answered is confirmed in a
sentence, not re-asked.

The interview is done when every checklist item has an answer recorded, and not
before. If the user says "just decide", record the decision in the assumed
decisions table with your reasoning — that table is what they review.

### 3. Compute the release proposal

Derive from the unit file scopes, then confirm with the user per project:

| Scope touched                         | Project   | Release means                                        |
| ------------------------------------- | --------- | ---------------------------------------------------- |
| `plugins/vwf/**`                      | vwf       | bump `plugin.json` version; tag `vwf-vX.Y.Z`         |
| `plugins/stackgen/**`                 | stackgen  | bump `plugin.json` version; tag `stackgen-vX.Y.Z`    |
| `installer/**`, `package.json`        | installer | `mise run i:version`; tag `installer-vX.Y.Z`; npm    |
| `scripts/**`, `.claude/**`, root docs | none      | nothing to release — lands on the next merge to main |

A plugin whose **user-visible behaviour** changed needs a release for users to
see it; a plugin whose files changed but whose behaviour did not may not. Ask,
per project: release or not, and patch / minor / major. Record the answer in the
consent block whatever it is. A shipped plugin change with no release recorded
is a valid answer — the user has said it waits for the next one.

### 4. Write the folder

`docs/plans/<YYYY-MM-DD>-<kebab-name>/` from
[the template](references/plan-template.md): `index.md` plus one `NN-<unit>.md`
per unit. The template's sections are all required; the consent block and the
unit status table have a fixed shape because execute-plan parses them.

Rules the plan must obey, learned from the plans that came before:

- **One unit, one subagent, one commit.** A unit is stateless and inherits no
  context; its file carries its ruling quoted from index.md, its owned paths,
  its verification, and its commit line.
- **Shared-file rule.** Any file two units would write is owned by exactly one,
  or by the orchestrator. `plugin.json` versions, the generated marketplace and
  inventory files, and every doc are always the orchestrator's or the final
  units'. Units in one wave own disjoint paths.
- **Gate deltas are units.** A change that needs a new or altered checker rule,
  test, or mise task plans that as an owned edit, never as "update the gates".
- **The two last units are fixed:** the docs unit (the `docs-reconciler` agent's
  findings applied) and the gates-and-bump unit (versions bumped once,
  generators run, full gate green). Nothing else touches docs or versions.
- **Assumed decisions are a table**, one row per ruling you made, with the unit
  it changes. It is the review surface.
- **Out of scope is explicit.** What the user declined is listed with the
  reason, so execute-plan never "helpfully" picks it up.

### 5. Hand off

Set the status to `APPROVED` only once the user says so; until then it is
`DRAFT` and execute-plan refuses it. Then end with exactly this, and nothing
after it:

```text
Run in a fresh session:

/execute-plan docs/plans/<date>-<name>
```

Do not start executing. The fresh session is the point — this session's context
is the survey and the interview, and the run should carry none of it.

## What this skill never does

- Executes a unit, edits a file the plan names, or bumps a version
- Asks two things in one turn
- Records a release or landing consent it did not explicitly ask for
- Writes a plan whose unit prompts depend on this conversation
