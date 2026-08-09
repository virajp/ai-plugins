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
