## Apple Sign-In

Required for iOS/macOS apps offering social sign-in (App Store rule). Always
available via `signInWithProvider` on native.

```dart
Future<UserCredential> signInWithApple() async {
  final provider = AppleAuthProvider()
    ..addScope('email')
    ..addScope('name');

  if (kIsWeb) {
    return FirebaseAuth.instance.signInWithPopup(provider);
  }

  final credential = await FirebaseAuth.instance.signInWithProvider(provider);

  // Store authorization code for token revocation (required for App Store)
  final authCode = credential.additionalUserInfo?.authorizationCode;

  return credential;
}

// Revoke Apple token on account deletion (App Store requirement)
Future<void> deleteAccount(String authorizationCode) async {
  await FirebaseAuth.instance
      .revokeTokenWithAuthorizationCode(authorizationCode);
  await FirebaseAuth.instance.currentUser?.delete();
}
```

---
