## Upload Files

```dart
import 'dart:io';

Future<String> uploadFile(File file, String path) async {
  final ref = FirebaseStorage.instance.ref(path);
  final task = await ref.putFile(file);
  return task.ref.getDownloadURL();
}

// With metadata
final metadata = SettableMetadata(
  contentType: 'image/jpeg',
  customMetadata: {'uploadedBy': userId, 'originalName': fileName},
);

await ref.putFile(file, metadata);
```

---
