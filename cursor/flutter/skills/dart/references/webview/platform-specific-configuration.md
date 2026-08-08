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
