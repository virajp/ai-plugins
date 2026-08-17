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
