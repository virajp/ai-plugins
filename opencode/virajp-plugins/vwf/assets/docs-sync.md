# Docs Sync (end of every change)

**Stale docs are more harmful than no docs** — a doc that contradicts reality
actively misleads the next reader (human or agent). Every vwf run that changes
reality therefore ends by delegating to vwf-docs-sync, in the
same worktree and commit flow as the change itself. Docs are never "updated
later".

## When it fires

| Run                          | Reality that changed              | Sync |
| ---------------------------- | --------------------------------- | ---- |
| `execute`                    | landed code, new capabilities     | yes  |
| `architecture` (update mode) | system shape, projects, stacks    | yes  |
| `product` (update mode)      | the product's framing/goals       | yes  |
| `setup`                      | (owns full doc authoring already) | n/a  |
| `blueprint` / `plan`         | only blueprint/plan docs changed  | no   |

`blueprint`/`plan` are exempt because their output *is* documentation of intent,
not reality — the README must describe what the product **does**, and that
changes when code lands, not when a contract is written.

## The procedure

vwf-docs-sync owns it: scope resolution, the
`docs-sync-surveyor` scan (graph-first), surgical edits, the
vwf-readme route for broad README drift, the change-log hook,
and the mandatory report line — which docs were synced, or the explicit
`docs: nothing contradicted`, never a silent skip. A calling run passes its own
change set and lands the edits in its own commit flow; a standalone invocation
(the same skill, run by the user after ad-hoc work) scopes itself and commits
`docs:` via vwf-git-workflow.
