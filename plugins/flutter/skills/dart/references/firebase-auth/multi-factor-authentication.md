## Multi-Factor Authentication

### Enroll phone as second factor

```dart
Future<void> enrollPhoneMfa(String phoneNumber) async {
  final user = FirebaseAuth.instance.currentUser!;
  final session = await user.multiFactor.getSession();

  await FirebaseAuth.instance.verifyPhoneNumber(
    phoneNumber: phoneNumber,
    multiFactorSession: session,
    verificationCompleted: (_) {},
    verificationFailed: (e) => showError(e.message),
    codeSent: (verificationId, _) async {
      final smsCode = await promptForSmsCode();
      if (smsCode == null) return;

      final credential = PhoneAuthProvider.credential(
        verificationId: verificationId,
        smsCode: smsCode,
      );
      await user.multiFactor.enroll(
        PhoneMultiFactorGenerator.getAssertion(credential),
        displayName: 'Phone',
      );
    },
    codeAutoRetrievalTimeout: (_) {},
  );
}
```

### Enroll TOTP as second factor

```dart
Future<void> enrollTotp() async {
  final user = FirebaseAuth.instance.currentUser!;
  final session = await user.multiFactor.getSession();
  final secret = await TotpMultiFactorGenerator.generateSecret(session);

  final qrUrl = await secret.generateQrCodeUrl(
    accountName: user.email,
    issuer: 'MyApp',
  );
  // Show QR code to user to scan with authenticator app
  showQrCode(qrUrl);

  final code = await promptForTotpCode();
  if (code == null) return;

  await user.multiFactor.enroll(
    await TotpMultiFactorGenerator.getAssertionForEnrollment(secret, code),
    displayName: 'Authenticator App',
  );
}
```

### Handle MFA during sign-in

```dart
try {
  await FirebaseAuth.instance.signInWithEmailAndPassword(
    email: email, password: password,
  );
} on FirebaseAuthMultiFactorException catch (e) {
  final resolver = e.resolver;

  // TOTP factor
  final totpHint = resolver.hints
      .whereType<TotpMultiFactorInfo>().firstOrNull;
  if (totpHint != null) {
    final code = await promptForTotpCode();
    final assertion = await TotpMultiFactorGenerator.getAssertionForSignIn(
      totpHint.uid, code!,
    );
    await resolver.resolveSignIn(assertion);
    return;
  }

  // Phone factor
  final phoneHint = resolver.hints
      .whereType<PhoneMultiFactorInfo>().firstOrNull;
  if (phoneHint != null) {
    await FirebaseAuth.instance.verifyPhoneNumber(
      multiFactorSession: resolver.session,
      multiFactorInfo: phoneHint,
      verificationCompleted: (_) {},
      verificationFailed: (e) => showError(e.message),
      codeSent: (verificationId, _) async {
        final smsCode = await promptForSmsCode();
        if (smsCode == null) return;
        final credential = PhoneAuthProvider.credential(
          verificationId: verificationId,
          smsCode: smsCode,
        );
        await resolver.resolveSignIn(
          PhoneMultiFactorGenerator.getAssertion(credential),
        );
      },
      codeAutoRetrievalTimeout: (_) {},
    );
  }
}

// Manage enrolled factors
final factors = await user.multiFactor.getEnrolledFactors();
await user.multiFactor.unenroll(factorUid: factors.first.uid);
```

---
