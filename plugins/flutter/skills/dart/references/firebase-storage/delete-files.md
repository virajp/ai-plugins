## Delete Files

```dart
try {
  await ref.delete();
} on FirebaseException catch (e) {
  if (e.code == 'object-not-found') {
    // File already deleted — handle gracefully
  }
}
```

---
