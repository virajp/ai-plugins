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
