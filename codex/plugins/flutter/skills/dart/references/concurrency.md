# Concurrency & Isolates

Dart runs single-threaded per isolate on an event loop; blocking the main
isolate janks the UI. Keep I/O-bound work on `async`/`await`, and offload
CPU-bound work to a worker isolate.

## Core concepts

- **`async`/`await`** — for non-blocking I/O (network, file access). The event
  loop keeps running while the `Future` is pending. Always `await`; never
  `.then()`.
- **Isolates** — Dart's lightweight threads. They share no memory and
  communicate only by message passing.
- **Main isolate** — where UI rendering and event handling run. Blocking it
  freezes the UI.
- **Worker isolate** — a spawned isolate for CPU-bound work (decoding a large
  JSON blob, image/crypto) that would otherwise jank the frame.

## Choosing an approach

| Task                                                      | Use                                 |
| --------------------------------------------------------- | ----------------------------------- |
| I/O-bound (HTTP, database read)                           | `async`/`await` on the main isolate |
| CPU-bound but quick (< 16ms)                              | `async`/`await` on the main isolate |
| CPU-bound, significant, runs once (parse a huge payload)  | `Isolate.run()` / `compute()`       |
| Continuous background processing, many messages over time | `Isolate.spawn()` with ports        |

Isolate callbacks must be top-level or static functions passing only sendable
values.

## Asynchronous UI

Hold the in-flight state in a controller and drive the UI reactively rather than
rebuilding from a bare `Future`:

```dart
class RideController extends GetxController {
  final Rxn<MyRide> ride = Rxn<MyRide>();
  final RxBool isLoading = false.obs;

  Future<void> load(final String id) async {
    isLoading.value = true;
    ride.value = await RideRepo.fetch(id);
    isLoading.value = false;
  }
}

// In the view
Obx(() {
  if (controller.isLoading.value) return const CircularProgressIndicator();
  final MyRide? ride = controller.ride.value;
  return ride == null ? MyText(L10n.of(context).noRide) : MyText(ride.title);
})
```

## Short-lived heavy computation

Extract the CPU-bound work into a standalone function taking one argument, then
`Isolate.run()` it and `await` the result. `compute()` is the Flutter-flavoured
wrapper (see the **http-and-json** reference for the large-payload case).

```dart
List<dynamic> _decodeHeavyJson(final String jsonString) =>
    jsonDecode(jsonString) as List<dynamic>;

Future<List<dynamic>> processInBackground(final String rawJson) async {
  // Isolate.run spawns the isolate, runs the callback, returns the value, exits.
  return Isolate.run(() => _decodeHeavyJson(rawJson));
}
```

## Long-lived worker isolates

For a persistent worker with continuous two-way traffic, do the port handshake:
the main isolate spawns the worker passing its `SendPort`; the worker replies
with its own `SendPort`; both sides then message freely. Close the ports and
kill the isolate when done to avoid leaks.

```dart
class WorkerManager {
  final ReceivePort _mainReceivePort = ReceivePort();
  late final SendPort _workerSendPort;
  Isolate? _isolate;

  Future<void> initialize() async {
    _isolate = await Isolate.spawn(_workerEntry, _mainReceivePort.sendPort);
    _mainReceivePort.listen((final dynamic message) {
      if (message is SendPort) {
        _workerSendPort = message;
        _workerSendPort.send('Process this data');
      } else {
        Logger.debug('Main isolate received: $message');
      }
    });
  }

  static void _workerEntry(final SendPort mainSendPort) {
    final ReceivePort workerReceivePort = ReceivePort();
    mainSendPort.send(workerReceivePort.sendPort);
    workerReceivePort.listen((final dynamic message) {
      mainSendPort.send('Processed: $message');
    });
  }

  void dispose() {
    _mainReceivePort.close();
    _isolate?.kill();
  }
}
```
