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
