## Setup

```yaml
dependencies:
  firebase_core:
  firebase_crashlytics:
```

### Android — enable Gradle plugin

In `android/build.gradle` (project-level):

```groovy
buildscript {
  dependencies {
    classpath 'com.google.firebase:firebase-crashlytics-gradle:3.0.2'
  }
}
```

In `android/app/build.gradle`:

```groovy
apply plugin: 'com.google.firebase.crashlytics'
```

### iOS — no extra steps

Crashlytics is auto-integrated via CocoaPods after `pod install`.

---
