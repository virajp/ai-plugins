## Instance

```dart
final analytics = FirebaseAnalytics.instance;

// Secondary Firebase app
final analytics = FirebaseAnalytics.instanceFor(app: Firebase.app('secondary'));
```

> Analytics only works on the **default** Firebase app. Events logged on
> secondary apps are silently dropped.

---
