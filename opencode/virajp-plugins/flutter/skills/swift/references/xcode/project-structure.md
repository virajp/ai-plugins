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
