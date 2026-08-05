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
