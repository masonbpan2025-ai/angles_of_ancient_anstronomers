import * as THREE from 'three';
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
    this.time = 12;
    this.latitude = 41;

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
    this.scene.background = new THREE.Color(0xffffff);

    // Left sidebar is 440px, canvas is to the right
    const canvasWidth = Math.max(300, this.width - 440);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(canvasWidth, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.right = '0';
    this.renderer.domElement.style.top = '0';
    this.levelContainer.appendChild(this.renderer.domElement);

    // Perspective camera, static position
    this.camera = new THREE.PerspectiveCamera(25, canvasWidth / this.height, 0.1, 1000);
    this.camera.position.set(65, 28, 95);
    this.camera.lookAt(0, 8, 0);
  }

  initScene() {
    // Ambient light and directional light for observer meshes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 50, 20);
    this.scene.add(dirLight);

    // The Ground: CircleGeometry flat (radius 32). Slate-100 (0xf1f5f9)
    const groundGeo = new THREE.CircleGeometry(32, 64);
    const groundMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9, depthWrite: true });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.scene.add(this.ground);

    // Faint grey line border around ground
    const borderGeo = new THREE.RingGeometry(31.9, 32, 64);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xcbd5e1, side: THREE.DoubleSide });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.rotation.x = -Math.PI / 2;
    this.scene.add(border);

    // Observer: body (cylinder) & head (sphere) at (0,0,0)
    const observerGroup = new THREE.Group();
    
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x475569 }); // Slate-600
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.9;
    observerGroup.add(body);

    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x334155 }); // Slate-700
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.95;
    observerGroup.add(head);
    
    this.scene.add(observerGroup);

    // Axes: Solid black line across ground for North-South (-X to +X)
    const nsGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-32, 0.01, 0),
      new THREE.Vector3(32, 0.01, 0)
    ]);
    const nsMat = new THREE.LineBasicMaterial({ color: 0x000000 });
    const nsLine = new THREE.Line(nsGeo, nsMat);
    this.scene.add(nsLine);

    // Faint line for East-West (-Z to +Z)
    const ewGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, -32),
      new THREE.Vector3(0, 0.01, 32)
    ]);
    const ewMat = new THREE.LineBasicMaterial({ color: 0xcbd5e1 });
    const ewLine = new THREE.Line(ewGeo, ewMat);
    this.scene.add(ewLine);

    // Vertical dashed line from center to Y=36 (Zenith)
    const zenithPoints = [];
    for (let y = 0; y <= 36; y += 1) {
      zenithPoints.push(new THREE.Vector3(0, y, 0));
    }
    const zenithGeo = new THREE.BufferGeometry().setFromPoints(zenithPoints);
    const zenithMat = new THREE.LineDashedMaterial({ color: 0x64748b, dashSize: 1, gapSize: 1 });
    this.zenithLine = new THREE.Line(zenithGeo, zenithMat);
    this.zenithLine.computeLineDistances();
    this.scene.add(this.zenithLine);

    // Solid arc from North (-X) over Zenith to South (+X) representing the Meridian
    const meridianPoints = [];
    const meridianRadius = 32;
    for (let a = 0; a <= 180; a += 2) {
      const rad = a * Math.PI / 180;
      meridianPoints.push(new THREE.Vector3(-meridianRadius * Math.cos(rad), meridianRadius * Math.sin(rad), 0));
    }
    const meridianGeo = new THREE.BufferGeometry().setFromPoints(meridianPoints);
    const meridianMat = new THREE.LineBasicMaterial({ color: 0x0f172a });
    const meridianLine = new THREE.Line(meridianGeo, meridianMat);
    this.scene.add(meridianLine);

    // UniversePivot Group (tilted based on latitude)
    this.universePivot = new THREE.Group();
    this.scene.add(this.universePivot);

    // Equator Path: dashed circle of radius 26
    const eqPoints = [];
    for (let a = 0; a <= 360; a += 3) {
      const rad = a * Math.PI / 180;
      eqPoints.push(new THREE.Vector3(26 * Math.cos(rad), 0, 26 * Math.sin(rad)));
    }
    const eqGeo = new THREE.BufferGeometry().setFromPoints(eqPoints);
    const eqMat = new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.8, gapSize: 0.8 });
    this.eqLine = new THREE.Line(eqGeo, eqMat);
    this.eqLine.computeLineDistances();
    this.universePivot.add(this.eqLine);

    // Sun Orbit Circle path
    const sunOrbPoints = [];
    for (let a = 0; a <= 360; a += 2) {
      const rad = a * Math.PI / 180;
      sunOrbPoints.push(new THREE.Vector3(Math.cos(rad), 0, Math.sin(rad)));
    }
    const sunOrbGeo = new THREE.BufferGeometry().setFromPoints(sunOrbPoints);
    const sunOrbMat = new THREE.LineBasicMaterial({ color: 0xfef08a }); // yellow-200
    this.sunOrbitLine = new THREE.Line(sunOrbGeo, sunOrbMat);
    this.universePivot.add(this.sunOrbitLine);

    // Moon Orbit Circle path
    const moonOrbPoints = [];
    for (let a = 0; a <= 360; a += 2) {
      const rad = a * Math.PI / 180;
      moonOrbPoints.push(new THREE.Vector3(Math.cos(rad), 0, Math.sin(rad)));
    }
    const moonOrbGeo = new THREE.BufferGeometry().setFromPoints(moonOrbPoints);
    const moonOrbMat = new THREE.LineBasicMaterial({ color: 0x93c5fd }); // blue-300
    this.moonOrbitLine = new THREE.Line(moonOrbGeo, moonOrbMat);
    this.universePivot.add(this.moonOrbitLine);

    // Sun Mesh: Yellow Sphere
    const sunSphereGeo = new THREE.SphereGeometry(1.4, 32, 32);
    const sunSphereMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // amber-500
    this.sunMesh = new THREE.Mesh(sunSphereGeo, sunSphereMat);
    this.universePivot.add(this.sunMesh);

    // Moon Mesh: Blue Sphere
    const moonSphereGeo = new THREE.SphereGeometry(0.9, 32, 32);
    const moonSphereMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 }); // blue-500
    this.moonMesh = new THREE.Mesh(moonSphereGeo, moonSphereMat);
    this.universePivot.add(this.moonMesh);
  }

  createLabels() {
    this.labelContainer = document.createElement('div');
    this.labelContainer.style.position = 'absolute';
    this.labelContainer.style.top = '0';
    this.labelContainer.style.left = '440px'; // Offset by sidebar
    this.labelContainer.style.width = 'calc(100% - 440px)';
    this.labelContainer.style.height = '100%';
    this.labelContainer.style.pointerEvents = 'none';
    this.levelContainer.appendChild(this.labelContainer);

    this.labels = {};

    const labelNames = ['Sun', 'Moon', 'North', 'South', 'East', 'West', 'Zenith'];
    labelNames.forEach(name => {
      const div = document.createElement('div');
      div.className = 'absolute bg-slate-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity duration-100';
      div.style.transform = 'translate(-50%, -100%)';
      div.textContent = name;
      this.labelContainer.appendChild(div);
      this.labels[name] = div;
    });

    // Custom classes for specific labels
    this.labels['Sun'].className = 'absolute bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity duration-100';
    this.labels['Moon'].className = 'absolute bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity duration-100';
    this.labels['Zenith'].className = 'absolute bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity duration-100';
  }

  updateParameters(day, time, latitude) {
    this.day = day;
    this.time = time;
    this.latitude = latitude;
  }

  updatePhysics() {
    // 1. Tilt universe pivot based on latitude
    const tiltRad = (90 - this.latitude) * Math.PI / 180;
    this.universePivot.rotation.set(0, 0, 0); // reset
    this.universePivot.rotateZ(tiltRad);

    // 2. Calculate Declinations (in radians)
    const sunDecDeg = Math.cos(((this.day - 172) / 365) * 2 * Math.PI) * 23.5;
    const sunDec = sunDecDeg * Math.PI / 180;

    const moonDecDeg = Math.cos((this.day / 27.32) * 2 * Math.PI) * 28.5;
    const moonDec = moonDecDeg * Math.PI / 180;

    this.sunDecDeg = sunDecDeg;
    this.moonDecDeg = moonDecDeg;

    // 3. Orbit Adjustments
    const sunRadius = 26;
    this.sunOrbitLine.scale.set(Math.cos(sunDec), 1, Math.cos(sunDec));
    this.sunOrbitLine.position.y = sunRadius * Math.sin(sunDec);

    const moonRadius = 19;
    this.moonOrbitLine.scale.set(Math.cos(moonDec), 1, Math.cos(moonDec));
    this.moonOrbitLine.position.y = moonRadius * Math.sin(moonDec);

    // 4. Body Placements
    const timeAngle = ((12 - this.time) / 24) * 2 * Math.PI;

    // Sun Position relative to tilted universe pivot
    const sunScaledR = sunRadius * Math.cos(sunDec);
    this.sunMesh.position.set(
      sunScaledR * Math.cos(timeAngle),
      sunRadius * Math.sin(sunDec),
      sunScaledR * -Math.sin(timeAngle)
    );

    // Moon Position relative to tilted universe pivot (drift angle added)
    const driftAngle = (this.day / 27.32) * 2 * Math.PI;
    const moonScaledR = moonRadius * Math.cos(moonDec);
    this.moonMesh.position.set(
      moonScaledR * Math.cos(timeAngle + driftAngle),
      moonRadius * Math.sin(moonDec),
      moonScaledR * -Math.sin(timeAngle + driftAngle)
    );

    // 5. Dashboard computations
    let sPeak = 90 - this.latitude + sunDecDeg;
    if (sPeak > 90) sPeak = 180 - sPeak;
    this.sunPeakAlt = sPeak;

    let mPeak = 90 - this.latitude + moonDecDeg;
    if (mPeak > 90) mPeak = 180 - mPeak;
    this.moonPeakAlt = mPeak;

    if (moonDecDeg > 23.5) {
      this.moonPathStatus = "Higher than Summer Sun";
    } else if (moonDecDeg < -23.5) {
      this.moonPathStatus = "Lower than Winter Sun";
    } else {
      this.moonPathStatus = "Within Sun's boundaries";
    }

    // 6. Day/Night Background Color Transition based on Sun's Y coordinate in World space
    const tempVec = new THREE.Vector3();
    this.sunMesh.getWorldPosition(tempVec);
    const sunWorldY = tempVec.y;

    if (sunWorldY >= 5) {
      // Full day sky: light blue
      this.scene.background.setHex(0xe0f2fe); // sky-100
    } else if (sunWorldY > -2) {
      // Twilight (sunset/sunrise): fade from orange to purple
      const t = (sunWorldY + 2) / 7; // [0, 1]
      const r = Math.round(15 + t * (254 - 15));
      const g = Math.round(23 + t * (215 - 23));
      const b = Math.round(42 + t * (170 - 42));
      this.scene.background.setRGB(r / 255, g / 255, b / 255);
    } else {
      // Starry Night: dark slate
      this.scene.background.setHex(0x020617); // slate-950
    }
  }

  updateLabels() {
    const project = (pos3D) => {
      const tempV = new THREE.Vector3().copy(pos3D);
      tempV.project(this.camera);

      // Convert Normalized Device Coordinates [-1, 1] to CSS pixels
      const x = (tempV.x * 0.5 + 0.5) * this.labelContainer.clientWidth;
      const y = (-tempV.y * 0.5 + 0.5) * this.labelContainer.clientHeight;
      return { x, y, z: tempV.z };
    };

    const targets = {
      North: new THREE.Vector3(-32, 0.05, 0),
      South: new THREE.Vector3(32, 0.05, 0),
      East: new THREE.Vector3(0, 0.05, 32),
      West: new THREE.Vector3(0, 0.05, -32),
      Zenith: new THREE.Vector3(0, 36, 0)
    };

    // Sun World Position
    const sunWorld = new THREE.Vector3();
    this.sunMesh.getWorldPosition(sunWorld);
    targets['Sun'] = sunWorld;

    // Moon World Position
    const moonWorld = new THREE.Vector3();
    this.moonMesh.getWorldPosition(moonWorld);
    targets['Moon'] = moonWorld;

    // Update each label
    Object.keys(targets).forEach(name => {
      const pos = targets[name];
      const projPos = project(pos);
      const el = this.labels[name];
      
      if (!el) return;

      el.style.left = projPos.x + 'px';
      el.style.top = projPos.y + 'px';

      const isBehindCamera = projPos.z > 1;
      
      if (isBehindCamera) {
        el.style.opacity = '0';
      } else {
        if (name === 'Sun' || name === 'Moon') {
          if (pos.y < -0.5) {
            el.style.opacity = '0';
          } else {
            el.style.opacity = '1';
          }
        } else {
          el.style.opacity = '1';
        }
      }
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate);
    this.updatePhysics();
    this.renderer.render(this.scene, this.camera);
    this.updateLabels();
  }

  onWindowResize() {
    this.width = this.levelContainer.clientWidth || window.innerWidth;
    this.height = this.levelContainer.clientHeight || window.innerHeight;

    const canvasWidth = Math.max(300, this.width - 440);
    this.renderer.setSize(canvasWidth, this.height);
    this.camera.aspect = canvasWidth / this.height;
    this.camera.updateProjectionMatrix();
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onWindowResize.bind(this));
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
