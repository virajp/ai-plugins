## Anti-Patterns

| Anti-Pattern                                       | Why                                                                                    | Fix                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Not null-checking the returned `XFile`             | Returns `null` on cancel — causes NPE                                                  | Always null-check before using                                           |
| Uploading full-resolution camera photos            | 12 MP photos can be 8+ MB                                                              | Set `maxWidth`, `maxHeight`, `imageQuality`                              |
| Using `File(xfile.path)` on web                    | `dart:io` `File` doesn't work on Flutter web                                           | Use `xfile.readAsBytes()` for cross-platform                             |
| Blocking the UI while cropping                     | Cropper is launched as a new screen; callers await it fine — don't run it in `compute` | Let the cropper UI run normally                                          |
| Creating a new `ImagePicker()` instance everywhere | Wasteful; better to share                                                              | Inject or use a singleton/service                                        |
| Not requesting permissions separately              | On older Android, `pickImage` can silently fail                                        | Use `permission_handler` to request storage/camera permissions if needed |

---
