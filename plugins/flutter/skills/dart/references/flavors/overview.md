## Overview

A typical setup uses two flavors:

| Flavor | Bundle ID (iOS)       | App ID (Android)      | Firebase Project |
| ------ | --------------------- | --------------------- | ---------------- |
| `dev`  | `com.example.app.dev` | `com.example.app.dev` | `myapp-dev`      |
| `prod` | `com.example.app`     | `com.example.app`     | `myapp-prod`     |

Each flavor gets its own:

- Firebase `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
- App name and icon (optional — e.g., "My App DEV" vs "My App")
- API base URL and feature flags

---
