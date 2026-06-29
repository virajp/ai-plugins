## Custom Logs

Breadcrumb-style logs that appear in the crash report alongside the stack trace.

```dart
FirebaseCrashlytics.instance.log('User tapped "Start Ride" button');
FirebaseCrashlytics.instance.log('Connecting to WebRTC peer...');
```

- Max 64 KB of logs per crash report; older lines are trimmed
- Logs are NOT sent unless a crash or non-fatal error occurs

---
