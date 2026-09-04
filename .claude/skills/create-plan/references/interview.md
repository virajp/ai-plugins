# The interview checklist

One item per turn. Ask in this order; an item the survey answered is confirmed
in one sentence rather than asked. The interview ends when every item has an
answer written into the plan, not when the user seems done.

## A. The change

1. **Goal, in one sentence.** What is true after the plan lands that is not true
   now. Reject a goal that names a mechanism instead of an outcome.
2. **Non-goals.** What the user is explicitly not asking for, especially the
   adjacent thing the survey found. Goes to *Out of scope* with the reason.
3. **Reversals.** Does any part contradict a standing decision — a memory, a
   `docs/memory/decisions/` doc, a CLAUDE.md rule? Name it as a reversal and get
   it confirmed; a confirmed reversal becomes a decisions doc the docs unit
   writes.

## B. Per-project scope

4. **Which projects.** Confirm the survey's list of trees and projects. Anything
   the user adds re-runs the survey for that tree.
5. **Per project, the concrete edits.** File-level where the survey allows it.
   This becomes the unit table's *Owns* column, so it must be disjoint per wave.
6. **Behaviour change or not.** Per project: does a user of the plugin or CLI
   see a difference? Drives the release proposal.

## C. Rulings

7. **Every open design point.** One question each, recommended option first. The
   answer is quoted verbatim into the unit file that needs it. Keep asking until
   no unit would have to invent a decision.
8. **Ordering.** Which units can run concurrently (disjoint paths, no
   dependency) and which must wait. The user overrides the derived order only
   where they know something the survey did not.

## D. Gates and docs

9. **Gate deltas.** Which checker rule, test, or mise task must change or be
   added so the new behaviour is asserted, and which existing gate the change
   will break until it is adjusted. Each is an owned edit in a unit.
10. **Verification the orchestrator keeps.** Anything that cannot be proven by a
    diff — a real install via `target-verifier`, a scratch-repo run, a smoke
    test. Name it, name its pass condition.
11. **Docs the change falsifies.** Confirm the survey's list. The docs unit
    reconciles exactly these plus whatever `docs-reconciler` finds.

## E. Consent

12. **Landing.** May a fully green run merge to `develop` and push without a
    further prompt? Default when unanswered is **no**.
13. **Release, per affected project.** Release or not; patch, minor or major.
    Record every answer including "not this time". Note in the same breath that
    execute-plan always stops once before the `main` merge and tags — consent
    here is intent, not authorisation to run `i:release` or `plugins:release`.
14. **Approval.** Read the assumed decisions table back. Only an explicit yes
    sets the status to `APPROVED`.
