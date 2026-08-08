## Examples

### `main_dev.dart`

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:my_app/config/env.dart';
import 'package:my_app/config/firebase_options_dev.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Env.init(flavor: AppFlavor.dev);

  await Firebase.initializeApp(
    options: DevFirebaseOptions.currentPlatform,
  );

  runApp(const App());
}
```

### `main_prod.dart`

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:my_app/config/env.dart';
import 'package:my_app/config/firebase_options_prod.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Env.init(flavor: AppFlavor.prod);

  await Firebase.initializeApp(
    options: ProdFirebaseOptions.currentPlatform,
  );

  runApp(const App());
}
```

### Using `Env` in a service

```dart
class MyApi extends GetxService {
  late final Dio _dio;

  Future<MyApi> init() async {
    _dio = Dio(BaseOptions(baseUrl: Env.apiBaseUrl));
    return this;
  }
}
```
