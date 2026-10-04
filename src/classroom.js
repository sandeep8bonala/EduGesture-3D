import { wsService } from './websocketService.js';
import { webrtcService } from './webrtcService.js';

const LESSON_DETAILS = {
  solar: {
    title: '🪐 3D Solar System & Planetary Orbits',
    desc: 'Explore planet sizes, gravitational rotation, Earth Moon orbit, and Saturn ring dynamics in real time.',
    points: ['Observe planetary orbit velocities', 'Analyze Earth-Moon gravitational lock', "Examine Saturn's ring particle geometry"]
  },
  dna: {
    title: '🧬 DNA Double Helix & Base Pair Genetics',
    desc: 'Dissect Adenine, Thymine, Cytosine, and Guanine nucleotide bonds with 3D rotation.',
    points: ['Examine sugar-phosphate backbone', 'Identify purine-pyrimidine base pairs', 'Observe double helix twist chirality']
  },
  atom: {
    title: '⚛️ Quantum Rutherford-Bohr Atom Model',
    desc: 'Observe proton-neutron clusters and high-speed electron orbital shells with light trails.',
    points: ['Analyze nucleus proton-neutron binding', 'Track quantum orbital energy levels', 'Observe electron velocity shells']
  },
  polyhedron: {
    title: '💎 Crystal Polyhedrons & Buckyball Lattice',
    desc: 'Rotate icosahedrons, count vertex nodes, and toggle wireframe lattice structures.',
    points: ['Evaluate Euler characteristic V - E + F = 2', 'Examine 3D spatial symmetry axes', 'Toggle wireframe geometry lattice']
  },
  heart: {
    title: '🫀 Human Heart Anatomy & Circulation',
    desc: 'Examine aorta arches, pulmonary arteries, and heartbeat muscle contractions in real-time.',
    points: ['Trace deoxygenated vs oxygenated flow', 'Examine AV valve and semilunar valves', 'Observe myocardial contraction phase']
  },
  robot: {
    title: '🤖 Robotic Arm Kinematics & Mechanical Grippers',
    desc: 'Control robotic shoulder joints, elbow links, and pneumatic claw grippers in 3D.',
    points: ['Calculate forward & inverse kinematics', 'Analyze 3-DOF joint rotation limits', 'Inspect pneumatic claw end-effector']
  }
};

const MODEL_FOCUS_OBJECTS = {
  solar: [
    { id: 'sun', name: 'Sun', icon: '☀️', info: 'Yellow dwarf star holding 99.8% of solar system mass.', fact: 'Temp: 5,500°C | Mass: 1.989 × 10³⁰ kg' },
    { id: 'mercury', name: 'Mercury', icon: '⚪', info: 'Smallest planet in the Solar System and closest to the Sun.', fact: 'Orbit: 88 Days | Distance: 57.9M km' },
    { id: 'venus', name: 'Venus', icon: '🟡', info: 'Hottest planet in our solar system with a thick toxic atmosphere.', fact: 'Temp: 465°C | Orbit: 225 Days' },
    { id: 'earth', name: 'Earth', icon: '🌎', info: 'Our home planet and the only world known to harbor life.', fact: '1 Moon | Distance: 149.6M km' },
    { id: 'mars', name: 'Mars', icon: '🔴', info: 'Dusty, cold, desert world with a thin atmosphere and polar ice caps.', fact: '2 Moons | Olympus Mons Volcano' },
    { id: 'jupiter', name: 'Jupiter', icon: '🟤', info: 'Largest planet with Great Red Spot gas giant storm.', fact: '79 Moons | Mass: 318 Earth masses' },
    { id: 'saturn', name: 'Saturn', icon: '🪐', info: 'Adorned with a dazzling complex system of icy planetary rings.', fact: 'Ring Span: 282,000 km | 82 Moons' },
    { id: 'uranus', name: 'Uranus', icon: '🔵', info: 'An ice giant that rotates on an extreme tilt nearly on its side.', fact: '27 Moons | Min Temp: -224°C' },
    { id: 'neptune', name: 'Neptune', icon: '🟦', info: 'Dark, cold, and whipped by supersonic winds, the outermost planet.', fact: '14 Moons | Wind speed: 2,100 km/h' }
  ],
  heart: [
    { id: 'aorta', name: 'Aorta Arch', icon: '🫀', info: 'Main artery carrying oxygen-rich blood from the left ventricle.', fact: 'Pressure: 120 mmHg | Diameter: ~2.5 cm' },
    { id: 'left-ventricle', name: 'Left Ventricle', icon: '❤️', info: 'Pumps oxygenated blood through aortic valve into systemic circulation.', fact: 'Thick muscular wall | Highest pressure chamber' },
    { id: 'right-atrium', name: 'Right Atrium', icon: '💓', info: 'Receives deoxygenated blood returning from upper and lower body.', fact: 'Receives Vena Cava blood flow' },
    { id: 'pulmonary-art', name: 'Pulmonary Artery', icon: '🫁', info: 'Transports deoxygenated blood from right ventricle to lungs.', fact: 'Only artery carrying deoxygenated blood' }
  ],
  dna: [
    { id: 'adenine', name: 'Adenine (A)', icon: '🧬', info: 'Purine base that pairs specifically with Thymine via two hydrogen bonds.', fact: 'Purine Derivative | 2 Hydrogen Bonds' },
    { id: 'thymine', name: 'Thymine (T)', icon: '🧬', info: 'Pyrimidine base that pairs exclusively with Adenine in DNA strands.', fact: 'Pyrimidine Derivative | 2 Hydrogen Bonds' },
    { id: 'cytosine', name: 'Cytosine (C)', icon: '🧬', info: 'Pyrimidine base that pairs with Guanine via three strong hydrogen bonds.', fact: 'Pyrimidine Derivative | 3 Hydrogen Bonds' },
    { id: 'guanine', name: 'Guanine (G)', icon: '🧬', info: 'Purine base pairing with Cytosine in double helix chirality.', fact: 'Purine Derivative | 3 Hydrogen Bonds' }
  ],
  atom: [
    { id: 'nucleus', name: 'Nucleus Cluster', icon: '⚛️', info: 'Dense central core composed of bound protons and neutrons.', fact: 'Holds 99.9% of atomic mass' },
    { id: 'proton', name: 'Protons (+)', icon: '🔴', info: 'Subatomic particle with a positive electric charge.', fact: 'Charge: +1e | Determines Atomic Number' },
    { id: 'neutron', name: 'Neutrons (0)', icon: '⚪', info: 'Subatomic particle with neutral electric charge.', fact: 'Stabilizes nuclear binding energy' },
    { id: 'electron', name: 'Electron Shell', icon: '⚡', info: 'High-speed negative electron cloud orbiting the central nucleus.', fact: 'Charge: -1e | Velocity: ~2,200 km/s' }
  ],
  polyhedron: [
    { id: 'icosahedron', name: 'Icosahedron', icon: '💎', info: 'Regular polyhedron with 20 triangular faces, 12 vertices, 30 edges.', fact: 'Euler: V - E + F = 12 - 30 + 20 = 2' },
    { id: 'vertex', name: 'Vertex Node', icon: '📍', info: 'Point where three or more geometric edges meet in 3D space.', fact: 'High spatial symmetry axis' },
    { id: 'lattice', name: 'Wireframe Lattice', icon: '🕸️', info: 'Interconnected structural skeleton of geometric cell units.', fact: 'Crystal symmetry lattice' }
  ],
  robot: [
    { id: 'base', name: 'Motor Base', icon: '🤖', info: 'Heavy robotic base housing main servo rotational motor.', fact: '360° Rotational joint' },
    { id: 'shoulder', name: 'Shoulder Link', icon: '⚙️', info: 'Primary vertical elevation arm link for 3-DOF kinematics.', fact: 'Forward Kinematics Joint' },
    { id: 'gripper', name: 'Claw Gripper', icon: '🤏', info: 'Pneumatic mechanical claw end-effector for object grasping.', fact: 'Pneumatic Actuator Control' }
  ]
};

export class ClassroomController {
  constructor(threeEngine, gestureEngine, showToastCallback) {
    this.threeEngine = threeEngine;
    this.gestureEngine = gestureEngine;
    this.showToast = showToastCallback;

    this.overlay = document.getElementById('classroomOverlay');
    this.viewport = document.getElementById('classroomThreeCanvas');
    this.videoEl = document.getElementById('webcamVideo');
    this.canvasEl = document.getElementById('webcamCanvas');
    this.teacherLiveVideo = document.getElementById('teacherLiveVideo');

    this.gestureBadgeIcon = document.getElementById('gestureDetectedIcon');
    this.gestureBadgeText = document.getElementById('gestureDetectedText');
    this.gestureBadgeLabel = document.getElementById('gestureDetectedLabel');
    this.camBtnText = document.getElementById('camBtnText');
    this.liveClassTitle = document.getElementById('liveClassTitle');
    this.liveClassCode = document.getElementById('liveClassCode');

    this.isClassroomActive = false;
    this.userRole = 'student';
    this.currentCode = 'EDU-8924';
  }

  init() {
    // 1. Exit Classroom Button & End Class Confirmation Modal
    document.getElementById('btnExitClassroom')?.addEventListener('click', () => this.closeClassroom());
    document.getElementById('btnHeaderLeaveClass')?.addEventListener('click', () => this.closeClassroom());
    document.getElementById('btnCloseObjectInfoPanel')?.addEventListener('click', () => {
      const panel = document.getElementById('mockupObjectInfoPanel');
      if (panel) panel.classList.add('hidden');
    });

    // Mockup Bottom Controls Bar Listeners
    document.getElementById('dashBtnZoom')?.addEventListener('click', () => {
      this.threeEngine.zoomObject(0.4);
      this.showToast('🔍 Zoom In (+)');
    });

    document.getElementById('dashBtnRotate')?.addEventListener('click', () => {
      this.threeEngine.rotateObject(1.5, 0.5);
      this.showToast('🔄 Rotate 3D Model');
    });

    document.getElementById('dashBtnPan')?.addEventListener('click', () => {
      this.threeEngine.panObject(1.2, 0.5);
      this.showToast('✋ Pan Model Position');
    });

    document.getElementById('dashBtnHighlight')?.addEventListener('click', () => {
      this.threeEngine.highlightPart('core');
      this.showToast('👆 Highlighted Core Mesh');
    });

    document.getElementById('dashBtnInfo')?.addEventListener('click', () => {
      const panel = document.getElementById('mockupObjectInfoPanel');
      if (panel) panel.classList.toggle('hidden');
    });

    document.getElementById('dashBtnReset')?.addEventListener('click', () => {
      this.threeEngine.resetView();
      this.showToast('🏠 Reset View Perspective');
    });

    document.getElementById('dashBtnPlayPause')?.addEventListener('click', () => {
      const state = this.threeEngine.toggleAnimation();
      this.showToast(`⏯️ Animation ${state.toUpperCase()}`);
    });
    
    document.getElementById('btnEndClass')?.addEventListener('click', () => {
      const modal = document.getElementById('modalEndClassConfirm');
      if (modal) modal.classList.add('active');
    });

    document.getElementById('btnCancelEndClass')?.addEventListener('click', () => {
      const modal = document.getElementById('modalEndClassConfirm');
      if (modal) modal.classList.remove('active');
    });

    document.getElementById('btnCloseEndConfirmModal')?.addEventListener('click', () => {
      const modal = document.getElementById('modalEndClassConfirm');
      if (modal) modal.classList.remove('active');
    });

    document.getElementById('btnConfirmEndClass')?.addEventListener('click', () => {
      const modal = document.getElementById('modalEndClassConfirm');
      if (modal) modal.classList.remove('active');
      this.endClassByTeacher();
    });

    // Chapter Information Panel Quick Action Buttons
    document.getElementById('btnStartExplanation')?.addEventListener('click', async () => {
      this.showToast('Starting AI Hand Gesture Recognition...');
      const res = await this.gestureEngine.startWebcam(this.videoEl, this.canvasEl);
      if (res && res.success) {
        if (this.camBtnText) this.camBtnText.textContent = 'Webcam Gesture: ON (Active)';
        this.showToast('📷 Webcam AI Gesture Recognition is NOW ACTIVE!');
      } else {
        if (this.camBtnText) this.camBtnText.textContent = 'Webcam Gesture: Virtual Mode';
        this.gestureEngine.startVirtualSim();
        this.showToast('🖐 Virtual Hand Simulator ACTIVE! Gestures are now transforming the 3D model.');
      }
    });

    document.getElementById('btnPauseModel')?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      const animState = this.threeEngine.toggleAnimation();
      this.showToast(`⏯️ Animation ${animState.toUpperCase()}`);
    });

    document.getElementById('btnResetModelPanel')?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      this.threeEngine.resetView();
      this.showToast('🏠 Reset Camera & View Perspective');
    });

    // Teacher Actions Buttons (Matching Reference Image)
    document.getElementById('btnActionReset')?.addEventListener('click', () => {
      this.threeEngine.resetView();
      this.showToast('🏠 Reset 3D Model View');
    });

    document.getElementById('btnActionPlayAnim')?.addEventListener('click', () => {
      this.threeEngine.setAnimationState('playing');
      this.showToast('▶ Animation PLAYING');
    });

    document.getElementById('btnActionPauseAnim')?.addEventListener('click', () => {
      this.threeEngine.setAnimationState('paused');
      this.showToast('⏸ Animation PAUSED');
    });

    document.getElementById('btnActionNextObj')?.addEventListener('click', () => {
      this.focusNextObject(1);
    });

    document.getElementById('btnActionPrevObj')?.addEventListener('click', () => {
      this.focusNextObject(-1);
    });

    document.getElementById('btnCloseBriefInfo')?.addEventListener('click', () => {
      const briefCard = document.getElementById('briefInfoCard');
      if (briefCard) briefCard.classList.add('hidden');
    });

    // 2. Sidebar Model Picker (Teacher Only)
    document.querySelectorAll('.picker-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (this.userRole !== 'teacher') {
          this.showToast('ℹ️ Model selection is controlled by the Teacher.');
          return;
        }
        document.querySelectorAll('.picker-item').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const modelType = e.currentTarget.dataset.model;
        this.threeEngine.switchModel(modelType);
        this.updateLessonInfoCard(modelType);
        this.showToast(`Switched 3D model to ${modelType.toUpperCase()}`);

        wsService.sendTeacherAction('MODEL_LOADED', { modelType });
        this.broadcastTeacherTransform();
      });
    });

    // 3. Stage On-Screen Toolbar Buttons (Teacher Only)
    document.getElementById('btnToolRotate')?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      this.threeEngine.rotateObject(1.5, 0.8);
      this.showToast('🔄 Rotated 3D Object 360°');
      this.broadcastTeacherTransform({ name: 'Rotate 360°', icon: '🔄', desc: 'Manual Rotate' });
    });

    document.getElementById('btnToolZoomIn')?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      this.threeEngine.zoomObject(0.4);
      this.showToast('➕ Zoomed In (+)');
      this.broadcastTeacherTransform({ name: 'Zoom In', icon: '➕', desc: 'Manual Zoom' });
    });

    document.getElementById('btnToolZoomOut')?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      this.threeEngine.zoomObject(-0.4);
      this.showToast('➖ Zoomed Out (-)');
      this.broadcastTeacherTransform({ name: 'Zoom Out', icon: '➖', desc: 'Manual Zoom' });
    });

    document.getElementById('btnToolPan')?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      this.threeEngine.panObject(1.2, 0.6);
      this.showToast('✋ Panned Model Position');
      this.broadcastTeacherTransform({ name: 'Pan View', icon: '✋', desc: 'Manual Pan' });
    });

    document.getElementById('btnToolReset')?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      this.threeEngine.resetView();
      this.showToast('🏠 Reset Camera & View Perspective');
      wsService.sendTeacherAction('RESET_MODEL');
    });

    document.getElementById('btnToolExplode')?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      this.threeEngine.toggleExplodeView();
      this.showToast('💥 Toggled Exploded Component View');
      this.broadcastTeacherTransform({ name: 'Explode View', icon: '💥', desc: 'Toggle Explode' });
    });

    document.getElementById('btnToolWireframe')?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      this.threeEngine.toggleWireframe();
      this.showToast('🕸️ Toggled Wireframe / Solid Mode');
      this.broadcastTeacherTransform({ name: 'Wireframe Mode', icon: '🕸️', desc: 'Toggle Wireframe' });
    });

    document.getElementById('btnToolAnim')?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      const animState = this.threeEngine.toggleAnimation();
      this.showToast(`⏯️ Animation ${animState.toUpperCase()}`);
      wsService.sendTeacherAction('ANIMATION_STATE', { animationState: animState });
    });

    document.getElementById('btnToolHighlight')?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      const nextPart = this.threeEngine.highlightedPart ? null : 'Core Structure Node';
      this.threeEngine.highlightPart(nextPart);
      this.showToast(nextPart ? '👆 Highlighted Core Structure' : 'Core Structure Un-highlighted');
      wsService.sendTeacherAction('MODEL_HIGHLIGHT', { partName: nextPart });
    });

    // 4. Webcam & Virtual Hand Buttons (Teacher Only)
    document.getElementById('btnToggleCamera')?.addEventListener('click', async () => {
      if (this.userRole !== 'teacher') return;
      if (this.gestureEngine.isCameraActive) {
        this.gestureEngine.stopWebcam();
        if (this.camBtnText) this.camBtnText.textContent = 'Webcam Gesture: OFF';
        this.showToast('Webcam gesture recognition turned OFF.');
      } else {
        this.showToast('Requesting camera access...');
        const res = await this.gestureEngine.startWebcam(this.videoEl, this.canvasEl);
        if (res.success) {
          if (this.camBtnText) this.camBtnText.textContent = 'Webcam Gesture: ON (Active)';
          this.showToast('📷 Webcam AI Gesture Recognition is NOW ACTIVE!');
        } else {
          if (this.camBtnText) this.camBtnText.textContent = 'Webcam Gesture: Virtual Mode';
          this.showToast(`⚠️ ${res.error || 'Camera unavailable'}. Using Virtual Hand Sim.`);
        }
      }
    });

    document.getElementById('btnToggleVirtualHand')?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      if (this.gestureEngine.isVirtualSimActive) {
        this.gestureEngine.stopVirtualSim();
        this.showToast('Virtual Hand Simulator paused.');
      } else {
        this.gestureEngine.startVirtualSim();
        this.showToast('🖐 Virtual Hand Simulator ACTIVE.');
      }
    });

    // 5. Right Panel Tabs (Roster vs Chat vs Notes)
    const tabRoster = document.getElementById('tabRoster');
    const tabChat = document.getElementById('tabChat');
    const tabNotes = document.getElementById('tabNotes');

    const panelRoster = document.getElementById('panelRoster');
    const panelChat = document.getElementById('panelChat');
    const panelNotes = document.getElementById('panelNotes');

    tabRoster?.addEventListener('click', () => {
      tabRoster.classList.add('active');
      tabChat?.classList.remove('active');
      tabNotes?.classList.remove('active');
      panelRoster?.classList.remove('hidden');
      panelChat?.classList.add('hidden');
      panelNotes?.classList.add('hidden');
    });

    tabChat?.addEventListener('click', () => {
      tabChat.classList.add('active');
      tabRoster?.classList.remove('active');
      tabNotes?.classList.remove('active');
      panelChat?.classList.remove('hidden');
      panelRoster?.classList.add('hidden');
      panelNotes?.classList.add('hidden');
    });

    tabNotes?.addEventListener('click', () => {
      tabNotes.classList.add('active');
      tabRoster?.classList.remove('active');
      tabChat?.classList.remove('active');
      panelNotes?.classList.remove('hidden');
      panelRoster?.classList.add('hidden');
      panelChat?.classList.add('hidden');
    });

    // Notes Save/Clear Actions
    document.getElementById('btnSaveNotes')?.addEventListener('click', () => {
      const val = document.getElementById('studentNotesInput')?.value;
      localStorage.setItem('edugester_student_notes', val || '');
      this.showToast('📝 Class notes saved successfully!');
    });

    document.getElementById('btnClearNotes')?.addEventListener('click', () => {
      const input = document.getElementById('studentNotesInput');
      if (input) input.value = '';
      localStorage.removeItem('edugester_student_notes');
      this.showToast('Cleared notes.');
    });

    const savedNotes = localStorage.getItem('edugester_student_notes');
    if (savedNotes && document.getElementById('studentNotesInput')) {
      document.getElementById('studentNotesInput').value = savedNotes;
    }

    // 6. Live Chat Submit Form
    document.getElementById('chatForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (text) {
        wsService.sendChatMessage(text);
        input.value = '';
      }
    });

    // 7. Subscribe to WebSocket Backend Events
    this.initWebSocketListeners();
  }

  initWebSocketListeners() {
    // Room Created Response (Teacher)
    wsService.on('ROOM_CREATED', (data) => {
      console.log('[Room Created]', data);
      this.showToast(`🟢 Room ${data.roomId} initialized on WebSocket Server.`);
    });

    // Initial Room Snapshot Sync (Student joins and receives state immediately)
    wsService.on('INITIAL_ROOM_STATE', (data) => {
      console.log('[Initial State Snapshot Received]', data);
      if (this.userRole === 'student' && data.roomState) {
        const { currentModel, modelState, currentLesson, teacherName, roster } = data.roomState;

        this.threeEngine.applyState(modelState);
        if (currentModel) this.updateLessonInfoCard(currentModel);

        const teacherNameEl = document.getElementById('studentTeacherName');
        if (teacherNameEl && teacherName) teacherNameEl.textContent = teacherName;

        this.updateRosterUI(roster);
        this.showToast(`⚡ Synchronized with Live Room ${data.roomId}`);
      }
    });

    // Real-Time Control Event (Teacher gesture or toolbar transform)
    wsService.on('TEACHER_CONTROL_EVENT', (data) => {
      if (this.userRole === 'student' && this.isClassroomActive) {
        if (data.modelState) {
          this.threeEngine.applyState(data.modelState);
        }

        if (data.modelType) {
          this.updateLessonInfoCard(data.modelType);
        }

        if (data.gestureInfo) {
          this.updateGestureHUD({
            icon: data.gestureInfo.icon || '👨‍🏫',
            name: `${data.gestureInfo.name}`,
            desc: data.gestureInfo.desc || 'Teacher Control Event',
          });
        }
      }
    });

    // Roster Update
    wsService.on('ROSTER_UPDATE', (data) => {
      if (data.roster) {
        this.updateRosterUI(data.roster);
      }
      if (data.userJoined) {
        this.showToast(`👤 ${data.userJoined.name} (${data.userJoined.role}) joined the class.`);
      }
    });

    // Real-Time Participant Count Update
    wsService.on('PARTICIPANT_COUNT', (data) => {
      if (typeof data.count === 'number') {
        const rosterTextEl = document.getElementById('tabRosterText');
        const headerBadgeEl = document.getElementById('studentHeaderBadge');
        const text = `👥 ${data.count} ${data.count === 1 ? 'Student' : 'Students'}`;

        if (rosterTextEl) rosterTextEl.textContent = `Students (${data.count})`;
        if (headerBadgeEl) headerBadgeEl.textContent = text;
      }
    });

    // Incoming Chat Message
    wsService.on('CHAT_MESSAGE', (data) => {
      const msgContainer = document.getElementById('chatMessages');
      if (msgContainer) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg';
        const isSelf = data.sender === wsService.userName;
        const displayName = isSelf ? `${data.sender} (You)` : `${data.sender} (${data.role})`;
        msgDiv.innerHTML = `<strong>${displayName}:</strong> ${data.text}`;
        msgContainer.appendChild(msgDiv);
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }
    });

    // Teacher Disconnected Warning
    wsService.on('TEACHER_DISCONNECTED', (data) => {
      this.showToast(`⚠️ ${data.message}`);
    });

    // Class Ended Notification
    wsService.on('CLASS_ENDED', (data) => {
      this.showToast(`🔴 ${data.message}`);
      setTimeout(() => this.closeClassroom(), 1500);
    });

    // Backend Security / Error Handler
    wsService.on('ERROR', (data) => {
      this.showToast(`⚠️ ${data.message || 'WebSocket Error'}`);
    });

    // WebRTC Incoming Stream Listener (For Student Viewer)
    webrtcService.on('teacher_stream', ({ stream }) => {
      console.log('[WebRTC UI] Attaching Teacher Video Stream to Student Viewport');
      if (this.teacherLiveVideo) {
        this.teacherLiveVideo.srcObject = stream;
        this.teacherLiveVideo.muted = false;
        this.teacherLiveVideo.play().catch(() => {});
        const camOverlay = document.getElementById('cameraOffOverlay');
        if (camOverlay) camOverlay.classList.add('hidden');
      }
    });

    // WebRTC Teacher Media State Listener (Camera On/Off & Mic Mute/Unmute)
    webrtcService.on('teacher_media_state', (data) => {
      const mediaState = data.mediaState || data.payload;
      if (!mediaState) return;

      const camOverlay = document.getElementById('cameraOffOverlay');
      const micBadge = document.getElementById('micMutedBadge');

      if (camOverlay) {
        if (mediaState.video_enabled === false) {
          camOverlay.classList.remove('hidden');
        } else {
          camOverlay.classList.add('hidden');
        }
      }

      if (micBadge) {
        if (mediaState.audio_enabled === false) {
          micBadge.classList.remove('hidden');
        } else {
          micBadge.classList.add('hidden');
        }
      }
    });

    // Expand / Minimize Floating Video Container
    document.getElementById('btnExpandVideo')?.addEventListener('click', () => {
      const container = document.getElementById('teacherVideoFloatingContainer');
      if (container) container.classList.toggle('expanded');
    });

    // Student Local Audio Volume Control
    const volSlider = document.getElementById('studentVolumeSlider');
    volSlider?.addEventListener('input', (e) => {
      if (this.teacherLiveVideo) {
        this.teacherLiveVideo.volume = parseFloat(e.target.value);
      }
    });

    document.getElementById('btnStudentMuteToggle')?.addEventListener('click', () => {
      if (this.teacherLiveVideo) {
        this.teacherLiveVideo.muted = !this.teacherLiveVideo.muted;
        this.showToast(this.teacherLiveVideo.muted ? '🔇 Muted Teacher Audio Locally' : '🔊 Unmuted Teacher Audio');
      }
    });

    // Teacher Media Toggles (Mic Mute & Camera Toggle)
    const btnMic = document.getElementById('btnToggleMic');
    btnMic?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      const isMicOn = webrtcService.toggleMic();
      if (btnMic) {
        btnMic.className = `btn-media-toggle ${isMicOn ? 'active' : 'off'}`;
        btnMic.innerHTML = `<span class="icon">${isMicOn ? '🎤' : '🔇'}</span> Mic ${isMicOn ? 'ON' : 'OFF'}`;
      }
      this.showToast(isMicOn ? '🎤 Microphone Activated' : '🔇 Microphone Muted');
    });

    const btnCam = document.getElementById('btnToggleCameraMedia');
    btnCam?.addEventListener('click', () => {
      if (this.userRole !== 'teacher') return;
      const isCamOn = webrtcService.toggleCamera();
      if (btnCam) {
        btnCam.className = `btn-media-toggle ${isCamOn ? 'active' : 'off'}`;
        btnCam.innerHTML = `<span class="icon">${isCamOn ? '📹' : '📷'}</span> Cam ${isCamOn ? 'ON' : 'OFF'}`;
      }
      const camOverlay = document.getElementById('cameraOffOverlay');
      if (camOverlay) {
        if (!isCamOn) camOverlay.classList.remove('hidden');
        else camOverlay.classList.add('hidden');
      }
      this.showToast(isCamOn ? '📹 Teacher Camera Enabled' : '📷 Teacher Camera Disabled');
    });
  }

  async openClassroom(title = 'Exploring Our Solar System in 3D', code = 'EDU-8924', modelType = 'solar', role = 'student', chapterContext = null) {
    if (!this.overlay) return;

    this.isClassroomActive = true;
    this.userRole = role;
    this.currentCode = code.toUpperCase();
    this.overlay.classList.remove('hidden');

    if (this.liveClassTitle) this.liveClassTitle.textContent = title;
    if (this.liveClassCode) this.liveClassCode.textContent = `CODE: ${this.currentCode}`;

    // Fallback for "coming-soon" model types
    const activeModel = modelType === 'coming-soon' ? 'solar' : modelType;

    // Initialize 3D Classroom canvas
    this.threeEngine.initClassroomCanvas(this.viewport);
    this.threeEngine.switchModel(activeModel);

    if (modelType === 'coming-soon') {
      this.showToast('ℹ️ 3D model coming soon for this chapter. Displaying 3D Solar System visualizer.');
    }

    this.updateLessonInfoCard(activeModel, chapterContext);
    this.updateObjectFocusBar(activeModel);

    // Apply Role-based UI visibility
    this.applyRoleUI(role);

    // Connect to WebSocket server
    wsService.connect();

    if (role === 'teacher') {
      const teacherName = (JSON.parse(localStorage.getItem('edugester_user') || '{}').name) || 'Dr. Sarah Jenkins';
      
      wsService.createRoom(this.currentCode, title, activeModel, teacherName, this.threeEngine.getState());

      // Bind teacher hand gesture updates to throttled WebSocket stream
      this.gestureEngine.onGestureDetected = (gestureInfo) => {
        this.updateGestureHUD(gestureInfo);
        this.broadcastTeacherTransform(gestureInfo);
      };

      // 1. Start Teacher Live Video & Audio Stream (WebRTC)
      const mediaRes = await webrtcService.startTeacherMedia(this.teacherLiveVideo);
      if (mediaRes.success) {
        this.showToast('📹 Teacher Camera & Audio Stream Live over WebRTC!');
        // 2. Reuse Teacher stream for MediaPipe Gesture Engine
        await this.gestureEngine.startWebcam(this.videoEl, this.canvasEl);
        if (this.camBtnText) this.camBtnText.textContent = 'Webcam Gesture: ON (Active)';
      } else {
        if (this.camBtnText) this.camBtnText.textContent = 'Webcam Gesture: Virtual Mode';
        this.showToast(`🖐 Virtual Mode: ${mediaRes.error}`);
      }
    } else {
      // Student mode: Receive-only WebRTC receiver
      this.gestureEngine.stopWebcam();
      this.gestureEngine.stopVirtualSim();
      this.gestureEngine.onGestureDetected = null;

      const studentName = (JSON.parse(localStorage.getItem('edugester_user') || '{}').name) || 'Alex Rivera';
      wsService.joinRoom(this.currentCode, studentName);

      this.updateGestureHUD({
        icon: '📡',
        name: 'Live Teacher View',
        desc: 'Interactive 3D Classroom Viewer',
      });

      this.showToast(`🎓 Joined live classroom ${this.currentCode} as Student Viewer`);
    }
  }

  applyRoleUI(role) {
    const teacherEls = document.querySelectorAll('.teacher-only');
    const studentEls = document.querySelectorAll('.student-only');
    const badge = document.getElementById('classSessionBadge');
    const modeBanner = document.getElementById('modeIndicatorText');

    if (role === 'teacher') {
      teacherEls.forEach(el => el.classList.remove('hidden'));
      studentEls.forEach(el => el.classList.add('hidden'));

      if (badge) {
        badge.className = 'badge live-badge';
        badge.innerHTML = '<span class="pulse-dot red"></span> TEACHER CONTROLLER';
      }
      if (modeBanner) {
        modeBanner.textContent = '🔴 LIVE EXPLANATION MODE';
      }
      if (this.gestureBadgeLabel) this.gestureBadgeLabel.textContent = 'TEACHER DETECTED GESTURE';
    } else {
      teacherEls.forEach(el => el.classList.add('hidden'));
      studentEls.forEach(el => el.classList.remove('hidden'));

      if (badge) {
        badge.className = 'badge student-status-badge';
        badge.innerHTML = '<span class="pulse-dot green"></span> STUDENT VIEWER MODE';
      }
      if (modeBanner) {
        modeBanner.textContent = '📡 VIEW-ONLY STREAM';
      }
      if (this.gestureBadgeLabel) this.gestureBadgeLabel.textContent = 'LIVE TEACHER ACTION';
    }
  }

  updateLessonInfoCard(modelType, chapterContext = null) {
    const data = LESSON_DETAILS[modelType] || LESSON_DETAILS['solar'];
    const titleEl = document.getElementById('lessonTopicTitle');
    const descEl = document.getElementById('lessonTopicDesc');
    const listEl = document.getElementById('lessonKeyPointsList');

    if (titleEl) titleEl.textContent = chapterContext ? chapterContext.chapterTitle : data.title;
    if (descEl) descEl.textContent = chapterContext ? chapterContext.chapterDesc : data.desc;
    if (listEl) {
      listEl.innerHTML = data.points.map(pt => `<td>• ${pt}</td>`).join('');
    }

    // Populate Chapter Information Panel in left sidebar
    const panelTitle = document.getElementById('panelChapterTitle');
    const panelClass = document.getElementById('panelClassTag');
    const panelSubject = document.getElementById('panelSubjectTag');
    const panelChapter = document.getElementById('panelChapterTag');
    const panelDesc = document.getElementById('panelChapterDesc');

    if (chapterContext) {
      if (panelTitle) panelTitle.textContent = chapterContext.chapterTitle || '3D Lesson';
      if (panelClass) panelClass.textContent = chapterContext.className || 'Class 10';
      if (panelSubject) panelSubject.textContent = chapterContext.subjectName || 'Science';
      if (panelChapter) panelChapter.textContent = chapterContext.chapterTitle || 'Interactive Chapter';
      if (panelDesc) panelDesc.textContent = chapterContext.chapterDesc || 'Explore interactive 3D learning models.';
    } else {
      if (panelTitle) panelTitle.textContent = data.title;
      if (panelClass) panelClass.textContent = 'Class 10';
      if (panelSubject) panelSubject.textContent = 'Science';
      if (panelChapter) panelChapter.textContent = '3D Module';
      if (panelDesc) panelDesc.textContent = data.desc;
    }
  }

  broadcastTeacherTransform(gestureInfo = null) {
    if (this.userRole !== 'teacher' || !this.isClassroomActive) return;
    const state = this.threeEngine.getState();
    wsService.sendTeacherTransform(state, gestureInfo);
  }

  updateRosterUI(rosterList) {
    const container = document.getElementById('panelRoster');
    const rosterText = document.getElementById('tabRosterText');
    if (!container || !Array.isArray(rosterList)) return;

    if (rosterText) {
      rosterText.textContent = `Students (${rosterList.length})`;
    }

    container.innerHTML = rosterList.map(user => `
      <div class="user-item ${user.role === 'teacher' ? 'teacher' : ''}">
        <div class="user-avatar">${(user.name || 'U').substring(0, 2).toUpperCase()}</div>
        <div class="user-info">
          <strong>${user.name} ${user.id === wsService.ws?.id ? '(You)' : ''}</strong>
          <span class="${user.role === 'teacher' ? 'role-badge' : 'status-online'}">
            ${user.role === 'teacher' ? '👨‍🏫 Teacher' : 'Online'}
          </span>
        </div>
      </div>
    `).join('');
  }

  endClassByTeacher() {
    if (this.userRole !== 'teacher') return;
    wsService.sendTeacherAction('END_CLASS');
    webrtcService.stopAllMedia();
    this.closeClassroom();
    this.showToast('Class ended successfully.');
  }

  closeClassroom() {
    this.isClassroomActive = false;
    if (this.overlay) this.overlay.classList.add('hidden');
    webrtcService.stopAllMedia();
    this.gestureEngine.stopWebcam();
    this.gestureEngine.stopVirtualSim();
    this.showToast('Exited classroom session.');
  }

  updateGestureHUD(gestureInfo) {
    if (this.gestureBadgeIcon && this.gestureBadgeText) {
      this.gestureBadgeIcon.textContent = gestureInfo.icon || '🖐';
      this.gestureBadgeText.textContent = `${gestureInfo.name} (${gestureInfo.desc})`;
    }

    const stageIcon = document.getElementById('stageGestureIcon');
    const stageName = document.getElementById('stageGestureName');
    if (stageIcon) stageIcon.textContent = gestureInfo.icon || '🖐';
    if (stageName) stageName.textContent = gestureInfo.name || 'Active Gesture';
  }

  updateObjectFocusBar(modelType) {
    const container = document.getElementById('dashObjectsCarousel');
    if (!container) return;

    this.currentFocusIndex = 0;
    this.currentFocusObjects = MODEL_FOCUS_OBJECTS[modelType] || MODEL_FOCUS_OBJECTS['solar'];

    container.innerHTML = this.currentFocusObjects.map((item, idx) => `
      <button class="dash-object-btn ${idx === 0 ? 'active' : ''}" data-index="${idx}">
        <span class="icon">${item.icon}</span>
        <span class="name">${item.name}</span>
      </button>
    `).join('');

    container.querySelectorAll('.dash-object-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index, 10);
        this.selectFocusObject(index);
      });
    });

    if (this.currentFocusObjects.length > 0) {
      this.selectFocusObject(0, false);
    }
  }

  selectFocusObject(index, notify = true) {
    if (!this.currentFocusObjects || this.currentFocusObjects.length === 0) return;
    this.currentFocusIndex = (index + this.currentFocusObjects.length) % this.currentFocusObjects.length;
    const obj = this.currentFocusObjects[this.currentFocusIndex];

    document.querySelectorAll('.dash-object-btn').forEach((b, i) => {
      if (i === this.currentFocusIndex) b.classList.add('active');
      else b.classList.remove('active');
    });

    this.showBriefInfoCard(obj);
    this.threeEngine.highlightPart(obj.name);

    if (notify) {
      this.showToast(`Focused on ${obj.icon} ${obj.name}`);
    }
  }

  focusNextObject(direction = 1) {
    if (!this.currentFocusObjects) return;
    const nextIdx = this.currentFocusIndex + direction;
    this.selectFocusObject(nextIdx);
  }

  showBriefInfoCard(obj) {
    const panel = document.getElementById('mockupObjectInfoPanel');
    const icon = document.getElementById('objInfoIcon');
    const title = document.getElementById('objInfoTitle');
    const desc = document.getElementById('objInfoDesc');
    const metaType = document.getElementById('objMetaType');
    const metaDiameter = document.getElementById('objMetaDiameter');
    const metaTemp = document.getElementById('objMetaTemp');
    const metaDist = document.getElementById('objMetaDist');

    if (!panel) return;
    if (icon) icon.textContent = obj.icon || '☀️';
    if (title) title.textContent = (obj.name || 'SUN').toUpperCase();
    if (desc) desc.textContent = obj.info || 'Explore 3D planetary characteristics.';
    if (metaType) metaType.textContent = obj.type || 'Celestial Object';
    if (metaDiameter) metaDiameter.textContent = obj.diameter || '1.39M km';
    if (metaTemp) metaTemp.textContent = obj.temp || '5,778 K';
    if (metaDist) metaDist.textContent = obj.distFromEarth || '149.6M km';

    panel.classList.remove('hidden');
  }
}
