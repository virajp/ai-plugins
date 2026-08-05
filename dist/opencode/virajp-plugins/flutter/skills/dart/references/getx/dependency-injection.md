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
