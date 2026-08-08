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
