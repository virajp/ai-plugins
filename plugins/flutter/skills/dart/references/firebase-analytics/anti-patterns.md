## Anti-Patterns

| Anti-Pattern                                   | Why                                          | Fix                                    |
| ---------------------------------------------- | -------------------------------------------- | -------------------------------------- |
| Using PII in user ID or parameters             | Violates Firebase ToS and privacy laws       | Use opaque UIDs only                   |
| Logging events before `Firebase.initializeApp` | Throws `FirebaseException`                   | Initialize Firebase first              |
| Logging events on a secondary app              | Events are silently dropped                  | Analytics must use the default app     |
| Using `logEvent` for standard events           | Misses Firebase's predefined taxonomy        | Use `analytics.log*` named methods     |
| Not clearing `userId` on sign-out              | Subsequent sessions attributed to wrong user | Call `setUserId(id: null)` on sign-out |
| Logging dozens of params per event             | Only first 25 sent; excess silently dropped  | Keep event schemas focused             |

---
