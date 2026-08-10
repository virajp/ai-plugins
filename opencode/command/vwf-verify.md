---
description: "Verify a deployed environment against the blueprint — health-check each deployed project and re-run the flows' acceptance criteria in staging mode. Run after you (or CI) deploy; vwf never deploys. A clean pass against the production environment offers to record a release, freezing each deployed service's API contract into docs/blueprint/apis/released/. Failures route through the feedback machinery."
---

Read the `verify` workflow skill at `%%AI_PLUGINS_ROOT:vwf%%/commands/vwf-verify/index.md` and follow
it for this request.

Arguments ([environment, e.g. staging]):

$ARGUMENTS
