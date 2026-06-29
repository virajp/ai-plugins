## project.pbxproj

Avoid hand-editing. Use the Xcode UI instead. If merge conflicts occur:

1. Identify conflicting sections (usually `PBXBuildFile`, `PBXFileReference`)
2. Accept both sides if both added different files
3. Validate after resolving:
   `plutil -lint apps/ios/ios.xcodeproj/project.pbxproj`

With `PBXFileSystemSynchronizedRootGroup` (this project), new Swift files added
to `apps/ios/ios/` are auto-included — no PBXProj edit needed.
