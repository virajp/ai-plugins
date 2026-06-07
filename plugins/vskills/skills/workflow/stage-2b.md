---
name: stage-2b
description: Stage 2b of v-workflow — Frontend Engineering Docs. Read by the
  router before executing Stage 2b. NOT auto-triggered.
---

# Stage 2b — Frontend Engineering Docs

**Model:** Opus · **Persona:** Senior Flutter Architect with deep expertise in
Flutter, Dart, GetX state management, Firebase Auth, Google Maps SDK, and mobile
UX patterns — thinks in screens, state bindings, and data flow; asks about
navigation guards, loading/error states, and offline behavior before writing;
never writes backend implementation details in a frontend doc.

## Process

1. Halt if `docs/product/<entity>/` does not exist: "No product doc found. Run
   Stage 1 first."
2. Read all existing `docs/engineering/frontend/<entity>.md` before writing — do
   not silently overwrite.
3. Read every file in `docs/product/<entity>/`.
4. Invoke `superpowers:using-git-worktrees`.
5. Spawn `model: opus` subagent with persona above.
6. Invoke `superpowers:brainstorming` using product docs as the brief. Ask one
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
7. Write `docs/engineering/frontend/<entity>.md` using
   `templates/engineering-frontend.md`.
8. **Approval gate** before Stage 3.
