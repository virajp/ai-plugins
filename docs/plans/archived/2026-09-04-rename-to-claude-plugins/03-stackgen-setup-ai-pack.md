# U3 — stackgen `setup/ai` pack: new repo path, explicit marketplace names

- **Wave:** 1
- **Depends on:** —
- **Owns:**
  `plugins/stackgen/stacks/toolchain-manager/mise/config/.config/mise/tasks/setup/ai`
- **Model:** inherit
- **Read first:** the owned file, top to bottom, before editing.
- **Lazy-load:** `.claude/skills/stackgen-plugin/SKILL.md` (where pack payloads
  land in a target repo — orientation only)

## Ruling

Quoted from index.md:

> 8 — `setup/ai` pack shape: Explicit `source|name` pairs —
> `virajp/claude-plugins|virajp-plugins` — replacing the basename derivation;
> the `|| true` stays. Rejected: path-only edit, parking the no-op.

> 2 — Marketplace name: `virajp-plugins` stays.

Survey fact: today line ~24 lists `"virajp/ai-plugins"` and line ~35 runs
`claude plugin marketplace update "${marketplace##*/}"`, which derives
`ai-plugins` — not the marketplace name — so the update silently no-ops under
`|| true`.

## Edits

1. **The `MARKETPLACES` array and its loop** — each entry becomes a
   `source|name` pair, e.g. `"virajp/claude-plugins|virajp-plugins"`. The
   comment above the array says a row is `<github-source>|<marketplace-name>`
   and why the name cannot be derived from the source. In the loop, split the
   row on `|` (`source="${row%%|*}"; name="${row##*|}"`), pass `source` to
   `claude plugin marketplace add` and `name` to
   `claude plugin marketplace update`, and print the pair in the `print_yellow`
   line. Both `|| true` stay. Keep the `set`/helper sourcing and everything
   outside that block exactly as it is.

## Verification

- `bash -n` on the file — parses.
- `mise run plugins:check` — green (the pack is a payload, not a skill, but the
  checker walks the tree).
- `grep -n "ai-plugins\|##\*/" <the file>` returns nothing.
- A dry read of the loop with `MARKETPLACES=("a/b|c")` in a scratch shell shows
  `add a/b` and `update c`.

## Guardrails

- This file is copied into user repos and runs under **BSD `sed`** and macOS
  bash 3.2 as well as Linux: no `${var,,}`, no associative arrays, no `sed -i`
  without a suffix. Parameter expansion `%%|*` and `##*|` is fine.
- `plugins/**` is **not** dprint-formatted; match the surrounding style by hand.
- Do not touch any other file under `plugins/stackgen/`, and do not bump the
  stackgen version — U7 does.
- Do not edit docs; `docs/plugins/stackgen.md` and the stackgen home skill may
  describe this task — report as `DOCS FALSIFIED:`.

## Commit

`fix(stackgen): name the marketplace explicitly in the setup/ai pack task` —
written by the orchestrator after the wave gate, not by the unit.
