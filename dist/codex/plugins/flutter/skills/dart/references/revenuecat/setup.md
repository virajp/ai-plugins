## Setup

```yaml
dependencies:
  purchases_flutter: ^8.0.0
  # Optional — pre-built paywall UI
  # purchases_ui_flutter: ^8.0.0
```

### Android — `android/app/build.gradle`

```groovy
android {
  defaultConfig {
    minSdkVersion 24  // RevenueCat requires min SDK 24
  }
}
```

### iOS — no extra steps

Configured via CocoaPods automatically.

### App Store / Play Store

1. Create products in App Store Connect and Google Play Console.
2. Create offerings and attach products in the RevenueCat Dashboard.
3. Get your **public API keys** (one per platform) from RevenueCat Dashboard →
   Project → API Keys.

---
