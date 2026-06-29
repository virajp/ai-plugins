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
