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
