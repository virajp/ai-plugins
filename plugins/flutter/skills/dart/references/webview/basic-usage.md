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
