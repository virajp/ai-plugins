## Examples

### Full sign-in + auth gate (GetX)

```dart
class AuthService extends GetxService {
  static AuthService get to => Get.find();
  final isSignedIn = false.obs;
  User? get user => FirebaseAuth.instance.currentUser;

  Future<AuthService> init() async {
    FirebaseAuth.instance.authStateChanges().listen((u) {
      isSignedIn.value = u != null;
    });
    return this;
  }

  Future<void> signInWithEmail(String email, String password) async {
    await FirebaseAuth.instance.signInWithEmailAndPassword(
      email: email, password: password,
    );
  }

  Future<void> signOut() async {
    await FirebaseAuth.instance.signOut();
    await GoogleSignIn().signOut();
  }
}
```

### Attach token to every API request

```dart
Future<Map<String, String>> get authHeaders async {
  final token = await FirebaseAuth.instance.currentUser?.getIdToken();
  return {
    if (token != null) 'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  };
}
```

### Account exists with different provider

```dart
try {
  await FirebaseAuth.instance
      .signInWithCredential(googleCredential);
} on FirebaseAuthException catch (e) {
  if (e.code == 'account-exists-with-different-credential') {
    // Ask user to sign in with their original provider,
    // then link the new credential
    final methods = await FirebaseAuth.instance
        .fetchSignInMethodsForEmail(e.email!);
    // Guide user to sign in with methods.first, then link
  }
}
```

### Send email verification and wait for it

```dart
Future<void> waitForEmailVerification() async {
  final user = FirebaseAuth.instance.currentUser!;
  await user.sendEmailVerification();

  // Poll until verified (or use dynamic links to trigger app open)
  while (!user.emailVerified) {
    await Future.delayed(const Duration(seconds: 3));
    await user.reload();
  }
}
```

### Profile update with display name

```dart
Future<void> completeProfile(String name, String photoUrl) async {
  final user = FirebaseAuth.instance.currentUser!;
  await user.updateProfile(displayName: name, photoUrl: photoUrl);
  await user.reload();
}
```
