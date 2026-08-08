## Error Handling

Always catch `FirebaseAuthException`. Use `e.code` to branch — never `e.message`
(localised and unstable).

### Common error codes

| Code                        | Trigger                                               | Action                             |
| --------------------------- | ----------------------------------------------------- | ---------------------------------- |
| `invalid-credential`        | Wrong email or password (with enumeration protection) | Show generic "invalid credentials" |
| `email-already-in-use`      | `createUserWithEmailAndPassword` with existing email  | Prompt sign-in instead             |
| `invalid-email`             | Malformed email string                                | Validate before sending            |
| `weak-password`             | Password too short / simple                           | Enforce minimum 8 chars            |
| `operation-not-allowed`     | Auth provider not enabled in console                  | Enable in Firebase Console         |
| `user-disabled`             | Admin disabled the account                            | Show account-disabled message      |
| `requires-recent-login`     | Sensitive op (delete, updatePassword)                 | Trigger reauthentication flow      |
| `too-many-requests`         | Rate limit hit                                        | Back off, show retry message       |
| `network-request-failed`    | No connectivity                                       | Show offline banner                |
| `provider-already-linked`   | Linking an already-linked provider                    | Inform user                        |
| `credential-already-in-use` | Credential belongs to different account               | Offer account merge                |
| `invalid-verification-code` | Wrong SMS code                                        | Allow retry                        |
| `invalid-phone-number`      | Malformed phone                                       | Validate E.164 format              |
| `quota-exceeded`            | SMS quota limit                                       | Show error, contact support        |

```dart
try {
  await auth.signInWithEmailAndPassword(email: email, password: password);
} on FirebaseAuthException catch (e) {
  final message = switch (e.code) {
    'invalid-credential'   => 'Invalid email or password.',
    'user-disabled'        => 'Your account has been disabled.',
    'too-many-requests'    => 'Too many attempts. Try again later.',
    'network-request-failed' => 'No internet connection.',
    _                      => 'Authentication failed. Please try again.',
  };
  showError(message);
} on FirebaseAuthMultiFactorException catch (e) {
  handleMfa(e.resolver);
}
```

---
