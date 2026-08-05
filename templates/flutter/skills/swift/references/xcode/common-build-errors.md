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
