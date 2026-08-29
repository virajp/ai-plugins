# Flutter — UI composition & theming

## Building Layouts

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

A concrete `children:` list is fine for a handful of static items, as above —
for long or data-driven lists use `ListView.builder` so only visible items are
built (see the performance reference).

## Theming & Adaptive Design

Widgets never hardcode a `Color` or read `Theme.of(context)` directly. Color
comes from the semantic `MyColors.get` accessors and type comes from `MyText`;
both resolve light/dark automatically. Raw `ThemeData` lives in exactly one
place — the app bootstrap that feeds `GetMaterialApp` — and `MyColors` reads
from it.

## The token system (use this in widgets)

`MyColors.get` exposes **semantic** accessors keyed by role, each taking the
`BuildContext` so it can return the right value for the active brightness:

```dart
Container(
  color: MyColors.get.surface(context),
  child: MyText(
    L10n.of(context).welcome,
    color: MyColors.get.onSurface(context),
  ),
)
```

- Reach for a role (`primary`, `onPrimary`, `surface`, `onSurface`, `error`),
  never a literal (`Colors.blue`, `Color(0xFF...)`), inside a widget.
- To introduce a new color, add a token accessor to `MyColors` that maps to the
  theme's `ColorScheme` — do not scatter raw colors through the widget tree.
- `MyText` already pulls its size/weight from the app text theme; pass a role
  color when you need to override the default.

## The bootstrap theme (the one place raw ThemeData is allowed)

Build a light and a dark `ThemeData` once and hand them to `GetMaterialApp`;
`MyColors` and `MyText` resolve against whichever is active.

```dart
GetMaterialApp(
  theme: buildTheme(Brightness.light),
  darkTheme: buildTheme(Brightness.dark),
  home: const MyHomePage(),
);

ThemeData buildTheme(final Brightness brightness) => ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: MyColors.seed,
        brightness: brightness,
      ),
      appBarTheme: const AppBarThemeData(elevation: 0),
      cardTheme: const CardThemeData(elevation: 2),
    );
```

Material 3 is the default. Inside this bootstrap `ThemeData`, follow the modern
conventions:

- **Colors** come from `ColorScheme.fromSeed(...)` for accessible contrast; do
  not hand-build a `ColorScheme` or use deprecated `accentColor`.
- **Component themes** use the `*ThemeData` suffix — `CardThemeData`,
  `AppBarThemeData`, `DialogThemeData`, `TabBarThemeData`,
  `InputDecorationThemeData` — never the `*Theme` widget classes.
- **Modern components:** `NavigationBar` over `BottomNavigationBar`,
  `NavigationDrawer` over `Drawer`, `SegmentedButton` over `ToggleButtons`,
  `FilledButton` for a high-emphasis flat button.
- **Buttons** are styled with a `ButtonStyle`; use
  `WidgetStateProperty.resolveWith` for hover/focus/pressed/disabled states.

## Adaptive design

Respect platform norms; branch on the `MyPlatform.get` accessor rather than
`Platform.isX` directly.

- **Scrollbars:** desktop expects always-visible scrollbars, mobile only during
  scroll — toggle `thumbVisibility` on `Scrollbar`.
- **Selectable text:** on web/desktop, use `SelectableText` for read-only copy.
- **Button order:** Windows places the confirm button on the left — reverse a
  dialog's button `Row` with `TextDirection.rtl` there, `ltr` elsewhere.
- **Hover & right-click:** wrap interactive elements in `Tooltip` for hover
  states and use a context-menu package for right-click.

```dart
Row(
  textDirection:
      MyPlatform.get.isWindows ? TextDirection.rtl : TextDirection.ltr,
  mainAxisAlignment: MainAxisAlignment.end,
  children: [
    MyButton(
      text: L10n.of(context).cancel,
      onPressed: () => MyNavigator.back(result: false),
    ),
    MyButton(
      text: L10n.of(context).confirm,
      onPressed: () => MyNavigator.back(result: true),
    ),
  ],
)
```

## Core Concepts

### The `.animate()` extension

Call `.animate()` on any widget to wrap it in an `Animate` widget. Chain effects
as method calls. Effects run in parallel by default from `t=0`.

```dart
Text('Hello')
  .animate()
  .fade()      // fades in over 300ms
  .scale()     // scales up simultaneously
```

### Duration shorthand

```dart
300.ms          // Duration(milliseconds: 300)
1.5.seconds     // Duration(milliseconds: 1500)
0.1.minutes     // Duration(seconds: 6)
```

### Effect parameters

Every effect accepts:

| Parameter  | Type        | Default         | Meaning                          |
| ---------- | ----------- | --------------- | -------------------------------- |
| `delay`    | `Duration?` | `Duration.zero` | Wait before starting this effect |
| `duration` | `Duration?` | `300.ms`        | How long the effect runs         |
| `curve`    | `Curve?`    | `Curves.linear` | Easing curve                     |
| `begin`    | varies      | effect-specific | Start value                      |
| `end`      | varies      | effect-specific | End value                        |

Global defaults can be overridden:

```dart
Animate.defaultDuration = 500.ms;
Animate.defaultCurve = Curves.easeOut;
```

---

## Controller & Lifecycle

### Callbacks

```dart
widget.animate(
  onInit: (controller) {
    // AnimationController is ready; set value, add listeners
    controller.value = 0.5;
  },
  onPlay: (controller) {
    // Animation has started playing
  },
  onComplete: (controller) {
    // All effects finished
    controller.reverse(); // play backwards
  },
)
```

### External `AnimationController`

When you need programmatic control (e.g., play on button tap):

```dart
late AnimationController _controller;

@override
void initState() {
  super.initState();
  _controller = AnimationController(vsync: this);
}

@override
void dispose() {
  _controller.dispose();
  super.dispose();
}

// In build:
widget.animate(
  controller: _controller,
  autoPlay: false,
).fade().scale()

// Trigger manually:
_controller.forward();
_controller.reverse();
_controller.reset();
```

### `target` and `value`

```dart
// Jump to mid-point
widget.animate(value: 0.5).fade()

// Animate to 80% and stop
widget.animate(target: 0.8).fade()
```

---

## Timing & Sequencing

### Parallel (default)

All effects start at `t=0`:

```dart
widget.animate()
  .fade(duration: 400.ms)
  .scale(duration: 400.ms)  // runs at the same time as fade
```

### Sequential with `delay`

Start an effect after a fixed offset:

```dart
widget.animate()
  .fade(duration: 300.ms)
  .scale(delay: 300.ms, duration: 300.ms)  // starts after fade ends
```

### Sequential with `.then()`

`.then()` sets a new time baseline equal to the end of the longest effect so
far. Subsequent effects are measured from this new baseline.

```dart
widget.animate()
  .fadeIn(duration: 300.ms)    // t=0 → 300ms
  .then()                       // baseline moves to 300ms
  .shake(duration: 200.ms)      // t=300ms → 500ms
  .then(delay: 100.ms)          // baseline moves to 600ms
  .slide(duration: 400.ms)      // t=600ms → 1000ms
```

### Looping

Pass a callback to `onPlay` to loop:

```dart
widget.animate(onPlay: (c) => c.repeat())
  .shimmer(duration: 1.5.seconds)

// Reverse loop (ping-pong)
widget.animate(onPlay: (c) => c.repeat(reverse: true))
  .scale(begin: 0.95, end: 1.05, duration: 600.ms, curve: Curves.easeInOut)
```

---

## Anti-Patterns

| Anti-Pattern                                                 | Why                                                              | Fix                                                              |
| ------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Calling `.animate()` inside `build()` on every rebuild       | Creates a new `Animate` widget each time, restarting animation   | Move to a `StatefulWidget` or ensure a stable key                |
| Using `delay` when you need sequential ordering              | `delay` is absolute from `t=0`, not relative to previous effects | Use `.then()` for relative sequencing                            |
| Forgetting `onPlay: (c) => c.repeat()` for shimmer/pulse     | Animation plays once then stops                                  | Add `onPlay` callback to loop                                    |
| Using `.animate()` on `Spacer` in lists                      | `Spacer` doesn't render anything; wrapping breaks layout         | `AnimateList` ignores `Spacer` by default — don't fight it       |
| Animating expensive widgets (e.g. `CustomPaint`) repeatedly  | Causes jank                                                      | Prefer compositing effects (fade, slide) over rebuild-heavy ones |
| Building static subtrees inside an `AnimatedBuilder` builder | The whole subtree rebuilds on every animation tick               | Pass animation-independent widgets via the `child` parameter     |
| Large blur values (`blurXY(begin: 20)`)                      | Expensive ImageFilter on every frame                             | Keep blur values below `~8`; test on low-end devices             |
| Shimmer on mobile web                                        | Known Flutter limitation                                         | Use a fallback or skip shimmer on `kIsWeb`                       |

---
