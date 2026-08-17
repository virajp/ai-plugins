## FCM Token

The FCM token uniquely identifies the app installation. Store it on your backend
to send targeted notifications.

```dart
// Get current token
final token = await FirebaseMessaging.instance.getToken();

// APNS token required for iOS token generation
// (obtained automatically after permission grant)

// Listen for token refreshes (device restore, app reinstall, etc.)
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
  // Upload newToken to backend
});

// Delete token (e.g., on sign-out to stop receiving notifications)
await FirebaseMessaging.instance.deleteToken();
```

---
