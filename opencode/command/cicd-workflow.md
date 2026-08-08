---
description: "Generate this repo's delivery pipeline for whichever CI system it uses. Resolves the CI tool from config (falling back to detecting it from the repo, and asking when it cannot tell), then reads that tool's reference and writes the pipeline files. Every tool is installed through mise."
---

Read the `workflow` workflow skill at `%%AI_PLUGINS_ROOT:cicd%%/commands/workflow/index.md` and follow
it for this request.

Arguments ([workflow-name | ci | release | deploy]):

$ARGUMENTS
