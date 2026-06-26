---
name: dart
version: 0.2.0
category: development
description: Opinionated Dart/Flutter coding standards — naming, type safety,
  formatting, the Equatable entity pattern, GetX services/controllers/pages,
  reactive workers and route bindings, the My-prefixed widget wrappers, MyApi
  repositories with safe HTTP/JSON, concurrency and isolates, and
  MyException/Logger error handling. Auto-applies when editing any Dart file.
license: MIT
user-invocable: false
paths:
  - "**/*.dart"
---

# Dart & Flutter Coding Standards

State lives in GetX (`GetxService`/`GetxController`); UI uses project
`My`-prefixed wrappers; data flows through static repositories; nothing throws
raw exceptions.

## Naming

- `PascalCase` for classes, enums, typedefs, type params. Prefix
  project-specific classes with `My` (`MyUser`, `MyScaffold`).
- `camelCase` for variables, functions, methods, parameters.
- `UPPER_SNAKE_CASE` for compile-time constants: `const int MAX_RETRIES = 3`.
- `snake_case` for file and directory names.
- Booleans start with `is`, `has`, `can`, or `should`.
- File suffixes: `*_controller.dart`, `*_service.dart`, `*_repo.dart`,
  `*_entity.dart`, `*_page.dart`, `*_widget.dart`, `*_enum.dart`.
- Private members: leading underscore `_`.

## Imports

Use `import_sorter` with emoji section headers; run it before committing. Always
package imports (`package:app/...`) — never relative paths. Alphabetise within
each section.

```dart
// 🎯 Dart imports:
import 'dart:async';

// 🐦 Flutter imports:
import 'package:flutter/material.dart';

// 📦 Package imports:
import 'package:get/get.dart';

// 🌎 Project imports:
import 'package:app/_shared/logger.dart';
```

## Type safety & formatting

- Explicitly declare every type — never `var` or implicit types.
- Non-nullable by default; `?` only when null is a valid state.
- `final` for runtime values that won't be reassigned; `const` for compile-time.
- Single quotes always; interpolation over concatenation: `'Hello, $name!'`.
- Null-aware operators: `user?.name ?? 'Unknown'`.
- `async`/`await` always — never `.then()`; declare the `Future<T>` return type.
- Max line length **120**; **2-space** indent; **always trailing commas** in
  args, constructor params, collection literals, and widget trees.
- Method chains: one call per line.
- `final` on all parameters; named parameters when 2+ args, `required` for
  mandatory ones.

```dart
Future<void> saveUser({
  required final String id,
  required final String name,
  final String? email,
}) async {}
```

- Functions ≤ 20 lines. Member order: static constants → static methods → public
  fields → private fields → constructors → getters/setters → public methods →
  private methods → overrides.

## Entity pattern

Immutable `Equatable` with a private const constructor and named factories
(`empty`, `copyWith`, `fromJson`) + `toJson`:

```dart
class MyEntity extends Equatable {
  const MyEntity._({required this.id, required this.name, this.email});

  factory MyEntity.empty() => const MyEntity._(id: '', name: '');

  factory MyEntity.copyWith(final MyEntity original, {final String? name}) =>
      MyEntity._(id: original.id, name: name ?? original.name, email: original.email);

  factory MyEntity.fromJson(final Map<String, dynamic> json) =>
      MyEntity._(id: json['id'] as String, name: json['name'] as String, email: json['email'] as String?);

  final String id;
  final String name;
  final String? email;

  @override
  List<Object?> get props => [id, name, email];

  Map<String, dynamic> toJson() => {'id': id, 'name': name, if (email != null) 'email': email};
}
```

## GetX

**Service** — extend `GetxService` (not Dart singletons); static `get` accessor;
`init()` returns `Future<T>`:

```dart
class MyUserService extends GetxService {
  static MyUserService get get => Get.find<MyUserService>();

  final Rx<bool> isSignedIn = false.obs;
  MyUser _user = MyUser.empty();
  MyUser get user => _user;

  Future<MyUserService> init() async => this;
}
```

**Controller** — extend `GetxController`; drive targeted rebuilds with
`update(['builderId'])`:

```dart
class LoginController extends GetxController {
  bool isSigningIn = false;

  Future<void> login() async {
    isSigningIn = true;
    update(['loginPage']);
    try {
      // login logic
    } finally {
      isSigningIn = false;
      update(['loginPage']);
    }
  }
}
```

**Page** — extend `GetView<Controller>`; `Get.put` the controller in the
constructor; rebuild with `GetBuilder`:

```dart
class LoginPage extends GetView<LoginController> {
  LoginPage({super.key}) {
    Get.put<LoginController>(LoginController());
  }

  @override
  Widget build(final BuildContext context) => MyScaffold(
    body: GetBuilder<LoginController>(id: 'loginPage', builder: (controller) => const Column(children: [])),
  );
}
```

**Reactivity** — `GetBuilder` + `update(['id'])` for single-page state; `.obs` +
`Obx` for cross-widget reactive state
(`final RxList<MyUser> users = <MyUser>[].obs;`).

**DI** — register services in bootstrap with
`Get.putAsync(..., permanent: true)`.

**Navigation** — never `Get.to()` / `Get.back()` / `Get.toNamed()` directly;
always go through `MyNavigator` (`MyNavigator.goHome()`,
`MyNavigator.goBack()`).

## GetX patterns

**Workers** — reactive side-effects on an `.obs`. Declare in `onInit`; they
dispose with the controller. Prefer a worker over polling a flag in a
`Future.delayed` loop.

- `ever` — every change; `once` — first change only.
- `debounce(time:)` — fires after changes stop; ideal for search inputs.
- `interval(time:)` — at most once per window; ideal for high-frequency events.

```dart
@override
void onInit() {
  super.onInit();
  debounce(query, _search, time: const Duration(milliseconds: 500));
  ever(MyUserService.get.isSignedIn, _onAuthChanged);
}
```

**Bindings** — one `Bindings` per route ties DI to navigation: instances are
created on entry and disposed on exit. `lazyPut` controllers; `permanent: true`
only for app-wide services, never controllers. Reserve `fenix: true` (`lazyPut`)
for instances that must survive disposal and recreate on next access.

```dart
class HomeBinding implements Bindings {
  @override
  void dependencies() {
    Get.lazyPut<HomeController>(() => HomeController());
  }
}

GetPage(name: '/home', page: () => HomePage(), binding: HomeBinding());
```

**SmartManagement** — how GetX disposes unused instances:

- `full` *(default)* — disposes every unused non-permanent instance.
- `onlyBuilder` — disposes only Bindings/`init:`-registered instances; manual
  `Get.put` survives.
- `keepFactory` — drops instances but keeps factories; avoid with multiple
  Bindings.

**Route parameters** — read path/query params off `Get.parameters` (`/ride/:id`
→ `Get.parameters['id']`; `?tab=settings` → `Get.parameters['tab']`). Issue the
navigation itself through `MyNavigator`, never `Get.toNamed`.

**Context-free overlays** — `Get.snackbar` / `Get.dialog` / `Get.bottomSheet`
need no `BuildContext`. Always reach for the `My` wrappers (`MySnackbar`,
`MyDialog`) — they wrap these; drop to the raw call only inside the wrapper.

**Anti-patterns:**

- `Get.put()` inside `build()` — re-registers every rebuild; register in a
  Binding or `onInit`.
- `init:` on more than the first `GetBuilder` of a type — duplicate instances.
- `permanent: true` on controllers — leaks; services only.
- Dozens of live `.obs` streams — consolidate, or use `GetBuilder` for bulk
  updates.
- `Get.find()` before the matching `put` — throws "not found"; register in the
  Binding first.

## Widgets

- Always the project `My`-prefixed wrappers, never Flutter defaults:
  `MyScaffold`, `MyText`, `MyButton`, `MyTextField`, `MyIconButton`.
- Never hardcode user-facing strings — `MyText(L10n.of(context).welcomeMessage)`
  (see the **internationalization** skill).
- Colors/platform via the `My` accessors: `MyColors.get.primary(context)`,
  `MyPlatform.get.isIOS`.
- Never store `BuildContext` in fields or globals — pass it as a parameter and
  use it immediately.

## API & repositories

- All HTTP through `MyApi.to` (never `http.Client` directly) — it injects auth,
  app-check, and platform headers and returns a `MyApiResponse`.
- `MyApiResponse` is `{body, statusCode, message}`: `body` is the **already
  JSON-decoded** `Map<String, dynamic>`, `statusCode` the HTTP status, `message`
  the raw response string (use it as error context).
- Interpolate path params into the endpoint (`'ride/$rideId'`); pass real query
  params as `queryParameters:` — `MyApi` builds and encodes the URL.
- `MyApi` never throws: on a transport error it returns a `MyApiResponse` with
  `statusCode` 418. Branch on `statusCode` — don't wrap calls in `try`/`catch`.
- Repositories are **static methods**: no state, no DI, pure data access. Log
  failures with `MyException` and return `null` / `false`.

```dart
class MyRideRepo {
  static Future<MyRide?> fetchRide(final String rideId) async {
    final MyApiResponse response = await MyApi.to.get('ride/$rideId');
    if (response.statusCode == 404) return null;
    if (response.statusCode != 200) {
      Logger.error(MyException(
        code: ExceptionCodes.apiFailure,
        exception: response.message,
        stackTrace: StackTrace.current,
        ctx: {'rideId': rideId},
      ));
      return null;
    }
    return MyRide.fromJson(response.body);
  }
}
```

## JSON parsing

`MyApi` decodes every response body on the calling isolate, so `response.body`
is a ready `Map<String, dynamic>`; read nested collections off it
(`response.body['rides'] as List<dynamic>`) and build entities with the
generative `fromJson` factory.

That central decode plus per-item `fromJson` mapping runs on the UI isolate, so
a large list response can jank a frame. Offload the mapping by handing the
decoded list (sendable maps/lists — closures and entities are not) to a
**top-level or static** function via `compute()`:

```dart
static Future<List<MyPhoto>?> fetchPhotos() async {
  final MyApiResponse response = await MyApi.to.get('photos');
  if (response.statusCode != 200) return null;
  final List<dynamic> raw = response.body['photos'] as List<dynamic>;
  return compute(_parsePhotos, raw);
}

List<MyPhoto> _parsePhotos(final List<dynamic> raw) =>
    raw.cast<Map<String, dynamic>>().map(MyPhoto.fromJson).toList();
```

## Concurrency

Dart runs single-threaded per isolate; blocking the main isolate janks the UI.
Isolates share no memory — they communicate only by passing sendable messages,
and any isolate callback must be a top-level/static function (no captured
state). Pick by workload:

- **I/O-bound** (network, file, db) — just `async`/`await`; the event loop stays
  free while the `Future` settles. No isolate.
- **CPU-bound, one-off** (decode a huge JSON blob, image/crypto work) —
  `Isolate.run(() => work())`; it spawns, computes, returns, and exits.
  `compute()` is the Flutter-flavoured shortcut for the same thing.
- **CPU-bound, long-lived** (a stream of jobs over time) — `Isolate.spawn` with
  a `ReceivePort`/`SendPort` handshake (main passes its `sendPort`, worker sends
  its own back).

```dart
final List<dynamic> decoded =
    await Isolate.run(() => jsonDecode(rawJson) as List<dynamic>);
```

Always `close()` every `ReceivePort` and `kill()` the isolate when done — open
ports leak memory and keep the isolate alive.

## Errors & logging

- Never bare `throw Exception(...)` or empty `catch` blocks — wrap in
  `MyException` with an `ExceptionCodes` code, the `stackTrace`, and a `ctx`
  map.
- `ExceptionCodes`: `apiFailure`, `authError`, `networkError`,
  `validationError`, `unexpectedException`. Set `fatal: true` for unrecoverable
  state.
- `Logger.debug/info/warning/error` routes to crash reporting in production.
  Always include context (user IDs, operation, params); never log tokens or PII.
- Catch at the right level: log with context, surface to the user via
  `MySnackbar.error(L10n.of(context).…)`, and `rethrow` only if the caller
  handles it.

## Testing

- Unit-test every new service and controller; coverage is enforced.
- Import the shared GetX helpers (`test/helpers/`): `registerCommonServices()`,
  `putMockService<T>(mock)`, `pumpWithGetX(tester, child: …)`, and `resetGetX`
  in `tearDown`.
- Mocks are mockito `@GenerateNiceMocks` — add a `MockSpec<MyNewService>()` then
  regenerate via `build_runner` (see the **build** skill).
- Repositories are static — test them by mocking the network layer (`MyApi`).
