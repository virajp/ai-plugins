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
