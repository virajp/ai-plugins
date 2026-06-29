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
