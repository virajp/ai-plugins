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
