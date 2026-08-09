## App Service Wrappers

The app wraps Firebase Auth behind `MyAuthService` (a `GetxService`) for auth
operations, and exposes user data through `MyUserService`. Call these rather
than `FirebaseAuth.instance` directly from controllers and widgets.

Use `MyAuthService` for auth operations:

```dart
// Sign in
final User? user = await MyAuthService.get.signInWithGoogle();
final User? user = await MyAuthService.get.signInWithApple();

// Sign out
await MyAuthService.get.signOut();

// Check state
final bool isSignedIn = MyAuthService.get.isSignedIn;
final User? currentUser = MyAuthService.get.authUser;
```

Access user data through `MyUserService`:

```dart
if (MyUserService.get.isSignedIn.value) {
  final MyUser user = MyUserService.get.user;
}
final String? token = await MyUserService.get.getTokenId();
```

---
