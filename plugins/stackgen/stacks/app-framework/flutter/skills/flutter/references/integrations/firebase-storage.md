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

Sections in this file:

| Section                                            | When to read                                              |
| -------------------------------------------------- | --------------------------------------------------------- |
| [Anti-Patterns](#anti-patterns)                    | Avoiding common Storage mistakes and performance pitfalls |
| [Security Rules](#security-rules)                  | Configuring security rules for user-owned files           |
| [Setup](#setup)                                    | Adding the dependency and initializing Storage            |
| [The transfer is an object](#the-transfer-is-an-object) | Progress, pause/resume/cancel, and the task state machine |
| [Metadata](#metadata)                              | What is readable, what is writable, and when it is set    |

Creating references, uploading a `File` or bytes, generating download URLs,
downloading, listing and deleting are API surface — fetch them from Context7 at
use time.

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

## The transfer is an object

An upload or download is **not** a `Future` that you await and forget. It is a
long-lived task with a state machine, and treating it as a one-shot call is
what produces uploads with no progress bar, no cancel button, and no recovery
when the app is backgrounded mid-transfer.

```dart
final task = ref.putFile(file);
```

That `task` is controllable and observable for its whole life:

```dart
task.pause();
task.resume();
task.cancel();
```

Progress arrives on a stream, not from polling. Compute the fraction from the
snapshot's two byte counts, and switch on `state` rather than inferring
completion from progress reaching 1.0 — a canceled or errored transfer can stop
anywhere:

```dart
task.snapshotEvents.listen((final TaskSnapshot snapshot) {
  final progress = snapshot.bytesTransferred / snapshot.totalBytes;

  switch (snapshot.state) {
    case TaskState.running:  // in progress
    case TaskState.paused:   // paused by the user
    case TaskState.success:  // complete
    case TaskState.canceled: // canceled by the user
    case TaskState.error:    // failed
  }
});
```

Awaiting the task is still how you get the terminal result, and the download URL
comes from the completed snapshot's reference — not from the reference you
started with:

```dart
final snapshot = await task;
final downloadUrl = await snapshot.ref.getDownloadURL();
```

**A canceled transfer leaves nothing behind**, so a UI that offers cancel must
also offer retry; there is no resume across a process restart, only across a
pause within one.

---

## Metadata

Metadata is set at upload time and is **partially immutable afterwards** — size,
creation and update times are Storage's, and only `contentType` and
`customMetadata` are yours to change.

```dart
final metadata = await ref.getMetadata();
metadata.contentType;    // 'image/jpeg'
metadata.size;           // bytes — read-only
metadata.timeCreated;    // DateTime — read-only
metadata.updated;        // DateTime — read-only
metadata.customMetadata; // Map<String, String>

await ref.updateMetadata(
  SettableMetadata(
    contentType: 'image/webp',
    customMetadata: {'processed': 'true'},
  ),
);
```

Passing `null` for a field clears it. **Set `contentType` on upload rather than
patching it after** — an object served with the wrong type will be mis-rendered
by every consumer that read it before the patch, and CDN caches will hold the
wrong header.

---
