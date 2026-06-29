## Schemes & Configurations

Default configurations: **Debug** and **Release**. Add more (e.g., Staging) via
Product > Scheme > Edit Scheme, or Project > Info > Configurations.

Scheme controls:

- **Build**: which targets to build and in what order
- **Run**: launch arguments, environment variables, diagnostics
- **Test**: test targets and plans
- **Profile**: typically Release config for accurate Instruments data
- **Archive**: always Release config

Add launch arguments in scheme for feature flags:

```text
Product > Scheme > Edit Scheme > Run > Arguments
-FlagName YES
```

Access in code:

```swift
if ProcessInfo.processInfo.arguments.contains("-FlagName") { ... }
```
