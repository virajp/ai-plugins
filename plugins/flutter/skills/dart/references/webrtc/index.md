# flutter_webrtc

Building real-time audio/video communication in a Flutter app with
flutter_webrtc — permission/manifest setup, RTCPeerConnection and media streams,
signaling over WebSockets, the full offer/answer call flow, full-mesh group
calls, iOS audio_session routing, mute/speaker/camera toggles, and ICE
reconnection.

Topics are split into separate files — read the one matching your task.

| Topic                                                                                                               | When to read                                                          |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [Setup](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webrtc/setup.md)                                               | Dependencies, Android/iOS permissions, background audio modes         |
| [Core Concepts](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webrtc/core-concepts.md)                               | WebRTC does NOT define signaling                                      |
| [Media (Audio / Video)](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webrtc/media-audio-video.md)                   | getUserMedia constraints, tracks, device enumeration                  |
| [RTCPeerConnection](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webrtc/rtcpeerconnection.md)                       | ICE/TURN config and connection event handlers                         |
| [Signaling](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webrtc/signaling.md)                                       | WebRTC requires exchanging two things out-of-band                     |
| [Full Call Flow](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webrtc/full-call-flow.md)                             | End-to-end offer/answer caller and callee code                        |
| [Group Calls (Mesh)](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webrtc/group-calls-mesh.md)                       | For a group intercom (all participants in a session), use a full-mesh |
| [Audio Session Integration](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webrtc/audio-session-integration.md)       | iOS audio routing, Bluetooth, echo cancellation via audio_session     |
| [Mute / Speaker / Camera Toggle](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webrtc/mute-speaker-camera-toggle.md) | Toggling mic, speakerphone, camera; replacing tracks                  |
| [Reconnection](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webrtc/reconnection.md)                                 | ICE can fail transiently                                              |
| [Anti-Patterns](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webrtc/anti-patterns.md)                               | Common WebRTC pitfalls and their fixes                                |
| [Examples](${CLAUDE_PLUGIN_ROOT}/skills/dart/references/webrtc/examples.md)                                         | Full GetX mesh intercom service and UI                                |
