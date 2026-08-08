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
