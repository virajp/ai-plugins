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
