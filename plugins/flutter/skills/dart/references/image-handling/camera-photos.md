## Camera Photos

```dart
final XFile? photo = await picker.pickImage(
  source: ImageSource.camera,
  preferredCameraDevice: CameraDevice.front, // or .rear
  maxWidth: 800,
  imageQuality: 90,
);
```

---
