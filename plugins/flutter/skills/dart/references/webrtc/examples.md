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
