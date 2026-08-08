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
