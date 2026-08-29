# Firebase Messaging — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

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

## Anti-Patterns

| Anti-Pattern                                    | Why                                           | Fix                                                                  |
| ----------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| Background handler as a class method or closure | FCM requires a top-level isolate entry point  | Use `@pragma('vm:entry-point')` top-level function                   |
| Not initializing Firebase in background handler | Other Firebase services throw                 | Call `Firebase.initializeApp()` at the top of the background handler |
| Storing token in local state only               | Token can refresh at any time                 | Listen to `onTokenRefresh` and always update backend                 |
| Not deleting token on sign-out                  | User receives notifications after sign-out    | Call `deleteToken()` and unsubscribe from all topics on sign-out     |
| Updating UI from background handler             | Background handler runs in a separate isolate | Write to shared_preferences; update UI when app resumes              |
| Forgetting `getInitialMessage`                  | Cold-start taps are silently ignored          | Always check `getInitialMessage` on app launch                       |
| Hardcoding topic names                          | Topics are global across your project         | Define topic names as constants                                      |

---

## firebase_messaging

Send and receive push notifications in your Flutter app with Firebase Cloud
Messaging (FCM) — permissions, FCM tokens, foreground/background/terminated
message handling, tap routing, topics, local notifications, and Android/iOS
configuration.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                                     | When to read                                                 |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Setup                                         | Adding the dependencies and initializing FCM                 |
| Permissions                             | Requesting notification permission on iOS and Android 13+    |
| FCM Token                                 | Getting and storing the device token for your backend        |
| Message Types                         | Choosing the right handler for a message type                |
| Foreground Messages             | Displaying notifications while the app is in foreground      |
| Background Messages             | Handling messages when the app is backgrounded or terminated |
| Notification Tap Handling | Routing to a screen when a notification is tapped            |
| Topics                                       | Broadcasting messages to groups of devices via topics        |
| Local Notifications             | Customizing notification appearance with local notifications |
| Android Configuration         | Configuring notification channels and icons on Android       |
| iOS Configuration                 | Enabling push notifications and APNs keys on iOS             |
| Anti-Patterns                         | Avoiding common FCM implementation mistakes                  |
| Examples                                   | Production-ready messaging service implementation            |

## iOS Configuration

### Xcode capabilities

Enable **Push Notifications** and **Background Modes → Remote notifications** in
the Xcode target's Signing & Capabilities.

### APNS setup

FCM uses APNS under the hood on iOS. Upload your APNS key or certificate in
Firebase Console → Project Settings → Cloud Messaging.

### `Info.plist`

```xml
<!-- Allow FCM to work with APNS in background -->
<key>UIBackgroundModes</key>
<array>
  <string>fetch</string>
  <string>remote-notification</string>
</array>
```

---

## Permissions

iOS requires explicit permission; Android 13+ (`targetSdk >= 33`) also requires
it.

```dart
final messaging = FirebaseMessaging.instance;

final settings = await messaging.requestPermission(
  alert: true,
  badge: true,
  sound: true,
  announcement: false,
  carPlay: false,
  criticalAlert: false,
  provisional: false, // true = delivers quietly without user prompt on iOS
);

switch (settings.authorizationStatus) {
  case AuthorizationStatus.authorized:
    print('Notifications authorized');
  case AuthorizationStatus.provisional:
    print('Provisional (quiet) authorization');
  case AuthorizationStatus.denied:
    print('Notifications denied');
  case AuthorizationStatus.notDetermined:
    print('Not yet determined');
}
```

---

## Setup

```yaml
dependencies:
  firebase_core:
  firebase_messaging:
  # Optional: display foreground notifications on iOS / styled Android notifications
  # flutter_local_notifications:
```

---
