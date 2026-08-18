## Collection Control

```dart
// Disable in debug builds (recommended — avoid polluting crash reports)
await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(!kDebugMode);

// Check current state
final enabled = FirebaseCrashlytics.instance.isCrashlyticsCollectionEnabled;

// Force a test crash (debug only)
FirebaseCrashlytics.instance.crash();
```

Permanently disable in `AndroidManifest.xml` (then re-enable at runtime with
consent):

```xml
<meta-data
  android:name="firebase_crashlytics_collection_enabled"
  android:value="false"
/>
```

---
