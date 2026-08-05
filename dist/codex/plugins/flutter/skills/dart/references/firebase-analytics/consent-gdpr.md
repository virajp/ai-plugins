## Consent & GDPR

```dart
// Disable all data collection (call before initializeApp for full effect)
await analytics.setAnalyticsCollectionEnabled(false);

// Re-enable after user consent
await analytics.setAnalyticsCollectionEnabled(true);

// Granular consent (requires Analytics v10.1+)
await analytics.setConsent(
  analyticsStorageConsentGranted: true,
  adStorageConsentGranted: false,
  adUserDataConsentGranted: false,
  adPersonalizationSignalsConsentGranted: false,
);
```

Alternatively, disable collection persistently in `AndroidManifest.xml`:

```xml
<meta-data
  android:name="firebase_analytics_collection_enabled"
  android:value="false"
/>
```

And in `Info.plist`:

```xml
<key>FIREBASE_ANALYTICS_COLLECTION_ENABLED</key>
<false />
```

Then enable at runtime only when the user consents.

---
