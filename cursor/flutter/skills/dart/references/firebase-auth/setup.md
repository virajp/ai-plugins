## Setup

```yaml
dependencies:
  firebase_core:
  firebase_auth:
  google_sign_in: # for Google Sign-In
```

Firebase must be initialized before any auth call:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MyApp());
}
```

```dart
final auth = FirebaseAuth.instance;

// Secondary Firebase app (e.g. dev/prod split)
final auth = FirebaseAuth.instanceFor(app: Firebase.app('dev'));
```

---
