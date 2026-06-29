## Metadata

```dart
// Read metadata
final metadata = await ref.getMetadata();
print(metadata.contentType);       // 'image/jpeg'
print(metadata.size);              // file size in bytes
print(metadata.timeCreated);       // DateTime
print(metadata.updated);           // DateTime
print(metadata.customMetadata);    // Map<String, String>

// Update metadata (only writable fields)
await ref.updateMetadata(
  SettableMetadata(
    contentType: 'image/webp',
    customMetadata: {'processed': 'true'},
  ),
);

// Clear a metadata field
await ref.updateMetadata(SettableMetadata(contentType: null));
```

---
