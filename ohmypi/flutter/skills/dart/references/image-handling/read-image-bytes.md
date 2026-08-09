## Read Image Bytes

```dart
// XFile → Uint8List (for uploading to Firebase Storage, etc.)
final bytes = await image.readAsBytes();

// XFile → File (for local operations)
import 'dart:io';
final file = File(image.path);

// CroppedFile → Uint8List
final croppedBytes = await croppedFile.readAsBytes();

// CroppedFile → File
final croppedDartFile = File(croppedFile.path);
```

---
