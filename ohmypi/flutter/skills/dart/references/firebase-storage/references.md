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
