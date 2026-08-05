## Topics

Topics allow broadcast messaging to groups of devices without managing device
tokens.

```dart
// Subscribe (call after permission grant)
await FirebaseMessaging.instance.subscribeToTopic('all_riders');
await FirebaseMessaging.instance.subscribeToTopic('region_california');

// Unsubscribe
await FirebaseMessaging.instance.unsubscribeFromTopic('region_california');
```

Topic names: letters, numbers, hyphens, underscores only. Max 900 subscriptions
per device.

---
