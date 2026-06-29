## Running Flavors

```bash
# Run dev
flutter run --flavor dev -t lib/main_dev.dart

# Run prod
flutter run --flavor prod -t lib/main_prod.dart

# Build APK (Android)
flutter build apk --flavor prod -t lib/main_prod.dart --release

# Build App Bundle (Android — Play Store)
flutter build appbundle --flavor prod -t lib/main_prod.dart --release

# Build iOS (Xcode archive)
flutter build ipa --flavor prod -t lib/main_prod.dart --release
```

---
