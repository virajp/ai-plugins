## Environment Config Class

Centralize all flavor-specific values:

```dart
// lib/config/env.dart

enum AppFlavor { dev, prod }

class Env {
  Env._();

  static late AppFlavor flavor;

  static void init({required AppFlavor flavor}) {
    Env.flavor = flavor;
  }

  static bool get isDev => flavor == AppFlavor.dev;
  static bool get isProd => flavor == AppFlavor.prod;

  static String get apiBaseUrl => switch (flavor) {
    AppFlavor.dev  => 'https://api-dev.example.com',
    AppFlavor.prod => 'https://api.example.com',
  };

  static String get appName => switch (flavor) {
    AppFlavor.dev  => 'My App DEV',
    AppFlavor.prod => 'My App',
  };

  static String get rcApiKey => switch (flavor) {
    AppFlavor.dev  => Platform.isIOS ? 'appl_dev_key' : 'goog_dev_key',
    AppFlavor.prod => Platform.isIOS ? 'appl_prod_key' : 'goog_prod_key',
  };
}
```

---
