## Pause / Resume / Cancel

```dart
final task = ref.putFile(file);

// Pause
task.pause();

// Resume
task.resume();

// Cancel
task.cancel();

// Check state
final snapshot = await task.snapshot;
print(snapshot.state); // TaskState.paused / running / canceled
```

---
