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
