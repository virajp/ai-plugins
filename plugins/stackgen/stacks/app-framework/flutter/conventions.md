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

## The task library this pack owns

This pack ships a `config/.config/mise/tasks/` tree — `code/format`,
`code/lint`, and `setup/deps/{install,outdated,cleanup}` — landing at the repo's
own `.config/mise/tasks/` behind the materializer's config consent line.

**It owns `code/format` and `code/lint` whole, not a fragment of each.**
`code:format` runs **dprint first**, then `dart format`; `code:lint` runs the
config linter, then `dart run dependency_validator`, then
`dart analyze --fatal-infos`. One task file co-authored by the repo formatter
and the SDK. The seam is ownership-plus-contract — this component writes the
file, and the contract it honours is that the repo formatter goes first. It is
written whole rather than assembled from contributed fragments because
stackgen's dispatch is copy-verbatim or generate, with nothing in between; a
fragment layer would be a templating mechanism this plugin deliberately does not
have.

**Composition order, since more than one component writes this tree:**
`toolchain-manager`, then `package-manager` / `language`, then `toolchain-gate`,
then `app-framework` — a later component's file wins, recorded per file in the
lockfile. An `app-framework` component is **last**, so these files win over the
`toolchain-manager` baseline's, a `package-manager`'s and a `toolchain-gate`'s.

**`setup:deps:install` is SDK configuration and `flutter pub get` in one task,
and the reason is causal rather than tidiness.** `flutter pub get` resolves
against whichever platforms the SDK has enabled, so a fetch that ran before
`flutter config` describes a different app than the one that builds. That is why
the two cannot be separate slots: a standalone SDK-configuration task could
never usefully run apart from the fetch it constrains.

Full judgment: the `flutter` skill's references; the native edges have their own
skills, scoped to the boundary they serve.
