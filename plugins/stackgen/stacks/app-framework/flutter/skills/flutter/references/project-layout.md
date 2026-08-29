# Flutter — project layout & the generated boundary

The SDK generates part of the tree and owns it. Knowing which part is the
difference between native code that survives a build and native code that
silently disappears.

## The shape

`lib/` holds the Dart source and is entirely the product's. `android/` and
`ios/` are the native host projects — **generated at creation, then owned by the
product**, because signing, permissions and platform configuration all live
there and must be committed.

The distinction that catches people is a *third* category: directories the SDK
**regenerates on every build**.

## Regenerated directories are not yours

Flutter's own documentation, on the module case:

> **Do not** edit files in `.android/` to add native functionality. This folder
> is generated for testing purposes and **will be overwritten** whenever you run
> `flutter pub get` or build the module… **do not** add it to source control.

The failure is quiet and expensive: native code added there works locally,
survives review because the file is in the diff, and vanishes on the next
`pub get` — on someone else's machine, or in CI, with no error.

**The rule: if the SDK regenerates it, it is not a place to put anything.**

## Where native code actually goes

Two destinations, and which one depends on reuse:

- **App-specific native code** goes directly into the host application under
  `android/` or `ios/` — committed, reviewed, and reachable from the channel
  boundary.
- **Native code used across apps or modules** goes into a **plugin**, which is
  the SDK's own unit for it and the only shape that survives being depended on.

## What is committed and what is not

Committed: `lib/`, `pubspec.yaml` and its lockfile, `android/` and `ios/` host
projects, platform configuration, signing configuration that carries no secret.

Not committed: build outputs, the SDK's regenerated directories, downloaded
dependency trees, and anything holding a signing credential — those are injected
at build time like any other secret.

## Single-package, always

A Flutter app is a single-package repo. Not a monorepo — the SDK's build, its
tooling and its dependency resolution all assume one package at the root, and
the workarounds cost more than the structure buys. Where a product has a backend
too, the backend is the monorepo and the app is its own repo.
