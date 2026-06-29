## Google Sign-In

Requires `google_sign_in` package. On Web, use `signInWithPopup`.

```dart
import 'package:google_sign_in/google_sign_in.dart';

Future<UserCredential?> signInWithGoogle() async {
  final googleUser = await GoogleSignIn().signIn();
  if (googleUser == null) return null; // user cancelled

  final googleAuth = await googleUser.authentication;

  final credential = GoogleAuthProvider.credential(
    accessToken: googleAuth.accessToken,
    idToken: googleAuth.idToken,
  );

  return FirebaseAuth.instance.signInWithCredential(credential);
}

// Sign out from both
Future<void> signOut() async {
  await FirebaseAuth.instance.signOut();
  await GoogleSignIn().signOut();
}
```

**Web:**

```dart
final provider = GoogleAuthProvider();
provider.addScope('email');
await FirebaseAuth.instance.signInWithPopup(provider);
```

---
