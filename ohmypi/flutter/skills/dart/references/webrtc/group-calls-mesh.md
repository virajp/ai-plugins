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
