## List Animations

Apply staggered animations to a `List<Widget>` using the `.animate()` extension
on the list. Each widget gets its own `Animate` wrapper; the `interval` staggers
their start times.

```dart
Column(
  children: [card1, card2, card3]
    .animate(interval: 80.ms)  // each child starts 80ms after the previous
    .fadeIn()
    .slideY(begin: 0.2, curve: Curves.easeOut),
)
```

`AnimateList` ignores `Spacer` widgets by default (listed in
`AnimateList.ignoreTypes`).

```dart
// Custom delay for the whole list + per-item interval
[w1, w2, w3].animate(delay: 200.ms, interval: 100.ms).fade().scale()
```

---
