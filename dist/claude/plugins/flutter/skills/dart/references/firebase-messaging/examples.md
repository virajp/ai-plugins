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
