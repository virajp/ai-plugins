## Anti-Patterns

| Anti-Pattern                                                       | Why                                                                     | Fix                                                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Polling `currentUser` instead of streaming                         | Misses background token refreshes and sign-out events                   | Use `authStateChanges()` or `userChanges()` stream                                               |
| Branching on `e.message` in catch blocks                           | Message is localised and can change                                     | Always branch on `e.code`                                                                        |
| Calling `updatePassword` / `delete` without reauthentication guard | Throws `requires-recent-login` in production                            | Catch the error, trigger reauthentication, retry                                                 |
| Using `user-not-found` / `wrong-password` error codes              | Deprecated — new projects return `invalid-credential` instead           | Handle `invalid-credential` as the catch-all for wrong credentials                               |
| `signInWithPopup` on native platforms                              | Only works on web                                                       | Use `signInWithProvider` on mobile/desktop, `signInWithPopup` on web                             |
| Not signing out of `GoogleSignIn()`                                | Google sign-in picker re-uses last session; user cannot switch accounts | Call both `FirebaseAuth.instance.signOut()` and `GoogleSignIn().signOut()`                       |
| Storing the ID token long-term                                     | Tokens expire in 1 hour                                                 | Call `getIdToken()` (not `getIdToken(true)`) before each backend request; the SDK auto-refreshes |
| Forgetting to revoke Apple token on account deletion               | App Store rejection                                                     | Call `revokeTokenWithAuthorizationCode` before `user.delete()`                                   |
| Missing `FirebaseAuthMultiFactorException` catch                   | MFA users get a crash instead of a prompt                               | Add a dedicated catch block above `FirebaseAuthException`                                        |
| Importing `cloud_firestore` in services/controllers                | Couples UI/business logic to the data store                             | Go through repository static methods (see Firestore via Repository)                              |

---
