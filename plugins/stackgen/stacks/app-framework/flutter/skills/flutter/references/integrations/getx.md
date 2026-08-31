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

State management, dependency injection and routing in one package. GetX owns
**object lifetime** in a Flutter app — which controller exists, for how long,
and who disposes it — so what it decides is architectural rather than
incidental, and that is what this reference carries.

Sections in this file:

| Section                                              | When to read                                        |
| ---------------------------------------------------- | --------------------------------------------------- |
| [Anti-Patterns](#anti-patterns)                      | Common GetX mistakes and their fixes                |
| [Setup](#setup)                                      | Replacing MaterialApp with GetMaterialApp           |
| [Controller lifecycle](#controller-lifecycle)        | Where init, first-frame and teardown work belongs   |
| [Workers](#workers-reactive-side-effects)            | Reacting to a value without polling it              |
| [Dependency injection](#dependency-injection)        | Registration modes and what each one costs          |
| [Bindings](#bindings)                                | Tying a controller's lifetime to a route            |
| [SmartManagement](#smartmanagement)                  | How GetX disposes unused instances                  |
| [Route management](#route-management)                | Named routes, parameters and middleware             |
| [Context-free UI](#context-free-ui)                  | Why GetX helpers take no BuildContext               |

The reactive operators themselves, the translation map and the UI-helper
signatures are API surface — fetch them from Context7 at use time.

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

## Controller lifecycle

Four hooks, and **which one you use is a correctness decision, not a style
one** — `onInit` runs before the first frame, so anything that needs a rendered
tree (navigating, showing a dialog, measuring) belongs in `onReady`.

```dart
class MyController extends GetxController {
  @override
  void onInit() {
    super.onInit();
    // subscribe to streams, start workers — no frame exists yet
  }

  @override
  void onReady() {
    super.onReady();
    // after the first frame — safe to navigate or present UI
  }

  @override
  void onClose() {
    // cancel subscriptions, close streams — runs before disposal
    super.onClose();
  }
}
```

Anything opened in `onInit` is closed in `onClose`. Workers declared inside
`onInit` are disposed with the controller automatically, which is why they are
declared there and nowhere else.

---

## Workers (reactive side-effects)

A worker is how a controller reacts to a value changing. Declare them in
`onInit`; never poll a reactive value in a loop.

| Worker     | Behaviour                                                                         |
| ---------- | --------------------------------------------------------------------------------- |
| `ever`     | Called on every change                                                            |
| `once`     | Called only on the first change                                                   |
| `debounce` | Waits until changes stop for `time`, then fires once — ideal for search           |
| `interval` | Fires at most once per `time` window, ignoring extra changes — ideal for counters |

```dart
@override
void onInit() {
  super.onInit();
  ever(count, (_) => log('changed every time'));
  once(isSignedIn, (_) => bootstrapSession());
  debounce(searchTerm, (_) => fetchResults(), time: const Duration(seconds: 1));
  interval(counter, (_) => report(), time: const Duration(seconds: 3));
}
```

---

## Dependency injection

The registration mode decides when the instance is built and when it dies.

```dart
Get.put(AuthService());                   // build now, keep
Get.lazyPut(() => HomeController());      // build on first Get.find()
Get.putAsync(() async => await Prefs.load()); // async construction
Get.create(() => ListItemController());   // a new instance per Get.find()

final service = Get.find<AuthService>();
Get.delete<HomeController>();             // dispose and remove
Get.replace<BaseClass>(ChildClass());     // swap an implementation
```

| Parameter   | Default | Effect                                                                       |
| ----------- | ------- | ---------------------------------------------------------------------------- |
| `permanent` | `false` | `true` keeps the instance alive even when unused — use for app-wide services |
| `tag`       | `null`  | Differentiates multiple instances of the same type                           |
| `fenix`     | `false` | (`lazyPut` only) recreates the instance after disposal when accessed again   |

**`permanent: true` is for services, never controllers.** A permanent
controller is never disposed, which is a leak wearing a flag — see the
anti-pattern table above, which also covers registering inside `build()` and
calling `Get.find()` before anything registered the type.

---

## Bindings

A binding ties a controller's lifetime to a route: created when the screen is
entered, disposed when it is left. **This is how a controller is bound to a
route** — not by constructing it in the page's `build()`.

```dart
class HomeBinding implements Bindings {
  @override
  void dependencies() {
    Get.lazyPut<HomeController>(() => HomeController());
    Get.put<RideService>(RideService(), permanent: true);
  }
}

GetPage(
  name: '/home',
  page: () => HomeScreen(),
  binding: HomeBinding(),
),
```

`BindingsBuilder` covers the one-off case without a class:

```dart
GetPage(
  name: '/details',
  page: () => DetailsScreen(),
  binding: BindingsBuilder(() {
    Get.lazyPut<DetailsController>(() => DetailsController());
  }),
),
```

---

## SmartManagement

Controls how GetX disposes unused instances. The default is right for most apps;
change it only when you know which of the three behaviours you need.

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

## Route management

Named routes are the default — they give bindings, middleware and parameters a
place to live. Anonymous `Get.to(Screen())` is for throwaway pushes only.

```dart
GetMaterialApp(
  initialRoute: '/',
  getPages: [
    GetPage(name: '/',         page: () => HomeScreen(), binding: HomeBinding()),
    GetPage(name: '/ride/:id', page: () => RideScreen()),
    GetPage(name: '/profile',  page: () => ProfileScreen()),
  ],
)
```

Route and query parameters both arrive through `Get.parameters`:

```dart
Get.toNamed('/ride/42');
final id = Get.parameters['id'];      // '42'

Get.toNamed('/profile?tab=settings');
final tab = Get.parameters['tab'];    // 'settings'

Get.offNamed('/home');                // replace
Get.offAllNamed('/login');            // clear the stack
Get.back(result: 'confirmed');
```

Middleware is where a route-level guard belongs — the redirect happens before
the page builds, so the guarded screen never flashes:

```dart
class AuthMiddleware extends GetMiddleware {
  @override
  RouteSettings? redirect(final String? route) =>
      MyAuthService.get.isSignedIn ? null : const RouteSettings(name: '/login');
}

GetPage(name: '/home', page: () => HomeScreen(), middlewares: [AuthMiddleware()]),
```

`routingCallback` on `GetMaterialApp` observes every transition — the hook
screen-tracking analytics attaches to. **Nested navigators
(`Get.nestedKey(n)`) cost RAM per navigator**; use them only for a genuine
tab-local stack.

---

## Context-free UI

Every GetX UI helper — snackbars, dialogs, bottom sheets, `Get.width` — works
**without a `BuildContext`**, which is what lets a controller or a service
surface UI without one being threaded down to it. That is the constraint worth
knowing; the helper signatures are Context7's.

It does not licence storing a `BuildContext`. The rule in
[Standards & architecture](../standards-and-architecture.md) still holds:
never keep a `BuildContext` in a field or a global — if a widget needs one, it
takes it as a parameter, and if a controller needs one, it probably needs a GetX
helper instead.

---
