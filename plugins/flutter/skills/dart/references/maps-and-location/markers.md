## Markers

```dart
Set<Marker> _buildMarkers(List<WayPoint> waypoints) {
  return waypoints.map((wp) {
    return Marker(
      markerId: MarkerId(wp.id),
      position: LatLng(wp.lat, wp.lng),
      infoWindow: InfoWindow(
        title: wp.name,
        snippet: wp.description,
        onTap: () => onMarkerTap(wp),
      ),
      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
      anchor: const Offset(0.5, 1.0),
      onTap: () => onMarkerTap(wp),
    );
  }).toSet();
}

// Custom bitmap marker from an asset
Future<BitmapDescriptor> loadMarkerIcon(String assetPath) async {
  return BitmapDescriptor.asset(
    const ImageConfiguration(size: Size(48, 48)),
    assetPath,
  );
}
```

---
