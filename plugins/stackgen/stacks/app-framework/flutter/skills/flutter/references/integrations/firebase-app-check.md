# Firebase App Check — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

## Anti-Patterns

| Anti-Pattern                                              | Why                                                | Fix                                                                                  |
| --------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Activating App Check after accessing Firebase services    | Those service calls are unprotected                | Activate immediately after `Firebase.initializeApp`                                  |
| Using debug provider in production builds                 | Bypasses all attestation                           | Guard with `kDebugMode` or build flavors                                             |
| Enabling enforcement immediately without monitoring first | Blocks old app versions still in the wild          | Use monitoring mode first, then enforce after old versions are no longer significant |
| Committing debug tokens to source control                 | Debug tokens grant full access; treat like secrets | Store debug tokens in environment variables or CI secrets                            |
| Not registering debug tokens per developer                | Each machine generates a unique token              | Each team member must register their own debug token                                 |

---

## firebase_app_check

Attest that a Firebase request came from your genuine, unmodified app — provider
choice per platform, the debug path for development and CI, token refresh, and
console-side enforcement.

Sections in this file:

| Section                                                    | When to read                                       |
| ---------------------------------------------------------- | -------------------------------------------------- |
| [Anti-Patterns](#anti-patterns)                            | Avoiding common App Check mistakes                 |
| [Providers](#providers)                                    | Choosing the attestation provider per platform     |
| [Setup](#setup)                                            | Adding the dependency and activating App Check     |
| [Debug provider](#debug-provider)                          | Running in development and CI without attestation  |
| [Token listener](#token-listener)                          | Passing the token to your own backend              |
| [Enforcement in Firebase Console](#enforcement-in-firebase-console) | Turning enforcement on without locking users out |
| [Multi-environment activation](#multi-environment-activation) | Selecting providers per flavor                  |

---

## Providers

App Check verifies the app's integrity using platform-specific attestation APIs.

| Platform          | Production Provider          | What it checks                                |
| ----------------- | ---------------------------- | --------------------------------------------- |
| Android           | Play Integrity (recommended) | Google Play app integrity attestation         |
| Android (legacy)  | SafetyNet                    | Deprecated — migrate to Play Integrity        |
| iOS               | Device Check                 | Apple device-level attestation                |
| iOS (alternative) | App Attest                   | Stronger Apple hardware attestation (iOS 14+) |
| All (testing)     | Debug Provider               | Allows testing without real attestation       |

---

## Setup

```yaml
dependencies:
  firebase_core:
  firebase_app_check:
```

**Activation order is the contract**: activate **after** `Firebase.initializeApp`
and **before** any other Firebase service call. Anything reached in between is
unprotected.

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  await FirebaseAppCheck.instance.activate(
    androidProvider: AndroidProvider.playIntegrity,
    appleProvider: AppleProvider.deviceCheck,
  );

  runApp(const MyApp());
}
```

`AppleProvider.appAttest` is the stronger iOS choice (iOS 14+) and falls back to
Device Check on older systems.

---

## Debug provider

Real attestation is unavailable in development and CI, so those builds use the
debug provider — never a release build.

```dart
await FirebaseAppCheck.instance.activate(
  androidProvider: kDebugMode
      ? AndroidProvider.debug
      : AndroidProvider.playIntegrity,
  appleProvider: kDebugMode
      ? AppleProvider.debug
      : AppleProvider.deviceCheck,
);
```

With the debug provider active a **debug token** is printed to the console on
first run:

```text
[Firebase/AppCheck][I-FAC004001] Firebase App Check debug token: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

Register it in Firebase Console → App Check → Apps → Manage debug tokens.
**Each developer and each CI machine gets its own token**, and a debug token is
a credential — keep it out of source control.

### iOS — pinning the token in the Xcode scheme

Add an environment variable to the scheme so a clean build does not mint a new
token every time:

- **Name:** `FIRAAppCheckDebugToken`
- **Value:** your registered debug token

---

## Token listener

The token rotates. Listen for refreshes when a custom backend needs to see it:

```dart
FirebaseAppCheck.instance.onTokenChange.listen((token) {
  if (token != null) {
    // Attach to custom backend requests
  }
});

final token = await FirebaseAppCheck.instance.getToken(forcedRefresh: false);
```

Passing it to your own backend alongside the auth token:

```dart
Future<Map<String, String>> get secureHeaders async {
  final appCheckToken = await FirebaseAppCheck.instance.getToken();
  final authToken = await MyUserService.get.getTokenId();

  return {
    if (authToken != null) 'Authorization': 'Bearer $authToken',
    if (appCheckToken != null) 'X-Firebase-AppCheck': appCheckToken,
    'Content-Type': 'application/json',
  };
}
```

---

## Enforcement in Firebase Console

App Check **does not block requests by default** — activating it in the app
changes nothing until enforcement is switched on per service, which is console
work, not code:

1. Firebase Console → App Check → Apps → register your app.
2. Firebase Console → App Check → APIs tab → enable enforcement for Cloud
   Firestore, Cloud Storage, Realtime Database, Cloud Functions, and optionally
   Authentication.

Enable **monitoring mode** first and watch traffic for a few days before
enforcing. Enforcing immediately locks out every older app version still in the
wild, and those users cannot upgrade their way out of a failed request.

---

## Multi-environment activation

Flavors select the provider, so a non-production build never carries production
attestation and a production build never carries the debug provider:

```dart
Future<void> activateAppCheck(final AppFlavor flavor) async {
  final isProduction = flavor == AppFlavor.production;

  await FirebaseAppCheck.instance.activate(
    androidProvider:
        isProduction ? AndroidProvider.playIntegrity : AndroidProvider.debug,
    appleProvider:
        isProduction ? AppleProvider.deviceCheck : AppleProvider.debug,
  );
}
```

See [Build, flavors & signing](../build-flavors-signing.md) for how the flavor
reaches the entry point.

---
