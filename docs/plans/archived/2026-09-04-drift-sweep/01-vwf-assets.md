# U1 — vwf assets: retire `web`, six axes, template shape, harness stamp

- **Wave:** 1
- **Depends on:** —
- **Owns:** `plugins/vwf/assets/**`
- **Model:** inherit
- **Read first:** every owned file named below, top to bottom, before editing.
  Read `plugins/vwf/assets/standard-flows.md:100-140` and
  `plugins/vwf/assets/stack-adapter.md:150-240,320-370` first — they are the
  authorities the edits align to.
- **Lazy-load:**
  `plugins/stackgen/skills/stackgen-stack-template/SKILL.md:70-95` (the real
  template payload), `plugins/vwf/assets/delivery-pipeline.md` and
  `plugins/vwf/skills/plan/references/delta-checks.md` (the readers of `goldens`
  and `test:load`; read-only, not owned).

## Ruling

Quoted from index.md:

> 1 — Retired `web` platform token: Replace with `site` / `webapp` per
> `standard-flows.md` at every live site; screens brief filenames become
> `site.md | webapp.md`; example platform files title `— webapp`. Lineage and
> synonym-normalization rows are untouched.

> 2 — UX gate name: The unprefixed `ux-gate` per `stack-adapter.md:325-334`, at
> all five sites.

> 3 — Axis count: Six everywhere, per `stack-adapter.md`'s enum.

> 4 — Template shape in vwf: vwf stops describing stackgen's template shape:
> delete the per-axis frontmatter blocks and the `stacks/project/<slug>.md` /
> `stacks/<axis>/<slug>.md` path claims; keep only the payload contract. Drop
> the "`plugins:check` enforces `axis:`" claim. Drop `private_plane` from both
> plugins.

> 5 — Harness capabilities: Stamp schema and example gain `goldens` and
> `test:load`; Flutter's harness key renames `screenshots` → `goldens`, same
> task `test:golden`. (The Flutter half is U3's.)

> 20 — `memory.md` example seeds the seven protocol rooms;
> `execute-stages.md:91` says every screen surface, not "web".

## Edits

1. **`assets/vwf-config.md`** — line 122: the per-platform canvas comment
   enumerates `mobile | tablet | desktop | web | auto`; make it
   `mobile | tablet | desktop | auto | site | webapp`, still citing
   `assets/standard-flows.md`. Lines 93-100: the `harness:` schema gains
   `goldens` and `test:load` as boolean keys with the same one-line comment
   shape as the six present, each noting the "required when" from `harness.md`.
   Line 103: `(assets/topologies/, assets/stacks/)` — remove `assets/stacks/`;
   the stacks half became stackgen's menu, say so in the same clause. Lines 307,
   532, 551 are migration rows and stay.
2. **`assets/design-adapter.md`** — lines 118 and 200: the platform enums in the
   screens and conversations payload schemas replace `web` with `site | webapp`.
3. **`assets/templates/screen-prompt.md`** — line 4: `web.md` becomes
   `site.md | webapp.md`, matching `assets/templates/flow-platform.md:6`.
4. **`assets/templates/project-claude.md`** — line 47: same replacement.
5. **`assets/examples/blueprint/flows/web/100-home/webapp.md`,
   `.../110-place-order/webapp.md`, `.../120-cancel-refund/webapp.md`** — line 3
   of each: the title suffix `— web` becomes `— webapp`, per
   `assets/templates/flow-platform.md:3`. The directory name `flows/web/` is a
   section name, not a platform; leave it.
6. **`assets/stack-vocabulary.md`** — lines 67, 85, 117: "four" axes becomes
   six, naming `project | backing | deploy | repo | design | cicd`. Lines
   105-106: delete the sentence claiming `plugins:check` enforces `axis:`; keep
   the statement that every payload declares `axis:`. Lines 110-155: delete the
   "Template frontmatter" per-axis blocks and the
   `<plugin>/stacks/project/<slug>.md` path claim entirely; replace with one
   short paragraph: a stack plugin's template files are its own business; what
   vwf contracts is the payload `stackgen-stack-template` returns, whose keys
   are listed in `stack-adapter.md`'s payload section. No `private_plane`
   anywhere in the file afterwards.
7. **`assets/stack-adapter.md`** — line 189: delete "Templates sit flat under
   `stacks/project/` and declare their platforms in frontmatter; a plugin that
   still keys them on a `stacks/project/<role>/` directory is on the pre-22
   contract" and replace with "A template's platforms come from its payload, not
   from any directory". Line 368: item 4 becomes "the templates themselves, in
   the plugin's own tree — their layout is the plugin's business; only the
   payload is contracted", with no path pattern. Line 194's heading "The two
   tool axes" — read the section; if it introduces `design` and `cicd` as the
   two *tool* axes distinct from the four *stack* axes, leave the heading and
   make sure the surrounding prose says six axes total. Otherwise rename to
   match the enum at 162/229.
8. **`assets/harness.md`** — lines 46-55: the example stamp gains
   `goldens: false # no device platform` and
   `test:load: false # below the load
   threshold` (or equivalent one-line
   comments) so the example carries all eight keys.
9. **`assets/execute-stages.md`** — lines 32 and 91: `<plugin>-ux-gate` / "the
   `-ux-gate` of the plugin" becomes the repo's own `ux-gate` skill in
   `.claude/skills/`, as `stack-adapter.md:325-334` states. Line 91: "For a
   **web** slice it renders the changed screens" becomes "For any slice with a
   screen surface it renders the changed screens", consistent with line 31 and
   with `agents/execute-ux-reviewer.md:74`'s one-path rule.
10. **`assets/engineering-baseline.md`** — line 12: "the realization notes live
    in `assets/stacks/`" — realization notes now live in the pinned stackgen
    bundle's `conventions` payload; say that.
11. **`assets/memory.md`** — lines 159-165: the `mempalace.yaml` example seeds
    the seven protocol rooms the requirement at 172-173 names, in the same order
    that requirement lists them. `general` disappears.

## Verification

- `mise run plugins:check` passes.
- `mise run code:format` reports nothing to change under `plugins/vwf/assets/`.
- The backticked `web` token is gone from live lines:

  ```sh
  grep -rn '`web`' plugins/vwf/assets | grep -v 'retired\|migration\|→'
  ```

  returns nothing.
- `grep -rn 'private_plane\|stacks/project/\|assets/stacks/' plugins/vwf/assets`
  returns only migration rows in `vwf-config.md`.
- `grep -rn -- '-ux-gate' plugins/vwf/assets` returns nothing.
- `grep -c 'goldens' plugins/vwf/assets/vwf-config.md plugins/vwf/assets/harness.md`
  is at least 1 and 2 respectively.

## Guardrails

- Do not touch `plugins/vwf/skills/**`, `plugins/vwf/agents/**` (U2) or anything
  under `plugins/stackgen/` (U3). If a skill cites an asset line you changed in
  a way that now reads wrong, return it as `DOCS FALSIFIED:`.
- `plugins/**/*.md` is not dprint-formatted: match the surrounding fold width by
  hand.
- Strict-YAML frontmatter: an edit that breaks a template's frontmatter drops it
  silently. Re-read every edited frontmatter block.
- Byte-copy, never retype, any line you are not changing.
- Do not rename `assets/examples/blueprint/flows/web/` — it is a section
  directory.

## Commit

`fix(vwf): retire the web platform token, six axes, drop the template-shape
claims, stamp goldens and test:load`
— written by the orchestrator after the wave gate, not by the unit.
