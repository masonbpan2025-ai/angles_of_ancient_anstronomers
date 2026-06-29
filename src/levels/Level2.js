import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ECLIPTIC_STYLES = `
  .compass-label {
      position: absolute;
      color: #60a5fa;
      font-weight: 700;
      font-size: 1.1rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
      transform: translate(-50%, -50%);
      pointer-events: none;
      will-change: transform;
  }
  .zodiac-label {
      position: absolute;
      color: #c084fc;
      font-weight: 600;
      font-size: 0.65rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9), 0 0 2px rgba(0, 0, 0, 0.8);
      transform: translate(-50%, -50%);
      pointer-events: none;
      will-change: transform;
      text-align: center;
  }
  .polaris-label {
      position: absolute;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.8rem;
      text-shadow: 0 2px 8px rgba(255, 255, 255, 0.6), 0 0 4px rgba(0, 0, 0, 0.9);
      transform: translate(-50%, -50%);
      pointer-events: none;
      will-change: transform;
  }
  .marker-label {
      position: absolute;
      color: #f472b6;
      font-weight: 600;
      font-size: 0.65rem;
      background: rgba(15, 23, 42, 0.8);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid rgba(244, 114, 182, 0.3);
      transform: translate(-50%, -50%);
      pointer-events: none;
      will-change: transform;
      white-space: nowrap;
  }
`;

export class Level2 {
  constructor(container) {
    this.container = container;

    // Inject custom CSS styling for 3D overlay labels if not already present
    if (!document.getElementById('ecliptic-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'ecliptic-styles';
      styleEl.textContent = ECLIPTIC_STYLES;
      document.head.appendChild(styleEl);
    }

    // 2D Canvas setup (for standard inclination/eclipse tabs)
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    // Initial view angles (yaw, pitch) for the left 3D Celestial Sphere
    this.angleY = 0.6; // yaw
    this.angleX = 0.35; // pitch
    this.zoom = 1.0;

    // Parameters
    this.latitude = 30.97; // Alexandria (30;58°)
    this.obliquity = 23.85; // Ecliptic (23;51°)
    this.inclination = 5.0; // Moon's orbit inclination (target is 5.0°)
    this.moonLongitude = 90; // Default at Summer Solstice (peak transit)
    this.sunLongitude = 90; // Default at Summer Solstice
    this.earthRotation = 0; // Earth rotation (0 to 360 degrees, 0 = noon)
    this.rotateEarth = true; // Reference frame toggle (true = Rotate Earth, false = Fixed Horizon)

    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    // --- 3D Three.js Ecliptic Visualization Setup ---
    this.activeTab = 'ecliptic';
    this.isThreeActive = true;

    this.eclipticState = {
      dayOfYear: 172,
      timeOfDay: 0,
      latitude: 30,
      showSunPath: true,
      showEquator: true,
      showEcliptic: true,
      showZodiacs: true
    };

    // Containers for Three.js
    this.threeContainer = document.createElement('div');
    this.threeContainer.style.position = 'absolute';
    this.threeContainer.style.top = '0';
    this.threeContainer.style.left = '400px';
    this.threeContainer.style.width = 'calc(100% - 400px)';
    this.threeContainer.style.height = '100%';
    this.threeContainer.style.display = 'block';
    this.threeContainer.style.pointerEvents = 'none';
    this.container.appendChild(this.threeContainer);

    this.canvas3D = document.createElement('div');
    this.canvas3D.style.position = 'absolute';
    this.canvas3D.style.top = '0';
    this.canvas3D.style.left = '0';
    this.canvas3D.style.width = '100%';
    this.canvas3D.style.height = '100%';
    this.canvas3D.style.pointerEvents = 'auto'; // allow mouse drag on Three.js canvas
    this.threeContainer.appendChild(this.canvas3D);

    this.labels3D = document.createElement('div');
    this.labels3D.style.position = 'absolute';
    this.labels3D.style.top = '0';
    this.labels3D.style.left = '0';
    this.labels3D.style.width = '100%';
    this.labels3D.style.height = '100%';
    this.labels3D.style.pointerEvents = 'none';
    this.threeContainer.appendChild(this.labels3D);

    // Three.js Scene, Camera, Renderer
    this.scene3D = new THREE.Scene();
    this.scene3D.background = new THREE.Color(0x050505);

    const w3D = window.innerWidth - 400;
    const h3D = window.innerHeight;
    this.camera3D = new THREE.PerspectiveCamera(45, w3D / h3D, 0.1, 1000);
    this.camera3D.position.set(28, 18, 28);

    this.renderer3D = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer3D.setSize(w3D, h3D);
    this.renderer3D.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.canvas3D.appendChild(this.renderer3D.domElement);

    this.controls3D = new OrbitControls(this.camera3D, this.renderer3D.domElement);
    this.controls3D.enableDamping = true;
    this.controls3D.dampingFactor = 0.05;
    this.controls3D.maxDistance = 60;
    this.controls3D.minDistance = 5;
    this.controls3D.maxPolarAngle = Math.PI / 2 + 0.1;

    // Lights
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x0f172a, 0.6);
    this.hemiLight.position.set(0, 20, 0);
    this.scene3D.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.scene3D.add(this.sunLight);

    // Environment (Ground plane & Observer Cylinder/Sphere)
    const R_ce = 15;
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(R_ce, 64),
      new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene3D.add(ground);

    const horizonEdge = new THREE.Mesh(
      new THREE.RingGeometry(R_ce, R_ce + 0.2, 64),
      new THREE.MeshBasicMaterial({ color: 0x334155, side: THREE.DoubleSide })
    );
    horizonEdge.rotation.x = -Math.PI / 2;
    this.scene3D.add(horizonEdge);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfcb7a0 }));
    head.position.y = 0.55;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.4, 16), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
    body.position.y = 0.2;
    this.scene3D.add(head);
    this.scene3D.add(body);

    // Equatorial base tilted by (latitude - 90) degrees
    this.equatorialGroup = new THREE.Group();
    this.equatorialGroup.rotation.x = (this.eclipticState.latitude - 90) * (Math.PI / 180);
    this.scene3D.add(this.equatorialGroup);

    const createRingHelper = (radius, color, thickness = 0.06) => {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(radius, thickness, 8, 128),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8 })
      );
      mesh.rotation.x = Math.PI / 2;
      return mesh;
    };

    // Sun Path (Amber)
    this.sunPathRing = createRingHelper(R_ce, 0xf59e0b, 0.08);
    this.equatorialGroup.add(this.sunPathRing);

    // Celestial Sphere (Rotates based on time of day)
    this.celestialSphere = new THREE.Group();
    this.equatorialGroup.add(this.celestialSphere);

    // Equator (Blue)
    this.equatorRing = createRingHelper(R_ce, 0x3b82f6, 0.04);
    this.celestialSphere.add(this.equatorRing);

    // Celestial Grid
    this.gridGroup = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.15 });

    // Latitude rings
    for (let lat = -75; lat <= 75; lat += 15) {
      if (lat === 0) continue;
      const r = R_ce * Math.cos(lat * (Math.PI / 180));
      const y = R_ce * Math.sin(lat * (Math.PI / 180));
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, y, -Math.sin(a) * r));
      }
      this.gridGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }

    // Longitude lines
    for (let lon = 0; lon < 360; lon += 15) {
      const pts = [];
      for (let i = 0; i <= 32; i++) {
        const lat = (i / 32) * Math.PI - Math.PI / 2;
        const r = R_ce * Math.cos(lat);
        const y = R_ce * Math.sin(lat);
        pts.push(new THREE.Vector3(Math.cos(lon * (Math.PI / 180)) * r, y, -Math.sin(lon * (Math.PI / 180)) * r));
      }
      this.gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    this.celestialSphere.add(this.gridGroup);

    // Polaris (white sphere at North Celestial Pole)
    const polarisMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    polarisMesh.position.set(0, R_ce, 0);
    this.celestialSphere.add(polarisMesh);

    // Ecliptic System (Tilted -23.44 deg relative to equator)
    this.eclipticGroup = new THREE.Group();
    this.eclipticGroup.rotation.x = -23.44 * (Math.PI / 180);
    this.celestialSphere.add(this.eclipticGroup);

    this.eclipticRing = createRingHelper(R_ce, 0xa855f7, 0.04);
    this.eclipticGroup.add(this.eclipticRing);

    // Sun Mesh on Ecliptic
    this.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
    this.eclipticGroup.add(this.sunMesh);

    // Background Stars (1500 white stars)
    const starGeom = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 1500; i++) {
      const pt = new THREE.Vector3().randomDirection().multiplyScalar(R_ce * 1.05);
      starPositions.push(pt.x, pt.y, pt.z);
    }
    starGeom.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    this.starMaterial = new THREE.PointsMaterial({ size: 0.08, color: 0xffffff, transparent: true, opacity: 0.8 });
    this.stars = new THREE.Points(starGeom, this.starMaterial);
    this.celestialSphere.add(this.stars);

    // Labels Overlay Data
    this.labelsData3D = [];
    this.createEclipticLabel = (text, pos, className, parentObj = null, visibilityKey = null) => {
      const el = document.createElement('div');
      el.className = className;
      el.innerHTML = text;
      this.labels3D.appendChild(el);

      let dummy = null;
      if (parentObj) {
        dummy = new THREE.Object3D();
        dummy.position.copy(pos);
        parentObj.add(dummy);
      }
      this.labelsData3D.push({ el, position: pos.clone(), dummy, visibilityKey });
    };

    // Compass points labels
    this.createEclipticLabel('N', new THREE.Vector3(0, 0, -R_ce * 1.08), 'compass-label');
    this.createEclipticLabel('S', new THREE.Vector3(0, 0, R_ce * 1.08), 'compass-label');
    this.createEclipticLabel('E', new THREE.Vector3(R_ce * 1.08, 0, 0), 'compass-label');
    this.createEclipticLabel('W', new THREE.Vector3(-R_ce * 1.08, 0, 0), 'compass-label');

    // Polaris label
    this.createEclipticLabel('Polaris', new THREE.Vector3(0, R_ce * 1.08, 0), 'polaris-label', this.celestialSphere);

    // Zodiac constellations markers and labels
    this.zodiacConstellations = new THREE.Group();
    this.eclipticGroup.add(this.zodiacConstellations);

    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    signs.forEach((sign, i) => {
      const centerAngle = i * 30 * (Math.PI / 180);
      const x = Math.cos(centerAngle) * R_ce;
      const z = -Math.sin(centerAngle) * R_ce;

      const centerStar = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshBasicMaterial({ color: 0xd8b4fe }));
      centerStar.position.set(x, 0, z);
      this.zodiacConstellations.add(centerStar);

      this.createEclipticLabel(sign, new THREE.Vector3(x * 1.1, 0, z * 1.1), 'zodiac-label', this.eclipticGroup, 'showZodiacs');
    });

    // --- Moon Orbit Setup (Teal) ---
    this.moonOrbitGroup = new THREE.Group();
    this.eclipticGroup.add(this.moonOrbitGroup);

    this.moonOrbitRing = createRingHelper(R_ce, 0x22d3ee, 0.04);
    this.moonOrbitGroup.add(this.moonOrbitRing);

    this.moonMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 32), new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }));
    this.moonOrbitGroup.add(this.moonMesh);

    // --- Declination Markers & Lines (Meridian track) ---
    const markerMatSun = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const markerMatMoon = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    this.sunMaxDecMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), markerMatSun);
    this.sunMinDecMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), markerMatSun);
    this.moonMaxDecMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), markerMatMoon);
    this.moonMinDecMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), markerMatMoon);

    this.equatorialGroup.add(this.sunMaxDecMesh);
    this.equatorialGroup.add(this.sunMinDecMesh);
    this.equatorialGroup.add(this.moonMaxDecMesh);
    this.equatorialGroup.add(this.moonMinDecMesh);

    const arcGeom = new THREE.BufferGeometry();
    const arcMat = new THREE.LineBasicMaterial({ color: 0xf472b6 });
    this.decDiffLine = new THREE.Line(arcGeom, arcMat);
    this.equatorialGroup.add(this.decDiffLine);

    // Min declination line & label
    const arcGeomMin = new THREE.BufferGeometry();
    this.decDiffLineMin = new THREE.Line(arcGeomMin, arcMat);
    this.equatorialGroup.add(this.decDiffLineMin);

    // Peak declination labels
    this.createEclipticLabel('Sun Max', new THREE.Vector3(), 'marker-label', this.equatorialGroup, 'showDecMarkers');
    this.sunMaxLabelIdx = this.labelsData3D.length - 1;

    this.createEclipticLabel('Moon Max', new THREE.Vector3(), 'marker-label', this.equatorialGroup, 'showDecMarkers');
    this.moonMaxLabelIdx = this.labelsData3D.length - 1;

    this.createEclipticLabel('β', new THREE.Vector3(), 'marker-label', this.equatorialGroup, 'showDecMarkers');
    this.decDiffLabelIdx = this.labelsData3D.length - 1;

    this.createEclipticLabel('β_min', new THREE.Vector3(), 'marker-label', this.equatorialGroup, 'showDecMarkers');
    this.decDiffLabelIdxMin = this.labelsData3D.length - 1;

    // --- Max and Min Path Rings (Tori parallel to Celestial Equator) ---
    this.sunMaxPathRing = createRingHelper(R_ce, 0xf59e0b, 0.02);
    this.sunMinPathRing = createRingHelper(R_ce, 0xf59e0b, 0.02);
    this.moonMaxPathRing = createRingHelper(R_ce, 0x22d3ee, 0.02);
    this.moonMinPathRing = createRingHelper(R_ce, 0x22d3ee, 0.02);

    this.equatorialGroup.add(this.sunMaxPathRing);
    this.equatorialGroup.add(this.sunMinPathRing);
    this.equatorialGroup.add(this.moonMaxPathRing);
    this.equatorialGroup.add(this.moonMinPathRing);

    this.updateEclipticScene();

    // Event listener bounds & setup
    this.resizeBound = this.resize.bind(this);
    this.resizeBound();
    window.addEventListener('resize', this.resizeBound);

    this.pointerDownBound = this.onPointerDown.bind(this);
    this.pointerMoveBound = this.onPointerMove.bind(this);
    this.pointerUpBound = this.onPointerUp.bind(this);

    this.canvas.addEventListener('pointerdown', this.pointerDownBound);
    this.canvas.addEventListener('pointermove', this.pointerMoveBound);
    window.addEventListener('pointerup', this.pointerUpBound);

    this.animate = this.animate.bind(this);
    this.animationId = requestAnimationFrame(this.animate);
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Width of the task panel on the left (380px wide + 20px left = 400px)
    const taskPanelWidth = 400;
    const bottomPanelHeight = 110; // Height reserved for bottom parameter panel
    
    // The available width to the right of the task panel
    const availWidth = Math.max(300, this.canvas.width - taskPanelWidth);
    
    // Divide the available space into two equal columns
    const colWidth = availWidth / 2;
    
    // Determine the maximum base size that fits both horizontally and vertically
    const maxR_horizontal = colWidth * 0.5 - 25;
    const maxR_vertical = (this.canvas.height - bottomPanelHeight - 100) * 0.5;
    
    // Determine target size, capping at a maximum of 285px to make illustrations bigger
    const baseSize = Math.max(80, Math.min(285, Math.min(maxR_horizontal, maxR_vertical)));
    
    // Size the spheres proportionally to fill the space beautifully
    this.radius = Math.round(baseSize * 0.85);     // 3D Celestial Sphere (leave room for projected labels)
    this.radiusSky = Math.round(baseSize * 0.95);   // Local Sky Dome
    
    // Center of first sphere (centered in column 1)
    this.cx1 = Math.round(taskPanelWidth + colWidth * 0.5);
    
    // Center of second sphere (centered in column 2)
    this.cx2 = Math.round(taskPanelWidth + colWidth * 1.5);
    
    // Vertically center both spheres in the space above the bottom panel
    this.cy1 = Math.round((this.canvas.height - bottomPanelHeight) * 0.5 + 10);
    this.cy2 = Math.round((this.canvas.height - bottomPanelHeight) * 0.5 + 10);
    
    // Divider is halfway between the two centers
    this.dividerX = Math.round((this.cx1 + this.cx2) / 2);

    // Dynamic resizing for Three.js 3D viewport
    if (this.threeContainer) {
      const w3D = window.innerWidth - taskPanelWidth;
      const h3D = window.innerHeight;
      this.threeContainer.style.width = w3D + 'px';
      this.threeContainer.style.height = h3D + 'px';
      
      if (this.renderer3D && this.camera3D) {
        this.camera3D.aspect = w3D / h3D;
        this.camera3D.updateProjectionMatrix();
        this.renderer3D.setSize(w3D, h3D);
      }
    }
  }
  onPointerDown(e) {
    // Only drag to rotate if clicking on the left 3D panel
    if (e.clientX > this.dividerX) return;
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
    this.canvas.setPointerCapture(e.pointerId);
  }

  onPointerMove(e) {
    if (!this.isDragging) return;
    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;

    this.angleY += deltaX * 0.007;
    this.angleX = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.angleX - deltaY * 0.007));

    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  onPointerUp(e) {
    this.isDragging = false;
  }

  setMoonLongitude(val) {
    this.moonLongitude = parseFloat(val);
    if (this.isThreeActive) this.updateEclipticScene();
  }

  setSunLongitude(val) {
    this.sunLongitude = parseFloat(val);
    if (this.isThreeActive) this.updateEclipticScene();
  }

  setEarthRotation(val) {
    this.earthRotation = parseFloat(val);
    if (this.isThreeActive) this.updateEclipticScene();
  }

  setInclination(val) {
    this.inclination = parseFloat(val);
    if (this.isThreeActive) this.updateEclipticScene();
  }

  setRotateEarth(val) {
    this.rotateEarth = val === true || val === 'true';
    if (this.isThreeActive) this.updateEclipticScene();
  }

  transformPoint(P) {
    if (this.rotateEarth) {
      return P;
    } else {
      // Rotate coordinates into observer's local horizontal coordinate frame (Fixed Horizon)
      const radLat = this.latitude * (Math.PI / 180);
      const radRot = this.earthRotation * (Math.PI / 180);
      
      const uZ = { x: Math.cos(radLat) * Math.cos(radRot), y: -Math.sin(radLat), z: Math.cos(radLat) * Math.sin(radRot) };
      const uN = { x: Math.sin(radLat) * Math.cos(radRot), y: Math.cos(radLat), z: Math.sin(radLat) * Math.sin(radRot) };
      const uE = { x: -Math.sin(radRot), y: 0, z: Math.cos(radRot) };
      
      return {
        x: P.x * uN.x + P.y * uN.y + P.z * uN.z,
        y: -(P.x * uZ.x + P.y * uZ.y + P.z * uZ.z),
        z: P.x * uE.x + P.y * uE.y + P.z * uE.z
      };
    }
  }

  // 3D polar vector rotation around polar Y-axis (polar axis SCP-NCP)
  rotateY(v, angleRad) {
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    return {
      x: v.x * cosA - v.z * sinA,
      y: v.y,
      z: v.x * sinA + v.z * cosA
    };
  }

  // 3D Projection for the left Celestial Sphere
  project(x, y, z) {
    const cosY = Math.cos(this.angleY);
    const sinY = Math.sin(this.angleY);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    const cosX = Math.cos(this.angleX);
    const sinX = Math.sin(this.angleX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    const fov = 600;
    const scale = fov / (fov + z2);
    return {
      x: this.cx1 + x1 * scale * this.zoom,
      y: this.cy1 + y2 * scale * this.zoom,
      z: z2 // depth
    };
  }

  // Renders a great circle segment by segment (with depth shading)
  drawGreatCircle(u, v, label, color, opacity = 1.0, isDashed = false, customRadius = null) {
    const ctx = this.ctx;
    const segments = 120;
    const points = [];
    const r = customRadius || this.radius;

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const rawPt = {
        x: r * (Math.cos(theta) * u.x + Math.sin(theta) * v.x),
        y: r * (Math.cos(theta) * u.y + Math.sin(theta) * v.y),
        z: r * (Math.cos(theta) * u.z + Math.sin(theta) * v.z)
      };
      const opt = this.transformPoint(rawPt);
      points.push(this.project(opt.x, opt.y, opt.z));
    }

    ctx.lineWidth = 2;
    for (let i = 0; i < segments; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const zMid = (p1.z + p2.z) / 2;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      if (zMid > 0) {
        ctx.strokeStyle = color;
        ctx.save();
        ctx.globalAlpha = opacity * 0.22;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = color;
        ctx.save();
        ctx.globalAlpha = opacity;
        if (isDashed) ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (label) {
      let frontmostIdx = 0;
      let minZ = Infinity;
      for (let i = 0; i < segments; i++) {
        if (points[i].z < minZ) {
          minZ = points[i].z;
          frontmostIdx = i;
        }
      }
      if (minZ < 0) {
        const lp = points[frontmostIdx];
        ctx.fillStyle = color;
        ctx.font = '600 11px Outfit';
        ctx.fillText(label, lp.x + 6, lp.y - 4);
      }
    }
  }

  // Draw arc between two 3D vectors
  drawArc(v1, v2, color, label, isDashed = false) {
    const ctx = this.ctx;
    const steps = 30;
    const points = [];
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const dot = v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
      const theta = Math.acos(Math.max(-1, Math.min(1, dot)));
      let pt;
      if (theta < 0.001) {
        pt = { x: v1.x, y: v1.y, z: v1.z };
      } else {
        const s1 = Math.sin((1-t)*theta) / Math.sin(theta);
        const s2 = Math.sin(t*theta) / Math.sin(theta);
        pt = {
          x: v1.x * s1 + v2.x * s2,
          y: v1.y * s1 + v2.y * s2,
          z: v1.z * s1 + v2.z * s2
        };
      }
      
      const opt = this.transformPoint({ x: pt.x * this.radius, y: pt.y * this.radius, z: pt.z * this.radius });
      points.push(this.project(opt.x, opt.y, opt.z));
    }

    ctx.save();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i <= steps; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    if (isDashed) ctx.setLineDash([3, 3]);
    ctx.stroke();

    const midIdx = Math.floor(steps / 2);
    const midPoint = points[midIdx];
    ctx.fillStyle = color;
    ctx.font = '600 12px Outfit';
    ctx.fillText(label, midPoint.x + 10, midPoint.y + 4);
    ctx.restore();
  }

  // Draws Moon phase icon
  drawMoonPhase(ctx, mx, my, rMoon, moon3D, sun3D, angleToSun, isLunarEclipse = false, isSolarEclipse = false) {
    // Separation angle between moon and sun
    const dot = moon3D.x * sun3D.x + moon3D.y * sun3D.y + moon3D.z * sun3D.z;
    const elongation = Math.acos(Math.max(-1, Math.min(1, dot))); // 0 (New) to PI (Full)

    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(angleToSun);

    // 1. Draw dark background circle of moon (the unilluminated side)
    ctx.beginPath();
    ctx.arc(0, 0, rMoon, 0, Math.PI * 2);
    if (isSolarEclipse) {
      ctx.fillStyle = '#020205'; // pitch black silhouette against the corona
    } else if (isLunarEclipse) {
      ctx.fillStyle = '#7c2d12'; // deep rust red shadow
    } else {
      ctx.fillStyle = '#1e293b';
    }
    ctx.fill();

    // 2. Draw bright side overlay
    if (isSolarEclipse) {
      // No bright overlay during total solar eclipse
    } else if (isLunarEclipse) {
      // Lunar Eclipse: the moon is full but colored in copper/blood red
      ctx.fillStyle = '#ea580c'; // blood moon orange-red
      ctx.beginPath();
      ctx.arc(0, 0, rMoon, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#e2e8f0';
      const pct = (1 - Math.cos(elongation)) / 2; // fraction of illumination [0, 1]

      if (pct > 0.5) {
        // Gibbous / Full: semi-circle + positive elliptical cap
        ctx.beginPath();
        ctx.arc(0, 0, rMoon, -Math.PI/2, Math.PI/2, false);
        const k = (pct - 0.5) * 2; // scale factor
        ctx.scale(k, 1);
        ctx.arc(0, 0, rMoon, Math.PI/2, -Math.PI/2, false);
        ctx.fill();
      } else {
        // Crescent / New: semi-circle - negative elliptical cutout
        ctx.beginPath();
        ctx.arc(0, 0, rMoon, -Math.PI/2, Math.PI/2, false);
        const k = (0.5 - pct) * 2;
        ctx.scale(k, 1);
        ctx.arc(0, 0, rMoon, Math.PI/2, -Math.PI/2, true);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawSphere() {
    const ctx = this.ctx;

    // 1. Draw solid horizon bounding disk of Celestial Sphere
    ctx.beginPath();
    ctx.arc(this.cx1, this.cy1, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
    ctx.fill();

    // 2. Define coordinate vectors
    const radLat = this.latitude * (Math.PI / 180);
    const radOb = this.obliquity * (Math.PI / 180);
    const radInc = this.inclination * (Math.PI / 180);
    const radRot = this.earthRotation * (Math.PI / 180);

    const rSky = this.radiusSky;
    const cx2 = this.cx2;
    const cy2 = this.cy2;

    // Define Unit Vectors of Observer Frame in Celestial Sphere
    const uZ = { x: Math.cos(radLat) * Math.cos(radRot), y: -Math.sin(radLat), z: Math.cos(radLat) * Math.sin(radRot) };
    const uN = { x: Math.sin(radLat) * Math.cos(radRot), y: Math.cos(radLat), z: Math.sin(radLat) * Math.sin(radRot) };
    const uE = { x: -Math.sin(radRot), y: 0, z: Math.cos(radRot) };

    // Function to project celestial 3D coordinates into local Alt-Az Sky Dome
    const projectLocal = (P) => {
      // Normalize P to get unit direction vector components
      const pMag = Math.hypot(P.x, P.y, P.z);
      if (pMag < 0.001) return null;
      const px = P.x / pMag;
      const py = P.y / pMag;
      const pz = P.z / pMag;

      // Dot products to find components along Zenith, North, East axes
      const zLoc = (px * uZ.x + py * uZ.y + pz * uZ.z);
      const yLoc = (px * uN.x + py * uN.y + pz * uN.z);
      const xLoc = (px * uE.x + py * uE.y + pz * uE.z);

      if (zLoc < -0.05) return null; // Below horizon (with slight margin)

      // Angular distance from zenith (zenith distance)
      const zDist = Math.acos(Math.max(-1, Math.min(1, zLoc))); // 0 (zenith) to PI/2 (horizon)
      const d = rSky * (zDist / (Math.PI / 2));

      // 2D position in Alt-Az circle: North is top (-y), East is left (-x)
      const r2d = Math.hypot(xLoc, yLoc);
      const ux = r2d > 0 ? xLoc / r2d : 0;
      const uy = r2d > 0 ? yLoc / r2d : 0;

      return {
        x: cx2 - d * ux,
        y: cy2 - d * uy,
        alt: (90 - zDist * 180 / Math.PI),
        visible: zLoc >= 0
      };
    };

    // Function to project celestial 3D coordinates into local Alt-Az Sky Dome (no horizon clipping for angle calculations)
    const projectLocalNoClip = (P) => {
      const pMag = Math.hypot(P.x, P.y, P.z);
      if (pMag < 0.001) return null;
      const px = P.x / pMag;
      const py = P.y / pMag;
      const pz = P.z / pMag;

      const zLoc = (px * uZ.x + py * uZ.y + pz * uZ.z);
      const yLoc = (px * uN.x + py * uN.y + pz * uN.z);
      const xLoc = (px * uE.x + py * uE.y + pz * uE.z);

      const zDist = Math.acos(Math.max(-1, Math.min(1, zLoc)));
      const d = rSky * (zDist / (Math.PI / 2));

      const r2d = Math.hypot(xLoc, yLoc);
      const ux = r2d > 0 ? xLoc / r2d : 0;
      const uy = r2d > 0 ? yLoc / r2d : 0;

      return {
        x: cx2 - d * ux,
        y: cy2 - d * uy
      };
    };

    // Celestial Equator (Green) - fixed
    const eqU = { x: 1, y: 0, z: 0 };
    const eqV = { x: 0, y: 0, z: 1 };
    this.drawGreatCircle(eqU, eqV, 'Celestial Equator', '#10b981', 0.6);

    // Ecliptic (Yellow/Orange) - fixed
    const ecU = { x: Math.cos(radOb), y: -Math.sin(radOb), z: 0 };
    const ecV = { x: 0, y: 0, z: 1 };
    this.drawGreatCircle(ecU, ecV, 'Ecliptic Plane', '#f59e0b', 0.6);

    // Moon's Inclined Orbit (Cyan) - fixed
    const totalTilt = radOb + radInc;
    const orbU = { x: Math.cos(totalTilt), y: -Math.sin(totalTilt), z: 0 };
    const orbV = { x: 0, y: 0, z: 1 };
    const moonOrbRadius = this.radius * 0.45;
    this.drawGreatCircle(orbU, orbV, 'Moon\'s Inclined Orbit', '#06b6d4', 0.7, false, moonOrbRadius);

    // Horizon (Grey/White) - Rotates around polar Y-axis with Earth self-rotation
    const horU_0 = { x: Math.sin(radLat), y: Math.cos(radLat), z: 0 };
    const horV_0 = { x: 0, y: 0, z: 1 };
    const horU = this.rotateY(horU_0, radRot);
    const horV = this.rotateY(horV_0, radRot);
    this.drawGreatCircle(horU, horV, 'Horizon (Alexandria)', '#cbd5e1', 0.5);

    // Meridian (Red) - Rotates around polar Y-axis
    const merU = this.rotateY({ x: 1, y: 0, z: 0 }, radRot);
    const merV = { x: 0, y: 1, z: 0 };
    this.drawGreatCircle(merU, merV, 'Meridian', '#ef4444', 0.85);

    // 3. Define and draw key points
    // North Celestial Pole (NCP)
    const ncpLoc = this.transformPoint({ x: 0, y: -this.radius, z: 0 });
    const pNCP = this.project(ncpLoc.x, ncpLoc.y, ncpLoc.z);
    ctx.beginPath();
    ctx.arc(pNCP.x, pNCP.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#60a5fa';
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '600 11px Outfit';
    ctx.fillText('North Pole (NCP)', pNCP.x + 6, pNCP.y - 4);

    // Solstice Points on Ecliptic (Summer at peak transit y < 0, Winter at y > 0)
    const solSummer = { x: Math.cos(radOb) * this.radius, y: -Math.sin(radOb) * this.radius, z: 0 };
    const solWinter = { x: -Math.cos(radOb) * this.radius, y: Math.sin(radOb) * this.radius, z: 0 };

    const solSummerLoc = this.transformPoint(solSummer);
    const solWinterLoc = this.transformPoint(solWinter);

    const pSolSummer = this.project(solSummerLoc.x, solSummerLoc.y, solSummerLoc.z);
    const pSolWinter = this.project(solWinterLoc.x, solWinterLoc.y, solWinterLoc.z);

    // Draw Summer Solstice
    ctx.save();
    if (pSolSummer.z > 0) ctx.globalAlpha = 0.35;
    else ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(pSolSummer.x, pSolSummer.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '600 11px Outfit';
    ctx.fillText('Summer Solstice', pSolSummer.x + 6, pSolSummer.y - 4);
    ctx.restore();

    // Draw Winter Solstice
    ctx.save();
    if (pSolWinter.z > 0) ctx.globalAlpha = 0.35;
    else ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(pSolWinter.x, pSolWinter.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '600 11px Outfit';
    ctx.fillText('Winter Solstice', pSolWinter.x + 6, pSolWinter.y - 4);
    ctx.restore();

    // Equinox Points (Vernal at z > 0, Autumnal at z < 0)
    const equiVernal = { x: 0, y: 0, z: this.radius };
    const equiAutumnal = { x: 0, y: 0, z: -this.radius };

    const equiVernalLoc = this.transformPoint(equiVernal);
    const equiAutumnalLoc = this.transformPoint(equiAutumnal);

    const pEquiVernal = this.project(equiVernalLoc.x, equiVernalLoc.y, equiVernalLoc.z);
    const pEquiAutumnal = this.project(equiAutumnalLoc.x, equiAutumnalLoc.y, equiAutumnalLoc.z);

    // Draw Vernal Equinox
    ctx.save();
    if (pEquiVernal.z > 0) ctx.globalAlpha = 0.35;
    else ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(pEquiVernal.x, pEquiVernal.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981'; // Green
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.font = '600 11px Outfit';
    ctx.fillText('Vernal Equinox', pEquiVernal.x + 6, pEquiVernal.y - 4);
    ctx.restore();

    // Draw Autumnal Equinox
    ctx.save();
    if (pEquiAutumnal.z > 0) ctx.globalAlpha = 0.35;
    else ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(pEquiAutumnal.x, pEquiAutumnal.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.font = '600 11px Outfit';
    ctx.fillText('Autumnal Equinox', pEquiAutumnal.x + 6, pEquiAutumnal.y - 4);
    ctx.restore();

    // Zenith (Z) - Rotates around polar Y-axis
    const zenith_0 = { x: Math.cos(radLat), y: -Math.sin(radLat), z: 0 };
    const zenith = this.rotateY(zenith_0, radRot);
    const zenithLoc = this.transformPoint({ x: zenith.x * this.radius, y: zenith.y * this.radius, z: zenith.z * this.radius });
    const pZ = this.project(zenithLoc.x, zenithLoc.y, zenithLoc.z);
    ctx.beginPath();
    ctx.arc(pZ.x, pZ.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.font = '600 12px Outfit';
    ctx.fillText('Zenith (Z)', pZ.x - 65, pZ.y - 4);

    // Zenith to Nadir line
    const nadirLoc = this.transformPoint({ x: -zenith.x * this.radius, y: -zenith.y * this.radius, z: -zenith.z * this.radius });
    const pNadir = this.project(nadirLoc.x, nadirLoc.y, nadirLoc.z);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.moveTo(pZ.x, pZ.y);
    ctx.lineTo(pNadir.x, pNadir.y);
    ctx.stroke();

    // Horizon Cardinal Points - Rotate around polar Y-axis
    const pN_0 = { x: Math.sin(radLat), y: Math.cos(radLat), z: 0 };
    const pS_0 = { x: -Math.sin(radLat), y: -Math.cos(radLat), z: 0 };
    const pE_0 = { x: 0, y: 0, z: 1 };
    const pW_0 = { x: 0, y: 0, z: -1 };

    const cardinalPoints = [
      this.rotateY(pN_0, radRot),
      this.rotateY(pS_0, radRot),
      this.rotateY(pE_0, radRot),
      this.rotateY(pW_0, radRot)
    ];
    cardinalPoints[0].name = 'N';
    cardinalPoints[1].name = 'S';
    cardinalPoints[2].name = 'E';
    cardinalPoints[3].name = 'W';

    cardinalPoints.forEach(pt => {
      const ptLoc = this.transformPoint({ x: pt.x * this.radius, y: pt.y * this.radius, z: pt.z * this.radius });
      const proj = this.project(ptLoc.x, ptLoc.y, ptLoc.z);
      ctx.save();
      if (proj.z > 0) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#94a3b8';
      } else {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#ffffff';
      }
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.font = '600 12px Outfit';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pt.name, proj.x, proj.y - 12);
      ctx.restore();
    });

    // Sun Position along Ecliptic (3D Vector)
    const sunRad = this.sunLongitude * (Math.PI / 180);
    const sun3D = {
      x: Math.cos(sunRad) * ecU.x + Math.sin(sunRad) * ecV.x,
      y: Math.cos(sunRad) * ecU.y + Math.sin(sunRad) * ecV.y,
      z: Math.cos(sunRad) * ecU.z + Math.sin(sunRad) * ecV.z
    };
    const sunLoc = this.transformPoint({ x: sun3D.x * this.radius, y: sun3D.y * this.radius, z: sun3D.z * this.radius });
    const pSun = this.project(sunLoc.x, sunLoc.y, sunLoc.z);

    // Draw Sun in 3D sphere (Larger size)
    ctx.beginPath();
    ctx.arc(pSun.x, pSun.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 12px Outfit';
    ctx.fillText('Sun', pSun.x + 18, pSun.y + 4);

    // Moon Position along its orbit (3D Vector)
    const moonRad = this.moonLongitude * (Math.PI / 180);
    const moon3D = {
      x: Math.cos(moonRad) * orbU.x + Math.sin(moonRad) * orbV.x,
      y: Math.cos(moonRad) * orbU.y + Math.sin(moonRad) * orbV.y,
      z: Math.cos(moonRad) * orbU.z + Math.sin(moonRad) * orbV.z
    };
    const moonLoc = this.transformPoint({ x: moon3D.x * moonOrbRadius, y: moon3D.y * moonOrbRadius, z: moon3D.z * moonOrbRadius });
    const pMoon = this.project(moonLoc.x, moonLoc.y, moonLoc.z);

    // Helper to normalize angle to [0, 360)
    const norm = (deg) => (deg % 360 + 360) % 360;
    const sNorm = norm(this.sunLongitude);
    const mNorm = norm(this.moonLongitude);
    
    // Topocentric positions for local observer view (with parallax shift)
    // We use a virtual equator observer (latitude = 0) for parallax vectors to eliminate
    // North-South separation at transit while retaining East-West self-rotation parallax.
    const obsRE = this.radius * 0.32; // virtual Earth radius for topocentric parallax, scaled dynamically
    const zenithPara_0 = { x: 1, y: 0, z: 0 };
    const zenithPara = this.rotateY(zenithPara_0, radRot);
    const obsPos = {
      x: zenithPara.x * obsRE,
      y: zenithPara.y * obsRE,
      z: zenithPara.z * obsRE
    };

    const sunVec = {
      x: sun3D.x * this.radius - obsPos.x,
      y: sun3D.y * this.radius - obsPos.y,
      z: sun3D.z * this.radius - obsPos.z
    };

    const moonVec = {
      x: moon3D.x * moonOrbRadius - obsPos.x,
      y: moon3D.y * moonOrbRadius - obsPos.y,
      z: moon3D.z * moonOrbRadius - obsPos.z
    };

    const localSun = projectLocal(sunVec);
    const localMoon = projectLocal(moonVec);

    // Solar Eclipse: Conjunction at nodes (90 or 270)
    const isSolarNode = Math.abs(sNorm - 90) < 4 || Math.abs(sNorm - 270) < 4;
    const diff = Math.abs(sNorm - mNorm);
    const isSolarAligned = diff < 4 || diff > 356;
    const isCelestialSolar = isSolarNode && isSolarAligned;

    // Solar Eclipse occurs only when the disks overlap in the local sky view (dist < 4.5px)
    let isSolarEclipse = false;
    if (isCelestialSolar && localSun && localMoon && localSun.visible && localMoon.visible) {
      const dx = localSun.x - localMoon.x;
      const dy = localSun.y - localMoon.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4.5) {
        isSolarEclipse = true;
      }
    }
    
    // Lunar Eclipse: Opposition at nodes (90 and 270)
    const isLunarEclipse = (Math.abs(sNorm - 90) < 4 && Math.abs(mNorm - 270) < 4) || 
                           (Math.abs(sNorm - 270) < 4 && Math.abs(mNorm - 90) < 4);

    // Draw Moon in 3D sphere (Smaller size)
    ctx.beginPath();
    ctx.arc(pMoon.x, pMoon.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = isLunarEclipse ? '#ea580c' : '#22d3ee';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 12px Outfit';
    ctx.fillText(isLunarEclipse ? 'Moon (Eclipse)' : 'Moon', pMoon.x + 10, pMoon.y + 4);

    // Center Earth and lines
    const pCenter = this.project(0, 0, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(pCenter.x, pCenter.y);
    ctx.lineTo(pMoon.x, pMoon.y);
    ctx.moveTo(pCenter.x, pCenter.y);
    ctx.lineTo(pSun.x, pSun.y);
    ctx.stroke();

    // Draw Earth circle
    ctx.beginPath();
    ctx.arc(pCenter.x, pCenter.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Draw Earth's shadow umbra opposite to the Sun in the 3D sphere (positioned at Moon's orbit)
    const shadow3D = { x: -sun3D.x, y: -sun3D.y, z: -sun3D.z };
    const shadowLoc = this.transformPoint({ x: shadow3D.x * moonOrbRadius, y: shadow3D.y * moonOrbRadius, z: shadow3D.z * moonOrbRadius });
    const pShadow = this.project(shadowLoc.x, shadowLoc.y, shadowLoc.z);

    ctx.save();
    if (pShadow.z > 0) ctx.globalAlpha = 0.25;
    else ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(pShadow.x, pShadow.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // faint red shadow fill
    ctx.fill();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '600 9px Outfit';
    ctx.fillText('Earth Shadow Umbra', pShadow.x + 20, pShadow.y + 3);
    ctx.restore();

    // Arc measurements: only active when Moon is on Meridian AND Sun is on Meridian (Summer Solstice, noon alignment)
    const isMoonOnMeridian = Math.abs((this.moonLongitude - this.earthRotation) % 360 - 90) < 5 || Math.abs((this.moonLongitude - this.earthRotation) % 360 + 270) < 5;
    const isSunOnMeridian = Math.abs((this.sunLongitude - this.earthRotation) % 360 - 90) < 5 || Math.abs((this.sunLongitude - this.earthRotation) % 360 + 270) < 5;
    
    if (isMoonOnMeridian && isSunOnMeridian && Math.abs(this.sunLongitude - 90) < 5) {
      const equatorPt = this.rotateY({ x: 1, y: 0, z: 0 }, radRot);
      const solstice = this.rotateY({ x: Math.cos(radOb), y: -Math.sin(radOb), z: 0 }, radRot);

      this.drawArc(zenith, equatorPt, 'rgba(255, 255, 255, 0.45)', `φ = ${this.latitude.toFixed(1)}°`, true);
      this.drawArc(equatorPt, solstice, '#f59e0b', `ε = ${this.obliquity.toFixed(1)}°`);
      this.drawArc(solstice, moon3D, '#06b6d4', `β = ${this.inclination.toFixed(1)}°`);
      
      const zDist = this.latitude - (this.obliquity + this.inclination);
      this.drawArc(zenith, moon3D, '#ef4444', `z = ${zDist.toFixed(2)}°`);
    } else {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = 'italic 9.5px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('*Align Sun & Moon transiting Meridian to show angles', this.cx1, this.cy1 + this.radius + 18);
      ctx.restore();
    }

    // Bounding 3D circle
    ctx.beginPath();
    ctx.arc(this.cx1, this.cy1, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Divider Line
    const dividerStart = Math.min(this.cy1 - this.radius, this.cy2 - this.radiusSky) - 35;
    const dividerEnd = Math.max(this.cy1 + this.radius, this.cy2 + this.radiusSky) + 35;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.setLineDash([6, 6]);
    ctx.moveTo(this.dividerX, dividerStart);
    ctx.lineTo(this.dividerX, dividerEnd);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // -------------------------------------------------------------
    // OBSERVER'S SKY DOME (RIGHT VIEW)
    // -------------------------------------------------------------
    // Calculate Sun's topocentric altitude for background color
    const sunAltDeg = (localSun && localSun.visible) ? localSun.alt : -90;

    // Draw Sky Dome background based on Sun altitude (Day/Twilight/Night)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx2, cy2, rSky, 0, Math.PI * 2);
    ctx.clip(); // clip drawing inside Horizon

    let skyGrad = ctx.createRadialGradient(cx2, cy2, 10, cx2, cy2, rSky);
    if (isSolarEclipse && localSun && localSun.visible) {
      // Total Solar Eclipse: dark twilight sky
      skyGrad.addColorStop(0, '#0a0a1a');
      skyGrad.addColorStop(0.6, '#0f172a');
      skyGrad.addColorStop(1, '#020617');
    } else if (sunAltDeg > 0) {
      // Day sky
      skyGrad.addColorStop(0, '#7dd3fc'); // Sky 300
      skyGrad.addColorStop(1, '#0284c7'); // Sky 600
    } else if (sunAltDeg > -6) {
      // Civil Twilight: warm orange sunset at horizon
      skyGrad.addColorStop(0, '#1e1b4b'); // deep purple
      skyGrad.addColorStop(0.7, '#881337'); // rose
      skyGrad.addColorStop(1, '#f59e0b'); // amber
    } else if (sunAltDeg > -18) {
      // Astronomical Twilight
      skyGrad.addColorStop(0, '#020205');
      skyGrad.addColorStop(0.8, '#0f172a');
      skyGrad.addColorStop(1, '#1e3a8a'); // deep indigo blue
    } else {
      // Starry Night
      skyGrad.addColorStop(0, '#020206');
      skyGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = skyGrad;
      ctx.fill();

      // Render stars inside night dome
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let i = 0; i < 30; i++) {
        let sx = (Math.sin(i * 12345) * 0.5 + 0.5) * rSky * 1.8 + (cx2 - rSky * 0.9);
        let sy = (Math.cos(i * 54321) * 0.5 + 0.5) * rSky * 1.8 + (cy2 - rSky * 0.9);
        // Verify star is inside circle
        if (Math.hypot(sx - cx2, sy - cy2) < rSky - 4) {
          ctx.fillRect(sx, sy, 1.2, 1.2);
        }
      }
    }
    
    if (sunAltDeg > -18 || isSolarEclipse) {
      ctx.fillStyle = skyGrad;
      ctx.fill();

      // If Solar Eclipse, render stars too!
      if (isSolarEclipse) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        for (let i = 0; i < 15; i++) {
          let sx = (Math.sin(i * 12345) * 0.5 + 0.5) * rSky * 1.8 + (cx2 - rSky * 0.9);
          let sy = (Math.cos(i * 54321) * 0.5 + 0.5) * rSky * 1.8 + (cy2 - rSky * 0.9);
          if (Math.hypot(sx - cx2, sy - cy2) < rSky - 4) {
            ctx.fillRect(sx, sy, 1.2, 1.2);
          }
        }
      }
    }
    ctx.restore(); // restore clipping

    // Outer Horizon line
    ctx.beginPath();
    ctx.arc(cx2, cy2, rSky, 0, Math.PI * 2);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Cardinal labels E, W, S, N on sky map
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 12px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', cx2, cy2 - rSky - 12);
    ctx.fillText('S', cx2, cy2 + rSky + 12);
    ctx.fillText('E', cx2 - rSky - 12, cy2); // East is left in planisphere
    ctx.fillText('W', cx2 + rSky + 12, cy2); // West is right in planisphere

    // Draw meridian line (N-S line)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.setLineDash([4, 4]);
    ctx.moveTo(cx2, cy2 - rSky);
    ctx.lineTo(cx2, cy2 + rSky);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Draw Celestial Equator track in Sky Dome (projected)
    ctx.save();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let firstEq = true;
    for (let i = 0; i <= 120; i++) {
      const theta = (i / 120) * Math.PI * 2;
      const pt = {
        x: this.radius * Math.cos(theta),
        y: 0,
        z: this.radius * Math.sin(theta)
      };
      const proj = projectLocal(pt);
      if (proj && proj.visible) {
        if (firstEq) {
          ctx.moveTo(proj.x, proj.y);
          firstEq = false;
        } else {
          ctx.lineTo(proj.x, proj.y);
        }
      } else {
        firstEq = true; // reset line segment
      }
    }
    ctx.stroke();
    ctx.restore();

    // Draw Ecliptic track in Sky Dome (projected)
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let firstEc = true;
    for (let i = 0; i <= 120; i++) {
      const theta = (i / 120) * Math.PI * 2;
      const pt = {
        x: this.radius * Math.cos(theta) * ecU.x + this.radius * Math.sin(theta) * ecV.x,
        y: this.radius * Math.cos(theta) * ecU.y + this.radius * Math.sin(theta) * ecV.y,
        z: this.radius * Math.cos(theta) * ecU.z + this.radius * Math.sin(theta) * ecV.z
      };
      const proj = projectLocal(pt);
      if (proj && proj.visible) {
        if (firstEc) {
          ctx.moveTo(proj.x, proj.y);
          firstEc = false;
        } else {
          ctx.lineTo(proj.x, proj.y);
        }
      } else {
        firstEc = true;
      }
    }
    ctx.stroke();
    ctx.restore();

    // Project and Draw NCP in local sky
    const localNCP = projectLocal({ x: 0, y: -this.radius, z: 0 });
    if (localNCP) {
      ctx.beginPath();
      ctx.arc(localNCP.x, localNCP.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#60a5fa';
      ctx.fill();
      ctx.fillStyle = '#60a5fa';
      ctx.font = '600 11px Outfit';
      ctx.fillText('NCP', localNCP.x, localNCP.y + 12);
    }

    // Draw Sun in local sky
    if (localSun && localSun.visible) {
      if (isSolarEclipse) {
        // Solar Eclipse Corona effect
        const corona = ctx.createRadialGradient(localSun.x, localSun.y, 6, localSun.x, localSun.y, 22);
        corona.addColorStop(0, '#ffffff');
        corona.addColorStop(0.2, '#fef08a');
        corona.addColorStop(0.5, 'rgba(251, 191, 36, 0.4)');
        corona.addColorStop(1, 'rgba(251, 191, 36, 0)');
        
        ctx.beginPath();
        ctx.arc(localSun.x, localSun.y, 22, 0, Math.PI * 2);
        ctx.fillStyle = corona;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(localSun.x, localSun.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Normal Glow effect for Sun in sky
        const sunGlow = ctx.createRadialGradient(localSun.x, localSun.y, 2, localSun.x, localSun.y, 14);
        sunGlow.addColorStop(0, '#ffffff');
        sunGlow.addColorStop(0.3, '#fef08a');
        sunGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        
        ctx.beginPath();
        ctx.arc(localSun.x, localSun.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = sunGlow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(localSun.x, localSun.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 11px Outfit';
      ctx.fillText('Sun', localSun.x, localSun.y - 12);
    }

    // Draw Moon (with correct phase & orientation) in local sky
    if (localMoon && localMoon.visible) {
      const sunProj = projectLocalNoClip(sunVec);
      const angleToSun = sunProj ? Math.atan2(sunProj.y - localMoon.y, sunProj.x - localMoon.x) : 0;

      this.drawMoonPhase(ctx, localMoon.x, localMoon.y, 7, moon3D, sun3D, angleToSun, isLunarEclipse, isSolarEclipse);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 11px Outfit';
      ctx.fillText(isLunarEclipse ? 'Moon (Eclipse)' : 'Moon', localMoon.x, localMoon.y - 14);
    }

    // Title/Status badge for Eclipses in the Sky View
    if (isSolarEclipse) {
      ctx.save();
      ctx.font = 'bold 12px Outfit';
      ctx.textAlign = 'center';
      
      // Draw badge background
      ctx.fillStyle = 'rgba(220, 38, 38, 0.2)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx2 - 60, cy2 - rSky + 15, 120, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f87171';
      ctx.fillText('SOLAR ECLIPSE', cx2, cy2 - rSky + 30);
      ctx.restore();
    } else if (isLunarEclipse) {
      ctx.save();
      ctx.font = 'bold 12px Outfit';
      ctx.textAlign = 'center';

      // Draw badge background
      ctx.fillStyle = 'rgba(234, 88, 12, 0.2)';
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx2 - 62, cy2 - rSky + 15, 124, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fb923c';
      ctx.fillText('LUNAR ECLIPSE', cx2, cy2 - rSky + 30);
      ctx.restore();
    }

    // Titles
    const titleY = Math.min(this.cy1 - this.radius, this.cy2 - this.radiusSky) - 25;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '600 12.5px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('3D Celestial Sphere (Heliocentric Reference)', this.cx1, titleY);
    ctx.fillText('Observer\'s Local Sky View (Alexandria)', cx2, titleY);
  }

  setTab(tabName) {
    this.activeTab = tabName;
    if (tabName === 'ecliptic' || tabName === 'inclination') {
      this.canvas.style.display = 'none';
      this.threeContainer.style.display = 'block';
      this.isThreeActive = true;
      this.resize();
      this.updateEclipticScene();
    } else {
      this.canvas.style.display = 'block';
      this.threeContainer.style.display = 'none';
      this.isThreeActive = false;
    }
  }

  updateEclipticScene() {
    const R_ce = 15;
    const OBLIQUITY = 23.44;
    const DEG2RAD = Math.PI / 180;

    // 0. Update equatorial tilt based on Latitude
    this.equatorialGroup.rotation.x = (this.eclipticState.latitude - 90) * DEG2RAD;
    
    if (this.activeTab === 'inclination') {
      this.eclipticState.showDecMarkers = true;
      this.eclipticState.showZodiacs = true;
      this.eclipticState.showEquator = true;
      this.eclipticState.showEcliptic = true;

      // Update Moon's orbital inclination relative to Ecliptic
      this.moonOrbitGroup.rotation.x = this.inclination * DEG2RAD;

      // Position Sun based on sunLongitude
      const sunAngle = this.sunLongitude * DEG2RAD;
      const sunLocalPos = new THREE.Vector3(Math.cos(sunAngle) * R_ce, 0, -Math.sin(sunAngle) * R_ce);
      this.sunMesh.position.copy(sunLocalPos);

      // Position Moon based on moonLongitude
      const moonAngle = this.moonLongitude * DEG2RAD;
      const moonLocalPos = new THREE.Vector3(Math.cos(moonAngle) * R_ce, 0, -Math.sin(moonAngle) * R_ce);
      this.moonMesh.position.copy(moonLocalPos);

      // Daily path of the Sun
      const sunEqPos = sunLocalPos.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), -OBLIQUITY * DEG2RAD);
      this.sunPathRing.position.y = sunEqPos.y;
      const sunPathRadius = Math.sqrt(sunEqPos.x ** 2 + sunEqPos.z ** 2);
      this.sunPathRing.scale.set(sunPathRadius / R_ce, sunPathRadius / R_ce, 1);

      // Rotate Celestial Sphere based on earthRotation
      this.celestialSphere.rotation.y = this.earthRotation * DEG2RAD;

      // Visibility
      this.sunMesh.visible = true;
      this.moonMesh.visible = true;
      this.moonOrbitRing.visible = true;
      this.sunPathRing.visible = true;
      this.equatorRing.visible = true;
      this.eclipticRing.visible = true;
      this.gridGroup.visible = true;
      this.zodiacConstellations.visible = true;

      // Lights & Fixed Dark space Background
      this.scene3D.background = new THREE.Color(0x050505);
      this.hemiLight.intensity = 0.8;
      this.sunLight.intensity = 1.0;
      this.starMaterial.opacity = 0.8;

      // Update max/min declination positions
      const epsRad = OBLIQUITY * DEG2RAD;
      const betaRad = this.inclination * DEG2RAD;

      // Position the Sun and Moon Max/Min Path Rings parallel to Equator
      this.sunMaxPathRing.position.y = R_ce * Math.sin(epsRad);
      const sunMaxR = R_ce * Math.cos(epsRad);
      this.sunMaxPathRing.scale.set(sunMaxR / R_ce, sunMaxR / R_ce, 1);
      this.sunMaxPathRing.visible = true;

      this.sunMinPathRing.position.y = -R_ce * Math.sin(epsRad);
      const sunMinR = R_ce * Math.cos(epsRad);
      this.sunMinPathRing.scale.set(sunMinR / R_ce, sunMinR / R_ce, 1);
      this.sunMinPathRing.visible = true;

      this.moonMaxPathRing.position.y = R_ce * Math.sin(epsRad + betaRad);
      const moonMaxR = R_ce * Math.cos(epsRad + betaRad);
      this.moonMaxPathRing.scale.set(moonMaxR / R_ce, moonMaxR / R_ce, 1);
      this.moonMaxPathRing.visible = true;

      this.moonMinPathRing.position.y = -R_ce * Math.sin(epsRad + betaRad);
      const moonMinR = R_ce * Math.cos(epsRad + betaRad);
      this.moonMinPathRing.scale.set(moonMinR / R_ce, moonMinR / R_ce, 1);
      this.moonMinPathRing.visible = true;

      const sunMaxPos = new THREE.Vector3(0, R_ce * Math.sin(epsRad), -R_ce * Math.cos(epsRad));
      const sunMinPos = new THREE.Vector3(0, -R_ce * Math.sin(epsRad), -R_ce * Math.cos(epsRad));
      const moonMaxPos = new THREE.Vector3(0, R_ce * Math.sin(epsRad + betaRad), -R_ce * Math.cos(epsRad + betaRad));
      const moonMinPos = new THREE.Vector3(0, -R_ce * Math.sin(epsRad + betaRad), -R_ce * Math.cos(epsRad + betaRad));

      this.sunMaxDecMesh.position.copy(sunMaxPos);
      this.sunMinDecMesh.position.copy(sunMinPos);
      this.moonMaxDecMesh.position.copy(moonMaxPos);
      this.moonMinDecMesh.position.copy(moonMinPos);

      this.sunMaxDecMesh.visible = true;
      this.sunMinDecMesh.visible = true;
      this.moonMaxDecMesh.visible = true;
      this.moonMinDecMesh.visible = true;

      // Draw arc/line between Sun Max and Moon Max
      const arcPts = [];
      const steps = 16;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = epsRad + t * betaRad;
        arcPts.push(new THREE.Vector3(0, R_ce * Math.sin(angle), -R_ce * Math.cos(angle)));
      }
      this.decDiffLine.geometry.dispose();
      this.decDiffLine.geometry = new THREE.BufferGeometry().setFromPoints(arcPts);
      this.decDiffLine.computeLineDistances();
      this.decDiffLine.visible = true;

      // Draw arc/line between Sun Min and Moon Min
      const arcPtsMin = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = -epsRad - t * betaRad;
        arcPtsMin.push(new THREE.Vector3(0, R_ce * Math.sin(angle), -R_ce * Math.cos(angle)));
      }
      this.decDiffLineMin.geometry.dispose();
      this.decDiffLineMin.geometry = new THREE.BufferGeometry().setFromPoints(arcPtsMin);
      this.decDiffLineMin.computeLineDistances();
      this.decDiffLineMin.visible = true;

      // Update label texts & positions
      this.labelsData3D[this.sunMaxLabelIdx].el.style.display = 'none';
      this.labelsData3D[this.moonMaxLabelIdx].el.style.display = 'none';

      // Max HUD Tooltip Card
      const midAngle = epsRad + 0.5 * betaRad;
      const midPos = new THREE.Vector3(0, R_ce * Math.sin(midAngle), -R_ce * Math.cos(midAngle)).multiplyScalar(1.05);
      this.labelsData3D[this.decDiffLabelIdx].dummy.position.copy(midPos);
      this.labelsData3D[this.decDiffLabelIdx].el.style.display = 'block';
      this.labelsData3D[this.decDiffLabelIdx].el.innerHTML = `
        <div class="space-y-1 font-sans text-right" style="min-width: 130px; line-height: 1.3;">
          <div style="color: #fbbf24; font-weight: 600;">Sun Max Dec (ε): +${OBLIQUITY.toFixed(1)}°</div>
          <div style="color: #22d3ee; font-weight: 600;">Moon Max Dec (δ): +${(OBLIQUITY + this.inclination).toFixed(1)}°</div>
          <div style="border-top: 1px solid rgba(255,255,255,0.15); margin: 3px 0; padding-top: 3px;"></div>
          <div style="color: #f472b6; font-weight: 700;">Inclination (β): ${this.inclination.toFixed(1)}°</div>
        </div>
      `;

      // Min HUD Tooltip Card
      const midAngleMin = -epsRad - 0.5 * betaRad;
      const midPosMin = new THREE.Vector3(0, R_ce * Math.sin(midAngleMin), -R_ce * Math.cos(midAngleMin)).multiplyScalar(1.05);
      this.labelsData3D[this.decDiffLabelIdxMin].dummy.position.copy(midPosMin);
      this.labelsData3D[this.decDiffLabelIdxMin].el.style.display = 'block';
      this.labelsData3D[this.decDiffLabelIdxMin].el.innerHTML = `
        <div class="space-y-1 font-sans text-right" style="min-width: 130px; line-height: 1.3;">
          <div style="color: #fbbf24; font-weight: 600;">Sun Min Dec (ε): -${OBLIQUITY.toFixed(1)}°</div>
          <div style="color: #22d3ee; font-weight: 600;">Moon Min Dec (δ): -${(OBLIQUITY + this.inclination).toFixed(1)}°</div>
          <div style="border-top: 1px solid rgba(255,255,255,0.15); margin: 3px 0; padding-top: 3px;"></div>
          <div style="color: #f472b6; font-weight: 700;">Inclination (β): ${this.inclination.toFixed(1)}°</div>
        </div>
      `;

    } else {
      this.eclipticState.showDecMarkers = false;
      this.sunMaxDecMesh.visible = false;
      this.sunMinDecMesh.visible = false;
      this.moonMaxDecMesh.visible = false;
      this.moonMinDecMesh.visible = false;
      this.decDiffLine.visible = false;
      this.decDiffLineMin.visible = false;
      
      this.moonMesh.visible = false;
      this.moonOrbitRing.visible = false;

      this.sunMaxPathRing.visible = false;
      this.sunMinPathRing.visible = false;
      this.moonMaxPathRing.visible = false;
      this.moonMinPathRing.visible = false;

      // Default Ecliptic logic
      const sunAngle = ((this.eclipticState.dayOfYear - 80) / 365) * Math.PI * 2;
      const sunLocalPos = new THREE.Vector3(Math.cos(sunAngle) * R_ce, 0, -Math.sin(sunAngle) * R_ce);
      this.sunMesh.position.copy(sunLocalPos);

      // Adjust daily path based on declination
      const sunEqPos = sunLocalPos.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), -OBLIQUITY * DEG2RAD);
      this.sunPathRing.position.y = sunEqPos.y;
      const sunPathRadius = Math.sqrt(sunEqPos.x ** 2 + sunEqPos.z ** 2);
      this.sunPathRing.scale.set(sunPathRadius / R_ce, sunPathRadius / R_ce, 1);

      // Rotate Celestial Sphere
      const sunRA = Math.atan2(-sunEqPos.z, sunEqPos.x);
      const rotationAtNoon = -Math.PI / 2 - sunRA;
      const timeOffset = (this.eclipticState.timeOfDay - 12) * (Math.PI / 12);
      this.celestialSphere.rotation.y = rotationAtNoon - timeOffset;

      // Lighting & Background
      this.sunMesh.updateMatrixWorld(true);
      const sunWorldPos = new THREE.Vector3();
      this.sunMesh.getWorldPosition(sunWorldPos);
      this.sunLight.position.copy(sunWorldPos);

      const altitude = sunWorldPos.y / R_ce;
      const nightColor = new THREE.Color(0x050505);
      const twilightColor = new THREE.Color(0x170c2a);
      const dayColor = new THREE.Color(0x38bdf8);
      let bgColor = new THREE.Color();

      if (altitude < -0.1) {
        bgColor.copy(nightColor);
        this.hemiLight.intensity = 0.2;
        this.sunLight.intensity = 0;
        this.starMaterial.opacity = 0.8;
      } else if (altitude < 0.1) {
        const t = (altitude + 0.1) / 0.2;
        bgColor.lerpColors(nightColor, twilightColor, t);
        this.hemiLight.intensity = 0.2 + (0.3 * t);
        this.sunLight.intensity = 2.0 * t;
        this.starMaterial.opacity = 0.8 * (1 - t);
      } else {
        const t = Math.min((altitude - 0.1) / 0.3, 1.0);
        bgColor.lerpColors(twilightColor, dayColor, t);
        this.hemiLight.intensity = 0.5 + (0.5 * t);
        this.sunLight.intensity = 2.0;
        this.starMaterial.opacity = 0;
      }
      this.scene3D.background = bgColor;

      // Visibility Toggles
      this.sunPathRing.visible = this.eclipticState.showSunPath;
      this.equatorRing.visible = this.eclipticState.showEquator;
      this.eclipticRing.visible = this.eclipticState.showEcliptic;
      this.gridGroup.visible = this.eclipticState.showEquator;
      this.zodiacConstellations.visible = this.eclipticState.showZodiacs;
    }
  }

  updateEclipticLabels() {
    const halfW = (window.innerWidth - 400) / 2;
    const halfH = window.innerHeight / 2;

    this.labelsData3D.forEach(item => {
      if (item.visibilityKey && !this.eclipticState[item.visibilityKey]) {
        item.el.style.opacity = 0;
        return;
      }

      if (item.dummy) item.dummy.getWorldPosition(item.position);

      const tempV = item.position.clone();
      tempV.project(this.camera3D);

      if (tempV.z > 1) {
        item.el.style.opacity = 0;
      } else {
        const x = (tempV.x * halfW) + halfW;
        const y = -(tempV.y * halfH) + halfH;
        item.el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        const isMarker = item.el.classList.contains('marker-label');
        item.el.style.opacity = (item.position.y < -0.5 && !isMarker) ? 0.2 : 1;
      }
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate);

    if (this.isThreeActive) {
      if (this.controls3D) {
        this.controls3D.update();
      }
      if (this.renderer3D && this.scene3D && this.camera3D) {
        this.renderer3D.render(this.scene3D, this.camera3D);
      }
      this.updateEclipticLabels();
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw background space gradient
      const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      bgGrad.addColorStop(0, '#020208');
      bgGrad.addColorStop(0.5, '#050711');
      bgGrad.addColorStop(1, '#090c1e');
      this.ctx.fillStyle = bgGrad;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.drawSphere();
    }
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    
    // Remove listeners
    window.removeEventListener('resize', this.resizeBound);
    this.canvas.removeEventListener('pointerdown', this.pointerDownBound);
    this.canvas.removeEventListener('pointermove', this.pointerMoveBound);
    window.removeEventListener('pointerup', this.pointerUpBound);

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    if (this.threeContainer && this.threeContainer.parentNode) {
      this.threeContainer.parentNode.removeChild(this.threeContainer);
    }

    if (this.renderer3D) {
      this.renderer3D.dispose();
    }
  }
}
