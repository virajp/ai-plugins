# RevenueCat (purchases_flutter)

Implements in-app subscriptions and purchases in a Flutter app using RevenueCat
(purchases_flutter) — initialization, user identification, offerings,
purchase/restore flows, entitlement checks, and pre-built paywalls.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                               | When to read                                                      |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [Setup](<%= it.root %>/skills/dart/references/revenuecat/setup.md)                                           | Adding the package, store products, and API keys                  |
| [Initialization](<%= it.root %>/skills/dart/references/revenuecat/initialization.md)                         | Initialize once, as early as possible — before any purchase calls |
| [Identify User](<%= it.root %>/skills/dart/references/revenuecat/identify-user.md)                           | Linking purchases to your own user ID after sign-in               |
| [Fetch Offerings](<%= it.root %>/skills/dart/references/revenuecat/fetch-offerings.md)                       | Fetching available packages and prices for a paywall              |
| [Purchase a Package](<%= it.root %>/skills/dart/references/revenuecat/purchase-a-package.md)                 | Running a purchase and handling cancel/pending errors             |
| [Check Entitlements](<%= it.root %>/skills/dart/references/revenuecat/check-entitlements.md)                 | Checking whether a user has active access (e.g., Pro)             |
| [Restore Purchases](<%= it.root %>/skills/dart/references/revenuecat/restore-purchases.md)                   | Required by App Store guidelines — must be accessible from the UI |
| [Customer Info Updates](<%= it.root %>/skills/dart/references/revenuecat/customer-info-updates.md)           | Reacting to real-time renewals or cancellations                   |
| [Paywalls (RevenueCat UI)](<%= it.root %>/skills/dart/references/revenuecat/paywalls-revenuecat-ui.md)       | Presenting pre-built RevenueCat UI paywalls                       |
| [Subscription Status Helper](<%= it.root %>/skills/dart/references/revenuecat/subscription-status-helper.md) | A reusable service exposing the current subscription tier         |
| [Anti-Patterns](<%= it.root %>/skills/dart/references/revenuecat/anti-patterns.md)                           | Avoiding common subscription and entitlement mistakes             |
| [Examples](<%= it.root %>/skills/dart/references/revenuecat/examples.md)                                     | Full subscription service, paywall, and feature-gating            |
