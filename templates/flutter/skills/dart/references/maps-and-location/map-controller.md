## Map Controller

```dart
final _mapController = Completer<GoogleMapController>();

// Move camera to a position
Future<void> moveToPosition(LatLng target, {double zoom = 15}) async {
  final controller = await _mapController.future;
  await controller.animateCamera(
    CameraUpdate.newCameraPosition(
      CameraPosition(target: target, zoom: zoom),
    ),
  );
}

// Fit bounds (e.g., show full route)
Future<void> fitRoute(List<LatLng> points) async {
  if (points.isEmpty) return;
  final bounds = _boundsFromLatLngList(points);
  final controller = await _mapController.future;
  await controller.animateCamera(
    CameraUpdate.newLatLngBounds(bounds, 60), // 60px padding
  );
}

LatLngBounds _boundsFromLatLngList(List<LatLng> points) {
  double minLat = points.first.latitude;
  double maxLat = points.first.latitude;
  double minLng = points.first.longitude;
  double maxLng = points.first.longitude;
  for (final p in points) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLng) minLng = p.longitude;
    if (p.longitude > maxLng) maxLng = p.longitude;
  }
  return LatLngBounds(
    southwest: LatLng(minLat, minLng),
    northeast: LatLng(maxLat, maxLng),
  );
}

// Take a screenshot
final bytes = await controller.takeSnapshot();
```

---
