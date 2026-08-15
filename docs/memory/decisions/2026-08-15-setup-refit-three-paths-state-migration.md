# Decisions — the setup refit: three entry paths, state-based migration

**Date** 2026-08-15 · **Branch** `refit/vwf-setup` (squashed to one commit) ·
**vwf** 17.0.0 → 18.0.0 · stamps unchanged (blueprint 22 / config 15)

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`); both stores
written together, per `templates/vwf/assets/memory.md`.

## The sixteen locked decisions

Confirmed with Viraj before the autonomous run; the full table with rationale is
`docs/scratchpad/vwf-setup-refit-execution-plan.md` §1 (gitignored working notes
— this file is the committed record).

1. **Branch once, don't split.** `/vwf:setup` stays the only public skill; Step
   0 resolves the mode (blank-bootstrap / brownfield-detect / migrate /
   current); per-mode pipelines are reference files. Chosen over the
   onboard+migrate+router split because 84 reference sites existed with (at the
   time) no checker validating skill references, and mode-resolution is
   reversible where a shipped split is not.
2. **State-based migration replaces the delta ladder.** The 834-line
   `format-versioning.md` is deleted, not windowed. Migrate reconciles the tree
   against the current format's own sources (templates, the conformance bundle,
   the authoring bars, `vwf-config.md`); renames resolve via the new
   `format-lineage.md` (70 rows, adversarially verified over three rounds before
   the ladder was deleted); fan-outs are proposed, never guessed. The stamps
   survive as drift detectors only. **The config's own `N → N+1` deltas stay in
   `vwf-config.md`** — only the blueprint ladder was replaced. Standing caveat:
   for a distributed install base, version-keyed deltas are the safer design —
   revisit if vwf ever ships to external users at scale.
3. **Setup never moves source files.** All restructuring (in-repo layout and the
   `iac` extraction alike) is written recommendations; the batch loop is gone. A
   recorded `enforcement:` decline downgrades doctor's `iac` finding from
   blocking to a persistent degradation — mirrors the declined-graph handling,
   and un-wedges a repo that declined the extraction.
4. **Setup runs no foundation commands.** It prints the chain (product →
   architecture → design-system → blueprint, readme optional) and offers to
   start; each command's own detect-mode is better than setup's gate was. Setup
   keeps devtools:scaffold, the CLAUDE.md merge, the memory tree, environment
   bootstrap, and the graph offer.
5. **Definitions run in every direction.** Roles are defined by consumer domain,
   platforms by on-disk evidence (topology-detection.md's two new tables);
   brownfield detection reads them backward, greenfield bootstrap forward, and
   `/vwf:architecture` now **derives** the registry proposal from `product.md`
   with quoted evidence (derivation mode + interview fallback). Invariant:
   recommend → scaffold → detect must be the identity.
6. **Smaller rulings:** unparseable config halts (never silently re-onboard);
   blank = no manifest, no source dirs, no blueprint tree; validate before
   stamping, revert the stamp on a blocking halt; structure-pending (config
   present, registry absent) is a legal "early" state expressed by absence;
   `setup_progress` retired — re-running is the resume mechanism;
   `plugins:check` now validates every `it.cmd()` target.

## The one open item, deliberately not decided

**Who records a post-onboard structural change.** A single repo growing a second
project can no longer "re-run setup" (Step 0 routes stamp-current repos to
`current`, which exits). The prose now routes it honestly — a new project is
`/vwf:architecture`'s to record; a new member repo onboards by running setup
from inside it — but whether Step 0 should *detect* structural drift (tree vs
registry) as a fourth signal is a design decision nobody made, flagged by the
Phase 7 agent and left for Viraj.

## Process notes worth keeping

- The adversarial-verify loop earned its cost: round 1 caught 5 real misses,
  round 2 caught 4 more when the config ladder entered scope, and the verifier
  corrected the orchestrator's own brief once (the `cicd` axis was a new key,
  never a rename — "there was no product-wide key to copy down").
- Root-relative links into a user-invocable skill's references break on OpenCode
  (`commands/` vs `skills/` segment) — name the file in prose beside `it.cmd()`
  instead. Found live by the Phase 6 agent.
- The nudge sweep retargeted zero of 84 sites: once doctor's own findings name
  remedies (Phase 5), everything left pointing at setup was genuinely setup's.
  The sweep's value was the per-site classification log.
