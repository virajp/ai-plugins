# Firebase Crashlytics — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

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

## firebase_crashlytics

Monitor and report crashes in your Flutter app with Firebase Crashlytics —
fatal/non-fatal errors, custom keys and logs, user identifiers, Flutter and
isolate error handlers, and debug/release collection control.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                               | When to read                                                                    |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Setup                                 | Adding the dependency and configuring Crashlytics                               |
| Initialization               | Hook Crashlytics into Flutter's error handling in main()                        |
| Fatal Crashes                 | Crashlytics auto-captures unhandled Dart and native crashes                     |
| Non-Fatal Errors           | Use for caught exceptions that don't crash the app but signal a problem         |
| Custom Keys                     | Attaching key-value metadata to crash reports                                   |
| Custom Logs                     | Breadcrumb-style logs that appear in the crash report alongside the stack trace |
| User Identifier             | Associating crash reports with a signed-in user                                 |
| Flutter Error Handler | Handle non-fatal widget-build errors in debug vs release differently            |
| Isolate Errors               | Errors thrown in Isolate.run or compute are caught differently                  |
| Collection Control       | Controlling crash collection in debug vs release                                |
| Anti-Patterns                 | Avoiding common Crashlytics mistakes                                            |
| Examples                           | Complete working Crashlytics implementation                                     |

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
