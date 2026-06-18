# Worker Workflows Template

Background workflows for one entity. Save as
`docs/engineering/worker/workflows/{entity}.md`.

> Replace `{workflow-engine}` with the project's engine from the registry.
> Retry/timeout fields apply only if the project has the `durable-workflows`
> capability. If no worker activity exists for the entity, use the "No worker
> activity" variant in the section specs below.

```template
# {Entity} Workflows

> Runs on `{workflow-engine}`. Retry/timeout fields apply only with the
> `durable-workflows` capability.

## [Workflow Name]

**Trigger:** [event, API call, or cron schedule]

**Drives state transition:** [from → to], if applicable

**Activities:** [ordered list of activity names]

**Retry policy:** `maximumAttempts: [N], initialInterval: [Xs], backoffCoefficient: [N]`

**Timeouts:** `workflowRunTimeout: [Xm], activityStartToCloseTimeout: [Xs]`

**Signals / queries:** [any, or None]

**Failure handling:** [what happens if an activity fails after retries are
exhausted].
```

## Field Documentation

| Field                                               | Convention | Description                                                         |
| --------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| `{entity}`                                          | variable   | Entity name, used in the heading and the doc path.                  |
| `{workflow-engine}`                                 | variable   | The workflow/async engine from the project `stack` (e.g. Temporal). |
| `[Workflow Name]`                                   | prose      | Human name of the workflow.                                         |
| `[Trigger]` / `[Activities]` / `[Failure handling]` | prose      | Section bodies as described below.                                  |
| `[N]` / `[Xs]` / `[Xm]`                             | prose      | Concrete retry and timeout values.                                  |

## Section Specifications

| Section                 | Required               | Guidance                                                                           |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| Workflow (repeatable)   | One per workflow       | Trigger, the state transition it drives, ordered activities, and failure handling. |
| Retry policy / Timeouts | If `durable-workflows` | Concrete values; omit when the capability is absent.                               |
| Signals / queries       | Always                 | List any, or write "None".                                                         |

### No worker activity

If the entity has no background worker activity, replace the entire file body
with:

```markdown
# {Entity} Workflows

No background worker activity for this entity.
```
