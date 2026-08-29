# Flutter — performance & artifact size

## Performance

Hit the frame budget by keeping `build()` cheap, avoiding raster-thread traps,
and building long lists lazily — then **verify with the profiler on a physical
device**, never by eye in debug mode.

## Core concepts

- **Frame budget.** On a 60Hz display a frame has 16ms total — aim for ≤8ms
  building and ≤8ms rasterizing. 120Hz devices halve that, so faster is always
  better even when already under budget.
- **Two threads.** The **UI thread** runs all Dart code and produces a layer
  tree; the **raster thread** draws it via the GPU. Jank in the UI graph means
  expensive Dart; jank in the raster graph means an expensive scene
  (`saveLayer`, images, clipping).
- **Profile mode only.** Debug builds run JIT with asserts and measure nothing
  real. Profile on a physical device with `flutter run --profile`.

## Keep build() cheap

- **`const` constructors everywhere possible.** A `const` widget short-circuits
  the rebuild — the analyzer's `flutter_lints` rules flag the opportunities.
- **Widgets over helper methods.** Extract reusable UI into a `My`-prefixed
  `StatelessWidget`, never a `Widget _buildX()` helper — a method re-runs on
  every parent rebuild; a (const) widget can be skipped.
- **Split by change frequency.** Break a large `build()` into smaller widgets so
  the parts that never change sit behind stable widget instances the traversal
  skips.
- **Localize rebuilds.** Wrap only the leaf that reads an observable in `Obx`
  (or scope `GetBuilder` with `update(['id'])`) — never a whole page. The same
  applies to `setState()`: call it as deep in the tree as the change allows.
- **Pass static subtrees as `child`.** In `AnimatedBuilder`/`ListenableBuilder`,
  anything not depending on the animation goes in the `child` parameter, built
  once instead of every tick.
- **Never override `operator ==` on a widget.** It degrades rebuild
  short-circuiting to O(N²). `Equatable` belongs on entities and models — never
  on widget classes.
- **`StringBuffer` in loops.** Concatenating with `+` allocates a new `String`
  per iteration; collect parts in a `StringBuffer` and `toString()` once.

## Raster-thread pitfalls

`saveLayer()` allocates an offscreen buffer and forces a GPU render-target
switch — especially costly on mobile. It is triggered implicitly by group
`Opacity`, `ShaderMask`, `ColorFilter`, `ImageFilter` (blur), `Text` overflow
shaders, and `Clip.antiAliasWithSaveLayer`.

| Instead of                           | Use                                                               |
| ------------------------------------ | ----------------------------------------------------------------- |
| `Opacity` around a subtree           | Semi-transparent color/alpha on the leaf widgets themselves       |
| `Opacity` in an animation            | `AnimatedOpacity`, or a fade effect that composites               |
| `Opacity` to fade in an image        | `FadeInImage` (GPU fragment-shader fade)                          |
| `ClipRRect` for rounded corners      | The widget's own `borderRadius` property                          |
| Clipping inside an animation         | Pre-clip the image/content once before animating                  |
| `Clip.antiAliasWithSaveLayer`        | `Clip.antiAlias` or the default — the saveLayer variant is a trap |
| Large blurs (`ImageFilter`, shadows) | Small blur radii; static shadows baked into assets                |

- **`RepaintBoundary` for expensive islands.** Isolate subtrees that repaint on
  their own cadence (maps, video, `CustomPaint`) so the rest of the scene isn't
  re-rasterized with them. Cache entries cost GPU memory — add boundaries only
  where the profiler shows repaint spill, not by default.

## Lists and layout

- **Lazy builders for anything long.** `ListView.builder` / `GridView.builder`
  build only the visible items. A concrete `children:` list
  (`ListView(children: …)`, a `Column` in a scrollable) builds everything up
  front — fine for a handful of static items, wrong for data-driven lists.
- **Fixed extents when known.** `itemExtent` (or `prototypeItem`) skips
  per-child layout entirely.
- **Avoid intrinsic passes.** `IntrinsicHeight`/`IntrinsicWidth` and
  uniform-size grid cells force a second layout pass over *all* children, not
  just visible ones. Prefer fixed cell sizes; verify with the **Track layouts**
  option in DevTools (events labeled `intrinsics`).

## Profiling workflow

1. Run on a physical device: `flutter run --profile`.
2. Enable the performance overlay — press **P** in the terminal, or toggle it in
   the DevTools Performance view. Top graph = raster thread, bottom = UI thread;
   red bars are frames over 16ms.
3. **Red in the UI graph** → open the DevTools Timeline/CPU profiler, enable
   **Track widget rebuilds** to find over-broad rebuilds, and move heavy
   computation (JSON parsing, image/crypto work) to an isolate via `compute()`
   (see the concurrency reference).
4. **Red in the raster graph** → toggle **checkerboardOffscreenLayers** to
   expose `saveLayer` calls and apply the table above; check for uncached image
   decoding; use **Slow Animations** (5x) in the inspector to watch a janky
   transition frame by frame.
5. Re-profile after each change — keep the fix only if the graphs improve.

## Reducing App Size

Measure with release builds, analyse the generated size JSON, then cut the
largest contributors.

## Core concepts (Reducing App Size)

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
