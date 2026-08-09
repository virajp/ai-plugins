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
