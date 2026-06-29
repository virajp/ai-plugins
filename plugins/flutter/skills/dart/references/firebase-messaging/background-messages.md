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
