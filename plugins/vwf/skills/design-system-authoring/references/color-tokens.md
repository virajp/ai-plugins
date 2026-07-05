# Color Tokens

Define **semantic** color tokens by role, with concrete values and a contrast
check. Values are a product decision and code-independent; the mapping to a
theme file is realization.

Roles to cover (only those the product uses):

- **Brand** — primary, secondary, accent.
- **Action** — CTA / primary-action, link, focus ring.
- **Surface** — background, surface/raised, overlay, border/divider.
- **Text** — default, muted, inverse, on-brand.
- **State** — success, warning, error, info (each with a text/surface pair).
- **Interaction states** — hover, active, disabled, selected (as derivations).

For each token, give: the light value, the dark value (if dark mode is in
scope), a usage note, and the **contrast pairing** it must satisfy (text on
surface ≥ 4.5:1; large text and UI components ≥ 3:1). Flag any token that fails
its pairing.

Name by role (`color.text.muted`), never by hue (`gray-500`). Dark mode is a set
of token *values*, not a separate system.
