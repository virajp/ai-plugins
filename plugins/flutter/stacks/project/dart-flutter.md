---
axis: project
platforms: [ mobile, tablet, desktop, webapp ]
name: Dart · Flutter
languages: [ dart ]
optional_languages: [ kotlin, swift ]
frameworks: [ flutter ]
dependencies: [ intl ]
---

# mobile · tablet · desktop · webapp — Dart · Flutter

The client app: **Dart · [Flutter](https://flutter.dev)**, a
single-package repo (mobile apps are never monorepos) living as its own
repo — a multi-repo member — and shipping through the app stores.

**One template, four platforms.** Flutter builds phone, tablet, desktop and web
from one codebase, so a project on this template declares whichever of
`mobile`, `tablet`, `desktop` and `webapp` it actually ships — as **one**
project with several platforms, never one project per surface. This is the case
the pre-format-22 single-`role` keying could not express.

## Stack

- **Client SDKs for the backing services** the product selected — identity,
  push, analytics, crash reporting, app attestation, and storage as needed. The
  app authenticates against the identity provider and calls the `service` API
  with the resulting token; business logic and server SDKs stay in the backend.
- **Platform capabilities** as the product demands: maps/location, secure
  storage, permissions, media pickers, localization via
  `intl`/`flutter_localizations` with `l10n.yaml`.
- **Tooling**: its own mise `.config/`, `analysis_options.yaml` lints,
  `build_runner` codegen, `mockito` + `integration_test` for testing; the
  workspace root formatter config is shared by symlink.
- **Changelog & store notes** (product-foundations): a `CHANGELOG.md` (Keep a
  Changelog) as the source of truth — execute's docs-sync appends draft
  `[Unreleased]` entries for user-visible changes — with per-locale store
  release notes under `fastlane/metadata/` generated from it at release.

The deep Flutter doctrine (pubspec discipline, analysis options,
internationalization, platform-channel patterns) lives in the `flutter` plugin's
skills — this doc only fixes the stack choice.
