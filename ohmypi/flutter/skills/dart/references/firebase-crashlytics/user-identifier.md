## User Identifier

```dart
// Set after sign-in (use UID, not PII)
await FirebaseCrashlytics.instance.setUserIdentifier(user.uid);

// Clear on sign-out
await FirebaseCrashlytics.instance.setUserIdentifier('');
```

---
