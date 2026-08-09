## iOS Project Specifics

- Project file: `apps/ios/ios.xcodeproj/project.pbxproj`
- objectVersion `77` = Xcode 16+ format
- Single target: `ios` app target
- No CocoaPods or Carthage — SPM only
- Source files auto-discovered via `PBXFileSystemSynchronizedRootGroup`
- Add new Swift files by creating them in `apps/ios/ios/` — Xcode picks them up
  automatically, no PBXProj edit required
