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

## Optionals & defensive casts

A dispatcher receives untrusted, dynamically-typed `call.arguments` from Dart,
so optional handling is where it crashes the host app or stays robust.

- **Never force-unwrap** (`!`) a channel argument — a single bad cast brings
  down the whole iOS app, not just the feature. Cast with `as?` and supply a
  fallback.
- Prefer `guard let … else { result(...); return }` over `if let` so the failure
  path still calls `result(...)` exactly once and bails early.
- Reach for `??` defaults on every extracted value, as in
  `args["rideId"] as? String ?? ""`.

```swift
guard let args = call.arguments as? [String: Any] else {
  result(FlutterError(code: "BAD_ARGS", message: "Expected a map", details: nil))
  return
}
let rideId = args["rideId"] as? String ?? ""
```

## Typed errors

Model native failures as a `LocalizedError` enum and map each case to a **stable
`FlutterError` code** the Dart side switches on — the codes are part of the
channel contract, so keep them in sync with the **dart** skill's handlers.

```swift
enum CarExtensionError: LocalizedError {
  case engineNotReady
  case rideNotFound(id: String)

  var channelCode: String {
    switch self {
    case .engineNotReady:  "ENGINE_NOT_READY"
    case .rideNotFound:    "RIDE_NOT_FOUND"
    }
  }
  var errorDescription: String? {
    switch self {
    case .engineNotReady:        "Flutter engine not yet initialized"
    case .rideNotFound(let id):  "No ride for id \(id)"
    }
  }
}

// At the boundary, collapse the typed error into a FlutterError:
result(FlutterError(code: err.channelCode, message: err.errorDescription, details: nil))
```

## Concurrency

UIKit/CarPlay calls must land on the main thread. The wrapper above does this
with `DispatchQueue.main.async`; the modern idiom is to annotate the type
`@MainActor` so the compiler enforces it instead of every call site remembering:

```swift
@MainActor
final class CarPlayChannel {
  static let shared = CarPlayChannel()  // main-actor isolated
  // handler bodies are already on main — no manual dispatch needed
}
```

- Do **async native work** with `async`/`await`, then call `result(...)` once it
  resolves — never block the channel handler.
- Guard genuinely shared native state behind an `actor` (e.g. a snapshot cache
  feeding the channel) rather than a lock.
- **Swift 6 strict concurrency:** values crossing the channel are codec types
  and already `Sendable`; the failure points are your own singletons and
  captured state. Isolate them (`@MainActor` / `actor`) or conform to `Sendable`
  — don't silence the warning.

## Beyond MethodChannel

The hand-written dispatcher above is the default and stays so. A few cases call
for a different native entry point — reach for these instead of forcing a
channel:

- **Pigeon** — a type-safe codegen alternative to hand-written channels. Define
  the messaging contract once in a Dart schema; Pigeon generates a Swift
  `protocol` (the host API) plus the Dart client, and you implement that
  generated `protocol` instead of switching on `call.method` strings. Pick it
  when the channel surface grows and the string method names get error-prone —
  the generated protocol makes a missing or misnamed method a compile error.
- **Platform Views** — to embed a native `UIView` in the Flutter widget tree,
  the native side implements a `FlutterPlatformViewFactory` (vending a
  `FlutterPlatformView`) and registers it through the plugin registrar's
  `register(_:withId:)`, from where you already bind channels in `AppDelegate`.
  That factory registration is the native-side piece this skill owns; the Dart
  side hosts it with `UiKitView`.
- **dart:ffi** — for a pure C/C++ library, `dart:ffi` binds Dart straight to the
  native symbols with no platform channel and no Swift layer at all. Don't stand
  up a `FlutterMethodChannel` to wrap C — there's no Swift to write.

## Conventions

- Argument maps are `[String: Any]`; cross-boundary types are limited to the
  standard message codec (numbers, strings, bools, lists, maps, typed data) —
  never pass a native object across.
- Keep parity with the Dart `MethodChannel`: method names and channel string
  must match exactly on both sides.
- The Dart side defines the same channel and invokes/handles the mirror methods
  — see the **dart** skill and its **build** reference. `swift-lsp` (this
  plugin's dependency) provides diagnostics for these files.
