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
