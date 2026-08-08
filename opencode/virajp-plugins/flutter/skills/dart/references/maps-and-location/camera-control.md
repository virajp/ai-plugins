## Camera Control

```dart
// Jump instantly (no animation)
controller.moveCamera(CameraUpdate.newLatLng(position));

// Animate
controller.animateCamera(CameraUpdate.newLatLngZoom(position, 16));
controller.animateCamera(CameraUpdate.zoomIn());
controller.animateCamera(CameraUpdate.zoomOut());
controller.animateCamera(CameraUpdate.zoomTo(12));
controller.animateCamera(CameraUpdate.scrollBy(50, 100)); // pixels
controller.animateCamera(CameraUpdate.newCameraPosition(
  CameraPosition(target: position, zoom: 15, bearing: 90, tilt: 30),
));
```

---
