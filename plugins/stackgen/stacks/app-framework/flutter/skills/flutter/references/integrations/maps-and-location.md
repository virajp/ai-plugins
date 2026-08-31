# Maps & location — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

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

## Maps & Location

Display maps and track user location in a Flutter app using google_maps_flutter,
geolocator, and wakelock_plus — permissions, position streams, markers,
polylines, camera control, and keeping the screen awake.

Covers: `google_maps_flutter`, `geolocator`, `wakelock_plus`

Sections in this file:

| Section                         | When to read                                            |
| ------------------------------- | ------------------------------------------------------- |
| [Anti-Patterns](#anti-patterns) | Avoiding common maps and location mistakes              |
| [Setup](#setup)                 | Adding the packages, API keys, and platform permissions |

Reading a position once or as a stream, the map widget and its controller,
markers, polylines, circles, camera control, custom styling and the wakelock are
API surface. Fetch them from Context7 at use time. **Always check and request
location permission before any location call** — that is a platform contract,
not a package detail, and the declarations it needs are below.

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
