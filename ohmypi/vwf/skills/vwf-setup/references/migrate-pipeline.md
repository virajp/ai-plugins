# The Migrate Pipeline

Read this in mode `migrate`, and when the onboard pipeline's code sub-path hands
over an existing tree. Migration is **state-based**: compare the repo against
what the current format *is* and converge on it. There is no delta ladder, no
per-version procedure, and no support window — a tree stamped `2` and a tree
stamped `21` reconcile the same way, in one pass.

## What "the current format" means

Four sources define it, and none of them is a history:

| Source | Defines |
| --- | --- |
| `%%AI_PLUGINS_ROOT%%/assets/templates/` | the skeleton of every doc vwf writes, frontmatter included |
| `%%AI_PLUGINS_ROOT%%/assets/examples/blueprint/` | a worked, conformant bundle — the concrete "what good looks like" |
| the blueprint-authoring skill's bars | what a doc must *say* to be complete, and the density budgets |
| `%%AI_PLUGINS_ROOT%%/assets/vwf-config.md` | every `.config/vwf.yaml` key, and which are retired |

## The pass

1. **Diff the tree against those four.** Every file that is missing, misplaced,
   misnamed, or carrying a section the current format does not have is one
   entry. Judge the tree as it stands; do not ask how it got there. The root
   `.graphifyignore` is part of the current shape too — absent, or missing the
   vwf-standard excludes (`%%AI_PLUGINS_ROOT%%/assets/graphify.md`), is one entry
   like any other.
2. **Resolve every unrecognised spelling through
   [format lineage](format-lineage.md)** before recording it as a gap. A tree
   written against an older format is usually *correct for that format* and
   wrong only for this one, and the difference between a rename and a hole is
   the difference between a `git mv` and an elicitation.
3. **Fan-outs are verified, never picked.** A retired token mapping to more than
   one current spelling is settled against the platforms-by-evidence and
   consumer-domain rows in [topology detection](topology-detection.md), proposed
   with the evidence quoted, and confirmed by MCQ per
   `%%AI_PLUGINS_ROOT%%/assets/elicitation.md` — one decision per round.
4. **Present the whole convergence as a dry-run plan** and wait, per
   [migration & consent](migration-and-consent.md). Move with `git mv` so
   history survives; never delete; merge rather than overwrite.
5. **Apply the approved plan**, then hand back to the shared spine — which
   validates the bundle, writes both stamps, and runs
   `/skill:vwf-doctor`, in that order. The pipeline stamps nothing
   itself: a format number written before the tree was checked is a claim about
   a bundle nobody validated.

**Source layout is out of scope.** This pipeline reconciles documentation and
config only. A repo whose code sits somewhere the current topology template
would not put it produces a written recommendation, exactly as in onboarding —
never a move.
