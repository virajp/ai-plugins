# Firebase Analytics — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

## Anti-Patterns

| Anti-Pattern                                   | Why                                          | Fix                                    |
| ---------------------------------------------- | -------------------------------------------- | -------------------------------------- |
| Using PII in user ID or parameters             | Violates Firebase ToS and privacy laws       | Use opaque UIDs only                   |
| Logging events before `Firebase.initializeApp` | Throws `FirebaseException`                   | Initialize Firebase first              |
| Logging events on a secondary app              | Events are silently dropped                  | Analytics must use the default app     |
| Using `logEvent` for standard events           | Misses Firebase's predefined taxonomy        | Use `analytics.log*` named methods     |
| Not clearing `userId` on sign-out              | Subsequent sessions attributed to wrong user | Call `setUserId(id: null)` on sign-out |
| Logging dozens of params per event             | Only first 25 sent; excess silently dropped  | Keep event schemas focused             |

---

## Consent & GDPR

```dart
// Disable all data collection (call before initializeApp for full effect)
await analytics.setAnalyticsCollectionEnabled(false);

// Re-enable after user consent
await analytics.setAnalyticsCollectionEnabled(true);

// Granular consent (requires Analytics v10.1+)
await analytics.setConsent(
  analyticsStorageConsentGranted: true,
  adStorageConsentGranted: false,
  adUserDataConsentGranted: false,
  adPersonalizationSignalsConsentGranted: false,
);
```

Alternatively, disable collection persistently in `AndroidManifest.xml`:

```xml
<meta-data
  android:name="firebase_analytics_collection_enabled"
  android:value="false"
/>
```

And in `Info.plist`:

```xml
<key>FIREBASE_ANALYTICS_COLLECTION_ENABLED</key>
<false />
```

Then enable at runtime only when the user consents.

---

## firebase_analytics

Track user events and screen views in your Flutter app with Firebase Analytics —
custom events, predefined event taxonomy, user properties, screen tracking, and
consent gating.

Sections in this file:

| Section                         | When to read                                     |
| ------------------------------- | ------------------------------------------------ |
| [Anti-Patterns](#anti-patterns) | Avoiding common Analytics mistakes               |
| [Consent & GDPR](#consent--gdpr) | Gating data collection on user consent (GDPR)   |
| [Setup](#setup)                 | Adding the dependency and initializing Analytics |

The event and property API — logging custom events, the predefined event
taxonomy, screen tracking, user properties, user ID, session control and the
debug view — is API surface. Fetch it from Context7 at use time.

## Setup

```yaml
dependencies:
  firebase_core:
  firebase_analytics:
```

Firebase must be initialized before use:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MyApp());
}
```

---
