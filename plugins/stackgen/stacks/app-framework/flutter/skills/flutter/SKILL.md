---
name: flutter
version: 0.1.0
category: development
description: Flutter and Dart app development — the SDK that owns the manifest,
  the build and the project layout. Standards and architecture, state, UI
  composition, navigation, data, platform interop, build and flavors, testing,
  performance, and per-integration wiring. Auto-applies when editing Dart.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/*.dart"
  - "**/pubspec.yaml"
---

# Flutter

The app SDK, and the entry point for its Dart codebase. Read the reference
matching your task — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this SDK | [Pick & trade](references/pick-and-trade.md) |
| Anything touching the native trees | [Project layout & the generated boundary](references/project-layout.md) |
| Module split, placement, app architecture | [Standards & architecture](references/standards-and-architecture.md) |
| Holding or sharing state | [State management](references/state-management.md) |
| Building screens, theming, animation | [UI composition & theming](references/ui-composition.md) |
| Routes, deep links, the back stack | [Navigation & routing](references/navigation.md) |
| Serialization, HTTP, caching | [Data & networking](references/data-and-networking.md) |
| Isolates, offloading CPU work, async UI | [Concurrency & isolates](references/concurrency.md) |
| Reaching a platform API | [Platform interop](references/platform-interop.md) |
| Build config, flavors, signing | [Build, flavors & signing](references/build-flavors-signing.md) |
| Writing or running tests | [Testing & coverage](references/testing.md) |
| Frame drops, jank, artifact size | [Performance & size](references/performance.md) |
| Localizing | [Internationalization](references/internationalization.md) |
| Wiring a third-party integration | [`references/integrations/`](references/integrations/) — one per integration |

**Integration references are wiring only** — setup order, platform
configuration, anti-patterns. Their API surface is Context7's at use time.

**The native edges have their own skills**, scoped to the channel boundary:
`flutter-android` (Kotlin) and `flutter-ios` (Swift).
