## User Management

### Read profile

```dart
final user = FirebaseAuth.instance.currentUser!;
user.uid           // unique ID
user.email
user.displayName
user.photoURL
user.emailVerified
user.isAnonymous
user.phoneNumber
user.providerData  // List<UserInfo> of linked providers
user.metadata.creationTime
user.metadata.lastSignInTime
```

### Update profile

```dart
await user.updateDisplayName('Jane Doe');
await user.updatePhotoURL('https://example.com/photo.jpg');
// Shorthand for both:
await user.updateProfile(displayName: 'Jane', photoUrl: 'https://...');
```

### Email verification

```dart
if (!user.emailVerified) {
  await user.sendEmailVerification();
}
// After user clicks link, reload to pick up the change:
await user.reload();
final refreshed = FirebaseAuth.instance.currentUser!;
print(refreshed.emailVerified); // true
```

### Change email (requires recent login)

```dart
// Sends a verification link to the new address; changes only after clicking
await user.verifyBeforeUpdateEmail('new@example.com');
```

### Change password (requires recent login)

```dart
try {
  await user.updatePassword(newPassword);
} on FirebaseAuthException catch (e) {
  if (e.code == 'requires-recent-login') await reauthenticate();
  if (e.code == 'weak-password') showError('Password too weak');
}
```

### Re-authentication (required before sensitive operations)

Always catch `requires-recent-login` around `updatePassword`, `updateEmail`,
`delete`.

```dart
Future<void> reauthenticate(String email, String password) async {
  final credential = EmailAuthProvider.credential(
    email: email,
    password: password,
  );
  await FirebaseAuth.instance.currentUser!
      .reauthenticateWithCredential(credential);
}

// With provider (Google, Apple, etc.)
await user.reauthenticateWithProvider(GoogleAuthProvider());
```

### Delete account

```dart
try {
  await FirebaseAuth.instance.currentUser!.delete();
} on FirebaseAuthException catch (e) {
  if (e.code == 'requires-recent-login') await reauthenticate();
}
```

### Get ID token (for your backend)

```dart
// Cached token, auto-refreshes when expired
final token = await user.getIdToken();

// Force refresh
final freshToken = await user.getIdToken(true);

// With claims metadata
final result = await user.getIdTokenResult();
print(result.claims);        // custom claims from backend
print(result.expirationTime);
```

### Sign out

```dart
await FirebaseAuth.instance.signOut();
// Also sign out of social providers if used
await GoogleSignIn().signOut();
```

---
