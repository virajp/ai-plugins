## Custom Map Style

```dart
// Load JSON style from assets
final style = await rootBundle.loadString('assets/map_style_dark.json');
final controller = await _mapController.future;
await controller.setMapStyle(style);

// Reset to default
await controller.setMapStyle(null);
```

Generate style JSON at: https://mapstyle.withgoogle.com/

---
