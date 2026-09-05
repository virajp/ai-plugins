# U6 — Docs reconciled, and the reservation reversal recorded

- **Wave:** 2
- **Depends on:** U1, U2, U3, U4, U5
- **Owns:** `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `.claude/docs/**`,
  `.claude/skills/stackgen-plugin/**`, `.claude/skills/plugin-authoring/**`,
  `.claude/skills/vwf-plugin/**`, `site/src/content/docs/**`,
  `docs/memory/decisions/*`. Touch nothing outside this list.
- **Model:** inherit
- **Read first:** index.md's **Facts** and **Run log** (the account of what
  actually landed), then the `docs-reconciler` findings the orchestrator passes
  in, then every `DOCS FALSIFIED:` line the wave-1 units returned.
- **Lazy-load:** the wave-1 diff (`git diff <base>..HEAD`) for any passage whose
  falsification you need to verify rather than take on report.

## Ruling

The whole assumed-decisions table, as the docs must describe the tree that
landed. Specifically the reversal in the Goal: the reservation of Workers in
`cloudflare-zero-trust.md` and the provider's `conventions.md` is redeemed for
Workers Static Assets, and a decision doc records it.

## Edits

1. **`docs/memory/decisions/2026-09-05-workers-static-assets-redeems-the-
   cloudflare-reservation.md`**
   — new. What was decided before (the reservation, dated to the zero-trust
   pack's arrival, quoting the sentence), what changed (Workers Static Assets
   offered as `cloudflare-workers-static`; a Worker script, Pages, R2, D1, KV,
   Durable Objects, Queues, Images and Stream still reserved), why (the first
   greenfield `/vwf:init` → architecture run on a `site` project had nothing on
   the deploy axis whose artifact is a directory of files), and the two doctrine
   widenings that rode with it (`wrangler.jsonc` on the root allowlist; cloud
   packs last in composition) with their rejected alternatives from the table.
2. **`site/src/content/docs/plugins/stackgen.md`** — the deploy stacks are
   described wherever the manual lists bundles or kinds: add the
   `cloudflare-workers-static` bundle beside `cloudflare-zero-trust` with one
   sentence on what it lays down and that the two pair; the kinds section's
   `cloud-service` category list gains `static-hosting`; the output section's
   root allowlist and composition order match `output-tree.md` as U2 left it.
   Confirm every link and anchor resolves — `site:check` is the gate.
3. **`.claude/skills/stackgen-plugin/SKILL.md`** — wherever it enumerates the
   categories, the composition order, the root allowlist, or "which packs ship a
   `config/` tree", update to match. The pack inventory counts are generated
   (`inventory.md`); do not hand-type a count.
4. **`.claude/skills/plugin-authoring/references/checks.md`** — rule 11's
   allowlist sentence gains `wrangler.jsonc` with its reason, matching U5's
   `check.ts` comment.
5. **`readme.md`** — the stackgen paragraph, if it names the kinds or the
   Cloudflare coverage, is brought current in one clause; nothing else.
6. **`.claude/skills/vwf-plugin/**`** — only if the reconciler finds a passage
   falsified (the vwf side did not change; expect nothing here).
7. Every `DOCS FALSIFIED:` line the wave-1 units returned, verified against the
   diff before applying.

## Verification

- `mise run site:check` exits 0 — every internal link and fragment resolves.
- `mise run plugins:check` exits 0.
- `dprint check` is clean over every file you touched under `readme.md`,
  `CLAUDE.md`, `site/CLAUDE.md`, `.claude/docs/**` and
  `site/src/content/
  docs/**` (all dprint-formatted) — run this repo's
  formatter over them rather than hand-padding.
- `ls docs/memory/decisions/2026-09-05-workers-static-assets-*.md` exists.

## Guardrails

- Do not edit anything under `plugins/` — a stale passage there is another
  unit's and is reported, not fixed.
- `readme.md`, `CLAUDE.md`, `site/CLAUDE.md` and `site/src/content/docs/**`
  **are** dprint-formatted at 80 cols: widening one table cell re-pads the
  table; let the formatter do it.
- `cat` is aliased to `bat` — Write/Edit only. A pipe containing `npm` is
  rewritten to `pnpm` — use Write for any such line.
- Do not describe the reserved services as "coming soon"; describe them as
  reserved by name, which is what the packs say.

## Commit

`docs: document the workers-static-assets pack, the static-hosting category and the redeemed reservation`
— written by the orchestrator after the wave gate, not by the unit.
