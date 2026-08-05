---
name: swift
version: 0.5.0
category: development
description: The iOS-native (Swift) side of a Flutter app — the Swift/SwiftUI
  coding baseline, MethodChannel bridging from AppDelegate, and Xcode
  project/build workflows. Auto-applies when editing any Swift file. Use when
  writing native iOS code or working with the Xcode project; read the reference
  matching your task.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/*.swift"
---

# iOS Native (Swift)

The single entry point for the iOS-native side of a Flutter app. Each topic
lives in its own reference file — **read the one matching your task**.

| Topic                                                                         | When to read                                                                                                                                                                     |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Swift standards](${CLAUDE_PLUGIN_ROOT}/skills/swift/references/standards.md) | The always-on baseline: MethodChannel handlers from AppDelegate, main-thread dispatch, FlutterError codes, optionals, typed errors, concurrency (@MainActor / actors / Sendable) |
| [SwiftUI](${CLAUDE_PLUGIN_ROOT}/skills/swift/references/swiftui.md)           | Swift language fundamentals and SwiftUI patterns for native views                                                                                                                |
| [Xcode](${CLAUDE_PLUGIN_ROOT}/skills/swift/references/xcode/index.md)         | Xcode project structure, build settings, schemes, signing, simulators, and xcodebuild                                                                                            |

For the Dart/Flutter side, see the **dart** skill; for the Android-native side,
see **kotlin**.
