## List Files

```dart
// List all items in a directory (use for small directories)
final result = await ref.listAll();
for (final item in result.items) {
  print(item.fullPath);
}
for (final prefix in result.prefixes) {
  print(prefix.fullPath); // subdirectories
}

// Paginated listing (use for large directories)
ListResult? page;
do {
  page = await ref.list(ListOptions(
    maxResults: 100,
    pageToken: page?.nextPageToken,
  ));
  for (final item in page.items) {
    print(item.name);
  }
} while (page.nextPageToken != null);
```

---
