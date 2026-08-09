## Examples

### Upload profile photo (GetX service)

```dart
class StorageService extends GetxService {
  static StorageService get to => Get.find();
  final _storage = FirebaseStorage.instance;

  Future<String> uploadProfilePhoto(String userId, Uint8List bytes) async {
    final ref = _storage.ref('users/$userId/profile.jpg');
    final task = ref.putData(
      bytes,
      SettableMetadata(contentType: 'image/jpeg'),
    );

    final snapshot = await task;
    return snapshot.ref.getDownloadURL();
  }

  Future<void> deleteProfilePhoto(String userId) async {
    try {
      await _storage.ref('users/$userId/profile.jpg').delete();
    } on FirebaseException catch (e) {
      if (e.code != 'object-not-found') rethrow;
    }
  }
}
```

### Upload with observable progress (GetX)

```dart
class UploadController extends GetxController {
  final progress = 0.0.obs;
  final isUploading = false.obs;
  UploadTask? _task;

  Future<String?> upload(File file, String path) async {
    isUploading.value = true;
    progress.value = 0;

    final ref = FirebaseStorage.instance.ref(path);
    _task = ref.putFile(file);

    _task!.snapshotEvents.listen((snapshot) {
      progress.value = snapshot.bytesTransferred / snapshot.totalBytes;
    });

    try {
      final snapshot = await _task!;
      return await snapshot.ref.getDownloadURL();
    } on FirebaseException catch (e) {
      if (e.code == 'canceled') return null;
      rethrow;
    } finally {
      isUploading.value = false;
      _task = null;
    }
  }

  void cancelUpload() => _task?.cancel();
}
```

### Combining with image_picker

```dart
Future<String?> pickAndUploadPhoto(String userId) async {
  final picker = ImagePicker();
  final picked = await picker.pickImage(
    source: ImageSource.gallery,
    maxWidth: 800,
    maxHeight: 800,
    imageQuality: 85,
  );
  if (picked == null) return null;

  final bytes = await picked.readAsBytes();
  return StorageService.to.uploadProfilePhoto(userId, bytes);
}
```
