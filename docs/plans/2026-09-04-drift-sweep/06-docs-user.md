# U6 — user-facing docs: readme, installer, plugins, how-to

- **Wave:** 2
- **Depends on:** U1, U2, U3, U4, U5
- **Owns:** `readme.md`, `docs/installer/**`, `docs/plugins/**`,
  `docs/how-to/**`
- **Model:** inherit
- **Read first:** every owned file named below, top to bottom, before editing.
  Read the `docs-reconciler` findings the orchestrator passes in, and every
  `DOCS FALSIFIED:` line from wave 1 whose path is in this unit's tree.
- **Lazy-load:** the authoritative sources listed in index.md's facts section,
  as each edit needs them; `plugins/stackgen/stacks/bundles/` for bundle names.

## Ruling

Quoted from index.md:

> 11 — Counts in prose: Volatile counts (mempalace tool count, `/vwf:` command
> count) are removed; structural ones corrected (four repo gates, eight
> TypeScript bundles); version examples become `X.Y.Z` placeholders.

> 16 — Design tool in `docs/plugins/vwf.md`: "The design tool", agnostic; Claude
> Design named only as an example where one helps.

> 17 — Doctor's mise rule in installer docs: Conditional wording matching
> `readme.md:64-66`.

> 18 — Upgrade path in `migrate-old-vwf-repo.md`:
> `claude plugin marketplace update virajp-plugins` then
> `claude plugin update vwf`.

> 1 — Retired `web` platform token, 3 — six axes, 5 — harness stamp gains
> `goldens` and `test:load`, 6 — cloud-service categories gain `identity` and
> `messaging`, 7 — composition order gains `toolchain-gate`: wherever a
> user-facing doc states the old value, it states the new one.

## Edits

Survey findings, each verified on 2026-09-04:

1. **`readme.md`** — line 199: "Sixteen `/vwf:` commands" loses the number ("The
   `/vwf:` commands …"). Line 158: the adaptation prompt's "declares the MCP
   servers, LSP servers and dependencies" drops "LSP servers"; no plugin in this
   marketplace declares `lspServers` — language servers come from the local
   plugin stackgen writes.
2. **`docs/installer/targets.md`** — line 7: the table row crediting
   `claude plugin install` with writing "MCP and LSP servers" drops LSP.
3. **`docs/installer/usage.md`** — line 120 and **`docs/installer/index.md`**
   lines 75-76: "blocks on a missing `mise` or `graphify`" becomes the
   conditional the readme states at 64-66: graphify always, `mise` once a stack
   axis is pinned.
4. **`docs/plugins/stackgen.md`** — line 102: "its five repo gates" becomes four
   (dprint, gitleaks, grype, pre-commit), consistent with line 281.
5. **`docs/plugins/mempalace.md`** — line 5: "It ships 33 MCP tools" loses the
   number.
6. **`docs/plugins/vwf.md`** — lines 717, 893-896, 915, 1027, 1109, 1121, 1144:
   Claude Design as *the* design tool becomes "the design tool" resolved through
   the adapter, matching lines 111-118 of the same file and
   `skills/design-system/SKILL.md:22-27`; where an example helps, "for example
   Claude Design". Line 700: "Since format 19 it is not its own role" becomes
   format 22, per `assets/templates/registry.yaml:23-27` and
   `format-lineage.md:43`. Line 1859: `transport: http` becomes `type: http`,
   the manifest's key. Any `web` platform mention, "four axes" phrasing, or
   six-key harness stamp example in this file follows rulings 1, 3 and 5.
7. **`docs/how-to/operate/production-feedback-loop.md`** — line 184: "any of
   five things" becomes six, listing them as `skills/feedback/SKILL.md:86-93`
   does.
8. **`docs/how-to/greenfield/cli-product.md`** — lines 99-103: a cli-only
   registry takes the text-only path and skips the adapter resolution entirely;
   Terminal UX is elicited by the command itself (§5). Rewrite the passage to
   say that; drop the "rather than something the import hands you" advice.
9. **`docs/how-to/greenfield/ui-with-design-tool.md`** — lines 318-323: the
   halts are exactly three (no design tool configured; configured tool not
   materialized; adapter returned nothing usable), per
   `assets/design-adapter.md:96-102`. Remove the fourth.
10. **`docs/how-to/brownfield/onboard-existing-codebase.md`** — line 359: an
    axis or platform with nothing fitting no longer halts; it can be deferred as
    `unresolved` (`assets/stack-vocabulary.md:189-196`). Also any "four axes"
    phrasing in this file follows ruling 3.
11. **`docs/how-to/brownfield/migrate-old-vwf-repo.md`** — line 28: "The upgrade
    itself is just re-running the installer" becomes the two commands in ruling
    18, with one clause saying the installer never updates an installed plugin.
12. **`docs/how-to/operate/choosing-your-stack.md`** — line 63: the repo axis
    offers `bun`, `pnpm-workspace`, `pnpm-turbo`; a single-package repo pins no
    workspace bundle (`docs/plugins/stackgen.md:126`); `pub` is a pack inside
    `dart-flutter`, not a bundle.
13. Any passage the `docs-reconciler` or a wave-1 `DOCS FALSIFIED:` line names
    under this unit's paths.

## Verification

- `mise run code:format` reports nothing under the owned paths (`readme.md` is
  dprint-formatted; widening a table cell re-pads the table — let dprint do it).
- The plan-specific greps in index.md's wave gate return nothing under
  `readme.md` and `docs/` except historical passages that name themselves so.
- `grep -rn 'Sixteen\|five repo gates\|33 MCP\|LSP servers' readme.md docs/installer docs/plugins`
  returns nothing (an "LSP" mention that correctly credits stackgen's local
  plugin is fine).
- Every relative link in an edited file resolves (`grep -o '](\.[^)]*)'` and
  test each).

## Guardrails

- Do not touch `docs/memory/**` or `docs/plans/**` — historical.
- Do not touch `CLAUDE.md`, `installer/CLAUDE.md`, `.claude/**` (U7) or any file
  under `plugins/` (wave 1, closed).
- Edit only what a finding falsifies; leave adjacent prose, even where you would
  phrase it differently.
- Byte-copy, never retype, any line you are not changing.

## Commit

`docs: reconcile the user-facing docs with the plugins and installer` — written
by the orchestrator after the wave gate, not by the unit.
