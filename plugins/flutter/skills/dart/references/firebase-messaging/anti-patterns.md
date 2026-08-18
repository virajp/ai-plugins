## Anti-Patterns

| Anti-Pattern                                    | Why                                           | Fix                                                                  |
| ----------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| Background handler as a class method or closure | FCM requires a top-level isolate entry point  | Use `@pragma('vm:entry-point')` top-level function                   |
| Not initializing Firebase in background handler | Other Firebase services throw                 | Call `Firebase.initializeApp()` at the top of the background handler |
| Storing token in local state only               | Token can refresh at any time                 | Listen to `onTokenRefresh` and always update backend                 |
| Not deleting token on sign-out                  | User receives notifications after sign-out    | Call `deleteToken()` and unsubscribe from all topics on sign-out     |
| Updating UI from background handler             | Background handler runs in a separate isolate | Write to shared_preferences; update UI when app resumes              |
| Forgetting `getInitialMessage`                  | Cold-start taps are silently ignored          | Always check `getInitialMessage` on app launch                       |
| Hardcoding topic names                          | Topics are global across your project         | Define topic names as constants                                      |

---
