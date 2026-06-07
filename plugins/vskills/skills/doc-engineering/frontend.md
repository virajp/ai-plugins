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

**Unit:** entity. **Outputs:**
- Entity overview → `docs/engineering/frontend/<entity>/index.md`
- One file per screen → `docs/engineering/frontend/<entity>/<screen>.md`

Every entity is a folder. The `index.md` holds the screen inventory, controller/
state, navigation graph, API dependencies, and caching. Each screen gets its own
file with the full programmable spec (layout regions, elements & actions, states,
forms, interaction flows) — purely textual, no wireframes.

## Process

1. Read any existing files under `docs/engineering/frontend/<entity>/` — do not
   silently overwrite. If the folder does not exist, create it.
2. Read every file in `docs/product/<entity>/` and the entity's service API doc
   (the endpoints these screens call).
3. Adopt the persona with injected stack. Brainstorm one question at a time
   (MCQ + "Other").

### Tier 1 — entity level (for `index.md`)

1. **Screen inventory** — what screens/dialogs make up this entity? Name +
   purpose for each (detail comes next, per screen).
2. **Controller & state** — using the project's `<state-management>` library:
   controller responsibilities, reactive state fields, bindings, lifecycle
   hooks.
3. **Navigation graph** — how the screens connect: routes in/out, guards, deep
   links, back-stack behaviour.
4. **API dependencies** — which backend endpoints this feature calls; request/
   response shapes; auth required.
5. **Local caching** — what is cached, where, invalidation strategy, offline
   behaviour.

### Tier 1 — per screen (for each `<screen>.md`)

For **every** screen in the inventory, walk these so the screen can be
programmed without a wireframe:

1. **Purpose & entry/exit** — what the screen is for; how the user arrives and
   where they can leave to.
2. **Layout regions** — the screen top-to-bottom as ordered regions, and the
   elements in each region (the wireframe substitute).
3. **Elements & actions** — for every interactive element: its type, what
   content/source backs it, the gesture (tap / long-press / swipe / scroll),
   and the result (navigate / call API / mutate state / open dialog).
4. **States** — every state the screen can be in (loading, loaded, empty, error,
   plus any permission / offline / submitting states), the trigger for each,
   what's shown, and the actions available in that state.
5. **Forms** — if the screen has inputs: per field, type, required, validation,
   default, and error copy.
6. **Interaction flows** — numbered sequences for multi-step interactions
   (pull-to-refresh, infinite scroll, optimistic update, multi-step confirm):
   user action → system response → resulting state.

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

4. Write `docs/engineering/frontend/<entity>/index.md` using
   `templates/engineering-frontend.md`, then one
   `docs/engineering/frontend/<entity>/<screen>.md` per screen using
   `templates/engineering-frontend-screen.md`. Link each screen from the
   index's Screens table.
5. Update `docs/engineering/frontend/readme.md` (index of entities).
6. Run the shared **Ralph loop** and **Approval gate** from the main SKILL. The
   reviewer must receive the `index.md` **and** every screen file — a missing
   state or unhandled gesture on a single screen is exactly the kind of gap it
   should catch.
