## Android Configuration

### Notification channel (Android 8+)

```dart
// Create channel before showing any notifications
const AndroidNotificationChannel channel = AndroidNotificationChannel(
  'high_importance_channel',
  'High Importance Notifications',
  description: 'Used for important notifications.',
  importance: Importance.high,
);

await _localNotifications
    .resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>()
    ?.createNotificationChannel(channel);
```

### `AndroidManifest.xml` — default channel for FCM

```xml
<meta-data
  android:name="com.google.firebase.messaging.default_notification_channel_id"
  android:value="high_importance_channel"
/>

<!-- Default notification icon (monochrome, transparent bg) -->
<meta-data
  android:name="com.google.firebase.messaging.default_notification_icon"
  android:resource="@drawable/ic_notification"
/>

<!-- Default notification color -->
<meta-data
  android:name="com.google.firebase.messaging.default_notification_color"
  android:resource="@color/colorPrimary"
/>
```

---
