## Setup

Add dependencies to `pubspec.yaml`:

```yaml
dependencies:
  webview_flutter:
  # Only needed when accessing platform-specific APIs directly:
  webview_flutter_android: # Android extras
  webview_flutter_wkwebview: # iOS/macOS extras
```

No `AndroidManifest.xml` or `Info.plist` changes are required for basic usage.
Internet permission is already declared by the plugin on Android.

---
