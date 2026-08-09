# Reducing App Size

Measure with release builds, analyse the generated size JSON, then cut the
largest contributors.

## Core concepts

- **Debug vs release.** Never measure size from a debug build — it carries VM
  overhead and skips AOT compilation and tree-shaking.
- **Upload vs download size.** An APK/AAB/IPA is not the end-user download; the
  stores strip redundant native architectures and asset densities per device.
- **AOT tree-shaking.** The Dart AOT compiler drops unreachable code in profile
  and release modes automatically.
- **Size analysis JSON.** The `--analyze-size` flag emits a
  `*-code-size-analysis_*.json` breaking down bytes by package, library, class,
  and function.

## Generating the analysis

Run the release build for the target platform with `--analyze-size`; the JSON
lands under `build/`.

- **Android:** `flutter build apk --analyze-size` or
  `flutter build appbundle --analyze-size`.
- **Desktop:** `flutter build [windows|macos|linux] --analyze-size`.
- **iOS:** `flutter build ios --analyze-size` gives relative content sizing but
  not an accurate download estimate — use the iOS estimate below for that.

```bash
# Android App Bundle, arm64
flutter build appbundle --analyze-size --target-platform=android-arm64
```

## Inspecting in DevTools

Launch `dart devtools`, open the app-size tool, and upload the JSON. Inspect the
treemap to find the largest packages, libraries, or assets, decide whether each
is strictly necessary, remove or optimize it, then regenerate and compare builds
with the DevTools "Diff" tab.

## Estimating iOS download size

For an accurate per-device projection, archive and read the thinning report:

1. Set the version and build number in `pubspec.yaml`.
2. `flutter build ipa --export-method development`.
3. Open `build/ios/archive/*.xcarchive` in Xcode, **Distribute App →
   Development**.
4. Choose **All compatible device variants** and **Strip Swift symbols**, then
   sign and export.
5. Read `App Thinning Size Report.txt` — the compressed size is the end-user
   download, the uncompressed size the on-device footprint:

```text
Variant: Runner-7433FC8E-1DF4-4299-A7E8-E00768671BEB.ipa
Supported variant descriptors: [device: iPhone12,1, os-version: 13.0]
App size: 5.4 MB compressed, 13.7 MB uncompressed
```

## Reduction strategies

- **Split debug info.** Strip symbols into separate files:

  ```bash
  flutter build apk --obfuscate --split-debug-info=build/app/outputs/symbols
  ```

- **Remove unused resources.** Audit `pubspec.yaml` and `assets/`; delete
  images, fonts, and files no longer referenced.
- **Minimize library resources.** If a package bundles large icon sets or
  localization files but you use a fraction, consider a lighter package or a
  custom implementation.
- **Compress media.** Run PNG/JPEG assets through `pngquant`, `imageoptim`, or
  WebP conversion before bundling.
