---
name: flutter-android
version: 0.1.0
category: development
description: The Android-native (Kotlin) edge of a Flutter app — the platform
  channel handler side, Gradle configuration for native dependencies, manifest
  entries and permissions. Scoped to the boundary; the app itself is Dart.
  Auto-applies when editing Kotlin or Android configuration.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/*.kt"
  - "**/*.kts"
  - "**/AndroidManifest.xml"
---

# Android Native (Kotlin) via Platform Channels

Use Kotlin only for capabilities Flutter/Dart can't express — Android Auto, app
widgets, foreground services, deep OS integrations. Everything crosses the
boundary through a `MethodChannel`; keep the native side a thin dispatcher and
push logic back into Dart where you can.

## Channel dispatcher

One channel per feature as an `object` (singleton). Prefer a **handler
registry** keyed by method name so several screens can each register their own
methods without overwriting a single monolithic `when` block:

```kotlin
package app.carapp

import android.os.Handler
import android.os.Looper
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

/// Centralized dispatcher for the com.app/car_extension MethodChannel.
object CarAppChannel {
  private const val CHANNEL_NAME = "com.app/car_extension"
  private val handlers = mutableMapOf<String, (MethodCall, MethodChannel.Result) -> Unit>()

  fun registerHandler(method: String, handler: (MethodCall, MethodChannel.Result) -> Unit) {
    handlers[method] = handler
  }

  fun unregisterHandler(method: String) = handlers.remove(method)
}
```

- Channel name is a reverse-DNS string shared verbatim with the Dart side —
  `com.app/<feature>`. Define it once as a `const`.
- Each screen calls `registerHandler` in its init and `unregisterHandler` in its
  cleanup/`onDestroy` — lifecycle owns the handler, not the channel.

## Initialization & Flutter → Native

Bind the channel once when the engine is ready, on the main looper. The
dispatcher looks up the handler and falls back to `notImplemented()`:

```kotlin
fun initialize() {
  val engine = AppApplication.getEngine() ?: return
  Handler(Looper.getMainLooper()).post {
    MethodChannel(engine.dartExecutor.binaryMessenger, CHANNEL_NAME)
      .setMethodCallHandler { call, result ->
        val handler = handlers[call.method]
        if (handler != null) handler(call, result) else result.notImplemented()
      }
  }
}
```

A handler must call `result.success(...)` / `result.error(...)` exactly once.

## Native → Flutter

Guard the engine (it may not be up yet), post to the main looper, and surface a
not-ready state through the callback rather than crashing:

```kotlin
fun invokeMethod(method: String, args: Map<String, Any>?, callback: ((Any?) -> Unit)? = null) {
  val engine = AppApplication.getEngine()
  if (engine == null) {
    callback?.invoke(mapOf("error" to "engine_not_ready"))
    return
  }
  Handler(Looper.getMainLooper()).post {
    MethodChannel(engine.dartExecutor.binaryMessenger, CHANNEL_NAME).invokeMethod(
      method,
      args,
      object : MethodChannel.Result {
        override fun success(result: Any?) { callback?.invoke(result) }
        override fun error(code: String, message: String?, details: Any?) { callback?.invoke(mapOf("error" to code)) }
        override fun notImplemented() { callback?.invoke(null) }
      },
    )
  }
}
```

## Engine & registration

Share one cached `FlutterEngine` (held by the `Application`) so the channel and
the `Activity` use the same messenger; `MainActivity` provides it:

```kotlin
class MainActivity : FlutterActivity() {
  override fun provideFlutterEngine(context: Context): FlutterEngine? = AppApplication.getEngine()
}
```

Call `CarAppChannel.initialize()` once from the `Application` / `MainActivity`
after the engine is created.

## Beyond MethodChannel

The hand-written dispatcher above is the default and stays so. A few cases call
for a different native entry point — reach for these instead of forcing a
channel:

- **Pigeon** — a type-safe codegen alternative to hand-written channels. Define
  the messaging contract once in a Dart schema; Pigeon generates a Kotlin
  `interface` (the host API) plus the Dart client, and you implement that
  generated `interface` instead of switching on `call.method` strings. Pick it
  when the channel surface grows and the string method names get error-prone —
  the generated interface makes a missing or misnamed method a compile error.
- **Platform Views** — to embed a native Android `View` in the Flutter widget
  tree, the native side registers a `PlatformViewFactory` (returning a
  `PlatformView`) with the engine's `PlatformViewRegistry`, from your
  `FlutterPlugin`'s `onAttachedToEngine` / `configureFlutterEngine`. That
  factory registration is the native-side piece this skill owns; the Dart side
  hosts it with `AndroidView`.
- **dart:ffi** — for a pure C/C++ library, `dart:ffi` binds Dart straight to the
  native symbols with no platform channel and no Kotlin layer at all. Don't
  stand up a `MethodChannel` to wrap C — there's no Kotlin to write.

## Conventions

- Argument maps are `Map<String, Any>`; cross-boundary types are limited to the
  standard message codec (numbers, strings, bools, lists, maps, typed data) —
  never pass a native object across.
- All channel work runs on the main looper — `MethodChannel` is not thread-safe.
- Keep parity with the Dart `MethodChannel`: method names and channel string
  must match exactly on both sides — see the **dart** skill and its **build**
  reference. `kotlin-lsp` (this plugin's dependency) provides diagnostics for
  these files.

---

**Scope reminder.** Kotlin is a **platform-edge** language here. It exists to
answer platform channels and to configure the Android host — not to hold
application logic, which belongs in Dart. Gradle files configure native
dependencies only; `pubspec.yaml` is the manifest. See the `flutter` skill's
[platform interop](../flutter/references/platform-interop.md).
