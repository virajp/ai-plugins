---
name: v-doc-engineering-frontend
description: Frontend engineering docs sub-path of v-doc-engineering. NOT
  auto-triggered.
---

# v-doc-engineering — Frontend

**Model:** Opus · **Persona:** Senior Flutter Architect with deep expertise in
Flutter, Dart, GetX state management, Firebase Auth, Google Maps SDK, and mobile
UX patterns — thinks in screens, state bindings, and data flow; asks about
navigation guards, loading/error states, and offline behavior before writing;
never writes backend implementation details in a frontend doc.

## Process

1. Read all existing `docs/engineering/frontend/<entity>.md` before writing — do
   not silently overwrite.
2. Read every file in `docs/product/<entity>/`.
3. Invoke `superpowers:using-git-worktrees`.
4. Spawn `model: opus` subagent with persona above.
5. Invoke `superpowers:brainstorming` using product docs as the brief. Ask one
   at a time:
   1. **Screens** — what screens/dialogs exist? Entry points and triggers?
   2. **Controller & state** — GetX controller responsibilities, reactive state
      fields, bindings, lifecycle hooks?
   3. **Navigation** — routes in/out, guards, deep links, back stack behavior?
   4. **API dependencies** — which backend endpoints does this feature call?
      Request/response shapes needed?
   5. **Local caching** — what is cached, where (GetX, local storage, etc.),
      invalidation strategy, offline behavior?
   6. **Edge cases** — loading states, error states, permission denials, empty
      states?
6. Write `docs/engineering/frontend/<entity>.md` using
   `templates/engineering-frontend.md`.

## Ralph Loop — Documentation Completeness

After writing the docs, loop until no gaps remain:

1. Spawn a subagent with **only** the written frontend doc and the product docs
   it describes — no conversation context, no extra files. Prompt:
   `"Given these frontend engineering docs and the product docs they
   describe, what screens, state bindings, navigation paths, or edge cases are
   ambiguous, missing, or inconsistent? List gaps only — no rewrites."`
2. If gaps found:
   - Present the gap list to the user.
   - Re-invoke `superpowers:brainstorming` targeting those specific gaps — ask
     the user the missing questions one at a time (same question style as the
     initial pass: screens, controller state, navigation, caching, edge cases,
     etc.).
   - Update the doc with the answers.
   - Return to step 1.
3. If no gaps → exit loop.

**Critical:** The reviewer subagent must receive only the doc files — no
conversation context. Context bleed causes it to fill gaps from memory rather
than surfacing them for the user to answer.

## Approval Gate

Pause and wait for explicit user approval before the user continues to
`v-spec-plan`.
