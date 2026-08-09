## Transfer Progress

```dart
// Upload with progress monitoring
final task = ref.putFile(file);

task.snapshotEvents.listen((TaskSnapshot snapshot) {
  final progress = snapshot.bytesTransferred / snapshot.totalBytes;
  print('Upload: ${(progress * 100).toStringAsFixed(1)}%');

  switch (snapshot.state) {
    case TaskState.running:  // in progress
    case TaskState.paused:   // paused by user
    case TaskState.success:  // complete
    case TaskState.canceled: // canceled by user
    case TaskState.error:    // failed
  }
});

// Wait for completion
final snapshot = await task;
final downloadUrl = await snapshot.ref.getDownloadURL();
```

---
