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
