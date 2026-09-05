# U5 — Rule 11's root allowlist gains `wrangler.jsonc`

- **Wave:** 1
- **Depends on:** —
- **Owns:** `scripts/src/check.ts`, `scripts/src/check.test.ts`,
  `plugins/stackgen/stacks/repo-hygiene/repo-hygiene/conventions.md`. Touch
  nothing outside this list.
- **Model:** inherit
- **Read first:** `scripts/src/check.ts` — the root allowlist constant near
  `:300-312` (the array containing `"fnox.toml"` and `"readme.md"`) and
  `checkPackConfigTier`; the matching cases in `check.test.ts` (the pass fixture
  and the "unallowlisted root file" case);
  `plugins/stackgen/stacks/repo-hygiene/repo-hygiene/conventions.md:20-30` (the
  allowlist prose); `.claude/skills/plugin-authoring/references/checks.md` §rule
  11 (read only — U6 edits it).
- **Lazy-load:** `plugins/stackgen/assets/output-tree.md:142-150`, which U2 is
  editing to the same list; the two must agree when both land.

## Ruling

D5: "Add `wrangler.jsonc` to the root allowlist": the allowlist gains it in
every place that carries it — `output-tree.md`, `materializer.md`, hygiene
`conventions.md`, `check.ts` and its test. (This unit owns the last three; U2
owns the first two.)

## Edits

1. **`scripts/src/check.ts`** — the root allowlist array gains
   `"wrangler.jsonc"`, with a one-line comment in the array's existing style
   naming why it is there (a deploy tool that discovers its config only at the
   root; shipped by a `static-hosting` pack). Keep the array sorted the way it
   is today, whatever that order is.
2. **`scripts/src/check.test.ts`** — the pass fixture for the config tier gains
   a `config/wrangler.jsonc`, proving the file is accepted; and one new negative
   case proves a *different* root name (e.g. `config/netlify.toml`) is still
   refused, so the widening is exactly one name.
3. **`repo-hygiene/conventions.md:26-27`** — the allowlist sentence gains
   `wrangler.jsonc` in the same position U2 gives it in `output-tree.md` (after
   `eslint.config.mjs`, "the linter's shim"), with the same one-clause reason,
   so the three restatements read as one list.

## Verification

- `pnpm vitest run` passes, including the new negative case.
- `pnpm exec tsc --noEmit -p scripts` is clean.
- `mise run plugins:check` exits 0 on the tree as it stands when you finish —
  and, once U3's pack is present in the same worktree, still exits 0 with
  `wrangler.jsonc` accepted. If U3 has not landed when you verify, say so.
- `grep -n "wrangler.jsonc" scripts/src/check.ts scripts/src/check.test.ts
  plugins/stackgen/stacks/repo-hygiene/repo-hygiene/conventions.md`
  hits all three.

## Guardrails

- Do not edit `output-tree.md` or `materializer.md` (U2's), any other pack, or
  `.claude/skills/plugin-authoring/references/checks.md` (U6's — report the
  passage as `DOCS FALSIFIED:` instead).
- Widen by exactly one name. Do not generalise the allowlist to a glob or a
  category.
- `plugins/**/*.md` is not dprint-formatted; `scripts/**` is. `cat` is aliased
  to `bat` — Write/Edit only.

## Commit

`ops: allow wrangler.jsonc at a pack's config root` — written by the
orchestrator after the wave gate, not by the unit.
