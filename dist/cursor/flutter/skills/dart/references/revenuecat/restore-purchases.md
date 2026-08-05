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
