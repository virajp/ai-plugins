---
role: frontend
name: Kotlin · Android (Jetpack Compose)
languages: [ kotlin ]
optional_languages: []
frameworks: [ jetpack-compose ]
dependencies: [ coroutines, hilt ]
---

# Frontend — Kotlin · Android (Jetpack Compose)

A native Android app: **Kotlin** with
[Jetpack Compose](https://developer.android.com/compose), a single-package repo
shipping through the Play Store. Pick this over the Flutter template when the
product is Android-only, or when platform integration depth matters more than
sharing a codebase with iOS.

This doc covers the **project axis** only — which backing services the app talks
to is the backing axis's choice, and a `frontend` project does not use the
deploy axis at all (it ships through a store, not a container host).

## Stack

- **UI**: Compose with a single-activity architecture; navigation via
  `androidx.navigation.compose`; state hoisted into `ViewModel`s exposing
  `StateFlow`. Screens map one-to-one onto the flow doc's Screens contract.
- **Concurrency**: Kotlin coroutines and `Flow`; no blocking calls on the main
  dispatcher.
- **DI**: Hilt, with one module per feature.
- **Layout**: `feature/<name>/` per feature (UI, view model, repository),
  `core/` for shared design-system components, networking, and storage. Design
  tokens from `docs/blueprint/design-system.md` land in the Compose theme —
  never hardcoded colors or dimensions in a composable.
- **Client SDKs for the backing services** the product selected — identity,
  push, analytics, crash reporting. The app authenticates against the identity
  provider and calls the `service` API with the resulting token; business logic
  and server SDKs stay in the backend.
- **Localization** via Android resource qualifiers, with the same string
  catalogue the product's other surfaces use.

## Testing

- **Unit**: JUnit + Turbine over view models and repositories.
- **UI / golden**: Compose UI tests (`createComposeRule`) as the screen-level
  gate, plus screenshot tests for the visual contract.
- **Accessibility**: Compose's semantics assertions for content descriptions,
  touch-target size and merged semantics — the a11y gate for this role, since
  axe does not apply to a native surface.

## Changelog & store notes

A `CHANGELOG.md` (Keep a Changelog) is the source of truth — execute's docs-sync
appends draft `[Unreleased]` entries for user-visible changes — with per-locale
store release notes generated from it at release.
