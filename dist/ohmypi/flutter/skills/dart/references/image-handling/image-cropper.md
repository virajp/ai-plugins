## Image Cropper

```dart
import 'package:image_cropper/image_cropper.dart';

Future<CroppedFile?> cropImage(String sourcePath) async {
  return ImageCropper().cropImage(
    sourcePath: sourcePath,
    uiSettings: [
      AndroidUiSettings(
        toolbarTitle: 'Crop Photo',
        toolbarColor: const Color(0xFFcb1518),
        toolbarWidgetColor: Colors.white,
        activeControlsWidgetColor: const Color(0xFFcb1518),
        initAspectRatio: CropAspectRatioPreset.square,
        lockAspectRatio: true,
        hideBottomControls: false,
      ),
      IOSUiSettings(
        title: 'Crop Photo',
        aspectRatioLockEnabled: true,
        resetAspectRatioEnabled: false,
        aspectRatioPickerButtonHidden: true,
      ),
    ],
    aspectRatio: const CropAspectRatio(ratioX: 1, ratioY: 1),
    compressFormat: ImageCompressFormat.jpg,
    compressQuality: 85,
  );
}
```

### Aspect ratio presets

```dart
aspectRatioPresets: [
  CropAspectRatioPreset.square,
  CropAspectRatioPreset.ratio3x2,
  CropAspectRatioPreset.ratio4x3,
  CropAspectRatioPreset.ratio16x9,
],
```

`CroppedFile` returns `null` if the user cancels.

---
