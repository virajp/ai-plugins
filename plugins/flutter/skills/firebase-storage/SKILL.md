---
name: firebase-storage
version: 0.1.0
category: development
description: Upload, download, and manage files in your Flutter app with
  Firebase Cloud Storage — references, file/data uploads, download URLs,
  transfer progress, pause/resume/cancel, metadata, listing, deletion, and
  security rules. Use when uploading images or files, monitoring transfer
  progress, generating download URLs, or organizing files by user/content.
license: MIT
user-invocable: false
---

# firebase_storage

## Contents

- [Setup](#setup)
- [References](#references)
- [Upload Files](#upload-files)
- [Upload Data](#upload-data)
- [Download URLs](#download-urls)
- [Download Files](#download-files)
- [Transfer Progress](#transfer-progress)
- [Pause / Resume / Cancel](#pause--resume--cancel)
- [Metadata](#metadata)
- [List Files](#list-files)
- [Delete Files](#delete-files)
- [Security Rules](#security-rules)
- [Anti-Patterns](#anti-patterns)
- [Examples](#examples)

---

## Setup

```yaml
dependencies:
  firebase_core:
  firebase_storage:
```

---

## References

A `Reference` points to a location in the storage bucket. It does not imply the
file exists.

```dart
final storage = FirebaseStorage.instance;

// Root reference
final root = storage.ref();

// File reference
final fileRef = storage.ref('users/uid123/profile.jpg');

// Using path segments
final fileRef = storage.ref().child('users').child('uid123').child('profile.jpg');

// From a gs:// URL
final fileRef = storage.refFromURL('gs://my-bucket.appspot.com/users/uid123/profile.jpg');

// From an https:// download URL
final fileRef = storage.refFromURL('https://firebasestorage.googleapis.com/...');

// Navigate
final parent = fileRef.parent;       // users/uid123
final root2 = fileRef.root;          // root reference
final name = fileRef.name;           // 'profile.jpg'
final fullPath = fileRef.fullPath;   // 'users/uid123/profile.jpg'
final bucket = fileRef.bucket;       // 'my-bucket.appspot.com'
```

---

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

## Download URLs

A download URL is a public HTTPS URL valid until revoked. Share it with backend
or display directly.

```dart
final url = await ref.getDownloadURL();
// Returns: 'https://firebasestorage.googleapis.com/v0/b/...'
```

---

## Download Files

```dart
// Download to a local file
final directory = await getTemporaryDirectory();
final file = File('${directory.path}/profile.jpg');
await ref.writeToFile(file);

// Download into memory (small files only — Uint8List)
final bytes = await ref.getData(maxSize: 5 * 1024 * 1024); // 5 MB limit
```

---

## Transfer Progress

```dart
// Upload with progress monitoring
final task = ref.putFile(file);

task.snapshotEvents.listen((TaskSnapshot snapshot) {
  final progress = snapshot.bytesTransferred / snapshot.totalBytes;
  print('Upload: ${(progress * 100).toStringAsFixed(1)}%');

  switch (snapshot.state) {
    case TaskState.running:  // in progress
    case TaskState.paused:   // paused by user
    case TaskState.success:  // complete
    case TaskState.canceled: // canceled by user
    case TaskState.error:    // failed
  }
});

// Wait for completion
final snapshot = await task;
final downloadUrl = await snapshot.ref.getDownloadURL();
```

---

## Pause / Resume / Cancel

```dart
final task = ref.putFile(file);

// Pause
task.pause();

// Resume
task.resume();

// Cancel
task.cancel();

// Check state
final snapshot = await task.snapshot;
print(snapshot.state); // TaskState.paused / running / canceled
```

---

## Metadata

```dart
// Read metadata
final metadata = await ref.getMetadata();
print(metadata.contentType);       // 'image/jpeg'
print(metadata.size);              // file size in bytes
print(metadata.timeCreated);       // DateTime
print(metadata.updated);           // DateTime
print(metadata.customMetadata);    // Map<String, String>

// Update metadata (only writable fields)
await ref.updateMetadata(
  SettableMetadata(
    contentType: 'image/webp',
    customMetadata: {'processed': 'true'},
  ),
);

// Clear a metadata field
await ref.updateMetadata(SettableMetadata(contentType: null));
```

---

## List Files

```dart
// List all items in a directory (use for small directories)
final result = await ref.listAll();
for (final item in result.items) {
  print(item.fullPath);
}
for (final prefix in result.prefixes) {
  print(prefix.fullPath); // subdirectories
}

// Paginated listing (use for large directories)
ListResult? page;
do {
  page = await ref.list(ListOptions(
    maxResults: 100,
    pageToken: page?.nextPageToken,
  ));
  for (final item in page.items) {
    print(item.name);
  }
} while (page.nextPageToken != null);
```

---

## Delete Files

```dart
try {
  await ref.delete();
} on FirebaseException catch (e) {
  if (e.code == 'object-not-found') {
    // File already deleted — handle gracefully
  }
}
```

---

## Security Rules

Typical rules for user-owned files:

```text
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only read/write their own files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Public read, authenticated write
    match /public/{allPaths=**} {
      allow read;
      allow write: if request.auth != null;
    }

    // Limit file size and type for profile photos
    match /users/{userId}/profile.jpg {
      allow write: if request.auth.uid == userId
          && request.resource.size < 5 * 1024 * 1024
          && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## Anti-Patterns

| Anti-Pattern                                   | Why                                        | Fix                                                                          |
| ---------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| Putting user files at a flat root path         | No access control per user                 | Organize under `users/{uid}/...`                                             |
| Not specifying `contentType` metadata          | Browser/client may misinterpret the file   | Always set `contentType` on upload                                           |
| Calling `getDownloadURL` on every read         | Extra network round-trip                   | Cache the URL after first fetch                                              |
| Using `getData()` for large files              | Loads entire file into memory              | Use `writeToFile()` for files > a few MB                                     |
| Not handling `object-not-found` on delete      | Throws if file was already removed         | Catch and ignore `object-not-found`                                          |
| Listing without pagination on large dirs       | `listAll()` fetches everything into memory | Use `list()` with `maxResults` and `pageToken`                               |
| Storing download URLs in Firestore without TTL | URLs can be revoked                        | Store the `fullPath` and fetch URL on demand, or regenerate after revocation |

---

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
