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
