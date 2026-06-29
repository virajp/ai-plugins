## Custom Keys

Attach key-value metadata to crash reports to provide context (device state,
feature flags, etc.).

```dart
await FirebaseCrashlytics.instance.setCustomKey('route_id', 'abc123');
await FirebaseCrashlytics.instance.setCustomKey('membership_tier', 'premium');
await FirebaseCrashlytics.instance.setCustomKey('map_zoom_level', 12);
await FirebaseCrashlytics.instance.setCustomKey('offline_mode', true);
```

- Max 64 key-value pairs per session
- Keys and string values truncated at 1024 chars each
- Values can be `String`, `bool`, `int`, `double`

---
