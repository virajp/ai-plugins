## Google Maps Widget

```dart
import 'package:google_maps_flutter/google_maps_flutter.dart';

GoogleMap(
  initialCameraPosition: const CameraPosition(
    target: LatLng(37.7749, -122.4194),
    zoom: 14,
  ),
  onMapCreated: (GoogleMapController controller) {
    _mapController.complete(controller);
  },
  myLocationEnabled: true,
  myLocationButtonEnabled: true,
  mapType: MapType.normal, // normal | satellite | terrain | hybrid
  zoomControlsEnabled: false,
  compassEnabled: true,
  markers: _markers,
  polylines: _polylines,
  circles: _circles,
  onTap: (LatLng position) => print('Tapped: $position'),
  onCameraMove: (CameraPosition pos) => print('Zoom: ${pos.zoom}'),
)
```

---
