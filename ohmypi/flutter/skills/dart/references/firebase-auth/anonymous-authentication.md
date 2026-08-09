## Anonymous Authentication

Enable **Anonymous** in the Firebase Console. Useful for guest flows that can
later be upgraded to a full account.

```dart
await FirebaseAuth.instance.signInAnonymously();

// Later: upgrade by linking a credential
final credential = GoogleAuthProvider.credential(...);
await FirebaseAuth.instance.currentUser!.linkWithCredential(credential);
```

---
