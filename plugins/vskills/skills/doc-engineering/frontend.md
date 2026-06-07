---
name: doc-engineering-frontend
description: Frontend (mobile app) doc set of doc-engineering. NOT
  auto-triggered.
---

# doc-engineering — Frontend

**Persona (orchestrator adopts this):** Senior Mobile Architect with deep
expertise in the project's declared stack (inject `stack` from the registry —
e.g. the UI framework, state-management library, and platform SDKs). Thinks in
screens, state bindings, and data flow; asks about navigation guards,
loading/error states, and offline behaviour before writing; never writes backend
implementation details in a frontend doc.

**Unit:** entity. **Output:** `docs/engineering/frontend/<entity>.md`.

## Process

1. Read any existing `docs/engineering/frontend/<entity>.md` — do not silently
   overwrite.
2. Read every file in `docs/product/<entity>/` and the entity's service API doc
   (the endpoints this feature calls).
3. Adopt the persona with injected stack. Brainstorm one question at a time
   (MCQ + "Other").

### Tier 1 — always ask

1. **Screens** — what screens/dialogs exist? Entry triggers and exit paths?
2. **Controller & state** — using the project's `<state-management>` library:
   controller responsibilities, reactive state fields, bindings, lifecycle
   hooks.
3. **Navigation** — routes in/out, guards, deep links, back-stack behaviour.
4. **API dependencies** — which backend endpoints this feature calls; request/
   response shapes; auth required.
5. **Local caching** — what is cached, where, invalidation strategy, offline
   behaviour.
6. **Edge cases** — loading, error, permission-denied, and empty states.

### Tier 2 — ask only if the capability is in the registry

- `realtime-location` → location-permission flow, foreground vs background
  tracking, accuracy/battery trade-offs.
- `maps-navigation` → map rendering, route display, turn-by-turn behaviour.
- `push-notifications` → notification handling, deep-link from notification,
  permission prompts.
- `voice-audio` → push-to-talk/intercom UI, microphone permission, audio-session
  handling.
- `offline-first` → offline queue, sync on reconnect, conflict resolution.
- `payments-subscriptions` → paywall screens, entitlement checks, store
  integration.
- `third-party-auth` → SSO flows, any reviewer/hidden login path, session
  lifecycle.
- `deep-linking` → link routing and cold-start handling.
- `device-permissions` → permission-request UX and denial handling.

4. Write `docs/engineering/frontend/<entity>.md` using
   `templates/engineering-frontend.md`.
5. Update `docs/engineering/frontend/readme.md` (index).
6. Run the shared **Ralph loop** and **Approval gate** from the main SKILL.
