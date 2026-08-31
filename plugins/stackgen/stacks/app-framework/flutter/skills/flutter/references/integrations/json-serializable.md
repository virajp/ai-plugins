# json_serializable — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

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

## json_serializable + build_runner

Generates JSON serialization code for Flutter models with json_serializable and
build_runner — basic models, field customization, nested objects, collections,
enums, defaults, null safety, custom converters, Equatable integration, and
migrating manual fromMap/toMap.

Sections in this file:

| Section                         | When to read                                             |
| ------------------------------- | -------------------------------------------------------- |
| [Anti-Patterns](#anti-patterns) | Avoiding common json_serializable mistakes               |
| [Setup](#setup)                 | Adding the json_annotation and build_runner dependencies |

The annotation vocabulary — field customization, nested objects, collections,
enums, defaults, null-safety patterns, custom converters and Equatable
integration — is API surface. Fetch it from Context7 at use time. Where the
generator sits in the build order is in
[Build, flavors & signing](../build-flavors-signing.md).

## Setup

```yaml
dependencies:
  json_annotation:

dev_dependencies:
  build_runner: # already present
  json_serializable:
```

---
