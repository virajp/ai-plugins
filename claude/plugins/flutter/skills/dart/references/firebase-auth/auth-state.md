## Auth State

Use streams to reactively respond to sign-in/sign-out without polling.

| Stream               | Triggers on                                   |
| -------------------- | --------------------------------------------- |
| `authStateChanges()` | Sign in, sign out                             |
| `idTokenChanges()`   | Sign in, sign out, token refresh              |
| `userChanges()`      | All of the above + profile/credential updates |

```dart
// Typical gate widget
StreamBuilder<User?>(
  stream: FirebaseAuth.instance.authStateChanges(),
  builder: (context, snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const SplashScreen();
    }
    if (snapshot.hasData) return const HomeScreen();
    return const LoginScreen();
  },
)
```

```dart
// GetX reactive listener (in a service)
FirebaseAuth.instance.authStateChanges().listen((user) {
  isSignedIn.value = user != null;
});
```

### Current user (synchronous)

```dart
final User? user = FirebaseAuth.instance.currentUser;
if (user != null) {
  print(user.uid);
  print(user.email);
  print(user.displayName);
  print(user.emailVerified);
}
```

---
