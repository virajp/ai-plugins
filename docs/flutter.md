# flutter

The `flutter` plugin teaches Claude Code an opinionated Flutter and Dart
standard — GetX state management, `My`-prefixed widget wrappers, static
repositories, ARB-based localization, and platform-channel native code. It is
**self-contained**: it bundles three language servers (Dart, Kotlin, Swift) and
declares no cross-marketplace dependencies. The plugin is **project-scoped** —
install it from inside the Flutter project it should govern.

## Install

Run this from the root of your Flutter project:

```bash
pnpx @askviraj/ai-plugins --project flutter
```

`--project flutter` installs at the plugin's own (project) scope.

## Skills

The plugin ships eight skills. Seven **auto-apply** when you edit a matching
file — they activate from a `paths:` glob, no command needed. One (`build`) is
**user-invocable**: you call it on demand to set up or debug the build.

| Skill                  | Activates on                               | Standardizes                                                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dart`                 | `**/*.dart`                                | Naming, type safety, formatting; the `Equatable` entity pattern; GetX services/controllers/pages; `My`-prefixed widgets; `MyApi` repositories; `MyException`/`Logger` error handling.                                               |
| `pubspec`              | `**/pubspec.yaml`, `**/pubspec.lock`       | Unconstrained versions pinned by the lock file, a pub.dev URL comment per package, `dependencies` vs `dev_dependencies`, SDK constraints, code-gen packages.                                                                        |
| `testing`              | `**/*_test.dart`, `**/test/helpers/*.dart` | `flutter_test` unit and widget tests mirroring `lib/`; the `test/helpers` GetX harness; mockito `@GenerateNiceMocks`; `TestFixtures`; `integration_test`; the `--coverage` flow.                                                    |
| `analysis-options`     | `**/analysis_options.yaml`                 | `analysis_options.yaml` extending `flutter_lints` with a curated strict rule set, the formatter block (`page_width: 120`, `trailing_commas: automate`), error severities, generated-code excludes.                                  |
| `internationalization` | `**/l10n.yaml`, `**/*.arb`                 | ARB files with English as the template, `l10n.yaml`, the `genarb` → `arb_translate` → `gen-l10n` pipeline, `GetMaterialApp` delegate wiring, `L10n.of(context)` usage.                                                              |
| `swift`                | `**/*.swift`                               | The iOS-native side: `FlutterMethodChannel` handlers registered from `AppDelegate`, main-thread dispatch, `FlutterError` codes, Native↔Flutter invocation.                                                                          |
| `kotlin`               | `**/*.kt`, `**/*.kts`                      | The Android-native side: a `MethodChannel` handler registry, main-looper dispatch, `notImplemented()` defaults, Native↔Flutter invocation.                                                                                          |
| `build`                | user-invocable (call on demand)            | How generated code and quality gates fit together — `build_runner`, `import_sorter`, `gen-l10n`, launcher icons and splash, the analyzer/formatter, `dependency_validator`, and the edit → pub get → gen → sort → analyze pipeline. |

The `build` skill is the connective tissue: it ties `dart`, `pubspec`, and
`internationalization` together and documents the order the generators run.
Invoke it when setting up a project or when a build breaks.

## Language servers

The plugin bundles three LSP servers in its manifest, so editing Dart, Kotlin,
and Swift files all get real diagnostics from one plugin.

| Server          | Languages              | How it runs                                  | Prerequisite                                           |
| --------------- | ---------------------- | -------------------------------------------- | ------------------------------------------------------ |
| `dart`          | Dart (`.dart`)         | `mise x dart@latest -- dart language-server` | `mise` on `PATH`; it fetches the Dart SDK on demand.   |
| `kotlin-lsp`    | Kotlin (`.kt`, `.kts`) | `kotlin-lsp --stdio`                         | A `kotlin-lsp` binary on `PATH`.                       |
| `sourcekit-lsp` | Swift (`.swift`)       | `sourcekit-lsp`                              | A `sourcekit-lsp` binary on `PATH` (ships with Xcode). |

The Dart server runs through `mise`, so it needs no separate Dart install — only
`mise` on your `PATH`. The Kotlin and Swift servers invoke **system-installed**
binaries: install `kotlin-lsp` yourself, and get `sourcekit-lsp` from a Swift
toolchain or Xcode. If a binary is absent, that language's diagnostics are
simply unavailable; the rest of the plugin still works.

## See also

- [../readme.md](../readme.md) — the marketplace overview and the full plugin
  list.
