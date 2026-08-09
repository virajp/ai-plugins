## Polylines (Routes)

```dart
Set<Polyline> _buildPolyline(List<LatLng> points) {
  return {
    Polyline(
      polylineId: const PolylineId('route'),
      points: points,
      color: Colors.blue,
      width: 5,
      patterns: [], // solid; use [PatternItem.dash(20), PatternItem.gap(10)] for dashed
      startCap: Cap.roundCap,
      endCap: Cap.roundCap,
      jointType: JointType.round,
      geodesic: true,
    ),
  };
}
```

---
