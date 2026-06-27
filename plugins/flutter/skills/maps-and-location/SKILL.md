---
name: maps-and-location
version: 0.1.0
category: development
description: Display maps and track user location in a Flutter app using
  google_maps_flutter, geolocator, and wakelock_plus — permissions, position
  streams, markers, polylines, camera control, and keeping the screen awake. Use
  when rendering maps, adding markers, following user position, drawing
  polylines for routes, or keeping the screen awake during navigation.
license: MIT
user-invocable: false
---

# Maps & Location

Covers: `google_maps_flutter`, `geolocator`, `wakelock_plus`

## Contents

- [Setup](#setup)
- [Location Permissions](#location-permissions)
- [Current Position](#current-position)
- [Position Stream](#position-stream)
- [Google Maps Widget](#google-maps-widget)
- [Map Controller](#map-controller)
- [Markers](#markers)
- [Polylines (Routes)](#polylines-routes)
- [Circles & Polygons](#circles--polygons)
- [Camera Control](#camera-control)
- [Custom Map Style](#custom-map-style)
- [Wakelock (Screen On)](#wakelock-screen-on)
- [Anti-Patterns](#anti-patterns)
- [Examples](#examples)

---

## Setup

```yaml
dependencies:
  google_maps_flutter:
  geolocator:
  wakelock_plus:
```

### Android — `android/app/src/main/AndroidManifest.xml`

```xml
<!-- API key -->
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="${MAPS_API_KEY}"
/>

<!-- Location permissions -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<!-- Background location (only if needed) -->
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

Pass the API key via `build.gradle` local properties or flavors, never hardcode.

### iOS — `ios/Runner/AppDelegate.swift`

```swift
import GoogleMaps
// ...
GMSServices.provideAPIKey("YOUR_KEY")
```

### iOS — `Info.plist`

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We use your location to show your position on the map.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We use your location to track your ride in the background.</string>
```

---

## Location Permissions

Always check and request permissions before calling location APIs.

```dart
import 'package:geolocator/geolocator.dart';

Future<bool> requestLocationPermission() async {
  final serviceEnabled = await Geolocator.isLocationServiceEnabled();
  if (!serviceEnabled) {
    // Device GPS is off — prompt user to enable
    return false;
  }

  LocationPermission permission = await Geolocator.checkPermission();

  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied) return false;
  }

  if (permission == LocationPermission.deniedForever) {
    // Open app settings — user must manually grant
    await Geolocator.openAppSettings();
    return false;
  }

  return true; // LocationPermission.whileInUse or .always
}
```

### Permission values

| Value               | Meaning                                     |
| ------------------- | ------------------------------------------- |
| `denied`            | Not yet asked, or just denied               |
| `deniedForever`     | User permanently denied — must use settings |
| `whileInUse`        | Foreground location granted                 |
| `always`            | Background location granted                 |
| `unableToDetermine` | iOS only — undetermined state               |

---

## Current Position

```dart
final position = await Geolocator.getCurrentPosition(
  locationSettings: const LocationSettings(
    accuracy: LocationAccuracy.high,
    timeLimit: Duration(seconds: 10),
  ),
);

print('Lat: ${position.latitude}, Lng: ${position.longitude}');
print('Speed: ${position.speed} m/s');
print('Heading: ${position.heading}°');
print('Accuracy: ${position.accuracy} m');
```

### Accuracy levels

| Accuracy            | ~Accuracy | Battery  |
| ------------------- | --------- | -------- |
| `lowest`            | ~3000 m   | Minimal  |
| `low`               | ~1000 m   | Low      |
| `medium`            | ~100 m    | Moderate |
| `high`              | ~10 m     | High     |
| `best`              | ~5 m      | Highest  |
| `bestForNavigation` | ~1 m      | Highest  |

---

## Position Stream

```dart
final locationSettings = AndroidSettings(
  accuracy: LocationAccuracy.high,
  distanceFilter: 5,         // minimum 5m movement before new event
  intervalDuration: const Duration(seconds: 1),
  foregroundNotificationConfig: const ForegroundNotificationConfig(
    notificationTitle: 'Tracking your ride',
    notificationText: 'Location is being tracked.',
    enableWakeLock: true,
  ),
);

final subscription = Geolocator.getPositionStream(
  locationSettings: locationSettings,
).listen((Position position) {
  print('${position.latitude}, ${position.longitude}');
});

// Cancel when done
subscription.cancel();
```

### iOS settings

```dart
final locationSettings = AppleSettings(
  accuracy: LocationAccuracy.bestForNavigation,
  activityType: ActivityType.fitness,
  distanceFilter: 5,
  pauseLocationUpdatesAutomatically: false,
  showBackgroundLocationIndicator: true,
);
```

---

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

## Wakelock (Screen On)

During active navigation keep the screen awake:

```dart
import 'package:wakelock_plus/wakelock_plus.dart';

// Enable
await WakelockPlus.enable();

// Disable (call when leaving navigation screen)
await WakelockPlus.disable();

// Check state
final isEnabled = await WakelockPlus.enabled;

// Toggle
await WakelockPlus.toggle(enable: isActiveRide);
```

Always disable the wakelock when navigation ends or the screen is disposed.

---

## Anti-Patterns

| Anti-Pattern                                         | Why                                     | Fix                                               |
| ---------------------------------------------------- | --------------------------------------- | ------------------------------------------------- |
| Requesting location without checking service enabled | `getCurrentPosition` hangs indefinitely | Always check `isLocationServiceEnabled()` first   |
| Using `getCurrentPosition` repeatedly in a loop      | Battery drain; high latency             | Use `getPositionStream` for continuous tracking   |
| Not cancelling `StreamSubscription` on dispose       | Memory leak and battery drain           | Cancel in `onClose` / `dispose`                   |
| Rebuilding `Set<Marker>` on every position update    | Causes full map re-render flicker       | Only update the moving marker; keep others stable |
| Leaving wakelock enabled after ride ends             | Drains battery; never sleeps            | `WakelockPlus.disable()` in `onClose`/`dispose`   |
| Hardcoding Google Maps API key in source             | Key exposed in version control          | Use environment variables / native secrets        |
| Not disposing `GoogleMapController`                  | Native resource leak                    | Call `controller.dispose()` in `dispose`          |

---

## Examples

### Navigation controller (GetX)

```dart
class NavigationController extends GetxController {
  final _mapController = Completer<GoogleMapController>();
  final currentPosition = Rxn<Position>();
  final routePoints = <LatLng>[].obs;
  final markers = <Marker>{}.obs;
  StreamSubscription<Position>? _positionSub;

  @override
  void onInit() {
    super.onInit();
    _startTracking();
    WakelockPlus.enable();
  }

  @override
  void onClose() {
    _positionSub?.cancel();
    WakelockPlus.disable();
    super.onClose();
  }

  Future<void> _startTracking() async {
    final granted = await requestLocationPermission();
    if (!granted) return;

    _positionSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: 5,
      ),
    ).listen((position) {
      currentPosition.value = position;
      final latLng = LatLng(position.latitude, position.longitude);
      routePoints.add(latLng);
      _updateUserMarker(latLng);
      _centerOnUser(latLng);
    });
  }

  void _updateUserMarker(LatLng pos) {
    markers.removeWhere((m) => m.markerId.value == 'user');
    markers.add(Marker(
      markerId: const MarkerId('user'),
      position: pos,
      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
    ));
  }

  Future<void> _centerOnUser(LatLng pos) async {
    final controller = await _mapController.future;
    await controller.animateCamera(CameraUpdate.newLatLng(pos));
  }

  void onMapCreated(GoogleMapController controller) {
    _mapController.complete(controller);
  }
}
```

### Map widget

```dart
Obx(() => GoogleMap(
  initialCameraPosition: const CameraPosition(
    target: LatLng(37.7749, -122.4194),
    zoom: 15,
  ),
  onMapCreated: controller.onMapCreated,
  myLocationEnabled: false,
  markers: controller.markers,
  polylines: {
    if (controller.routePoints.isNotEmpty)
      Polyline(
        polylineId: const PolylineId('track'),
        points: controller.routePoints,
        color: Colors.blue,
        width: 4,
      ),
  },
))
```

### Distance between two positions

```dart
final distanceMeters = Geolocator.distanceBetween(
  startLat, startLng,
  endLat, endLng,
);

final bearingDegrees = Geolocator.bearingBetween(
  startLat, startLng,
  endLat, endLng,
);
```
