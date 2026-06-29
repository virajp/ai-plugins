## Download Files

```dart
// Download to a local file
final directory = await getTemporaryDirectory();
final file = File('${directory.path}/profile.jpg');
await ref.writeToFile(file);

// Download into memory (small files only — Uint8List)
final bytes = await ref.getData(maxSize: 5 * 1024 * 1024); // 5 MB limit
```

---
