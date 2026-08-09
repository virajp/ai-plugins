## Audio Session Integration

On iOS, routing audio correctly (earpiece vs speaker, handling Bluetooth
headsets, ducking other audio) requires `audio_session`:

```dart
import 'package:audio_session/audio_session.dart';

Future<void> configureAudioForCall() async {
  final session = await AudioSession.instance;

  await session.configure(const AudioSessionConfiguration(
    avAudioSessionCategory: AVAudioSessionCategory.playAndRecord,
    avAudioSessionCategoryOptions:
        AVAudioSessionCategoryOptions.allowBluetooth |
        AVAudioSessionCategoryOptions.defaultToSpeaker,
    avAudioSessionMode: AVAudioSessionMode.voiceChat, // enables echo cancellation
    avAudioSessionRouteSharingPolicy:
        AVAudioSessionRouteSharingPolicy.defaultPolicy,
    androidAudioAttributes: AndroidAudioAttributes(
      contentType: AndroidAudioContentType.speech,
      flags: AndroidAudioFlags.none,
      usage: AndroidAudioUsage.voiceCommunication,
    ),
    androidAudioFocusGainType: AndroidAudioFocusGainType.gain,
    androidWillPauseWhenDucked: true,
  ));

  await session.setActive(true);
}

Future<void> deactivateAudioSession() async {
  final session = await AudioSession.instance;
  await session.setActive(false);
}
```

Call `configureAudioForCall()` when the call starts and
`deactivateAudioSession()` when it ends.

---
