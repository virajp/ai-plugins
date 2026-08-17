# Decisions — the two-plugin north star, Claude-first, stackgen

**Date** 2026-08-17 · **Branch** `main` (worked in place, by request) ·
**Commits** `2b2f299`, `39bb977`, `fb35135`, `0887105`

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`); both stores
written together, per `templates/vwf/assets/memory.md`.

## The north star: the repo converges on two plugins

Agreed after several rounds of argument (Viraj proposed, Claude initially pushed
back, then conceded on the merits): the durable value this repo provides is
**engineering principles most developers don't apply** — not stack doctrine,
which is researchable. The closed stack menu forces the maintainer's stack
choices (Effect/Hono/Astro/Refine) on users; that inverts.

- **`vwf`** — the workflow for building a product, plus the curated engineering
  doctrine (a new principles catalog extending `engineering-baseline.md`: KISS,
  YAGNI, DRY-and-its-limits, SOLID, Parnas information hiding, design by
  contract, idempotency, explicit error semantics, least privilege — each with
  definition → smells → verification → patterns → when NOT to apply).
- **`stackgen`** — makes a product executable: generates project-level
  skills/agents/conventions for the user's *declared* stack (Context7 research,
  reviewer agent + user-consent gate, committed `.skills/` tree + per-target
  emit), and **configures — never conjures — LSP servers, MCP servers, hooks and
  repo gates**. The other twelve plugins merge into it in waves (machinery →
  capability contracts → stack judgment → retirement).

Plan: `docs/plans/2026-08-17-stackgen.md`. **Status: awaiting approval — nothing
is built.**

## Claude-first: the renderer retires, prompt-install replaces the ports

Observed in the wild: users install Claude-format plugins into Codex/Cursor by
giving the tool the GitHub link and asking — and it works. The Claude plugin
layout is the de-facto standard other agents consume. The repo's largest
complexity bill (templates + Eta + renderer + four committed trees + byte-parity
CI) buys support the coverage report itself calls degraded (17–18 dropped
features per flat target).

Decision: author Claude-native (promote the current `claude/plugins/*` render to
source), delete the renderer and the three non-Claude trees, keep a slim
one-tree checker + generated marketplace manifest, narrow the CLI to Claude +
graphify + all three statusline surfaces, and serve other tools with a readme
prompt-install section. Losses accepted knowingly: verified parity, the OpenCode
copy install/receipts, hook projection.

Plan: `docs/plans/2026-08-17-claude-first.md`. **Sequenced before stackgen.
Status: awaiting approval — nothing is built.**

## The language-plugin contract (interim doctrine, now partly superseded)

Written the same day, before the pivot
(`.claude/skills/plugin-authoring/references/language-plugins.md`): boundary =
toolchain/ecosystem; stacks mandatory; self-contained; token collisions resolved
by the pinned template; prose now, `plugins:check` assertions deferred. It
governs the curated plugins until the merge waves land, then is archived as the
record of the replaced model. Under it, `typescript` gained JS coverage in its
router (Effect confirmed TS-only: upstream requires TypeScript 5.9+ with
`strict`; no separate javascript plugin — same toolchain).

## Approval gate

Both plans carry "proposed — awaiting approval" and are approved **per-plan,
Claude-first first**. Nothing in either is implemented until Viraj says go.
