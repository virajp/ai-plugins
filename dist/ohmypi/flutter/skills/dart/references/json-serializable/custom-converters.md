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
