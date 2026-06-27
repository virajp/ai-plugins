---
name: revenuecat
version: 0.1.0
category: development
description: Implements in-app subscriptions and purchases in a Flutter app
  using
  RevenueCat (purchases_flutter) — initialization, user identification,
  offerings, purchase/restore flows, entitlement checks, and pre-built paywalls.
  Use when adding paywalls, checking entitlements, restoring purchases, or
  handling subscription lifecycle events.
license: MIT
user-invocable: false
---

# RevenueCat (purchases_flutter)

## Contents

- [Setup](#setup)
- [Initialization](#initialization)
- [Identify User](#identify-user)
- [Fetch Offerings](#fetch-offerings)
- [Purchase a Package](#purchase-a-package)
- [Check Entitlements](#check-entitlements)
- [Restore Purchases](#restore-purchases)
- [Customer Info Updates](#customer-info-updates)
- [Paywalls (RevenueCat UI)](#paywalls-revenuecat-ui)
- [Subscription Status Helper](#subscription-status-helper)
- [Anti-Patterns](#anti-patterns)
- [Examples](#examples)

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

## Identify User

Link purchases to your own user ID (e.g., Firebase UID) so purchases are
portable across devices and platforms.

```dart
// After sign-in
await Purchases.logIn(firebaseUser.uid);

// On sign-out — revert to anonymous
await Purchases.logOut();

// Check current app user ID
final appUserId = await Purchases.appUserID;
```

> Always call `logIn` after the user authenticates, before showing a paywall.
> RevenueCat merges anonymous purchase history with the identified user on first
> `logIn`.

---

## Fetch Offerings

Offerings are the set of packages you've configured in the RevenueCat Dashboard.

```dart
Future<Offerings?> fetchOfferings() async {
  try {
    return await Purchases.getOfferings();
  } on PlatformException catch (e) {
    print('Failed to fetch offerings: ${e.message}');
    return null;
  }
}

// Typical usage
final offerings = await Purchases.getOfferings();
final current = offerings?.current;

if (current != null) {
  // Available package types in the offering
  for (final package in current.availablePackages) {
    print('${package.packageType}: ${package.storeProduct.priceString}');
  }

  // Access specific durations directly
  final monthly = current.monthly;
  final annual = current.annual;
  final lifetime = current.lifetime;
}
```

### Package types

| Type     | `PackageType`          |
| -------- | ---------------------- |
| Monthly  | `PackageType.monthly`  |
| Annual   | `PackageType.annual`   |
| Lifetime | `PackageType.lifetime` |
| Weekly   | `PackageType.weekly`   |
| Custom   | `PackageType.custom`   |

---

## Purchase a Package

```dart
Future<bool> purchase(Package package) async {
  try {
    final customerInfo = await Purchases.purchasePackage(package);
    return customerInfo.entitlements.active.isNotEmpty;
  } on PlatformException catch (e) {
    final errorCode = PurchasesErrorHelper.getErrorCode(e);

    if (errorCode == PurchasesErrorCode.purchaseCancelledError) {
      return false; // User cancelled — not an error
    }

    if (errorCode == PurchasesErrorCode.paymentPendingError) {
      // Purchase is pending (e.g., Ask to Buy on iOS)
      return false;
    }

    // Real error — surface to user
    rethrow;
  }
}
```

### Error codes

| Code                           | Meaning                                 |
| ------------------------------ | --------------------------------------- |
| `purchaseCancelledError`       | User tapped Cancel                      |
| `paymentPendingError`          | Purchase awaiting approval (Ask to Buy) |
| `productAlreadyPurchasedError` | Already owned — prompt restore          |
| `purchaseNotAllowedError`      | Purchases disabled on device            |
| `networkError`                 | No connectivity                         |
| `receiptAlreadyInUseError`     | Receipt used by another user ID         |

---

## Check Entitlements

Entitlements represent what a user has access to, regardless of which product
they bought.

```dart
Future<bool> hasEntitlement(String entitlementId) async {
  try {
    final customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active.containsKey(entitlementId);
  } on PlatformException {
    return false;
  }
}

// Example
const kProEntitlement = 'pro';

final isPro = await hasEntitlement(kProEntitlement);
```

### CustomerInfo fields

```dart
final info = await Purchases.getCustomerInfo();

// Active entitlements map
final active = info.entitlements.active; // Map<String, EntitlementInfo>

// Check specific entitlement
final entitlement = info.entitlements.active['pro'];
if (entitlement != null) {
  print(entitlement.productIdentifier);  // e.g., 'com.example.pro_monthly'
  print(entitlement.expirationDate);     // DateTime? (null for lifetime)
  print(entitlement.willRenew);          // bool
  print(entitlement.periodType);         // PeriodType.normal / trial / intro
  print(entitlement.isActive);           // bool (should always be true here)
}

// All purchases (including expired)
final all = info.entitlements.all;

// Original app user ID
print(info.originalAppUserId);
```

---

## Restore Purchases

Required by App Store guidelines — must be accessible from the UI.

```dart
Future<bool> restorePurchases() async {
  try {
    final customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active.isNotEmpty;
  } on PlatformException catch (e) {
    final code = PurchasesErrorHelper.getErrorCode(e);
    if (code == PurchasesErrorCode.receiptAlreadyInUseError) {
      // Receipt belongs to a different Apple/Google account
    }
    rethrow;
  }
}
```

---

## Customer Info Updates

Listen for real-time changes (subscription renewals, cancellations, billing
retries).

```dart
Purchases.addCustomerInfoUpdateListener((CustomerInfo info) {
  final isPro = info.entitlements.active.containsKey('pro');
  // Update your app state
});
```

Remove the listener when no longer needed (e.g., in `onClose`):

```dart
// Store the listener reference
late final CustomerInfoUpdateListener _listener;

@override
void onInit() {
  _listener = (info) => _updateEntitlementState(info);
  Purchases.addCustomerInfoUpdateListener(_listener);
}

@override
void onClose() {
  Purchases.removeCustomerInfoUpdateListener(_listener);
  super.onClose();
}
```

---

## Paywalls (RevenueCat UI)

If using `purchases_ui_flutter`, you can present pre-built paywalls configured
entirely in the RevenueCat Dashboard — no code changes needed for
copy/price/layout updates.

```dart
import 'package:purchases_ui_flutter/purchases_ui_flutter.dart';

// Full-screen paywall
await RevenueCatUI.presentPaywall();

// Paywall for a specific offering
await RevenueCatUI.presentPaywallIfNeeded(
  requiredEntitlementIdentifier: 'pro',
);

// Sheet (bottom sheet)
await RevenueCatUI.presentPaywall(
  displayCloseButton: true,
);
```

---

## Subscription Status Helper

```dart
enum SubscriptionTier { free, pro }

class SubscriptionService extends GetxService {
  static SubscriptionService get to => Get.find();

  final tier = SubscriptionTier.free.obs;

  Future<SubscriptionService> init() async {
    await _refresh();
    Purchases.addCustomerInfoUpdateListener((_) => _refresh());
    return this;
  }

  Future<void> _refresh() async {
    try {
      final info = await Purchases.getCustomerInfo();
      tier.value = info.entitlements.active.containsKey('pro')
          ? SubscriptionTier.pro
          : SubscriptionTier.free;
    } on PlatformException {
      tier.value = SubscriptionTier.free;
    }
  }

  bool get isPro => tier.value == SubscriptionTier.pro;
}
```

---

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

## Examples

### Full subscription service (GetX)

```dart
class SubscriptionService extends GetxService {
  static SubscriptionService get to => Get.find();

  final isPro = false.obs;
  final offerings = Rxn<Offerings>();

  Future<SubscriptionService> init() async {
    await Purchases.setLogLevel(kDebugMode ? LogLevel.debug : LogLevel.error);

    await Purchases.configure(
      PurchasesConfiguration(
        Platform.isIOS ? Env.rcAppleKey : Env.rcGoogleKey,
      ),
    );

    await _refresh();
    Purchases.addCustomerInfoUpdateListener((_) => _refresh());
    return this;
  }

  Future<void> identifyUser(String uid) async {
    await Purchases.logIn(uid);
    await _refresh();
  }

  Future<void> signOut() async {
    await Purchases.logOut();
    isPro.value = false;
  }

  Future<void> loadOfferings() async {
    try {
      offerings.value = await Purchases.getOfferings();
    } on PlatformException catch (e) {
      debugPrint('Offerings fetch failed: ${e.message}');
    }
  }

  Future<bool> purchase(Package package) async {
    try {
      final info = await Purchases.purchasePackage(package);
      isPro.value = info.entitlements.active.containsKey('pro');
      return isPro.value;
    } on PlatformException catch (e) {
      final code = PurchasesErrorHelper.getErrorCode(e);
      if (code == PurchasesErrorCode.purchaseCancelledError) return false;
      rethrow;
    }
  }

  Future<bool> restore() async {
    try {
      final info = await Purchases.restorePurchases();
      isPro.value = info.entitlements.active.containsKey('pro');
      return isPro.value;
    } on PlatformException {
      return false;
    }
  }

  Future<void> _refresh() async {
    try {
      final info = await Purchases.getCustomerInfo();
      isPro.value = info.entitlements.active.containsKey('pro');
    } on PlatformException {
      isPro.value = false;
    }
  }
}
```

### Paywall screen (GetX)

```dart
class PaywallController extends GetxController {
  final isLoading = false.obs;
  Offerings? get offerings => SubscriptionService.to.offerings.value;

  @override
  void onInit() {
    super.onInit();
    SubscriptionService.to.loadOfferings();
  }

  Future<void> purchaseMonthly() async {
    final monthly = offerings?.current?.monthly;
    if (monthly == null) return;
    isLoading.value = true;
    try {
      final success = await SubscriptionService.to.purchase(monthly);
      if (success) Get.back();
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> restore() async {
    isLoading.value = true;
    try {
      final restored = await SubscriptionService.to.restore();
      if (restored) {
        Get.back();
        Get.snackbar('Restored', 'Your subscription has been restored.');
      } else {
        Get.snackbar('Nothing to Restore', 'No active subscription found.');
      }
    } finally {
      isLoading.value = false;
    }
  }
}
```

### Gating a feature

```dart
// In any widget or controller
Obx(() {
  if (!SubscriptionService.to.isPro.value) {
    return ElevatedButton(
      onPressed: () => Get.toNamed(Routes.paywall),
      child: const Text('Upgrade to Pro'),
    );
  }
  return const ProFeatureWidget();
})
```
