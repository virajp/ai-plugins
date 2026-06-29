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
