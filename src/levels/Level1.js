import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gameState } from '../core/GameState.js';

export class Level1 {
  constructor(container) {
    this.container = container;
    
    // Create level canvas container
    this.levelContainer = document.createElement('div');
    this.levelContainer.style.width = '100%';
    this.levelContainer.style.height = '100%';
    this.levelContainer.style.position = 'relative';
    this.container.appendChild(this.levelContainer);

    this.day = 172;
    this.time = 12.0;
    this.latitude = 40; // default to 40 degrees
    this.isPlaying = false;
    this.playSpeed = 15.0;
    this.lastPlayTime = null;

    this.showSun = true;
    this.showMoon = true;
    this.showEquator = true;

    this.sunPeakAlt = 72.4;
    this.moonPeakAlt = 40.1;
    this.moonPathStatus = "Within boundaries";

    this.initThree();
    this.initScene();
    this.createLabels();

    this.animate = this.animate.bind(this);
    this.animate();

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  initThree() {
    this.width = this.levelContainer.clientWidth || window.innerWidth;
    this.height = this.levelContainer.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0b1121'); // Premium space dark blue

    // Left sidebar is 440px, canvas is to the right
    const canvasWidth = Math.max(300, this.width - 440 - 40);
    const canvasHeight = Math.max(200, this.height - 230);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(canvasWidth, canvasHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.right = '20px';
    this.renderer.domElement.style.top = '20px';
    this.renderer.domElement.style.borderRadius = '16px';
    this.renderer.domElement.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.35)';
    this.levelContainer.appendChild(this.renderer.domElement);

    // Perspective camera, looking at scene center
    this.camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 0.1, 1000);
    this.camera.position.set(18, 12, 18);

    // OrbitControls for interactive camera manipulation
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 45;
    this.controls.minDistance = 5;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.15; // Prevent user from clipping too far below the horizon plane
    this.controls.target.set(0, 0.5, 0);
    this.controls.update();
  }

  initScene() {
    const R = 10; // Celestial radius scale

    // 1. Base Environment Group
    this.envGroup = new THREE.Group();
    this.scene.add(this.envGroup);

    // Ground Plane (Observer Horizon)
    const groundGeo = new THREE.CircleGeometry(R * 1.1, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Slate-800
      roughness: 0.85,
      side: THREE.DoubleSide
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.envGroup.add(this.ground);

    // Horizon outer decorative ring
    const horizonEdgeGeo = new THREE.RingGeometry(R * 1.1, R * 1.1 + 0.08, 64);
    const horizonEdgeMat = new THREE.MeshBasicMaterial({ color: 0x334155, side: THREE.DoubleSide });
    const horizonEdge = new THREE.Mesh(horizonEdgeGeo, horizonEdgeMat);
    horizonEdge.rotation.x = -Math.PI / 2;
    this.envGroup.add(horizonEdge);

    // Observer at center (Human figure)
    this.observerGroup = new THREE.Group();
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfcb7a0, roughness: 0.6 });
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.8 }); // vibrant blue

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), headMat);
    head.position.y = 0.55;
    head.castShadow = true;

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.4, 16), bodyMat);
    body.position.y = 0.2;
    body.castShadow = true;

    this.observerGroup.add(head);
    this.observerGroup.add(body);
    this.envGroup.add(this.observerGroup);

    // 2. Dome Environment & Sphere
    // Celestial Sphere (Wireframe)
    const sphereGeo = new THREE.SphereGeometry(R, 32, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x1e3a8a,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    this.celestialSphere = new THREE.Mesh(sphereGeo, sphereMat);
    this.envGroup.add(this.celestialSphere);

    // Vertical dashed Zenith line
    const zenithPoints = [];
    for (let y = 0; y <= R; y += 0.5) {
      zenithPoints.push(new THREE.Vector3(0, y, 0));
    }
    const zenithGeo = new THREE.BufferGeometry().setFromPoints(zenithPoints);
    const zenithMat = new THREE.LineDashedMaterial({ color: 0x475569, dashSize: 0.5, gapSize: 0.5 });
    this.zenithLine = new THREE.Line(zenithGeo, zenithMat);
    this.zenithLine.computeLineDistances();
    this.envGroup.add(this.zenithLine);

    // Solid Meridian Arc (North to South through Zenith)
    const meridianPoints = [];
    for (let a = 0; a <= 180; a += 2) {
      const rad = a * Math.PI / 180;
      meridianPoints.push(new THREE.Vector3(-R * Math.cos(rad), R * Math.sin(rad), 0));
    }
    const meridianGeo = new THREE.BufferGeometry().setFromPoints(meridianPoints);
    const meridianMat = new THREE.LineBasicMaterial({ color: 0x334155 });
    const meridianLine = new THREE.Line(meridianGeo, meridianMat);
    this.envGroup.add(meridianLine);

    // 3. Lighting System
    this.ambientLight = new THREE.HemisphereLight(0xffffff, 0x0f172a, 0.5);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.1;
    this.dirLight.shadow.camera.far = 40;
    this.dirLight.shadow.camera.left = -15;
    this.dirLight.shadow.camera.right = 15;
    this.dirLight.shadow.camera.top = 15;
    this.dirLight.shadow.camera.bottom = -15;
    this.dirLight.shadow.bias = -0.001;
    this.scene.add(this.dirLight);

    // 4. Equatorial System (tilted based on latitude)
    this.equatorialGroup = new THREE.Group();
    this.scene.add(this.equatorialGroup);

    // Helper function to build beautiful path toruses
    const createPathTorus = (radius, color, thickness) => {
      const geo = new THREE.TorusGeometry(radius, thickness, 8, 100);
      const mat = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2; // Lie flat in parent XZ plane
      return mesh;
    };

    // Equator path
    this.eqLine = createPathTorus(R, 0x3b82f6, 0.04); // Blue torus line
    this.equatorialGroup.add(this.eqLine);

    // 5. Sun System
    this.sunGroup = new THREE.Group();
    this.equatorialGroup.add(this.sunGroup);

    this.sunOrbitLine = createPathTorus(R, 0xf59e0b, 0.06); // Amber torus path
    this.sunGroup.add(this.sunOrbitLine);

    this.sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfde047 }) // Bright Yellow sphere
    );
    // Glowing additive halo
    const sunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      })
    );
    this.sunMesh.add(sunGlow);
    this.sunGroup.add(this.sunMesh);

    // 6. Moon System
    this.moonGroup = new THREE.Group();
    this.equatorialGroup.add(this.moonGroup);

    this.moonOrbitLine = createPathTorus(R, 0xe2e8f0, 0.04); // Slate torus path
    this.moonOrbitLine.material.transparent = true;
    this.moonOrbitLine.material.opacity = 0.55;
    this.moonGroup.add(this.moonOrbitLine);

    this.moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xcbd5e1, // Textured rough white/slate sphere
        roughness: 0.85,
        metalness: 0.15
      })
    );
    // Local directional light specifically targeting the moon to simulate lunar phases
    this.moonLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this.moonLight.position.set(1, 0, 0);
    this.moonGroup.add(this.moonLight);
    this.moonGroup.add(this.moonMesh);
  }

  createLabels() {
    this.labelContainer = document.createElement('div');
    this.labelContainer.style.position = 'absolute';
    this.labelContainer.style.top = '20px';
    this.labelContainer.style.left = '460px'; // Offset by sidebar
    this.labelContainer.style.width = 'calc(100% - 480px)';
    
    const canvasHeight = Math.max(200, (this.levelContainer.clientHeight || window.innerHeight) - 250);
    this.labelContainer.style.height = `${canvasHeight}px`;
    this.labelContainer.style.pointerEvents = 'none';
    this.levelContainer.appendChild(this.labelContainer);
    this.labels = {};

    const labelNames = ['Sun', 'Moon', 'North', 'South', 'East', 'West', 'Zenith'];
    labelNames.forEach(name => {
      const div = document.createElement('div');
      div.className = 'absolute bg-slate-950/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700/50 shadow pointer-events-none transition-opacity duration-100';
      div.style.transform = 'translate(-50%, -100%)';
      div.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.8)';
      div.textContent = name;
      this.labelContainer.appendChild(div);
      this.labels[name] = div;
    });

    // Custom coloring for specific celestial body labels
    this.labels['Sun'].className = 'absolute bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity duration-100';
    this.labels['Moon'].className = 'absolute bg-slate-200 text-slate-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-400 shadow pointer-events-none transition-opacity duration-100';
    this.labels['Zenith'].className = 'absolute bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity duration-100';
  }

  updateParameters(day, time, latitude) {
    this.day = day;
    this.time = time;
    this.latitude = latitude;
  }

  updatePhysics() {
    const R = 10; // Celestial radius scale
    const DEG2RAD = Math.PI / 180;

    if (this.isPlaying) {
      const now = performance.now();
      if (!this.lastPlayTime) this.lastPlayTime = now;
      const dt = (now - this.lastPlayTime) / 1000;
      this.lastPlayTime = now;

      // Increment timeOfDay. playSpeed is in simulated hours per real-time second
      this.time += this.playSpeed * dt;
      if (this.time >= 24) {
        const extraHours = this.time - 24;
        this.time = extraHours % 24;
        this.day += 1 + Math.floor(extraHours / 24);
      }
      if (this.day > 365) {
        this.day = this.day % 365;
        if (this.day === 0) this.day = 1;
      }

      if (typeof this.onTimeUpdate === 'function') {
        this.onTimeUpdate(this.day, this.time);
      }
    } else {
      this.lastPlayTime = null;
    }

    // 1. Tilt universe equator group based on latitude (rotates along X)
    this.equatorialGroup.rotation.x = (this.latitude - 90) * DEG2RAD;

    // 2. Calculate Declinations (in degrees)
    // obliquity = 23.44. Day 172 is Summer Solstice.
    const sunDec = 23.44 * Math.cos(2 * Math.PI * (this.day - 172) / 365);
    const moonDec = 28.5 * Math.sin(2 * Math.PI * (this.day / 27.3));

    this.sunDecDeg = sunDec;
    this.moonDecDeg = moonDec;

    // 3. Scale and Position Paths relative to Equator plane
    // Radius of path = R * cos(dec). Offset Y = R * sin(dec)
    const sunR = R * Math.cos(sunDec * DEG2RAD);
    const sunY = R * Math.sin(sunDec * DEG2RAD);
    this.sunOrbitLine.scale.set(sunR / R, sunR / R, 1);
    this.sunOrbitLine.position.y = sunY;

    const moonR = R * Math.cos(moonDec * DEG2RAD);
    const moonY = R * Math.sin(moonDec * DEG2RAD);
    this.moonOrbitLine.scale.set(moonR / R, moonR / R, 1);
    this.moonOrbitLine.position.y = moonY;

    // 4. Calculate Hour Angle and Position Celestial Bodies
    // HA = (Time - 12) * 15 degrees.
    const hourAngleRad = (this.time - 12) * 15 * DEG2RAD;

    // Sun placement
    this.sunMesh.position.set(
      -sunR * Math.sin(hourAngleRad),
      sunY,
      sunR * Math.cos(hourAngleRad)
    );

    // Moon placement (offset by monthly phase angle)
    const moonPhaseAngle = (this.day / 29.53) * Math.PI * 2;
    const moonHourAngle = hourAngleRad - moonPhaseAngle;

    this.moonMesh.position.set(
      -moonR * Math.sin(moonHourAngle),
      moonY,
      moonR * Math.cos(moonHourAngle)
    );

    // Directional moon light faces the sun to simulate lunar phases
    this.moonLight.position.copy(this.sunMesh.position).sub(this.moonMesh.position).normalize();

    // 5. Update Visibility states based on toggles
    this.sunGroup.visible = this.showSun;
    this.moonGroup.visible = this.showMoon;
    this.eqLine.visible = this.showEquator;

    // 6. Day / Night Dynamic Background Color Transitions
    // Get sun's absolute world position to find altitude Y
    this.equatorialGroup.updateMatrixWorld(true);
    const sunWorldPos = new THREE.Vector3();
    this.sunMesh.getWorldPosition(sunWorldPos);

    // Directional light position matches the sun's position
    this.dirLight.position.copy(sunWorldPos);

    // Sun altitude scaled from -1.0 to 1.0
    const sunAltitude = sunWorldPos.y / R;

    const nightColor = new THREE.Color('#0b1121'); // deep slate dark
    const twilightColor = new THREE.Color('#f97316'); // twilight orange
    const dayColor = new THREE.Color('#38bdf8'); // sky blue

    let bgColor = new THREE.Color();
    if (sunAltitude < -0.1) {
      // Night
      bgColor.copy(nightColor);
      this.ambientLight.intensity = 0.12;
      this.dirLight.intensity = 0.05;
      this.moonOrbitLine.material.color.setHex(0xe2e8f0);
    } else if (sunAltitude < 0.1) {
      // Twilight transition
      const t = (sunAltitude + 0.1) / 0.2; // 0.0 to 1.0
      bgColor.lerpColors(nightColor, twilightColor, t);
      this.ambientLight.intensity = 0.12 + 0.38 * t;
      this.dirLight.intensity = 0.05 + 1.15 * t;
      
      const c = new THREE.Color();
      c.lerpColors(new THREE.Color(0xe2e8f0), new THREE.Color(0x475569), t);
      this.moonOrbitLine.material.color.copy(c);
    } else {
      // Day
      const t = Math.min((sunAltitude - 0.1) / 0.3, 1.0); // 0.0 to 1.0
      bgColor.lerpColors(twilightColor, dayColor, t);
      this.ambientLight.intensity = 0.5 + 0.5 * t;
      this.dirLight.intensity = 1.2 + 0.8 * t;
      this.moonOrbitLine.material.color.setHex(0x475569); // darker slate in day
    }
    this.scene.background = bgColor;

    // 7. Calculate Dashboard peaks & boundaries
    let sPeak = 90 - Math.abs(this.latitude - sunDec);
    this.sunPeakAlt = sPeak;

    let mPeak = 90 - Math.abs(this.latitude - moonDec);
    this.moonPeakAlt = mPeak;

    if (Math.abs(moonDec) > 23.44) {
      this.moonPathStatus = "Outside Sun's boundaries";
    } else {
      this.moonPathStatus = "Within Sun's boundaries";
    }
  }

  updateLabels() {
    const R = 10; // Celestial radius scale

    const project = (pos3D) => {
      const tempV = new THREE.Vector3().copy(pos3D);
      tempV.project(this.camera);

      // Convert NDC [-1, 1] to CSS pixels inside the canvas overlay container
      const x = (tempV.x * 0.5 + 0.5) * this.labelContainer.clientWidth;
      const y = (-tempV.y * 0.5 + 0.5) * this.labelContainer.clientHeight;
      return { x, y, z: tempV.z };
    };

    // Label points fixed in world coordinate space
    // North is -Z, East is +X
    const targets = {
      North: new THREE.Vector3(0, 0.05, -R * 1.15),
      South: new THREE.Vector3(0, 0.05, R * 1.15),
      East: new THREE.Vector3(R * 1.15, 0.05, 0),
      West: new THREE.Vector3(-R * 1.15, 0.05, 0),
      Zenith: new THREE.Vector3(0, R, 0)
    };

    // Sun World Position
    const sunWorld = new THREE.Vector3();
    this.sunMesh.getWorldPosition(sunWorld);
    targets['Sun'] = sunWorld;

    // Moon World Position
    const moonWorld = new THREE.Vector3();
    this.moonMesh.getWorldPosition(moonWorld);
    targets['Moon'] = moonWorld;

    // Sync labels positioning & visibility with screen space
    Object.keys(targets).forEach(name => {
      const pos = targets[name];
      const projPos = project(pos);
      const el = this.labels[name];
      
      if (!el) return;

      el.style.left = projPos.x + 'px';
      el.style.top = projPos.y + 'px';

      const isBehindCamera = projPos.z > 1;
      const distFromCenter = Math.sqrt(projPos.x * projPos.x + projPos.y * projPos.y);

      if (isBehindCamera) {
        el.style.opacity = '0';
      } else {
        if (name === 'Sun' || name === 'Moon') {
          // Hide if below the horizon plane
          if (pos.y < -0.3) {
            el.style.opacity = '0';
          } else {
            el.style.opacity = '1';
          }
        } else {
          // Fade out coordinate labels if too close to center
          el.style.opacity = '1';
        }
      }
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate);
    this.updatePhysics();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.updateLabels();
  }

  onWindowResize() {
    this.width = this.levelContainer.clientWidth || window.innerWidth;
    this.height = this.levelContainer.clientHeight || window.innerHeight;

    const canvasWidth = Math.max(300, this.width - 440 - 40);
    const canvasHeight = Math.max(200, this.height - 250);
    
    this.renderer.setSize(canvasWidth, canvasHeight);
    this.camera.aspect = canvasWidth / canvasHeight;
    this.camera.updateProjectionMatrix();
    this.controls.update();

    if (this.labelContainer) {
      this.labelContainer.style.left = '460px';
      this.labelContainer.style.width = `calc(100% - 480px)`;
      this.labelContainer.style.height = `${canvasHeight}px`;
    }
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    if (this.controls) {
      this.controls.dispose();
    }
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.labelContainer && this.labelContainer.parentNode) {
      this.labelContainer.parentNode.removeChild(this.labelContainer);
    }
    if (this.levelContainer && this.levelContainer.parentNode) {
      this.levelContainer.parentNode.removeChild(this.levelContainer);
    }
  }
}

