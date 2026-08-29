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

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                     | When to read                                              |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Setup                         | Adding the dependency and initializing Analytics          |
| Instance                   | Accessing the FirebaseAnalytics instance                  |
| Logging Events       | Logging a custom event with parameters                    |
| Predefined Events | Tracking standard events like purchases, logins, searches |
| Screen Tracking     | Tracking screen views across app navigation               |
| User Properties     | Segmenting users with persistent user properties          |
| User ID                     | Linking analytics to your app's user identifier           |
| Session Control     | Customizing the session timeout duration                  |
| Consent & GDPR         | Gating data collection on user consent (GDPR)             |
| Debugging                 | Debugging events in real time during development          |
| Anti-Patterns         | Avoiding common Analytics mistakes                        |
| Examples                   | Analytics GetX service wrapper example                    |

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
