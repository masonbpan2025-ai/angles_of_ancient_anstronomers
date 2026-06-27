import * as THREE from 'three';

export class SolarSystem {
  constructor(container) {
    this.container = container;
    
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020206); // Dark cosmic space
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.defaultCameraPos = new THREE.Vector3(0, 75, 115);
    this.camera.position.copy(this.defaultCameraPos);
    
    // Camera perspective states (jsorrery style focus target)
    this.cameraFocusTarget = 'system';
    this.currentPOV = 'system';
    this.currentLookAt = 'system';
    
    this.cameraTargetPosition = new THREE.Vector3().copy(this.defaultCameraPos);
    this.cameraLookAtTarget = new THREE.Vector3(0, 0, 0);
    this.interpolatedLookAt = new THREE.Vector3(0, 0, 0);
    
    // Real-time Visual & Simulation Speed States
    this.sunIntensity = 4.0;
    this.simSpeed = 1.0;
    this.ambientLightIntensity = 0.4;
    
    // Mouse interaction states
    this.userRotationX = 0;
    this.userRotationY = 0;
    this.userZoom = 1.0;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    
    this.camera.lookAt(this.interpolatedLookAt);

    // WebGL Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap; // Standard crisp shadow mapping
    
    // Add filmic tone mapping for high dynamic range look (rich shadows/highlights)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    
    this.container.appendChild(this.renderer.domElement);

    // Group for the solar system
    this.systemGroup = new THREE.Group();
    this.scene.add(this.systemGroup);

    this.planets = {};
    this.bodies = {}; // Map of names -> Object3D references for camera lookups
    this.orbitPivots = []; // to animate orbits
    
    this.createLights();
    this.createStarfield();
    this.createSun();
    this.createPlanets();
    this.createAsteroidBelt();
    this.createShadowCones();
    this.setupMouseControls();
    
    // Resize handler
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Animation loop flag
    this.isPaused = false;
  }

  createLights() {
    // Low ambient light for high contrast terminators
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4); 
    this.scene.add(this.ambientLight);

    // Intense central solar PointLight
    this.sunLight = new THREE.PointLight(0xffffff, 4.0, 300);
    this.sunLight.position.set(0, 0, 0);
    this.sunLight.castShadow = true;
    
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 150;
    this.sunLight.shadow.bias = -0.0002; 
    
    this.scene.add(this.sunLight);
  }

  createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const starPositions = new Float32Array(starsCount * 3);
    
    for (let i = 0; i < starsCount * 3; i += 3) {
      const radius = 150 + Math.random() * 200;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i+1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i+2] = radius * Math.cos(phi);
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true
    });
    
    const starfield = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(starfield);
  }

  createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(255, 209, 59, 0.85)');
    grad.addColorStop(0.6, 'rgba(239, 68, 68, 0.35)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
  }

  createSun() {
    const sunGeometry = new THREE.SphereGeometry(12, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
      map: this.generateProceduralTexture('sun')
    });
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.sun.userData = { radius: 12 };
    this.systemGroup.add(this.sun);

    // Sun references
    this.bodies['sun'] = this.sun;
    this.bodies['system'] = this.sun;

    // Glowing Corona Shell 1 (Large, soft orange halo)
    const glowGeo1 = new THREE.SphereGeometry(14.5, 32, 32);
    const glowMat1 = new THREE.MeshBasicMaterial({
      color: 0xff8c00,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const glowMesh1 = new THREE.Mesh(glowGeo1, glowMat1);
    this.sun.add(glowMesh1);

    // Glowing Corona Shell 2 (Closer, intense golden glow)
    const glowGeo2 = new THREE.SphereGeometry(12.8, 32, 32);
    const glowMat2 = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const glowMesh2 = new THREE.Mesh(glowGeo2, glowMat2);
    this.sun.add(glowMesh2);

    // N3rson style Billboard Glow Sprite
    const spriteMat = new THREE.SpriteMaterial({
      map: this.createGlowTexture(),
      blending: THREE.AdditiveBlending,
      color: 0xffffff,
      transparent: true
    });
    const sunGlowSprite = new THREE.Sprite(spriteMat);
    sunGlowSprite.scale.set(38, 38, 1);
    this.sun.add(sunGlowSprite);
  }

  createOrbitLine(radius) {
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    for(let i=0; i<=128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      orbitPoints.push(Math.cos(angle)*radius, 0, Math.sin(angle)*radius);
    }
    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.12 });
    const orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
    this.scene.add(orbitLine);
  }

  createPlanets() {
    // Planet configuration: [id, name, radius, distance, color, speed, moons]
    const planetData = [
      { id: 4, name: 'Mercury', radius: 1.0, distance: 20, color: 0x9ca3af, speed: 0.008 },
      { id: 5, name: 'Venus', radius: 1.8, distance: 30, color: 0xeab308, speed: 0.006 },
      { id: 1, name: 'Earth', radius: 2.5, distance: 45, color: 0x3b82f6, speed: 0.004, 
        moons: [{ radius: 0.6, distance: 6, color: 0xd1d5db, speed: 0.02 }] },
      { id: 6, name: 'Mars', radius: 1.4, distance: 60, color: 0xef4444, speed: 0.003 },
      { id: 7, name: 'Jupiter', radius: 4.5, distance: 80, color: 0xd4a373, speed: 0.0018 },
      { id: 8, name: 'Saturn', radius: 3.8, distance: 98, color: 0xe9c46a, speed: 0.0012, rings: true }
    ];

    planetData.forEach(data => {
      // Create orbit pivot
      const pivot = new THREE.Group();
      this.systemGroup.add(pivot);
      pivot.userData.speed = data.speed;
      this.orbitPivots.push(pivot);

      // Draw orbit path
      this.createOrbitLine(data.distance);

      // Create local planet group
      const planetGroup = new THREE.Group();
      planetGroup.position.x = data.distance;
      pivot.add(planetGroup);

      // Create planet sphere
      const geo = new THREE.SphereGeometry(data.radius, 64, 64);
      const planetTexture = this.generateProceduralTexture(data.name.toLowerCase());
      
      let roughness = 0.85;
      let metalness = 0.05;
      if (data.name.toLowerCase() === 'earth') {
        roughness = 0.45;
        metalness = 0.12;
      } else if (data.name.toLowerCase() === 'venus') {
        roughness = 0.9;
      } else if (data.name.toLowerCase() === 'jupiter' || data.name.toLowerCase() === 'saturn') {
        roughness = 0.8;
      }

      const mat = new THREE.MeshStandardMaterial({
        map: planetTexture,
        roughness: roughness,
        metalness: metalness
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = data.name.toLowerCase() !== 'earth';
      mesh.userData = { radius: data.radius };
      planetGroup.add(mesh);

      // Store in planets map
      this.planets[data.id] = planetGroup;
      
      // Store in bodies lookup map
      this.bodies[data.name.toLowerCase()] = mesh;

      // Saturn Rings
      if (data.rings) {
        const ringGroup = new THREE.Group();
        ringGroup.rotation.x = Math.PI / 2.3; // tilted
        planetGroup.add(ringGroup);

        const ringGeo = new THREE.RingGeometry(data.radius * 1.3, data.radius * 2.3, 64);
        ringGeo.rotateX(Math.PI / 2);
        
        const ringMat = new THREE.MeshStandardMaterial({
          map: this.generateSaturnRingTexture(),
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          roughness: 0.5,
          metalness: 0.1
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.receiveShadow = true;
        ringMesh.castShadow = true;
        ringGroup.add(ringMesh);
      }

      // Specialized Earth enhancements
      if (data.id === 1) {
        this.earthMesh = mesh;
        this.earthGroup = planetGroup;

        // Add cloud layer to Earth for premium aesthetics
        const cloudGeo = new THREE.SphereGeometry(data.radius + 0.08, 32, 32);
        const cloudMat = new THREE.MeshStandardMaterial({
          map: this.generateCloudTexture(),
          transparent: true,
          blending: THREE.AdditiveBlending,
          opacity: 0.45,
          roughness: 0.9
        });
        this.earthClouds = new THREE.Mesh(cloudGeo, cloudMat);
        this.earthClouds.receiveShadow = false;
        planetGroup.add(this.earthClouds);
      }

      // Add moons
      if (data.moons) {
        data.moons.forEach(moonData => {
          const moonPivot = new THREE.Group();
          planetGroup.add(moonPivot);
          moonPivot.userData.speed = moonData.speed;
          
          // Faint orbit line for the Moon
          const moonOrbitGeo = new THREE.BufferGeometry();
          const moonOrbitPts = [];
          for(let i=0; i<=64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            moonOrbitPts.push(Math.cos(angle)*moonData.distance, 0, Math.sin(angle)*moonData.distance);
          }
          moonOrbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(moonOrbitPts, 3));
          const moonOrbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 });
          planetGroup.add(new THREE.LineLoop(moonOrbitGeo, moonOrbitMat));

          // Create Moon sphere
          const mGeo = new THREE.SphereGeometry(moonData.radius, 32, 32);
          const mMat = new THREE.MeshStandardMaterial({ color: moonData.color, roughness: 0.85 });
          const mMesh = new THREE.Mesh(mGeo, mMat);
          mMesh.castShadow = true;
          mMesh.receiveShadow = true;
          mMesh.userData = { radius: moonData.radius };
          mMesh.position.x = moonData.distance;
          moonPivot.add(mMesh);
          
          this.moonMesh = mMesh;
          this.moonPivot = moonPivot;
          this.bodies['moon'] = mMesh;
          this.orbitPivots.push(moonPivot);
        });
      }
    });
  }

  createAsteroidBelt() {
    const asteroidGeometry = new THREE.BufferGeometry();
    const asteroidCount = 400;
    const positions = new Float32Array(asteroidCount * 3);
    
    for (let i = 0; i < asteroidCount; i++) {
      const distance = 69 + Math.random() * 5.5; // Mars is 60, Jupiter is 80
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * distance;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      positions[i * 3 + 2] = Math.sin(angle) * distance;
    }
    asteroidGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const asteroidMaterial = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.35,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true
    });
    
    this.asteroids = new THREE.Points(asteroidGeometry, asteroidMaterial);
    this.scene.add(this.asteroids);
  }

  createShadowCones() {
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x010103, // Dark grey/blue volumetric shadow
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // Earth Volumetric Shadow Cone
    const earthConeGeo = new THREE.CylinderGeometry(2.5, 0.7, 35, 32, 1, true);
    earthConeGeo.translate(0, -17.5, 0); 
    earthConeGeo.rotateX(-Math.PI / 2);  
    
    this.earthShadowCone = new THREE.Mesh(earthConeGeo, shadowMat);
    this.scene.add(this.earthShadowCone);

    // Moon Volumetric Shadow Cone
    const moonConeGeo = new THREE.CylinderGeometry(0.6, 0.1, 12, 16, 1, true);
    moonConeGeo.translate(0, -6, 0);
    moonConeGeo.rotateX(-Math.PI / 2);
    
    this.moonShadowCone = new THREE.Mesh(moonConeGeo, shadowMat);
    this.scene.add(this.moonShadowCone);
  }

  setupMouseControls() {
    const dom = this.renderer.domElement;
    
    dom.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      dom.setPointerCapture(e.pointerId);
    });
    
    dom.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;
      
      this.userRotationX -= deltaX * 0.005;
      this.userRotationY = Math.max(-0.85, Math.min(0.85, this.userRotationY - deltaY * 0.005));
      
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    dom.addEventListener('pointerup', (e) => {
      this.isDragging = false;
      dom.releasePointerCapture(e.pointerId);
    });
    
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomStep = e.deltaY * 0.001;
      
      // Allow custom zoom bounds depending on camera mode
      if (this.currentPOV !== 'system') {
        // Field-of-view zooming for stationary surface cameras
        this.userZoom = Math.max(0.1, Math.min(1.5, this.userZoom + zoomStep));
      } else {
        // Distance zooming for orbital cameras
        this.userZoom = Math.max(0.15, Math.min(3.5, this.userZoom + zoomStep));
      }
    }, { passive: false });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setFocusTarget(target) {
    this.cameraFocusTarget = target;
    
    // Sync POV & Look At state values based on focused level default cameras
    if (target === 'system') {
      this.currentPOV = 'system';
      this.currentLookAt = 'system';
    } else if (target === 'earth' || target === 'earth-moon' || target === 'earth-polar') {
      this.currentPOV = 'system';
      this.currentLookAt = 'earth';
    } else if (target === 'system-inner') {
      this.currentPOV = 'system';
      this.currentLookAt = 'sun';
    } else if (target === 'venus-transit') {
      this.currentPOV = 'earth';
      this.currentLookAt = 'sun';
    }

    // Reset offsets
    this.userRotationX = 0;
    this.userRotationY = 0;
    this.userZoom = 1.0;
    this.camera.fov = 45;
    this.camera.updateProjectionMatrix();

    // Sync elements in UI if they exist
    this.syncUI();
  }

  changePerspective(pov, lookAt) {
    this.currentPOV = pov;
    this.currentLookAt = lookAt;
    this.cameraFocusTarget = 'custom';
    
    // Reset manual rotation/zoom offsets
    this.userRotationX = 0;
    this.userRotationY = 0;
    this.userZoom = 1.0;
    this.camera.fov = 45;
    this.camera.updateProjectionMatrix();
  }

  syncUI() {
    const povSelect = document.getElementById('pov-select');
    const lookatSelect = document.getElementById('lookat-select');
    if (povSelect && lookatSelect) {
      povSelect.value = this.currentPOV;
      lookatSelect.value = this.currentLookAt;
    }
  }


  focusOnPlanet(planetId, onComplete) {
    if (planetId === 1) this.setFocusTarget('earth-moon');
    else if (planetId === 2) this.setFocusTarget('earth-moon');
    else if (planetId === 3) this.setFocusTarget('earth-moon');
    else if (planetId === 4) this.setFocusTarget('earth-moon');
    else if (planetId === 5) this.setFocusTarget('earth');
    else if (planetId === 6) this.setFocusTarget('earth-polar');
    else if (planetId === 7) this.setFocusTarget('system-inner');
    else if (planetId === 8) this.setFocusTarget('system-inner');
    else if (planetId === 9) this.setFocusTarget('venus-transit');
    
    if (onComplete) {
      setTimeout(onComplete, 1200);
    }
  }

  resetCamera() {
    this.setFocusTarget('system');
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.resetCamera();
  }

  animate(time) {
    requestAnimationFrame((t) => this.animate(t));
    
    if (!this.isPaused) {
      const speedMult = this.simSpeed;
      // Orbit anims
      this.orbitPivots.forEach(pivot => {
        pivot.rotation.y += pivot.userData.speed * speedMult;
      });
      
      // Earth clouds & body rotation
      if (this.earthClouds) {
        this.earthClouds.rotation.y += 0.003 * speedMult;
      }
      if (this.earthMesh) {
        this.earthMesh.rotation.y += 0.015 * speedMult;
      }

      // Rotate Asteroid Belt
      if (this.asteroids) {
        this.asteroids.rotation.y += 0.0004 * speedMult;
      }
    }

    // Force matrix update to align position calculations
    this.scene.updateMatrixWorld(true);

    let targetPos = new THREE.Vector3();
    let lookAtPos = new THREE.Vector3();

    // --- DECIDE CAMERA MATH ACCORDING TO FOCUS MODE ---
    if (this.cameraFocusTarget !== 'custom') {
      // Standard Level Targets (Heliocentric Orbit or level configurations)
      let baselineTargetPos = new THREE.Vector3();
      let baselineLookAt = new THREE.Vector3();

      if (this.cameraFocusTarget === 'system') {
        baselineTargetPos.copy(this.defaultCameraPos);
        baselineLookAt.set(0, 0, 0);
      } else if (this.cameraFocusTarget === 'earth') {
        if (this.earthMesh) {
          const earthWorldPos = new THREE.Vector3();
          this.earthMesh.getWorldPosition(earthWorldPos);
          const dir = earthWorldPos.clone().normalize();
          baselineTargetPos.copy(earthWorldPos).add(dir.multiplyScalar(8)).add(new THREE.Vector3(0, 3.5, 2));
          baselineLookAt.copy(earthWorldPos);
        } else {
          baselineTargetPos.copy(this.defaultCameraPos);
          baselineLookAt.set(0, 0, 0);
        }
      } else if (this.cameraFocusTarget === 'earth-moon') {
        if (this.earthMesh && this.moonMesh) {
          const earthWorldPos = new THREE.Vector3();
          this.earthMesh.getWorldPosition(earthWorldPos);
          const moonWorldPos = new THREE.Vector3();
          this.moonMesh.getWorldPosition(moonWorldPos);
          
          const sunToEarth = earthWorldPos.clone().normalize();
          const perp = new THREE.Vector3(-sunToEarth.z, 0, sunToEarth.x).normalize();
          
          const midpoint = new THREE.Vector3().addVectors(earthWorldPos, moonWorldPos).multiplyScalar(0.5);
          baselineTargetPos.copy(earthWorldPos).add(perp.multiplyScalar(16)).add(new THREE.Vector3(0, 2, 0));
          baselineLookAt.copy(midpoint);
        } else {
          baselineTargetPos.copy(this.defaultCameraPos);
          baselineLookAt.set(0, 0, 0);
        }
      } else if (this.cameraFocusTarget === 'earth-polar') {
        if (this.earthMesh) {
          const earthWorldPos = new THREE.Vector3();
          this.earthMesh.getWorldPosition(earthWorldPos);
          baselineTargetPos.copy(earthWorldPos).add(new THREE.Vector3(0, 18, 0.1));
          baselineLookAt.copy(earthWorldPos);
        } else {
          baselineTargetPos.copy(this.defaultCameraPos);
          baselineLookAt.set(0, 0, 0);
        }
      } else if (this.cameraFocusTarget === 'system-inner') {
        baselineTargetPos.set(0, 95, 0.1);
        baselineLookAt.set(0, 0, 0);
      } else if (this.cameraFocusTarget === 'venus-transit') {
        if (this.earthMesh) {
          const earthWorldPos = new THREE.Vector3();
          this.earthMesh.getWorldPosition(earthWorldPos);
          const dir = earthWorldPos.clone().normalize();
          baselineTargetPos.copy(earthWorldPos).add(dir.multiplyScalar(5.5)).add(new THREE.Vector3(0, 0.2, 0));
          baselineLookAt.set(0, 0, 0);
        } else {
          baselineTargetPos.copy(this.defaultCameraPos);
          baselineLookAt.set(0, 0, 0);
        }
      }

      // Restore camera standard FOV
      this.camera.fov = 45;
      this.camera.updateProjectionMatrix();

      // Apply standard drag orbital offsets
      const offset = baselineTargetPos.clone().sub(baselineLookAt);
      const originalLength = offset.length();
      const finalRadius = originalLength * this.userZoom;
      
      const dirOffset = offset.clone().normalize();
      dirOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.userRotationX);
      
      const relativeUp = new THREE.Vector3(0, 1, 0);
      const relativeRight = new THREE.Vector3().crossVectors(relativeUp, dirOffset).normalize();
      dirOffset.applyAxisAngle(relativeRight, this.userRotationY);
      dirOffset.multiplyScalar(finalRadius);
      
      targetPos.copy(baselineLookAt).add(dirOffset);
      lookAtPos.copy(baselineLookAt);

    } else {
      // --- CUSTOM PERSPECTIVE MODE (POV + LOOKAT SOLVER) ---
      let povPos = new THREE.Vector3(0, 0, 0);
      let povRadius = 1.0;

      // 1. Get POV center position and radius
      if (this.currentPOV !== 'system') {
        const povObj = this.bodies[this.currentPOV];
        if (povObj) {
          povObj.getWorldPosition(povPos);
          povRadius = povObj.userData.radius || 1.0;
        }
      }

      // 2. Determine Look At base position
      if (this.currentLookAt === 'night') {
        // Pointing directly away from the Sun (helio-radial vector)
        const lookDir = povPos.clone().normalize();
        if (this.currentPOV === 'system') {
          // If in system mode and night, look in default space vector
          lookAtPos.set(0, 0, 100);
        } else {
          lookAtPos.copy(povPos).add(lookDir.multiplyScalar(100));
        }
      } else {
        const lookObj = this.bodies[this.currentLookAt];
        if (lookObj) {
          lookObj.getWorldPosition(lookAtPos);
        } else {
          lookAtPos.set(0, 0, 0); // fallback system center
        }
      }

      // 3. Solve Camera Position and custom look directions based on POV
      if (this.currentPOV === 'system') {
        // Heliocentric Orbital view centered on Look At target
        const offset = this.defaultCameraPos.clone();
        const finalRadius = offset.length() * this.userZoom;
        const dirOffset = offset.clone().normalize();
        
        dirOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.userRotationX);
        const relativeUp = new THREE.Vector3(0, 1, 0);
        const relativeRight = new THREE.Vector3().crossVectors(relativeUp, dirOffset).normalize();
        dirOffset.applyAxisAngle(relativeRight, this.userRotationY);
        dirOffset.multiplyScalar(finalRadius);

        targetPos.copy(lookAtPos).add(dirOffset);
        this.camera.fov = 45;
        this.camera.updateProjectionMatrix();

      } else {
        // Planet-surface Stationary View
        // Line-of-sight direction vector from POV center to Look At target
        let lookDir = new THREE.Vector3().subVectors(lookAtPos, povPos).normalize();
        if (lookDir.lengthSq() < 0.001) {
          // If POV and Look At are the same (self focus)
          lookDir.set(0, 0, 1);
        }

        // Position camera standing slightly above the planet surface in the target's direction
        targetPos.copy(povPos).add(lookDir.clone().multiplyScalar(povRadius + 0.2)).add(new THREE.Vector3(0, povRadius * 0.05, 0));

        // Let mouse controls look around relative to this baseline target vector
        const finalLookDir = lookDir.clone().normalize();
        finalLookDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.userRotationX);
        
        const relativeUp = new THREE.Vector3(0, 1, 0);
        const relativeRight = new THREE.Vector3().crossVectors(relativeUp, finalLookDir).normalize();
        finalLookDir.applyAxisAngle(relativeRight, this.userRotationY);

        // Target look-at is positioned along the rotated view vector
        lookAtPos.copy(targetPos).add(finalLookDir.multiplyScalar(10));

        // Surface zoom changes camera Field-of-View instead of positioning distance
        this.camera.fov = 45 * this.userZoom;
        this.camera.updateProjectionMatrix();
      }
    }

    // --- APPLY CAMERA AND TARGET TRANSITIONS ---
    this.camera.position.lerp(targetPos, 0.045);
    this.interpolatedLookAt.lerp(lookAtPos, 0.045);
    this.camera.lookAt(this.interpolatedLookAt);

    // Align volumetric shadow cones
    if (this.earthMesh && this.earthShadowCone) {
      const earthPos = new THREE.Vector3();
      this.earthMesh.getWorldPosition(earthPos);
      this.earthShadowCone.position.copy(earthPos);
      this.earthShadowCone.lookAt(earthPos.clone().multiplyScalar(2));
    }
    
    if (this.moonMesh && this.moonShadowCone) {
      const moonPos = new THREE.Vector3();
      this.moonMesh.getWorldPosition(moonPos);
      this.moonShadowCone.position.copy(moonPos);
      this.moonShadowCone.lookAt(moonPos.clone().multiplyScalar(2));
    }

    // Dynamic Lunar Eclipse Blood Moon color blending
    if (this.earthMesh && this.moonMesh) {
      const earthPos = new THREE.Vector3();
      this.earthMesh.getWorldPosition(earthPos);
      const moonPos = new THREE.Vector3();
      this.moonMesh.getWorldPosition(moonPos);
      
      const SE = earthPos.clone().normalize();
      const EM = moonPos.clone().sub(earthPos);
      const isBehind = EM.dot(SE) > 0;
      
      const proj = EM.clone().projectOnVector(SE);
      const perpDist = EM.clone().sub(proj).length();
      const shadowRadiusAtMoon = 2.2;
      
      if (isBehind && perpDist < shadowRadiusAtMoon) {
        const depth = 1.0 - (perpDist / shadowRadiusAtMoon); 
        this.moonMesh.material.color.setRGB(
          0.8 - 0.5 * depth, 
          0.8 - 0.75 * depth, 
          0.8 - 0.75 * depth  
        );
      } else {
        this.moonMesh.material.color.setHex(0xcccccc); // normal moon color
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  // --- REAL-TIME CONTROL UPGRADES ---
  updateControl(name, value) {
    if (name === 'sunIntensity') {
      this.sunIntensity = value;
      if (this.sunLight) {
        this.sunLight.intensity = value;
      }
      // Scale the solar glow sprite inside the Sun mesh
      if (this.sun) {
        this.sun.children.forEach(child => {
          if (child instanceof THREE.Sprite) {
            // Default scale was 38 at default intensity 4.0
            const baseScale = 38 * (value / 4.0);
            child.scale.set(baseScale, baseScale, 1);
          }
        });
      }
    } else if (name === 'simSpeed') {
      this.simSpeed = value;
    } else if (name === 'ambientLight') {
      this.ambientLightIntensity = value;
      if (this.ambientLight) {
        this.ambientLight.intensity = value;
      }
    }
  }

  // --- PROCEDURAL TEXTURE GENERATORS ---
  generateProceduralTexture(bodyName) {
    const canvas = document.createElement('canvas');
    canvas.width = bodyName === 'jupiter' || bodyName === 'saturn' ? 1024 : 512;
    canvas.height = canvas.width / 2;
    const ctx = canvas.getContext('2d');
    
    if (bodyName === 'sun') {
      // Solar surface texture
      ctx.fillStyle = '#ffd13b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw solar noise/granules
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = 2 + Math.random() * 8;
        ctx.fillStyle = Math.random() > 0.5 ? '#ff8c00' : '#ffae19';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (bodyName === 'mercury') {
      // Gray cratered rocky texture
      ctx.fillStyle = '#8e9194';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.drawCraters(ctx, canvas.width, canvas.height, 120, '#66696b', '#a6aab0');
    } else if (bodyName === 'venus') {
      // Thick swirling sulfuric acid cloud layers
      ctx.fillStyle = '#e5b25d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw marbled atmospheric bands
      for (let i = 0; i < 15; i++) {
        const y = (i / 15) * canvas.height;
        ctx.fillStyle = `rgba(180, 115, 30, ${0.08 + Math.random() * 0.15})`;
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, y, canvas.width / 2, 10 + Math.random() * 30, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (bodyName === 'earth') {
      // Ocean background
      ctx.fillStyle = '#0f4c81';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Continents using overlapping circular shapes
      ctx.fillStyle = '#2d6a4f';
      for (let c = 0; c < 25; c++) {
        const cx = Math.random() * canvas.width;
        const cy = 0.2 * canvas.height + Math.random() * 0.6 * canvas.height;
        const r = 30 + Math.random() * 120;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        // Add green-brown detail
        ctx.fillStyle = Math.random() > 0.5 ? '#1b4332' : '#52796f';
        ctx.beginPath();
        ctx.arc(cx + (Math.random() - 0.5) * r, cy + (Math.random() - 0.5) * r, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2d6a4f';
      }
      
      // Ice caps
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.08);
      ctx.fillRect(0, canvas.height * 0.92, canvas.width, canvas.height * 0.08);
    } else if (bodyName === 'moon') {
      // Gray with maria and craters
      ctx.fillStyle = '#b0b3b8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Maria (dark basaltic plains)
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = 'rgba(120, 122, 128, 0.5)';
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 40 + Math.random() * 60, 0, Math.PI * 2);
        ctx.fill();
      }
      this.drawCraters(ctx, canvas.width, canvas.height, 50, '#888b90', '#dcdfe4');
    } else if (bodyName === 'mars') {
      // Red/orange surface with dark patches
      ctx.fillStyle = '#c1440e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Darker rust-iron oxide regions
      for (let i = 0; i < 15; i++) {
        ctx.fillStyle = 'rgba(74, 18, 5, 0.4)';
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 20 + Math.random() * 80, 0, Math.PI * 2);
        ctx.fill();
      }
      // White polar caps
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 0, 15, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height, 15, Math.PI, Math.PI * 2);
      ctx.fill();
    } else if (bodyName === 'jupiter') {
      // Horizontal bands
      const bands = [
        { y: 0.0, h: 0.1, c: '#b08d57' },
        { y: 0.1, h: 0.08, c: '#d4b285' },
        { y: 0.18, h: 0.12, c: '#eae2b7' },
        { y: 0.3, h: 0.05, c: '#c97a3e' },
        { y: 0.35, h: 0.15, c: '#f0ebd8' },
        { y: 0.5, h: 0.1, c: '#d4b285' },
        { y: 0.6, h: 0.08, c: '#c97a3e' },
        { y: 0.68, h: 0.12, c: '#eae2b7' },
        { y: 0.8, h: 0.2, c: '#b08d57' }
      ];
      bands.forEach(b => {
        ctx.fillStyle = b.c;
        ctx.fillRect(0, b.y * canvas.height, canvas.width, b.h * canvas.height);
      });
      // Great Red Spot
      ctx.fillStyle = '#a63a15';
      ctx.beginPath();
      ctx.ellipse(canvas.width * 0.65, canvas.height * 0.7, 35, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      // Inner Spot highlight
      ctx.fillStyle = '#c95122';
      ctx.beginPath();
      ctx.ellipse(canvas.width * 0.65, canvas.height * 0.7, 20, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (bodyName === 'saturn') {
      // Gold and cream bands
      const bands = [
        { y: 0.0, h: 0.15, c: '#cca862' },
        { y: 0.15, h: 0.15, c: '#e5c07b' },
        { y: 0.3, h: 0.1, c: '#ebd59b' },
        { y: 0.4, h: 0.2, c: '#f6ebd0' },
        { y: 0.6, h: 0.15, c: '#ebd59b' },
        { y: 0.75, h: 0.25, c: '#cca862' }
      ];
      bands.forEach(b => {
        ctx.fillStyle = b.c;
        ctx.fillRect(0, b.y * canvas.height, canvas.width, b.h * canvas.height);
      });
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  generateSaturnRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Concentric ring transparency details
    for (let y = 0; y < 256; y++) {
      // Cassini Division (dark empty gap around y = 145 to 160)
      if (y >= 145 && y <= 160) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      } else {
        const noise = Math.sin(y * 0.4) * 0.15 + 0.85;
        const r = Math.floor(195 * noise);
        const g = Math.floor(165 * noise);
        const b = Math.floor(115 * noise);
        const alpha = 0.35 + Math.sin(y * 0.08) * 0.3;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      ctx.fillRect(0, y, 1, 1);
    }
    return new THREE.CanvasTexture(canvas);
  }

  generateCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sweeping cloud layers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * canvas.width;
      const y = 0.1 * canvas.height + Math.random() * 0.8 * canvas.height;
      const rx = 40 + Math.random() * 120;
      const ry = rx * (0.15 + Math.random() * 0.15);
      const angle = (Math.random() - 0.5) * 0.2;
      
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
      ctx.fill();
      
      // Wrap-around support for seamless mapping
      if (x + rx > canvas.width) {
        ctx.beginPath();
        ctx.ellipse(x - canvas.width, y, rx, ry, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      if (x - rx < 0) {
        ctx.beginPath();
        ctx.ellipse(x + canvas.width, y, rx, ry, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return new THREE.CanvasTexture(canvas);
  }

  drawCraters(ctx, width, height, count, darkHex, lightHex) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = 1 + Math.random() * 8;
      
      // Shadow lip
      ctx.strokeStyle = darkHex;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      
      // Highlight lip
      ctx.strokeStyle = lightHex;
      ctx.beginPath();
      ctx.arc(x - 0.5, y - 0.5, r, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }
}
