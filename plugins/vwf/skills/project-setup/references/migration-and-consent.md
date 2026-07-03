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

**Structure enforcement** (toward the workspace shape): when an existing repo
does not match the enforced workspace structure, the dry-run plan **proposes**
the restructure — in-repo layout moves (`projects/`, `packages/`, project
naming) as normal batches; anything that crosses a repo boundary (e.g. splitting
into parent + submodules) only ever as a written recommendation. Consent rules
above apply unchanged. A decline is a **deviation**: record it in the registry's
`deviations:` block (scope, choice, reason) and do not re-propose it on later
runs.

**Idempotent re-run:** detect what already conforms and migrate only the delta;
a conforming repo produces an empty plan.
