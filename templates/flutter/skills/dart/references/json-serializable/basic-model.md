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
