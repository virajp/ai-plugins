## Email & Password

### Register

```dart
try {
  final credential = await FirebaseAuth.instance
      .createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
  final user = credential.user!;
  await user.sendEmailVerification();
} on FirebaseAuthException catch (e) {
  switch (e.code) {
    case 'email-already-in-use': ...
    case 'invalid-email':        ...
    case 'weak-password':        ...
    case 'operation-not-allowed': ...
  }
}
```

### Sign in

```dart
try {
  await FirebaseAuth.instance.signInWithEmailAndPassword(
    email: email,
    password: password,
  );
} on FirebaseAuthException catch (e) {
  // 'invalid-credential' covers wrong email/password
  // (replaces user-not-found + wrong-password with email enumeration protection)
  if (e.code == 'invalid-credential') showError('Invalid email or password');
}
```

### Password reset

```dart
await FirebaseAuth.instance.sendPasswordResetEmail(email: email);
```

### Confirm password reset (deep-link code)

```dart
await FirebaseAuth.instance.confirmPasswordReset(
  code: oobCode,
  newPassword: newPassword,
);
```

---
