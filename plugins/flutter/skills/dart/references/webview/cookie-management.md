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
