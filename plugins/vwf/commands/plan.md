---
description: Produce a reviewable cycle plan as a diff for one slice of the spec
  (an entity or a section). Reads desired (spec) vs actual (code), writes only
  the delta to docs/plans/<date>-<time>-<slice>.md. Requires a spec to exist.
argument-hint: "[entity | entity/section]"
model: opus
effort: high
---

# plan — Cycle Plan (a Diff, not a re-Spec)

Produce a reviewable cycle plan for a chosen slice of the spec. A plan is a
**diff**: it reads the spec (desired state) and the actual code (actual state)
for the slice and writes only the delta — what exists, what is missing, what
changes, and in what order — as a reviewable artifact ordered for TDD.

You own the user conversation and the approval gate. Do **not** restate the
spec; reference it.

Adopt the **Senior Developer & Architect** persona: read code before forming
opinions; order steps test-first; surface drift rather than silently resolving
it.

## Doc Paths

| Doc           | Path                                               |
| ------------- | -------------------------------------------------- |
| Registry      | `docs/specs/architecture.md`                       |
| Conventions   | `docs/specs/conventions.md`                        |
| Spec (slice)  | `docs/specs/<entity>.md` or `docs/specs/<entity>/` |
| Plan          | `docs/plans/<date>-<time>-<slice>.md`              |
| Plan template | `${CLAUDE_PLUGIN_ROOT}/assets/templates/plan.md`   |

---

## Pipeline

### 1. Resolve the slice

The slice is an entity (or a section of one) from `$ARGUMENTS`. **Halt if no
spec exists** for it: "No spec found for `<slice>`. Run `/vwf:spec` first."

### 2. Setup (git-workflow)

Invoke `/vwf:git-workflow` to ensure an isolated worktree before
reading/writing. All git actions in this command go through `git-workflow`. Keep
the worktree **local** — never push remotely here.

### 3. Read desired vs actual

- **Desired:** the spec part for the slice, plus `conventions.md` and the
  registry.
- **Actual:** the real code in the submodule(s) the registry maps this slice to
  (resolve section→project by `type`, as in `spec`).

### 4. Compute the delta only

Determine what already exists, what is missing, what must change, and the order
to do it in. Reference spec sections; do not restate them.

### 5. Flag drift

If the spec implies a surface the registry/code lacks (e.g. a background job
with no worker project), **surface it** under Risks / drift rather than silently
resolving it.

### 6. Write the plan

Write `docs/plans/<date>-<time>-<slice>.md` from the plan template, steps
ordered for TDD — each step names the failing test that defines "done".

### 7. Approval gate

Present the plan and wait for explicit approval before `/vwf:execute`.

### 8. Commit (git-workflow)

After approval, commit the plan via `/vwf:git-workflow`. Use a `spec(plan):` or
`docs(plan):` message. Keep the worktree **local**. Do not run raw git here.
