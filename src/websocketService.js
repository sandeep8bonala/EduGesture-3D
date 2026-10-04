/* ==========================================================================
   EduGester - WebSocket Client Service (Real-Time Live Classroom Sync)
   ========================================================================== */

export class WebSocketService {
  constructor() {
    this.ws = null;
    // Connect to WebSocket server running on port 8080 (or location host port)
    const host = window.location.hostname || 'localhost';
    this.url = `ws://${host}:8080`;
    
    this.listeners = new Map();
    this.isConnected = false;
    this.currentRoom = null;
    this.currentRole = 'guest';
    this.userName = 'User';
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;

    // High-frequency transform throttling (~30ms window)
    this.lastTransformTime = 0;
    this.pendingTransform = null;
    this.throttleTimer = null;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('[WS Client] Connected to EduGester Live Server.');
        this.emit('connected', { isConnected: true });

        if (this.currentRoom) {
          this.rejoinRoom();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.error('[WS Client] Error parsing incoming JSON:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.warn('[WS Client] Disconnected from server. Scheduling auto-reconnect...');
        this.emit('disconnected', { isConnected: false });
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[WS Client] Connection error:', err);
      };
    } catch (err) {
      console.error('[WS Client] Exception connecting:', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  createRoom(roomId, title, modelType, teacherName, state) {
    this.currentRoom = (roomId || 'EDU-8924').toUpperCase();
    this.currentRole = 'teacher';
    this.userName = teacherName || 'Dr. Sarah Jenkins';

    if (!this.isConnected) {
      this.connect();
    }

    const payload = {
      type: 'CREATE_ROOM',
      roomId: this.currentRoom,
      title,
      modelType,
      userName: this.userName,
      state: state || null,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      this.on('connected', () => this.ws.send(JSON.stringify(payload)));
    }
  }

  joinRoom(roomId, studentName) {
    this.currentRoom = (roomId || '').toUpperCase();
    this.currentRole = 'student';
    this.userName = studentName || 'Student';

    if (!this.isConnected) {
      this.connect();
    }

    const payload = {
      type: 'JOIN_ROOM',
      roomId: this.currentRoom,
      role: 'student',
      userName: this.userName,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      this.on('connected', () => this.ws.send(JSON.stringify(payload)));
    }
  }

  rejoinRoom() {
    if (!this.currentRoom) return;
    this.send({
      type: 'RECONNECT_ROOM',
      roomId: this.currentRoom,
      role: this.currentRole,
      userName: this.userName,
    });
  }

  // Throttled sending for continuous gesture rotations/zooms/pans (~30ms)
  sendTeacherTransform(state, gestureInfo = null) {
    if (this.currentRole !== 'teacher' || !this.isConnected) return;

    const now = Date.now();
    this.pendingTransform = { state, gestureInfo };

    if (now - this.lastTransformTime >= 30) {
      this.flushPendingTransform();
    } else if (!this.throttleTimer) {
      this.throttleTimer = setTimeout(() => {
        this.throttleTimer = null;
        this.flushPendingTransform();
      }, 30);
    }
  }

  flushPendingTransform() {
    if (!this.pendingTransform || this.currentRole !== 'teacher') return;
    this.lastTransformTime = Date.now();
    const { state, gestureInfo } = this.pendingTransform;
    this.pendingTransform = null;

    this.send({
      type: 'MODEL_TRANSFORM',
      roomId: this.currentRoom,
      state,
      gestureInfo,
    });
  }

  sendTeacherAction(actionType, payload = {}, gestureInfo = null) {
    if (this.currentRole !== 'teacher' || !this.isConnected) return;
    this.send({
      type: actionType,
      roomId: this.currentRoom,
      payload,
      gestureInfo,
    });
  }

  sendChatMessage(text) {
    if (!this.isConnected || !this.currentRoom) return;
    this.send({
      type: 'CHAT_MESSAGE',
      roomId: this.currentRoom,
      payload: { text },
    });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleServerMessage(data) {
    const { type } = data;
    this.emit(type, data);
    this.emit('all', data);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const list = this.listeners.get(event).filter((cb) => cb !== callback);
    this.listeners.set(event, list);
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => cb(payload));
    }
  }
}

// Global Singleton Instance
export const wsService = new WebSocketService();
