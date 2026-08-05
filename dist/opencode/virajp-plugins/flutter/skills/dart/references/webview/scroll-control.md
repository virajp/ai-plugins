## Scroll Control

```dart
// Scroll to absolute position
await controller.scrollTo(0, 200);

// Scroll relative to current position
await controller.scrollBy(0, 100);

// Get current position
final Offset pos = await controller.getScrollPosition();

// Hide scrollbars
if (await controller.supportsSetScrollBarsEnabled() ?? false) {
  await controller.setVerticalScrollBarEnabled(false);
  await controller.setHorizontalScrollBarEnabled(false);
}

// Track scroll changes reactively
controller.setOnScrollPositionChange((ScrollPositionChange change) {
  debugPrint('Scroll: x=${change.x}, y=${change.y}');
});
```

---
