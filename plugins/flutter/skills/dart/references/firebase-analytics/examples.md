## Examples

### Analytics service (GetX)

```dart
class AnalyticsService extends GetxService {
  static AnalyticsService get to => Get.find();
  final _analytics = FirebaseAnalytics.instance;

  Future<AnalyticsService> init() async => this;

  Future<void> setUser(String uid, String membershipTier) async {
    await _analytics.setUserId(id: uid);
    await _analytics.setUserProperty(name: 'membership_tier', value: membershipTier);
  }

  Future<void> clearUser() async {
    await _analytics.setUserId(id: null);
    await _analytics.setUserProperty(name: 'membership_tier', value: null);
  }

  Future<void> logScreen(String name) async {
    await _analytics.logScreenView(screenName: name, screenClass: name);
  }

  Future<void> logRouteStarted(String routeId) async {
    await _analytics.logEvent(name: 'route_started', parameters: {'route_id': routeId});
  }

  Future<void> logLogin(String method) => _analytics.logLogin(loginMethod: method);
}
```

### Screen tracking in GetX controller

```dart
class HomeController extends GetxController {
  @override
  void onReady() {
    super.onReady();
    AnalyticsService.to.logScreen('HomeScreen');
  }
}
```

### Consent gate pattern

```dart
class ConsentService extends GetxService {
  final _analytics = FirebaseAnalytics.instance;

  Future<void> onConsentGranted() async {
    await _analytics.setAnalyticsCollectionEnabled(true);
    await _analytics.setConsent(
      analyticsStorageConsentGranted: true,
      adStorageConsentGranted: false,
    );
  }

  Future<void> onConsentDenied() async {
    await _analytics.setAnalyticsCollectionEnabled(false);
  }
}
```
