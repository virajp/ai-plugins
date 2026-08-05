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
