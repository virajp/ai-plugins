## Upload Data

```dart
// Upload from Uint8List (e.g., from image_picker or image_cropper)
Future<String> uploadBytes(Uint8List bytes, String path) async {
  final ref = FirebaseStorage.instance.ref(path);
  final task = await ref.putData(
    bytes,
    SettableMetadata(contentType: 'image/jpeg'),
  );
  return task.ref.getDownloadURL();
}

// Upload a string (base64 or raw)
await ref.putString(
  base64EncodedString,
  format: PutStringFormat.base64,
  metadata: SettableMetadata(contentType: 'image/png'),
);
```

---
