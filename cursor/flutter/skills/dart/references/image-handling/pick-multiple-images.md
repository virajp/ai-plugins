## Pick Multiple Images

```dart
final List<XFile> images = await picker.pickMultiImage(
  maxWidth: 1200,
  imageQuality: 85,
  limit: 10,  // iOS 14+ only; no limit on Android
);
```

---
