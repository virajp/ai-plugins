## iOS Configuration

### Xcode capabilities

Enable **Push Notifications** and **Background Modes → Remote notifications** in
the Xcode target's Signing & Capabilities.

### APNS setup

FCM uses APNS under the hood on iOS. Upload your APNS key or certificate in
Firebase Console → Project Settings → Cloud Messaging.

### `Info.plist`

```xml
<!-- Allow FCM to work with APNS in background -->
<key>UIBackgroundModes</key>
<array>
  <string>fetch</string>
  <string>remote-notification</string>
</array>
```

---
