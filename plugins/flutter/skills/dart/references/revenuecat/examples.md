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
