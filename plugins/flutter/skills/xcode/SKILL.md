---
name: xcode
version: 0.1.0
category: development
description: Xcode workflows for the iOS-native side of a Flutter app — build
  settings and xcconfig, schemes and configurations, code signing and
  provisioning, simctl simulator control, LLDB and SwiftUI/memory debugging,
  Instruments profiling, resolving project.pbxproj conflicts, and the xcodebuild
  CLI. Use when configuring build settings, schemes, targets, signing, running
  simulators, debugging, profiling, or running xcodebuild against an iOS project.
license: MIT
user-invocable: false
---

# Xcode Expert Skill

## Project Structure

```text
apps/ios/
├── ios.xcodeproj/              # Xcode project (PBXProj format)
│   ├── project.pbxproj         # Project settings, targets, build phases
│   └── project.xcworkspace/    # Workspace data
├── ios/                        # Source group (PBXFileSystemSynchronizedRootGroup)
│   ├── Assets.xcassets/        # App icons, colors, images
│   ├── ContentView.swift       # Root SwiftUI view
│   └── iosApp.swift            # @main entry point
```

This project uses `PBXFileSystemSynchronizedRootGroup` (Xcode 16+), which
automatically includes new files added to the `ios/` folder without manually
editing `project.pbxproj`. Just create the file in the folder — Xcode picks it
up automatically.

## Build Settings

Access via: Target > Build Settings (or project-level for defaults).

Key settings:

| Setting              | Key                              | Typical value                    |
| -------------------- | -------------------------------- | -------------------------------- |
| Swift version        | `SWIFT_VERSION`                  | `6.0`                            |
| Deployment target    | `IPHONEOS_DEPLOYMENT_TARGET`     | `17.0`                           |
| Bundle ID            | `PRODUCT_BUNDLE_IDENTIFIER`      | `com.example.app`                |
| Code sign identity   | `CODE_SIGN_IDENTITY`             | `iPhone Developer`               |
| Provisioning profile | `PROVISIONING_PROFILE_SPECIFIER` | auto or specific                 |
| Debug info           | `DEBUG_INFORMATION_FORMAT`       | `dwarf-with-dsym` (Release)      |
| Optimization         | `SWIFT_OPTIMIZATION_LEVEL`       | `-Onone` (Debug), `-O` (Release) |

Build settings resolve in order (highest wins):

1. Platform defaults
2. Project-level settings
3. Target-level settings
4. Configuration file (xcconfig)

Use xcconfig files for environment-specific overrides without touching
`project.pbxproj`:

```xcconfig
// Debug.xcconfig
SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG
OTHER_SWIFT_FLAGS = -Xfrontend -debug-constraints
```

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

## Code Signing

**Automatic signing** (recommended for development):

- Target > Signing & Capabilities > check "Automatically manage signing"
- Select your Team
- Xcode generates the provisioning profile

**Manual signing** (CI/CD):

```sh
xcodebuild \
  -scheme ios \
  -configuration Release \
  CODE_SIGN_IDENTITY="iPhone Distribution" \
  PROVISIONING_PROFILE_SPECIFIER="My Profile Name" \
  archive -archivePath build/ios.xcarchive
```

Common signing errors:

- "No matching provisioning profile" → regenerate in Apple Developer portal or
  toggle automatic signing off/on
- "Certificate not found" → import .p12 into Keychain Access
- "Team ID mismatch" → ensure bundle ID matches provisioning profile

## Simulators

```sh
# List available simulators
xcrun simctl list devices

# Boot and open simulator
xcrun simctl boot "iPhone 16 Pro"
open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app

# Install and launch app
xcrun simctl install booted path/to/app.app
xcrun simctl launch booted com.example.app

# Reset simulator (clear all data)
xcrun simctl erase "iPhone 16 Pro"
xcrun simctl erase all

# Capture screenshot / video
xcrun simctl io booted screenshot screenshot.png
xcrun simctl io booted recordVideo recording.mov

# Trigger system events
xcrun simctl push booted com.example.app payload.apns
xcrun simctl openurl booted "myapp://ride/123"
```

## Debugging

### LLDB Commands

```text
po variable          # print object description
p variable           # print with type info
e expression         # evaluate expression
bt                   # backtrace (call stack)
frame variable       # local variables in current frame
thread list          # all threads
continue / c         # resume
step / s             # step into
next / n             # step over
finish / f           # step out
```

Conditional breakpoints: right-click breakpoint > Edit Breakpoint > Condition.

Swift Error Breakpoint: Debug > Breakpoints > Add > Swift Error Breakpoint.
Catches all thrown Swift errors at the throw site.

### SwiftUI View Debugger

Debug > View Hierarchy (or camera icon in debug bar). Shows 3D exploded view of
the view tree. Use to identify clipped/hidden views, inspect frames, and find
layout issues.

Log which `@Observable` properties caused a redraw:

```swift
var body: some View {
    #if DEBUG
    let _ = Self._logChanges()
    #endif
    // ...
}
```

### Memory Debugging

Debug > Memory Graph Debugger — visualize object references, find retain cycles.
Purple `!` icons indicate leaks.

Capture `[weak self]` in closures to break retain cycles:

```swift
Task { [weak self] in
    await self?.load()
}
```

### Instruments

Launch via Product > Profile (Cmd+I). Always profile **Release** builds for
accurate data (Debug has no optimization).

Key instruments:

- **Time Profiler** — CPU usage, find hot paths
- **Allocations** — memory allocations, find leaks and growth
- **Leaks** — detect reference cycles
- **Network** — HTTP/HTTPS traffic inspection
- **SwiftUI** — view body evaluations and layout passes (Xcode 14+)

## Common Build Errors

| Error                                | Likely cause             | Fix                                        |
| ------------------------------------ | ------------------------ | ------------------------------------------ |
| "No such module 'X'"                 | SPM package not resolved | File > Packages > Resolve Package Versions |
| "Build input file cannot be found"   | Stale PBXProj reference  | Clean build folder, remove derived data    |
| "Signing certificate expired"        | Old cert                 | Renew on developer.apple.com               |
| "Ambiguous use of" / Sendable errors | Swift 6 concurrency      | Add `@MainActor` or `Sendable`             |
| "Cannot convert value of type"       | Type mismatch            | Check decoding / API types                 |

Clean derived data (fixes many mysterious build failures):

```sh
rm -rf ~/Library/Developer/Xcode/DerivedData
```

## project.pbxproj

Avoid hand-editing. Use the Xcode UI instead. If merge conflicts occur:

1. Identify conflicting sections (usually `PBXBuildFile`, `PBXFileReference`)
2. Accept both sides if both added different files
3. Validate after resolving:
   `plutil -lint apps/ios/ios.xcodeproj/project.pbxproj`

With `PBXFileSystemSynchronizedRootGroup` (this project), new Swift files added
to `apps/ios/ios/` are auto-included — no PBXProj edit needed.

## xcodebuild CLI

```sh
# Build for simulator
xcodebuild -project apps/ios/ios.xcodeproj \
  -scheme ios \
  -sdk iphonesimulator \
  -configuration Debug \
  build

# Run tests on simulator
xcodebuild -project apps/ios/ios.xcodeproj \
  -scheme ios \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro' \
  test

# Archive for distribution
xcodebuild -project apps/ios/ios.xcodeproj \
  -scheme ios \
  -configuration Release \
  archive -archivePath build/ios.xcarchive
```

## iOS Project Specifics

- Project file: `apps/ios/ios.xcodeproj/project.pbxproj`
- objectVersion `77` = Xcode 16+ format
- Single target: `ios` app target
- No CocoaPods or Carthage — SPM only
- Source files auto-discovered via `PBXFileSystemSynchronizedRootGroup`
- Add new Swift files by creating them in `apps/ios/ios/` — Xcode picks them up
  automatically, no PBXProj edit required
