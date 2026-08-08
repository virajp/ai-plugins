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
