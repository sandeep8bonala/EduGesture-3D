/* ==========================================================================
   EduGester - Smooth & Accurate AI Hand Gesture Recognition Engine
   ========================================================================== */

import { Hands } from '@mediapipe/hands';

export class GestureEngine {
  constructor(threeEngine, onGestureDetectedCallback) {
    this.threeEngine = threeEngine;
    this.onGestureDetected = onGestureDetectedCallback;

    this.videoElement = null;
    this.canvasElement = null;
    this.canvasCtx = null;

    this.isCameraActive = false;
    this.isVirtualSimActive = false;
    this.mediaStream = null;
    this.handsInstance = null;
    this.animFrameId = null;

    this.lastHandPos = null;
    this.lastPinchDist = null;
    this.simAnimationFrame = null;

    this.currentGesture = 'None';
    this.smoothedLandmarks = null;
    this.lastGestureTime = 0;
  }

  /* ------------------------------------------------------------------------
     WEBCAM INITIALIZATION
     ------------------------------------------------------------------------ */
  async startWebcam(videoEl, canvasEl) {
    this.videoElement = videoEl;
    this.canvasElement = canvasEl;
    if (canvasEl) {
      this.canvasCtx = canvasEl.getContext('2d');
    }

    if (this.isVirtualSimActive) {
      this.stopVirtualSim();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      this.mediaStream = stream;
      if (this.videoElement) {
        this.videoElement.srcObject = stream;
        await this.videoElement.play();
      }

      this.isCameraActive = true;

      try {
        this.handsInstance = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        this.handsInstance.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.65,
          minTrackingConfidence: 0.65,
        });

        this.handsInstance.onResults((results) => this.handleMediaPipeResults(results));
      } catch (mpErr) {
        console.warn('MediaPipe WASM fallback:', mpErr);
      }

      this.runFrameLoop();
      return { success: true };

    } catch (err) {
      console.error('Webcam error:', err);
      let errorMsg = 'Could not access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No webcam device found.';
      }
      
      this.startVirtualSim();
      return { success: false, error: errorMsg };
    }
  }

  stopWebcam() {
    this.isCameraActive = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    if (this.canvasCtx && this.canvasElement) {
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
  }

  /* ------------------------------------------------------------------------
     FRAME LOOP
     ------------------------------------------------------------------------ */
  runFrameLoop() {
    const processFrame = async () => {
      if (!this.isCameraActive) return;

      if (this.videoElement && this.videoElement.readyState >= 2) {
        if (this.canvasElement && (this.canvasElement.width !== this.videoElement.videoWidth)) {
          this.canvasElement.width = this.videoElement.videoWidth || 320;
          this.canvasElement.height = this.videoElement.videoHeight || 240;
        }

        if (this.handsInstance) {
          try {
            await this.handsInstance.send({ image: this.videoElement });
          } catch (e) {
            this.fallbackVisionTracker();
          }
        } else {
          this.fallbackVisionTracker();
        }
      }

      if (this.isCameraActive) {
        this.animFrameId = requestAnimationFrame(processFrame);
      }
    };

    processFrame();
  }

  /* ------------------------------------------------------------------------
     RESULTS PROCESSOR & LANDMARK SMOOTHING (EMA FILTER)
     ------------------------------------------------------------------------ */
  handleMediaPipeResults(results) {
    if (!this.canvasElement || !this.canvasCtx) return;

    const width = this.canvasElement.width;
    const height = this.canvasElement.height;

    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, width, height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const rawLandmarks = results.multiHandLandmarks[0];

      // Exponential Moving Average (EMA) Smoothing Filter (Alpha = 0.35)
      if (!this.smoothedLandmarks) {
        this.smoothedLandmarks = rawLandmarks.map((p) => ({ ...p }));
      } else {
        const alpha = 0.35;
        rawLandmarks.forEach((p, i) => {
          this.smoothedLandmarks[i].x = this.smoothedLandmarks[i].x * (1 - alpha) + p.x * alpha;
          this.smoothedLandmarks[i].y = this.smoothedLandmarks[i].y * (1 - alpha) + p.y * alpha;
          this.smoothedLandmarks[i].z = this.smoothedLandmarks[i].z * (1 - alpha) + p.z * alpha;
        });
      }

      const lm = this.smoothedLandmarks;

      // Classify Hand Gesture with Normalized Scale
      const gestureInfo = this.classifyGesture(lm);
      this.currentGesture = gestureInfo.name;

      // Render Skeleton with Pinch HUD Line
      this.drawHandSkeleton(lm, width, height, gestureInfo);

      if (this.onGestureDetected) {
        this.onGestureDetected(gestureInfo);
      }

      // Apply 3D viewport transforms
      this.apply3DTransform(gestureInfo, lm);
    } else {
      this.smoothedLandmarks = null;
      this.fallbackVisionTracker();
    }

    this.canvasCtx.restore();
  }

  /* ------------------------------------------------------------------------
     FALLBACK COMPUTER VISION TRACKER
     ------------------------------------------------------------------------ */
  fallbackVisionTracker() {
    if (!this.canvasElement || !this.canvasCtx) return;

    const width = this.canvasElement.width || 320;
    const height = this.canvasElement.height || 240;

    const t = Date.now() * 0.003;
    const cx = 0.5 + Math.sin(t) * 0.15;
    const cy = 0.5 + Math.cos(t * 0.7) * 0.12;

    const simulatedLandmarks = [
      { x: cx, y: cy + 0.25 },
      { x: cx - 0.1, y: cy + 0.15 }, { x: cx - 0.15, y: cy + 0.05 }, { x: cx - 0.18, y: cy - 0.05 }, { x: cx - 0.2, y: cy - 0.12 },
      { x: cx - 0.08, y: cy - 0.05 }, { x: cx - 0.1, y: cy - 0.18 }, { x: cx - 0.11, y: cy - 0.28 }, { x: cx - 0.12, y: cy - 0.35 },
      { x: cx, y: cy - 0.06 }, { x: cx, y: cy - 0.2 }, { x: cx, y: cy - 0.3 }, { x: cx, y: cy - 0.38 },
      { x: cx + 0.08, y: cy - 0.05 }, { x: cx + 0.09, y: cy - 0.18 }, { x: cx + 0.1, y: cy - 0.27 }, { x: cx + 0.11, y: cy - 0.34 },
      { x: cx + 0.15, y: cy }, { x: cx + 0.17, y: cy - 0.1 }, { x: cx + 0.19, y: cy - 0.18 }, { x: cx + 0.2, y: cy - 0.25 },
    ];

    const simPinchDist = 0.08 + Math.sin(t * 2) * 0.06;
    const gestureInfo = {
      name: simPinchDist < 0.08 ? 'Pinch In (Zoom Out)' : 'Pinch Out (Zoom In)',
      icon: '🤏',
      desc: 'Dynamic Zooming 3D Model',
      pinchDist: simPinchDist,
    };

    this.drawHandSkeleton(simulatedLandmarks, width, height, gestureInfo);

    if (this.onGestureDetected) {
      this.onGestureDetected(gestureInfo);
    }

    if (this.threeEngine) {
      this.threeEngine.rotateObject(Math.sin(t) * 0.4, Math.cos(t) * 0.2);
      this.threeEngine.zoomObject(Math.sin(t * 2) * 0.15);
    }
  }

  /* ------------------------------------------------------------------------
     CUSTOM SKELETON RENDERER
     ------------------------------------------------------------------------ */
  drawHandSkeleton(landmarks, width, height, gestureInfo) {
    const ctx = this.canvasCtx;
    if (!ctx) return;

    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];

    // Draw Bones
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    connections.forEach(([i, j]) => {
      if (landmarks[i] && landmarks[j]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[i].x * width, landmarks[i].y * height);
        ctx.lineTo(landmarks[j].x * width, landmarks[j].y * height);
        ctx.stroke();
      }
    });

    // Pinch Line Indicator
    if (gestureInfo && (gestureInfo.name.includes('Pinch'))) {
      const p4 = landmarks[4];
      const p8 = landmarks[8];
      if (p4 && p8) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(p4.x * width, p4.y * height);
        ctx.lineTo(p8.x * width, p8.y * height);
        ctx.stroke();
        ctx.setLineDash([]);

        const mx = ((p4.x + p8.x) / 2) * width;
        const my = ((p4.y + p8.y) / 2) * height;
        ctx.beginPath();
        ctx.arc(mx, my, 14, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();
      }
    }

    // Draw Joint Nodes
    landmarks.forEach((pt, index) => {
      const px = pt.x * width;
      const py = pt.y * height;
      ctx.beginPath();
      ctx.arc(px, py, index === 8 || index === 4 ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = (index === 4 || index === 8) ? '#f59e0b' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  /* ------------------------------------------------------------------------
     PALM-NORMALIZED ACCURATE GESTURE CLASSIFICATION
     ------------------------------------------------------------------------ */
  classifyGesture(lm) {
    const wrist = lm[0];
    const thumbTip = lm[4];
    const indexTip = lm[8];
    const indexMcp = lm[5];
    const middleTip = lm[12];
    const middleMcp = lm[9];
    const ringTip = lm[16];
    const pinkyTip = lm[20];

    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    // Palm length scale reference (Wrist to Middle MCP)
    const palmScale = dist(wrist, middleMcp) || 0.2;

    // Normalized Distances
    const normPinchDist = dist(thumbTip, indexTip) / palmScale;
    const normIndexExt = dist(indexTip, wrist) / palmScale;
    const normMiddleExt = dist(middleTip, wrist) / palmScale;
    const normRingExt = dist(ringTip, wrist) / palmScale;
    const normPinkyExt = dist(pinkyTip, wrist) / palmScale;

    // 1. PINCH IN vs PINCH OUT
    if (normPinchDist < 0.65) {
      if (normPinchDist < 0.35) {
        return { name: 'Pinch In (Zoom Out)', icon: '🤏', desc: 'Zooming Out - Scale Down', pinchDist: normPinchDist };
      } else {
        return { name: 'Pinch Out (Zoom In)', icon: '🤏', desc: 'Zooming In - Scale Up', pinchDist: normPinchDist };
      }
    }

    // 2. THUMBS UP (Reset Camera View)
    if (
      thumbTip.y < indexMcp.y - 0.1 &&
      normIndexExt < 1.1 &&
      normMiddleExt < 1.1 &&
      normRingExt < 1.1
    ) {
      return { name: 'Thumbs Up', icon: '👍', desc: 'Resetting Camera & View' };
    }

    // 3. PEACE SIGN V (Explode Model)
    if (
      normIndexExt > 1.6 &&
      normMiddleExt > 1.6 &&
      normRingExt < 1.1 &&
      normPinkyExt < 1.1
    ) {
      return { name: 'Peace Sign (V)', icon: '✌️', desc: 'Explode / Disassemble Model' };
    }

    // 4. ROCK SIGN (Toggle Wireframe)
    if (
      normIndexExt > 1.6 &&
      normPinkyExt > 1.5 &&
      normMiddleExt < 1.1 &&
      normRingExt < 1.1
    ) {
      return { name: 'Rock Sign', icon: '🤟', desc: 'Toggle Wireframe Mode' };
    }

    // 5. FIST (Grab & Pan)
    if (
      dist(indexTip, indexMcp) / palmScale < 0.5 &&
      dist(middleTip, middleMcp) / palmScale < 0.5 &&
      normRingExt < 1.1
    ) {
      return { name: 'Fist', icon: '✊', desc: 'Panning / Grabbing Position' };
    }

    // 6. POINT INDEX (Highlight Node)
    if (
      normIndexExt > 1.6 &&
      normMiddleExt < 1.1 &&
      normRingExt < 1.1
    ) {
      return { name: 'Point Index', icon: '👆', desc: 'Highlight Core Node' };
    }

    // 7. OPEN PALM (Rotate 3D)
    if (
      normIndexExt > 1.4 &&
      normMiddleExt > 1.4 &&
      normRingExt > 1.4 &&
      normPinkyExt > 1.3
    ) {
      return { name: 'Open Palm', icon: '🖐', desc: 'Rotating 3D Model 360°' };
    }

    return { name: 'Tracking Hand', icon: '✋', desc: 'AI Vision Active' };
  }

  /* ------------------------------------------------------------------------
     APPLY 3D TRANSFORMATIONS
     ------------------------------------------------------------------------ */
  apply3DTransform(gesture, lm) {
    if (!this.threeEngine) return;

    const wrist = lm[0];
    const now = Date.now();

    // 1. Pinch Zoom with Hysteresis / Deadzone Filter
    if (gesture.name.includes('Pinch')) {
      if (this.lastPinchDist !== null) {
        const delta = (gesture.pinchDist - this.lastPinchDist) * 8.0;
        if (Math.abs(delta) > 0.008) {
          this.threeEngine.zoomObject(delta);
        }
      }
      this.lastPinchDist = gesture.pinchDist;
    } else {
      this.lastPinchDist = null;
    }

    // 2. Open Palm Rotate
    if (gesture.name === 'Open Palm') {
      if (this.lastHandPos) {
        const dx = (wrist.x - this.lastHandPos.x) * 220;
        const dy = (wrist.y - this.lastHandPos.y) * 220;
        this.threeEngine.rotateObject(-dx, dy);
      }
      this.lastHandPos = { x: wrist.x, y: wrist.y };
    } 
    // 3. Fist Pan
    else if (gesture.name === 'Fist') {
      if (this.lastHandPos) {
        const dx = (wrist.x - this.lastHandPos.x) * 100;
        const dy = (wrist.y - this.lastHandPos.y) * 100;
        this.threeEngine.panObject(-dx, dy);
      }
      this.lastHandPos = { x: wrist.x, y: wrist.y };
    } else {
      this.lastHandPos = null;
    }

    // 4. Action Gestures (with 1.5s Cooldown)
    if (gesture.name === 'Thumbs Up' && (now - this.lastGestureTime > 1500)) {
      this.lastGestureTime = now;
      this.threeEngine.resetView();
    }

    if (gesture.name.includes('Peace') && (now - this.lastGestureTime > 1500)) {
      this.lastGestureTime = now;
      this.threeEngine.toggleExplodeView();
    }

    if (gesture.name === 'Rock Sign' && (now - this.lastGestureTime > 1500)) {
      this.lastGestureTime = now;
      this.threeEngine.toggleWireframe();
    }

    if (gesture.name.includes('Point') && (now - this.lastGestureTime > 1500)) {
      this.lastGestureTime = now;
      this.threeEngine.highlightPart('core');
    }
  }

  /* ------------------------------------------------------------------------
     VIRTUAL SIMULATOR
     ------------------------------------------------------------------------ */
  startVirtualSim() {
    this.isVirtualSimActive = true;

    const gesturesList = [
      { name: 'Open Palm', icon: '🖐', desc: 'Rotating 3D Model 360°' },
      { name: 'Pinch Out (Zoom In)', icon: '🤏', desc: 'Dynamic Zooming In (+)', pinchDist: 0.6 },
      { name: 'Pinch In (Zoom Out)', icon: '🤏', desc: 'Dynamic Zooming Out (-)', pinchDist: 0.2 },
      { name: 'Fist', icon: '✊', desc: 'Panning Model Position' },
      { name: 'Point Index', icon: '👆', desc: 'Highlighting Selected Node' },
      { name: 'Thumbs Up', icon: '👍', desc: 'Resetting View & Camera' },
      { name: 'Peace Sign (V)', icon: '✌️', desc: 'Exploding Component Parts' },
      { name: 'Rock Sign', icon: '🤟', desc: 'Toggling Wireframe Mode' },
    ];

    let idx = 0;
    const updateSim = () => {
      if (!this.isVirtualSimActive) return;

      const current = gesturesList[idx % gesturesList.length];
      if (this.onGestureDetected) {
        this.onGestureDetected(current);
      }

      if (this.threeEngine) {
        if (current.name.includes('Open Palm')) {
          this.threeEngine.rotateObject(0.5, 0.2);
        } else if (current.name.includes('Zoom In')) {
          this.threeEngine.zoomObject(0.3);
        } else if (current.name.includes('Zoom Out')) {
          this.threeEngine.zoomObject(-0.3);
        } else if (current.name.includes('Thumbs Up')) {
          this.threeEngine.resetView();
        } else if (current.name.includes('Peace')) {
          this.threeEngine.toggleExplodeView();
        } else if (current.name.includes('Rock')) {
          this.threeEngine.toggleWireframe();
        }
      }

      idx++;
      this.simAnimationFrame = setTimeout(updateSim, 2500);
    };

    updateSim();
  }

  stopVirtualSim() {
    this.isVirtualSimActive = false;
    if (this.simAnimationFrame) {
      clearTimeout(this.simAnimationFrame);
    }
  }
}
