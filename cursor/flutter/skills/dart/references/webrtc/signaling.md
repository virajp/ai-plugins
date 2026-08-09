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
