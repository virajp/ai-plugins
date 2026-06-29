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
