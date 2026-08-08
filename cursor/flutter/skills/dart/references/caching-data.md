# Caching & Offline-First

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
