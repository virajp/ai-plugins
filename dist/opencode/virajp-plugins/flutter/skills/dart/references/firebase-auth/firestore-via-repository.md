## Firestore via Repository

Access Firestore through repository static methods — never import
`cloud_firestore` in services or controllers directly; use the repo layer. Wrap
failures in `MyException` and log via `Logger`:

```dart
// In a repository
static Future<MyRide?> fetchRide(final String rideId) async {
  try {
    final DocumentSnapshot<Map<String, dynamic>> doc = await FirebaseFirestore.instance
        .collection('rides')
        .doc(rideId)
        .get();
    if (!doc.exists || doc.data() == null) return null;
    return MyRide.fromJson(doc.data()!);
  } catch (error, stackTrace) {
    Logger.error(MyException(
      code: ExceptionCodes.unexpectedException,
      exception: error,
      stackTrace: stackTrace,
      ctx: {'rideId': rideId, 'caller': 'MyRideRepo.fetchRide'},
    ));
    return null;
  }
}
```

---
