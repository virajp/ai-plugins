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

The plugin ships six skills, all of which **auto-apply** when you edit a
matching file — they activate from a `paths:` glob, no command needed. `dart`
and `swift` are **routers**: a lean `SKILL.md` that loads the always-on baseline
and then points to a library of topic references read on demand, so editing a
file never pulls the whole corpus into context.

| Skill                  | Activates on                         | Standardizes                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dart`                 | `**/*.dart`                          | The Flutter/Dart entry point. Always-on baseline (naming, type safety, the `Equatable` entity pattern, `My`-prefixed widgets, `MyApi` repositories, `MyException`/`Logger`) plus routed references: GetX, architecture, state, navigation, UI/theming/animation, data & networking, Firebase, media, monetization, native interop, testing, and build tooling. |
| `swift`                | `**/*.swift`                         | The iOS-native entry point. Swift baseline (`FlutterMethodChannel` handlers from `AppDelegate`, main-thread dispatch, `FlutterError` codes) plus routed references for SwiftUI patterns and Xcode project/build workflows.                                                                                                                                     |
| `kotlin`               | `**/*.kt`, `**/*.kts`                | The Android-native side: a `MethodChannel` handler registry, main-looper dispatch, `notImplemented()` defaults, Native↔Flutter invocation.                                                                                                                                                                                                                     |
| `pubspec`              | `**/pubspec.yaml`, `**/pubspec.lock` | Consent-gated new packages (never added without asking), unconstrained versions pinned by the lock file, a pub.dev URL comment per package, `dependencies` vs `dev_dependencies`, SDK constraints, code-gen packages.                                                                                                                                          |
| `analysis-options`     | `**/analysis_options.yaml`           | `analysis_options.yaml` extending `flutter_lints` with a curated strict rule set, the formatter block (`page_width: 120`, `trailing_commas: automate`), error severities, generated-code excludes.                                                                                                                                                             |
| `internationalization` | `**/l10n.yaml`, `**/*.arb`           | ARB files with English as the template, `l10n.yaml`, the `genarb` → `arb_translate` → `gen-l10n` pipeline, `GetMaterialApp` delegate wiring, `L10n.of(context)` usage.                                                                                                                                                                                         |

The `dart` skill's reference library spans the former standalone skills — GetX,
the Firebase suite (auth, analytics, app-check, crashlytics, messaging,
storage), feature areas (architecture, state, navigation, theming, layouts,
animations, performance, maps, webview, webrtc, revenuecat, image handling,
http/json, concurrency, caching), testing, and build/tooling (flavors, app-size,
coverage, the `build_runner` pipeline). The `swift` skill's references cover
SwiftUI and Xcode. Each reference loads only when the routed topic is relevant.

## Language servers

The plugin bundles three LSP servers in its manifest, so editing Dart, Kotlin,
and Swift files all get real diagnostics from one plugin.

| Server          | Languages              | How it runs                                     | Prerequisite                                                 |
| --------------- | ---------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| `dart-lsp`      | Dart (`.dart`)         | `mise x flutter@latest -- dart language-server` | `mise` on `PATH`; it fetches the Flutter/Dart SDK on demand. |
| `kotlin-lsp`    | Kotlin (`.kt`, `.kts`) | `kotlin-lsp --stdio`                            | A `kotlin-lsp` binary on `PATH`.                             |
| `sourcekit-lsp` | Swift (`.swift`)       | `sourcekit-lsp`                                 | A `sourcekit-lsp` binary on `PATH` (ships with Xcode).       |

The Dart server runs through `mise` (via `flutter@latest`), so it needs no
separate Dart or Flutter install — only `mise` on your `PATH`. The Kotlin and
Swift servers invoke **system-installed** binaries: install `kotlin-lsp`
yourself, and get `sourcekit-lsp` from a Swift toolchain or Xcode. If a binary
is absent, that language's diagnostics are simply unavailable; the rest of the
plugin still works.

## See also

- [../readme.md](../readme.md) — the marketplace overview and the full plugin
  list.
