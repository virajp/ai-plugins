## Phone Authentication

### Native (Android / iOS)

```dart
await FirebaseAuth.instance.verifyPhoneNumber(
  phoneNumber: '+1 555 0100',
  timeout: const Duration(seconds: 60),

  // Android only: auto-resolved without user input
  verificationCompleted: (PhoneAuthCredential credential) async {
    await FirebaseAuth.instance.signInWithCredential(credential);
  },

  verificationFailed: (FirebaseAuthException e) {
    if (e.code == 'invalid-phone-number') showError('Invalid phone number');
    else showError(e.message ?? 'Verification failed');
  },

  codeSent: (String verificationId, int? resendToken) async {
    // Show SMS code input to user
    final smsCode = await promptForSmsCode();
    if (smsCode == null) return;

    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );

    try {
      await FirebaseAuth.instance.signInWithCredential(credential);
    } on FirebaseAuthException catch (e) {
      if (e.code == 'invalid-verification-code') showError('Wrong code');
    }
  },

  codeAutoRetrievalTimeout: (String verificationId) {
    // Timeout reached — allow user to request resend
  },
);
```

### Web

```dart
final confirmationResult = await FirebaseAuth.instance
    .signInWithPhoneNumber('+1 555 0100');

final smsCode = await promptForSmsCode();
await confirmationResult.confirm(smsCode!);
```

---
