# GetX — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

## Anti-Patterns

| Anti-Pattern                                                                 | Why                                    | Fix                                                             |
| ---------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| Initializing the same controller type in multiple `GetBuilder(init:)` blocks | Creates duplicate instances            | Use `init:` only on the first `GetBuilder`, omit on the rest    |
| `Get.put()` inside `build()`                                                 | Registers a new instance every rebuild | Register in Bindings or `onInit`                                |
| Polling `isSignedIn` with `Future.delayed` in a loop                         | Wastes CPU, unpredictable timing       | Use `ever(isSignedIn, ...)` or `once(isSignedIn, ...)`          |
| `permanent: true` on controllers                                             | Prevents disposal, leaks memory        | Reserve `permanent` for app-wide singletons (services, configs) |
| 30+ open Rx streams simultaneously                                           | Worse performance than ChangeNotifier  | Consolidate state; use `GetBuilder` for bulk updates            |
| Calling `Get.find()` before `Get.put()`                                      | Throws `"not found"` error             | Register in Bindings before the route is pushed                 |
| Using `SmartManagement.keepFactory` with multiple Bindings                   | Unexpected recreation behaviour        | Use `SmartManagement.full` or `onlyBuilder` instead             |

---

## GetX

State management, dependency injection, and routing with GetX — reactive
.obs/Obx and GetBuilder state, workers, controller lifecycle, Get.put/lazyPut
bindings, named routes and middleware, context-free UI helpers, and
translations.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                             | When to read                                                   |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Setup                               | Replace MaterialApp with GetMaterialApp                        |
| State Management         | Reactive .obs/Obx vs GetBuilder, workers, controller lifecycle |
| Dependency Injection | Get.put/lazyPut, bindings, SmartManagement disposal            |
| Route Management         | Named routes, middleware, params, nested navigation            |
| UI Utilities                 | All UI helpers work without BuildContext                       |
| Internationalisation | Translations map, .tr, plurals, runtime locale switching       |
| Anti-Patterns               | Common GetX mistakes and their fixes                           |
| Examples                         | Full feature module: service, controller, binding, view        |

## Setup

Replace `MaterialApp` with `GetMaterialApp`. No other global configuration is
required.

```dart
import 'package:get/get.dart';

void main() => runApp(
  GetMaterialApp(
    home: HomeScreen(),
  ),
);
```

---
