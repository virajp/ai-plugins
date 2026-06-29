## Running Code Generation

```bash
# One-time generation
dart run build_runner build --delete-conflicting-outputs

# Watch mode (re-generates on save)
dart run build_runner watch --delete-conflicting-outputs
```

Always use `--delete-conflicting-outputs` to avoid stale `.g.dart` files causing
conflicts.

Add to `Makefile` or scripts:

```bash
# scripts/generate.sh
dart run build_runner build --delete-conflicting-outputs
```

---
