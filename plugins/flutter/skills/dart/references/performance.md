# Performance

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
