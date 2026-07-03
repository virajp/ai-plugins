# Frontend — Reference Stack

`frontend` is the on-device app: **Dart · [Flutter](https://flutter.dev)**, a
single-package repo (mobile apps are never monorepos) living as its own
workspace submodule and shipping through the app stores.

## Stack

- **Flutter + Firebase client SDKs**: `firebase_core`, `firebase_auth` (with
  Google / Apple sign-in), `firebase_messaging`, `firebase_analytics`,
  `firebase_crashlytics`, `firebase_app_check`, plus storage as needed. The app
  authenticates with Firebase Auth and calls the `service` API with the ID token
  — business logic and third-party server SDKs stay in the backend.
- **Platform capabilities** as the product demands: maps/location
  (`google_maps_flutter`, `geolocator`), secure storage, permissions, media
  pickers, localization via `intl`/`flutter_localizations` with `l10n.yaml`.
- **Tooling**: its own mise `.config/`, `analysis_options.yaml` lints,
  `build_runner` codegen, `mockito` + `integration_test` for testing; the
  workspace root formatter config is shared by symlink.

The deep Flutter doctrine (pubspec discipline, analysis options,
internationalization, platform-channel patterns) lives in the `flutter` plugin's
skills — this doc only fixes the stack choice.
