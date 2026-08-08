## Provider Linking

Allow one account to sign in with multiple providers.

```dart
// Link Google to an existing email/password account
final googleUser = await GoogleSignIn().signIn();
final googleAuth = await googleUser!.authentication;
final credential = GoogleAuthProvider.credential(
  accessToken: googleAuth.accessToken,
  idToken: googleAuth.idToken,
);

try {
  await FirebaseAuth.instance.currentUser!.linkWithCredential(credential);
} on FirebaseAuthException catch (e) {
  if (e.code == 'credential-already-in-use') {
    // Credential linked to a different account
  }
  if (e.code == 'provider-already-linked') {
    // This provider already linked to this user
  }
}

// Unlink
await user.unlink(GoogleAuthProvider.PROVIDER_ID);

// List linked providers
final providers = user.providerData.map((p) => p.providerId).toList();
```

---
