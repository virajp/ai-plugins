# Firebase Auth — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

## Anti-Patterns

| Anti-Pattern                                                       | Why                                                                     | Fix                                                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Polling `currentUser` instead of streaming                         | Misses background token refreshes and sign-out events                   | Use `authStateChanges()` or `userChanges()` stream                                               |
| Branching on `e.message` in catch blocks                           | Message is localised and can change                                     | Always branch on `e.code`                                                                        |
| Calling `updatePassword` / `delete` without reauthentication guard | Throws `requires-recent-login` in production                            | Catch the error, trigger reauthentication, retry                                                 |
| Using `user-not-found` / `wrong-password` error codes              | Deprecated — new projects return `invalid-credential` instead           | Handle `invalid-credential` as the catch-all for wrong credentials                               |
| `signInWithPopup` on native platforms                              | Only works on web                                                       | Use `signInWithProvider` on mobile/desktop, `signInWithPopup` on web                             |
| Not signing out of `GoogleSignIn()`                                | Google sign-in picker re-uses last session; user cannot switch accounts | Call both `FirebaseAuth.instance.signOut()` and `GoogleSignIn().signOut()`                       |
| Storing the ID token long-term                                     | Tokens expire in 1 hour                                                 | Call `getIdToken()` (not `getIdToken(true)`) before each backend request; the SDK auto-refreshes |
| Forgetting to revoke Apple token on account deletion               | App Store rejection                                                     | Call `revokeTokenWithAuthorizationCode` before `user.delete()`                                   |
| Missing `FirebaseAuthMultiFactorException` catch                   | MFA users get a crash instead of a prompt                               | Add a dedicated catch block above `FirebaseAuthException`                                        |
| Importing `cloud_firestore` in services/controllers                | Couples UI/business logic to the data store                             | Go through repository static methods (see [Firestore via the repository layer](#firestore-via-the-repository-layer)) |

---

## Emulator

```dart
// Call before any other auth operation
await FirebaseAuth.instance.useAuthEmulator('localhost', 9099);

// Disable app verification for phone auth testing
await FirebaseAuth.instance.setSettings(
  appVerificationDisabledForTesting: true,
);
```

Development uses Firebase emulators. Gate on the app's debug flag
(`MyEnv.isDebugMode`) and resolve the host from config, accounting for the
Android emulator loopback (`10.0.2.2`):

```dart
if (MyEnv.isDebugMode) {
  await _auth.useAuthEmulator(
    Platform.isAndroid ? '10.0.2.2' : MyConfig.emulatorHost,
    MyConfig.emulatorAuthPort,
  );
}
```

Emulator hosts are set via mise env vars (`FIREBASE_AUTH_EMULATOR_HOST`,
`FIRESTORE_EMULATOR_HOST`). Start the emulators with the project's
emulator-start task (e.g. `mise run setup:deps:start`) before running the app.

---

## Error Handling

Always catch `FirebaseAuthException`. Use `e.code` to branch — never `e.message`
(localised and unstable).

### Common error codes

| Code                        | Trigger                                               | Action                             |
| --------------------------- | ----------------------------------------------------- | ---------------------------------- |
| `invalid-credential`        | Wrong email or password (with enumeration protection) | Show generic "invalid credentials" |
| `email-already-in-use`      | `createUserWithEmailAndPassword` with existing email  | Prompt sign-in instead             |
| `invalid-email`             | Malformed email string                                | Validate before sending            |
| `weak-password`             | Password too short / simple                           | Enforce minimum 8 chars            |
| `operation-not-allowed`     | Auth provider not enabled in console                  | Enable in Firebase Console         |
| `user-disabled`             | Admin disabled the account                            | Show account-disabled message      |
| `requires-recent-login`     | Sensitive op (delete, updatePassword)                 | Trigger reauthentication flow      |
| `too-many-requests`         | Rate limit hit                                        | Back off, show retry message       |
| `network-request-failed`    | No connectivity                                       | Show offline banner                |
| `provider-already-linked`   | Linking an already-linked provider                    | Inform user                        |
| `credential-already-in-use` | Credential belongs to different account               | Offer account merge                |
| `invalid-verification-code` | Wrong SMS code                                        | Allow retry                        |
| `invalid-phone-number`      | Malformed phone                                       | Validate E.164 format              |
| `quota-exceeded`            | SMS quota limit                                       | Show error, contact support        |

```dart
try {
  await auth.signInWithEmailAndPassword(email: email, password: password);
} on FirebaseAuthException catch (e) {
  final message = switch (e.code) {
    'invalid-credential'   => 'Invalid email or password.',
    'user-disabled'        => 'Your account has been disabled.',
    'too-many-requests'    => 'Too many attempts. Try again later.',
    'network-request-failed' => 'No internet connection.',
    _                      => 'Authentication failed. Please try again.',
  };
  showError(message);
} on FirebaseAuthMultiFactorException catch (e) {
  handleMfa(e.resolver);
}
```

---

## firebase_auth

Authenticate users in your Flutter app with Firebase Auth — sign-in flows, user
profiles, auth state streams, MFA, and the app's MyAuthService / MyUserService
wrappers.

Sections in this file:

| Section                                                             | When to read                                        |
| ------------------------------------------------------------------- | --------------------------------------------------- |
| [Anti-Patterns](#anti-patterns)                                     | Avoiding common Firebase Auth mistakes              |
| [Emulator](#emulator)                                               | Wiring the Auth emulator for local development      |
| [Error Handling](#error-handling)                                   | Always catch FirebaseAuthException                  |
| [Setup](#setup)                                                     | Adding the dependency and initializing Firebase     |
| [App service wrappers](#app-service-wrappers)                       | Where auth calls are allowed to originate           |
| [Firestore via the repository layer](#firestore-via-the-repository-layer) | Where `cloud_firestore` is allowed to be imported |

Which providers exist, and how each sign-in call is spelled — email/password,
Google, Apple, OAuth, phone, anonymous, provider linking, MFA, user
management — is API surface. Fetch it from Context7 at use time; what this
reference carries is the wiring and the layering rules around it.

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

## App service wrappers

**Controllers and widgets never call `FirebaseAuth.instance` directly.** Auth
operations go through `MyAuthService` (a `GetxService`); user data goes through
`MyUserService`. The wrapper is what keeps the SDK at one seam — swapping a
provider, adding App Check headers or stubbing auth in a test all become one
edit instead of a search across the widget tree.

```dart
// Auth operations
final User? user = await MyAuthService.get.signInWithGoogle();
await MyAuthService.get.signOut();
final bool isSignedIn = MyAuthService.get.isSignedIn;

// User data
if (MyUserService.get.isSignedIn.value) {
  final MyUser user = MyUserService.get.user;
}
final String? token = await MyUserService.get.getTokenId();
```

---

## Firestore via the repository layer

**Never import `cloud_firestore` in a service or a controller.** Firestore
access is a repository's job — static methods, no state — for the same reason
HTTP access is (see [Standards & architecture](../standards-and-architecture.md)).
The repository catches, wraps the failure in `MyException`, logs it through
`Logger`, and returns `null` or `false`; it does not let a Firestore exception
escape into a controller.

```dart
// In a repository
static Future<MyRide?> fetchRide(final String rideId) async {
  try {
    final DocumentSnapshot<Map<String, dynamic>> doc = await FirebaseFirestore.instance
        .collection('rides')
        .doc(rideId)
        .get();
    if (!doc.exists || doc.data() == null) return null;
    return MyRide.fromJson(doc.data()!);
  } catch (error, stackTrace) {
    Logger.error(MyException(
      code: ExceptionCodes.unexpectedException,
      exception: error,
      stackTrace: stackTrace,
      ctx: {'rideId': rideId, 'caller': 'MyRideRepo.fetchRide'},
    ));
    return null;
  }
}
```

---
