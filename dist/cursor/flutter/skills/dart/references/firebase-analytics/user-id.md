## User ID

Link analytics data to your own user identifier (do NOT use PII like
email/phone).

```dart
// Set after sign-in
await analytics.setUserId(id: user.uid);

// Clear on sign-out
await analytics.setUserId(id: null);
```

---
