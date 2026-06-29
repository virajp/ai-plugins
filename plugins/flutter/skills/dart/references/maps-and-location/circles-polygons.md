## Circles & Polygons

```dart
// Circle (e.g., accuracy radius)
Circle accuracyCircle(LatLng center, double radiusMeters) {
  return Circle(
    circleId: const CircleId('accuracy'),
    center: center,
    radius: radiusMeters,
    fillColor: Colors.blue.withOpacity(0.15),
    strokeColor: Colors.blue,
    strokeWidth: 1,
  );
}

// Polygon (e.g., geo-fenced area)
Polygon geofence(List<LatLng> boundary) {
  return Polygon(
    polygonId: const PolygonId('zone'),
    points: boundary,
    fillColor: Colors.green.withOpacity(0.2),
    strokeColor: Colors.green,
    strokeWidth: 2,
  );
}
```

---
