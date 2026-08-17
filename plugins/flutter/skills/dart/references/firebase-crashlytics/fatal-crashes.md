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
