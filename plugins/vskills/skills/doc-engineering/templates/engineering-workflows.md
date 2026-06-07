# <Entity> Workflows

## <Workflow Name>

**Trigger:** <event or cron schedule>

**Activities:** <ordered list of activity names>

**Retry policy:**
`maximumAttempts: N, initialInterval: Xs, backoffCoefficient: N`

**Timeout:** `workflowRunTimeout: Xm, activityStartToCloseTimeout: Xs`

---

<!-- If no worker activity exists for this entity, replace the entire file with: -->

# <Entity> Workflows

No Temporal worker activity for this entity.
