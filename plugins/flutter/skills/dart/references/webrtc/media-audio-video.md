## Media (Audio / Video)

```dart
import 'package:flutter_webrtc/flutter_webrtc.dart';

// Audio only (intercom)
final stream = await navigator.mediaDevices.getUserMedia({
  'audio': true,
  'video': false,
});

// Audio + video
final stream = await navigator.mediaDevices.getUserMedia({
  'audio': true,
  'video': {
    'facingMode': 'user',    // 'user' = front, 'environment' = back
    'width': {'ideal': 1280},
    'height': {'ideal': 720},
  },
});

// Access tracks
final audioTrack = stream.getAudioTracks().first;
final videoTrack = stream.getVideoTracks().first;

// Stop all tracks (release mic/camera)
stream.getTracks().forEach((t) => t.stop());
await stream.dispose();
```

### Enumerate devices

```dart
final devices = await navigator.mediaDevices.enumerateDevices();
for (final device in devices) {
  print('${device.kind}: ${device.label} (${device.deviceId})');
  // kinds: audioinput, audiooutput, videoinput
}
```

---
