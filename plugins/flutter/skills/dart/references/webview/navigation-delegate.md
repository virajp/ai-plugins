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
