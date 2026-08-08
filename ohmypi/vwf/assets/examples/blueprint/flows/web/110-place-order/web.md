---
type: vwf-flow-platform
title: Place order — web
description: The browser checkout journey — cart review, payment,
  confirmation.
status: reviewed
platform: web
implementation: partial
---

# Place order — web

Flow contract: [Place order](./index.md)

## Screens → web

| Code | Screen        | Route     | Reads (operationId) | States (loading/error/empty)          | Actions     | Form validation                 |
| ---- | ------------- | --------- | ------------------- | ------------------------------------- | ----------- | ------------------------------- |
| 110a | Checkout      | /checkout | `placeOrder`        | loading · error (decline inline) · —  | Place order | Cart non-empty; payment details |
| 110b | Order history | /orders   | `getOrder`          | loading · error · empty (first order) | Open detail | —                               |

<!-- Home flow for the Checkout and Order history screens; the Order detail
     screen is homed by the cancel-refund flow. Visual language comes from
     ../../../design-system.md; record only deviations here. -->

### 110a — Checkout components

| Component              | Rules                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Cart summary (info)    | Lists the items and total being ordered; read-only on this screen                                                  |
| Payment details form   | Fields per Form validation; validates on blur                                                                      |
| Place order (button)   | Enabled only when the cart is non-empty and payment details validate; click → `placeOrder`; disabled while placing |
| Decline error (inline) | Shown when payment declines; states that no order was placed and the cart is intact                                |

### 110b — Order history components

| Component           | Rules                                                                           |
| ------------------- | ------------------------------------------------------------------------------- |
| Order list          | One row per order, newest first; row click → Order detail (120a, cancel-refund) |
| Empty state (info)  | Shown before the first order; invites the customer to start shopping            |
| Load error (banner) | Shown when `getOrder` fails; offers retry                                       |
