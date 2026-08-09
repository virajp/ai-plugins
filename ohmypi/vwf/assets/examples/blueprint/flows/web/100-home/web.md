---
type: vwf-flow-platform
title: Home — web
description: The browser home surface — cart summary, recent orders, and
  routes onward.
status: reviewed
platform: web
implementation: complete
---

# Home — web

Flow contract: [Home](./index.md)

## Screens → web

| Code | Screen | Route | Reads (operationId) | States (loading/error/empty)                             | Actions                     | Form validation |
| ---- | ------ | ----- | ------------------- | -------------------------------------------------------- | --------------------------- | --------------- |
| 100a | home   | /     | `getOrder`          | loading · error (history region) · empty (no orders yet) | Go to checkout · Open order | —               |

<!-- The standard `home` flow's primary screen takes the flow's slug: it is
     named `home`, never "Dashboard" or "Landing". Home flow for this screen;
     Checkout and Order history are homed by the place-order flow. Visual
     language comes from ../../../design-system.md. -->

### 100a — home components

| Component               | Rules                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| Cart summary (info)     | Shown only when the customer has an open cart; states item count and total                  |
| Go to checkout (button) | Visible only with an open cart; click → Checkout (110a, place-order)                        |
| Recent orders (list)    | Up to five most recent orders, newest first; row click → Order detail (120a, cancel-refund) |
| Empty state (info)      | Shown when the customer has no orders yet; invites them to start shopping                   |
| History error (banner)  | Shown when `getOrder` fails; offers retry and never blocks the checkout route               |
