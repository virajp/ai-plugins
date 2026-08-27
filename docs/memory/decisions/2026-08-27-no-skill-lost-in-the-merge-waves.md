# Decisions — no skill is lost: migrate before deleting

**Date** 2026-08-27 · **Branch** `main` · **Raised during** the `/vwf:blueprint`
full-product sweep, deciding how the `plugins` project is represented

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`); both stores
written together, per `plugins/vwf/assets/memory.md`.

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

Concretely, the thirteen hold **58 skills** (82 total, less `vwf`'s 26 and
`stackgen`'s 3) — among them `devtools`' eleven and `flutter`'s nine, which
include doctrine with no obvious pack-shaped destination. A wave that
successfully lands every *template* could still drop a doctrine skill nobody
listed, and the deletion would look complete.

**The check Wave D now owes:** an explicit before/after inventory of skills, not
of templates. A skill with no destination blocks the deletion until it has one.

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
