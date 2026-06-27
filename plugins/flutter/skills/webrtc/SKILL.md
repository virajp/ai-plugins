---
name: webrtc
version: 0.1.0
category: development
description: Building real-time audio/video communication in a Flutter app with
  flutter_webrtc — permission/manifest setup, RTCPeerConnection and media
  streams, signaling over WebSockets, the full offer/answer call flow, full-mesh
  group calls, iOS audio_session routing, mute/speaker/camera toggles, and ICE
  reconnection. Use when implementing peer-to-peer intercom, group voice calls,
  signaling, managing media streams, or handling ICE negotiation.
license: MIT
user-invocable: false
---

# flutter_webrtc

## Contents

- [Setup](#setup)
- [Core Concepts](#core-concepts)
- [Media (Audio / Video)](#media-audio--video)
- [RTCPeerConnection](#rtcpeerconnection)
- [Signaling](#signaling)
- [Full Call Flow](#full-call-flow)
- [Group Calls (Mesh)](#group-calls-mesh)
- [Audio Session Integration](#audio-session-integration)
- [Mute / Speaker / Camera Toggle](#mute--speaker--camera-toggle)
- [Reconnection](#reconnection)
- [Anti-Patterns](#anti-patterns)
- [Examples](#examples)

---

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

## Core Concepts

| Term                      | What it is                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| **RTCPeerConnection**     | The main object. Manages the ICE/DTLS/SRTP handshake and media transport between two peers |
| **MediaStream**           | A collection of audio/video tracks captured from the device                                |
| **RTCSessionDescription** | An SDP offer or answer that describes the call's codecs, formats, and transport            |
| **ICE candidate**         | A network address candidate used to establish the best path between peers                  |
| **Signaling**             | Your own channel (WebSocket, Firebase, REST) used to exchange SDPs and ICE candidates      |
| **STUN**                  | Helps peers discover their public IP behind NAT                                            |
| **TURN**                  | Relays media when direct peer-to-peer is blocked (required for production)                 |

WebRTC does NOT define signaling. You implement it.

---

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

## RTCPeerConnection

### Configuration

```dart
final config = {
  'iceServers': [
    {'urls': 'stun:stun.l.google.com:19302'},
    // TURN server — required for production reliability
    {
      'urls': 'turn:turn.example.com:3478',
      'username': 'username',
      'credential': 'password',
    },
  ],
  'sdpSemantics': 'unified-plan',  // required
};

final constraints = {
  'mandatory': {},
  'optional': [
    {'DtlsSrtpKeyAgreement': true},
  ],
};

final pc = await createPeerConnection(config, constraints);
```

### Event handlers

```dart
// Remote stream arrived
pc.onTrack = (RTCTrackEvent event) {
  if (event.streams.isNotEmpty) {
    remoteStream = event.streams.first;
    // Attach to RTCVideoRenderer for video, or just play audio
  }
};

// ICE candidate discovered — send to remote peer via signaling
pc.onIceCandidate = (RTCIceCandidate candidate) {
  signalingChannel.send({
    'type': 'candidate',
    'candidate': candidate.toMap(),
  });
};

// Connection state
pc.onConnectionState = (RTCPeerConnectionState state) {
  print('Connection: $state');
  // states: new, connecting, connected, disconnected, failed, closed
};

// ICE connection state (lower-level)
pc.onIceConnectionState = (RTCIceConnectionState state) {
  print('ICE: $state');
};

// Signaling state
pc.onSignalingState = (RTCSignalingState state) {
  print('Signaling: $state');
};
```

---

## Signaling

WebRTC requires exchanging two things out-of-band:

1. **SDP offer/answer** — describes media capabilities
2. **ICE candidates** — describes network paths

You need a signaling server. Common options:

- **Firebase Firestore / Realtime Database** — easiest for existing Firebase
  apps
- **WebSocket server** — lower latency
- **REST + FCM** — for wake-from-background

### Signaling message structure

```dart
// Offer
{'type': 'offer', 'sdp': sdp.sdp, 'roomId': roomId, 'from': userId}

// Answer
{'type': 'answer', 'sdp': sdp.sdp, 'roomId': roomId, 'from': userId}

// ICE candidate
{'type': 'candidate', 'candidate': candidate.candidate,
 'sdpMid': candidate.sdpMid, 'sdpMLineIndex': candidate.sdpMLineIndex,
 'roomId': roomId, 'from': userId}

// Hangup
{'type': 'hangup', 'roomId': roomId, 'from': userId}
```

---

## Full Call Flow

```text
Caller                      Signaling Server             Callee
  |                               |                         |
  |-- getUserMedia() -----------> |                         |
  |-- createPeerConnection() ---> |                         |
  |-- addTrack(localStream) ----> |                         |
  |-- createOffer() ------------> |                         |
  |-- setLocalDescription(offer)->|                         |
  |-- send(offer) --------------> | ------ offer ---------> |
  |                               |          |              |
  |                               |  createPeerConnection() |
  |                               |  setRemoteDesc(offer)   |
  |                               |  getUserMedia()         |
  |                               |  addTrack(localStream)  |
  |                               |  createAnswer()         |
  |                               |  setLocalDesc(answer)   |
  |<----- answer ----------------- | <--- send(answer) ----- |
  |-- setRemoteDesc(answer) ----> |                         |
  |                               |                         |
  |-- onIceCandidate -----------> | -- candidate ---------> |
  |<------------------------------ | <-- candidate --------- |
  |                               |                         |
  |<========= media flows ======================>|          |
```

### Caller side

```dart
// 1. Get local media
localStream = await navigator.mediaDevices.getUserMedia({'audio': true, 'video': false});

// 2. Create peer connection
pc = await createPeerConnection(config);

// 3. Add local tracks
localStream.getTracks().forEach((track) {
  pc.addTrack(track, localStream);
});

// 4. Handle remote track
pc.onTrack = (event) {
  remoteStream = event.streams.first;
};

// 5. ICE candidates → signaling
pc.onIceCandidate = (candidate) {
  signaling.send({'type': 'candidate', ...candidate.toMap()});
};

// 6. Create and send offer
final offer = await pc.createOffer({'offerToReceiveAudio': true});
await pc.setLocalDescription(offer);
signaling.send({'type': 'offer', 'sdp': offer.sdp});

// 7. On answer received
final answer = RTCSessionDescription(answerSdp, 'answer');
await pc.setRemoteDescription(answer);

// 8. On remote ICE candidate received
final candidate = RTCIceCandidate(
  data['candidate'], data['sdpMid'], data['sdpMLineIndex'],
);
await pc.addCandidate(candidate);
```

### Callee side

```dart
// On offer received:
pc = await createPeerConnection(config);
localStream = await navigator.mediaDevices.getUserMedia({'audio': true, 'video': false});
localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

pc.onTrack = (event) => remoteStream = event.streams.first;
pc.onIceCandidate = (c) => signaling.send({'type': 'candidate', ...c.toMap()});

final offer = RTCSessionDescription(offerSdp, 'offer');
await pc.setRemoteDescription(offer);

final answer = await pc.createAnswer({'offerToReceiveAudio': true});
await pc.setLocalDescription(answer);
signaling.send({'type': 'answer', 'sdp': answer.sdp});
```

---

## Group Calls (Mesh)

For a group intercom (all participants in a session), use a **full-mesh**
topology: each peer connects directly to every other peer. This works well up to
~6 participants.

```dart
// Per remote peer, maintain a separate RTCPeerConnection
final Map<String, RTCPeerConnection> _peers = {};

Future<void> addPeer(String peerId, {required bool isInitiator}) async {
  final pc = await createPeerConnection(config);
  _peers[peerId] = pc;

  // Add local tracks to this peer connection
  localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

  pc.onTrack = (event) => _onRemoteTrack(peerId, event);
  pc.onIceCandidate = (c) => signaling.sendTo(peerId, {'type': 'candidate', ...c.toMap()});
  pc.onConnectionState = (state) => _onPeerState(peerId, state);

  if (isInitiator) {
    final offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    signaling.sendTo(peerId, {'type': 'offer', 'sdp': offer.sdp});
  }
}

Future<void> removePeer(String peerId) async {
  await _peers[peerId]?.close();
  _peers.remove(peerId);
  _remoteStreams.remove(peerId);
}
```

> For >6 participants, use an SFU (Selective Forwarding Unit) like LiveKit,
> mediasoup, or Janus instead of mesh.

---

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

## Reconnection

ICE can fail transiently. Handle `disconnected` and `failed` states:

```dart
pc.onConnectionState = (RTCPeerConnectionState state) {
  switch (state) {
    case RTCPeerConnectionState.RTCPeerConnectionStateDisconnected:
      // Transient — wait up to 5s for ICE to recover automatically
      _startReconnectTimer();
    case RTCPeerConnectionState.RTCPeerConnectionStateFailed:
      // Permanent failure — restart ICE or recreate the connection
      _restartIce();
    case RTCPeerConnectionState.RTCPeerConnectionStateConnected:
      _cancelReconnectTimer();
    default:
  }
};

Future<void> _restartIce() async {
  // ICE restart: create a new offer with iceRestart: true
  final offer = await pc.createOffer({'iceRestart': true});
  await pc.setLocalDescription(offer);
  signaling.send({'type': 'offer', 'sdp': offer.sdp, 'iceRestart': true});
}
```

---

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

## Examples

### Intercom service (GetX — audio only, mesh group)

```dart
class IntercomService extends GetxService {
  static IntercomService get to => Get.find();

  final isInCall = false.obs;
  final isMuted = false.obs;
  final isSpeakerOn = false.obs;
  final connectedPeers = <String>[].obs;

  MediaStream? _localStream;
  final _peers = <String, RTCPeerConnection>{};

  final _iceConfig = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'turn:turn.example.com:3478', 'username': 'u', 'credential': 'p'},
    ],
    'sdpSemantics': 'unified-plan',
  };

  Future<IntercomService> init() async => this;

  Future<void> joinRoom(String roomId) async {
    await _acquireMedia();
    await _configureAudio();
    isInCall.value = true;
    // Subscribe to signaling channel for roomId
    // SignalingService.to.joinRoom(roomId, onMessage: _handleSignal);
  }

  Future<void> _acquireMedia() async {
    _localStream = await navigator.mediaDevices.getUserMedia({
      'audio': true,
      'video': false,
    });
  }

  Future<void> addPeer(String peerId, {required bool isInitiator}) async {
    final pc = await createPeerConnection(_iceConfig);
    _peers[peerId] = pc;

    _localStream!.getTracks().forEach((t) => pc.addTrack(t, _localStream!));

    pc.onTrack = (event) {
      // Remote audio plays automatically when track is received
    };

    pc.onIceCandidate = (c) {
      // SignalingService.to.sendTo(peerId, {'type': 'candidate', ...c.toMap()});
    };

    pc.onConnectionState = (state) {
      if (state == RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
        if (!connectedPeers.contains(peerId)) connectedPeers.add(peerId);
      } else if (state == RTCPeerConnectionState.RTCPeerConnectionStateFailed) {
        _restartIce(peerId);
      } else if (state == RTCPeerConnectionState.RTCPeerConnectionStateDisconnected) {
        connectedPeers.remove(peerId);
      }
    };

    if (isInitiator) {
      final offer = await pc.createOffer({'offerToReceiveAudio': true});
      await pc.setLocalDescription(offer);
      // SignalingService.to.sendTo(peerId, {'type': 'offer', 'sdp': offer.sdp});
    }
  }

  Future<void> _handleSignal(String fromPeerId, Map<String, dynamic> data) async {
    switch (data['type']) {
      case 'offer':
        await addPeer(fromPeerId, isInitiator: false);
        final pc = _peers[fromPeerId]!;
        await pc.setRemoteDescription(RTCSessionDescription(data['sdp'], 'offer'));
        final answer = await pc.createAnswer({'offerToReceiveAudio': true});
        await pc.setLocalDescription(answer);
        // SignalingService.to.sendTo(fromPeerId, {'type': 'answer', 'sdp': answer.sdp});

      case 'answer':
        await _peers[fromPeerId]?.setRemoteDescription(
          RTCSessionDescription(data['sdp'], 'answer'),
        );

      case 'candidate':
        await _peers[fromPeerId]?.addCandidate(
          RTCIceCandidate(data['candidate'], data['sdpMid'], data['sdpMLineIndex']),
        );

      case 'hangup':
        await removePeer(fromPeerId);
    }
  }

  Future<void> removePeer(String peerId) async {
    await _peers[peerId]?.close();
    _peers.remove(peerId);
    connectedPeers.remove(peerId);
  }

  Future<void> leaveRoom() async {
    for (final peerId in List.of(_peers.keys)) {
      await removePeer(peerId);
    }
    _localStream?.getTracks().forEach((t) => t.stop());
    await _localStream?.dispose();
    _localStream = null;
    await _deactivateAudio();
    isInCall.value = false;
    isMuted.value = false;
  }

  void toggleMute() {
    isMuted.value = !isMuted.value;
    _localStream?.getAudioTracks().forEach((t) => t.enabled = !isMuted.value);
  }

  Future<void> toggleSpeaker() async {
    isSpeakerOn.value = !isSpeakerOn.value;
    await Helper.setSpeakerphoneOn(isSpeakerOn.value);
  }

  Future<void> _restartIce(String peerId) async {
    final pc = _peers[peerId];
    if (pc == null) return;
    final offer = await pc.createOffer({'iceRestart': true});
    await pc.setLocalDescription(offer);
    // SignalingService.to.sendTo(peerId, {'type': 'offer', 'sdp': offer.sdp, 'iceRestart': true});
  }

  Future<void> _configureAudio() async {
    final session = await AudioSession.instance;
    await session.configure(const AudioSessionConfiguration(
      avAudioSessionCategory: AVAudioSessionCategory.playAndRecord,
      avAudioSessionCategoryOptions:
          AVAudioSessionCategoryOptions.allowBluetooth |
          AVAudioSessionCategoryOptions.defaultToSpeaker,
      avAudioSessionMode: AVAudioSessionMode.voiceChat,
      androidAudioAttributes: AndroidAudioAttributes(
        contentType: AndroidAudioContentType.speech,
        usage: AndroidAudioUsage.voiceCommunication,
      ),
      androidAudioFocusGainType: AndroidAudioFocusGainType.gain,
    ));
    await session.setActive(true);
  }

  Future<void> _deactivateAudio() async {
    final session = await AudioSession.instance;
    await session.setActive(false);
  }

  @override
  void onClose() {
    leaveRoom();
    super.onClose();
  }
}
```

### Intercom UI widget

```dart
class IntercomBar extends GetView<IntercomService> {
  const IntercomBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      if (!controller.isInCall.value) return const SizedBox.shrink();

      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          children: [
            Obx(() => Text('${controller.connectedPeers.length} connected')),
            const Spacer(),
            IconButton(
              icon: Obx(() => Icon(
                controller.isMuted.value ? Icons.mic_off : Icons.mic,
              )),
              onPressed: controller.toggleMute,
            ),
            IconButton(
              icon: Obx(() => Icon(
                controller.isSpeakerOn.value
                    ? Icons.volume_up
                    : Icons.hearing,
              )),
              onPressed: controller.toggleSpeaker,
            ),
            IconButton(
              icon: const Icon(Icons.call_end, color: Colors.red),
              onPressed: controller.leaveRoom,
            ),
          ],
        ),
      );
    });
  }
}
```
