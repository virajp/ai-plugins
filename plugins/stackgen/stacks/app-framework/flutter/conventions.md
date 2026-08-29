# Flutter — conventions

The app SDK that **owns the build**. `pubspec.yaml` declares both the Dart and
Flutter SDK constraints and configures the native package managers; the build
drives Gradle and Xcode rather than the reverse; and the scaffolder decides
which native languages exist at all.

**Dart is the primary language. Kotlin and Swift are platform edges** — they
appear only at the channel boundary, because Dart does not compile to Dalvik
bytecode and has no direct Objective-C bindings, so Flutter is hosted inside a
native component and reaches the platform through channels.

**Know which directories are generated.** The SDK regenerates parts of the
native trees; a generated directory is never edited for native functionality and
never committed. App-specific native code goes to the host application, shared
native code goes into a plugin.

**One codebase, several surfaces.** A project declares whichever of `mobile`,
`tablet`, `desktop` and `webapp` it ships — one project with several platforms,
never one project per surface.

**Single-package, always.** A Flutter app is never a monorepo.

**Flavors carry per-environment configuration**, wired through both native
projects, not through committed config files.

Full judgment: the `flutter` skill's references; the native edges have their own
skills, scoped to the boundary they serve.
