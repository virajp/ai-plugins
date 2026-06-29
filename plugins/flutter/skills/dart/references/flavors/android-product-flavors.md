## Android — Product Flavors

Edit `android/app/build.gradle`:

```groovy
android {
  flavorDimensions 'env'

  productFlavors {
    dev {
      dimension 'env'
      applicationId 'com.example.app.dev'
      versionNameSuffix '-dev'
      resValue 'string', 'app_name', 'My App DEV'
    }
    prod {
      dimension 'env'
      applicationId 'com.example.app'
      resValue 'string', 'app_name', 'My App'
    }
  }
}
```

### Firebase config files (Android)

Place per-flavor `google-services.json` in flavor-specific source directories:

```text
android/app/
  src/
    dev/
      google-services.json    ← dev Firebase project
    prod/
      google-services.json    ← prod Firebase project
```

The Google Services Gradle plugin automatically picks the correct file based on
the active flavor.

### App icons per flavor (optional)

```text
android/app/src/dev/res/mipmap-*/ic_launcher.png
android/app/src/prod/res/mipmap-*/ic_launcher.png
```

---
