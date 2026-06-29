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
