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
