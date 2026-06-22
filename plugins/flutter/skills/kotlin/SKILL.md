---
name: kotlin
version: 0.1.0
category: development
description: Writing the Android-native (Kotlin) side of a Flutter app for
  features Flutter can't reach — a MethodChannel handler registry, main-looper
  dispatch, notImplemented defaults, and Native↔Flutter invocation. Auto-applies
  when editing any Kotlin file.
license: MIT
user-invocable: false
paths:
  - "**/*.kt"
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

## Conventions

- Argument maps are `Map<String, Any>`; cross-boundary types are limited to the
  standard message codec (numbers, strings, bools, lists, maps, typed data) —
  never pass a native object across.
- All channel work runs on the main looper — `MethodChannel` is not thread-safe.
- Keep parity with the Dart `MethodChannel`: method names and channel string
  must match exactly on both sides — see the **dart** and **build** skills.
  `kotlin-lsp` (this plugin's dependency) provides diagnostics for these files.
