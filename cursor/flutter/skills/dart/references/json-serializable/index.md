# json_serializable + build_runner

Generates JSON serialization code for Flutter models with json_serializable and
build_runner — basic models, field customization, nested objects, collections,
enums, defaults, null safety, custom converters, Equatable integration, and
migrating manual fromMap/toMap.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                                | When to read                                             |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [Setup](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/setup.md)                                     | Adding the json_annotation and build_runner dependencies |
| [Basic Model](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/basic-model.md)                         | Annotating a plain model with fromJson/toJson            |
| [Running Code Generation](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/running-code-generation.md) | Running build_runner to generate .g.dart files           |
| [Field Customization](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/field-customization.md)         | Renaming a JSON key or excluding a field                 |
| [Nested Objects](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/nested-objects.md)                   | Serializing a model containing other models              |
| [Collections](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/collections.md)                         | Serializing lists or maps of objects                     |
| [Enums](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/enums.md)                                     | Serializing enum fields with custom or unknown values    |
| [Default Values](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/default-values.md)                   | Supplying a fallback when a JSON key is absent           |
| [Null Safety Patterns](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/null-safety-patterns.md)       | Handling nullable versus absent fields safely            |
| [Custom Converters](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/custom-converters.md)             | Serializing unsupported types like DateTime or LatLng    |
| [Equatable Integration](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/equatable-integration.md)     | Combining JsonSerializable with Equatable and copyWith   |
| [Migrating fromMap/toMap](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/migrating-frommap-tomap.md) | Replacing manual fromMap/toMap with generated code       |
| [Anti-Patterns](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/anti-patterns.md)                     | Avoiding common json_serializable mistakes               |
| [Examples](%%AI_PLUGINS_ROOT%%/skills/dart/references/json-serializable/examples.md)                               | Full build.yaml config and an all-patterns entity        |
