# RevenueCat (purchases_flutter)

Implements in-app subscriptions and purchases in a Flutter app using RevenueCat
(purchases_flutter) — initialization, user identification, offerings,
purchase/restore flows, entitlement checks, and pre-built paywalls.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                               | When to read                                                      |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [Setup](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/revenuecat/setup.md)                                           | Adding the package, store products, and API keys                  |
| [Initialization](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/revenuecat/initialization.md)                         | Initialize once, as early as possible — before any purchase calls |
| [Identify User](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/revenuecat/identify-user.md)                           | Linking purchases to your own user ID after sign-in               |
| [Fetch Offerings](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/revenuecat/fetch-offerings.md)                       | Fetching available packages and prices for a paywall              |
| [Purchase a Package](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/revenuecat/purchase-a-package.md)                 | Running a purchase and handling cancel/pending errors             |
| [Check Entitlements](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/revenuecat/check-entitlements.md)                 | Checking whether a user has active access (e.g., Pro)             |
| [Restore Purchases](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/revenuecat/restore-purchases.md)                   | Required by App Store guidelines — must be accessible from the UI |
| [Customer Info Updates](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/revenuecat/customer-info-updates.md)           | Reacting to real-time renewals or cancellations                   |
| [Paywalls (RevenueCat UI)](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/revenuecat/paywalls-revenuecat-ui.md)       | Presenting pre-built RevenueCat UI paywalls                       |
| [Subscription Status Helper](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/revenuecat/subscription-status-helper.md) | A reusable service exposing the current subscription tier         |
| [Anti-Patterns](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/revenuecat/anti-patterns.md)                           | Avoiding common subscription and entitlement mistakes             |
| [Examples](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/revenuecat/examples.md)                                     | Full subscription service, paywall, and feature-gating            |
