## Pick Images

```dart
import 'package:image_picker/image_picker.dart';

final picker = ImagePicker();

// From gallery
final XFile? image = await picker.pickImage(
  source: ImageSource.gallery,
  maxWidth: 1200,       // resize before returning
  maxHeight: 1200,
  imageQuality: 85,     // 0-100 JPEG quality
);

if (image != null) {
  final path = image.path;
  final name = image.name;
}
```

`pickImage` returns `null` if the user cancels. Always null-check.

---
