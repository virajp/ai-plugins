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
