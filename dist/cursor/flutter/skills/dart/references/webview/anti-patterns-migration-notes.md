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
