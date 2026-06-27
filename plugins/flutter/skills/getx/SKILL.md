---
name: getx
version: 0.1.0
category: development
description: State management, dependency injection, and routing with GetX —
  reactive .obs/Obx and GetBuilder state, workers, controller lifecycle,
  Get.put/lazyPut bindings, named routes and middleware, context-free UI helpers,
  and translations. Use when wiring controllers, services, navigation, reactive
  state, or dependency bindings in a Flutter app.
license: MIT
user-invocable: false
---

# GetX

## Contents

- [Setup](#setup)
- [State Management](#state-management)
- [Dependency Injection](#dependency-injection)
- [Route Management](#route-management)
- [UI Utilities](#ui-utilities)
- [Internationalisation](#internationalisation)
- [Anti-Patterns](#anti-patterns)
- [Examples](#examples)

---

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

## State Management

GetX provides two state managers. Choose based on the update pattern:

| Scenario                                                              | Use              |
| --------------------------------------------------------------------- | ---------------- |
| Single variable drives a widget                                       | `Obx` / `.obs`   |
| Multiple variables change together and one `update()` call is cleaner | `GetBuilder`     |
| You need type-safe access to the controller in the builder            | `GetX<T>` widget |

### Reactive State — `.obs` + `Obx`

Append `.obs` to any value to make it observable. Wrap the widget with
`Obx(() => ...)`.

```dart
class CounterController extends GetxController {
  final count = 0.obs;
  final items = <String>[].obs;
  final user = Rxn<User>();        // nullable Rx

  void increment() => count++;
}

// In view
Obx(() => Text('${controller.count}'))
```

**Rules:**

- `Obx` only rebuilds if the value actually changes (identical values are
  ignored).
- Lists and maps do not need `.value` — use them directly:
  `controller.items.add(x)`.
- For objects, either reassign (`user(newUser)`) or call
  `user.update((u) { u.name = 'x'; })`.

### Workers (reactive side-effects)

Declare workers inside `onInit`. They are automatically disposed with the
controller.

```dart
@override
void onInit() {
  super.onInit();
  ever(count, (_) => print('changed every time'));
  once(count, (_) => print('changed once only'));
  debounce(searchTerm, (_) => fetchResults(), time: const Duration(seconds: 1));
  interval(counter, (_) => log(), time: const Duration(seconds: 3));
}
```

| Worker     | Behaviour                                                                         |
| ---------- | --------------------------------------------------------------------------------- |
| `ever`     | Called on every change                                                            |
| `once`     | Called only on the first change                                                   |
| `debounce` | Waits until changes stop for `time`, then fires once — ideal for search           |
| `interval` | Fires at most once per `time` window, ignoring extra changes — ideal for counters |

### Simple State — `GetBuilder`

For coordinated updates across multiple variables, call `update()` manually.
Lighter memory footprint than reactive state.

```dart
class CartController extends GetxController {
  int quantity = 0;
  double total = 0;

  void add(Item item) {
    quantity++;
    total += item.price;
    update();           // rebuilds all GetBuilder<CartController> widgets
  }
}

GetBuilder<CartController>(
  builder: (c) => Text('${c.quantity} items — \$${c.total}'),
)
```

- Pass `id: 'tagName'` to both `update(['tagName'])` and
  `GetBuilder(id: 'tagName')` to rebuild only specific widgets.
- Initialize the controller with `init:` on the **first** `GetBuilder` only. All
  subsequent `GetBuilder` widgets for the same type omit it.

### Controller Lifecycle

```dart
class MyController extends GetxController {
  @override
  void onInit() {
    super.onInit();
    // subscribe to streams, start workers
  }

  @override
  void onReady() {
    super.onReady();
    // called after the first frame — safe to navigate
  }

  @override
  void onClose() {
    // cancel subscriptions, close streams
    super.onClose();
  }
}
```

---

## Dependency Injection

### Registering Instances

```dart
// Immediately create and store
Get.put(AuthService());

// Lazy — instantiated only on first Get.find()
Get.lazyPut(() => HomeController());

// Async — for dependencies requiring async setup
Get.putAsync(() async => await SharedPreferences.getInstance());

// New instance on every Get.find() call (non-singleton)
Get.create(() => ListItemController());
```

**Key parameters:**

| Parameter   | Default | Effect                                                                       |
| ----------- | ------- | ---------------------------------------------------------------------------- |
| `permanent` | `false` | `true` keeps the instance alive even when unused — use for app-wide services |
| `tag`       | `null`  | Differentiates multiple instances of the same type                           |
| `fenix`     | `false` | (`lazyPut` only) recreates the instance after disposal when accessed again   |

### Finding & Removing

```dart
final service = Get.find<AuthService>();
Get.delete<HomeController>();         // dispose and remove
Get.replace<BaseClass>(ChildClass()); // swap implementation
```

### Bindings

Bindings tie dependencies to routes, ensuring they are created when a screen is
entered and disposed when it is left.

```dart
class HomeBinding implements Bindings {
  @override
  void dependencies() {
    Get.lazyPut<HomeController>(() => HomeController());
    Get.put<RideService>(RideService(), permanent: true);
  }
}

// Register with the route
GetPage(
  name: '/home',
  page: () => HomeScreen(),
  binding: HomeBinding(),
),
```

Use `BindingsBuilder` for one-off bindings without a separate class:

```dart
GetPage(
  name: '/details',
  page: () => DetailsScreen(),
  binding: BindingsBuilder(() {
    Get.lazyPut<DetailsController>(() => DetailsController());
  }),
),
```

### SmartManagement

Controls how GetX disposes unused instances:

| Mode                               | Behaviour                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `SmartManagement.full` *(default)* | Disposes all unused non-permanent instances                                       |
| `SmartManagement.onlyBuilder`      | Only disposes instances registered via Bindings; manually `put` instances survive |
| `SmartManagement.keepFactory`      | Removes instances but keeps their factories for recreation                        |

```dart
GetMaterialApp(
  smartManagement: SmartManagement.onlyBuilder,
)
```

---

## Route Management

### Without Named Routes

```dart
Get.to(NextScreen());                  // push
Get.back();                            // pop
Get.back(result: 'confirmed');         // pop with result
Get.off(NextScreen());                 // replace (no back)
Get.offAll(NextScreen());              // clear stack, push new

// Await a result
final result = await Get.to(PaymentScreen());
```

### With Named Routes

```dart
GetMaterialApp(
  initialRoute: '/',
  getPages: [
    GetPage(name: '/',        page: () => HomeScreen(),    binding: HomeBinding()),
    GetPage(name: '/ride/:id', page: () => RideScreen()),
    GetPage(name: '/profile', page: () => ProfileScreen()),
  ],
)
```

```dart
Get.toNamed('/ride/42');
Get.offNamed('/home');
Get.offAllNamed('/login');

// Query parameters
Get.toNamed('/profile?tab=settings');
final tab = Get.parameters['tab'];   // 'settings'

// Route parameters
Get.toNamed('/ride/42');
final id = Get.parameters['id'];     // '42'
```

### Middleware

```dart
class AuthMiddleware extends GetMiddleware {
  @override
  RouteSettings? redirect(String? route) {
    if (!AuthService.to.isSignedIn) {
      return const RouteSettings(name: '/login');
    }
    return null;
  }
}

GetPage(
  name: '/home',
  page: () => HomeScreen(),
  middlewares: [AuthMiddleware()],
),
```

### Route Observation

```dart
GetMaterialApp(
  routingCallback: (routing) {
    Analytics.screen(routing?.current);
  },
)
```

### Nested Navigation

```dart
// Declare a nested navigator
Navigator(key: Get.nestedKey(1), ...)

// Navigate within it
Get.toNamed('/tab/detail', id: 1);
```

Use sparingly — nested navigators increase RAM consumption.

---

## UI Utilities

All UI helpers work without `BuildContext`.

### Snackbar

```dart
Get.snackbar(
  'Title',
  'Message',
  snackPosition: SnackPosition.BOTTOM,
  duration: const Duration(seconds: 3),
  backgroundColor: Colors.black87,
  colorText: Colors.white,
  icon: const Icon(Icons.info),
);
```

### Dialog

```dart
// Custom widget dialog
Get.dialog(MyDialogWidget());

// Built-in confirm dialog
Get.defaultDialog(
  title: 'Delete Ride?',
  middleText: 'This action cannot be undone.',
  onConfirm: () { controller.delete(); Get.back(); },
  onCancel: () {},
);
```

### Bottom Sheet

```dart
Get.bottomSheet(
  Container(
    padding: const EdgeInsets.all(16),
    child: Column(children: [...]),
  ),
  isDismissible: true,
  backgroundColor: Colors.white,
);
```

---

## Internationalisation

```dart
class AppTranslations extends Translations {
  @override
  Map<String, Map<String, String>> get keys => {
    'en_US': {
      'hello': 'Hello',
      'welcome': 'Welcome, @name',
      'item': 'item',
      'items': 'items',
    },
    'pt_BR': {
      'hello': 'Olá',
      'welcome': 'Bem-vindo, @name',
      'item': 'item',
      'items': 'itens',
    },
  };
}

GetMaterialApp(
  translations: AppTranslations(),
  locale: const Locale('en', 'US'),
  fallbackLocale: const Locale('en', 'US'),
)
```

```dart
'hello'.tr                                       // 'Hello'
'welcome'.trParams({'name': 'Viraj'})            // 'Welcome, Viraj'
'item'.trPlural('items', controller.count.value) // '3 items'

// Change locale at runtime
Get.updateLocale(const Locale('pt', 'BR'));
```

---

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

## Examples

### Full Feature Module

```dart
// 1. Entity
class Ride {
  final String id;
  final String title;
  Ride({required this.id, required this.title});
}

// 2. Service (singleton, permanent)
class RideService extends GetxService {
  static RideService get to => Get.find();
  final _rides = <Ride>[].obs;
  List<Ride> get rides => _rides;

  Future<void> fetchRides() async {
    final data = await RideRepo.getAll();
    _rides.assignAll(data);
  }
}

// 3. Controller (scoped to screen)
class RidesController extends GetxController {
  static RidesController get to => Get.find();
  final isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    loadRides();
  }

  Future<void> loadRides() async {
    isLoading.value = true;
    await RideService.to.fetchRides();
    isLoading.value = false;
  }
}

// 4. Binding
class RidesBinding implements Bindings {
  @override
  void dependencies() {
    Get.lazyPut(() => RidesController());
  }
}

// 5. View
class RidesScreen extends GetView<RidesController> {
  const RidesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Obx(() {
        if (controller.isLoading.value) {
          return const CircularProgressIndicator();
        }
        return ListView(
          children: RideService.to.rides
              .map((r) => ListTile(title: Text(r.title)))
              .toList(),
        );
      }),
    );
  }
}
```

### Worker-driven Search

```dart
class SearchController extends GetxController {
  final query = ''.obs;
  final results = <Result>[].obs;

  @override
  void onInit() {
    super.onInit();
    debounce(query, _search, time: const Duration(milliseconds: 500));
  }

  Future<void> _search(String q) async {
    if (q.isEmpty) { results.clear(); return; }
    results.assignAll(await ApiService.to.search(q));
  }
}
```

### Auth Middleware

```dart
class AuthMiddleware extends GetMiddleware {
  @override
  RouteSettings? redirect(String? route) =>
      UserService.to.isSignedIn.value
          ? null
          : const RouteSettings(name: '/login');
}
```

### Conditional List Update

```dart
// Only adds if the item is not already present
controller.items.addIf(!controller.items.contains(item), item);
```
