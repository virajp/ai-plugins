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
