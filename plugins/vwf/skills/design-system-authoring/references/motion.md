# Motion

- **Duration tokens** — a small set (e.g. fast 120ms, base 200ms, slow 320ms)
  and what each is for.
- **Easing tokens** — standard, entrance, and exit curves by intent.
- **Principles** — what animates and why (feedback, continuity, orientation);
  what must never animate (content reflow that harms readability).
- **Reduced motion** — the required behavior under `prefers-reduced-motion`:
  essential motion only, no parallax or large transforms. This is a hard rule.

Motion is a contract at the level of tokens and principles; the keyframe code is
realization.
