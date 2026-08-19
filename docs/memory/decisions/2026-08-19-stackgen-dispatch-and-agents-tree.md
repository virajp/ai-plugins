# Decisions — stackgen dispatch rule, the `.agents/` tree, gated waves

**Date** 2026-08-19 · **Branch** `main` (worked in place, by request) ·
**Commit** `7bf6be9`

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`); both stores
written together, per `plugins/vwf/assets/memory.md`. Supersedes the Output
ruling in `2026-08-17-north-star-two-plugins.md` (`.skills/` + emit).

## Output: `.agents/` at the repo root, symlinked into `.claude/`

Everything stackgen materializes — skills, agents, conventions — lands in one
committed, **repo-owned** `.agents/` tree in the user's repo, wired to Claude
via committed symlinks (`.claude/skills/<name>` → `../../.agents/skills/<name>`,
likewise agents). Replaces the neutral-tree-plus-emit design, whose multi-target
rationale Claude-first removed. Phase 2 carries an early mechanism check (does
Claude discover skills through symlinks?) with sync-maintained copies as the
fallback.

## Dispatch: pre-created packs preferred, generation for the uncovered tail

This repo ships curated stack packs as stackgen **assets** (not live plugin
skills — installing stackgen floods no session). A covered technology is
**copied** from its pack — never generated; generation (Context7 → principles
catalog → reviewer gate) fires only for technologies no pack covers. Packs are
copied **repo-owned** (committed, editable, plugin-independent); upgrades are an
explicit consent-gated re-sync diff, so drift is visible, never silently
overwritten.

## Execution gates: phases autonomous, waves individually gated

Plan approval covers Phases 1–4 end-to-end (one commit each); each merge wave
A–D — the destructive part — needs its own explicit go-ahead, with Phase 4's
scratch-project evidence gating Wave A.

## Status

Claude-first is **landed** (v5.0.0 cutover; v5.1.0 restored plugin installs as a
thin wrapper — an unwanted cut corrected). stackgen remains **proposed —
awaiting approval**; nothing is built.
