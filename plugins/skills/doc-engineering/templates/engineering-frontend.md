# Frontend Engineering Index Template

Entity-level overview for the mobile app. Save as
`docs/engineering/frontend/{entity}/index.md`. Per-screen detail lives in
sibling files `docs/engineering/frontend/{entity}/{screen}.md` (one per screen),
created from `engineering-frontend-screen.md`.

> Replace `{state-management}` and other bracketed terms with the project's
> stack from the architecture registry. API dependencies link to the service API
> doc; auth requirements link to `../../foundations/auth.md`.

```template
# {Entity} — Frontend Engineering (index)

> Entity overview for the mobile app. Per-screen detail lives in sibling files.
> Built with `{state-management}`.

## Screens

> Inventory only — link to each screen's own file. Detail goes in the screen
> file, not here.

| Screen | Route / ID | Purpose | File |
| ------ | ---------- | ------- | ---- |
| [name] | [route] | [one line] | [./{screen}.md](./{screen}.md) |

## Controller & State

[Using {state-management}: controller(s) for this entity, reactive state fields,
bindings, lifecycle hooks. Screen files link back here rather than restating.]

## Navigation Graph

[How the screens connect: routes in/out, guards, deep links, back-stack
behaviour. A textual graph (A → B → C) is fine.]

## API Dependencies

[Backend endpoints this entity's screens call — link to service API docs.
Request/response shapes; auth required links to `../../foundations/auth.md`.]

## Local Caching

[What is cached, where, invalidation strategy, offline behaviour.]

## Capability Notes

[Only the sections for capabilities the project declares: e.g. realtime-location,
maps-navigation, push-notifications, voice-audio, offline-first,
payments-subscriptions, deep-linking, device-permissions. Omit the rest.]
```

## Field Documentation

| Field                                                                | Convention | Description                                            |
| -------------------------------------------------------------------- | ---------- | ------------------------------------------------------ |
| `{entity}`                                                           | variable   | Entity name, used in the heading and the doc path.     |
| `{screen}`                                                           | variable   | Screen slug — the filename of each sibling screen doc. |
| `{state-management}`                                                 | variable   | The state-management library from the project `stack`. |
| `[name]` / `[route]`                                                 | prose      | Screen inventory row content.                          |
| `[Controller & State]` / `[Navigation Graph]` / `[Capability Notes]` | prose      | Section bodies as described below.                     |

## Section Specifications

| Section            | Required                 | Guidance                                                                      |
| ------------------ | ------------------------ | ----------------------------------------------------------------------------- |
| Screens            | Always                   | Inventory only; one row per screen, each linking to its own file.             |
| Controller & State | Always                   | Controllers, reactive fields, bindings, lifecycle using `{state-management}`. |
| Navigation Graph   | Always                   | How screens connect; guards, deep links, back-stack.                          |
| API Dependencies   | Always                   | Endpoints called (link to service docs); auth links to `foundations/auth.md`. |
| Local Caching      | Always                   | What is cached, where, invalidation, offline behaviour.                       |
| Capability Notes   | If capabilities declared | Only the declared capability sections; omit the rest.                         |
