## Customer Info Updates

Listen for real-time changes (subscription renewals, cancellations, billing
retries).

```dart
Purchases.addCustomerInfoUpdateListener((CustomerInfo info) {
  final isPro = info.entitlements.active.containsKey('pro');
  // Update your app state
});
```

Remove the listener when no longer needed (e.g., in `onClose`):

```dart
// Store the listener reference
late final CustomerInfoUpdateListener _listener;

@override
void onInit() {
  _listener = (info) => _updateEntitlementState(info);
  Purchases.addCustomerInfoUpdateListener(_listener);
}

@override
void onClose() {
  Purchases.removeCustomerInfoUpdateListener(_listener);
  super.onClose();
}
```

---
