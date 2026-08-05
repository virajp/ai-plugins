## Dart — Flavor Entry Points

Create a separate `main_*.dart` for each flavor. Keep `main.dart` as a launcher
or remove it.

```text
lib/
  main_dev.dart
  main_prod.dart
  config/
    env.dart        ← environment config singleton
```

```dart
// lib/main_dev.dart
import 'package:my_app/config/env.dart';
import 'package:my_app/app.dart';

void main() {
  Env.init(flavor: AppFlavor.dev);
  runFlavorApp();
}
```

```dart
// lib/main_prod.dart
import 'package:my_app/config/env.dart';
import 'package:my_app/app.dart';

void main() {
  Env.init(flavor: AppFlavor.prod);
  runFlavorApp();
}
```

---
