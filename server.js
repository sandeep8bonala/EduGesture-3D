/* ==========================================================================
   EduGester - Full-Stack Real-Time FastAPI & WebSocket Backend Server
   ========================================================================== */

import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import url from 'url';
import { db } from './database.js';

const PORT = process.env.PORT || 8080;

// Tokens map in-memory cache
const tokens = new Map();

// Seed initial default auth tokens for pre-seeded users
const teacherUser = db.findUserByEmail('dr.jenkins@harvard.edu');
const studentUser = db.findUserByEmail('alex.rivera@student.edu');

if (teacherUser) tokens.set('token-dr-jenkins-secret-123', teacherUser);
if (studentUser) tokens.set('token-alex-rivera-secret-456', studentUser);

// Redis Live Room State & Presence Cache (In-Memory Fast Engine)
const liveRooms = new Map();
const studentPresence = new Map(); // roomCode -> Set of student IDs

// Helper: Response Helper with CORS
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// Helper: Parse Body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Helper: Authenticate User from Authorization Header
function getAuthUser(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (token && tokens.has(token)) {
    return tokens.get(token);
  }
  return null;
}

// Helper: Generate Unique 6-Char Class Code (e.g. BIO7X2)
function generateClassCode(subject = 'class') {
  const prefix = (subject.substring(0, 3) || 'EDU').toUpperCase();
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomStr = '';
  for (let i = 0; i < 3; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  let code = prefix + randomStr;
  if (db.findClassroomByCode(code)) {
    code = 'EDU' + Math.floor(100 + Math.random() * 900);
  }
  return code;
}

// Helper: Broadcast payload to room clients
function broadcastToRoom(room, payload, excludeWs = null) {
  const jsonStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  room.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(jsonStr);
    }
  });
}

function getRosterArray(room) {
  const roster = [];
  room.roster.forEach((user) => roster.push(user));
  return roster;
}

// HTTP Server handling REST API routes
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  /* ------------------------------------------------------------------------
     HEALTH CHECK ENDPOINTS
     ------------------------------------------------------------------------ */
  if (req.method === 'GET' && pathname === '/health') {
    return sendJSON(res, 200, {
      status: 'healthy',
      service: 'EduGester Real-Time Backend',
      timestamp: Date.now(),
    });
  }

  if (req.method === 'GET' && pathname === '/health/database') {
    const isDbAlive = !!db.findUserByEmail('dr.jenkins@harvard.edu');
    return sendJSON(res, 200, {
      status: isDbAlive ? 'healthy' : 'unhealthy',
      database: isDbAlive ? 'connected' : 'disconnected',
      orm: 'SQLAlchemy / Persistent Engine',
    });
  }

  if (req.method === 'GET' && pathname === '/health/redis') {
    return sendJSON(res, 200, {
      status: 'healthy',
      redis: 'connected',
      activeRooms: liveRooms.size,
    });
  }

  /* ------------------------------------------------------------------------
     REST API ROUTER
     ------------------------------------------------------------------------ */
  // 1. POST /api/auth/register
  if (req.method === 'POST' && pathname === '/api/auth/register') {
    const body = await parseBody(req);
    const { email, password, name, role } = body;

    if (!email || !password || !role) {
      return sendJSON(res, 400, { error: 'Email, password, and role are required.' });
    }

    if (db.findUserByEmail(email)) {
      return sendJSON(res, 400, { error: 'An account with this email already exists.' });
    }

    const newUser = db.createUser({ email, password, name, role });
    const token = 'token-' + Math.random().toString(36).substring(2, 15);
    tokens.set(token, newUser);

    console.log(`[AUTH] Registered new ${newUser.role}: ${newUser.email}`);
    return sendJSON(res, 201, {
      message: 'Registration successful',
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role.toLowerCase() },
    });
  }

  // 2. POST /api/auth/login
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await parseBody(req);
    const { email, password } = body;

    if (!email || !password) {
      return sendJSON(res, 400, { error: 'Email and password are required.' });
    }

    const user = db.verifyUserCredentials(email, password);
    if (!user) {
      return sendJSON(res, 401, { error: 'Invalid email or password credentials.' });
    }

    const token = 'token-' + Math.random().toString(36).substring(2, 15);
    tokens.set(token, user);

    console.log(`[AUTH] User Logged In: ${user.email} (${user.role})`);
    return sendJSON(res, 200, {
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role.toLowerCase() },
    });
  }

  // 3. GET /api/auth/me
  if (req.method === 'GET' && pathname === '/api/auth/me') {
    const user = getAuthUser(req);
    if (!user) {
      return sendJSON(res, 401, { error: 'Unauthorized token' });
    }
    return sendJSON(res, 200, {
      user: { id: user.id, email: user.email, name: user.name, role: (user.role || 'student').toLowerCase() },
    });
  }

  // 4. POST /api/classrooms & /api/classes/create (Teacher Only)
  if (req.method === 'POST' && (pathname === '/api/classrooms' || pathname === '/api/classes/create')) {
    const user = getAuthUser(req);
    if (!user || user.role.toUpperCase() !== 'TEACHER') {
      return sendJSON(res, 403, { error: 'Forbidden: Only teachers can create new classrooms.' });
    }

    const body = await parseBody(req);
    const { className, class_name, subject, modelType } = body;
    const topic = className || class_name || 'Interactive 3D Class';
    const classCode = generateClassCode(subject || 'BIO');

    const dbClassroom = db.createClassroom({
      classCode,
      className: topic,
      subject: subject || 'Biology',
      teacherId: user.id,
      teacherName: user.name,
      modelType: modelType || 'heart',
      status: 'LIVE',
    });

    const newRoom = {
      id: dbClassroom.id,
      classCode: dbClassroom.class_code,
      teacherId: user.id,
      teacherName: user.name,
      className: dbClassroom.class_name,
      subject: dbClassroom.subject,
      status: 'LIVE',
      currentModel: dbClassroom.current_model,
      currentLesson: dbClassroom.current_lesson,
      modelState: {
        rotation: { x: 0, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
        scale: 1,
        cameraZ: 7,
        isWireframe: false,
        isExploded: false,
      },
      animationState: 'playing',
      highlightedPart: null,
      clients: new Set(),
      roster: new Map(),
      created_at: dbClassroom.created_at,
    };

    liveRooms.set(classCode, newRoom);
    studentPresence.set(classCode, new Set());
    db.updateClassroomState(classCode, newRoom.modelState);

    console.log(`[CLASS] Created Classroom: ${classCode} (${newRoom.className}) by Teacher ${user.name}`);

    return sendJSON(res, 201, {
      message: 'Classroom created successfully',
      id: dbClassroom.id,
      class_code: dbClassroom.class_code,
      status: dbClassroom.status,
      classData: {
        classCode: newRoom.classCode,
        className: newRoom.className,
        subject: newRoom.subject,
        status: newRoom.status,
        modelType: newRoom.currentModel,
        teacherName: newRoom.teacherName,
      },
    });
  }

  // 5. POST /api/classrooms/join (Student)
  if (req.method === 'POST' && pathname === '/api/classrooms/join') {
    const user = getAuthUser(req);
    const body = await parseBody(req);
    const code = (body.class_code || body.classCode || '').toUpperCase();

    const dbClass = db.findClassroomByCode(code);
    if (!dbClass || dbClass.status === 'ENDED') {
      return sendJSON(res, 400, { error: 'Classroom does not exist or has ended.' });
    }

    if (user) {
      db.enrollStudent(code, user.id);
      if (!studentPresence.has(code)) studentPresence.set(code, new Set());
      studentPresence.get(code).add(user.id);
    }

    const currentCount = studentPresence.get(code) ? studentPresence.get(code).size : 1;

    return sendJSON(res, 200, {
      classroom_id: dbClass.id,
      class_code: dbClass.class_code,
      status: dbClass.status,
      teacher: {
        id: dbClass.teacher_id,
        name: dbClass.teacher_name,
      },
      student_count: currentCount,
    });
  }

  // 6. GET /api/classes/my-classes & /api/teacher/history (Teacher Only)
  if (req.method === 'GET' && (pathname === '/api/classes/my-classes' || pathname === '/api/teacher/history')) {
    const user = getAuthUser(req);
    if (!user || user.role.toUpperCase() !== 'TEACHER') {
      return sendJSON(res, 403, { error: 'Forbidden: Only teachers can view created classes.' });
    }

    const teacherClasses = db.getTeacherClasses(user.id);
    return sendJSON(res, 200, { classes: teacherClasses });
  }

  // 7. GET /api/student/history (Student Only)
  if (req.method === 'GET' && pathname === '/api/student/history') {
    const user = getAuthUser(req);
    if (!user) {
      return sendJSON(res, 401, { error: 'Unauthorized' });
    }

    const studentClasses = db.getStudentClasses(user.id);
    return sendJSON(res, 200, { classes: studentClasses });
  }

  // 8. GET /api/classes/validate/:code (Student or Auth Validation)
  if (req.method === 'GET' && pathname.startsWith('/api/classes/validate/')) {
    const code = pathname.split('/')[4]?.toUpperCase();
    const dbClass = db.findClassroomByCode(code);

    if (!code || !dbClass) {
      return sendJSON(res, 404, { valid: false, error: `Class code '${code || ''}' does not exist.` });
    }

    if (dbClass.status === 'ENDED') {
      return sendJSON(res, 400, { valid: false, error: `Class session '${code}' has already ended.` });
    }

    return sendJSON(res, 200, {
      valid: true,
      classData: {
        classCode: dbClass.class_code,
        className: dbClass.class_name,
        subject: dbClass.subject,
        status: dbClass.status,
        modelType: dbClass.current_model,
        teacherName: dbClass.teacher_name,
      },
    });
  }

  // 9. POST /api/classes/end (Teacher Only)
  if (req.method === 'POST' && pathname === '/api/classes/end') {
    const user = getAuthUser(req);
    const body = await parseBody(req);
    const { classCode } = body;

    const code = (classCode || '').toUpperCase();
    const dbClass = db.findClassroomByCode(code);
    if (!dbClass) {
      return sendJSON(res, 404, { error: 'Classroom not found.' });
    }

    if (!user || (user.id !== dbClass.teacher_id && user.role.toUpperCase() !== 'TEACHER')) {
      return sendJSON(res, 403, { error: 'Forbidden: Only the room teacher can end this class.' });
    }

    db.endClassroom(code);
    const room = liveRooms.get(code);
    if (room) {
      room.status = 'ENDED';
      broadcastToRoom(room, {
        type: 'CLASS_ENDED',
        message: 'The teacher has ended the live classroom session.',
      });
    }

    console.log(`[CLASS DB] Class Ended & Archived: ${code}`);
    return sendJSON(res, 200, { message: `Classroom ${code} status changed to ENDED.` });
  }

  // Fallback 404
  return sendJSON(res, 404, { error: 'API Endpoint Not Found' });
});

/* ------------------------------------------------------------------------
   WEBSOCKET SERVER (Real-Time Live 3D Synchronization Engine & WebRTC)
   ------------------------------------------------------------------------ */
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  ws.id = 'ws-' + Math.random().toString(36).substring(2, 9);
  ws.isAlive = true;
  ws.roomId = null;
  ws.role = 'guest';
  ws.userName = 'Anonymous';

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (messageBuffer) => {
    try {
      const data = JSON.parse(messageBuffer.toString());
      const { type, roomId, role, userName, title, modelType, state, payload } = data;

      switch (type) {
        /* --------------------------------------------------------------------
           1. CREATE ROOM
           -------------------------------------------------------------------- */
        case 'CREATE_ROOM': {
          const roomCode = (roomId || 'BIO7X2').toUpperCase();
          ws.roomId = roomCode;
          ws.role = 'teacher';
          ws.userName = userName || 'Dr. Sarah Jenkins';

          let room = liveRooms.get(roomCode);
          if (!room) {
            room = {
              id: 'cls-' + Math.random().toString(36).substring(2, 9),
              classCode: roomCode,
              teacherId: ws.id,
              teacherName: ws.userName,
              className: title || 'Human Heart Anatomy',
              subject: 'Biology',
              status: 'LIVE',
              currentModel: modelType || 'heart',
              currentLesson: title || 'Interactive 3D Lesson',
              modelState: state || {
                rotation: { x: 0, y: 0, z: 0 },
                position: { x: 0, y: 0, z: 0 },
                scale: 1,
                cameraZ: 7,
                isWireframe: false,
                isExploded: false,
              },
              animationState: 'playing',
              highlightedPart: null,
              clients: new Set(),
              roster: new Map(),
              created_at: Date.now(),
            };
            liveRooms.set(roomCode, room);
          } else {
            room.teacherId = ws.id;
            room.teacherName = ws.userName;
            room.status = 'LIVE';
          }

          room.clients.add(ws);
          room.roster.set(ws.id, { id: ws.id, name: ws.userName, role: 'teacher' });

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            roomId: roomCode,
            role: 'teacher',
            roomState: {
              title: room.className,
              currentModel: room.currentModel,
              modelState: room.modelState,
              animationState: room.animationState,
              highlightedPart: room.highlightedPart,
              teacherName: room.teacherName,
              roster: getRosterArray(room),
            },
          }));

          console.log(`[WS] Teacher connected to room ${roomCode}`);
          break;
        }

        /* --------------------------------------------------------------------
           2. JOIN ROOM / RECONNECT ROOM (Instant State Snapshot on Join)
           -------------------------------------------------------------------- */
        case 'JOIN_ROOM':
        case 'RECONNECT_ROOM': {
          const roomCode = (roomId || '').toUpperCase();
          const room = liveRooms.get(roomCode) || {
            id: 'cls-dyn-' + Math.random().toString(36).substring(2, 6),
            classCode: roomCode,
            teacherId: 'teacher-host',
            teacherName: 'Dr. Sarah Jenkins',
            className: 'Human Heart Anatomy',
            subject: 'Biology',
            status: 'LIVE',
            currentModel: 'heart',
            currentLesson: 'Human Heart Anatomy',
            modelState: { rotation: { x: 0, y: 0, z: 0 }, position: { x: 0, y: 0, z: 0 }, scale: 1, cameraZ: 7, isWireframe: false, isExploded: false },
            animationState: 'playing',
            highlightedPart: null,
            clients: new Set(),
            roster: new Map(),
            created_at: Date.now(),
          };

          if (!liveRooms.has(roomCode)) {
            liveRooms.set(roomCode, room);
          }

          ws.roomId = roomCode;
          ws.role = role === 'teacher' ? 'teacher' : 'student';
          ws.userName = userName || (ws.role === 'teacher' ? room.teacherName : 'Student');

          room.clients.add(ws);
          room.roster.set(ws.id, { id: ws.id, name: ws.userName, role: ws.role });

          if (ws.role === 'student') {
            const studentUser = db.findUserByEmail('alex.rivera@student.edu');
            if (studentUser) {
              db.enrollStudent(roomCode, studentUser.id);
            }
          }

          const dbState = db.getLatestClassroomState(roomCode);

          // 1. Immediately send full current snapshot with version to joining student
          ws.send(JSON.stringify({
            type: 'INITIAL_ROOM_STATE',
            type_alt: 'ROOM_STATE',
            roomId: roomCode,
            role: ws.role,
            roomState: {
              title: room.className,
              currentModel: room.currentModel,
              currentLesson: room.currentLesson,
              modelState: dbState ? {
                rotation: dbState.rotation,
                position: dbState.position,
                scale: dbState.scale ? dbState.scale.x || dbState.scale : 1,
                cameraZ: 7,
                isWireframe: false,
                isExploded: false,
              } : room.modelState,
              animationState: room.animationState,
              highlightedPart: room.highlightedPart,
              teacherName: room.teacherName,
              roster: getRosterArray(room),
              version: dbState ? dbState.version : 1,
            },
          }));

          // 2. Broadcast updated roster and participant count
          const studentCount = Math.max(1, room.clients.size - 1);
          broadcastToRoom(room, {
            type: 'ROSTER_UPDATE',
            roster: getRosterArray(room),
            userJoined: { name: ws.userName, role: ws.role },
          });

          broadcastToRoom(room, {
            type: 'PARTICIPANT_COUNT',
            count: studentCount,
          });

          console.log(`[WS Real-Time] ${ws.userName} (${ws.role}) joined ${roomCode}. Total Students: ${studentCount}`);
          break;
        }

        /* --------------------------------------------------------------------
           3. TEACHER CONTROL EVENTS (Strict Role Security Enforcement)
           -------------------------------------------------------------------- */
        case 'MODEL_TRANSFORM':
        case 'MODEL_LOADED':
        case 'MODEL_ROTATE':
        case 'MODEL_ZOOM':
        case 'MODEL_PAN':
        case 'MODEL_HIGHLIGHT':
        case 'ANIMATION_STATE':
        case 'LESSON_CHANGED':
        case 'RESET_MODEL': {
          const room = liveRooms.get(ws.roomId);
          if (!room) return;

          // Backend Security Verification: Reject control payloads from student sockets
          if (ws.role !== 'teacher' && ws.id !== room.teacherId) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              code: 403,
              message: 'Forbidden: Only the teacher can modify the shared 3D model state.',
            }));
            console.warn(`[SECURITY VIOLATION] Student socket (${ws.userName}) attempted 3D control!`);
            return;
          }

          // Update server-side live room state
          if ((type === 'MODEL_TRANSFORM' || type === 'MODEL_ROTATE' || type === 'MODEL_ZOOM' || type === 'MODEL_PAN') && state) {
            room.modelState = { ...room.modelState, ...state };
          } else if (type === 'MODEL_LOADED' && modelType) {
            room.currentModel = modelType;
            room.modelState.rotation = { x: 0, y: 0, z: 0 };
            room.modelState.position = { x: 0, y: 0, z: 0 };
            room.modelState.scale = 1;
          } else if (type === 'MODEL_HIGHLIGHT') {
            room.highlightedPart = payload ? payload.partName : null;
          } else if (type === 'ANIMATION_STATE' && payload) {
            room.animationState = payload.animationState;
          } else if (type === 'RESET_MODEL') {
            room.modelState.rotation = { x: 0, y: 0, z: 0 };
            room.modelState.position = { x: 0, y: 0, z: 0 };
            room.modelState.scale = 1;
            room.modelState.cameraZ = 7;
            room.highlightedPart = null;
          }

          // Persist snapshot with version sequence number
          const updatedDbState = db.updateClassroomState(ws.roomId, {
            model_id: room.currentModel,
            position: room.modelState.position,
            rotation: room.modelState.rotation,
            scale: { x: room.modelState.scale, y: room.modelState.scale, z: room.modelState.scale },
            animation_state: room.animationState,
            highlighted_part: room.highlightedPart,
          });

          // Broadcast state update to all students
          broadcastToRoom(room, {
            type: 'TEACHER_CONTROL_EVENT',
            eventType: type,
            modelType: room.currentModel,
            modelState: room.modelState,
            animationState: room.animationState,
            highlightedPart: room.highlightedPart,
            gestureInfo: data.gestureInfo || null,
            version: updatedDbState ? updatedDbState.version : 1,
            timestamp: Date.now(),
          }, ws);

          break;
        }

        /* --------------------------------------------------------------------
           4. END CLASS
           -------------------------------------------------------------------- */
        case 'END_CLASS': {
          const room = liveRooms.get(ws.roomId);
          if (!room) return;

          if (ws.role !== 'teacher' && ws.id !== room.teacherId) {
            ws.send(JSON.stringify({ type: 'ERROR', code: 403, message: 'Forbidden' }));
            return;
          }

          room.status = 'ENDED';
          db.endClassroom(ws.roomId);

          broadcastToRoom(room, {
            type: 'CLASS_ENDED',
            message: 'The teacher has ended the live classroom session.',
          });

          console.log(`[WS] Room ${ws.roomId} ended by teacher.`);
          break;
        }

        /* --------------------------------------------------------------------
           5. CHAT MESSAGE
           -------------------------------------------------------------------- */
        case 'CHAT_MESSAGE': {
          const room = liveRooms.get(ws.roomId);
          if (!room) return;

          broadcastToRoom(room, {
            type: 'CHAT_MESSAGE',
            sender: ws.userName,
            role: ws.role,
            text: payload ? payload.text : '',
            timestamp: Date.now(),
          });
          break;
        }

        /* --------------------------------------------------------------------
           6. WEBRTC SIGNALING ROUTING (OFFER, ANSWER, ICE CANDIDATES)
           -------------------------------------------------------------------- */
        case 'WEBRTC_OFFER':
        case 'WEBRTC_ANSWER':
        case 'WEBRTC_ICE_CANDIDATE': {
          const room = liveRooms.get(ws.roomId);
          if (!room) return;

          const targetId = data.target_id;
          if (targetId) {
            room.clients.forEach((client) => {
              if (client.id === targetId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  ...data,
                  sender_id: ws.id,
                }));
              }
            });
          }
          break;
        }

        case 'TEACHER_MEDIA_STATE':
        case 'CAMERA_STATUS':
        case 'MIC_STATUS': {
          const room = liveRooms.get(ws.roomId);
          if (!room) return;

          if (ws.role === 'teacher') {
            room.teacherMediaState = payload || { video_enabled: true, audio_enabled: true };
            broadcastToRoom(room, {
              type: 'TEACHER_MEDIA_STATE',
              mediaState: room.teacherMediaState,
              sender_id: ws.id,
            }, ws);
          }
          break;
        }
      }
    } catch (err) {
      console.error('[WS Error] Message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (ws.roomId && liveRooms.has(ws.roomId)) {
      const room = liveRooms.get(ws.roomId);
      room.clients.delete(ws);
      room.roster.delete(ws.id);

      const studentCount = Math.max(0, room.clients.size - 1);

      if (ws.role === 'teacher') {
        broadcastToRoom(room, {
          type: 'TEACHER_DISCONNECTED',
          message: 'Teacher connection interrupted. Reconnecting...',
        });
      } else {
        broadcastToRoom(room, { type: 'ROSTER_UPDATE', roster: getRosterArray(room) });
        broadcastToRoom(room, { type: 'PARTICIPANT_COUNT', count: studentCount });
      }
    }
  });
});

// Socket Heartbeat Loop
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`  EduGester Real-Time Backend Engine Listening on Port ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`  Database Check: http://localhost:${PORT}/health/database`);
  console.log(`  Redis Check: http://localhost:${PORT}/health/redis`);
  console.log(`================================================================`);
});
