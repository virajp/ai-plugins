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
