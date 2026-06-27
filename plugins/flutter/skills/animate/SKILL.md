---
name: animate
version: 0.1.0
category: development
description: Declarative widget animations with the flutter_animate package —
  the .animate() extension, effect reference, timing/sequencing with .then(),
  staggered list animations, controllers, and adapters. Use when adding fade,
  slide, scale, blur, shimmer, shake, or custom chained effects to widgets or
  lists in a Flutter app.
license: MIT
user-invocable: false
---

# flutter_animate

## Contents

- [Setup](#setup)
- [Core Concepts](#core-concepts)
- [Effect Reference](#effect-reference)
- [Timing & Sequencing](#timing--sequencing)
- [List Animations](#list-animations)
- [Controller & Lifecycle](#controller--lifecycle)
- [Adapters (Scroll / Notifier)](#adapters-scroll--notifier)
- [Anti-Patterns](#anti-patterns)
- [Examples](#examples)

---

## Setup

```yaml
dependencies:
  flutter_animate:
```

```dart
import 'package:flutter_animate/flutter_animate.dart';
```

Enable hot-reload restart during development:

```dart
void main() {
  Animate.restartOnHotReload = true;
  runApp(const MyApp());
}
```

---

## Core Concepts

### The `.animate()` extension

Call `.animate()` on any widget to wrap it in an `Animate` widget. Chain effects
as method calls. Effects run in parallel by default from `t=0`.

```dart
Text('Hello')
  .animate()
  .fade()      // fades in over 300ms
  .scale()     // scales up simultaneously
```

### Duration shorthand

```dart
300.ms          // Duration(milliseconds: 300)
1.5.seconds     // Duration(milliseconds: 1500)
0.1.minutes     // Duration(seconds: 6)
```

### Effect parameters

Every effect accepts:

| Parameter  | Type        | Default         | Meaning                          |
| ---------- | ----------- | --------------- | -------------------------------- |
| `delay`    | `Duration?` | `Duration.zero` | Wait before starting this effect |
| `duration` | `Duration?` | `300.ms`        | How long the effect runs         |
| `curve`    | `Curve?`    | `Curves.linear` | Easing curve                     |
| `begin`    | varies      | effect-specific | Start value                      |
| `end`      | varies      | effect-specific | End value                        |

Global defaults can be overridden:

```dart
Animate.defaultDuration = 500.ms;
Animate.defaultCurve = Curves.easeOut;
```

---

## Effect Reference

### Fade

Animates opacity. Default: `begin=0 → end=1`.

```dart
widget.animate().fade()                           // 0 → 1
widget.animate().fade(begin: 0.3, end: 1.0)
widget.animate().fadeIn()                         // alias: begin=0 → 1
widget.animate().fadeOut()                        // alias: 1 → end=0
```

### Slide

Moves the widget by a **fraction of its own size**. Default:
`begin=Offset(0, -0.5) → end=Offset.zero` (slides down into place from above).

```dart
widget.animate().slide()                          // from (0, -0.5) → (0, 0)
widget.animate().slideX(begin: -1)               // from left, full width
widget.animate().slideY(begin: 0.2)              // from 20% below
widget.animate().slide(begin: Offset(0.5, 0.5)) // diagonal
```

### Scale

Scales the widget. Default: `begin=Offset(0,0) → end=Offset(1,1)` (grow from
nothing).

```dart
widget.animate().scale()                                // 0 → 1 on both axes
widget.animate().scaleX(begin: 0.5)                    // horizontal only
widget.animate().scaleY(end: 1.2)                      // vertical only, overshoot
widget.animate().scale(alignment: Alignment.centerLeft) // anchor to left edge
```

### Blur

Applies `ImageFilter.blur`. Default: `begin=Offset(0,0) → end=Offset(4,4)` (blur
in).

```dart
widget.animate().blur()                          // 0 → Offset(4,4)
widget.animate().blurXY(begin: 8, end: 0)       // blur out
widget.animate().blurX(begin: 4)                // horizontal only
```

### Shimmer

Sweeps a gradient highlight across the widget. Useful for loading skeletons.

```dart
widget.animate(onPlay: (c) => c.repeat())
  .shimmer(duration: 1200.ms, color: Colors.white38)

// Custom gradient
widget.animate(onPlay: (c) => c.repeat())
  .shimmer(
    colors: [Colors.transparent, Colors.white, Colors.transparent],
    stops: [0.0, 0.5, 1.0],
    angle: pi / 6,
  )
```

> **Note:** Shimmer may have rendering issues on mobile web.

### Shake

Vibrates the widget. Default: `hz=8`, `rotation=pi/36`.

```dart
widget.animate().shake()                              // rotation shake
widget.animate().shakeX(hz: 4, amount: 6)            // horizontal, 6px
widget.animate().shakeY(hz: 10, amount: 3)            // vertical
widget.animate().shake(hz: 3, offset: Offset(10, 0)) // slow left/right only
```

### Other Built-in Effects

| Extension                         | Description                                              |
| --------------------------------- | -------------------------------------------------------- |
| `.tint(color)`                    | Overlay a colour tint                                    |
| `.color(hue:, sat:, brightness:)` | Adjust HSB colour values                                 |
| `.saturate()` / `.desaturate()`   | Colour saturation                                        |
| `.flip(direction:)`               | 3D card flip                                             |
| `.rotate()`                       | 2D rotation                                              |
| `.move(x:, y:)`                   | Absolute pixel offset (unlike slide which is fractional) |
| `.align(alignment:)`              | Animate alignment within parent                          |
| `.elevation(end:)`                | Animate Material shadow elevation                        |
| `.crossfade(builder:)`            | Crossfade to a different widget                          |
| `.swap(builder:)`                 | Swap widgets mid-animation                               |
| `.callback(callback:)`            | Fire a callback at a point in time                       |
| `.listen(callback:)`              | Receive animation value on every tick                    |
| `.custom(builder:)`               | Fully custom effect with a builder                       |
| `.toggle(builder:)`               | Switch between two states at a threshold                 |

---

## Timing & Sequencing

### Parallel (default)

All effects start at `t=0`:

```dart
widget.animate()
  .fade(duration: 400.ms)
  .scale(duration: 400.ms)  // runs at the same time as fade
```

### Sequential with `delay`

Start an effect after a fixed offset:

```dart
widget.animate()
  .fade(duration: 300.ms)
  .scale(delay: 300.ms, duration: 300.ms)  // starts after fade ends
```

### Sequential with `.then()`

`.then()` sets a new time baseline equal to the end of the longest effect so
far. Subsequent effects are measured from this new baseline.

```dart
widget.animate()
  .fadeIn(duration: 300.ms)    // t=0 → 300ms
  .then()                       // baseline moves to 300ms
  .shake(duration: 200.ms)      // t=300ms → 500ms
  .then(delay: 100.ms)          // baseline moves to 600ms
  .slide(duration: 400.ms)      // t=600ms → 1000ms
```

### Looping

Pass a callback to `onPlay` to loop:

```dart
widget.animate(onPlay: (c) => c.repeat())
  .shimmer(duration: 1.5.seconds)

// Reverse loop (ping-pong)
widget.animate(onPlay: (c) => c.repeat(reverse: true))
  .scale(begin: 0.95, end: 1.05, duration: 600.ms, curve: Curves.easeInOut)
```

---

## List Animations

Apply staggered animations to a `List<Widget>` using the `.animate()` extension
on the list. Each widget gets its own `Animate` wrapper; the `interval` staggers
their start times.

```dart
Column(
  children: [card1, card2, card3]
    .animate(interval: 80.ms)  // each child starts 80ms after the previous
    .fadeIn()
    .slideY(begin: 0.2, curve: Curves.easeOut),
)
```

`AnimateList` ignores `Spacer` widgets by default (listed in
`AnimateList.ignoreTypes`).

```dart
// Custom delay for the whole list + per-item interval
[w1, w2, w3].animate(delay: 200.ms, interval: 100.ms).fade().scale()
```

---

## Controller & Lifecycle

### Callbacks

```dart
widget.animate(
  onInit: (controller) {
    // AnimationController is ready; set value, add listeners
    controller.value = 0.5;
  },
  onPlay: (controller) {
    // Animation has started playing
  },
  onComplete: (controller) {
    // All effects finished
    controller.reverse(); // play backwards
  },
)
```

### External `AnimationController`

When you need programmatic control (e.g., play on button tap):

```dart
late AnimationController _controller;

@override
void initState() {
  super.initState();
  _controller = AnimationController(vsync: this);
}

@override
void dispose() {
  _controller.dispose();
  super.dispose();
}

// In build:
widget.animate(
  controller: _controller,
  autoPlay: false,
).fade().scale()

// Trigger manually:
_controller.forward();
_controller.reverse();
_controller.reset();
```

### `target` and `value`

```dart
// Jump to mid-point
widget.animate(value: 0.5).fade()

// Animate to 80% and stop
widget.animate(target: 0.8).fade()
```

---

## Adapters (Scroll / Notifier)

Adapters drive the animation from an external source instead of a timer.

### ScrollAdapter

Sync animation to a `ScrollController`:

```dart
final _scroll = ScrollController();

// Widget scrolls in as the user scrolls down
widget.animate(
  adapter: ScrollAdapter(_scroll, animated: true),
).fade().slideY(begin: 0.2)
```

### ValueAdapter

Drive from any `ValueNotifier<double>`:

```dart
final _progress = ValueNotifier<double>(0);

Slider(
  value: _progress.value,
  onChanged: (v) => _progress.value = v,
)

widget.animate(
  adapter: ValueAdapter(_progress),
).fade().scale()
```

---

## Anti-Patterns

| Anti-Pattern                                                | Why                                                              | Fix                                                              |
| ----------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Calling `.animate()` inside `build()` on every rebuild      | Creates a new `Animate` widget each time, restarting animation   | Move to a `StatefulWidget` or ensure a stable key                |
| Using `delay` when you need sequential ordering             | `delay` is absolute from `t=0`, not relative to previous effects | Use `.then()` for relative sequencing                            |
| Forgetting `onPlay: (c) => c.repeat()` for shimmer/pulse    | Animation plays once then stops                                  | Add `onPlay` callback to loop                                    |
| Using `.animate()` on `Spacer` in lists                     | `Spacer` doesn't render anything; wrapping breaks layout         | `AnimateList` ignores `Spacer` by default — don't fight it       |
| Animating expensive widgets (e.g. `CustomPaint`) repeatedly | Causes jank                                                      | Prefer compositing effects (fade, slide) over rebuild-heavy ones |
| Large blur values (`blurXY(begin: 20)`)                     | Expensive ImageFilter on every frame                             | Keep blur values below `~8`; test on low-end devices             |
| Shimmer on mobile web                                       | Known Flutter limitation                                         | Use a fallback or skip shimmer on `kIsWeb`                       |

---

## Examples

### Entrance animation (card)

```dart
Card(child: ListTile(title: Text(title)))
  .animate()
  .fadeIn(duration: 300.ms, curve: Curves.easeOut)
  .slideY(begin: 0.1, duration: 300.ms, curve: Curves.easeOut)
```

### Staggered list

```dart
ListView(
  children: items.map((item) => ItemCard(item)).toList()
    .animate(interval: 60.ms)
    .fadeIn(curve: Curves.easeOut)
    .slideX(begin: -0.05, curve: Curves.easeOut),
)
```

### Loading skeleton shimmer

```dart
Container(
  width: 200,
  height: 16,
  decoration: BoxDecoration(
    color: Colors.grey.shade300,
    borderRadius: BorderRadius.circular(4),
  ),
)
  .animate(onPlay: (c) => c.repeat())
  .shimmer(duration: 1200.ms, color: Colors.white54)
```

### Attention pulse

```dart
Icon(Icons.notifications)
  .animate(onPlay: (c) => c.repeat(reverse: true))
  .scale(
    begin: const Offset(1, 1),
    end: const Offset(1.15, 1.15),
    duration: 600.ms,
    curve: Curves.easeInOut,
  )
```

### Error shake (validation feedback)

```dart
TextFormField(...)
  .animate(controller: _shakeController, autoPlay: false)
  .shakeX(hz: 6, amount: 8, duration: 400.ms)

// On validation failure:
_shakeController
  ..reset()
  ..forward();
```

### Sequential reveal

```dart
Column(children: [
  Text('Step 1').animate().fadeIn(),
  Text('Step 2').animate().fadeIn(delay: 400.ms),
  Text('Step 3').animate().fadeIn(delay: 800.ms),
])

// Or with .then() on one widget:
widget
  .animate()
  .fadeIn(duration: 300.ms)
  .then()
  .slideY(begin: -0.05, duration: 200.ms)
  .then(delay: 100.ms)
  .scale(end: const Offset(1.02, 1.02), duration: 150.ms)
```

### Scroll-driven fade-in

```dart
final _scroll = ScrollController();

ListView(
  controller: _scroll,
  children: items.map((item) =>
    ItemWidget(item)
      .animate(adapter: ScrollAdapter(_scroll, animated: true))
      .fade()
      .slideY(begin: 0.15)
  ).toList(),
)
```
