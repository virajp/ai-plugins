# Flutter — data & networking

## HTTP & JSON

All network access goes through `MyApi.to` — never `http.Client`, `Uri.https`,
or `jsonDecode` on a raw response directly. `MyApi` injects auth, app-check, and
platform headers, decodes the body, and never throws. Callers branch on a status
code; they do not wrap calls in `try`/`catch`.

## The `MyApiResponse` contract

Every `MyApi.to` method returns a `MyApiResponse`:

| Field        | Meaning                                                        |
| ------------ | -------------------------------------------------------------- |
| `body`       | The response body, already JSON-decoded (a `Map` or `List`)    |
| `statusCode` | The HTTP status; **`418`** signals a transport/network failure |
| `message`    | A human-readable message for logging or a snackbar             |

Because transport errors surface as `statusCode == 418` rather than a thrown
exception, there is nothing to `catch` — the entire error surface is the status
code. Treat `200`/`201` as success and everything else (including `418`) as
failure.

## Making requests

`MyApi.to` exposes `get` / `post` / `put` / `delete`. Pass the path (with an
already-interpolated resource id) and, for query strings, a `query` map — the
client encodes it; never concatenate query strings by hand. Send a body as a
plain `Map`; the client JSON-encodes it.

```dart
class RideRepo {
  static Future<MyRide?> fetch(final String rideId) async {
    final MyApiResponse res = await MyApi.to.get('/rides/$rideId');
    if (res.statusCode != 200) {
      Logger.warning('fetchRide failed: ${res.message}');
      return null;
    }
    return MyRide.fromJson(res.body as Map<String, dynamic>);
  }

  static Future<bool> create(final MyRide ride) async {
    final MyApiResponse res = await MyApi.to.post('/rides', body: ride.toJson());
    return res.statusCode == 201;
  }

  static Future<List<MyRide>> search({required final String city}) async {
    final MyApiResponse res =
        await MyApi.to.get('/rides', query: {'city': city});
    if (res.statusCode != 200) return const [];
    return (res.body as List<dynamic>)
        .map((final dynamic e) => MyRide.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
```

Repositories are static, stateless, and return `null` / `false` / an empty list
on failure — they log with `MyException` but never rethrow.

## JSON (de)serialization

For a handful of models, hand-write the immutable `Equatable` entity with a
`fromJson` factory and `toJson` method (see the entity pattern in
[Standards & architecture](standards-and-architecture.md#entity-pattern)). For
many or deeply nested models, use `json_serializable` codegen — see
[json_serializable](integrations/json-serializable.md).

```dart
class MyRide extends Equatable {
  const MyRide._({required this.id, required this.title});

  factory MyRide.fromJson(final Map<String, dynamic> json) =>
      MyRide._(id: json['id'] as String, title: json['title'] as String);

  final String id;
  final String title;

  @override
  List<Object?> get props => [id, title];

  Map<String, dynamic> toJson() => {'id': id, 'title': title};
}
```

## Large payloads

`MyApi` decodes the body on the main isolate, which is fine for typical
responses. When mapping a **large** list (thousands of items) into entities is
itself expensive, offload the mapping to an isolate with `compute()` — the
callback must be a top-level or static function taking one sendable argument.

```dart
List<MyRide> _parseRides(final List<dynamic> raw) =>
    raw.map((final dynamic e) => MyRide.fromJson(e as Map<String, dynamic>)).toList();

static Future<List<MyRide>> fetchAll() async {
  final MyApiResponse res = await MyApi.to.get('/rides');
  if (res.statusCode != 200) return const [];
  return compute(_parseRides, res.body as List<dynamic>);
}
```

See [Concurrency & isolates](concurrency.md) for when to move work off the main
isolate.

## Caching & Offline-First

Cache in the repository layer — the SSOT that combines a local store and the
remote `MyApi`. Pick the store by data shape, and yield local data first for a
responsive UI.

## Choosing a store

- **Small UI state or preferences:** `shared_preferences`.
- **Large, structured datasets:** an on-device database (`sqflite`, Drift, Hive
  CE, or Isar).
- **Binary data or large media:** the file system via `path_provider`.
- **Session state (navigation, scroll positions):** Flutter's built-in state
  restoration.
- **Android startup:** pre-warm and cache the `FlutterEngine`.

## Offline-first repositories

Repositories are static and stateless; the offline-first ones fan out to a local
store and `MyApi.to`, wrapping remote failures with `MyException` / `Logger`
rather than throwing.

### Reads — yield local, then refresh

Emit the cached value immediately, then fetch remote, update the cache, and emit
fresh data:

```dart
static Stream<MyUser> profile(final String userId) async* {
  final MyUser? local = await ProfileDb.fetch(userId);
  if (local != null) yield local;

  final MyApiResponse res = await MyApi.to.get('/users/$userId');
  if (res.statusCode != 200) {
    Logger.warning('profile refresh failed: ${res.message}');
    return; // UI already has the local value
  }
  final MyUser fresh = MyUser.fromJson(res.body as Map<String, dynamic>);
  await ProfileDb.upsert(fresh);
  yield fresh;
}
```

### Writes — pick by criticality

- **Online-only:** call `MyApi.to` first; write local only if it succeeds.
- **Offline-first:** write local immediately, then attempt `MyApi.to`; on a
  non-success status, flag the record `synchronized: false` for a background
  sync (a `Timer` or `workmanager` task pushes unsynced rows later).

## File system & SQLite

Use `path_provider` for file locations — `getApplicationDocumentsDirectory()`
for persistent data, `getTemporaryDirectory()` for OS-clearable cache:

```dart
Future<File> get _localFile async {
  final Directory dir = await getApplicationDocumentsDirectory();
  return File('${dir.path}/cache.txt');
}
```

With `sqflite`, always bind values through `whereArgs` — never interpolate into
SQL:

```dart
static Future<void> updateRecord(final MyRecord record) async {
  final Database db = await database;
  await db.update(
    'records',
    record.toJson(),
    where: 'id = ?',
    whereArgs: [record.id], // never string-interpolate here
  );
}
```

## UI, scroll & image caching

- **Images:** use `cached_network_image` for remote file-system caching. A
  custom `ImageProvider` overrides `createStream()` / `resolveStreamForKey()`,
  not the deprecated `resolve()`. `ImageCache.maxByteSize` no longer auto-grows
  for large images — raise it or subclass `ImageCache` for custom eviction.
- **Scroll:** configure scrollable caching via `scrollCacheExtent` with a
  `ScrollCacheExtent` object, not the deprecated `cacheExtent` /
  `cacheExtentStyle`.

  ```dart
  ListView(
    scrollCacheExtent: const ScrollCacheExtent.pixels(500.0),
    children: const [/* ... */],
  )
  ```

- **Widgets:** prefer `const` constructors so the framework short-circuits
  rebuilds. Avoid overriding `operator ==` on widgets (it causes O(N²) rebuild
  behaviour) except on leaf widgets whose properties rarely change and are
  cheaper to compare than to rebuild.

## Caching the FlutterEngine (Android)

To skip the `FlutterEngine` warm-up when embedding Flutter in an existing
Android app, pre-warm and cache the engine in the `Application` class, store it
in `FlutterEngineCache`, and retrieve it with `withCachedEngine`:

```kotlin
val flutterEngine = FlutterEngine(this)
flutterEngine.navigationChannel.setInitialRoute("/cached_route")
flutterEngine.dartExecutor.executeDartEntrypoint(DartEntrypoint.createDefault())
FlutterEngineCache.getInstance().put("my_engine_id", flutterEngine)

startActivity(
  FlutterActivity.withCachedEngine("my_engine_id").build(this),
)
```

Set the initial route on the engine's navigation channel **before** executing
the Dart entrypoint — you cannot pass it through the Activity/Fragment builder
when using a cached engine.
