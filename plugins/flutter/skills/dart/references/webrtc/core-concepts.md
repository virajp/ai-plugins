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
