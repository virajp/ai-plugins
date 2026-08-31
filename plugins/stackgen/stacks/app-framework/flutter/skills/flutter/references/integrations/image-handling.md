# Image handling — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

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

## Image Handling

Pick and crop images in a Flutter app using image_picker and image_cropper —
gallery/camera sources, multi-pick, platform permissions, cropping, reading
bytes, and compression.

Covers: `image_picker`, `image_cropper`

Sections in this file:

| Section                         | When to read                                            |
| ------------------------------- | ------------------------------------------------------- |
| [Anti-Patterns](#anti-patterns) | Avoiding common image-picking mistakes                  |
| [Setup](#setup)                 | Adding packages and platform camera/gallery permissions |

Picking (single, multiple, video, camera), cropping, reading bytes and
compressing are API surface. Fetch them from Context7 at use time; the platform
permission declarations below are what a per-package lookup will not give you.

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
