# firebase_messaging

Send and receive push notifications in your Flutter app with Firebase Cloud
Messaging (FCM) — permissions, FCM tokens, foreground/background/terminated
message handling, tap routing, topics, local notifications, and Android/iOS
configuration.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                                     | When to read                                                 |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [Setup](<%= it.root %>/skills/dart/references/firebase-messaging/setup.md)                                         | Adding the dependencies and initializing FCM                 |
| [Permissions](<%= it.root %>/skills/dart/references/firebase-messaging/permissions.md)                             | Requesting notification permission on iOS and Android 13+    |
| [FCM Token](<%= it.root %>/skills/dart/references/firebase-messaging/fcm-token.md)                                 | Getting and storing the device token for your backend        |
| [Message Types](<%= it.root %>/skills/dart/references/firebase-messaging/message-types.md)                         | Choosing the right handler for a message type                |
| [Foreground Messages](<%= it.root %>/skills/dart/references/firebase-messaging/foreground-messages.md)             | Displaying notifications while the app is in foreground      |
| [Background Messages](<%= it.root %>/skills/dart/references/firebase-messaging/background-messages.md)             | Handling messages when the app is backgrounded or terminated |
| [Notification Tap Handling](<%= it.root %>/skills/dart/references/firebase-messaging/notification-tap-handling.md) | Routing to a screen when a notification is tapped            |
| [Topics](<%= it.root %>/skills/dart/references/firebase-messaging/topics.md)                                       | Broadcasting messages to groups of devices via topics        |
| [Local Notifications](<%= it.root %>/skills/dart/references/firebase-messaging/local-notifications.md)             | Customizing notification appearance with local notifications |
| [Android Configuration](<%= it.root %>/skills/dart/references/firebase-messaging/android-configuration.md)         | Configuring notification channels and icons on Android       |
| [iOS Configuration](<%= it.root %>/skills/dart/references/firebase-messaging/ios-configuration.md)                 | Enabling push notifications and APNs keys on iOS             |
| [Anti-Patterns](<%= it.root %>/skills/dart/references/firebase-messaging/anti-patterns.md)                         | Avoiding common FCM implementation mistakes                  |
| [Examples](<%= it.root %>/skills/dart/references/firebase-messaging/examples.md)                                   | Production-ready messaging service implementation            |
