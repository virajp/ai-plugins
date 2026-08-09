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
