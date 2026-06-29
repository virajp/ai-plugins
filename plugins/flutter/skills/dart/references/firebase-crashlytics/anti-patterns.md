## Anti-Patterns

| Anti-Pattern                                  | Why                                                             | Fix                                          |
| --------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------- |
| Not calling `FlutterError.onError`            | Flutter framework errors (e.g. build errors) are never reported | Set `FlutterError.onError` in `main()`       |
| Missing `PlatformDispatcher.instance.onError` | Async errors outside Flutter zone are lost                      | Add the `onError` handler and return `true`  |
| Using PII as user identifier                  | Privacy violation                                               | Use Firebase UID or hashed identifier        |
| Sending crash reports in debug builds         | Pollutes production dashboard                                   | Guard with `!kDebugMode`                     |
| Logging sensitive data with `.log()`          | Logs appear in crash reports viewable by team                   | Only log non-sensitive context (IDs, states) |
| Catching all errors silently                  | Hides issues; nothing is reported                               | Log non-fatal errors with `recordError`      |

---
