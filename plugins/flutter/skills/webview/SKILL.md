---
name: webview
version: 0.1.0
category: development
description: Embedding and controlling web content in a Flutter app with
  webview_flutter — the controller/widget split, loading URLs/HTML/assets/files,
  running JavaScript and Dart↔JS channels, the navigation delegate, cookie
  management, scroll control, and Android/iOS platform-specific configuration.
  Use when loading URLs, HTML strings, local files, running JavaScript, handling
  navigation, managing cookies, or bridging Dart and web content.
license: MIT
user-invocable: false
---

# webview_flutter

Supported platforms: **Android** (API 24+), **iOS** (13.0+), **macOS** (10.15+).

## Contents

- [Setup](#setup)
- [Basic Usage](#basic-usage)
- [Loading Content](#loading-content)
- [JavaScript](#javascript)
- [Navigation Delegate](#navigation-delegate)
- [Cookie Management](#cookie-management)
- [Scroll Control](#scroll-control)
- [Platform-Specific Configuration](#platform-specific-configuration)
- [Anti-Patterns & Migration Notes](#anti-patterns--migration-notes)
- [Examples](#examples)

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

## Basic Usage

The package has two components that always work together:

- **`WebViewController`** — owns all platform logic (loading, JS, settings).
- **`WebViewWidget`** — renders the native view inside the Flutter widget tree.

```dart
class MyWebView extends StatefulWidget {
  const MyWebView({super.key});
  @override
  State<MyWebView> createState() => _MyWebViewState();
}

class _MyWebViewState extends State<MyWebView> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (url) => debugPrint('Loaded: $url'),
        onWebResourceError: (error) => debugPrint('Error: ${error.description}'),
      ))
      ..loadRequest(Uri.parse('https://flutter.dev'));
  }

  @override
  Widget build(BuildContext context) {
    return WebViewWidget(controller: _controller);
  }
}
```

**Rules:**

- Always create `WebViewController` in `initState` (or equivalent), never inside
  `build`.
- JavaScript is **disabled** by default — set `JavaScriptMode.unrestricted`
  explicitly when needed.
- `WebViewWidget` is a `StatelessWidget`; all mutable state lives in the
  controller.

---

## Loading Content

```dart
// Remote URL (GET)
controller.loadRequest(Uri.parse('https://example.com'));

// Remote URL with custom headers or POST body
controller.loadRequest(
  LoadRequestParams(
    uri: Uri.parse('https://api.example.com/data'),
    method: LoadRequestMethod.post,
    headers: const {'Content-Type': 'application/json'},
    body: Uint8List.fromList(utf8.encode('{"key":"value"}')),
  ),
);

// HTML string
controller.loadHtmlString('<h1>Hello</h1>', baseUrl: 'https://example.com');

// Flutter asset (add to pubspec.yaml assets section)
controller.loadFlutterAsset('assets/index.html');

// Local file (absolute path)
controller.loadFile('/data/user/0/com.example/files/page.html');
```

> **Android caveat:** Custom headers on POST requests are not supported.
> Workaround: execute the request manually in Dart, then load the response
> string via `loadHtmlString`.

---

## JavaScript

### Execute without return value

```dart
await controller.runJavaScript('document.body.style.backgroundColor = "red"');
```

### Execute and get result

```dart
final result = await controller.runJavaScriptReturningResult('window.title');
// result is Object? — cast appropriately
final title = result as String;
```

### Dart ↔ JavaScript channel (bidirectional)

**Register channel (Dart side):**

```dart
controller.addJavaScriptChannel(
  JavaScriptChannelParams(
    name: 'NativeBridge',
    onMessageReceived: (JavaScriptMessage message) {
      debugPrint('JS said: ${message.message}');
    },
  ),
);
```

**Send message from JavaScript:**

```javascript
NativeBridge.postMessage("Hello from JS");
```

**Send message to JavaScript from Dart:**

```dart
await controller.runJavaScript('receiveFromDart("Hello from Dart")');
```

- Channel names must be valid JavaScript identifiers.
- Add channels before loading content so the page can use them on load.
- Remove unused channels with
  `controller.removeJavaScriptChannel('NativeBridge')`.

### Monitor console output

```dart
controller.setOnConsoleMessage((JavaScriptConsoleMessage msg) {
  debugPrint('[JS ${msg.level.name}] ${msg.message}');
});
```

### Custom JavaScript dialogs

```dart
controller
  ..setOnJavaScriptAlertDialog((request) async {
    await showDialog(context: context, builder: (_) => AlertDialog(content: Text(request.message)));
  })
  ..setOnJavaScriptConfirmDialog((request) async {
    final confirmed = await showDialog<bool>(...);
    return confirmed ?? false;
  });
```

---

## Navigation Delegate

```dart
controller.setNavigationDelegate(NavigationDelegate(
  onProgress: (int progress) {
    // 0–100; update a LinearProgressIndicator
  },
  onPageStarted: (String url) {},
  onPageFinished: (String url) {},

  onNavigationRequest: (NavigationRequest request) {
    // Block external navigation
    if (request.url.startsWith('https://www.youtube.com/')) {
      return NavigationDecision.prevent;
    }
    return NavigationDecision.navigate;
  },

  onWebResourceError: (WebResourceError error) {
    // Filter to main-frame errors only
    if (error.isForMainFrame ?? true) {
      showErrorScreen(error.description);
    }
  },

  onHttpError: (HttpResponseError error) {
    debugPrint('HTTP ${error.response?.statusCode} on ${error.request?.uri}');
  },

  onUrlChange: (UrlChange change) {
    // SPA navigation, hash changes
    debugPrint('URL changed to ${change.url}');
  },

  onHttpAuthRequest: (HttpAuthRequest request) {
    request.onProceed(WebViewCredential(user: 'user', password: 'pass'));
  },

  onSslAuthError: (SslAuthError error) async {
    // Always cancel in production; only call proceed() in controlled test environments
    await error.cancel();
  },
));
```

**Rules:**

- `onWebResourceError` fires for all frames. Check `error.isForMainFrame` before
  showing UI errors.
- `onSslAuthError` — call `cancel()` by default. Only `proceed()` in controlled
  testing environments.
- `onNavigationRequest` must return a `NavigationDecision` synchronously (it is
  not async).

### Navigation controls

```dart
if (await controller.canGoBack()) controller.goBack();
if (await controller.canGoForward()) controller.goForward();
controller.reload();
final url = await controller.getCurrentUrl();
final title = await controller.getTitle();
```

---

## Cookie Management

Pre-load cookies **before** calling `loadRequest`, otherwise they won't be sent
with the initial request.

```dart
final cookieManager = WebViewCookieManager();

// Set a cookie
await cookieManager.setCookie(const WebViewCookie(
  name: 'session',
  value: 'abc123',
  domain: 'example.com',
  path: '/',
));

// Then load
controller.loadRequest(Uri.parse('https://example.com'));

// Clear all cookies (returns true if cookies existed)
final hadCookies = await cookieManager.clearCookies();
```

---

## Scroll Control

```dart
// Scroll to absolute position
await controller.scrollTo(0, 200);

// Scroll relative to current position
await controller.scrollBy(0, 100);

// Get current position
final Offset pos = await controller.getScrollPosition();

// Hide scrollbars
if (await controller.supportsSetScrollBarsEnabled() ?? false) {
  await controller.setVerticalScrollBarEnabled(false);
  await controller.setHorizontalScrollBarEnabled(false);
}

// Track scroll changes reactively
controller.setOnScrollPositionChange((ScrollPositionChange change) {
  debugPrint('Scroll: x=${change.x}, y=${change.y}');
});
```

---

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

## Anti-Patterns & Migration Notes

### Deprecated API (v3 → v4)

| Old                               | New                                                              |
| --------------------------------- | ---------------------------------------------------------------- |
| `loadUrl(url)`                    | `loadRequest(Uri.parse(url))`                                    |
| `evaluateJavascript(script)`      | `runJavaScript(script)` / `runJavaScriptReturningResult(script)` |
| `getScrollX()` / `getScrollY()`   | `getScrollPosition()` returns `Offset`                           |
| `CookieManager`                   | `WebViewCookieManager`                                           |
| Navigation callbacks on `WebView` | `NavigationDelegate` passed to controller                        |

### Common Mistakes

| Mistake                                               | Fix                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| Creating `WebViewController` inside `build()`         | Create in `initState` and store as a field                                |
| Not setting `JavaScriptMode.unrestricted`             | Set explicitly — JS is disabled by default                                |
| Setting cookies after `loadRequest`                   | Always `setCookie` before `loadRequest`                                   |
| Showing error UI for all `onWebResourceError`         | Check `error.isForMainFrame` first                                        |
| Calling `error.proceed()` on SSL errors in production | Always `error.cancel()` unless testing                                    |
| `runJavaScriptReturningResult` and assuming String    | Returns `Object?` — cast explicitly                                       |
| POST with custom headers on Android                   | Not supported — execute request in Dart, load result via `loadHtmlString` |
| `clearCache()` to also clear local storage            | Call `clearLocalStorage()` separately — they are independent              |

---

## Examples

### Loading indicator

```dart
final progress = 0.obs; // or ValueNotifier<int>

NavigationDelegate(
  onProgress: (p) => progress.value = p,
  onPageFinished: (_) => progress.value = 100,
)

// In build:
Obx(() => progress.value < 100
  ? LinearProgressIndicator(value: progress.value / 100)
  : const SizedBox.shrink())
```

### Navigation bar

```dart
Row(children: [
  IconButton(
    icon: const Icon(Icons.arrow_back),
    onPressed: () async {
      if (await controller.canGoBack()) controller.goBack();
    },
  ),
  IconButton(
    icon: const Icon(Icons.arrow_forward),
    onPressed: () async {
      if (await controller.canGoForward()) controller.goForward();
    },
  ),
  IconButton(
    icon: const Icon(Icons.refresh),
    onPressed: () => controller.reload(),
  ),
])
```

### Web-to-native callback

```dart
// Dart
controller.addJavaScriptChannel(
  JavaScriptChannelParams(
    name: 'Share',
    onMessageReceived: (msg) => Share.share(msg.message),
  ),
);

// JavaScript
document.getElementById('shareBtn').addEventListener('click', () => {
  Share.postMessage(document.title);
});
```

### Pre-authenticated session

```dart
Future<void> loadWithSession(String token) async {
  final manager = WebViewCookieManager();
  await manager.setCookie(WebViewCookie(
    name: 'auth_token',
    value: token,
    domain: 'app.example.com',
  ));
  controller.loadRequest(Uri.parse('https://app.example.com/dashboard'));
}
```

### Transparent background WebView

```dart
controller.setBackgroundColor(Colors.transparent);

// Wrap in a coloured container
ColoredBox(
  color: Theme.of(context).scaffoldBackgroundColor,
  child: WebViewWidget(controller: controller),
)
```
