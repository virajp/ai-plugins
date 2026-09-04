---
name: create-plan
description: Turn a change request into an autonomous-executable plan under
  docs/plans/<date>-<name>/ — recall and survey the repo, split a request that
  is really several plans, interview the user one question at a time until the
  checklist is discharged, present the shape behind a hard gate, compute which
  projects need a release, record consent, and write index.md plus one file
  per subagent unit. Run when the user wants to plan a change to this repo;
  the result is what /execute-plan runs in a fresh session.
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

### 1. Recall, then survey

**Recall first.** Before asking anything, read what is already decided:

- `docs/memory/decisions/` — any doc touching the trees the request names
- the last plan in `docs/plans/archived/` that touched the same tree: its *Out
  of scope*, its *Parked* list and its *Run log* — the request is often one of
  those items coming due, and a gap the last run surfaced is a fact
- mempalace rooms `decisions`, `planning` and `gaps` for this repo's wing, when
  the server is up; **skip silently** when it is not

A standing decision the request contradicts is a **reversal** — name it as one
in the interview, never as a fresh choice.

**Survey second.** Dispatch **Explore** subagents (one message, concurrent) to
map, for the request in `$ARGUMENTS`:

- the trees the change touches, and which project each belongs to —
  `plugins/vwf/`, `plugins/stackgen/`, `installer/`, `scripts/`, `.claude/`,
  root docs
- the gates that already cover those trees (`mise tasks`, the checker rules in
  `.claude/skills/plugin-authoring/references/checks.md`, `plugins.yml`)
- the docs that describe the current behaviour — `readme.md`, `CLAUDE.md`,
  `docs/plugins/`, `docs/installer/`, `.claude/docs/`, the project's home skill
- the third-party dependencies already available to each tree, so a unit can be
  told to reuse before adding

Instruct every Explore agent to return **conclusions and `file:line` pointers
only** — never file contents, diffs or directory dumps. Hold the findings; they
ground the questions and become the plan's facts section. Do not read the files
yourself — the survey exists so the orchestrator context stays small, and the
same rule binds execute-plan.

### 2. Scope check

If the request is really **several independent pieces** — two trees with no
shared ruling, a doctrine change plus an unrelated installer fix — say so before
refining anything. Decompose it, agree the order, and plan **one folder per
piece**, each through this whole procedure. A later piece that stands on an
earlier one names it in its frontmatter `requires:` list; execute-plan halts
until every required plan reads `COMPLETE`. One plan never swallows another.

An answer mid-interview that raises something outside this plan's scope is
**parked, durably**: acknowledge it, write it to the plan's *Parked* list with
enough to pick it up later, and do not widen the plan. Parked items are the
first thing the next plan's recall reads.

### 3. Interview, one question at a time

Work through [the checklist](references/interview.md) top to bottom. Each item
is one `AskUserQuestion` call, or a prose question when the answer is
open-ended. **Never batch** — one decision per turn, and never assume one. An
item the survey already answered is confirmed in a sentence, not re-asked.

Ask only what has **more than one reasonable answer** given the repo. Where that
holds, **propose two or three approaches with their trade-offs**, lead with your
recommendation and why, and let the user pick or redirect. A ruling recorded
without its rejected alternatives is a ruling the next plan re-opens.

The interview is done when every checklist item has an answer recorded, and not
before. If the user says "just decide", record the decision in the assumed
decisions table with your reasoning and the alternative you rejected — that
table is what they review.

### 4. Compute the release proposal

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

### 5. Present the shape — the hard gate

**Nothing is written to disk before this gate.** Present, in sections scaled to
their weight and confirmed one at a time:

1. the goal and the reversals, if any
2. the assumed decisions table — every ruling, its rejected alternatives
3. the unit map — id, wave, owned paths, depends-on — and why each wave is safe
   to run concurrently
4. every new third-party dependency any unit introduces: package, what for,
   which unit. The gate is where the user consents to a dependency; a unit never
   adds one the plan does not name
5. the gate deltas and the gates the orchestrator keeps
6. the consent block and the release proposal
7. the parked list

Then ask once: **approve**, **revise** or **abandon**. Revise loops back to the
section named. Abandon ends here with nothing on disk and a one-line note of
what was decided, so the next attempt can recall it. Only approve continues.

### 6. Write the folder

`docs/plans/<YYYY-MM-DD>-<kebab-name>/` from
[the template](references/plan-template.md): `index.md` plus one `NN-<unit>.md`
per unit. The template's sections are all required; the frontmatter, the consent
block, the unit table and the run log have a fixed shape because execute-plan
parses and rewrites them.

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
  it changes and the alternative rejected. It is the review surface.
- **Out of scope and Parked are explicit.** What the user declined, with the
  reason, and what was raised and deferred, so execute-plan never "helpfully"
  picks either up.

### 7. Self-review

Re-read the folder with fresh eyes before handing it off, and fix inline:

- every row of the assumed decisions table is **quoted** in the unit file its
  *Unit* column names — a ruling no unit carries is a ruling the run re-derives
- every owned path appears in exactly one unit per wave, and every file in the
  shared-file rule has an owner
- every gate delta from the interview is an owned edit somewhere
- every unit's *Verification* names at least one gate line it must pass
- every `requires:` plan exists and is not `DRAFT`
- the launch line names this folder

### 8. Hand off

Set the status to `APPROVED` with the date; until then it is `DRAFT` and
execute-plan refuses it. Then end with exactly this, and nothing after it:

```text
Run in a fresh session:

/execute-plan docs/plans/<date>-<name>
```

Do not start executing. The fresh session is the point — this session's context
is the survey and the interview, and the run should carry none of it.

## What this skill never does

- Writes anything to disk before the hard gate in §5 is approved
- Executes a unit, edits a file the plan names, or bumps a version
- Asks two things in one turn, or asks what the repo already answers
- Records a release or landing consent it did not explicitly ask for
- Writes a plan whose unit prompts depend on this conversation
