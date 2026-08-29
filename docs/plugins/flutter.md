# flutter plugin

The `flutter` plugin is the **language plugin for Dart and Flutter** — an
opinionated Flutter standard covering GetX state management, `My`-prefixed
widget wrappers, static repositories, ARB-based localization, and
platform-channel native code. It declares three languages (`dart`, `kotlin`,
`swift`) and bundles a language server for each. It is **self-contained**: no
plugin dependencies at all. There is no default install set to be excluded from
— install it by name, usually from inside the Flutter project it should govern.

It also ships the `dart-flutter` **stack template** and implements vwf's
stack-adapter and UX-gate contracts, so `/vwf:architecture` can offer Flutter
for a `frontend` project without vwf itself knowing what Flutter is.

## Install

Once, if you have not already:

```sh
claude plugin marketplace add virajp/ai-plugins
```

Run this from the root of your Flutter project, to scope it to that repo:

```sh
claude plugin install flutter@virajp-plugins --scope project
```

Drop `--scope project` to install it once for every repo instead, which is worth
it if you build Flutter apps often.

There is no install-time gate on `mise`, `kotlin-lsp` or `sourcekit-lsp` any
more. The plugin launches all three language servers, so a missing binary is
still a real problem — it now surfaces as a `/vwf:doctor` **blocking** finding
rather than a failed install, so run `/vwf:doctor` after installing.
`sourcekit-lsp` ships with Xcode or a Swift toolchain; install `kotlin-lsp`
yourself.

## Skills

Six skills **auto-apply** when you edit a matching file — they activate from a
`paths:` glob, no command needed. `dart` and `swift` are **routers**: a lean
`SKILL.md` that loads the always-on baseline and then points to a library of
topic references read on demand, so editing a file never pulls the whole corpus
into context.

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

**The three vwf-facing skills are gone.** The `flutter-stack-menu` /
`flutter-stack-template` pair retired in Wave C, and `flutter-ux-gate` with it.
Every skill this plugin still ships auto-applies on a file edit.

The UX gate moved rather than disappeared: stackgen's `app-framework/flutter`
pack materializes it into the repo's own `.claude/` tree at the fixed name
`ux-gate`, which is what vwf's `execute-ux-reviewer` invokes. The gate's own
rule travelled with it — a Flutter surface is checked as **tests**, never a
simulator booted interactively, so a changed screen with no golden is a finding
rather than a pass.

## Stack templates

**This plugin no longer ships one.** `dart-flutter` retired to
[`stackgen`](./stackgen.md) in Wave C and is a bundle there; the app-framework
pack carries the Dart, Kotlin and Swift judgment that went with it.

Two rulings survive the move and are worth keeping in view. Kotlin and Swift are
**optional languages** on that bundle — platform channels and native embedding —
never offers of their own, and standalone Kotlin or Swift project templates are
offered by nothing. And Flutter is the on-device app only: a server, a static
site or a shared package belongs to whichever stack owns it, the repo is
**single-package** (mobile apps are never monorepos), and the harness answers
`goldens` rather than `screenshots`, because a native surface has no browser
driver.

## Language servers

The plugin bundles three LSP servers in its manifest, so editing Dart, Kotlin,
and Swift files all get real diagnostics from one plugin. All three launch
through `mise`, so the plugin never assumes a hand-managed toolchain.

| Server          | Languages              | How it runs                                     | Startup budget |
| --------------- | ---------------------- | ----------------------------------------------- | -------------- |
| `dart-lsp`      | Dart (`.dart`)         | `mise x flutter@latest -- dart language-server` | 60 s           |
| `kotlin-lsp`    | Kotlin (`.kt`, `.kts`) | `mise x kotlin@latest -- kotlin-lsp --stdio`    | 60 s           |
| `sourcekit-lsp` | Swift (`.swift`)       | `mise x -- sourcekit-lsp`                       | 1 s            |

`dart-lsp` needs no separate Dart or Flutter install — mise fetches the SDK on
demand. `kotlin-lsp` and `sourcekit-lsp` run **system-installed** binaries under
mise's environment, which is why both appear in the plugin's `requires:` and are
checked before install.

This is Claude Code's own `lspServers` manifest entry — there is no rendered
variant for another agent any more. Running these servers under Cursor, OpenCode
or Codex means porting the manifest yourself, per the
[Other tools](../../readme.md#other-tools) guidance.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and the full
  plugin list.
- [vwf plugin](./vwf.md) — the workflow that invokes the stack-adapter and
  UX-gate skills.
- [devtools plugin](./devtools.md) — mise, and the `flutter` task-library
  overlay `/devtools:scaffold` lays down.
