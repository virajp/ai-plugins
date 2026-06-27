---
name: firebase-analytics
version: 0.1.0
category: development
description:
  Track user events and screen views in your Flutter app with Firebase
  Analytics — custom events, predefined event taxonomy, user properties, screen
  tracking, and consent gating. Use when logging custom events, setting user
  properties, tracking screen navigation, or enabling/disabling data collection
  for GDPR compliance.
license: MIT
user-invocable: false
---

# firebase_analytics

## Contents

- [Setup](#setup)
- [Instance](#instance)
- [Logging Events](#logging-events)
- [Predefined Events](#predefined-events)
- [Screen Tracking](#screen-tracking)
- [User Properties](#user-properties)
- [User ID](#user-id)
- [Session Control](#session-control)
- [Consent & GDPR](#consent--gdpr)
- [Debugging](#debugging)
- [Anti-Patterns](#anti-patterns)
- [Examples](#examples)

---

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

## Instance

```dart
final analytics = FirebaseAnalytics.instance;

// Secondary Firebase app
final analytics = FirebaseAnalytics.instanceFor(app: Firebase.app('secondary'));
```

> Analytics only works on the **default** Firebase app. Events logged on
> secondary apps are silently dropped.

---

## Logging Events

```dart
// Generic event
await analytics.logEvent(
  name: 'share_content',
  parameters: {
    'content_type': 'image',
    'item_id': 'item_12345',
  },
);
```

### Naming rules

- Snake*case only: `[a-z0-9*]`, max 40 chars
- Parameter names: max 40 chars; parameter values: max 100 chars
- Max 25 parameters per event
- Reserved prefix: `firebase_`, `google_`, `ga_` — avoid these

---

## Predefined Events

Use predefined event methods when available — they map to Firebase's standard
event taxonomy and enable auto-populated reports.

```dart
// E-commerce
await analytics.logPurchase(
  currency: 'USD',
  value: 9.99,
  transactionId: 'txn_abc123',
  items: [
    AnalyticsEventItem(
      itemId: 'plan_pro',
      itemName: 'Pro Plan',
      price: 9.99,
      quantity: 1,
    ),
  ],
);

// Search
await analytics.logSearch(searchTerm: 'running shoes');

// Login
await analytics.logLogin(loginMethod: 'google');

// Sign up
await analytics.logSignUp(signUpMethod: 'email');

// Share
await analytics.logShare(
  contentType: 'route',
  itemId: 'route_42',
  method: 'link',
);

// Tutorial
await analytics.logTutorialBegin();
await analytics.logTutorialComplete();

// Level in game / progress
await analytics.logLevelStart(levelName: 'onboarding');
await analytics.logLevelEnd(levelName: 'onboarding', success: true);

// Select content
await analytics.logSelectContent(contentType: 'article', itemId: 'abc');

// View item
await analytics.logViewItem(
  currency: 'USD',
  value: 9.99,
  items: [AnalyticsEventItem(itemId: 'plan_pro', itemName: 'Pro Plan')],
);
```

Full list: `analytics.log*` — check the IDE autocomplete for all predefined
methods.

---

## Screen Tracking

### Manual (recommended for GetX)

```dart
await analytics.logScreenView(
  screenName: 'HomeScreen',
  screenClass: 'HomeScreen',
);
```

Call this in `onReady` or `onInit` of a GetX controller, or inside the widget's
`initState`.

### Automatic with `FirebaseAnalyticsObserver`

Add the observer to your `GetMaterialApp` or `MaterialApp`:

```dart
GetMaterialApp(
  navigatorObservers: [
    FirebaseAnalyticsObserver(analytics: FirebaseAnalytics.instance),
  ],
  // ...
)
```

The observer reads the `RouteSettings.name` of each pushed route. For named
routes this works automatically. For anonymous routes, override `RouteAware` or
log manually.

---

## User Properties

User properties persist across sessions and segment your audience in reports.

```dart
// Set
await analytics.setUserProperty(name: 'membership_tier', value: 'premium');
await analytics.setUserProperty(name: 'preferred_unit', value: 'km');

// Clear
await analytics.setUserProperty(name: 'membership_tier', value: null);
```

- Max 25 custom user properties per project
- Name: max 24 chars, snake_case
- Value: max 36 chars

---

## User ID

Link analytics data to your own user identifier (do NOT use PII like
email/phone).

```dart
// Set after sign-in
await analytics.setUserId(id: user.uid);

// Clear on sign-out
await analytics.setUserId(id: null);
```

---

## Session Control

```dart
// Minimum session duration before a new session is created (default: 30 minutes)
await analytics.setSessionTimeoutDuration(const Duration(minutes: 10));
```

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

## Debugging

### Android

```bash
adb shell setprop debug.firebase.analytics.app com.example.app
```

### iOS (Xcode)

Add `-FIRDebugEnabled` to the scheme's launch arguments.

### DebugView

Open Firebase Console → Analytics → DebugView to see events in real time (debug
builds only).

```dart
// Verify events are being logged in debug
if (kDebugMode) {
  await analytics.setAnalyticsCollectionEnabled(true);
}
```

---

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

## Examples

### Analytics service (GetX)

```dart
class AnalyticsService extends GetxService {
  static AnalyticsService get to => Get.find();
  final _analytics = FirebaseAnalytics.instance;

  Future<AnalyticsService> init() async => this;

  Future<void> setUser(String uid, String membershipTier) async {
    await _analytics.setUserId(id: uid);
    await _analytics.setUserProperty(name: 'membership_tier', value: membershipTier);
  }

  Future<void> clearUser() async {
    await _analytics.setUserId(id: null);
    await _analytics.setUserProperty(name: 'membership_tier', value: null);
  }

  Future<void> logScreen(String name) async {
    await _analytics.logScreenView(screenName: name, screenClass: name);
  }

  Future<void> logRouteStarted(String routeId) async {
    await _analytics.logEvent(name: 'route_started', parameters: {'route_id': routeId});
  }

  Future<void> logLogin(String method) => _analytics.logLogin(loginMethod: method);
}
```

### Screen tracking in GetX controller

```dart
class HomeController extends GetxController {
  @override
  void onReady() {
    super.onReady();
    AnalyticsService.to.logScreen('HomeScreen');
  }
}
```

### Consent gate pattern

```dart
class ConsentService extends GetxService {
  final _analytics = FirebaseAnalytics.instance;

  Future<void> onConsentGranted() async {
    await _analytics.setAnalyticsCollectionEnabled(true);
    await _analytics.setConsent(
      analyticsStorageConsentGranted: true,
      adStorageConsentGranted: false,
    );
  }

  Future<void> onConsentDenied() async {
    await _analytics.setAnalyticsCollectionEnabled(false);
  }
}
```
