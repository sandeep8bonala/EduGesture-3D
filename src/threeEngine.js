/* ==========================================================================
   EduGester - Hero 3D Solar System Hologram & Classroom Engine
   ========================================================================== */

import * as THREE from 'three';

export class ThreeEngine {
  constructor() {
    this.heroScene = null;
    this.heroCamera = null;
    this.heroRenderer = null;
    this.heroSolarGroup = null;
    this.heroPlanets = [];
    this.heroAnimationId = null;

    this.classScene = null;
    this.classCamera = null;
    this.classRenderer = null;
    this.classAnimationId = null;
    this.currentClassGroup = null;
    this.currentModelType = 'solar';

    // References for dynamic model animations
    this.planets = [];
    this.moonMesh = null;
    this.dnaPairs = [];
    this.atomElectrons = [];
    this.robotClawLeft = null;
    this.robotClawRight = null;
    this.heartMesh = null;

    // View & Animation State
    this.isWireframe = false;
    this.isExploded = false;
    this.isAnimating = true;
    this.highlightedPart = null;
    this.highlightHaloMesh = null;

    // Mouse / Touch Controls
    this.isMouseDown = false;
    this.prevMousePos = { x: 0, y: 0 };
  }

  /* ------------------------------------------------------------------------
     HERO SECTION - 3D SOLAR SYSTEM HOLOGRAM OVER BLUE CIRCULAR PEDESTAL
     (Matching Second Reference Image)
     ------------------------------------------------------------------------ */
  initHeroCanvas(container) {
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 520;

    this.heroScene = new THREE.Scene();

    this.heroCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.heroCamera.position.set(0, 3.5, 9);
    this.heroCamera.lookAt(0, 0.5, 0);

    this.heroRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.heroRenderer.setSize(width, height);
    this.heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.heroRenderer.shadowMap.enabled = true;
    container.appendChild(this.heroRenderer.domElement);

    // Studio Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.heroScene.add(ambLight);

    const sunLight = new THREE.PointLight(0xffaa00, 5, 25);
    sunLight.position.set(-3, 1, 0);
    this.heroScene.add(sunLight);

    const pedestalBlueLight = new THREE.PointLight(0x00a4ef, 4, 20);
    pedestalBlueLight.position.set(0, -1.5, 0);
    this.heroScene.add(pedestalBlueLight);

    // 1. Blue Circular Hologram Pedestal Base (Matching Image 2)
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.y = -1.6;

    for (let r = 1; r <= 4; r++) {
      const ringGeo = new THREE.RingGeometry(r * 0.7 - 0.05, r * 0.7 + 0.05, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00a4ef,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8 - r * 0.15,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      pedestalGroup.add(ringMesh);
    }

    // Holographic Cylinder Light Beam
    const beamGeo = new THREE.CylinderGeometry(2.6, 2.8, 1.2, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00a4ef,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = 0.6;
    pedestalGroup.add(beamMesh);

    this.heroScene.add(pedestalGroup);

    // 2. Solar System Group
    this.heroSolarGroup = new THREE.Group();
    this.heroSolarGroup.position.set(-0.5, 0.2, 0);

    // Sun (Fiery Orange/Red)
    const sunGeo = new THREE.SphereGeometry(1.1, 32, 32);
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff6600,
      emissiveIntensity: 2.0,
      roughness: 0.2,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(-3.2, 0.5, 0);
    this.heroSolarGroup.add(sunMesh);

    // Sun Glow Halo
    const haloGeo = new THREE.SphereGeometry(1.35, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.35 });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.copy(sunMesh.position);
    this.heroSolarGroup.add(haloMesh);

    // Planets (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune)
    const heroPlanetData = [
      { name: 'Mercury', dist: 1.8, size: 0.12, color: 0xa1a1aa },
      { name: 'Venus', dist: 2.3, size: 0.18, color: 0xfde047 },
      { name: 'Earth', dist: 2.9, size: 0.24, color: 0x3b82f6 },
      { name: 'Mars', dist: 3.5, size: 0.17, color: 0xef4444 },
      { name: 'Jupiter', dist: 4.3, size: 0.42, color: 0xf97316 },
      { name: 'Saturn', dist: 5.3, size: 0.38, color: 0xeab308, hasRings: true },
      { name: 'Uranus', dist: 6.2, size: 0.28, color: 0x06b6d4 },
      { name: 'Neptune', dist: 7.0, size: 0.26, color: 0x2563eb },
    ];

    this.heroPlanets = [];
    heroPlanetData.forEach((pd) => {
      // Elliptical Orbit Line
      const orbitGeo = new THREE.RingGeometry(pd.dist - 0.02, pd.dist + 0.02, 64);
      const orbitMat = new THREE.MeshBasicMaterial({ color: 0x1e3a8a, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
      const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
      orbitRing.position.copy(sunMesh.position);
      orbitRing.rotation.x = Math.PI / 2.3;
      this.heroSolarGroup.add(orbitRing);

      // Planet Mesh
      const pGeo = new THREE.SphereGeometry(pd.size, 32, 32);
      const pMat = new THREE.MeshStandardMaterial({ color: pd.color, roughness: 0.4, metalness: 0.2 });
      const pMesh = new THREE.Mesh(pGeo, pMat);

      if (pd.hasRings) {
        const ringGeo = new THREE.RingGeometry(pd.size * 1.4, pd.size * 2.2, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        const saturnRing = new THREE.Mesh(ringGeo, ringMat);
        saturnRing.rotation.x = Math.PI / 3;
        pMesh.add(saturnRing);
      }

      this.heroSolarGroup.add(pMesh);

      const angle = (pd.dist / 7.0) * Math.PI * 0.8 - 0.4;
      pMesh.position.set(
        sunMesh.position.x + Math.cos(angle) * pd.dist * 1.1,
        sunMesh.position.y + Math.sin(angle * 0.5) * 0.3,
        Math.sin(angle) * pd.dist * 0.5
      );

      this.heroPlanets.push({ mesh: pMesh, baseAngle: angle, dist: pd.dist, sunPos: sunMesh.position });
    });

    this.heroScene.add(this.heroSolarGroup);

    // 3. Floating Dust Particles
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 200;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 12;
      posArray[i + 1] = (Math.random() - 0.5) * 6;
      posArray[i + 2] = (Math.random() - 0.5) * 10;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({ size: 0.04, color: 0x60a5fa, transparent: true, opacity: 0.7 });
    this.heroScene.add(new THREE.Points(particleGeo, particleMat));

    window.addEventListener('resize', () => {
      if (!container || !this.heroCamera || !this.heroRenderer) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      this.heroCamera.aspect = newW / newH;
      this.heroCamera.updateProjectionMatrix();
      this.heroRenderer.setSize(newW, newH);
    });

    const animate = () => {
      this.heroAnimationId = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;

      if (this.heroSolarGroup) {
        this.heroSolarGroup.position.y = 0.2 + Math.sin(t * 1.5) * 0.08;
      }

      this.heroPlanets.forEach((p, idx) => {
        p.mesh.rotation.y += 0.015;
        const currentAngle = p.baseAngle + Math.sin(t * 0.5 + idx) * 0.08;
        p.mesh.position.x = p.sunPos.x + Math.cos(currentAngle) * p.dist * 1.1;
        p.mesh.position.z = Math.sin(currentAngle) * p.dist * 0.5;
      });

      this.heroRenderer.render(this.heroScene, this.heroCamera);
    };
    animate();
  }


  /* ------------------------------------------------------------------------
     CLASSROOM 3D VIEWPORT INITIALIZATION
     ------------------------------------------------------------------------ */
  initClassroomCanvas(container) {
    if (!container) return;

    container.innerHTML = '';
    if (this.classAnimationId) cancelAnimationFrame(this.classAnimationId);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    this.classScene = new THREE.Scene();
    this.classScene.background = new THREE.Color(0x050811);

    this.classCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.classCamera.position.set(0, 0, 7);

    this.classRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.classRenderer.setSize(width, height);
    this.classRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.classRenderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.classScene.add(ambLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.4);
    mainLight.position.set(6, 12, 8);
    this.classScene.add(mainLight);

    const blueRimLight = new THREE.PointLight(0x3b82f6, 3, 30);
    blueRimLight.position.set(-6, -4, -4);
    this.classScene.add(blueRimLight);

    const purpleLight = new THREE.PointLight(0x8b5cf6, 2, 20);
    purpleLight.position.set(4, -6, 5);
    this.classScene.add(purpleLight);

    // Deep Space Starfield (1200 twinkling stars)
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 120;
      starPositions[i + 1] = (Math.random() - 0.5) * 120;
      starPositions[i + 2] = (Math.random() - 0.5) * 120;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xe2e8f0, size: 0.12, transparent: true, opacity: 0.85 });
    this.classScene.add(new THREE.Points(starsGeo, starMat));

    // Cosmic Nebula Galaxy Particles
    const nebulaGeo = new THREE.BufferGeometry();
    const nebulaCount = 400;
    const nebulaPositions = new Float32Array(nebulaCount * 3);
    for (let i = 0; i < nebulaCount * 3; i += 3) {
      nebulaPositions[i] = (Math.random() - 0.5) * 90;
      nebulaPositions[i + 1] = (Math.random() - 0.5) * 40;
      nebulaPositions[i + 2] = -30 + (Math.random() - 0.5) * 40;
    }
    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
    const nebulaMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.45, transparent: true, opacity: 0.35 });
    this.classScene.add(new THREE.Points(nebulaGeo, nebulaMat));

    this.currentClassGroup = new THREE.Group();
    this.classScene.add(this.currentClassGroup);

    this.attachMouseControls(container);
    this.buildSolarSystem();

    window.addEventListener('resize', () => {
      if (!container || !this.classCamera || !this.classRenderer) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      this.classCamera.aspect = nw / nh;
      this.classCamera.updateProjectionMatrix();
      this.classRenderer.setSize(nw, nh);
    });

    const renderLoop = () => {
      this.classAnimationId = requestAnimationFrame(renderLoop);
      const time = Date.now() * 0.002;

      if (this.currentModelType === 'solar') {
        this.planets.forEach((p) => {
          p.angle += p.speed;
          p.mesh.position.x = Math.cos(p.angle) * p.distance;
          p.mesh.position.z = Math.sin(p.angle) * p.distance;
          p.mesh.rotation.y += 0.02;

          if (p.name === 'Earth' && this.moonMesh) {
            this.moonMesh.position.x = p.mesh.position.x + Math.cos(time * 3) * 0.55;
            this.moonMesh.position.z = p.mesh.position.z + Math.sin(time * 3) * 0.55;
          }
        });
      } else if (this.currentModelType === 'dna') {
        this.dnaPairs.forEach((pair, idx) => {
          pair.rotation.y = time + idx * 0.2;
        });
      } else if (this.currentModelType === 'atom') {
        this.atomElectrons.forEach((el, idx) => {
          const speed = time * (1.5 + idx * 0.5);
          el.mesh.position.x = Math.cos(speed) * el.radius;
          el.mesh.position.y = Math.sin(speed) * el.radius * Math.sin(el.angle);
          el.mesh.position.z = Math.sin(speed) * el.radius * Math.cos(el.angle);
        });
      } else if (this.currentModelType === 'heart') {
        const pulse = 1 + Math.sin(time * 4) * 0.07;
        if (this.heartMesh) this.heartMesh.scale.set(pulse, pulse, pulse);
      } else if (this.currentModelType === 'robot') {
        if (this.robotClawLeft && this.robotClawRight) {
          const clawAngle = Math.sin(time * 2) * 0.2;
          this.robotClawLeft.rotation.z = clawAngle;
          this.robotClawRight.rotation.z = -clawAngle;
        }
      }

      this.classRenderer.render(this.classScene, this.classCamera);
      this.update3DLabels();
    };
    renderLoop();
  }

  update3DLabels() {
    const labelsContainer = document.getElementById('canvas3dLabelsContainer');
    if (!labelsContainer || !this.classCamera || !this.classRenderer) return;

    const width = this.classRenderer.domElement.clientWidth || 800;
    const height = this.classRenderer.domElement.clientHeight || 600;
    const tempV = new THREE.Vector3();
    let html = '';

    if (this.currentModelType === 'solar' && this.planets && this.planets.length > 0) {
      this.planets.forEach((p) => {
        if (!p.mesh) return;
        p.mesh.getWorldPosition(tempV);
        tempV.project(this.classCamera);

        if (tempV.z < 1.0) {
          const x = (tempV.x * 0.5 + 0.5) * width;
          const y = (-(tempV.y * 0.5) + 0.5) * height;

          if (x >= -50 && x <= width + 50 && y >= -50 && y <= height + 50) {
            html += `
              <div class="planet-3d-label" style="left: ${x}px; top: ${y + 24}px;">
                <span class="label-icon">${p.icon || '🪐'}</span>
                <span class="label-text">${p.name}</span>
              </div>
            `;
          }
        }
      });
    }

    labelsContainer.innerHTML = html;
  }

  attachMouseControls(container) {
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? -0.3 : 0.3;
      this.zoomObject(zoomFactor);
    }, { passive: false });

    container.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    container.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;
      const dx = e.clientX - this.prevMousePos.x;
      const dy = e.clientY - this.prevMousePos.y;
      if (e.buttons === 1) {
        this.rotateObject(dx * 0.5, dy * 0.5);
      } else if (e.buttons === 2) {
        this.panObject(dx * 0.5, dy * 0.5);
      }
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /* ------------------------------------------------------------------------
     MODELS CREATOR (SOLAR SYSTEM, DNA, ATOM, POLYHEDRON, HEART, ROBOT)
     ------------------------------------------------------------------------ */
  buildSolarSystem() {
    this.clearCurrentModel();
    this.currentModelType = 'solar';
    this.planets = [];

    // 1. Sun Hyper-Realistic Core, Flares & Corona Glow
    const sunGeo = new THREE.SphereGeometry(1.35, 64, 64);
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      emissive: 0xffaa00,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.1
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.currentClassGroup.add(sunMesh);

    // Inner Glowing Plasma Shell
    const innerPlasmaGeo = new THREE.SphereGeometry(1.48, 32, 32);
    const innerPlasmaMat = new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0.45 });
    this.currentClassGroup.add(new THREE.Mesh(innerPlasmaGeo, innerPlasmaMat));

    // Outer Solar Flare Corona
    const coronaGeo = new THREE.SphereGeometry(1.65, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.25 });
    this.currentClassGroup.add(new THREE.Mesh(coronaGeo, coronaMat));

    // Sun Point Light Source
    const sunLight = new THREE.PointLight(0xffaa00, 3.5, 50);
    this.currentClassGroup.add(sunLight);

    // Register Sun Metadata
    this.planets.push({
      name: 'Sun',
      icon: '☀️',
      mesh: sunMesh,
      distance: 0,
      speed: 0,
      angle: 0,
      type: 'G2V Main Sequence Star',
      diameter: '1.39M km',
      temp: '5,778 K',
      distFromEarth: '149.6M km',
      info: 'The Sun is the star at the center of our solar system. It is a nearly perfect sphere of hot plasma, heating all planets through nuclear fusion.'
    });

    // 2. Realistic Planet Specifications & Procedural Shader Colors
    const planetData = [
      { name: 'Mercury', icon: '⚪', dist: 2.2, size: 0.18, color: 0xa8a29e, roughness: 0.9, speed: 0.022, type: 'Terrestrial Planet', diameter: '4,879 km', temp: '440 K', distFromEarth: '91.7M km', info: 'Smallest planet in the solar system, covered in impact craters with extreme day-night temperature swings.' },
      { name: 'Venus', icon: '🟡', dist: 3.1, size: 0.28, color: 0xeab308, roughness: 0.4, speed: 0.016, type: 'Terrestrial Planet', diameter: '12,104 km', temp: '737 K', distFromEarth: '41.4M km', info: 'Hottest planet in the solar system wrapped in dense toxic clouds of sulfuric acid with intense greenhouse pressure.' },
      { name: 'Earth', icon: '🌎', dist: 4.2, size: 0.34, color: 0x2563eb, roughness: 0.3, speed: 0.012, isEarth: true, type: 'Terrestrial Planet', diameter: '12,742 km', temp: '288 K', distFromEarth: '0 km', info: 'Our home planet, rich in liquid oceans, oxygen atmosphere, and dynamic tectonic landmasses that support life.' },
      { name: 'Mars', icon: '🔴', dist: 5.3, size: 0.24, color: 0xd97706, roughness: 0.7, speed: 0.009, isMars: true, type: 'Terrestrial Planet', diameter: '6,779 km', temp: '210 K', distFromEarth: '78.3M km', info: 'The Red Planet, featuring iron-oxide desert dust, giant Olympus Mons volcano, and Valles Marineris canyon.' },
      { name: 'Jupiter', icon: '🟤', dist: 7.2, size: 0.72, color: 0xc2410c, roughness: 0.5, speed: 0.005, isJupiter: true, type: 'Gas Giant', diameter: '139,820 km', temp: '165 K', distFromEarth: '628.7M km', info: 'Largest planet in the solar system, composed of hydrogen-helium gas bands with the iconic Great Red Spot storm.' },
      { name: 'Saturn', icon: '🪐', dist: 8.9, size: 0.60, color: 0xf59e0b, roughness: 0.5, speed: 0.0035, hasSaturnRings: true, type: 'Gas Giant', diameter: '116,460 km', temp: '134 K', distFromEarth: '1.2B km', info: 'Adorned with a magnificent multi-ring system composed of billions of icy rock particles and 82 moons.' },
      { name: 'Uranus', icon: '🔵', dist: 10.5, size: 0.44, color: 0x38bdf8, roughness: 0.3, speed: 0.0025, hasUranusRings: true, type: 'Ice Giant', diameter: '50,724 km', temp: '76 K', distFromEarth: '2.6B km', info: 'Ice giant rotating on an extreme 97.8° tilt, surrounded by 13 dark rings and a blue methane cloud mantle.' },
      { name: 'Neptune', icon: '🟦', dist: 11.9, size: 0.42, color: 0x1d4ed8, roughness: 0.3, speed: 0.0018, type: 'Ice Giant', diameter: '49,244 km', temp: '72 K', distFromEarth: '4.3B km', info: 'Outermost planet, whipped by 2,100 km/h supersonic winds and deep blue methane storms in the outer system.' }
    ];

    planetData.forEach((pd) => {
      // Orbit Ring Path Line
      const orbitGeo = new THREE.RingGeometry(pd.dist - 0.025, pd.dist + 0.025, 128);
      const orbitMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
      const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
      orbitRing.rotation.x = Math.PI / 2;
      this.currentClassGroup.add(orbitRing);

      // Planet Sphere Mesh
      const pGeo = new THREE.SphereGeometry(pd.size, 32, 32);
      const pMat = new THREE.MeshStandardMaterial({
        color: pd.color,
        roughness: pd.roughness,
        metalness: 0.2
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      this.currentClassGroup.add(pMesh);

      // Earth Moons & Clouds
      if (pd.isEarth) {
        const cloudGeo = new THREE.SphereGeometry(pd.size * 1.04, 32, 32);
        const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
        pMesh.add(new THREE.Mesh(cloudGeo, cloudMat));
      }

      // Mars Polar Ice Cap
      if (pd.isMars) {
        const capGeo = new THREE.SphereGeometry(pd.size * 0.4, 16, 16);
        const capMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = pd.size * 0.85;
        pMesh.add(cap);
      }

      // Saturn Cassini Rings System
      if (pd.hasSaturnRings) {
        const ringGeo1 = new THREE.RingGeometry(pd.size * 1.4, pd.size * 2.1, 64);
        const ringMat1 = new THREE.MeshBasicMaterial({ color: 0xd97706, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        const saturnRing1 = new THREE.Mesh(ringGeo1, ringMat1);
        saturnRing1.rotation.x = Math.PI / 2.3;
        pMesh.add(saturnRing1);

        const ringGeo2 = new THREE.RingGeometry(pd.size * 2.18, pd.size * 2.6, 64);
        const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xb45309, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
        const saturnRing2 = new THREE.Mesh(ringGeo2, ringMat2);
        saturnRing2.rotation.x = Math.PI / 2.3;
        pMesh.add(saturnRing2);

        pMesh.rotation.z = 0.45; // 26.7° Axial tilt
      }

      // Uranus Tilted Vertical Rings
      if (pd.hasUranusRings) {
        const uRingGeo = new THREE.RingGeometry(pd.size * 1.5, pd.size * 1.9, 64);
        const uRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
        const uRing = new THREE.Mesh(uRingGeo, uRingMat);
        uRing.rotation.y = Math.PI / 2;
        pMesh.add(uRing);

        pMesh.rotation.z = 1.7; // 97.8° Axial tilt
      }

      this.planets.push({
        name: pd.name,
        icon: pd.icon,
        mesh: pMesh,
        distance: pd.dist,
        speed: pd.speed,
        angle: Math.random() * Math.PI * 2,
        type: pd.type,
        diameter: pd.diameter,
        temp: pd.temp,
        distFromEarth: pd.distFromEarth,
        info: pd.info
      });
    });

    // 3. Realistic Asteroid Belt (Between Mars & Jupiter, d = 6.2)
    const asteroidGroup = new THREE.Group();
    const asteroidGeo = new THREE.DodecahedronGeometry(0.035, 1);
    const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.85 });

    for (let i = 0; i < 320; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 6.15 + (Math.random() - 0.5) * 0.65;
      const y = (Math.random() - 0.5) * 0.22;
      const mesh = new THREE.Mesh(asteroidGeo, asteroidMat);
      mesh.position.set(Math.cos(angle) * dist, y, Math.sin(angle) * dist);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      asteroidGroup.add(mesh);
    }
    this.currentClassGroup.add(asteroidGroup);

    // 4. Earth Moon Orbit
    const moonGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.8 });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.currentClassGroup.add(this.moonMesh);
  }

  buildDNA() {
    this.clearCurrentModel();
    this.currentModelType = 'dna';
    this.dnaPairs = [];

    const helixGroup = new THREE.Group();
    const numSteps = 24;
    const radius = 1.2;
    const heightStep = 0.22;

    const backboneMat1 = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 });
    const backboneMat2 = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });

    const matA = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const matT = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const matC = new THREE.MeshStandardMaterial({ color: 0x8b5cf6 });
    const matG = new THREE.MeshStandardMaterial({ color: 0x06b6d4 });

    for (let i = 0; i < numSteps; i++) {
      const angle = i * 0.35;
      const y = (i - numSteps / 2) * heightStep;

      const p1 = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      const p2 = new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);

      const sphereGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const node1 = new THREE.Mesh(sphereGeo, backboneMat1);
      node1.position.copy(p1);
      helixGroup.add(node1);

      const node2 = new THREE.Mesh(sphereGeo, backboneMat2);
      node2.position.copy(p2);
      helixGroup.add(node2);

      const pairGroup = new THREE.Group();
      pairGroup.position.set(0, y, 0);

      const isAT = i % 2 === 0;
      const rungMat1 = isAT ? matA : matC;
      const rungMat2 = isAT ? matT : matG;

      const rungGeo = new THREE.CylinderGeometry(0.06, 0.06, radius, 12);

      const half1 = new THREE.Mesh(rungGeo, rungMat1);
      half1.position.x = -radius / 4;
      half1.rotation.z = Math.PI / 2;
      pairGroup.add(half1);

      const half2 = new THREE.Mesh(rungGeo, rungMat2);
      half2.position.x = radius / 4;
      half2.rotation.z = Math.PI / 2;
      pairGroup.add(half2);

      pairGroup.rotation.y = angle;
      helixGroup.add(pairGroup);
      this.dnaPairs.push(pairGroup);
    }

    this.currentClassGroup.add(helixGroup);
  }

  buildAtom() {
    this.clearCurrentModel();
    this.currentModelType = 'atom';
    this.atomElectrons = [];

    const nucleusGroup = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
    const nMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.2 });
    const nSphereGeo = new THREE.SphereGeometry(0.25, 16, 16);

    for (let i = 0; i < 12; i++) {
      const mesh = new THREE.Mesh(nSphereGeo, i % 2 === 0 ? pMat : nMat);
      mesh.position.set(
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6
      );
      nucleusGroup.add(mesh);
    }
    this.currentClassGroup.add(nucleusGroup);

    const orbits = [
      { radius: 2.2, angle: Math.PI / 6, color: 0x60a5fa },
      { radius: 2.8, angle: -Math.PI / 4, color: 0x34d399 },
      { radius: 3.4, angle: Math.PI / 2.5, color: 0xf472b6 },
    ];

    orbits.forEach((orb) => {
      const ringGeo = new THREE.RingGeometry(orb.radius - 0.03, orb.radius + 0.03, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: orb.color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = orb.angle;
      this.currentClassGroup.add(ringMesh);

      const eGeo = new THREE.SphereGeometry(0.14, 16, 16);
      const eMat = new THREE.MeshStandardMaterial({ color: orb.color, emissive: orb.color, emissiveIntensity: 1.5 });
      const eMesh = new THREE.Mesh(eGeo, eMat);
      this.currentClassGroup.add(eMesh);

      this.atomElectrons.push({
        mesh: eMesh,
        radius: orb.radius,
        angle: orb.angle,
      });
    });
  }

  buildPolyhedron() {
    this.clearCurrentModel();
    this.currentModelType = 'polyhedron';

    const geo = new THREE.IcosahedronGeometry(2.0, 1);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.8,
      metalness: 0.5,
      roughness: 0.1,
      transmission: 0.6,
      ior: 1.5,
    });

    this.polyhedronMesh = new THREE.Mesh(geo, mat);
    this.currentClassGroup.add(this.polyhedronMesh);

    const pos = geo.attributes.position;
    const vertexMat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 1.2 });
    const vGeo = new THREE.SphereGeometry(0.1, 16, 16);

    for (let i = 0; i < pos.count; i += 3) {
      const vSphere = new THREE.Mesh(vGeo, vertexMat);
      vSphere.position.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      this.polyhedronMesh.add(vSphere);
    }

    const wireGeo = new THREE.WireframeGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0xc4b5fd, linewidth: 2 });
    this.polyhedronMesh.add(new THREE.LineSegments(wireGeo, wireMat));
  }

  buildHeart() {
    this.clearCurrentModel();
    this.currentModelType = 'heart';

    const heartGroup = new THREE.Group();
    const muscleMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.2 });

    const leftVent = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), muscleMat);
    leftVent.position.set(-0.4, -0.2, 0);
    heartGroup.add(leftVent);

    const rightVent = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 32), muscleMat);
    rightVent.position.set(0.5, -0.1, 0);
    heartGroup.add(rightVent);

    const aortaGeo = new THREE.TorusGeometry(0.8, 0.24, 16, 32, Math.PI);
    const aortaMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
    const aorta = new THREE.Mesh(aortaGeo, aortaMat);
    aorta.position.set(0, 0.9, 0);
    aorta.rotation.z = -Math.PI / 6;
    heartGroup.add(aorta);

    const pulmonaryGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.4, 16);
    const pulmonaryMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const pulmonary = new THREE.Mesh(pulmonaryGeo, pulmonaryMat);
    pulmonary.position.set(0.6, 0.7, 0.3);
    pulmonary.rotation.z = Math.PI / 4;
    heartGroup.add(pulmonary);

    this.heartMesh = heartGroup;
    this.currentClassGroup.add(this.heartMesh);
  }

  buildRobotArm() {
    this.clearCurrentModel();
    this.currentModelType = 'robot';

    const robotGroup = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.2 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.5 });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.4, 32), metalMat);
    base.position.y = -1.5;
    robotGroup.add(base);

    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), jointMat);
    shoulder.position.y = -1.0;
    robotGroup.add(shoulder);

    const lowerLink = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.8, 16), metalMat);
    lowerLink.position.set(0, -0.1, 0);
    robotGroup.add(lowerLink);

    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 32), jointMat);
    elbow.position.y = 0.8;
    robotGroup.add(elbow);

    const upperLink = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.4, 16), metalMat);
    upperLink.position.set(0.5, 1.2, 0);
    upperLink.rotation.z = -Math.PI / 4;
    robotGroup.add(upperLink);

    const clawMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6 });
    const clawGeo = new THREE.BoxGeometry(0.12, 0.5, 0.2);

    this.robotClawLeft = new THREE.Mesh(clawGeo, clawMat);
    this.robotClawLeft.position.set(0.9, 1.7, -0.15);
    robotGroup.add(this.robotClawLeft);

    this.robotClawRight = new THREE.Mesh(clawGeo, clawMat);
    this.robotClawRight.position.set(0.9, 1.7, 0.15);
    robotGroup.add(this.robotClawRight);

    this.currentClassGroup.add(robotGroup);
  }

  switchModel(type) {
    if (type === 'solar') this.buildSolarSystem();
    else if (type === 'dna') this.buildDNA();
    else if (type === 'atom') this.buildAtom();
    else if (type === 'polyhedron') this.buildPolyhedron();
    else if (type === 'heart') this.buildHeart();
    else if (type === 'robot') this.buildRobotArm();
  }

  clearCurrentModel() {
    if (this.currentClassGroup) {
      while (this.currentClassGroup.children.length > 0) {
        const obj = this.currentClassGroup.children[0];
        this.currentClassGroup.remove(obj);
      }
      this.currentClassGroup.position.set(0, 0, 0);
      this.currentClassGroup.rotation.set(0, 0, 0);
      this.currentClassGroup.scale.set(1, 1, 1);
    }
  }

  /* ------------------------------------------------------------------------
     GESTURE TRANSFORMATIONS & ACTIONS
     ------------------------------------------------------------------------ */
  rotateObject(deltaX, deltaY) {
    if (this.currentClassGroup) {
      this.currentClassGroup.rotation.y += deltaX * 0.02;
      this.currentClassGroup.rotation.x += deltaY * 0.02;
    }
  }

  zoomObject(deltaZoom) {
    if (this.currentClassGroup && this.classCamera) {
      const currentScale = this.currentClassGroup.scale.x;
      const newScale = THREE.MathUtils.clamp(currentScale + deltaZoom * 0.2, 0.3, 3.8);
      this.currentClassGroup.scale.set(newScale, newScale, newScale);

      this.classCamera.position.z = THREE.MathUtils.clamp(
        this.classCamera.position.z - deltaZoom * 0.25,
        2.5,
        15
      );
    }
  }

  panObject(deltaX, deltaY) {
    if (this.currentClassGroup) {
      this.currentClassGroup.position.x += deltaX * 0.015;
      this.currentClassGroup.position.y -= deltaY * 0.015;
    }
  }

  resetView() {
    if (this.currentClassGroup && this.classCamera) {
      this.currentClassGroup.position.set(0, 0, 0);
      this.currentClassGroup.rotation.set(0, 0, 0);
      this.currentClassGroup.scale.set(1, 1, 1);
      this.classCamera.position.set(0, 0, 7);
    }
  }

  toggleWireframe() {
    this.isWireframe = !this.isWireframe;
    if (this.currentClassGroup) {
      this.currentClassGroup.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.wireframe = this.isWireframe;
        }
      });
    }
  }

  toggleExplodeView() {
    this.isExploded = !this.isExploded;
    const factor = this.isExploded ? 1.8 : 1.0;
    if (this.currentClassGroup) {
      this.currentClassGroup.children.forEach((child) => {
        if (child.position) {
          child.position.multiplyScalar(factor);
        }
      });
    }
  }

  toggleAnimation() {
    this.isAnimating = !this.isAnimating;
    return this.isAnimating ? 'playing' : 'paused';
  }

  setAnimationState(state) {
    this.isAnimating = state === 'playing' || state === true;
  }

  highlightPart(partName = null) {
    this.highlightedPart = partName;
    if (this.highlightHaloMesh && this.currentClassGroup) {
      this.currentClassGroup.remove(this.highlightHaloMesh);
      this.highlightHaloMesh = null;
    }

    if (partName && this.currentClassGroup) {
      const haloGeo = new THREE.SphereGeometry(1.2, 32, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.65,
      });
      this.highlightHaloMesh = new THREE.Mesh(haloGeo, haloMat);
      this.currentClassGroup.add(this.highlightHaloMesh);
    }
  }

  /* ------------------------------------------------------------------------
     STATE SYNCHRONIZATION HELPERS (TEACHER TO STUDENT)
     ------------------------------------------------------------------------ */
  getState() {
    return {
      modelType: this.currentModelType,
      rotation: {
        x: this.currentClassGroup ? this.currentClassGroup.rotation.x : 0,
        y: this.currentClassGroup ? this.currentClassGroup.rotation.y : 0,
        z: this.currentClassGroup ? this.currentClassGroup.rotation.z : 0,
      },
      position: {
        x: this.currentClassGroup ? this.currentClassGroup.position.x : 0,
        y: this.currentClassGroup ? this.currentClassGroup.position.y : 0,
        z: this.currentClassGroup ? this.currentClassGroup.position.z : 0,
      },
      scale: this.currentClassGroup ? this.currentClassGroup.scale.x : 1,
      cameraZ: this.classCamera ? this.classCamera.position.z : 7,
      isWireframe: this.isWireframe,
      isExploded: this.isExploded,
      animationState: this.isAnimating ? 'playing' : 'paused',
      highlightedPart: this.highlightedPart,
    };
  }

  applyState(state) {
    if (!state) return;

    if (state.modelType && state.modelType !== this.currentModelType) {
      this.switchModel(state.modelType);
    }

    if (this.currentClassGroup) {
      if (state.rotation) {
        this.currentClassGroup.rotation.x = state.rotation.x;
        this.currentClassGroup.rotation.y = state.rotation.y;
        this.currentClassGroup.rotation.z = state.rotation.z;
      }
      if (state.position) {
        this.currentClassGroup.position.x = state.position.x;
        this.currentClassGroup.position.y = state.position.y;
        this.currentClassGroup.position.z = state.position.z;
      }
      if (state.scale !== undefined) {
        this.currentClassGroup.scale.set(state.scale, state.scale, state.scale);
      }
    }

    if (this.classCamera && state.cameraZ !== undefined) {
      this.classCamera.position.z = state.cameraZ;
    }

    if (state.isWireframe !== undefined && state.isWireframe !== this.isWireframe) {
      this.toggleWireframe();
    }

    if (state.isExploded !== undefined && state.isExploded !== this.isExploded) {
      this.toggleExplodeView();
    }

    if (state.animationState !== undefined) {
      this.setAnimationState(state.animationState);
    }

    if (state.highlightedPart !== undefined && state.highlightedPart !== this.highlightedPart) {
      this.highlightPart(state.highlightedPart);
    }
  }
}


