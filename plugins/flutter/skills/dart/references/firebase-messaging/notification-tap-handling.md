## Notification Tap Handling

### App terminated (cold start)

```dart
// In your root widget's initState or GetX service init
final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
if (initialMessage != null) {
  _handleMessage(initialMessage);
}
```

### App in background (warm start)

```dart
FirebaseMessaging.onMessageOpenedApp.listen(_handleMessage);
```

### Handler

```dart
void _handleMessage(RemoteMessage message) {
  final data = message.data;
  final type = data['type'];

  switch (type) {
    case 'ride_invite':
      Get.toNamed('/ride/${data['ride_id']}');
    case 'friend_request':
      Get.toNamed('/profile/${data['user_id']}');
    default:
      Get.toNamed('/notifications');
  }
}
```

---
