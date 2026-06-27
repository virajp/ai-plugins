---
name: json-serializable
version: 0.1.0
category: development
description: Generates JSON serialization code for Flutter models with
  json_serializable and build_runner — basic models, field customization, nested
  objects, collections, enums, defaults, null safety, custom converters,
  Equatable integration, and migrating manual fromMap/toMap. Use when adding new
  model classes, migrating manual serialization, or regenerating after model
  changes.
license: MIT
user-invocable: false
---

# json_serializable + build_runner

## Contents

- [Setup](#setup)
- [Basic Model](#basic-model)
- [Running Code Generation](#running-code-generation)
- [Field Customization](#field-customization)
- [Nested Objects](#nested-objects)
- [Collections](#collections)
- [Enums](#enums)
- [Default Values](#default-values)
- [Null Safety Patterns](#null-safety-patterns)
- [Custom Converters](#custom-converters)
- [Equatable Integration](#equatable-integration)
- [Migrating fromMap/toMap](#migrating-frommaptomap)
- [Anti-Patterns](#anti-patterns)
- [Examples](#examples)

---

## Setup

```yaml
dependencies:
  json_annotation:

dev_dependencies:
  build_runner: # already present
  json_serializable:
```

---

## Basic Model

```dart
import 'package:json_annotation/json_annotation.dart';

part 'user_entity.g.dart';

@JsonSerializable()
class UserEntity {
  final String id;
  final String name;
  final String email;
  final String? photoUrl;

  const UserEntity({
    required this.id,
    required this.name,
    required this.email,
    this.photoUrl,
  });

  factory UserEntity.fromJson(Map<String, dynamic> json) =>
      _$UserEntityFromJson(json);

  Map<String, dynamic> toJson() => _$UserEntityToJson(this);
}
```

The generated `_$UserEntityFromJson` and `_$UserEntityToJson` functions live in
the `.g.dart` part file.

---

## Running Code Generation

```bash
# One-time generation
dart run build_runner build --delete-conflicting-outputs

# Watch mode (re-generates on save)
dart run build_runner watch --delete-conflicting-outputs
```

Always use `--delete-conflicting-outputs` to avoid stale `.g.dart` files causing
conflicts.

Add to `Makefile` or scripts:

```bash
# scripts/generate.sh
dart run build_runner build --delete-conflicting-outputs
```

---

## Field Customization

```dart
@JsonSerializable()
class RideEntity {
  // Map JSON key 'ride_id' → Dart field 'id'
  @JsonKey(name: 'ride_id')
  final String id;

  // Exclude from serialization (write-only in constructor, never serialized)
  @JsonKey(includeFromJson: false, includeToJson: false)
  final bool isLocal;

  // Include only in toJson (not read from JSON)
  @JsonKey(includeFromJson: false)
  final DateTime? lastModifiedLocally;

  // Include only in fromJson (not written to JSON)
  @JsonKey(includeToJson: false)
  final String? serverOnlyField;

  const RideEntity({
    required this.id,
    this.isLocal = false,
    this.lastModifiedLocally,
    this.serverOnlyField,
  });

  factory RideEntity.fromJson(Map<String, dynamic> json) =>
      _$RideEntityFromJson(json);

  Map<String, dynamic> toJson() => _$RideEntityToJson(this);
}
```

---

## Nested Objects

```dart
@JsonSerializable(explicitToJson: true) // required for nested objects
class RideEntity {
  final String id;
  final UserEntity creator;          // nested object
  final LocationEntity startPoint;   // nested object

  const RideEntity({
    required this.id,
    required this.creator,
    required this.startPoint,
  });

  factory RideEntity.fromJson(Map<String, dynamic> json) =>
      _$RideEntityFromJson(json);

  Map<String, dynamic> toJson() => _$RideEntityToJson(this);
}
```

> `explicitToJson: true` is required whenever a field is itself a
> `@JsonSerializable` class — otherwise nested objects are serialized as
> `Instance of 'UserEntity'`.

Set as the global default in `build.yaml` (project root):

```yaml
targets:
  $default:
    builders:
      json_serializable:
        options:
          explicit_to_json: true
```

---

## Collections

```dart
@JsonSerializable(explicitToJson: true)
class RideEntity {
  final List<UserEntity> participants;
  final List<String> tags;
  final Map<String, dynamic> metadata;

  const RideEntity({
    required this.participants,
    required this.tags,
    required this.metadata,
  });

  factory RideEntity.fromJson(Map<String, dynamic> json) =>
      _$RideEntityFromJson(json);

  Map<String, dynamic> toJson() => _$RideEntityToJson(this);
}
```

---

## Enums

```dart
// Simple enum — serializes as the enum name string
@JsonEnum()
enum RideStatus { upcoming, active, completed, cancelled }

// Custom values — serializes as the specified value
@JsonEnum(valueField: 'value')
enum RideStatus {
  upcoming('upcoming'),
  active('active'),
  completed('completed'),
  cancelled('cancelled');

  const RideStatus(this.value);
  final String value;
}

// In model — unknown values become null instead of throwing
@JsonSerializable()
class RideEntity {
  @JsonKey(unknownEnumValue: JsonKey.nullForUndefinedEnumValue)
  final RideStatus? status;
  // ...
}
```

---

## Default Values

```dart
@JsonSerializable()
class RideEntity {
  // Default when JSON key is absent or null
  @JsonKey(defaultValue: false)
  final bool isPrivate;

  @JsonKey(defaultValue: <String>[])
  final List<String> tags;

  @JsonKey(defaultValue: 0)
  final int participantCount;

  const RideEntity({
    required this.isPrivate,
    required this.tags,
    required this.participantCount,
  });

  factory RideEntity.fromJson(Map<String, dynamic> json) =>
      _$RideEntityFromJson(json);

  Map<String, dynamic> toJson() => _$RideEntityToJson(this);
}
```

---

## Null Safety Patterns

```dart
@JsonSerializable()
class UserEntity {
  final String id;
  final String? displayName;      // nullable — absent key → null

  // If key may be absent entirely (not just null), use defaultValue
  @JsonKey(defaultValue: '')
  final String bio;

  const UserEntity({required this.id, this.displayName, required this.bio});

  factory UserEntity.fromJson(Map<String, dynamic> json) =>
      _$UserEntityFromJson(json);

  Map<String, dynamic> toJson() => _$UserEntityToJson(this);
}
```

---

## Custom Converters

For types not natively supported (e.g., `DateTime` as Unix timestamp, `LatLng`,
`Color`):

```dart
class TimestampConverter implements JsonConverter<DateTime, int> {
  const TimestampConverter();

  @override
  DateTime fromJson(int json) =>
      DateTime.fromMillisecondsSinceEpoch(json, isUtc: true);

  @override
  int toJson(DateTime object) => object.millisecondsSinceEpoch;
}

@JsonSerializable()
class RideEntity {
  @TimestampConverter()
  final DateTime startTime;

  @TimestampConverter()
  final DateTime? endTime;

  const RideEntity({required this.startTime, this.endTime});

  factory RideEntity.fromJson(Map<String, dynamic> json) =>
      _$RideEntityFromJson(json);

  Map<String, dynamic> toJson() => _$RideEntityToJson(this);
}
```

Apply a converter globally via
`@JsonSerializable(converters: [TimestampConverter()])` or per-field via
`@TimestampConverter()`.

---

## Equatable Integration

```dart
import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';

part 'user_entity.g.dart';

@JsonSerializable()
class UserEntity extends Equatable {
  final String id;
  final String name;
  final String email;

  const UserEntity({
    required this.id,
    required this.name,
    required this.email,
  });

  @override
  List<Object?> get props => [id, name, email];

  factory UserEntity.fromJson(Map<String, dynamic> json) =>
      _$UserEntityFromJson(json);

  Map<String, dynamic> toJson() => _$UserEntityToJson(this);

  UserEntity copyWith({String? id, String? name, String? email}) {
    return UserEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
    );
  }
}
```

---

## Migrating fromMap/toMap

For each existing model with manual serialization:

**Before:**

```dart
class UserEntity {
  final String id;
  final String name;

  UserEntity({required this.id, required this.name});

  factory UserEntity.fromMap(Map<String, dynamic> map) {
    return UserEntity(
      id: map['id'] as String,
      name: map['name'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() => {'id': id, 'name': name};
}
```

**After:**

```dart
import 'package:json_annotation/json_annotation.dart';

part 'user_entity.g.dart';

@JsonSerializable()
class UserEntity {
  final String id;

  @JsonKey(defaultValue: '')
  final String name;

  const UserEntity({required this.id, required this.name});

  factory UserEntity.fromJson(Map<String, dynamic> json) =>
      _$UserEntityFromJson(json);

  Map<String, dynamic> toJson() => _$UserEntityToJson(this);
}
```

### Call-site migration

```dart
// Before
final user = UserEntity.fromMap(data);
final map = user.toMap();

// After
final user = UserEntity.fromJson(data);
final map = user.toJson();
```

If callers are spread across many files, keep both:

```dart
// Backwards-compatible bridge during migration
factory UserEntity.fromMap(Map<String, dynamic> map) =>
    UserEntity.fromJson(map);
Map<String, dynamic> toMap() => toJson();
```

---

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

## Examples

### `build.yaml` (project root — global defaults)

```yaml
targets:
  $default:
    builders:
      json_serializable:
        options:
          explicit_to_json: true
          checked: true # runtime type checking in debug
          field_rename: none # or snake_case to auto-rename all fields
```

### Full entity with all patterns

```dart
import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';

part 'ride_entity.g.dart';

@JsonEnum(valueField: 'value')
enum RideStatus {
  upcoming('upcoming'),
  active('active'),
  completed('completed');

  const RideStatus(this.value);
  final String value;
}

@JsonSerializable(explicitToJson: true)
class RideEntity extends Equatable {
  final String id;
  final String title;
  final UserEntity creator;
  final List<UserEntity> participants;

  @JsonKey(name: 'start_time')
  @TimestampConverter()
  final DateTime startTime;

  @JsonKey(unknownEnumValue: JsonKey.nullForUndefinedEnumValue)
  final RideStatus? status;

  @JsonKey(defaultValue: false)
  final bool isPrivate;

  const RideEntity({
    required this.id,
    required this.title,
    required this.creator,
    required this.participants,
    required this.startTime,
    this.status,
    required this.isPrivate,
  });

  @override
  List<Object?> get props => [id, title, startTime, status];

  factory RideEntity.fromJson(Map<String, dynamic> json) =>
      _$RideEntityFromJson(json);

  Map<String, dynamic> toJson() => _$RideEntityToJson(this);

  RideEntity copyWith({
    String? title,
    RideStatus? status,
    bool? isPrivate,
  }) {
    return RideEntity(
      id: id,
      title: title ?? this.title,
      creator: creator,
      participants: participants,
      startTime: startTime,
      status: status ?? this.status,
      isPrivate: isPrivate ?? this.isPrivate,
    );
  }
}
```
