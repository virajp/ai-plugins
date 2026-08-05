# firebase_app_check

## Contents

- [Setup](#setup)
- [Providers](#providers)
- [Initialization](#initialization)
- [Debug Provider](#debug-provider)
- [Token Listener](#token-listener)
- [Enforcement in Firebase Console](#enforcement-in-firebase-console)
- [Anti-Patterns](#anti-patterns)
- [Examples](#examples)

---

## Setup

```yaml
dependencies:
  firebase_core:
  firebase_app_check:
```

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

## Initialization

Activate App Check **after** `Firebase.initializeApp` and **before** any other
Firebase service call.

```dart
import 'package:firebase_app_check/firebase_app_check.dart';

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

### Using App Attest on iOS (stronger)

```dart
await FirebaseAppCheck.instance.activate(
  androidProvider: AndroidProvider.playIntegrity,
  appleProvider: AppleProvider.appAttest,  // iOS 14+; falls back to Device Check
);
```

---

## Debug Provider

Use the debug provider in development and CI environments where real attestation
isn't available.

### Android debug

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

When the debug provider is active, a **debug token** is printed to the console
on first run:

```text
[Firebase/AppCheck][I-FAC004001] Firebase App Check debug token: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

Register this token in the Firebase Console → App Check → Apps → Manage debug
tokens. Each developer/CI machine gets its own token.

### iOS debug token (Xcode)

Add an environment variable to the Xcode scheme:

- **Name:** `FIRAAppCheckDebugToken`
- **Value:** your registered debug token

This avoids printing a new token on every clean build.

---

## Token Listener

Listen for App Check token refreshes (useful for passing tokens to your own
backend):

```dart
FirebaseAppCheck.instance.onTokenChange.listen((token) {
  if (token != null) {
    // Optionally attach to custom backend requests
    print('App Check token refreshed');
  }
});
```

Retrieve the current token manually:

```dart
final token = await FirebaseAppCheck.instance.getToken(
  forcedRefresh: false, // true to force a fresh token
);
```

---

## Enforcement in Firebase Console

App Check **does not block requests by default**. You must enable enforcement
per service in Firebase Console:

1. Firebase Console → App Check → Apps → register your app
2. Firebase Console → App Check → APIs tab → enable enforcement for:
   - Cloud Firestore
   - Cloud Storage
   - Realtime Database
   - Cloud Functions
   - Authentication (optional)

> Enable **monitoring mode** first (observe traffic for a few days) before
> enforcing, to avoid blocking legitimate requests from older app versions.

---

## Anti-Patterns

| Anti-Pattern                                              | Why                                                | Fix                                                                                  |
| --------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Activating App Check after accessing Firebase services    | Those service calls are unprotected                | Activate immediately after `Firebase.initializeApp`                                  |
| Using debug provider in production builds                 | Bypasses all attestation                           | Guard with `kDebugMode` or build flavors                                             |
| Enabling enforcement immediately without monitoring first | Blocks old app versions still in the wild          | Use monitoring mode first, then enforce after old versions are no longer significant |
| Committing debug tokens to source control                 | Debug tokens grant full access; treat like secrets | Store debug tokens in environment variables or CI secrets                            |
| Not registering debug tokens per developer                | Each machine generates a unique token              | Each team member must register their own debug token                                 |

---

## Examples

### Multi-environment activation

```dart
Future<void> activateAppCheck(AppFlavor flavor) async {
  final androidProvider = flavor == AppFlavor.production
      ? AndroidProvider.playIntegrity
      : AndroidProvider.debug;

  final appleProvider = flavor == AppFlavor.production
      ? AppleProvider.deviceCheck
      : AppleProvider.debug;

  await FirebaseAppCheck.instance.activate(
    androidProvider: androidProvider,
    appleProvider: appleProvider,
  );
}
```

### Full `main.dart`

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  await FirebaseAppCheck.instance.activate(
    androidProvider: kDebugMode ? AndroidProvider.debug : AndroidProvider.playIntegrity,
    appleProvider: kDebugMode ? AppleProvider.debug : AppleProvider.deviceCheck,
  );

  runApp(const MyApp());
}
```

### Passing App Check token to a custom backend

```dart
Future<Map<String, String>> get secureHeaders async {
  final appCheckToken = await FirebaseAppCheck.instance.getToken();
  final authToken = await FirebaseAuth.instance.currentUser?.getIdToken();

  return {
    if (authToken != null) 'Authorization': 'Bearer $authToken',
    if (appCheckToken != null) 'X-Firebase-AppCheck': appCheckToken,
    'Content-Type': 'application/json',
  };
}
```
