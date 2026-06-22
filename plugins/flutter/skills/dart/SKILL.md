---
name: dart
version: 0.1.0
category: development
description: Opinionated Dart/Flutter coding standards — naming, type safety,
  formatting, the Equatable entity pattern, GetX services/controllers/pages, the
  My-prefixed widget wrappers, MyApi repositories, and MyException/Logger error
  handling. Auto-applies when editing any Dart file.
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

- All HTTP through `MyApi.to` (never `http.Client` directly) — it handles auth.
- Repositories are **static methods**: no state, no DI, pure data access. Return
  `null` / `false` on failure after logging.

```dart
class MyRideRepo {
  static Future<MyRide?> fetchRide(final String rideId) async {
    try {
      final MyApiResponse response = await MyApi.to.get('rides/:id', queryParameters: {'id': rideId});
      if (response.statusCode != 200) return null;
      return MyRide.fromJson(response.body as Map<String, dynamic>);
    } catch (error, stackTrace) {
      Logger.error(MyException(
        code: ExceptionCodes.apiFailure,
        exception: error,
        stackTrace: stackTrace,
        ctx: {'rideId': rideId},
      ));
      return null;
    }
  }
}
```

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
