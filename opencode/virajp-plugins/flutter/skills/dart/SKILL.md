---
name: dart
description: Flutter & Dart development — the always-on coding baseline plus
  deep
  references for state management, architecture, navigation, UI/theming/animation,
  performance, data & networking, Firebase, media, monetization, native interop,
  and build tooling. Auto-applies when editing any Dart file. Use when writing or
  reviewing any Flutter/Dart code; read the reference matching your task.
license: MIT
metadata:
  version: 0.5.0
  category: development
---

# Flutter & Dart

The single entry point for Flutter/Dart work. Each topic lives in its own
reference file — **read the one matching your task**. Start every change from
the always-on baseline.

## Baseline (read first)

| Topic                                                                         | When to read                                                                                                                                        |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Coding standards](%%AI_PLUGINS_ROOT%%/skills/dart/references/standards.md) | The always-on baseline: naming, type safety, formatting, the Equatable entity pattern, My-prefixed wrappers, MyApi repositories, MyException/Logger |
| [Testing](%%AI_PLUGINS_ROOT%%/skills/dart/references/testing.md)            | Writing/running tests, the GetX test harness, mocks, fixtures, coverage                                                                             |

## Architecture & State

| Topic                                                                                          | When to read                                                                  |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [App architecture](%%AI_PLUGINS_ROOT%%/skills/dart/references/architecting-apps.md)          | Layered architecture — separating UI, logic, and data                         |
| [Managing state](%%AI_PLUGINS_ROOT%%/skills/dart/references/managing-state.md)               | Choosing and implementing app vs ephemeral state                              |
| [Navigation & routing](%%AI_PLUGINS_ROOT%%/skills/dart/references/navigation-and-routing.md) | Routing, navigation, and deep linking                                         |
| [GetX](%%AI_PLUGINS_ROOT%%/skills/dart/references/getx/index.md)                             | Reactive state, dependency injection/bindings, named routes, UI helpers, i18n |

## UI

| Topic                                                                                | When to read                                                                                                        |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| [Building layouts](%%AI_PLUGINS_ROOT%%/skills/dart/references/building-layouts.md) | Building layouts with the constraint system and layout widgets                                                      |
| [Theming](%%AI_PLUGINS_ROOT%%/skills/dart/references/theming.md)                   | The MyColors token system, the Material 3 bootstrap theme, adaptive design                                          |
| [Animation](%%AI_PLUGINS_ROOT%%/skills/dart/references/animate/index.md)           | Declarative widget animations with flutter_animate                                                                  |
| [Performance](%%AI_PLUGINS_ROOT%%/skills/dart/references/performance.md)           | Frame-budget best practices — build() cost, saveLayer/opacity pitfalls, lazy lists, RepaintBoundary, profiling jank |

## Data & Networking

| Topic                                                                                         | When to read                                          |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [HTTP & JSON](%%AI_PLUGINS_ROOT%%/skills/dart/references/http-and-json.md)                  | Making HTTP requests and handling JSON                |
| [JSON serialization](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/index.md) | Code-gen models with json_serializable + build_runner |
| [Caching & offline](%%AI_PLUGINS_ROOT%%/skills/dart/references/caching-data.md)             | Caching and offline-first data strategies             |
| [Concurrency](%%AI_PLUGINS_ROOT%%/skills/dart/references/concurrency.md)                    | Running long tasks in background isolates             |

## Media & Web

| Topic                                                                                      | When to read                                        |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| [Image handling](%%AI_PLUGINS_ROOT%%/skills/dart/references/image-handling/index.md)     | Picking, cropping, and compressing images and video |
| [Maps & location](%%AI_PLUGINS_ROOT%%/skills/dart/references/maps-and-location/index.md) | Google Maps widget and device geolocation           |
| [WebView](%%AI_PLUGINS_ROOT%%/skills/dart/references/webview/index.md)                   | Embedding and controlling web content               |
| [WebRTC](%%AI_PLUGINS_ROOT%%/skills/dart/references/webrtc/index.md)                     | Real-time audio/video calling with flutter_webrtc   |

## Firebase

| Topic                                                                                     | When to read                                         |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [App Check](%%AI_PLUGINS_ROOT%%/skills/dart/references/firebase-app-check.md)           | Attesting app integrity to protect backend resources |
| [Analytics](%%AI_PLUGINS_ROOT%%/skills/dart/references/firebase-analytics/index.md)     | Tracking events and screen views                     |
| [Auth](%%AI_PLUGINS_ROOT%%/skills/dart/references/firebase-auth/index.md)               | Sign-in flows, auth state, MFA, user management      |
| [Crashlytics](%%AI_PLUGINS_ROOT%%/skills/dart/references/firebase-crashlytics/index.md) | Crash and non-fatal error reporting                  |
| [Messaging](%%AI_PLUGINS_ROOT%%/skills/dart/references/firebase-messaging/index.md)     | Push notifications (FCM)                             |
| [Storage](%%AI_PLUGINS_ROOT%%/skills/dart/references/firebase-storage/index.md)         | Uploading/downloading files in Cloud Storage         |

## Monetization

| Topic                                                                          | When to read                       |
| ------------------------------------------------------------------------------ | ---------------------------------- |
| [RevenueCat](%%AI_PLUGINS_ROOT%%/skills/dart/references/revenuecat/index.md) | In-app subscriptions and purchases |

## Native & Build Tooling

| Topic                                                                              | When to read                                       |
| ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| [Native interop](%%AI_PLUGINS_ROOT%%/skills/dart/references/native-interop.md)   | FFI, platform channels, platform views, Pigeon     |
| [Flavors](%%AI_PLUGINS_ROOT%%/skills/dart/references/flavors/index.md)           | Build flavors for dev/staging/prod environments    |
| [Build pipeline](%%AI_PLUGINS_ROOT%%/skills/dart/references/build.md)            | Codegen and quality gates (build_runner, analyzer) |
| [App size](%%AI_PLUGINS_ROOT%%/skills/dart/references/app-size.md)               | Measuring and reducing the app bundle size         |
| [Coverage report](%%AI_PLUGINS_ROOT%%/skills/dart/references/coverage-report.md) | Generating an HTML coverage report from lcov       |

For the iOS-native (Swift/SwiftUI/Xcode) side, see the **swift** skill; for the
Android-native side, see **kotlin**.
