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
