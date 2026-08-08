## Logging Events

```dart
// Generic event
await analytics.logEvent(
  name: 'share_content',
  parameters: {
    'content_type': 'image',
    'item_id': 'item_12345',
  },
);
```

### Naming rules

- Snake*case only: `[a-z0-9*]`, max 40 chars
- Parameter names: max 40 chars; parameter values: max 100 chars
- Max 25 parameters per event
- Reserved prefix: `firebase_`, `google_`, `ga_` — avoid these

---
