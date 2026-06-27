---
name: image-handling
version: 0.1.0
category: development
description: Pick and crop images in a Flutter app using image_picker and
  image_cropper — gallery/camera sources, multi-pick, platform permissions,
  cropping, reading bytes, and compression. Use when letting users select
  photos from the gallery or camera, cropping profile pictures, or preparing
  images for upload.
license: MIT
user-invocable: false
---

# Image Handling

Covers: `image_picker`, `image_cropper`

## Contents

- [Setup](#setup)
- [Pick Images](#pick-images)
- [Pick Video](#pick-video)
- [Pick Multiple Images](#pick-multiple-images)
- [Camera Photos](#camera-photos)
- [Image Cropper](#image-cropper)
- [Read Image Bytes](#read-image-bytes)
- [Compress / Resize](#compress--resize)
- [Anti-Patterns](#anti-patterns)
- [Examples](#examples)

---

## Setup

```yaml
dependencies:
  image_picker:
  image_cropper:
```

### Android — `AndroidManifest.xml`

```xml
<!-- Camera -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- For Android 12 and below: read external storage -->
<uses-permission
  android:name="android.permission.READ_EXTERNAL_STORAGE"
  android:maxSdkVersion="32"
/>

<!-- For Android 13+: granular media permissions -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
```

### iOS — `Info.plist`

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to take your profile photo.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need gallery access to let you choose a profile photo.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>We need permission to save photos to your library.</string>
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access when recording video.</string>
```

---

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

## Pick Video

```dart
final XFile? video = await picker.pickVideo(
  source: ImageSource.gallery,
  maxDuration: const Duration(minutes: 10),
);
```

---

## Pick Multiple Images

```dart
final List<XFile> images = await picker.pickMultiImage(
  maxWidth: 1200,
  imageQuality: 85,
  limit: 10,  // iOS 14+ only; no limit on Android
);
```

---

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

## Compress / Resize

`image_picker` already resizes and compresses via `maxWidth`, `maxHeight`,
`imageQuality`. For additional processing after cropping, use these parameters
on the cropper:

```dart
ImageCropper().cropImage(
  sourcePath: path,
  compressFormat: ImageCompressFormat.jpg, // or .png
  compressQuality: 80, // 0-100
  // ...
);
```

For advanced compression (WebP, progressive JPEG), add the
`flutter_image_compress` package.

---

## Anti-Patterns

| Anti-Pattern                                       | Why                                                                                    | Fix                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Not null-checking the returned `XFile`             | Returns `null` on cancel — causes NPE                                                  | Always null-check before using                                           |
| Uploading full-resolution camera photos            | 12 MP photos can be 8+ MB                                                              | Set `maxWidth`, `maxHeight`, `imageQuality`                              |
| Using `File(xfile.path)` on web                    | `dart:io` `File` doesn't work on Flutter web                                           | Use `xfile.readAsBytes()` for cross-platform                             |
| Blocking the UI while cropping                     | Cropper is launched as a new screen; callers await it fine — don't run it in `compute` | Let the cropper UI run normally                                          |
| Creating a new `ImagePicker()` instance everywhere | Wasteful; better to share                                                              | Inject or use a singleton/service                                        |
| Not requesting permissions separately              | On older Android, `pickImage` can silently fail                                        | Use `permission_handler` to request storage/camera permissions if needed |

---

## Examples

### Pick, crop, and upload profile photo

```dart
class ProfileController extends GetxController {
  final photoUrl = ''.obs;
  final isUploading = false.obs;

  Future<void> changePhoto() async {
    final picker = ImagePicker();

    // 1. Pick
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1200,
      maxHeight: 1200,
      imageQuality: 90,
    );
    if (picked == null) return;

    // 2. Crop to square
    final cropped = await ImageCropper().cropImage(
      sourcePath: picked.path,
      aspectRatio: const CropAspectRatio(ratioX: 1, ratioY: 1),
      compressFormat: ImageCompressFormat.jpg,
      compressQuality: 85,
      uiSettings: [
        AndroidUiSettings(
          toolbarTitle: 'Crop Photo',
          toolbarColor: const Color(0xFFcb1518),
          toolbarWidgetColor: Colors.white,
          lockAspectRatio: true,
        ),
        IOSUiSettings(
          aspectRatioLockEnabled: true,
        ),
      ],
    );
    if (cropped == null) return;

    // 3. Upload
    isUploading.value = true;
    try {
      final bytes = await cropped.readAsBytes();
      final uid = FirebaseAuth.instance.currentUser!.uid;
      final url = await StorageService.to.uploadProfilePhoto(uid, bytes);
      photoUrl.value = url;

      // 4. Update Firestore / backend profile
      await UserRepository.to.updatePhotoUrl(uid, url);
    } finally {
      isUploading.value = false;
    }
  }

  Future<void> takePhoto() async {
    final picker = ImagePicker();
    final taken = await picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.front,
      maxWidth: 800,
      imageQuality: 90,
    );
    if (taken == null) return;
    // continue as above...
  }
}
```

### Bottom sheet picker (gallery vs camera)

```dart
Future<XFile?> showImageSourcePicker(BuildContext context) async {
  return showModalBottomSheet<XFile?>(
    context: context,
    builder: (_) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.photo_library),
            title: const Text('Choose from gallery'),
            onTap: () async {
              final file = await ImagePicker().pickImage(
                source: ImageSource.gallery,
                maxWidth: 1200,
                imageQuality: 85,
              );
              if (context.mounted) Navigator.pop(context, file);
            },
          ),
          ListTile(
            leading: const Icon(Icons.camera_alt),
            title: const Text('Take a photo'),
            onTap: () async {
              final file = await ImagePicker().pickImage(
                source: ImageSource.camera,
                maxWidth: 800,
                imageQuality: 90,
              );
              if (context.mounted) Navigator.pop(context, file);
            },
          ),
        ],
      ),
    ),
  );
}
```
