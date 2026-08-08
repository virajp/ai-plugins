---
role: frontend
name: Swift · iOS (SwiftUI)
languages: [ swift ]
optional_languages: []
frameworks: [ swiftui ]
dependencies: [ swift-concurrency ]
---

# Frontend — Swift · iOS (SwiftUI)

A native iOS app: **Swift** with
[SwiftUI](https://developer.apple.com/xcode/swiftui/), a single-package repo
shipping through the App Store. Pick this over the Flutter template when the
product is Apple-only, or when platform integration depth matters more than
sharing a codebase with Android.

This doc covers the **project axis** only — which backing services the app talks
to is the backing axis's choice, and a `frontend` project does not use the
deploy axis at all (it ships through a store, not a container host).

## Stack

- **UI**: SwiftUI with `NavigationStack`; state via `@Observable` / `@State`,
  and one observable model per screen. Screens map one-to-one onto the flow
  doc's Screens contract.
- **Concurrency**: Swift structured concurrency (`async`/`await`, actors). No
  completion-handler APIs in new code; no blocking work on the main actor.
- **Layout**: `Features/<Name>/` per feature (view, model, repository), `Core/`
  for shared design-system components, networking and storage. Design tokens
  from `docs/blueprint/design-system.md` land in a theme type — never a
  hardcoded `Color` or spacing literal in a view.
- **Package management**: Swift Package Manager (`Package.swift`). Note that
  `swift` has **no mise-managed toolchain** — it comes from Xcode, so
  `/doctor` checks the LSP but not a toolchain version.
- **Client SDKs for the backing services** the product selected — identity,
  push, analytics, crash reporting. The app authenticates against the identity
  provider and calls the `service` API with the resulting token; business logic
  and server SDKs stay in the backend.
- **Localization** via String Catalogs, with the same string catalogue the
  product's other surfaces use.

## Testing

- **Unit**: Swift Testing (or XCTest) over models and repositories.
- **UI / golden**: XCUITest for screen-level flows, plus snapshot tests for the
  visual contract.
- **Accessibility**: assertions over accessibility labels, traits, Dynamic Type
  scaling and contrast — the a11y gate for this role, since axe does not apply
  to a native surface.

## Changelog & store notes

A `CHANGELOG.md` (Keep a Changelog) is the source of truth — execute's docs-sync
appends draft `[Unreleased]` entries for user-visible changes — with per-locale
store release notes generated from it at release.
