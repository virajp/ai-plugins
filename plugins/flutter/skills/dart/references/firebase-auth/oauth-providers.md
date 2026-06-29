## OAuth Providers

All OAuth providers follow the same pattern: create provider, add scopes, call
`signInWithProvider` (native) or `signInWithPopup` (web).

```dart
Future<void> signInWith(AuthProvider provider) async {
  if (kIsWeb) {
    await FirebaseAuth.instance.signInWithPopup(provider);
  } else {
    await FirebaseAuth.instance.signInWithProvider(provider);
  }
}

// GitHub
signInWith(GithubAuthProvider());

// Microsoft
signInWith(MicrosoftAuthProvider()..addScope('user.read'));

// Twitter
signInWith(TwitterAuthProvider());

// Yahoo
signInWith(YahooAuthProvider());

// Facebook (requires facebook_auth package)
final result = await FacebookAuth.instance.login();
if (result.status == LoginStatus.success) {
  await FirebaseAuth.instance.signInWithCredential(
    FacebookAuthProvider.credential(result.accessToken!.tokenString),
  );
}
```

---
