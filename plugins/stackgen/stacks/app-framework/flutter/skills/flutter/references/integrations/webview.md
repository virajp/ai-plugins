# WebView — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

## webview_flutter

Embedding and controlling web content in a Flutter app with webview_flutter —
the controller/widget split, loading URLs/HTML/assets/files, running JavaScript
and Dart↔JS channels, the navigation delegate, cookie management, scroll
control, and Android/iOS platform-specific configuration.

Supported platforms: **Android** (API 24+), **iOS** (13.0+), **macOS** (10.15+).

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                                      | When to read                                                              |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Setup                                                     | Add dependencies to pubspec.yaml                                          |
| Basic Usage                                         | The package has two components that always work together                  |
| Loading Content                                 | Loading URLs, POST bodies, HTML strings, assets, files                    |
| JavaScript                                           | Running JS, return values, Dart↔JS channels, console/dialogs              |
| Navigation Delegate                         | Progress, page events, blocking navigation, errors, back/forward          |
| Cookie Management                             | Pre-load cookies before calling loadRequest, otherwise they won't be sent |
| Scroll Control                                   | Programmatic scroll, position tracking, hiding scrollbars                 |
| Platform-Specific Configuration | Android/iOS controller tweaks: debugging, media, gestures                 |
| Anti-Patterns & Migration Notes   | v3→v4 deprecated API and common mistakes                                  |
| Examples                                               | Loading bar, nav bar, JS callbacks, cookie session, transparent bg        |

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
