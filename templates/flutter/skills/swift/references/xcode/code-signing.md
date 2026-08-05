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
