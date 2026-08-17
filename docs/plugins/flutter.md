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

Three further skills are **invoked by vwf**, not by a file edit:

| Skill                    | What it does                                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `flutter-stack-menu`     | Returns the Flutter stack templates this plugin offers, as a vwf menu payload. Invoked by `/vwf:architecture` and `/vwf:setup` when `flutter` is listed in the config's `stacks:`. |
| `flutter-stack-template` | Returns one template (`dart-flutter`) as a vwf template payload — axis fields, per-capability harness mechanisms, and conventions. Invoked after the user picks it from the menu.  |
| `flutter-ux-gate`        | The **UX gate for a Flutter slice**: runs the project's golden tests and `flutter_test`'s accessibility guidelines, headless. Invoked by vwf's `execute-ux-reviewer`.              |

`flutter-ux-gate` runs the checks; it does **not** judge. Conformance against
the design system stays the reviewer's call. A Flutter surface is checked as
**tests** — never a simulator booted interactively — so the gate reports golden
diffs plus failures of `meetsGuideline(textContrastGuideline)`,
`androidTapTargetGuideline`, `iOSTapTargetGuideline` and
`labeledTapTargetGuideline`, at the severity vwf applies to a WCAG A/AA
violation. **A changed screen with no golden at all is a finding**, not a pass,
and `rendered: n/a` with a reason is what it returns when the suite cannot run.

## Stack templates

The plugin owns exactly **one** vwf stack template, on the `project` axis:

| Slug           | Role       | Stack                                              |
| -------------- | ---------- | -------------------------------------------------- |
| `dart-flutter` | `frontend` | Dart · Flutter, with `kotlin` and `swift` optional |

Kotlin and Swift are **optional languages** on that template — platform channels
and native embedding — not offers of their own. Standalone Kotlin and Swift
project templates are **not offered by any plugin**; the menu says so rather
than inventing one.

**Only the `frontend` role.** Flutter is the on-device app; a server, a static
site or a shared package belongs to whichever plugin owns that stack. The
template pins a **single-package** repo, its own workspace submodule, shipping
through the app stores — mobile apps are never monorepos.

Its harness answers `goldens` rather than `screenshots`: a Flutter app is a
native `frontend`, so its UI evidence is golden/snapshot tests plus
`flutter_test`'s accessibility assertions, never a browser driver. `health` and
`local_stack` are the backing axis's, not this one's — an on-device app
publishes no readiness endpoint.

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
