## Foreground Messages

```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  final notification = message.notification;
  final data = message.data;

  print('Title: ${notification?.title}');
  print('Body: ${notification?.body}');
  print('Data: $data');

  // On iOS, notification messages are NOT shown automatically in foreground.
  // Use flutter_local_notifications or setForegroundNotificationPresentationOptions.
});

// iOS only: show notification banner while app is in foreground
await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
  alert: true,
  badge: true,
  sound: true,
);
```

---
