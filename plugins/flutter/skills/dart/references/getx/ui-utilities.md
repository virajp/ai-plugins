## UI Utilities

All UI helpers work without `BuildContext`.

### Snackbar

```dart
Get.snackbar(
  'Title',
  'Message',
  snackPosition: SnackPosition.BOTTOM,
  duration: const Duration(seconds: 3),
  backgroundColor: Colors.black87,
  colorText: Colors.white,
  icon: const Icon(Icons.info),
);
```

### Dialog

```dart
// Custom widget dialog
Get.dialog(MyDialogWidget());

// Built-in confirm dialog
Get.defaultDialog(
  title: 'Delete Ride?',
  middleText: 'This action cannot be undone.',
  onConfirm: () { controller.delete(); Get.back(); },
  onCancel: () {},
);
```

### Bottom Sheet

```dart
Get.bottomSheet(
  Container(
    padding: const EdgeInsets.all(16),
    child: Column(children: [...]),
  ),
  isDismissible: true,
  backgroundColor: Colors.white,
);
```

---
