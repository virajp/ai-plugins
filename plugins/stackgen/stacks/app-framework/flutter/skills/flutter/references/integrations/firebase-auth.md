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
| Importing `cloud_firestore` in services/controllers                | Couples UI/business logic to the data store                             | Go through repository static methods (see Firestore via Repository)                              |

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

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                                    | When to read                                                          |
| ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Setup                                             | Adding the dependency and initializing Firebase                       |
| Auth State                                   | Use streams to reactively respond to sign-in/sign-out without polling |
| Email & Password                         | Building email/password registration and sign-in                      |
| Google Sign-In                           | Implementing Google Sign-In authentication                            |
| Apple Sign-In                             | Required for iOS/macOS apps offering social sign-in (App Store rule)  |
| OAuth Providers                         | Integrating third-party OAuth providers like GitHub or Microsoft      |
| Phone Authentication               | Implementing phone-number verification and SMS-based sign-in          |
| Anonymous Authentication       | Enabling guest flows with anonymous authentication                    |
| User Management                         | Managing user profiles, emails, passwords, and account deletion       |
| Provider Linking                       | Allow one account to sign in with multiple providers                  |
| Multi-Factor Authentication | Enrolling two-factor authentication with phone or TOTP                |
| Error Handling                           | Always catch FirebaseAuthException                                    |
| App Service Wrappers               | Using the app's MyAuthService and MyUserService wrappers              |
| Emulator                                       | Wiring the Auth emulator for local development                        |
| Firestore via Repository       | Accessing Firestore through the repository layer                      |
| Anti-Patterns                             | Avoiding common Firebase Auth mistakes                                |
| Examples                                       | Complete code examples for common auth scenarios                      |

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
