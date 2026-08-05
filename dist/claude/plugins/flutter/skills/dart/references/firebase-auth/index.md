# firebase_auth

Authenticate users in your Flutter app with Firebase Auth — sign-in flows, user
profiles, auth state streams, MFA, and the app's MyAuthService / MyUserService
wrappers.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                                    | When to read                                                          |
| ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| [Setup](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/setup.md)                                             | Adding the dependency and initializing Firebase                       |
| [Auth State](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/auth-state.md)                                   | Use streams to reactively respond to sign-in/sign-out without polling |
| [Email & Password](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/email-password.md)                         | Building email/password registration and sign-in                      |
| [Google Sign-In](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/google-sign-in.md)                           | Implementing Google Sign-In authentication                            |
| [Apple Sign-In](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/apple-sign-in.md)                             | Required for iOS/macOS apps offering social sign-in (App Store rule)  |
| [OAuth Providers](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/oauth-providers.md)                         | Integrating third-party OAuth providers like GitHub or Microsoft      |
| [Phone Authentication](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/phone-authentication.md)               | Implementing phone-number verification and SMS-based sign-in          |
| [Anonymous Authentication](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/anonymous-authentication.md)       | Enabling guest flows with anonymous authentication                    |
| [User Management](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/user-management.md)                         | Managing user profiles, emails, passwords, and account deletion       |
| [Provider Linking](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/provider-linking.md)                       | Allow one account to sign in with multiple providers                  |
| [Multi-Factor Authentication](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/multi-factor-authentication.md) | Enrolling two-factor authentication with phone or TOTP                |
| [Error Handling](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/error-handling.md)                           | Always catch FirebaseAuthException                                    |
| [App Service Wrappers](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/app-service-wrappers.md)               | Using the app's MyAuthService and MyUserService wrappers              |
| [Emulator](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/emulator.md)                                       | Wiring the Auth emulator for local development                        |
| [Firestore via Repository](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/firestore-via-repository.md)       | Accessing Firestore through the repository layer                      |
| [Anti-Patterns](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/anti-patterns.md)                             | Avoiding common Firebase Auth mistakes                                |
| [Examples](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/firebase-auth/examples.md)                                       | Complete code examples for common auth scenarios                      |
