---
name: flavors
version: 0.1.0
category: development
description: >
  Configure Flutter build flavors for multiple environments (dev, staging, prod)
  with separate Firebase projects, API endpoints, and bundle IDs. Use when
  setting up environment-specific builds, switching Firebase configs per flavor,
  or creating separate App Store/Play Store entries per environment.
license: MIT
user-invocable: false
---

# Flutter Flavors (Multi-Environment)

## Contents

- [Overview](#overview)
- [Dart — Flavor Entry Points](#dart--flavor-entry-points)
- [Android — Product Flavors](#android--product-flavors)
- [iOS — Schemes and Configurations](#ios--schemes-and-configurations)
- [Firebase per Flavor](#firebase-per-flavor)
- [Environment Config Class](#environment-config-class)
- [Running Flavors](#running-flavors)
- [VS Code / Android Studio Launch Config](#vs-code--android-studio-launch-config)
- [Anti-Patterns](#anti-patterns)
- [Examples](#examples)

---

## Overview

A typical setup uses two flavors:

| Flavor | Bundle ID (iOS)       | App ID (Android)      | Firebase Project |
| ------ | --------------------- | --------------------- | ---------------- |
| `dev`  | `com.example.app.dev` | `com.example.app.dev` | `myapp-dev`      |
| `prod` | `com.example.app`     | `com.example.app`     | `myapp-prod`     |

Each flavor gets its own:

- Firebase `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
- App name and icon (optional — e.g., "My App DEV" vs "My App")
- API base URL and feature flags

---

## Dart — Flavor Entry Points

Create a separate `main_*.dart` for each flavor. Keep `main.dart` as a launcher
or remove it.

```text
lib/
  main_dev.dart
  main_prod.dart
  config/
    env.dart        ← environment config singleton
```

```dart
// lib/main_dev.dart
import 'package:my_app/config/env.dart';
import 'package:my_app/app.dart';

void main() {
  Env.init(flavor: AppFlavor.dev);
  runFlavorApp();
}
```

```dart
// lib/main_prod.dart
import 'package:my_app/config/env.dart';
import 'package:my_app/app.dart';

void main() {
  Env.init(flavor: AppFlavor.prod);
  runFlavorApp();
}
```

---

## Android — Product Flavors

Edit `android/app/build.gradle`:

```groovy
android {
  flavorDimensions 'env'

  productFlavors {
    dev {
      dimension 'env'
      applicationId 'com.example.app.dev'
      versionNameSuffix '-dev'
      resValue 'string', 'app_name', 'My App DEV'
    }
    prod {
      dimension 'env'
      applicationId 'com.example.app'
      resValue 'string', 'app_name', 'My App'
    }
  }
}
```

### Firebase config files (Android)

Place per-flavor `google-services.json` in flavor-specific source directories:

```text
android/app/
  src/
    dev/
      google-services.json    ← dev Firebase project
    prod/
      google-services.json    ← prod Firebase project
```

The Google Services Gradle plugin automatically picks the correct file based on
the active flavor.

### App icons per flavor (optional)

```text
android/app/src/dev/res/mipmap-*/ic_launcher.png
android/app/src/prod/res/mipmap-*/ic_launcher.png
```

---

## iOS — Schemes and Configurations

### 1. Create Build Configurations in Xcode

In Xcode: **Runner → PROJECT → Runner → Configurations**

Duplicate `Debug` and `Release` for each flavor:

| Configuration Name |
| ------------------ |
| `Debug-dev`        |
| `Release-dev`      |
| `Profile-dev`      |
| `Debug-prod`       |
| `Release-prod`     |
| `Profile-prod`     |

### 2. Create Schemes

**Product → Scheme → New Scheme** for each flavor:

- Scheme `dev`: Build Configuration `Debug-dev` (run), `Release-dev` (archive)
- Scheme `prod`: Build Configuration `Debug-prod` (run), `Release-prod`
  (archive)

### 3. Set Bundle ID per Configuration

In **Runner TARGET → Build Settings → Product Bundle Identifier**:

```text
Debug-dev   = com.example.app.dev
Release-dev = com.example.app.dev
Debug-prod  = com.example.app
Release-prod = com.example.app
```

Use a User-Defined build setting `BUNDLE_ID_SUFFIX`:

```text
Debug-dev   BUNDLE_ID_SUFFIX = .dev
Release-dev BUNDLE_ID_SUFFIX = .dev
Debug-prod  BUNDLE_ID_SUFFIX =
Release-prod BUNDLE_ID_SUFFIX =
```

Then set `PRODUCT_BUNDLE_IDENTIFIER = com.example.app$(BUNDLE_ID_SUFFIX)`.

### 4. App Display Name per Configuration

Add `APP_DISPLAY_NAME` user-defined setting:

```text
Debug-dev:    My App DEV
Release-dev:  My App DEV
Debug-prod:   My App
Release-prod: My App
```

In `Info.plist`:

```xml
<key>CFBundleDisplayName</key>
<string>$(APP_DISPLAY_NAME)</string>
```

### 5. Flutter-specific: `flutter_export_environment.sh`

Flutter passes `--flavor` to the iOS build. Xcode picks the matching scheme. The
`-config` flag maps to the build configuration.

---

## Firebase per Flavor

### iOS — per-scheme `GoogleService-Info.plist`

Create one plist per flavor and add a **Run Script Phase** in Xcode that copies
the correct one before the build:

```bash
# Run Script Phase — "Copy Firebase Config"
# Place BEFORE "Compile Sources" phase

PLIST_DEST="${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/GoogleService-Info.plist"

if [ "${CONFIGURATION}" == "Debug-dev" ] || [ "${CONFIGURATION}" == "Release-dev" ]; then
  cp "${PROJECT_DIR}/Runner/Firebase/dev/GoogleService-Info.plist" "${PLIST_DEST}"
else
  cp "${PROJECT_DIR}/Runner/Firebase/prod/GoogleService-Info.plist" "${PLIST_DEST}"
fi
```

Directory structure:

```text
ios/Runner/Firebase/
  dev/GoogleService-Info.plist
  prod/GoogleService-Info.plist
```

### Dart — FlutterFire CLI per flavor

Generate separate options files:

```bash
# Dev
flutterfire configure \
  --project=myapp-dev \
  --out=lib/config/firebase_options_dev.dart \
  --ios-bundle-id=com.example.app.dev \
  --android-package-name=com.example.app.dev

# Prod
flutterfire configure \
  --project=myapp-prod \
  --out=lib/config/firebase_options_prod.dart \
  --ios-bundle-id=com.example.app \
  --android-package-name=com.example.app
```

Initialize based on flavor:

```dart
await Firebase.initializeApp(
  options: Env.flavor == AppFlavor.dev
      ? DevFirebaseOptions.currentPlatform
      : ProdFirebaseOptions.currentPlatform,
);
```

---

## Environment Config Class

Centralize all flavor-specific values:

```dart
// lib/config/env.dart

enum AppFlavor { dev, prod }

class Env {
  Env._();

  static late AppFlavor flavor;

  static void init({required AppFlavor flavor}) {
    Env.flavor = flavor;
  }

  static bool get isDev => flavor == AppFlavor.dev;
  static bool get isProd => flavor == AppFlavor.prod;

  static String get apiBaseUrl => switch (flavor) {
    AppFlavor.dev  => 'https://api-dev.example.com',
    AppFlavor.prod => 'https://api.example.com',
  };

  static String get appName => switch (flavor) {
    AppFlavor.dev  => 'My App DEV',
    AppFlavor.prod => 'My App',
  };

  static String get rcApiKey => switch (flavor) {
    AppFlavor.dev  => Platform.isIOS ? 'appl_dev_key' : 'goog_dev_key',
    AppFlavor.prod => Platform.isIOS ? 'appl_prod_key' : 'goog_prod_key',
  };
}
```

---

## Running Flavors

```bash
# Run dev
flutter run --flavor dev -t lib/main_dev.dart

# Run prod
flutter run --flavor prod -t lib/main_prod.dart

# Build APK (Android)
flutter build apk --flavor prod -t lib/main_prod.dart --release

# Build App Bundle (Android — Play Store)
flutter build appbundle --flavor prod -t lib/main_prod.dart --release

# Build iOS (Xcode archive)
flutter build ipa --flavor prod -t lib/main_prod.dart --release
```

---

## VS Code / Android Studio Launch Config

### VS Code — `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "DEV",
      "request": "launch",
      "type": "dart",
      "flutterMode": "debug",
      "program": "lib/main_dev.dart",
      "args": ["--flavor", "dev"]
    },
    {
      "name": "PROD",
      "request": "launch",
      "type": "dart",
      "flutterMode": "debug",
      "program": "lib/main_prod.dart",
      "args": ["--flavor", "prod"]
    }
  ]
}
```

### Android Studio — Run Configurations

Edit **Run/Debug Configurations** → Add Flutter configuration:

- **Dart entrypoint:** `lib/main_dev.dart`
- **Additional run args:** `--flavor dev`

---

## Anti-Patterns

| Anti-Pattern                                        | Why                                                               | Fix                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Single `main.dart` with an `if (kDebugMode)` switch | `kDebugMode` ≠ flavor; debug builds of prod are also `kDebugMode` | Use separate `main_*.dart` entry points with `Env.flavor`               |
| Hardcoding Firebase options in `main.dart`          | Different environments need different projects                    | Use per-flavor generated options files                                  |
| Committing `GoogleService-Info.plist` at the root   | Only one environment's config is bundled                          | Use the Run Script approach to copy the correct plist                   |
| Sharing the same bundle ID across flavors           | Both flavors install as the same app; they overwrite each other   | Give each flavor a unique bundle/app ID                                 |
| Using `kReleaseMode` to determine environment       | Release builds of dev should still hit dev API                    | Use `Env.flavor` for environment; `kReleaseMode` only for debug tooling |
| Not adding flavor suffix to app name                | Can't tell which build is installed on a device                   | Set `APP_DISPLAY_NAME` / `resValue` per flavor                          |

---

## Examples

### `main_dev.dart`

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:my_app/config/env.dart';
import 'package:my_app/config/firebase_options_dev.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Env.init(flavor: AppFlavor.dev);

  await Firebase.initializeApp(
    options: DevFirebaseOptions.currentPlatform,
  );

  runApp(const App());
}
```

### `main_prod.dart`

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:my_app/config/env.dart';
import 'package:my_app/config/firebase_options_prod.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Env.init(flavor: AppFlavor.prod);

  await Firebase.initializeApp(
    options: ProdFirebaseOptions.currentPlatform,
  );

  runApp(const App());
}
```

### Using `Env` in a service

```dart
class MyApi extends GetxService {
  late final Dio _dio;

  Future<MyApi> init() async {
    _dio = Dio(BaseOptions(baseUrl: Env.apiBaseUrl));
    return this;
  }
}
```
