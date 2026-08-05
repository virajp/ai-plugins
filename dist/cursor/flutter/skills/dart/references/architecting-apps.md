# Architecting Flutter Applications

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
  call), log failures with `MyException`, and return `null` / `false`. See the
  **http-and-json** reference.

Whether you need a distinct logic layer is conditional: a standard CRUD screen
lets its controller call repositories directly; only reach for a separate
service to orchestrate across multiple repositories or hold cross-screen data.

## Adding a feature

1. **Entity** — an immutable `Equatable` with `fromJson`/`toJson` (see the
   entity pattern in **standards**).
2. **Repository** — static methods over `MyApi.to` returning the entity or
   `null`.
3. **Service** — only if the data is app-wide; otherwise skip.
4. **Controller** — screen UI state (`.obs` flags, the list) plus commands.
5. **Page** — a `GetView` binding to the controller through `Obx`/`GetBuilder`.
6. **Tests** — unit-test the controller and service; test repositories by
   mocking `MyApi` (see the **testing** reference).

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

For binding a controller to a route, see the **getx** reference; for the entity
and repository contracts, see **standards** and **http-and-json**.
