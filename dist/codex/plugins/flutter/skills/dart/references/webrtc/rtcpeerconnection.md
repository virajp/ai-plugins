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
