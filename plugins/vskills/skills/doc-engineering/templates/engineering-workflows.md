# <Entity> Workflows

> Replace `<workflow-engine>` with the project's engine from the registry.
> Retry/timeout fields apply only if the project has the `durable-workflows`
> capability.

## <Workflow Name>

**Trigger:** <event, API call, or cron schedule>

**Drives state transition:** <from → to>, if applicable

**Activities:** <ordered list of activity names>

**Retry policy:** `maximumAttempts: N, initialInterval: Xs, backoffCoefficient: N`

**Timeouts:** `workflowRunTimeout: Xm, activityStartToCloseTimeout: Xs`

**Signals / queries:** <any, or None>

**Failure handling:** what happens if an activity fails after retries are
exhausted.

---

<!-- If no worker activity exists for this entity, replace the entire file with: -->

# <Entity> Workflows

No background worker activity for this entity.
