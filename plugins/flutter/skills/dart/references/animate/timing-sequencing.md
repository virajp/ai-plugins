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
