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
