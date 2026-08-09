## User Properties

User properties persist across sessions and segment your audience in reports.

```dart
// Set
await analytics.setUserProperty(name: 'membership_tier', value: 'premium');
await analytics.setUserProperty(name: 'preferred_unit', value: 'km');

// Clear
await analytics.setUserProperty(name: 'membership_tier', value: null);
```

- Max 25 custom user properties per project
- Name: max 24 chars, snake_case
- Value: max 36 chars

---
