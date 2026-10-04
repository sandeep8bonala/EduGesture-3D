/* ==========================================================================
   EduGester - WebRTC Client Service (Live Teacher Video & Audio Streaming)
   ========================================================================== */

import { wsService } from './websocketService.js';

export class WebRTCService {
  constructor() {
    // STUN/TURN Ice Server Configurations
    const stunServer = import.meta.env?.VITE_WEBRTC_STUN_SERVER || 'stun:stun.l.google.com:19302';
    this.rtcConfig = {
      iceServers: [
        { urls: stunServer },
      ],
    };

    this.localStream = null;
    this.role = 'guest';
    this.peerConnections = new Map(); // Teacher mode: studentSocketId -> RTCPeerConnection
    this.studentPeer = null; // Student mode: single RTCPeerConnection to teacher
    this.teacherSocketId = null;

    this.isVideoEnabled = true;
    this.isAudioEnabled = true;

    this.listeners = new Map();
    this.initWebSocketSignaling();
  }

  /* ------------------------------------------------------------------------
     TEACHER MEDIA INITIALIZATION (REUSED FOR WEBRTC + GESTURE DETECTION)
     ------------------------------------------------------------------------ */
  async startTeacherMedia(videoPreviewElement = null) {
    this.role = 'teacher';
    try {
      if (!this.localStream) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true,
        });
      }

      if (videoPreviewElement) {
        videoPreviewElement.srcObject = this.localStream;
        await videoPreviewElement.play().catch(() => {});
      }

      this.isVideoEnabled = true;
      this.isAudioEnabled = true;

      console.log('[WebRTC] Teacher Media Stream started successfully.');
      return { success: true, stream: this.localStream };
    } catch (err) {
      console.error('[WebRTC] Error acquiring teacher camera/microphone:', err);
      let errorMsg = 'Could not access camera/microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera/microphone permission was denied in browser settings.';
      }
      return { success: false, error: errorMsg };
    }
  }

  /* ------------------------------------------------------------------------
     WEBRTC SIGNALING LISTENER SETUP
     ------------------------------------------------------------------------ */
  initWebSocketSignaling() {
    // 1. Incoming WebRTC Offer (Student receives offer from Teacher)
    wsService.on('WEBRTC_OFFER', async (data) => {
      if (this.role === 'student' && data.offer) {
        console.log(`[WebRTC Student] Received Offer from Teacher (${data.sender_id})`);
        this.teacherSocketId = data.sender_id;
        await this.handleIncomingOffer(data.sender_id, data.offer);
      }
    });

    // 2. Incoming WebRTC Answer (Teacher receives answer from Student)
    wsService.on('WEBRTC_ANSWER', async (data) => {
      if (this.role === 'teacher' && data.answer && this.peerConnections.has(data.sender_id)) {
        console.log(`[WebRTC Teacher] Received Answer from Student (${data.sender_id})`);
        const pc = this.peerConnections.get(data.sender_id);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (e) {
          console.error('[WebRTC Teacher] Error setting remote description:', e);
        }
      }
    });

    // 3. Incoming ICE Candidate
    wsService.on('WEBRTC_ICE_CANDIDATE', async (data) => {
      if (!data.candidate) return;
      try {
        const candidate = new RTCIceCandidate(data.candidate);
        if (this.role === 'teacher' && this.peerConnections.has(data.sender_id)) {
          await this.peerConnections.get(data.sender_id).addIceCandidate(candidate);
        } else if (this.role === 'student' && this.studentPeer) {
          await this.studentPeer.addIceCandidate(candidate);
        }
      } catch (e) {
        console.error('[WebRTC] Error adding ICE candidate:', e);
      }
    });

    // 4. Teacher Media State Updates (Camera On/Off, Mic Mute/Unmute)
    wsService.on('TEACHER_MEDIA_STATE', (data) => {
      this.emit('teacher_media_state', data);
    });

    // 5. Roster Update (Teacher creates peer connection for newly joined student)
    wsService.on('ROSTER_UPDATE', (data) => {
      if (this.role === 'teacher' && Array.isArray(data.roster)) {
        data.roster.forEach((user) => {
          if (user.role === 'student' && !this.peerConnections.has(user.id)) {
            this.createPeerConnectionForStudent(user.id);
          }
        });
      }
    });
  }

  /* ------------------------------------------------------------------------
     TEACHER MESH WEBRTC CREATION (TEACHER TO MULTIPLE STUDENTS)
     ------------------------------------------------------------------------ */
  async createPeerConnectionForStudent(studentSocketId) {
    if (!this.localStream || this.peerConnections.has(studentSocketId)) return;

    console.log(`[WebRTC Teacher] Creating RTCPeerConnection for Student ${studentSocketId}`);
    const pc = new RTCPeerConnection(this.rtcConfig);
    this.peerConnections.set(studentSocketId, pc);

    // Attach teacher video & audio tracks
    this.localStream.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream);
    });

    // ICE Candidate Handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsService.send({
          type: 'WEBRTC_ICE_CANDIDATE',
          target_id: studentSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC Teacher] Connection state with ${studentSocketId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        pc.close();
        this.peerConnections.delete(studentSocketId);
      }
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      wsService.send({
        type: 'WEBRTC_OFFER',
        target_id: studentSocketId,
        offer: offer,
      });
    } catch (err) {
      console.error(`[WebRTC Teacher] Error creating offer for ${studentSocketId}:`, err);
    }
  }

  /* ------------------------------------------------------------------------
     STUDENT WEBRTC RECEIVER (RECEIVE-ONLY FOR VIDEO & AUDIO)
     ------------------------------------------------------------------------ */
  async handleIncomingOffer(teacherSocketId, offerSdp) {
    this.role = 'student';

    if (this.studentPeer) {
      this.studentPeer.close();
      this.studentPeer = null;
    }

    const pc = new RTCPeerConnection(this.rtcConfig);
    this.studentPeer = pc;

    // Student receives teacher tracks
    pc.ontrack = (event) => {
      console.log('[WebRTC Student] Incoming teacher media track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        this.emit('teacher_stream', { stream: event.streams[0] });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsService.send({
          type: 'WEBRTC_ICE_CANDIDATE',
          target_id: teacherSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC Student] ICE Connection State:', pc.iceConnectionState);
      this.emit('ice_state_change', { state: pc.iceConnectionState });
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.warn('[WebRTC Student] Connection interrupted. Requesting re-sync...');
        wsService.rejoinRoom();
      }
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsService.send({
        type: 'WEBRTC_ANSWER',
        target_id: teacherSocketId,
        answer: answer,
      });
    } catch (err) {
      console.error('[WebRTC Student] Error setting remote description / answer:', err);
    }
  }

  /* ------------------------------------------------------------------------
     TEACHER MEDIA TOGGLES (CAMERA & MIC)
     ------------------------------------------------------------------------ */
  toggleCamera() {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isVideoEnabled = videoTrack.enabled;

      wsService.send({
        type: 'TEACHER_MEDIA_STATE',
        payload: { video_enabled: this.isVideoEnabled, audio_enabled: this.isAudioEnabled },
      });
    }
    return this.isVideoEnabled;
  }

  toggleMic() {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isAudioEnabled = audioTrack.enabled;

      wsService.send({
        type: 'TEACHER_MEDIA_STATE',
        payload: { video_enabled: this.isVideoEnabled, audio_enabled: this.isAudioEnabled },
      });
    }
    return this.isAudioEnabled;
  }

  /* ------------------------------------------------------------------------
     CLEANUP & TERMINATION
     ------------------------------------------------------------------------ */
  stopAllMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    if (this.studentPeer) {
      this.studentPeer.close();
      this.studentPeer = null;
    }

    this.role = 'guest';
    console.log('[WebRTC] All peer connections and media tracks stopped.');
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => cb(payload));
    }
  }
}

export const webrtcService = new WebRTCService();
