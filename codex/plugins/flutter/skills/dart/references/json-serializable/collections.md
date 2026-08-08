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
