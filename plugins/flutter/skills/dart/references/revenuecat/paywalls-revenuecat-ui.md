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
