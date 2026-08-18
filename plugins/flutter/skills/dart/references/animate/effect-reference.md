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
