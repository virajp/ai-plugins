# WebRTC — integration wiring

**Wiring, platform configuration and anti-patterns only.** The API surface is Context7's at use time, and is the half that ages — this reference carries the setup order and platform configuration a per-package lookup gives only piecemeal.

## Anti-Patterns

| Anti-Pattern                                          | Why                                                                               | Fix                                                                      |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Not adding `'sdpSemantics': 'unified-plan'` to config | Default plan-b is deprecated and causes issues on newer browsers/devices          | Always include `unified-plan`                                            |
| Forgetting to dispose streams and peer connections    | Mic/camera stay active; memory and battery leak                                   | `stream.dispose()` and `pc.close()` in `onClose`                         |
| No TURN server in production                          | ~15–20% of connections fail without TURN (symmetric NAT)                          | Add a TURN server; Cloudflare Calls or Twilio TURN are easy options      |
| Adding ICE candidates before `setRemoteDescription`   | Candidates are ignored; call fails to connect                                     | Queue candidates and add them only after remote description is set       |
| Using plan-b SDP semantics                            | Deprecated, inconsistent across platforms                                         | Use `unified-plan`                                                       |
| Sharing one `RTCPeerConnection` for multiple peers    | Tracks and negotiation become entangled                                           | One `RTCPeerConnection` per peer pair                                    |
| Not handling `iceRestart` on failure                  | Call stays broken after network change                                            | Detect `failed` state and trigger ICE restart                            |
| Skipping `audio_session` on iOS                       | Wrong audio route (earpiece vs speaker), no echo cancellation, music doesn't duck | Configure `audio_session` with `voiceChat` mode before starting the call |
| Not releasing mic on call end                         | Other apps can't access mic; iOS shows orange indicator                           | Call `track.stop()` and `stream.dispose()` on hangup                     |

---

## flutter_webrtc

Building real-time audio/video communication in a Flutter app with
flutter_webrtc — permission/manifest setup, RTCPeerConnection and media streams,
signaling over WebSockets, the full offer/answer call flow, full-mesh group
calls, iOS audio_session routing, mute/speaker/camera toggles, and ICE
reconnection.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                               | When to read                                                          |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Setup                                               | Dependencies, Android/iOS permissions, background audio modes         |
| Core Concepts                               | WebRTC does NOT define signaling                                      |
| Media (Audio / Video)                   | getUserMedia constraints, tracks, device enumeration                  |
| RTCPeerConnection                       | ICE/TURN config and connection event handlers                         |
| Signaling                                       | WebRTC requires exchanging two things out-of-band                     |
| Full Call Flow                             | End-to-end offer/answer caller and callee code                        |
| Group Calls (Mesh)                       | For a group intercom (all participants in a session), use a full-mesh |
| Audio Session Integration       | iOS audio routing, Bluetooth, echo cancellation via audio_session     |
| Mute / Speaker / Camera Toggle | Toggling mic, speakerphone, camera; replacing tracks                  |
| Reconnection                                 | ICE can fail transiently                                              |
| Anti-Patterns                               | Common WebRTC pitfalls and their fixes                                |
| Examples                                         | Full GetX mesh intercom service and UI                                |

## Setup

```yaml
dependencies:
  flutter_webrtc:
  # audio_session: # for routing audio to earpiece/speaker on iOS
```

### Android — `android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

Minimum SDK must be 24+:

```groovy
defaultConfig {
  minSdkVersion 24
}
```

### iOS — `Info.plist`

```xml
<key>NSCameraUsageDescription</key>
<string>Camera is used for video calls.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone is used for voice communication during calls.</string>
```

### iOS — Background Audio

For intercom to continue while the app is backgrounded, add to `Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
  <string>voip</string>
</array>
```

---
