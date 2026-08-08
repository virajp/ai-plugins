## Screen Tracking

### Manual (recommended for GetX)

```dart
await analytics.logScreenView(
  screenName: 'HomeScreen',
  screenClass: 'HomeScreen',
);
```

Call this in `onReady` or `onInit` of a GetX controller, or inside the widget's
`initState`.

### Automatic with `FirebaseAnalyticsObserver`

Add the observer to your `GetMaterialApp` or `MaterialApp`:

```dart
GetMaterialApp(
  navigatorObservers: [
    FirebaseAnalyticsObserver(analytics: FirebaseAnalytics.instance),
  ],
  // ...
)
```

The observer reads the `RouteSettings.name` of each pushed route. For named
routes this works automatically. For anonymous routes, override `RouteAware` or
log manually.

---
