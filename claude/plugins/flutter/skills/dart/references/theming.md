# Theming & Adaptive Design

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
