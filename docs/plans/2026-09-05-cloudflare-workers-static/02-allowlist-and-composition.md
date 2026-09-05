# U2 — `wrangler.jsonc` on the root allowlist; cloud packs last in composition

- **Wave:** 1
- **Depends on:** —
- **Owns:** `plugins/stackgen/assets/output-tree.md`,
  `plugins/stackgen/skills/stackgen-stack-template/references/materializer.md`.
  Touch nothing outside this list.
- **Model:** inherit
- **Read first:** both owned files top to bottom — especially
  `output-tree.md:142-150` (the root allowlist), `:173-185` (the composition
  order and why the two ends are where they are), `:194-216` (the reopened fence
  and its four exclusions), and `materializer.md:57-68` (the allowlist as the
  materializer enforces it) plus its composition-order paragraph.
- **Lazy-load:**
  `docs/memory/decisions/2026-09-05-charter-fence-opens-for-gate-
  configs.md`
  for the voice the fence prose was written in.

## Ruling

D5: "Add `wrangler.jsonc` to the root allowlist": the pack ships
`config/wrangler.jsonc` at the repo root, and the allowlist gains it in every
place that carries it — `output-tree.md`, `materializer.md`, hygiene
`conventions.md`, `check.ts` and its test. (This unit owns the first two; U5
owns the last three.)

D6: "Last, after capability-provider": `cloud-provider` then `cloud-service`
components land after every other type, so a deploy target's file wins over
anything a language or provider pack guessed.

## Edits

1. **`output-tree.md:142-150`** — the allowlist sentence "These files, and only
   these, may sit at a shaped repo's root: …" gains `wrangler.jsonc` after
   `eslint.config.mjs`, and one sentence of reasoning: a deploy tool that
   discovers its config only at the root is the same exception the linter's shim
   already is, and the ceiling-not-licence rule that follows applies to it
   unchanged — only a `static-hosting` pack ships it.
2. **`output-tree.md:173-178`** — the composition order gains `cloud-provider`
   then `cloud-service` **after** `capability-provider`. The paragraph that
   follows ("The two ends are what the order is for … the provider goes last
   because …") must be corrected: the secrets provider is no longer the last
   end. Rewrite it so both reasons still hold — the manager first because it
   ships the baseline, the deploy target last because it is the most specific
   thing a repo pins and nothing may overwrite its config — and state that no
   cloud pack shipped a `config/` tree before 2026-09-05, which is why the two
   types were absent.
3. **`materializer.md:57-68`** — the allowlist bullet gains `wrangler.jsonc`
   with the same one-clause reason. The list must be byte-for-byte the same set
   as `output-tree.md`'s after this edit; the two files restate one list.
4. **`materializer.md` composition-order paragraph** — the same two types
   appended last, with the same one-line reason. The materializer says it
   restates the order where an implementer meets it, so the restatement must
   match edit 2.

## Verification

- `mise run plugins:check` exits 0.
- `grep -n "wrangler.jsonc" plugins/stackgen/assets/output-tree.md
  plugins/stackgen/skills/stackgen-stack-template/references/materializer.md`
  hits both files.
- `grep -n "cloud-service" plugins/stackgen/assets/output-tree.md` hits the
  composition-order paragraph; the same grep over `materializer.md` hits its
  restatement.
- The two allowlists agree: extract each as a sorted set of backticked names and
  diff them — empty.

## Guardrails

- Do not edit `taxonomy.md` or `kinds.md` (U1's), `check.ts` (U5's), the hygiene
  pack (U5's), or any pack or bundle (U3's, U4's).
- `plugins/**/*.md` is not dprint-formatted: match the surrounding fold width by
  hand. `cat` is aliased to `bat` — use Write/Edit.
- Keep the fence's "four things stay outside" enumeration untouched: this unit
  widens the root allowlist, not the fence.

## Commit

`feat(stackgen): allow wrangler.jsonc at the root and land cloud packs last` —
written by the orchestrator after the wave gate, not by the unit.
