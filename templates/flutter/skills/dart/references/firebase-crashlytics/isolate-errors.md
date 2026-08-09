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
