# WebView — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

## webview_flutter

Embedding and controlling web content in a Flutter app — the controller/widget
split, loading content, Dart↔JS channels, the navigation delegate, cookies,
scroll control and per-platform configuration.

Supported platforms: **Android** (API 24+), **iOS** (13.0+), **macOS** (10.15+).

Sections in this file:

| Section                                                             | When to read                                              |
| ------------------------------------------------------------------- | --------------------------------------------------------- |
| [Platform-Specific Configuration](#platform-specific-configuration) | Android/iOS controller tweaks: debugging, media, gestures |
| [Setup](#setup)                                                     | Which of the three packages you actually need             |

The controller and widget API — loading URLs, POST bodies, HTML, assets and
files; running JavaScript and registering Dart↔JS channels; the navigation
delegate; cookies; scroll control — is API surface. Fetch it from Context7 at
use time, and note that v3→v4 deprecated a large part of it, so pin the version
before trusting an answer.

Two facts do not come from an SDK lookup. **The controller and the widget always
travel together** — a `WebViewWidget` renders a `WebViewController`, and neither
is useful alone. And **cookies must be pre-loaded before `loadRequest`**, or the
first request goes out without them.

## Platform-Specific Configuration

### Android

```dart
import 'package:webview_flutter_android/webview_flutter_android.dart';

// In initState, after creating WebViewController:
if (controller.platform is AndroidWebViewController) {
  final android = controller.platform as AndroidWebViewController;
  await AndroidWebViewController.enableDebugging(true);  // static
  await android.setMediaPlaybackRequiresUserGesture(false);
  await android.setTextZoom(100);
}
```

**Hybrid Composition** (use when Texture Layer has rendering issues):

```dart
WebViewWidget(
  controller: controller,
  // No direct API — configure via AndroidWebViewWidgetCreationParams
  // on WebViewWidget.fromPlatformCreationParams
)
```

### iOS / macOS

```dart
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';

late final WebViewController _controller;

@override
void initState() {
  super.initState();

  // Pass WebKit-specific creation params
  final PlatformWebViewControllerCreationParams params;
  if (WebViewPlatform.instance is WebKitWebViewPlatform) {
    params = WebKitWebViewControllerCreationParams(
      allowsInlineMediaPlayback: true,
      mediaTypesRequiringUserAction: const <PlaybackMediaTypes>{},
    );
  } else {
    params = const PlatformWebViewControllerCreationParams();
  }

  _controller = WebViewController.fromPlatformCreationParams(params)
    ..setJavaScriptMode(JavaScriptMode.unrestricted);

  if (_controller.platform is WebKitWebViewController) {
    final webkit = _controller.platform as WebKitWebViewController;
    await webkit.setAllowsBackForwardNavigationGestures(true);
    await webkit.setInspectable(true); // enable Safari Web Inspector
  }
}
```

---

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
