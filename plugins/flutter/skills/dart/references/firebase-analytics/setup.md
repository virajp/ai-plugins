## Setup

```yaml
dependencies:
  firebase_core:
  firebase_analytics:
```

Firebase must be initialized before use:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MyApp());
}
```

---
