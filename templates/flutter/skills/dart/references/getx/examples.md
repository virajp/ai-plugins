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
