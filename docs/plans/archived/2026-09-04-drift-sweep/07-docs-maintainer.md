# U7 — maintainer docs: CLAUDE.md, .claude/, the agents and skills

- **Wave:** 2
- **Depends on:** U1, U2, U3, U4, U5
- **Owns:** `CLAUDE.md`, `installer/CLAUDE.md`, `.claude/docs/**`,
  `.claude/skills/**`, `.claude/agents/**`
- **Model:** inherit
- **Read first:** every owned file named below, top to bottom, before editing.
  Read the `docs-reconciler` findings the orchestrator passes in, and every
  `DOCS FALSIFIED:` line from wave 1 whose path is in this unit's tree. Read the
  wave-1 diff of `scripts/src/check.ts` to describe the twelfth rule accurately.
- **Lazy-load:** `.claude-plugin/marketplace.json` (the git-subdir source
  shape), `installer/src/args.ts`, `installer/src/install.ts:40-100`,
  `installer/src/uninstall.test.ts:470-610`, `.config/pre-commit-config.yaml`
  (post-U5 order), `.github/workflows/plugins.yml`.

## Ruling

Quoted from index.md:

> 12 — Gate order: docs say vitest and tsc are CI-only.

> 15 — `language-plugins.md`: Deleted; its reference dropped from
> `plugin-authoring/SKILL.md`. stackgen's `language-bundle` kind is the
> successor.

> 21 — `target-verifier.md`: Five claims rewritten to current reality; the
> "Receipt:" line in its output section dropped.

> 22 — `dependencies.md:17-20` spliced sentence: Predicate restored from
> `git log -p`.

> 11 — Counts in prose: version examples become `X.Y.Z` placeholders.

> 14 — New gate: the twelfth `plugins:check` rule (documented here; U4 wrote
> it).

## Edits

Survey findings, each verified on 2026-09-04:

1. **`CLAUDE.md`** — line 120: "Run locally via pre-commit **and** in
   `plugins.yml`" heads a list where `vitest run` (133) and `tsc --noEmit` (134)
   are CI-only. Mark those two rows as `plugins.yml` only. Every "eleven rules"
   / "eleven checker rules" mention becomes twelve (the Read table's
   `plugin-authoring` row, the Tasks list). Any "four axes" phrasing follows the
   six-axis ruling.
2. **`.claude/docs/repo-shape.md`** — line 114: the same gate-placement
   correction; the checker section gains the twelfth rule in the same form as
   the eleven.
3. **`.claude/skills/plugin-authoring/references/checks.md`** — line 6: the
   heading "The two tasks" becomes a heading that covers the five-row table
   (name it by what the table is); add the missing `plugins:inventory` row; line
   11's `plugins:marketplace` row says the task generates both manifests plus
   the staging directory. Lines 16-18: the ordering claim now holds in both
   places after U5 — state it as "freshness before validity, in pre-commit and
   in `plugins.yml`". Add the twelfth rule's description: what it matches, the
   exemption forms, and that a legitimately historical line is exempted by
   adding the narrowest keyword, never by deleting a pattern.
4. **`.claude/skills/plugin-authoring/SKILL.md`** — line 4: the frontmatter
   description's "the two mise tasks" matches the body's count at 46-50 (three).
   Strict YAML: keep the description valid. Drop the reference to
   `references/language-plugins.md` and any sentence that exists only to point
   there; where the skill mentions "the language-plugin contract", say it is
   retired and stackgen's `language-bundle` kind is the successor.
5. **`.claude/skills/plugin-authoring/references/language-plugins.md`** — delete
   the file (`git rm`).
6. **`.claude/skills/vwf-plugin/references/dependencies.md`** — lines 17-20:
   restore the lost predicate. Run `git log -p --follow -- <file>` and take the
   sentence from the commit before the splice; if no prior version has it, write
   the shortest sentence that makes both halves true and record it as
   `DECIDED:`.
7. **`.claude/agents/target-verifier.md`** — lines 82-88: adding the marketplace
   from a local path tests the working tree only through the dev marketplace;
   the published manifest's entries are `git-subdir` sources fetched from GitHub
   at the pinned tag even when registered from a local directory
   (`.claude/docs/ci-and-releases.md:97-101`). Say that, and point the verifier
   at `.dev-marketplace` for working-tree runs. Line 98: `--all` is live
   (`installer/src/args.ts:78`); rewrite. Lines 130-131: `uninstall.test.ts`
   still carries the legacy-receipt assertions (`:477`, `:542`, `:602`); rewrite
   to match `installer/CLAUDE.md:189`. Line 279: `@askviraj/claude-status`
   becomes `claude-status`, installed by Homebrew. Line 292: drop the "Receipt:"
   output requirement, since lines 38 and 126-128 say nothing writes one.
8. **`.claude/docs/dev-marketplace.md`** — line 31: the sample plugin-list
   output's `0.19.0+1` becomes `X.Y.Z+1`, with the surrounding prose adjusted if
   it reads the number. Lines 104-106 already record the symlink retirement;
   leave.
9. **`.claude/docs/plugins.md`** — line 78: `"ref": "vwf-v19.9.0"` becomes
   `"ref": "vwf-vX.Y.Z"`.
10. **`.claude/skills/vwf-plugin/`** and **`.claude/skills/stackgen-plugin/`** —
    read both SKILL.md files and their references against wave 1's diff: the
    harness stamp keys, the six axes, the `ux-gate` name, the dropped
    template-shape claims, the new cloud-service categories, the composition
    order. Correct any passage the diff falsified.
11. **`.claude/skills/release/SKILL.md`** — no survey finding; read it once
    against the post-landing checklist in index.md and change nothing unless a
    sentence is false.
12. Any passage the `docs-reconciler` or a wave-1 `DOCS FALSIFIED:` line names
    under this unit's paths.

## Verification

- `mise run code:format` reports nothing (`CLAUDE.md` and `installer/CLAUDE.md`
  are dprint-formatted; widening a table cell re-pads every row — let dprint do
  it).
- `grep -rn 'eleven' CLAUDE.md .claude/` returns nothing that refers to the
  checker's rule count.
- `grep -rn 'language-plugins' .claude/ CLAUDE.md` returns nothing.
- The five false claims are gone:

  ```sh
  grep -n 'retired\|@askviraj/claude-status\|no longer carries these assertions\|Receipt:' .claude/agents/target-verifier.md
  ```

  returns nothing that calls `--all` retired, names the old statusline package,
  denies the legacy-receipt tests, or requires a receipt in the output.
- `grep -rn '0\.19\.0\|vwf-v19\.9\.0' .claude/docs` returns nothing.
- Every relative link in an edited file resolves; the `[01-x.md](01-x.md)`
  placeholder in `.claude/skills/create-plan/references/plan-template.md` is a
  template placeholder and stays.

## Guardrails

- Do not touch `readme.md` or `docs/**` (U6), any file under `plugins/` (wave 1,
  closed), `.claude-plugin/**`, or `.claude/worktrees/**`.
- Do not touch `.claude/skills/create-plan/**` or
  `.claude/skills/execute-plan/**` except for a passage a finding names — the
  running plan's own tooling is not in scope.
- Edit only what a finding falsifies; leave adjacent prose.
- Byte-copy, never retype, any line you are not changing.

## Commit

`docs: reconcile the maintainer docs, the target-verifier agent and the
plugin-authoring skill with the tree`
— written by the orchestrator after the wave gate, not by the unit.
