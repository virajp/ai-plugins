## Message Types

| Type                 | App State               | Handler                                                                    |
| -------------------- | ----------------------- | -------------------------------------------------------------------------- |
| Notification message | Foreground              | `FirebaseMessaging.onMessage`                                              |
| Notification message | Background / Terminated | System tray; tap opens app via `getInitialMessage` or `onMessageOpenedApp` |
| Data message         | Foreground              | `FirebaseMessaging.onMessage`                                              |
| Data message         | Background              | `FirebaseMessaging.onBackgroundMessage` top-level handler                  |
| Data message         | Terminated              | `FirebaseMessaging.onBackgroundMessage` top-level handler                  |

---
