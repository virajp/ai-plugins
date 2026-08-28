# Decisions — no skill is lost: migrate before deleting

**Date** 2026-08-27 · **Branch** `main` · **Raised during** the `/vwf:blueprint`
full-product sweep, deciding how the `plugins` project is represented

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`); both stores
written together, per `plugins/vwf/assets/memory.md`.

**Corrected 2026-08-28: the count is 53 skills, not 58.** 82 total, less `vwf`'s
26 and `stackgen`'s 3, leaves 53 — the original arithmetic was five too high,
and it is the figure Wave D's completeness check is anchored on. Counted
directly off the tree.

## The constraint

**Every skill in the thirteen plugins slated for retirement must be migrated
into `vwf` or `stackgen` before its plugin directory is deleted.** Convergence
on the two-plugin north star is confirmed; **losing capability on the way there
is not.**

This binds **Wave C and Wave D** of
[the stackgen plan](../../plans/2026-08-19-stackgen.md). Wave D's line — *"the
twelve plugin directories are deleted"* — is now explicitly conditional: a
directory may be deleted only once every skill it holds has landed somewhere
that survives. Migration is the precondition, not a side effect.

## Why it needed saying

The waves are described **by destination**, which makes the surviving artifacts
easy to enumerate and the non-surviving ones easy to overlook. Wave C says the
stack templates and judgment prose become packs; Wave B says the capability
contracts become curated knowledge. Neither list is a *complete* inventory of
what the thirteen plugins contain.

Concretely, the thirteen hold **53 skills** (82 total, less `vwf`'s 26 and
`stackgen`'s 3) — among them `devtools`' eleven and `flutter`'s nine, which
include doctrine with no obvious pack-shaped destination. A wave that
successfully lands every *template* could still drop a doctrine skill nobody
listed, and the deletion would look complete.

**The check Wave D now owes:** an explicit before/after inventory of skills, not
of templates. A skill with no destination blocks the deletion until it has one.

## What the 2026-08-28 re-plan added

Grouping the 53 **by shape** rather than by destination is what exposed the real
hole: 22 stack-adapter pairs (retired, superseded by stackgen's own two), 25
doctrine skills (become packs — the easy bulk), and **6 runtime seams** that
fail stackgen's charter test, because nothing about them materializes into a
repo. Plus five manifest-only machinery items. See
[the re-derived waves](../../plans/2026-08-28-merge-waves.md).

The residue looked like it broke the two-plugin north star: four LSP
declarations, the `claude-design` MCP server, and the design-import seam that
depends on it are plugin-manifest features no repo file can express.

**Resolved 2026-08-28 — generate the wiring, do not hold it.** A curated
registry can only ever hold what someone curated, and stackgen exists for the
uncovered tail, so a manifest listing four language servers fails on *scaling*
before it fails on charter. stackgen instead ships or generates the scripts that
install LSP and MCP config on demand: the artifact materialized is the
installer, not the config. The design-import skills go to **vwf, invoked
conditionally** — only when a project declares a design tool — with the per-tool
references staying stackgen-side so vwf's technology-free guard survives intact.
**The north star closes at two.**

## Effect on this sweep

The blueprint scopes its per-extension-point flows to **`vwf` + `stackgen`** —
what the north star keeps. The other thirteen are represented by an explicit
`N/A`, and the **reason matters**: they are *pending migration*, not
*superseded*. The distinction is the whole of this decision, and the wording
must not decay into the latter.

## The scale finding that prompted it

A literal reading of the plugin contract — *one flow per skill, command or hook*
— gives **102 flows** for a `plugins` project holding all fifteen plugins,
roughly **12,000 lines** of blueprint against a repo whose `CLAUDE.md` is
about 600. See
[the format-fit gap](../gaps/2026-08-27-plugin-flow-granularity.md).
