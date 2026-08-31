# flutter_animate — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

The `.animate()` extension used throughout
[UI composition & theming](../ui-composition.md) is **this package's**, not the
framework's — `flutter_animate` must be a declared dependency before any of it
compiles. The composition-time judgment (chaining, `.then()` sequencing,
controller lifecycle, the anti-patterns) lives in that reference; what follows
is the wiring and the effect vocabulary it chains.

## Setup

```yaml
dependencies:
  flutter_animate:
```

```dart
import 'package:flutter_animate/flutter_animate.dart';
```

Enable the hot-reload restart during development, so an edited animation replays
rather than staying wherever the previous run left it:

```dart
void main() {
  Animate.restartOnHotReload = true;
  runApp(const MyApp());
}
```

---

## Effect reference

Every effect takes `delay`, `duration`, `curve`, `begin` and `end`; the defaults
below are what you get when you pass nothing, and knowing them is what makes a
bare `.fade()` readable.

### Fade

Animates opacity. Default: `begin=0 → end=1`.

```dart
widget.animate().fade()                     // 0 → 1
widget.animate().fade(begin: 0.3, end: 1.0)
widget.animate().fadeIn()                   // alias: begin=0 → 1
widget.animate().fadeOut()                  // alias: 1 → end=0
```

### Slide

Moves the widget by a **fraction of its own size**, not by pixels. Default:
`begin=Offset(0, -0.5) → end=Offset.zero` — it slides down into place from
above.

```dart
widget.animate().slide()                        // from (0, -0.5) → (0, 0)
widget.animate().slideX(begin: -1)              // from left, full width
widget.animate().slideY(begin: 0.2)             // from 20% below
widget.animate().slide(begin: Offset(0.5, 0.5)) // diagonal
```

### Scale

Default: `begin=Offset(0,0) → end=Offset(1,1)` — grow from nothing.

```dart
widget.animate().scale()                                // 0 → 1, both axes
widget.animate().scaleX(begin: 0.5)                     // horizontal only
widget.animate().scaleY(end: 1.2)                       // vertical, overshoot
widget.animate().scale(alignment: Alignment.centerLeft) // anchor to left edge
```

### Blur

Applies `ImageFilter.blur`. Default: `begin=Offset(0,0) → end=Offset(4,4)`.

```dart
widget.animate().blur()                    // 0 → Offset(4,4)
widget.animate().blurXY(begin: 8, end: 0)  // blur out
widget.animate().blurX(begin: 4)           // horizontal only
```

Blur is an ImageFilter on every frame — keep values below `~8` and test on a
low-end device.

### Shimmer

Sweeps a gradient highlight across the widget; the loading-skeleton effect. It
needs a repeating controller or it plays once and stops.

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

> **Shimmer has known rendering problems on mobile web.** Fall back or skip it
> on `kIsWeb`.

### Shake

Vibrates the widget. Default: `hz=8`, `rotation=pi/36`.

```dart
widget.animate().shake()                             // rotation shake
widget.animate().shakeX(hz: 4, amount: 6)            // horizontal, 6px
widget.animate().shakeY(hz: 10, amount: 3)           // vertical
widget.animate().shake(hz: 3, offset: Offset(10, 0)) // slow left/right only
```

### The rest

| Extension                         | Description                                              |
| --------------------------------- | -------------------------------------------------------- |
| `.tint(color)`                    | Overlay a colour tint                                    |
| `.color(hue:, sat:, brightness:)` | Adjust HSB colour values                                 |
| `.saturate()` / `.desaturate()`   | Colour saturation                                        |
| `.flip(direction:)`               | 3D card flip                                             |
| `.rotate()`                       | 2D rotation                                              |
| `.move(x:, y:)`                   | Absolute pixel offset (unlike slide, which is fractional) |
| `.align(alignment:)`              | Animate alignment within parent                          |
| `.elevation(end:)`                | Animate Material shadow elevation                        |
| `.crossfade(builder:)`            | Crossfade to a different widget                          |
| `.swap(builder:)`                 | Swap widgets mid-animation                               |
| `.callback(callback:)`            | Fire a callback at a point in time                       |
| `.listen(callback:)`              | Receive the animation value on every tick                |
| `.custom(builder:)`               | Fully custom effect with a builder                       |
| `.toggle(builder:)`               | Switch between two states at a threshold                 |

---

## List animations

`.animate()` on a `List<Widget>` wraps each child separately; `interval`
staggers their start times. This is `AnimateList`, and it is the only correct
way to stagger — a shared controller cannot offset per child.

```dart
Column(
  children: [card1, card2, card3]
    .animate(interval: 80.ms)  // each child starts 80ms after the previous
    .fadeIn()
    .slideY(begin: 0.2, curve: Curves.easeOut),
)
```

`delay` offsets the whole list; `interval` spaces the children within it:

```dart
[w1, w2, w3].animate(delay: 200.ms, interval: 100.ms).fade().scale()
```

**`AnimateList` skips `Spacer` by default** (it is in `AnimateList.ignoreTypes`)
because a `Spacer` renders nothing and wrapping it breaks the layout. That is
the behaviour the anti-pattern table in
[UI composition & theming](../ui-composition.md) tells you not to fight.

---

## Adapters (scroll / notifier)

An adapter replaces the timer as the animation's driver, so the animation tracks
an external value rather than elapsed time. Position, not playback.

### ScrollAdapter

```dart
final _scroll = ScrollController();

// The widget animates in as the user scrolls
widget.animate(
  adapter: ScrollAdapter(_scroll, animated: true),
).fade().slideY(begin: 0.2)
```

### ValueAdapter

Drives from any `ValueNotifier<double>`:

```dart
final _progress = ValueNotifier<double>(0);

Slider(
  value: _progress.value,
  onChanged: (v) => _progress.value = v,
)

widget.animate(adapter: ValueAdapter(_progress)).fade().scale()
```

An adapter-driven animation has no `onComplete` in the ordinary sense — it is
wherever its source says it is, so do not hang sequencing off it.

---
