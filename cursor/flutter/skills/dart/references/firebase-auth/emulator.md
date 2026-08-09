## Emulator

```dart
// Call before any other auth operation
await FirebaseAuth.instance.useAuthEmulator('localhost', 9099);

// Disable app verification for phone auth testing
await FirebaseAuth.instance.setSettings(
  appVerificationDisabledForTesting: true,
);
```

Development uses Firebase emulators. Gate on the app's debug flag
(`MyEnv.isDebugMode`) and resolve the host from config, accounting for the
Android emulator loopback (`10.0.2.2`):

```dart
if (MyEnv.isDebugMode) {
  await _auth.useAuthEmulator(
    Platform.isAndroid ? '10.0.2.2' : MyConfig.emulatorHost,
    MyConfig.emulatorAuthPort,
  );
}
```

Emulator hosts are set via mise env vars (`FIREBASE_AUTH_EMULATOR_HOST`,
`FIRESTORE_EMULATOR_HOST`). Start the emulators with the project's
emulator-start task (e.g. `mise run setup:deps:start`) before running the app.

---
