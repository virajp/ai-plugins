## Mute / Speaker / Camera Toggle

```dart
// Mute local audio
void setMuted(bool muted) {
  localStream.getAudioTracks().forEach((t) => t.enabled = !muted);
}

// Toggle speaker (mobile)
Future<void> setSpeakerOn(bool enabled) async {
  await Helper.setSpeakerphoneOn(enabled);
}

// Switch camera (front/back)
Future<void> switchCamera() async {
  final videoTrack = localStream.getVideoTracks().first;
  await Helper.switchCamera(videoTrack);
}

// Stop/start local video
void setVideoEnabled(bool enabled) {
  localStream.getVideoTracks().forEach((t) => t.enabled = enabled);
}

// Replace audio track (e.g., after device change)
Future<void> replaceAudioTrack(MediaStreamTrack newTrack) async {
  final senders = await pc.getSenders();
  for (final sender in senders) {
    if (sender.track?.kind == 'audio') {
      await sender.replaceTrack(newTrack);
      break;
    }
  }
}
```

---
