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
