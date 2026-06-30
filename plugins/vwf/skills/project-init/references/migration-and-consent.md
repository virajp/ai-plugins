# Migration & Consent

Onboarding may create docs and **move source** — both only with consent.

**Always:**

- Produce a **dry-run plan** first: every file created, moved, or updated,
  grouped by kind (docs scaffold / code restructure / CLAUDE.md / README /
  tooling). Nothing is written until the plan is approved.
- Work in an isolated **git-workflow worktree**. Keep it local; do not push.
- **Never delete.** Supersede by moving; leave originals discoverable. Never
  overwrite a file without consent — merge instead.

**Code restructuring** (to match the registry topology):

- Approve **per batch** (e.g. one project's move at a time), not one bulk yes.
- **Move, don't rewrite** — keep history with `git mv`. Touch imports/paths only
  as far as the move needs to keep things building.
- If a move is ambiguous or risky, record it as a **recommendation** instead of
  doing it.

**Idempotent re-run:** detect what already conforms and migrate only the delta;
a conforming repo produces an empty plan.
