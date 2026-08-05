# firebase_crashlytics

Monitor and report crashes in your Flutter app with Firebase Crashlytics —
fatal/non-fatal errors, custom keys and logs, user identifiers, Flutter and
isolate error handlers, and debug/release collection control.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                               | When to read                                                                    |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [Setup](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-crashlytics/setup.md)                                 | Adding the dependency and configuring Crashlytics                               |
| [Initialization](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-crashlytics/initialization.md)               | Hook Crashlytics into Flutter's error handling in main()                        |
| [Fatal Crashes](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-crashlytics/fatal-crashes.md)                 | Crashlytics auto-captures unhandled Dart and native crashes                     |
| [Non-Fatal Errors](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-crashlytics/non-fatal-errors.md)           | Use for caught exceptions that don't crash the app but signal a problem         |
| [Custom Keys](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-crashlytics/custom-keys.md)                     | Attaching key-value metadata to crash reports                                   |
| [Custom Logs](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-crashlytics/custom-logs.md)                     | Breadcrumb-style logs that appear in the crash report alongside the stack trace |
| [User Identifier](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-crashlytics/user-identifier.md)             | Associating crash reports with a signed-in user                                 |
| [Flutter Error Handler](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-crashlytics/flutter-error-handler.md) | Handle non-fatal widget-build errors in debug vs release differently            |
| [Isolate Errors](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-crashlytics/isolate-errors.md)               | Errors thrown in Isolate.run or compute are caught differently                  |
| [Collection Control](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-crashlytics/collection-control.md)       | Controlling crash collection in debug vs release                                |
| [Anti-Patterns](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-crashlytics/anti-patterns.md)                 | Avoiding common Crashlytics mistakes                                            |
| [Examples](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-crashlytics/examples.md)                           | Complete working Crashlytics implementation                                     |
