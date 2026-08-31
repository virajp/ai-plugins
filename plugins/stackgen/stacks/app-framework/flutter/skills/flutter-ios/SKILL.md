---
name: flutter-ios
version: 0.1.0
category: development
description: The iOS-native (Swift) edge of a Flutter app — the platform channel
  handler side, Xcode project configuration, entitlements and signing. Scoped to
  the boundary; the app itself is Dart. Auto-applies when editing Swift or iOS
  configuration.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/*.swift"
  - "**/Info.plist"
  - "**/*.entitlements"
---

# iOS Native (Swift)

The single entry point for the iOS-native side of a Flutter app. Each topic
lives in its own reference file — **read the one matching your task**.

| Doing | Read |
| --- | --- |
| The always-on Swift baseline: `MethodChannel` handlers from `AppDelegate`, main-thread dispatch, `FlutterError` codes, optionals, typed errors, concurrency (`@MainActor` / actors / `Sendable`) | [Standards](references/standards.md) |
| Swift language fundamentals and SwiftUI patterns for native views | [SwiftUI](references/swiftui.md) |
| Xcode project structure, build settings, schemes, signing, simulators, `xcodebuild` | [Xcode](references/xcode.md) |

For the Dart/Flutter side, see the `flutter` skill; for the Android-native side,
see `flutter-android`.

---

**Scope reminder.** Swift is a **platform-edge** language here. It answers
platform channels and configures the iOS host; application logic belongs in
Dart. The iOS project is subordinate to `pubspec.yaml`, which even toggles the
Swift package manager. See the `flutter` skill's
[platform interop](../flutter/references/platform-interop.md).
