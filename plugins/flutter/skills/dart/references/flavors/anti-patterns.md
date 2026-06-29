## Anti-Patterns

| Anti-Pattern                                        | Why                                                               | Fix                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Single `main.dart` with an `if (kDebugMode)` switch | `kDebugMode` ≠ flavor; debug builds of prod are also `kDebugMode` | Use separate `main_*.dart` entry points with `Env.flavor`               |
| Hardcoding Firebase options in `main.dart`          | Different environments need different projects                    | Use per-flavor generated options files                                  |
| Committing `GoogleService-Info.plist` at the root   | Only one environment's config is bundled                          | Use the Run Script approach to copy the correct plist                   |
| Sharing the same bundle ID across flavors           | Both flavors install as the same app; they overwrite each other   | Give each flavor a unique bundle/app ID                                 |
| Using `kReleaseMode` to determine environment       | Release builds of dev should still hit dev API                    | Use `Env.flavor` for environment; `kReleaseMode` only for debug tooling |
| Not adding flavor suffix to app name                | Can't tell which build is installed on a device                   | Set `APP_DISPLAY_NAME` / `resValue` per flavor                          |

---
