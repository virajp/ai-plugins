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
