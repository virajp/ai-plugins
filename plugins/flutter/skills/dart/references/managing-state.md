# Managing State

State lives in GetX. Distinguish two kinds of state and pick the holder for each
— never reach for `provider`, `ChangeNotifier`, or a raw Dart singleton.

## Ephemeral vs shared state

- **Ephemeral (widget-local):** State that never leaves one widget and does not
  survive it — an `AnimationController`, a `PageView`'s current page, a hover
  flag. Keep it in a `StatefulWidget` with `setState()`. Reaching for GetX here
  is over-engineering.
- **Shared / app state:** Anything read or mutated from more than one widget, or
  that must outlive a screen (the signed-in user, a cart, a fetched list). This
  lives in a GetX **controller** (screen-scoped) or **service** (app-wide),
  never in the widget tree.

## Choosing the holder

| State scope                                 | Holder                                          |
| ------------------------------------------- | ----------------------------------------------- |
| One screen, disposed when the screen leaves | `GetxController` (via a route `Binding`)        |
| App-wide, alive for the whole session       | `GetxService` (`Get.putAsync(permanent: true)`) |
| Pure widget-local UI                        | `StatefulWidget` + `setState()`                 |

Controllers own the **UI state** for a screen (loading flags, form values, the
list being shown) and expose commands for user actions. Services own the
**source-of-truth data** that outlives any one screen and pull it through static
repositories. A page reads its controller via `GetView<Controller>`;
cross-screen data is read through the service's static `get` accessor.

## Reactive vs manual rebuilds

Within a controller, choose how the UI observes state:

- **`.obs` + `Obx`** — a single value drives a widget; the wrap rebuilds only
  when the value changes. Use for cross-widget reactive state.
- **`GetBuilder` + `update(['id'])`** — several values change together and one
  explicit `update()` is cleaner; lighter than reactive state. Use for
  single-page state.

For the reactive operators, workers (`ever`/`debounce`/`interval`), and the
controller lifecycle, see the **getx** reference.

## Example

Screen state in a controller, reactive UI, data pulled from a service:

```dart
class CartController extends GetxController {
  static CartController get to => Get.find();

  final RxList<MyItem> items = <MyItem>[].obs;
  final RxBool isSaving = false.obs;

  Future<void> addItem(final MyItem item) async {
    isSaving.value = true;
    final bool ok = await CartRepo.save(item);
    if (ok) items.add(item);
    isSaving.value = false;
  }
}

class CartScreen extends GetView<CartController> {
  const CartScreen({super.key});

  @override
  Widget build(final BuildContext context) {
    return MyScaffold(
      body: Obx(() {
        if (controller.isSaving.value) {
          return const CircularProgressIndicator();
        }
        return ListView(
          children: controller.items
              .map((final MyItem item) => MyText(item.title))
              .toList(),
        );
      }),
    );
  }
}
```

The repository (`CartRepo`) is a static, stateless method that goes through
`MyApi.to` and returns `false` on failure — see the **http-and-json** reference.
Ephemeral state stays in `setState`:

```dart
class ExpandingCard extends StatefulWidget {
  const ExpandingCard({super.key});

  @override
  State<ExpandingCard> createState() => _ExpandingCardState();
}

class _ExpandingCardState extends State<ExpandingCard> {
  bool _isExpanded = false;

  @override
  Widget build(final BuildContext context) {
    return MyButton(
      text: _isExpanded ? 'Collapse' : 'Expand',
      onPressed: () => setState(() => _isExpanded = !_isExpanded),
    );
  }
}
```
