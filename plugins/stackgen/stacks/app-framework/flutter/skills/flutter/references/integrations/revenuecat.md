# RevenueCat — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

## Anti-Patterns

| Anti-Pattern                                        | Why                                                   | Fix                                                      |
| --------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| Checking entitlements from a local flag             | Can be spoofed; misses renewals/cancellations         | Always call `getCustomerInfo()` or listen to updates     |
| Not calling `logIn` after sign-in                   | Purchases attributed to anonymous user; hard to merge | `logIn` immediately after Firebase `signIn`              |
| Not handling `purchaseCancelledError`               | Showing an error on user cancel is poor UX            | Catch and silently return `false`                        |
| Hardcoding API keys in source                       | Exposed in version control                            | Use environment variables or app flavor config           |
| Showing paywall without checking entitlements first | Pro users see paywall on every launch                 | Gate behind `hasEntitlement` check                       |
| Not providing a "Restore Purchases" button          | App Store rejection risk                              | Required on iOS; include in Settings or paywall          |
| Calling `getCustomerInfo` on every screen build     | Unnecessary network calls                             | Cache result reactively via `CustomerInfoUpdateListener` |

---

## RevenueCat (purchases_flutter)

Implements in-app subscriptions and purchases in a Flutter app using RevenueCat
(purchases_flutter) — initialization, user identification, offerings,
purchase/restore flows, entitlement checks, and pre-built paywalls.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                               | When to read                                                      |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Setup                                           | Adding the package, store products, and API keys                  |
| Initialization                         | Initialize once, as early as possible — before any purchase calls |
| Identify User                           | Linking purchases to your own user ID after sign-in               |
| Fetch Offerings                       | Fetching available packages and prices for a paywall              |
| Purchase a Package                 | Running a purchase and handling cancel/pending errors             |
| Check Entitlements                 | Checking whether a user has active access (e.g., Pro)             |
| Restore Purchases                   | Required by App Store guidelines — must be accessible from the UI |
| Customer Info Updates           | Reacting to real-time renewals or cancellations                   |
| Paywalls (RevenueCat UI)       | Presenting pre-built RevenueCat UI paywalls                       |
| Subscription Status Helper | A reusable service exposing the current subscription tier         |
| Anti-Patterns                           | Avoiding common subscription and entitlement mistakes             |
| Examples                                     | Full subscription service, paywall, and feature-gating            |

## Initialization

Initialize **once**, as early as possible — before any purchase calls. After
Firebase init and before `runApp` or in your root GetX service bootstrap.

```dart
import 'package:purchases_flutter/purchases_flutter.dart';

Future<void> initRevenueCat() async {
  await Purchases.setLogLevel(
    kDebugMode ? LogLevel.debug : LogLevel.error,
  );

  final config = PurchasesConfiguration(
    Platform.isIOS
        ? 'appl_YOUR_IOS_API_KEY'
        : 'goog_YOUR_ANDROID_API_KEY',
  );

  await Purchases.configure(config);
}
```

---

## Setup

```yaml
dependencies:
  purchases_flutter: ^8.0.0
  # Optional — pre-built paywall UI
  # purchases_ui_flutter: ^8.0.0
```

### Android — `android/app/build.gradle`

```groovy
android {
  defaultConfig {
    minSdkVersion 24  // RevenueCat requires min SDK 24
  }
}
```

### iOS — no extra steps

Configured via CocoaPods automatically.

### App Store / Play Store

1. Create products in App Store Connect and Google Play Console.
2. Create offerings and attach products in the RevenueCat Dashboard.
3. Get your **public API keys** (one per platform) from RevenueCat Dashboard →
   Project → API Keys.

---
