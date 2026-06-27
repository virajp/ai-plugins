---
name: firebase-crashlytics
version: 0.1.0
category: development
description: Monitor and report crashes in your Flutter app with Firebase
  Crashlytics — fatal/non-fatal errors, custom keys and logs, user identifiers,
  Flutter and isolate error handlers, and debug/release collection control. Use
  when integrating crash reporting, logging non-fatal errors, recording
  breadcrumbs, or configuring crash collection for debug/release environments.
license: MIT
user-invocable: false
---

# firebase_crashlytics

## Contents

- [Setup](#setup)
- [Initialization](#initialization)
- [Fatal Crashes](#fatal-crashes)
- [Non-Fatal Errors](#non-fatal-errors)
- [Custom Keys](#custom-keys)
- [Custom Logs](#custom-logs)
- [User Identifier](#user-identifier)
- [Flutter Error Handler](#flutter-error-handler)
- [Isolate Errors](#isolate-errors)
- [Collection Control](#collection-control)
- [Anti-Patterns](#anti-patterns)
- [Examples](#examples)

---

## Setup

```yaml
dependencies:
  firebase_core:
  firebase_crashlytics:
```

### Android — enable Gradle plugin

In `android/build.gradle` (project-level):

```groovy
buildscript {
  dependencies {
    classpath 'com.google.firebase:firebase-crashlytics-gradle:3.0.2'
  }
}
```

In `android/app/build.gradle`:

```groovy
apply plugin: 'com.google.firebase.crashlytics'
```

### iOS — no extra steps

Crashlytics is auto-integrated via CocoaPods after `pod install`.

---

## Initialization

Hook Crashlytics into Flutter's error handling in `main()`:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Pass all Flutter framework errors to Crashlytics
  FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;

  // Catch async errors outside the Flutter zone
  PlatformDispatcher.instance.onError = (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    return true;
  };

  runApp(const MyApp());
}
```

---

## Fatal Crashes

Crashlytics auto-captures unhandled Dart and native crashes. The above
`FlutterError.onError` and `PlatformDispatcher.onError` hooks cover
Flutter-level fatals.

To record a caught exception as fatal (ends the session):

```dart
await FirebaseCrashlytics.instance.recordError(
  error,
  stackTrace,
  fatal: true,
);
```

---

## Non-Fatal Errors

Use for caught exceptions that don't crash the app but signal a problem.

```dart
try {
  await someRiskyOperation();
} catch (e, stack) {
  await FirebaseCrashlytics.instance.recordError(
    e,
    stack,
    reason: 'Failed during profile sync',
    fatal: false,
  );
}
```

The `reason` string appears in the Crashlytics console alongside the stack
trace.

---

## Custom Keys

Attach key-value metadata to crash reports to provide context (device state,
feature flags, etc.).

```dart
await FirebaseCrashlytics.instance.setCustomKey('route_id', 'abc123');
await FirebaseCrashlytics.instance.setCustomKey('membership_tier', 'premium');
await FirebaseCrashlytics.instance.setCustomKey('map_zoom_level', 12);
await FirebaseCrashlytics.instance.setCustomKey('offline_mode', true);
```

- Max 64 key-value pairs per session
- Keys and string values truncated at 1024 chars each
- Values can be `String`, `bool`, `int`, `double`

---

## Custom Logs

Breadcrumb-style logs that appear in the crash report alongside the stack trace.

```dart
FirebaseCrashlytics.instance.log('User tapped "Start Ride" button');
FirebaseCrashlytics.instance.log('Connecting to WebRTC peer...');
```

- Max 64 KB of logs per crash report; older lines are trimmed
- Logs are NOT sent unless a crash or non-fatal error occurs

---

## User Identifier

```dart
// Set after sign-in (use UID, not PII)
await FirebaseCrashlytics.instance.setUserIdentifier(user.uid);

// Clear on sign-out
await FirebaseCrashlytics.instance.setUserIdentifier('');
```

---

## Flutter Error Handler

Handle non-fatal widget-build errors in debug vs release differently:

```dart
FlutterError.onError = (errorDetails) {
  if (kDebugMode) {
    // Print to console in debug
    FlutterError.presentError(errorDetails);
  } else {
    // Send to Crashlytics in release
    FirebaseCrashlytics.instance.recordFlutterFatalError(errorDetails);
  }
};
```

---

## Isolate Errors

Errors thrown in `Isolate.run` or `compute` are caught differently:

```dart
// Wrap isolate work with a zone to capture errors
await runZonedGuarded(
  () async {
    await Isolate.run(() => heavyComputation());
  },
  (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: false);
  },
);
```

---

## Collection Control

```dart
// Disable in debug builds (recommended — avoid polluting crash reports)
await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(!kDebugMode);

// Check current state
final enabled = FirebaseCrashlytics.instance.isCrashlyticsCollectionEnabled;

// Force a test crash (debug only)
FirebaseCrashlytics.instance.crash();
```

Permanently disable in `AndroidManifest.xml` (then re-enable at runtime with
consent):

```xml
<meta-data
  android:name="firebase_crashlytics_collection_enabled"
  android:value="false"
/>
```

---

## Anti-Patterns

| Anti-Pattern                                  | Why                                                             | Fix                                          |
| --------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------- |
| Not calling `FlutterError.onError`            | Flutter framework errors (e.g. build errors) are never reported | Set `FlutterError.onError` in `main()`       |
| Missing `PlatformDispatcher.instance.onError` | Async errors outside Flutter zone are lost                      | Add the `onError` handler and return `true`  |
| Using PII as user identifier                  | Privacy violation                                               | Use Firebase UID or hashed identifier        |
| Sending crash reports in debug builds         | Pollutes production dashboard                                   | Guard with `!kDebugMode`                     |
| Logging sensitive data with `.log()`          | Logs appear in crash reports viewable by team                   | Only log non-sensitive context (IDs, states) |
| Catching all errors silently                  | Hides issues; nothing is reported                               | Log non-fatal errors with `recordError`      |

---

## Examples

### Full `main.dart` setup

```dart
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  await FirebaseCrashlytics.instance
      .setCrashlyticsCollectionEnabled(!kDebugMode);

  FlutterError.onError = (errorDetails) {
    FirebaseCrashlytics.instance.recordFlutterFatalError(errorDetails);
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    return true;
  };

  runApp(const MyApp());
}
```

### Crashlytics service (GetX)

```dart
class CrashlyticsService extends GetxService {
  static CrashlyticsService get to => Get.find();
  final _crashlytics = FirebaseCrashlytics.instance;

  Future<CrashlyticsService> init() async {
    await _crashlytics.setCrashlyticsCollectionEnabled(!kDebugMode);
    return this;
  }

  Future<void> setUser(String uid) async {
    await _crashlytics.setUserIdentifier(uid);
  }

  Future<void> clearUser() async {
    await _crashlytics.setUserIdentifier('');
  }

  void log(String message) => _crashlytics.log(message);

  Future<void> recordError(Object error, StackTrace stack, {String? reason}) async {
    await _crashlytics.recordError(error, stack, reason: reason, fatal: false);
  }

  Future<void> setContext(Map<String, dynamic> keys) async {
    for (final entry in keys.entries) {
      await _crashlytics.setCustomKey(entry.key, entry.value);
    }
  }
}
```

### Recording error in repository

```dart
class RideRepository {
  Future<List<Ride>> fetchRides(String userId) async {
    try {
      final response = await _api.getRides(userId);
      return response.map(Ride.fromJson).toList();
    } catch (e, stack) {
      CrashlyticsService.to.log('fetchRides failed for user $userId');
      await CrashlyticsService.to.recordError(
        e, stack, reason: 'fetchRides API failure',
      );
      rethrow;
    }
  }
}
```
