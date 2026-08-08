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
