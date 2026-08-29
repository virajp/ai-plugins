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

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                                | When to read                                             |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Setup                                     | Adding the json_annotation and build_runner dependencies |
| Basic Model                         | Annotating a plain model with fromJson/toJson            |
| Running Code Generation | Running build_runner to generate .g.dart files           |
| Field Customization         | Renaming a JSON key or excluding a field                 |
| Nested Objects                   | Serializing a model containing other models              |
| Collections                         | Serializing lists or maps of objects                     |
| Enums                                     | Serializing enum fields with custom or unknown values    |
| Default Values                   | Supplying a fallback when a JSON key is absent           |
| Null Safety Patterns       | Handling nullable versus absent fields safely            |
| Custom Converters             | Serializing unsupported types like DateTime or LatLng    |
| Equatable Integration     | Combining JsonSerializable with Equatable and copyWith   |
| Migrating fromMap/toMap | Replacing manual fromMap/toMap with generated code       |
| Anti-Patterns                     | Avoiding common json_serializable mistakes               |
| Examples                               | Full build.yaml config and an all-patterns entity        |

## Setup

```yaml
dependencies:
  json_annotation:

dev_dependencies:
  build_runner: # already present
  json_serializable:
```

---
