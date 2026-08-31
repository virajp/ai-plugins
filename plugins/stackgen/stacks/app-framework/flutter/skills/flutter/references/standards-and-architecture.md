# Flutter — standards & app architecture

## Dart & Flutter Coding Standards

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

State lives in GetX, never Dart singletons. **Services** extend `GetxService`
(static `get` accessor, `init()` returns `Future<T>`); **controllers** extend
`GetxController` and drive targeted rebuilds via `update(['id'])`; **pages**
extend `GetView<Controller>`. Use `GetBuilder` + `update(['id'])` for
single-page state and `.obs` + `Obx` for cross-widget reactive state. Register
services in bootstrap (`Get.putAsync(..., permanent: true)`) — `permanent: true`
is for services only, never controllers. Never call `Get.to()` / `Get.back()` /
`Get.toNamed()` directly — always go through `MyNavigator`.

For services/controllers/pages in depth, reactive workers (`ever`/`once`/
`debounce`/`interval`), route Bindings, `SmartManagement`, route parameters,
context-free overlays, and the DI anti-patterns, see [GetX](integrations/getx.md).

## Widgets

- Always the project `My`-prefixed wrappers, never Flutter defaults:
  `MyScaffold`, `MyText`, `MyButton`, `MyTextField`, `MyIconButton`.
- Never hardcode user-facing strings — `MyText(L10n.of(context).welcomeMessage)`
  (see [Internationalization](internationalization.md)).
- Colors/platform via the `My` accessors: `MyColors.get.primary(context)`,
  `MyPlatform.get.isIOS`.
- Never store `BuildContext` in fields or globals — pass it as a parameter and
  use it immediately.

## API & repositories

- All HTTP through `MyApi.to` (never `http.Client` directly) — it injects auth,
  app-check, and platform headers and returns a `MyApiResponse`
  (`{body,
  statusCode, message}`) with the body already JSON-decoded.
- `MyApi` never throws (transport errors come back as `statusCode` 418) — branch
  on `statusCode`, don't wrap calls in `try`/`catch`.
- Repositories are **static methods**: no state, no DI, pure data access. Log
  failures with `MyException` and return `null` / `false`.

For the full `MyApiResponse` contract, path/query encoding, large-list
`compute()` offloading, and model `fromJson`/`toJson` codegen, see
[Data & networking](data-and-networking.md) and
[json_serializable](integrations/json-serializable.md).

## Concurrency

Dart runs single-threaded per isolate; blocking the main isolate janks the UI.
Keep I/O-bound work on `async`/`await` (no isolate), and offload CPU-bound work
(decoding a huge JSON blob, image/crypto) to an isolate via
`Isolate.run(() => work())` / `compute()`. Isolate callbacks must be top-level
or static functions passing only sendable values.

For one-off vs long-lived isolates, the `Isolate.spawn` `ReceivePort`/`SendPort`
handshake, and lifecycle cleanup, see [Concurrency & isolates](concurrency.md).

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
  regenerate via `build_runner` (see
  [Build, flavors & signing](build-flavors-signing.md)).
- Repositories are static — test them by mocking the network layer (`MyApi`).

## Architecting Flutter Applications

Build to scale by separating UI from logic from data, with a single source of
truth for each data domain and state flowing one way. The stack is opinionated:
GetX holds state, `My`-prefixed widgets render it, and static repositories reach
the network.

## Principles

- **Separation of concerns.** Strip business and data-fetching logic out of the
  widget tree; widgets do layout, animation, and routing only.
- **Single source of truth (SSOT).** Each data domain is owned by exactly one
  holder — a `GetxService` for app-wide data, a repository for the network read.
  Nothing else mutates it.
- **Unidirectional data flow.** State flows down from services/controllers to
  the UI; user events flow up from the UI into controller commands.
- **UI as a function of state.** Drive widgets from observable state (`.obs` /
  `GetBuilder`) and let them rebuild reactively.

## Layers

Communication is adjacent-only: a page talks to its controller, a controller
talks to services and repositories, a repository talks to `MyApi`.

### UI layer

- **Pages** extend `GetView<Controller>` and read their controller through
  `controller`. Keep them lean.
- **Widgets** are the `My`-prefixed wrappers (`MyScaffold`, `MyText`,
  `MyButton`), each with `super.key` and `final` params, `const` where possible.
- **Controllers** (`GetxController`) hold the screen's UI state and expose
  commands for user actions. Wire them to a route via a `Binding`.

### Logic / data layer

- **Services** (`GetxService`) are the app-wide SSOT — the signed-in user, a
  cart, cached lookups. Register them in bootstrap with
  `Get.putAsync(..., permanent: true)` and expose a static `get` accessor.
- **Repositories** are **static methods**: no state, no DI, pure data access.
  They call `MyApi.to`, branch on `statusCode` (never `try`/`catch` around the
  call), log failures with `MyException`, and return `null` / `false`. See
  [Data & networking](data-and-networking.md); for a Firestore-backed
  repository, see
  [Firebase Auth](integrations/firebase-auth.md#firestore-via-the-repository-layer).

Whether you need a distinct logic layer is conditional: a standard CRUD screen
lets its controller call repositories directly; only reach for a separate
service to orchestrate across multiple repositories or hold cross-screen data.

## Adding a feature

1. **Entity** — an immutable `Equatable` with `fromJson`/`toJson` (see the
   [entity pattern](#entity-pattern)).
2. **Repository** — static methods over `MyApi.to` returning the entity or
   `null`.
3. **Service** — only if the data is app-wide; otherwise skip.
4. **Controller** — screen UI state (`.obs` flags, the list) plus commands.
5. **Page** — a `GetView` binding to the controller through `Obx`/`GetBuilder`.
6. **Tests** — unit-test the controller and service; test repositories by
   mocking `MyApi` (see [Testing & coverage](testing.md)).

## Example

```dart
// 1. Entity
class MyUser extends Equatable {
  const MyUser._({required this.id, required this.name});

  factory MyUser.fromJson(final Map<String, dynamic> json) =>
      MyUser._(id: json['id'] as String, name: json['name'] as String);

  final String id;
  final String name;

  @override
  List<Object?> get props => [id, name];
}

// 2. Repository (static, no state)
class UserRepo {
  static Future<MyUser?> fetch(final String id) async {
    final MyApiResponse res = await MyApi.to.get('/users/$id');
    if (res.statusCode != 200) return null;
    return MyUser.fromJson(res.body as Map<String, dynamic>);
  }
}

// 3. Controller (screen state + command)
class ProfileController extends GetxController {
  final Rxn<MyUser> user = Rxn<MyUser>();
  final RxBool isLoading = false.obs;

  Future<void> load(final String id) async {
    isLoading.value = true;
    user.value = await UserRepo.fetch(id);
    isLoading.value = false;
  }
}

// 4. Page (lean, reactive)
class ProfilePage extends GetView<ProfileController> {
  const ProfilePage({super.key});

  @override
  Widget build(final BuildContext context) {
    return MyScaffold(
      body: Obx(() {
        if (controller.isLoading.value) {
          return const CircularProgressIndicator();
        }
        final MyUser? user = controller.user.value;
        if (user == null) return MyText(L10n.of(context).noUser);
        return MyText(user.name);
      }),
    );
  }
}
```

For binding a controller to a route, see
[GetX](integrations/getx.md#bindings); for the entity and repository contracts,
see the [entity pattern](#entity-pattern) and
[Data & networking](data-and-networking.md).
