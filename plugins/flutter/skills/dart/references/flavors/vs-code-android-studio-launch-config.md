## VS Code / Android Studio Launch Config

### VS Code — `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "DEV",
      "request": "launch",
      "type": "dart",
      "flutterMode": "debug",
      "program": "lib/main_dev.dart",
      "args": ["--flavor", "dev"]
    },
    {
      "name": "PROD",
      "request": "launch",
      "type": "dart",
      "flutterMode": "debug",
      "program": "lib/main_prod.dart",
      "args": ["--flavor", "prod"]
    }
  ]
}
```

### Android Studio — Run Configurations

Edit **Run/Debug Configurations** → Add Flutter configuration:

- **Dart entrypoint:** `lib/main_dev.dart`
- **Additional run args:** `--flavor dev`

---
