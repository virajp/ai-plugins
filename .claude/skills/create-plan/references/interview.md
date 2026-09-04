# The interview checklist

One item per turn. Ask in this order; an item the survey or the recall answered
is confirmed in one sentence rather than asked. The interview ends when every
item has an answer written into the plan, not when the user seems done.

Where an item has more than one reasonable answer, propose two or three
approaches with their trade-offs, recommendation first. Where it has exactly one
idiomatic answer given the repo, do not ask — state it and move on.

## A. The change

1. **Goal, in one sentence.** What is true after the plan lands that is not true
   now. Reject a goal that names a mechanism instead of an outcome.
2. **Scope check.** Is this one plan or several? A request spanning trees with
   no shared ruling is split now, each piece its own folder, ordered, chained
   through `requires:`.
3. **Non-goals.** What the user is explicitly not asking for, especially the
   adjacent thing the survey found. Goes to *Out of scope* with the reason.
4. **Reversals.** Does any part contradict a standing decision — a memory, a
   `docs/memory/decisions/` doc, a CLAUDE.md rule, a recalled drawer? Name it as
   a reversal and get it confirmed; a confirmed reversal becomes a decisions doc
   the docs unit writes.

## B. Per-project scope

5. **Which projects.** Confirm the survey's list of trees and projects. Anything
   the user adds re-runs the survey for that tree.
6. **Per project, the concrete edits.** File-level where the survey allows it.
   This becomes the unit table's *Owns* column, so it must be disjoint per wave.
7. **Behaviour change or not.** Per project: does a user of the plugin or CLI
   see a difference? Drives the release proposal.
8. **New dependencies.** Does any edit need a package the tree does not already
   have? Name it, what for, and the existing thing it was preferred over. A unit
   adds no dependency the plan does not list.

## C. Rulings

9. **Every open design point.** One question each, approaches with trade-offs,
   recommended option first. The answer is quoted verbatim into the unit file
   that needs it, with the rejected alternative in the decisions table. Keep
   asking until no unit would have to invent a decision.
10. **Ordering.** Which units can run concurrently (disjoint paths, no
    dependency) and which must wait. The user overrides the derived order only
    where they know something the survey did not.
11. **Model per unit.** Default is the session's model. A unit the user wants on
    a stronger or cheaper tier records it in its file's `Model:` line.

## D. Gates and docs

12. **Gate deltas.** Which checker rule, test, or mise task must change or be
    added so the new behaviour is asserted, and which existing gate the change
    will break until it is adjusted. Each is an owned edit in a unit.
13. **Verification the orchestrator keeps.** Anything that cannot be proven by a
    diff — a real install via `target-verifier`, a scratch-repo run, a smoke
    test. Name it, name its pass condition.
14. **Docs the change falsifies.** Confirm the survey's list. The docs unit
    reconciles exactly these plus whatever `docs-reconciler` finds.

## E. Consent

15. **Landing.** May a fully green run merge to `develop` and push without a
    further prompt? Default when unanswered is **no**.
16. **Release, per affected project.** Release or not; patch, minor or major.
    Record every answer including "not this time". Note in the same breath that
    execute-plan always stops once before the `main` merge and tags — consent
    here is intent, not authorisation to run `i:release` or `plugins:release`.

## F. Parked

Anything raised during A–E that belongs to a later plan is written to the
*Parked* list before the next question is asked — never carried only in
conversation.

## G. The gate

17. **Present the shape** per SKILL.md §5 and ask once: approve, revise or
    abandon. Only an explicit approve writes the folder, and only a later
    explicit yes after self-review sets the status to `APPROVED`.
