## Identify User

Link purchases to your own user ID (e.g., Firebase UID) so purchases are
portable across devices and platforms.

```dart
// After sign-in
await Purchases.logIn(firebaseUser.uid);

// On sign-out — revert to anonymous
await Purchases.logOut();

// Check current app user ID
final appUserId = await Purchases.appUserID;
```

> Always call `logIn` after the user authenticates, before showing a paywall.
> RevenueCat merges anonymous purchase history with the identified user on first
> `logIn`.

---
