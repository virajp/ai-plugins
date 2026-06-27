---
name: firebase-messaging
version: 0.1.0
category: development
description: Send and receive push notifications in your Flutter app with
  Firebase Cloud Messaging (FCM) — permissions, FCM tokens,
  foreground/background/terminated message handling, tap routing, topics, local
  notifications, and Android/iOS configuration. Use when requesting notification
  permissions, handling foreground/background/terminated messages, subscribing
  to topics, or displaying local notifications.
license: MIT
user-invocable: false
---

# firebase_messaging

## Contents

- [Setup](#setup)
- [Permissions](#permissions)
- [FCM Token](#fcm-token)
- [Message Types](#message-types)
- [Foreground Messages](#foreground-messages)
- [Background Messages](#background-messages)
- [Notification Tap Handling](#notification-tap-handling)
- [Topics](#topics)
- [Local Notifications](#local-notifications)
- [Android Configuration](#android-configuration)
- [iOS Configuration](#ios-configuration)
- [Anti-Patterns](#anti-patterns)
- [Examples](#examples)

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

## Message Types

| Type                 | App State               | Handler                                                                    |
| -------------------- | ----------------------- | -------------------------------------------------------------------------- |
| Notification message | Foreground              | `FirebaseMessaging.onMessage`                                              |
| Notification message | Background / Terminated | System tray; tap opens app via `getInitialMessage` or `onMessageOpenedApp` |
| Data message         | Foreground              | `FirebaseMessaging.onMessage`                                              |
| Data message         | Background              | `FirebaseMessaging.onBackgroundMessage` top-level handler                  |
| Data message         | Terminated              | `FirebaseMessaging.onBackgroundMessage` top-level handler                  |

---

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

## Background Messages

The background handler **must** be a top-level function (not a class method or
closure) and must be registered before `runApp`.

```dart
// Top-level function — must not be inside a class
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Firebase must be initialized here too — it runs in a separate isolate
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  print('Background message: ${message.messageId}');
  // Do NOT update UI here — runs in background isolate
  // Use shared_preferences or SQLite to persist data for UI to read on resume
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Register BEFORE initializeApp
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MyApp());
}
```

---

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

## Local Notifications

FCM notification messages on Android are shown automatically when the app is in
the background. For foreground display or custom styling, use
`flutter_local_notifications`.

```dart
// flutter_local_notifications setup (brief)
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

final _localNotifications = FlutterLocalNotificationsPlugin();

Future<void> initLocalNotifications() async {
  await _localNotifications.initialize(
    const InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(),
    ),
  );
}

Future<void> showNotification(RemoteMessage message) async {
  final notification = message.notification;
  if (notification == null) return;

  await _localNotifications.show(
    notification.hashCode,
    notification.title,
    notification.body,
    const NotificationDetails(
      android: AndroidNotificationDetails(
        'default_channel',
        'General',
        importance: Importance.high,
        priority: Priority.high,
      ),
    ),
    payload: jsonEncode(message.data),
  );
}
```

---

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

## Examples

### Messaging service (GetX)

```dart
class MessagingService extends GetxService {
  static MessagingService get to => Get.find();
  final _messaging = FirebaseMessaging.instance;
  final currentToken = ''.obs;

  Future<MessagingService> init() async {
    await _requestPermission();
    await _setupToken();
    _setupForegroundHandler();
    _setupOpenedAppHandler();
    return this;
  }

  Future<void> _requestPermission() async {
    await _messaging.requestPermission(alert: true, badge: true, sound: true);
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true, badge: true, sound: true,
    );
  }

  Future<void> _setupToken() async {
    final token = await _messaging.getToken();
    if (token != null) await _uploadToken(token);
    _messaging.onTokenRefresh.listen(_uploadToken);
  }

  Future<void> _uploadToken(String token) async {
    currentToken.value = token;
    // await ApiService.to.updateFcmToken(token);
  }

  void _setupForegroundHandler() {
    FirebaseMessaging.onMessage.listen((message) {
      // Show local notification or in-app banner
    });
  }

  void _setupOpenedAppHandler() {
    FirebaseMessaging.onMessageOpenedApp.listen(_navigate);
  }

  Future<void> checkInitialMessage() async {
    final message = await _messaging.getInitialMessage();
    if (message != null) _navigate(message);
  }

  void _navigate(RemoteMessage message) {
    final type = message.data['type'];
    switch (type) {
      case 'ride_invite': Get.toNamed('/ride/${message.data['id']}');
      default: Get.toNamed('/notifications');
    }
  }

  Future<void> onSignOut() async {
    await _messaging.deleteToken();
    await _messaging.unsubscribeFromTopic('all_riders');
  }
}
```

### Register background handler in `main.dart`

```dart
@pragma('vm:entry-point')
Future<void> _bgHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  // Persist data for UI to read on resume
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  FirebaseMessaging.onBackgroundMessage(_bgHandler);
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MyApp());
}
```
