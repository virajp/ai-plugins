## Predefined Events

Use predefined event methods when available — they map to Firebase's standard
event taxonomy and enable auto-populated reports.

```dart
// E-commerce
await analytics.logPurchase(
  currency: 'USD',
  value: 9.99,
  transactionId: 'txn_abc123',
  items: [
    AnalyticsEventItem(
      itemId: 'plan_pro',
      itemName: 'Pro Plan',
      price: 9.99,
      quantity: 1,
    ),
  ],
);

// Search
await analytics.logSearch(searchTerm: 'running shoes');

// Login
await analytics.logLogin(loginMethod: 'google');

// Sign up
await analytics.logSignUp(signUpMethod: 'email');

// Share
await analytics.logShare(
  contentType: 'route',
  itemId: 'route_42',
  method: 'link',
);

// Tutorial
await analytics.logTutorialBegin();
await analytics.logTutorialComplete();

// Level in game / progress
await analytics.logLevelStart(levelName: 'onboarding');
await analytics.logLevelEnd(levelName: 'onboarding', success: true);

// Select content
await analytics.logSelectContent(contentType: 'article', itemId: 'abc');

// View item
await analytics.logViewItem(
  currency: 'USD',
  value: 9.99,
  items: [AnalyticsEventItem(itemId: 'plan_pro', itemName: 'Pro Plan')],
);
```

Full list: `analytics.log*` — check the IDE autocomplete for all predefined
methods.

---
