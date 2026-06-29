# Flutter Flavors (Multi-Environment)

> Configure Flutter build flavors for multiple environments (dev, staging, prod)
> with separate Firebase projects, API endpoints, and bundle IDs.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                                                  | When to read                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [Overview](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/flavors/overview.md)                                                           | Per-flavor bundle IDs, Firebase projects, and assets at a glance |
| [Dart — Flavor Entry Points](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/flavors/dart-flavor-entry-points.md)                         | Create a separate main_*.dart for each flavor                    |
| [Android — Product Flavors](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/flavors/android-product-flavors.md)                           | Per-flavor Android product flavor and Firebase config            |
| [iOS — Schemes and Configurations](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/flavors/ios-schemes-and-configurations.md)             | Per-flavor Xcode build configs, schemes, and bundle IDs          |
| [Firebase per Flavor](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/flavors/firebase-per-flavor.md)                                     | Wiring a separate Firebase project per flavor                    |
| [Environment Config Class](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/flavors/environment-config-class.md)                           | Centralize all flavor-specific values                            |
| [Running Flavors](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/flavors/running-flavors.md)                                             | flutter run/build commands per flavor                            |
| [VS Code / Android Studio Launch Config](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/flavors/vs-code-android-studio-launch-config.md) | IDE launch configs for each flavor                               |
| [Anti-Patterns](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/flavors/anti-patterns.md)                                                 | Common flavor mistakes and their fixes                           |
| [Examples](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/flavors/examples.md)                                                           | Full main_*.dart and Env usage examples                          |
