# Gaps — editing `plugins/vwf/` does not change the vwf that runs

**Date** 2026-08-26 · **Branch** `main` · **Tag** `ws2/toolchain`

Mirrors the mempalace drawer (wing `ai-plugins`, room `gaps`); both stores
written together, per `plugins/vwf/assets/memory.md`.

Found at the start of WS2 (Stage 3 of
[the generalization plan](../../plans/2026-08-26-vwf-generalization/index.md)),
while about to run `/vwf:architecture` against this repo for the first time.

## The gap

**An edit to `plugins/vwf/` reaches nothing until it is committed, the
marketplace is updated, the plugin is updated, and the session is restarted.**

The marketplace *source* really is a directory pointing at this checkout
(`~/.claude/plugins/known_marketplaces.json`). But installation **copies**:
`installed_plugins.json` records vwf at
`~/.claude/plugins/cache/virajp-plugins/vwf/<version>/`, and that copy is what
skills load. On 2026-08-26 the cache held 19.0.0 from **2026-08-23**, three days
and one format-relevant change behind the checkout.

The full path back to a running change:

```sh
# commit first — the directory source resolves the committed tree
claude plugin marketplace update virajp-plugins
claude plugin update vwf@virajp-plugins     # bare `vwf` fails: Plugin "vwf" not found
# then RESTART the session — the CLI says so and means it
```

Two traps inside that:

- **`claude plugin update vwf` fails** with `Plugin "vwf" not found`. The
  marketplace-qualified `vwf@virajp-plugins` is what works.
- **Updating does not affect the live session.** The CLI prints "Restart to
  apply changes." A run started before the restart still executes the old skill
  text, silently and with no version banner to notice it by.

## Why it matters beyond convenience

**It falsified a recorded constraint.** The plan carried: *"Work happens in the
main checkout, not a worktree: the marketplace is a directory source pointing at
this checkout, so a worktree hides plugin edits from the running tools.
Deliberate, recorded, do not 'fix' it."* The premise is true and the conclusion
does not follow — the cache hides the edits from the running tools regardless of
worktree. Corrected in the plan's Constraints section on the same day.

**And it makes WS2's result conditional.** WS2 exists to test whether the
blueprint format fits a plugin product. Run against a stale install it tests a
*previous* format instead, and every gap it logs is suspect — indistinguishable
from a real finding. Before trusting any WS2 output, confirm the loaded vwf
version.

## A second install, still on disk

`~/.local/share/virajp/ai-plugins/claude/claude/plugins/` (5.6 MB) is the
**retired render-tree installer's** output — the `claude/` tree from the
four-target era. It holds a full plugin set whose
`vwf/.claude-plugin/plugin.json` carries **no `version` key at all** (so it
would list as `0.0.0`, per the marketplace trap in CLAUDE.md) and whose
`assets/blueprint-format` reads **22**.

Nothing in `settings.json` or `known_marketplaces.json` references it. It is
reachable through the installer CLI's `--uninstall` as the `claude.json` legacy
receipt (item 9, `filesOnly`) — but only as part of a full uninstall, which
would also drop the marketplace registration, `devtools`, the graphify hooks and
the graph. **Not removed**; left for a deliberate cleanup.

One honest caveat on the evidence: `skills/architecture/SKILL.md` is
**byte-identical** between that tree and the 19.0.0 cache, so the skill text
served at the time could not discriminate between them. What is certain is that
neither is the checkout.

## Which pass it belongs to

The install refresh is done (19.1.0 is in the cache and verified to carry the
day's five decisions). What remains:

- **Restart before WS2 runs.** Nothing else in the chain is trustworthy first.
- **Decide the legacy tree's fate** — delete, or leave with this note as the
  record of what it is.
