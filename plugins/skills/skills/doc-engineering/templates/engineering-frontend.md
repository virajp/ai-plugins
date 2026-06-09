# <Entity> — Frontend Engineering (index)

> Entity-level overview for the mobile app. Per-screen detail lives in sibling
> files: `docs/engineering/frontend/<entity>/<screen>.md` (one per screen),
> created from `engineering-frontend-screen.md`. Replace `<state-management>`
> and other bracketed terms with the project's stack from the architecture
> registry.

## Screens

> Inventory only — link to each screen's own file. Detail goes in the screen
> file, not here.

| Screen | Route / ID | Purpose    | File                           |
| ------ | ---------- | ---------- | ------------------------------ |
| <name> | <route>    | <one line> | [./<screen>.md](./<screen>.md) |

## Controller & State

<!-- Using <state-management>: controller(s) for this entity, reactive state
fields, bindings, lifecycle hooks. Screen files link back here rather than
restating. -->

## Navigation Graph

<!-- How the screens above connect: routes in/out, guards, deep links,
back-stack behaviour. A textual graph (A → B → C) is fine. -->

## API Dependencies

<!-- Backend endpoints this entity's screens call (link to service API docs),
request/response shapes, auth required. -->

## Local Caching

<!-- What is cached, where, invalidation strategy, offline behaviour. -->

## Capability Notes

<!-- Only the sections for capabilities the project declares: e.g.
realtime-location, maps-navigation, push-notifications, voice-audio,
offline-first, payments-subscriptions, deep-linking, device-permissions. Omit
the rest. -->
