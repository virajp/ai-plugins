## Anti-Patterns

| Anti-Pattern                                  | Why                                                                      | Fix                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------- |
| Forgetting `explicitToJson: true`             | Nested objects serialize as `Instance of 'X'`                            | Add to class annotation or `build.yaml` globally    |
| Committing `.g.dart` files                    | Merge conflicts on every model change                                    | Add `*.g.dart` to `.gitignore`; generate in CI      |
| Not using `--delete-conflicting-outputs`      | Old `.g.dart` files cause build errors after renames                     | Always pass this flag                               |
| Casting in `fromJson` (`map['id'] as String`) | `json_serializable` handles this; manual casts are redundant and fragile | Remove manual casts; let the generator handle types |
| Missing `part` declaration                    | Build fails with "Target of URI doesn't exist"                           | Add `part 'filename.g.dart';` below imports         |
| Using `dynamic` fields without a converter    | Type safety lost                                                         | Define a `JsonConverter` for non-standard types     |

---
