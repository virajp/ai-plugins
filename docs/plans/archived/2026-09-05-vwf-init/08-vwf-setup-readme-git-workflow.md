# U8 — setup hands tooling to init; readme goes lowercase; git-workflow follows the task names

- **Wave:** 2
- **Depends on:** U1 (task names)
- **Owns:** `plugins/vwf/skills/setup/**`, `plugins/vwf/skills/readme/**`,
  `plugins/vwf/skills/git-workflow/**`. Touch nothing outside this list;
  `skills/init/` is U7's.
- **Model:** inherit
- **Read first:** `setup/SKILL.md` (the hard rule at `:55-58`, the mode table,
  `:80-85` blank classification); `setup/references/onboard-pipeline.md`
  (`:23-38` Tooling, `:63-87` deferral, `:157-180` code path);
  `setup/references/memory-tree.md` `:9`; `readme/SKILL.md` `:16-45`, `:68-76`;
  `git-workflow/SKILL.md` `:25-35`, `:140-155`;
  `git-workflow/references/landing.md` (whole), `references/worktree-setup.md`
  (whole);
  `plugins/stackgen/stacks/toolchain-manager/mise/skills/mise/
  references/task-library.md`
  as landed by U1 (mandatory set, legacy table);
  `plugins/stackgen/assets/output-tree.md` as landed by U5 (the lockfile shape
  detector).
- **Lazy-load:** `setup/references/migrate-pipeline.md`,
  `topology-
  detection.md` if the Tooling step is referenced there too (grep
  first).

## Ruling

D5: "Setup's Tooling step (both paths) moves wholesale into init; setup's
memory-tree gitignore lines become appends to init's sectioned file. Everything
else setup does stays."

D6: "setup detects the shape (the stack adapter's lockfile lists all three
unconditional slugs); if absent it offers `/vwf:init`; a decline is a recorded
deferral as today."

Reversal 2: "`/vwf:readme` creates `readme.md`, not `README.md`, when no readme
exists. Existing casing is still preserved."

Reversal 3: "`merge:develop` / `merge:main` become `code:merge:develop` /
`code:merge:main`. vwf's git-workflow skill (`SKILL.md:30-31`,
`references/landing.md:21,34,46`) moves with it."

Reversal 4: `worktree:init` → `setup:worktree` (`references/worktree-setup.md`).

D14: "git-workflow's commit sequence is `mise run code:precommit` → stage →
commit."

D21: an existing `README.md` is renamed by init, not by readme.

## Edits

1. **`setup/SKILL.md`** — the hard rule at `:55-58` becomes: "**Don't write repo
   tooling.** The repo shape — the toolchain manager's config and task library,
   the repo gates, the hygiene files — is `/vwf:init`'s. Setup checks for it and
   offers init; it never materializes a bundle itself. Never write a README by
   hand either — `/vwf:readme` owns it." The blank-repo classification at
   `:80-85` stays. Add to Step 0 a **shape check** before the mode fork: shaped
   = the stack adapter's lockfile records all three unconditional slugs (name
   them exactly as init does — `mise`, `repo-gates`, `repo-hygiene`, in one
   enumeration); unshaped → offer `/vwf:init`, which setup invokes (init is
   model-invocable); declined → record the deferral the way Tooling's deferral
   is recorded today, continue.
2. **`setup/references/onboard-pipeline.md`** — delete the Tooling step
   (`:23-38`) and rewrite §"Tooling defers rather than halting" (`:63-87`) as
   §"The shape check defers rather than halting" with the same deferral
   semantics; the code path's "Tooling, CLAUDE.md and the memory tree" (`:180`)
   drops Tooling; the memory-tree gitignore lines (`memory-tree.md:9`) are
   written as an append under a `# ==== vwf memory ====` banner into the
   sectioned `.gitignore` (idempotent by banner), never as bare lines.
3. **`readme/SKILL.md`** `:23-24` — "Update an **existing** readme in place —
   preserve its filename and casing; otherwise create `readme.md`." Keep
   everything else. In §Local Development (`:68-76`) prefer
   `mise run
   setup:all` and mention `setup:worktree` where worktrees are
   described.
4. **`git-workflow/SKILL.md`** — `:30-31`:
   `mise x -- mise run
   code:merge:develop <branch>` / `code:merge:main`; the
   commit procedure (`:140-155` region; find the step that stages) gains "run
   `mise x -- mise
   run code:precommit` **before** staging so autofixes fold
   into the same commit"; note that the merge tasks refuse a dirty tree and why.
5. **`git-workflow/references/landing.md`** — `:21,34,46`: the `code:merge:`
   names; "its `merge:` task" → "its `code:merge:` task".
6. **`git-workflow/references/worktree-setup.md`** — `worktree:init` →
   `setup:worktree` everywhere; describe what it does per U1 (submodule init,
   tool install, secrets, frozen deps install).

## Verification

- `mise run plugins:check` green: rule 10 silent on all three skills (the
  fixed-slug enumeration form passes today); rule 12 flags any line stating the
  old names as live — carry the exemption marker only on lines that deliberately
  name history.
- `grep -rn 'merge:develop\|merge:main\|worktree:init' plugins/vwf/skills/{setup,readme,git-workflow}`
  returns only `code:merge:*` / `setup:worktree` hits.
- `grep -n 'README.md' plugins/vwf/skills/readme/SKILL.md` returns only the
  existing-casing sentence.
- `grep -n 'repo-gates' plugins/vwf/skills/setup/**` finds only the shape-check
  enumeration.

## Guardrails

- Do not create or edit `plugins/vwf/skills/init/**` (U7).
- Do not touch `plugins/vwf/skills/doctor/**` — a repo-shape finding is parked.
- `plugins/**/*.md` is not dprint-formatted; match fold width by hand.
- Strict-YAML frontmatter unchanged unless the description must change; if it
  does, keep it one line and colon-free.
- Write with Write/Edit; `cat` is `bat`.

## Commit

`feat(vwf): setup offers /vwf:init for the repo shape, readme defaults to lowercase, git-workflow follows code:merge and setup:worktree`
— written by the orchestrator after the wave gate, not by the unit.
