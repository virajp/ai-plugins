## Firebase per Flavor

### iOS — per-scheme `GoogleService-Info.plist`

Create one plist per flavor and add a **Run Script Phase** in Xcode that copies
the correct one before the build:

```bash
# Run Script Phase — "Copy Firebase Config"
# Place BEFORE "Compile Sources" phase

PLIST_DEST="${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/GoogleService-Info.plist"

if [ "${CONFIGURATION}" == "Debug-dev" ] || [ "${CONFIGURATION}" == "Release-dev" ]; then
  cp "${PROJECT_DIR}/Runner/Firebase/dev/GoogleService-Info.plist" "${PLIST_DEST}"
else
  cp "${PROJECT_DIR}/Runner/Firebase/prod/GoogleService-Info.plist" "${PLIST_DEST}"
fi
```

Directory structure:

```text
ios/Runner/Firebase/
  dev/GoogleService-Info.plist
  prod/GoogleService-Info.plist
```

### Dart — FlutterFire CLI per flavor

Generate separate options files:

```bash
# Dev
flutterfire configure \
  --project=myapp-dev \
  --out=lib/config/firebase_options_dev.dart \
  --ios-bundle-id=com.example.app.dev \
  --android-package-name=com.example.app.dev

# Prod
flutterfire configure \
  --project=myapp-prod \
  --out=lib/config/firebase_options_prod.dart \
  --ios-bundle-id=com.example.app \
  --android-package-name=com.example.app
```

Initialize based on flavor:

```dart
await Firebase.initializeApp(
  options: Env.flavor == AppFlavor.dev
      ? DevFirebaseOptions.currentPlatform
      : ProdFirebaseOptions.currentPlatform,
);
```

---
