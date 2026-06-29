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
