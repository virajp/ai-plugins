# Building Layouts

Master the one layout rule — **constraints go down, sizes go up, the parent sets
position** — then compose with the structural widgets. Render user-facing text
through `MyText`, and extract nested sections into `My`-prefixed widgets with
`super.key` and `final` params.

## Core principles

- **Constraints go down.** A parent passes min/max width and height to each
  child; a widget cannot pick a size independent of its parent's constraints.
- **Sizes go up.** The child chooses its size within those constraints and
  reports it back.
- **Parent sets position.** A child's `x`/`y` is decided by the parent —
  children do not know their own screen position.
- **Avoid unbounded constraints.** Never pass an unbounded constraint (e.g.
  `double.infinity`) on the cross-axis of a `Row`/`Column` or inside a
  scrollable — it throws a render exception.

## Structural widgets

- **`Row` / `Column`** — horizontal / vertical linear layout; align with
  `mainAxisAlignment` and `crossAxisAlignment`.
- **`Expanded` / `Flexible`** — wrap flex children to fill (`Expanded`) or size
  up to (`Flexible`) the available space.
- **`Container`** — apply padding, margin, borders, or a background.
- **`Stack` / `Positioned`** — overlap widgets on the Z-axis and anchor them.
- **`SizedBox`** — impose tight width/height constraints on a child.

## Adaptive & responsive

- **Responsive (fit into available space):** use `LayoutBuilder`, `Expanded`,
  and `Flexible` to adjust size and placement from the parent's constraints.
- **Adaptive (change the layout per form factor):** conditionally swap whole
  structures — a bottom nav bar on mobile, a side rail on tablet/desktop.

## Resolving unbounded constraints

A `ListView` directly inside a `Column` throws — the `Column` hands it infinite
height. Bound it with `Expanded`:

```dart
// BAD — unbounded height exception
Column(
  children: [
    MyText('Header'),
    ListView(children: const [/* items */]),
  ],
)

// GOOD — ListView constrained to the remaining space
Column(
  children: [
    MyText('Header'),
    Expanded(
      child: ListView(children: const [/* items */]),
    ),
  ],
)
```

## Responsive layout with LayoutBuilder

Swap structures on available width, extracting each branch into its own widget:

```dart
class AdaptiveHome extends StatelessWidget {
  const AdaptiveHome({super.key});

  @override
  Widget build(final BuildContext context) {
    return LayoutBuilder(
      builder: (final BuildContext context, final BoxConstraints constraints) {
        if (constraints.maxWidth > 600) {
          return const Row(
            children: [
              SizedBox(width: 250, child: MySidebar()),
              Expanded(child: MyContent()),
            ],
          );
        }
        return const Column(
          children: [
            Expanded(child: MyContent()),
            MyBottomNav(),
          ],
        );
      },
    );
  }
}
```

When a `Row`/`Column` overflows (the yellow-and-black stripes), wrap the
offending child in `Expanded` if it is in a flex box, or wrap the parent in a
scrollable widget.
