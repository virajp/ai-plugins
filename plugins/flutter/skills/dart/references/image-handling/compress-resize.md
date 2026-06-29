## Compress / Resize

`image_picker` already resizes and compresses via `maxWidth`, `maxHeight`,
`imageQuality`. For additional processing after cropping, use these parameters
on the cropper:

```dart
ImageCropper().cropImage(
  sourcePath: path,
  compressFormat: ImageCompressFormat.jpg, // or .png
  compressQuality: 80, // 0-100
  // ...
);
```

For advanced compression (WebP, progressive JPEG), add the
`flutter_image_compress` package.

---
