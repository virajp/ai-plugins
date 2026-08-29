# Firebase Storage — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

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

## firebase_storage

Upload, download, and manage files in your Flutter app with Firebase Cloud
Storage — references, file/data uploads, download URLs, transfer progress,
pause/resume/cancel, metadata, listing, deletion, and security rules.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                           | When to read                                              |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Setup                                 | Adding the dependency and initializing Storage            |
| References                       | Creating storage references and navigating bucket paths   |
| Upload Files                   | Uploading a File from disk to a path                      |
| Upload Data                     | Uploading Uint8List bytes or a String                     |
| Download URLs                 | Generating a public download URL for sharing              |
| Download Files               | Downloading files to disk or memory                       |
| Transfer Progress         | Monitoring upload or download progress                    |
| Pause / Resume / Cancel | Pausing, resuming, or canceling a transfer                |
| Metadata                           | Reading or updating file metadata                         |
| List Files                       | Listing files in a directory with pagination              |
| Delete Files                   | Deleting files and handling not-found errors              |
| Security Rules               | Configuring security rules for user-owned files           |
| Anti-Patterns                 | Avoiding common Storage mistakes and performance pitfalls |
| Examples                           | Real-world GetX service and controller examples           |

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

## Setup

```yaml
dependencies:
  firebase_core:
  firebase_storage:
```

---
