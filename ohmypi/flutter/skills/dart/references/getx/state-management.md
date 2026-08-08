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
