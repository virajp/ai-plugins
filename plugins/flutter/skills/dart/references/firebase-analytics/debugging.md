## Debugging

### Android

```bash
adb shell setprop debug.firebase.analytics.app com.example.app
```

### iOS (Xcode)

Add `-FIRDebugEnabled` to the scheme's launch arguments.

### DebugView

Open Firebase Console → Analytics → DebugView to see events in real time (debug
builds only).

```dart
// Verify events are being logged in debug
if (kDebugMode) {
  await analytics.setAnalyticsCollectionEnabled(true);
}
```

---
