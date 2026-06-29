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
