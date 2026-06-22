---
name: swift
version: 0.1.0
category: development
description: Writing the iOS-native (Swift) side of a Flutter app for features
  Flutter can't reach — MethodChannel handlers registered from AppDelegate,
  main-thread dispatch, FlutterError codes, and Native↔Flutter invocation.
  Auto-applies when editing any Swift file.
license: MIT
user-invocable: false
paths:
  - "**/*.swift"
---

# iOS Native (Swift) via Platform Channels

Use Swift only for capabilities Flutter/Dart can't express — CarPlay, Siri,
widgets, deep OS integrations. Everything crosses the boundary through a
`FlutterMethodChannel`; keep the native side a thin dispatcher and push logic
back into Dart where you can.

## Channel wrapper

One channel per feature, wrapped in a singleton that owns the
`FlutterMethodChannel` and dispatches both directions. Hold view controllers as
`weak` so the native UI lifecycle — not the channel — controls their lifetime.

```swift
import Flutter
import CarPlay

/// MethodChannel wrapper for the com.app/car_extension channel.
class CarPlayChannel {
  static let shared = CarPlayChannel()
  private var channel: FlutterMethodChannel?

  weak var navigationController: CarPlayNavigationController?
  weak var interfaceController: CPInterfaceController?

  private init() {}

  func registerChannels(with messenger: FlutterBinaryMessenger) {
    channel = FlutterMethodChannel(name: "com.app/car_extension", binaryMessenger: messenger)
    channel?.setMethodCallHandler { [weak self] call, result in
      self?.handleFlutterCall(call, result: result)
    }
  }
}
```

- Channel name is a reverse-DNS string shared verbatim with the Dart side —
  `com.app/<feature>`. Define it once; a typo just yields a silent no-op.
- Capture `[weak self]` in the handler closure to avoid retain cycles.

## Flutter → Native

Switch on `call.method`; cast `call.arguments` defensively; **always** call
`result(...)` exactly once on every path, and finish with
`FlutterMethodNotImplemented` for unknown methods. Hop to the main thread before
touching UIKit.

```swift
private func handleFlutterCall(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
  DispatchQueue.main.async { [weak self] in
    guard let self = self else { result(nil); return }
    switch call.method {
    case "navigationStarted":
      let args = call.arguments as? [String: Any] ?? [:]
      self.navigationController?.start(rideId: args["rideId"] as? String ?? "", initialSnapshot: args)
      result(nil)
    case "navigationStopped":
      self.navigationController?.stop()
      result(nil)
    default:
      result(FlutterMethodNotImplemented)
    }
  }
}
```

## Native → Flutter

Guard the channel (the engine may not be up yet) and dispatch on main. Surface a
not-ready state as a `FlutterError` with a stable `code`, never a crash:

```swift
func invokeMethod(_ method: String, arguments: Any?, result: FlutterResult? = nil) {
  guard let channel = channel else {
    result?(FlutterError(code: "ENGINE_NOT_READY", message: "Flutter engine not yet initialized", details: nil))
    return
  }
  DispatchQueue.main.async {
    result == nil ? channel.invokeMethod(method, arguments: arguments)
                  : channel.invokeMethod(method, arguments: arguments, result: result!)
  }
}
```

## Registration

Register channels from `AppDelegate` once the engine exists. With the implicit
engine, do it in `didInitializeImplicitFlutterEngine` so channels are re-bound
on hot restart in debug:

```swift
func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
  GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  if let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "AppCarExtension") {
    CarPlayChannel.shared.registerChannels(with: registrar.messenger())
  }
}
```

## Conventions

- Argument maps are `[String: Any]`; cross-boundary types are limited to the
  standard message codec (numbers, strings, bools, lists, maps, typed data) —
  never pass a native object across.
- Keep parity with the Dart `MethodChannel`: method names and channel string
  must match exactly on both sides.
- The Dart side defines the same channel and invokes/handles the mirror methods
  — see the **dart** and **build** skills. `swift-lsp` (this plugin's
  dependency) provides diagnostics for these files.
