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
