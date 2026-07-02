# HTTP & JSON

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
**standards**). For many or deeply nested models, use `json_serializable`
codegen — see the **json-serializable** reference.

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

See the **concurrency** reference for when to move work off the main isolate.
