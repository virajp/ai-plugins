## Anti-Patterns

| Anti-Pattern                                        | Why                                                   | Fix                                                      |
| --------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| Checking entitlements from a local flag             | Can be spoofed; misses renewals/cancellations         | Always call `getCustomerInfo()` or listen to updates     |
| Not calling `logIn` after sign-in                   | Purchases attributed to anonymous user; hard to merge | `logIn` immediately after Firebase `signIn`              |
| Not handling `purchaseCancelledError`               | Showing an error on user cancel is poor UX            | Catch and silently return `false`                        |
| Hardcoding API keys in source                       | Exposed in version control                            | Use environment variables or app flavor config           |
| Showing paywall without checking entitlements first | Pro users see paywall on every launch                 | Gate behind `hasEntitlement` check                       |
| Not providing a "Restore Purchases" button          | App Store rejection risk                              | Required on iOS; include in Settings or paywall          |
| Calling `getCustomerInfo` on every screen build     | Unnecessary network calls                             | Cache result reactively via `CustomerInfoUpdateListener` |

---
