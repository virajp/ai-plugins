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
