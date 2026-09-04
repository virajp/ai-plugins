---
type: vwf-flow-platform
title: Order cancellation & refund — webapp
description: The browser journey for cancelling an order and tracking its
  refund.
status: reviewed
platform: webapp
implementation: none
---

# Order cancellation & refund — webapp

Flow contract: [Order cancellation & refund](./index.md)

## Screens → web

| Code | Screen       | Route        | Reads (operationId)       | States (loading/error/empty) | Actions          | Form validation |
| ---- | ------------ | ------------ | ------------------------- | ---------------------------- | ---------------- | --------------- |
| 120a | Order detail | /orders/{id} | `getOrder`, `cancelOrder` | loading skeleton · error · — | Cancel (confirm) | —               |

<!-- Home flow for the Order detail screen. Cancel is destructive: it uses the
     design-system `danger` role behind a confirmation overlay. Visual language
     comes from ../../../design-system.md; record only deviations here. -->

### 120a — Order detail components

| Component             | Rules                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Order summary (info)  | Items, total, and current order state from `getOrder`                                              |
| Cancel order (button) | Visible only while the order reads `paid` and is unfulfilled; click opens the confirmation overlay |
| Confirmation overlay  | Confirm → `cancelOrder`; states the refund is issued to the original payment method; dismissible   |
| Refund status (info)  | Shown after cancellation: refunded, or visibly failed/pending when the provider is down            |
| Load error (banner)   | Shown when `getOrder` fails; offers retry                                                          |
