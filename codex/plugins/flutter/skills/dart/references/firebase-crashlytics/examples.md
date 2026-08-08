## Examples

### Full `main.dart` setup

```dart
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  await FirebaseCrashlytics.instance
      .setCrashlyticsCollectionEnabled(!kDebugMode);

  FlutterError.onError = (errorDetails) {
    FirebaseCrashlytics.instance.recordFlutterFatalError(errorDetails);
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    return true;
  };

  runApp(const MyApp());
}
```

### Crashlytics service (GetX)

```dart
class CrashlyticsService extends GetxService {
  static CrashlyticsService get to => Get.find();
  final _crashlytics = FirebaseCrashlytics.instance;

  Future<CrashlyticsService> init() async {
    await _crashlytics.setCrashlyticsCollectionEnabled(!kDebugMode);
    return this;
  }

  Future<void> setUser(String uid) async {
    await _crashlytics.setUserIdentifier(uid);
  }

  Future<void> clearUser() async {
    await _crashlytics.setUserIdentifier('');
  }

  void log(String message) => _crashlytics.log(message);

  Future<void> recordError(Object error, StackTrace stack, {String? reason}) async {
    await _crashlytics.recordError(error, stack, reason: reason, fatal: false);
  }

  Future<void> setContext(Map<String, dynamic> keys) async {
    for (final entry in keys.entries) {
      await _crashlytics.setCustomKey(entry.key, entry.value);
    }
  }
}
```

### Recording error in repository

```dart
class RideRepository {
  Future<List<Ride>> fetchRides(String userId) async {
    try {
      final response = await _api.getRides(userId);
      return response.map(Ride.fromJson).toList();
    } catch (e, stack) {
      CrashlyticsService.to.log('fetchRides failed for user $userId');
      await CrashlyticsService.to.recordError(
        e, stack, reason: 'fetchRides API failure',
      );
      rethrow;
    }
  }
}
```
