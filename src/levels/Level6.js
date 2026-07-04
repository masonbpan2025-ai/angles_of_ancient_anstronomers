const CHALLENGES = [
  { 
    id: 'c1', 
    name: "The Cardioid", 
    R: 80, 
    r: 80, 
    w1: 1.0, 
    w2: 2.0,
    hint: "Deferent and epicycle radii are equal (R = r = 80). They rotate in the same direction, with the epicycle spinning twice as fast as the deferent."
  },
  { 
    id: 'c2', 
    name: "Five-Petal Star", 
    R: 120, 
    r: 40, 
    w1: 1.0, 
    w2: -4.0,
    hint: "Deferent radius is three times the epicycle radius (R = 120, r = 40). They spin in opposite directions, with the epicycle rotating four times faster."
  },
  { 
    id: 'c3', 
    name: "The Hexagram", 
    R: 100, 
    r: 50, 
    w1: 2.0, 
    w2: -4.0,
    hint: "Deferent radius is twice the epicycle radius (R = 100, r = 50). They spin in opposite directions, with epicycle velocity twice the deferent speed."
  },
  { 
    id: 'c4', 
    name: "Nested Loops", 
    R: 140, 
    r: 60, 
    w1: 1.0, 
    w2: 4.5,
    hint: "Deferent is larger than the epicycle (R = 140, r = 60). They rotate in the same direction with a fractional epicycle-to-deferent speed ratio."
  }
];

export class Level6 {
  constructor(container) {
    this.instanceId = Math.random();
    console.log("Level6: Constructor called! instanceId is:", this.instanceId, "container is:", container);
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    // Interactive parameters
    this.subtask = 'parallax'; // Default tab ('parallax' or 'epicycles')
    this.progress = 0; // Earth orbit progress (0 to 100)
    this.starDistance = 1.30; // Nearby star distance in parsecs (1.0 to 5.0)

    // Ptolemaic Epicycle Simulator State
    this.planets = [
      { name: 'Mars', deferent: 60, epicycle: 39.5, deferentSpeed: 0.5, epicycleSpeed: 1.0 },
      { name: 'Jupiter', deferent: 60, epicycle: 11.5, deferentSpeed: 0.08, epicycleSpeed: 1.0 },
      { name: 'Saturn', deferent: 60, epicycle: 6.5, deferentSpeed: 0.03, epicycleSpeed: 1.0 },
      { name: 'Venus', deferent: 60, epicycle: 43.1, deferentSpeed: 1.0, epicycleSpeed: 1.6 }
    ];
    this.selectedPlanetName = 'All';
    this.isSimPlaying = true;
    this.deferentSpeed = 0.5;
    this.epicycleSpeed = 1.0;
    this.epicycleRadius = 39.5;
    this.deferentAngle = 0;
    this.epicycleAngle = 0;
    this.sunAngle = 0;
    this.prevAlpha = 0;
    this.angleVelocity = 0;

    // Solving Epicycles state
    this.solvingEpicyclesR = 120;
    this.solvingEpicyclesr = 45;
    this.solvingEpicyclesw1 = 1.0;
    this.solvingEpicyclesw2 = -3.0;
    this.solvingEpicyclesPath = [];
    this.solvingEpicyclesTime = 0;
    this.solvingEpicyclesPlaying = true;
    this.solvingEpicyclesMode = 'freeplay'; // 'freeplay' or 'challenge'
    this.showCircles = true;
    this.showVectors = true;

    // Challenge state
    this.selectedChallengeId = 'c1';
    this.solvedChallenges = []; // list of solved IDs, e.g. ['c1']
    this.targetPath = [];

    // Interactive 3D Orbit Camera view parameters
    this.pitch = -0.3; // Angle of elevation (pitch)
    this.yaw = -0.5;   // Rotation angle (yaw)
    this.zoom = 1.0;

    // Mouse rotation interaction state
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    this.resizeBound = this.resize.bind(this);
    this.resize();
    window.addEventListener('resize', this.resizeBound);

    this.setupMouseControls();

    // Generate random background stars for the 3D scene (stay at fixed spherical direction)
    this.stars = [];
    for (let i = 0; i < 120; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 450; // sphere radius (increased to prevent stars from cutting through plane)
      this.stars.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta) - 100, // offset higher for better background representation
        z: r * Math.cos(phi),
        brightness: 0.3 + Math.random() * 0.7
      });
    }

    // Night sky stars specifically for epicycles panel
    this.nightSkyStars = [];
    for (let i = 0; i < 40; i++) {
      this.nightSkyStars.push({
        x: Math.random(),
        y: Math.random(),
        brightness: 0.4 + Math.random() * 0.6
      });
    }

    // Epicycle path history
    this.epicyclePath = [];
    this.nightSkyPath = [];
    this.allEpicyclePaths = { Mars: [], Jupiter: [], Saturn: [], Venus: [] };
    this.allNightSkyPaths = { Mars: [], Jupiter: [], Saturn: [], Venus: [] };
    this.time = 0;

    this.animate = this.animate.bind(this);
    this.animationId = requestAnimationFrame(this.animate);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setProgress(val) {
    this.progress = parseFloat(val);
    this.lastUserInteraction = Date.now();
  }

  setStarDistance(val) {
    this.starDistance = parseFloat(val);
  }

  setEpicycleRadius(val) {
    this.epicycleRadius = parseFloat(val);
    this.epicyclePath = []; // reset path
  }

  setEpicycleSpeed(val) {
    this.epicycleSpeed = parseFloat(val);
    this.epicyclePath = []; // reset path
  }

  selectPlanet(name) {
    console.log("Level6: selectPlanet called with:", name);
    if (name === 'All') {
      this.selectedPlanetName = 'All';
      this.resetSimulation();
      return;
    }
    const planet = this.planets.find(p => p.name === name);
    if (planet) {
      this.selectedPlanetName = name;
      this.deferentSpeed = planet.deferentSpeed;
      this.epicycleSpeed = planet.epicycleSpeed;
      this.epicycleRadius = planet.epicycle;
      this.resetSimulation();
    }
  }

  togglePlay() {
    this.isSimPlaying = !this.isSimPlaying;
    console.log("Level6: isSimPlaying toggled to:", this.isSimPlaying);
  }

  resetSimulation() {
    console.log("Level6: resetSimulation called");
    this.deferentAngle = 0;
    this.epicycleAngle = 0;
    this.sunAngle = 0;
    this.time = 0;
    this.epicyclePath = [];
    this.nightSkyPath = [];
    this.allEpicyclePaths = { Mars: [], Jupiter: [], Saturn: [], Venus: [] };
    this.allNightSkyPaths = { Mars: [], Jupiter: [], Saturn: [], Venus: [] };
    this.prevAlpha = 0;
    this.angleVelocity = 0;
  }

  setSubtask(tab) {
    console.log("Level6: setSubtask called on instance:", this.instanceId, "with:", tab);
    this.subtask = tab;
    this.resetSimulation();
    if (tab === 'solving-epicycles') {
      this.solvingEpicyclesPath = [];
      this.solvingEpicyclesTime = 0;
      if (this.solvingEpicyclesMode === 'challenge') {
        const challenge = CHALLENGES.find(c => c.id === this.selectedChallengeId);
        if (challenge) this.generateTargetPath(challenge);
      }
      setTimeout(() => this.updateSolvingEpicyclesUI(), 50);
    }
  }

  setupMouseControls() {
    const onMouseDown = (e) => {
      // Don't drag if clicked on the sidebar UI card
      if (e.clientX < 420 && e.clientY > window.innerHeight - 500) return;
      // Don't drag if clicked on parameter panels
      if (e.clientY > window.innerHeight - 150 && e.clientX > 400) return;

      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.yaw += deltaX * 0.007;
      this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch + deltaY * 0.007));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Store references to clean up
    this.controls = { onMouseDown, onMouseMove, onMouseUp };
  }

  // Projects a 3D coordinate (x, y, z) into 2D canvas space (sx, sy)
  project(x, y, z) {
    // 1. Rotate around Y axis (yaw)
    const cosY = Math.cos(this.yaw);
    const sinY = Math.sin(this.yaw);
    let rx = x * cosY - z * sinY;
    let rz = x * sinY + z * cosY;

    // 2. Rotate around X axis (pitch)
    const cosX = Math.cos(this.pitch);
    const sinX = Math.sin(this.pitch);
    let ry = y * cosX - rz * sinX;
    rz = y * sinX + rz * cosX;

    // 3. Perspective Projection
    const camDist = 380;
    const fov = 320; // Reduced from 420 to prevent left-side elements from clipping under the sidebar
    const scale = (fov / (camDist + rz)) * this.zoom;

    // Center of projection shifted to the right to leave space for left sidebar
    const taskPanelWidth = 400;
    const cx = taskPanelWidth + (this.canvas.width - taskPanelWidth) / 2;
    const cy = this.canvas.height / 2;

    return {
      x: cx + rx * scale,
      y: cy + ry * scale,
      depth: rz,
      visible: camDist + rz > 10
    };
  }

  drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  drawParallaxView() {
    const ctx = this.ctx;
    const taskPanelWidth = 400;
    const timeAngle = (this.progress / 100) * Math.PI * 2;

    // 1. Draw distant background stars
    ctx.fillStyle = '#ffffff';
    this.stars.forEach(star => {
      const p = this.project(star.x, star.y, star.z);
      if (p.visible) {
        ctx.save();
        ctx.globalAlpha = star.brightness;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // 2. Draw Earth Orbit path (dashed ellipse in XZ plane)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const R_orbit = 90;
    const Y_orbit = 180;
    const Y_star = -20;
    const Y_bg = -180;
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      const p = this.project(Math.cos(theta) * R_orbit, Y_orbit, Math.sin(theta) * R_orbit);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw Sun at center (0, Y_orbit, 0)
    const pSun = this.project(0, Y_orbit, 0);
    if (pSun.visible) {
      ctx.save();
      const glow = ctx.createRadialGradient(pSun.x, pSun.y, 2, pSun.x, pSun.y, 12);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(0.3, '#fef08a');
      glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pSun.x, pSun.y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(pSun.x, pSun.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Earth position & calculations
    // Opposites: January (left, -R_orbit) and July (right, +R_orbit)
    const pJan = this.project(-R_orbit, Y_orbit, 0);
    const pJuly = this.project(R_orbit, Y_orbit, 0);

    const earthX = Math.cos(timeAngle) * R_orbit;
    const earthZ = Math.sin(timeAngle) * R_orbit;
    const pEarth = this.project(earthX, Y_orbit, earthZ);

    // Nearby Star: along Z axis at starZ and Y_star
    const starZ = -20 - (this.starDistance - 1.30) * 40;
    const starX = 0;
    const starY = Y_star;
    const pStar = this.project(starX, starY, starZ);

    // Projection factor t where Y = Y_bg
    const t_proj = (Y_bg - Y_orbit) / (Y_star - Y_orbit);

    // 5b. Vertical dashed line from Star to Sun
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pStar.x, pStar.y);
    ctx.lineTo(pSun.x, pSun.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Draw opposite Earth placeholders and baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pJan.x, pJan.y);
    ctx.lineTo(pJuly.x, pJuly.y);
    ctx.stroke();

    // January Earth (Faded)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.beginPath();
    ctx.arc(pJan.x, pJan.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 9px Outfit';
    ctx.fillText('Jan', pJan.x - 20, pJan.y + 3);

    // July Earth (Faded)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.beginPath();
    ctx.arc(pJuly.x, pJuly.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('July', pJuly.x + 8, pJuly.y + 3);

    // 6. Draw parallax ray lines from January/July through star to background
    const projX_Jan = -R_orbit * (1 - t_proj);
    const projZ_Jan = t_proj * starZ;
    const pProjJan = this.project(projX_Jan, Y_bg, projZ_Jan);

    const projX_July = R_orbit * (1 - t_proj);
    const projZ_July = t_proj * starZ;
    const pProjJuly = this.project(projX_July, Y_bg, projZ_July);

    // Line of sight January
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pJan.x, pJan.y);
    ctx.lineTo(pProjJan.x, pProjJan.y);
    ctx.stroke();

    // Line of sight July
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.25)';
    ctx.beginPath();
    ctx.moveTo(pJuly.x, pJuly.y);
    ctx.lineTo(pProjJuly.x, pProjJuly.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw apparent shift on background
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pProjJan.x, pProjJan.y);
    ctx.lineTo(pProjJuly.x, pProjJuly.y);
    ctx.stroke();

    // Arrows on apparent shift endpoints
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.arc(pProjJan.x, pProjJan.y, 2.5, 0, Math.PI * 2);
    ctx.arc(pProjJuly.x, pProjJuly.y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '600 9px Outfit';
    ctx.fillText('Apparent Position (Jan)', pProjJan.x - 40, pProjJan.y - 8);
    ctx.fillText('Apparent Position (July)', pProjJuly.x + 8, pProjJuly.y - 8);

    // 7. Draw current Earth line of sight
    const projX_Curr = earthX * (1 - t_proj);
    const projZ_Curr = earthZ * (1 - t_proj) + t_proj * starZ;
    const pProjCurr = this.project(projX_Curr, Y_bg, projZ_Curr);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pEarth.x, pEarth.y);
    ctx.lineTo(pProjCurr.x, pProjCurr.y);
    ctx.stroke();

    // Apparent star spot on background
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pProjCurr.x, pProjCurr.y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 8. Draw Nearby Star (drawn after lines to sit on top)
    if (pStar.visible) {
      ctx.save();
      const starGlow = ctx.createRadialGradient(pStar.x, pStar.y, 1, pStar.x, pStar.y, 8);
      starGlow.addColorStop(0, '#ffffff');
      starGlow.addColorStop(0.3, '#fca5a5');
      starGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = starGlow;
      ctx.beginPath();
      ctx.arc(pStar.x, pStar.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pStar.x, pStar.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 10px Outfit';
      ctx.fillText(`Proxima Centauri`, pStar.x + 8, pStar.y + 3);
      ctx.restore();
    }

    // 9. Draw Earth at current position
    if (pEarth.visible) {
      ctx.save();
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(pEarth.x, pEarth.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 10px Outfit';
      ctx.fillText('Earth', pEarth.x + 7, pEarth.y + 3);
      ctx.restore();
    }

    // 10. Draw Parallax Angle 'p' arc at Nearby Star (in 2D projection space)
    ctx.save();
    const angJan = Math.atan2(pJan.y - pStar.y, pJan.x - pStar.x);
    const angJuly = Math.atan2(pJuly.y - pStar.y, pJuly.x - pStar.x);
    const angSun = Math.atan2(pSun.y - pStar.y, pSun.x - pStar.x);
    
    const arcRadius = 25;
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(pStar.x, pStar.y, arcRadius, Math.min(angJan, angJuly), Math.max(angJan, angJuly));
    ctx.stroke();
    
    const labelX = pStar.x + Math.cos(angSun) * (arcRadius + 12);
    const labelY = pStar.y + Math.sin(angSun) * (arcRadius + 12);
    ctx.fillStyle = '#c084fc';
    ctx.font = '600 10px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2p', labelX, labelY);
    ctx.restore();

    // 11. Render TELESCOPE VIEWFINDER INSET (bottom-right)
    ctx.save();
    const boxW = 160;
    const boxH = 160;
    const boxX = this.canvas.width - boxW - 25;
    const boxY = this.canvas.height - boxH - 25; // placed at the bottom since the parameter panel is hidden

    // Viewfinder container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    this.drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 12);
    ctx.fill();
    ctx.stroke();

    // Circular Viewport clip
    const viewCX = boxX + boxW / 2;
    const viewCY = boxY + boxH / 2;
    const viewR = 60;
    
    ctx.beginPath();
    ctx.arc(viewCX, viewCY, viewR, 0, Math.PI * 2);
    ctx.clip();

    // Draw telescope background grid & black sky
    ctx.fillStyle = '#030712';
    ctx.beginPath();
    ctx.arc(viewCX, viewCY, viewR, 0, Math.PI * 2);
    ctx.fill();

    // Reticle circular guidelines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(viewCX, viewCY, viewR * 0.5, 0, Math.PI * 2);
    ctx.arc(viewCX, viewCY, viewR * 0.75, 0, Math.PI * 2);
    ctx.stroke();

    // Reticle crosshair
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.beginPath();
    ctx.moveTo(viewCX - viewR, viewCY);
    ctx.lineTo(viewCX + viewR, viewCY);
    ctx.moveTo(viewCX, viewCY - viewR);
    ctx.lineTo(viewCX, viewCY + viewR);
    ctx.stroke();

    // Draw background telescope stars (moving opposite to Earth slightly or static)
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 15; i++) {
      // static background stars
      const starSX = viewCX + Math.sin(i * 987) * 45;
      const starSY = viewCY + Math.cos(i * 123) * 45;
      ctx.fillRect(starSX, starSY, 1.2, 1.2);
    }

    // Draw the Nearby Star shifting left/right
    // Shift is proportional to Earth position (cos(theta)) and inversely proportional to star distance
    const shiftMax = 38 / this.starDistance; // scale factor
    const starShiftX = -Math.cos(timeAngle) * shiftMax;
    
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(viewCX + starShiftX, viewCY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Glowing halo
    const viewHalo = ctx.createRadialGradient(viewCX + starShiftX, viewCY, 1, viewCX + starShiftX, viewCY, 7);
    viewHalo.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    viewHalo.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = viewHalo;
    ctx.beginPath();
    ctx.arc(viewCX + starShiftX, viewCY, 7, 0, Math.PI * 2);
    ctx.fill();

    // Apparent endpoints (where Jan and July positions are)
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(viewCX - shiftMax, viewCY - 5);
    ctx.lineTo(viewCX - shiftMax, viewCY + 5);
    ctx.moveTo(viewCX + shiftMax, viewCY - 5);
    ctx.lineTo(viewCX + shiftMax, viewCY + 5);
    ctx.moveTo(viewCX - shiftMax, viewCY);
    ctx.lineTo(viewCX + shiftMax, viewCY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Static January position dot (right)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.beginPath();
    ctx.arc(viewCX + shiftMax, viewCY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '600 8px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Jan', viewCX + shiftMax, viewCY - 8);

    // Static July position dot (left)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.beginPath();
    ctx.arc(viewCX - shiftMax, viewCY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('Jly', viewCX - shiftMax, viewCY - 8);

    ctx.restore(); // end clip

    // Title label for Viewfinder
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9.5px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Telescope View (from Earth)', boxX + boxW / 2, boxY + 18);
    
    // Angle values
    const arcsecVal = (0.769 / this.starDistance).toFixed(3);
    const degVal = (0.0002137 / this.starDistance).toFixed(7);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 8.5px Outfit';
    ctx.fillText(`Max shift: ${arcsecVal}" (${degVal}°)`, boxX + boxW / 2, boxY + boxH - 10);
    ctx.restore();

    // 12. Display orbital path tips on top of screen
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 12px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('3D Heliocentric Perspective: Earth Orbiting Sun', taskPanelWidth + (this.canvas.width - taskPanelWidth) / 2, 40);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 10px Outfit';
    ctx.fillText('Drag mouse to rotate view.', taskPanelWidth + (this.canvas.width - taskPanelWidth) / 2, 57);
  }

  drawEpicycleView() {
    const ctx = this.ctx;
    const taskPanelWidth = 400;
    const W_illus = this.canvas.width - taskPanelWidth;

    // Define coordinates for split screen (50/50 split)
    const wPanel = W_illus / 2 - 25;
    const hPanel = this.canvas.height - 140;
    const yPanel = 90;
    const xLeftPanel = taskPanelWidth + 15;
    const xRightPanel = taskPanelWidth + W_illus / 2 + 10;

    // 1. Draw Left Panel Background Card (Orbital Mechanics View)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 2;
    this.drawRoundedRect(ctx, xLeftPanel, yPanel, wPanel, hPanel, 16);
    ctx.fill();
    ctx.stroke();

    // 2. Draw Right Panel Background Card (Night Sky Star View)
    this.drawRoundedRect(ctx, xRightPanel, yPanel, wPanel, hPanel, 16);
    ctx.fill();
    ctx.stroke();

    // Center point of the Left Panel (geocentric center)
    const cx_left = xLeftPanel + wPanel / 2;
    const cy_left = yPanel + hPanel / 2;

    const isAll = this.selectedPlanetName === 'All';
    let isRetrograde = false;
    let alpha = 0;

    if (isAll) {
      const R_base = wPanel * 0.23;
      const allPlanets = [
        { name: 'Venus', r_def: R_base * 0.45, r_epi: R_base * 0.45 * 0.723, defSpeed: 1.0, epiSpeed: 1.6, color: '#10b981' },
        { name: 'Mars', r_def: R_base * 0.8, r_epi: R_base * 0.8 / 1.52, defSpeed: 0.5, epiSpeed: 1.0, color: '#f59e0b' },
        { name: 'Jupiter', r_def: R_base * 1.1, r_epi: R_base * 1.1 / 5.20, defSpeed: 0.08, epiSpeed: 1.0, color: '#ef4444' },
        { name: 'Saturn', r_def: R_base * 1.4, r_epi: R_base * 1.4 / 9.58, defSpeed: 0.03, epiSpeed: 1.0, color: '#a78bfa' }
      ];

      // Draw Title
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px Outfit';
      ctx.textAlign = 'left';
      ctx.fillText("Orbital Mechanics (All Planets)", xLeftPanel + 15, yPanel + 25);

      // Draw Earth
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(cx_left, cy_left, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#60a5fa';
      ctx.font = '600 9px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText("Earth", cx_left, cy_left - 10);

      // Draw Sun's geocentric orbit
      const R_sun = R_base * 0.6;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(cx_left, cy_left, R_sun, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const sunAngle = this.time * 1.0 * 0.035;
      const sX = cx_left + Math.cos(sunAngle) * R_sun;
      const sY = cy_left - Math.sin(sunAngle) * R_sun;

      // Draw Sun line of sight
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(cx_left, cy_left);
      ctx.lineTo(sX, sY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Sun sphere
      ctx.save();
      const sunGlow = ctx.createRadialGradient(sX, sY, 1, sX, sY, 8);
      sunGlow.addColorStop(0, '#ffffff');
      sunGlow.addColorStop(0.3, '#fbbf24');
      sunGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sX, sY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(sX, sY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Sun Label Bubble
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.drawRoundedRect(ctx, sX - 18, sY - 22, 36, 14, 4);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText("Sun", sX, sY - 12);

      // Draw each planet
      allPlanets.forEach(p => {
        const defAngle = this.time * p.defSpeed * 0.035;
        const epiAngle = this.time * p.epiSpeed * 0.035;

        const pDefX = cx_left + Math.cos(defAngle) * p.r_def;
        const pDefY = cy_left - Math.sin(defAngle) * p.r_def;

        const pPlanetX = pDefX + Math.cos(epiAngle) * p.r_epi;
        const pPlanetY = pDefY - Math.sin(epiAngle) * p.r_epi;

        // Save trail
        if (this.isSimPlaying) {
          this.allEpicyclePaths[p.name].push({ x: pPlanetX, y: pPlanetY });
          if (this.allEpicyclePaths[p.name].length > 200) {
            this.allEpicyclePaths[p.name].shift();
          }
        }

        // Draw Deferent Circle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(cx_left, cy_left, p.r_def, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Epicycle Circle
        ctx.strokeStyle = p.color + '33'; // low opacity
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pDefX, pDefY, p.r_epi, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Construction Lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx_left, cy_left);
        ctx.lineTo(pDefX, pDefY);
        ctx.lineTo(pPlanetX, pPlanetY);
        ctx.stroke();

        // Draw Trail
        const trail = this.allEpicyclePaths[p.name];
        if (trail.length > 1) {
          for (let i = 1; i < trail.length; i++) {
            ctx.strokeStyle = p.color + Math.floor(20 + (i / trail.length) * 180).toString(16).padStart(2, '0');
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
            ctx.lineTo(trail[i].x, trail[i].y);
            ctx.stroke();
          }
        }

        // Line of sight Earth -> Planet
        ctx.strokeStyle = p.color + 'aa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx_left, cy_left);
        ctx.lineTo(pPlanetX, pPlanetY);
        ctx.stroke();

        // Planet Dot
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(pPlanetX, pPlanetY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pPlanetX, pPlanetY, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Label Bubble
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.drawRoundedRect(ctx, pPlanetX - 22, pPlanetY - 22, 44, 14, 4);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8.5px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, pPlanetX, pPlanetY - 12);
      });

      // All Planets Legend
      const legendX = xLeftPanel + 15;
      const legendY = yPanel + hPanel - 20;
      ctx.font = '500 8px Outfit';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#10b981';
      ctx.fillText("● Venus", legendX, legendY);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText("● Mars", legendX + 50, legendY);
      ctx.fillStyle = '#ef4444';
      ctx.fillText("● Jupiter", legendX + 95, legendY);
      ctx.fillStyle = '#a78bfa';
      ctx.fillText("● Saturn", legendX + 150, legendY);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText("● Sun's Orbit", legendX + 205, legendY);
    } else {
      const R_deferent = wPanel * 0.3; // scale deferent
      const R_epicycle = R_deferent * (this.epicycleRadius / 60); // scale epicycle based on ratio

      // 3. Left Panel (Orbital Mechanics) calculations
      const defX = cx_left + Math.cos(this.deferentAngle) * R_deferent;
      const defY = cy_left - Math.sin(this.deferentAngle) * R_deferent;

      const planetX = defX + Math.cos(this.epicycleAngle) * R_epicycle;
      const planetY = defY - Math.sin(this.epicycleAngle) * R_epicycle;

      // Line of sight absolute angle calculation
      const dx = planetX - cx_left;
      const dy = cy_left - planetY;
      alpha = Math.atan2(dy, dx);

      // Track motion state (Prograde vs Retrograde)
      if (this.isSimPlaying) {
        let diff = alpha - this.prevAlpha;
        if (diff < -Math.PI) diff += 2 * Math.PI;
        if (diff > Math.PI) diff -= 2 * Math.PI;

        this.angleVelocity = 0.9 * this.angleVelocity + 0.1 * diff;
        this.prevAlpha = alpha;
      }
      isRetrograde = this.angleVelocity < 0;

      // Store trail inside the Left Panel (spirograph)
      if (this.isSimPlaying) {
        this.epicyclePath.push({ x: planetX, y: planetY });
        if (this.epicyclePath.length > 400) {
          this.epicyclePath.shift();
        }
      }

      // DRAW LEFT PANEL CONTENT
      // Title
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px Outfit';
      ctx.textAlign = 'left';
      ctx.fillText("Orbital Mechanics (Top-down View)", xLeftPanel + 15, yPanel + 25);

      // Deferent circle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx_left, cy_left, R_deferent, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Deferent Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '500 8.5px Outfit';
      ctx.textAlign = 'center';
      const defLabelX = cx_left + Math.cos(Math.PI / 6) * (R_deferent + 9);
      const defLabelY = cy_left - Math.sin(Math.PI / 6) * (R_deferent + 9);
      ctx.fillText("Deferent Path", defLabelX, defLabelY);

      // Deferent center indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(defX, defY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Epicycle circle
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(defX, defY, R_epicycle, 0, Math.PI * 2);
      ctx.stroke();

      // Epicycle Label
      ctx.fillStyle = 'rgba(167, 139, 250, 0.7)';
      ctx.font = '500 8.5px Outfit';
      ctx.textAlign = 'center';
      const epiLabelX = defX + Math.cos(Math.PI / 4) * (R_epicycle + 9);
      const epiLabelY = defY - Math.sin(Math.PI / 4) * (R_epicycle + 9);
      ctx.fillText("Epicycle", epiLabelX, epiLabelY);

      // Sun's orbit (dashed orange/yellow circle)
      const R_sun = R_deferent * 0.75;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(cx_left, cy_left, R_sun, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Sun's position & line of sight
      const sunX = cx_left + Math.cos(this.sunAngle) * R_sun;
      const sunY = cy_left - Math.sin(this.sunAngle) * R_sun;

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(cx_left, cy_left);
      ctx.lineTo(sunX, sunY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Sun sphere with glow
      ctx.save();
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 1, sunX, sunY, 8);
      sunGlow.addColorStop(0, '#ffffff');
      sunGlow.addColorStop(0.3, '#fbbf24');
      sunGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#fef08a';
      ctx.font = '600 8.5px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('Sun', sunX, sunY - 7);
      ctx.restore();

      // Spirograph fading trail
      if (this.epicyclePath.length > 1) {
        for (let i = 1; i < this.epicyclePath.length; i++) {
          ctx.strokeStyle = `rgba(244, 63, 94, ${0.12 + (i / this.epicyclePath.length) * 0.78})`;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(this.epicyclePath[i - 1].x, this.epicyclePath[i - 1].y);
          ctx.lineTo(this.epicyclePath[i].x, this.epicyclePath[i].y);
          ctx.stroke();
        }
      }

      // Line of sight
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx_left, cy_left);
      ctx.lineTo(planetX, planetY);
      ctx.stroke();

      // Earth
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(cx_left, cy_left, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#60a5fa';
      ctx.font = '600 9px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText("Earth", cx_left, cy_left - 10);

      // Planet
      ctx.save();
      const glow = ctx.createRadialGradient(planetX, planetY, 1, planetX, planetY, 8);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(0.3, '#f43f5e');
      glow.addColorStop(1, 'rgba(244, 63, 94, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(planetX, planetY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(planetX, planetY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 9px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(this.selectedPlanetName, planetX, planetY - 8);

      // Draw Legend at the bottom of the Left Panel
      const legendX = xLeftPanel + 15;
      const legendY = yPanel + hPanel - 40;
      ctx.font = '500 8.5px Outfit';
      ctx.textAlign = 'left';

      // Earth Legend
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(legendX, legendY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Earth', legendX + 8, legendY + 3);

      // Deferent Legend
      const xDef = legendX + 45;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(xDef - 6, legendY);
      ctx.lineTo(xDef + 6, legendY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Deferent', xDef + 10, legendY + 3);

      // Epicycle Legend
      const xEpi = xDef + 60;
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xEpi - 6, legendY);
      ctx.lineTo(xEpi + 6, legendY);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Epicycle', xEpi + 10, legendY + 3);

      // Sun's Orbit Legend
      const xSun = xEpi + 60;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(xSun - 6, legendY);
      ctx.lineTo(xSun + 6, legendY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText("Sun's Orbit", xSun + 10, legendY + 3);

      // Trail Legend
      const xTrail = xSun + 70;
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xTrail - 6, legendY);
      ctx.lineTo(xTrail + 6, legendY);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`${this.selectedPlanetName} Trail`, xTrail + 10, legendY + 3);

      // Live Motion State overlay (Left Panel)
      ctx.fillStyle = isRetrograde ? '#f43f5e' : '#22c55e';
      ctx.font = 'bold 11px Outfit';
      ctx.textAlign = 'left';
      ctx.fillText(`Motion State: ${isRetrograde ? 'Retrograde' : 'Prograde'}`, xLeftPanel + 15, yPanel + hPanel - 20);
    }


    // DRAW RIGHT PANEL CONTENT (Night Sky Star View)
    ctx.save();
    // Circular-bounded clip inside Right Panel
    this.drawRoundedRect(ctx, xRightPanel, yPanel, wPanel, hPanel, 16);
    ctx.clip();

    // Stars background
    ctx.fillStyle = '#ffffff';
    this.nightSkyStars.forEach(star => {
      const starX = xRightPanel + star.x * wPanel;
      const starY = yPanel + star.y * hPanel;
      ctx.save();
      ctx.globalAlpha = star.brightness * 0.55;
      ctx.beginPath();
      ctx.arc(starX, starY, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Panel title
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px Outfit';
    ctx.textAlign = 'left';
    ctx.fillText("Night Sky Projection (First-person View)", xRightPanel + 15, yPanel + 25);

    // Horizon line
    const ns_left = xRightPanel + 20;
    const ns_right = xRightPanel + wPanel - 20;
    const ns_top = yPanel + 20;
    const ns_bottom = yPanel + hPanel - 20;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ns_left, ns_top + (ns_bottom - ns_top) / 2);
    ctx.lineTo(ns_right, ns_top + (ns_bottom - ns_top) / 2);
    ctx.stroke();

    if (isAll) {
      const R_base = wPanel * 0.23;
      const skyObjects = [
        { name: 'Venus', r_def: R_base * 0.45, r_epi: R_base * 0.45 * 0.723, defSpeed: 1.0, epiSpeed: 1.6, color: '#10b981', yOffset: -50, type: 'planet' },
        { name: 'Sun', r_def: R_base * 0.6, r_epi: 0, defSpeed: 1.0, epiSpeed: 0, color: '#fbbf24', yOffset: -25, type: 'sun' },
        { name: 'Mars', r_def: R_base * 0.8, r_epi: R_base * 0.8 / 1.52, defSpeed: 0.5, epiSpeed: 1.0, color: '#f59e0b', yOffset: 0, type: 'planet' },
        { name: 'Jupiter', r_def: R_base * 1.1, r_epi: R_base * 1.1 / 5.20, defSpeed: 0.08, epiSpeed: 1.0, color: '#ef4444', yOffset: 25, type: 'planet' },
        { name: 'Saturn', r_def: R_base * 1.4, r_epi: R_base * 1.4 / 9.58, defSpeed: 0.03, epiSpeed: 1.0, color: '#a78bfa', yOffset: 50, type: 'planet' }
      ];

      skyObjects.forEach(obj => {
        let alphaVal;
        let yOffsetDynamic;
        if (obj.type === 'sun') {
          const sunAngle = this.time * 1.0 * 0.035;
          const sX = Math.cos(sunAngle) * obj.r_def;
          const sY = -Math.sin(sunAngle) * obj.r_def;
          alphaVal = Math.atan2(-sY, sX);
          yOffsetDynamic = obj.yOffset;
        } else {
          const defAngle = this.time * obj.defSpeed * 0.035;
          const epiAngle = this.time * obj.epiSpeed * 0.035;
          const pDefX = Math.cos(defAngle) * obj.r_def;
          const pDefY = -Math.sin(defAngle) * obj.r_def;
          const pPlanetX = pDefX + Math.cos(epiAngle) * obj.r_epi;
          const pPlanetY = pDefY - Math.sin(epiAngle) * obj.r_epi;
          alphaVal = Math.atan2(-pPlanetY, pPlanetX);
          
          // Calculate dynamic vertical offset based on epicycle to show retrograde loops!
          const wobbleAmp = obj.name === 'Venus' ? 14 : (obj.name === 'Mars' ? 10 : (obj.name === 'Jupiter' ? 6 : 4));
          yOffsetDynamic = obj.yOffset + wobbleAmp * Math.sin(epiAngle);
        }

        // Normalize alphaVal to [-PI, PI]
        alphaVal = Math.atan2(Math.sin(alphaVal), Math.cos(alphaVal));

        const x_sky = ns_left + ((alphaVal + Math.PI) / (2 * Math.PI)) * (ns_right - ns_left);
        const y_sky = ns_top + (ns_bottom - ns_top) / 2 + yOffsetDynamic;

        // Store trail
        const trailKey = obj.name;
        if (this.isSimPlaying) {
          if (!this.allNightSkyPaths[trailKey]) {
            this.allNightSkyPaths[trailKey] = [];
          }
          this.allNightSkyPaths[trailKey].push({ x: x_sky, y: y_sky });
          if (this.allNightSkyPaths[trailKey].length > 400) {
            this.allNightSkyPaths[trailKey].shift();
          }
        }

        // Draw trail
        const trail = this.allNightSkyPaths[trailKey] || [];
        if (trail.length > 1) {
          ctx.strokeStyle = obj.color + 'bb';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          let first = true;
          for (let i = 0; i < trail.length; i++) {
            const pt = trail[i];
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              const prevPt = trail[i - 1];
              if (Math.abs(pt.x - prevPt.x) > (ns_right - ns_left) * 0.4) {
                ctx.moveTo(pt.x, pt.y);
              } else {
                ctx.lineTo(pt.x, pt.y);
              }
            }
          }
          ctx.stroke();
        }

        // Glow
        ctx.save();
        const objGlow = ctx.createRadialGradient(x_sky, y_sky, 1, x_sky, y_sky, 8);
        objGlow.addColorStop(0, '#ffffff');
        objGlow.addColorStop(0.3, obj.color);
        objGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = objGlow;
        ctx.beginPath();
        ctx.arc(x_sky, y_sky, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = obj.color;
        ctx.beginPath();
        ctx.arc(x_sky, y_sky, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Bubble Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.drawRoundedRect(ctx, x_sky - 22, y_sky - 20, 44, 12, 3);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(obj.name, x_sky, y_sky - 11);
      });

      // Legend in Right Panel
      const rightLegendX = xRightPanel + 15;
      const rightLegendY = yPanel + hPanel - 20;
      ctx.font = '500 8.5px Outfit';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText("All objects projected to night sky with vertical separation.", rightLegendX, rightLegendY);

    } else {
      // Translate 2D geometry to 1D Longitude + slow Latitude sine wave synced to epicycle/deferent
      const x_sky = ns_left + ((alpha + Math.PI) / (2 * Math.PI)) * (ns_right - ns_left);
      const y_sky = ns_top + (ns_bottom - ns_top) / 2 + Math.sin(this.epicycleAngle) * 16 + Math.sin(this.deferentAngle) * 6;

      // Store trail inside the Right Panel
      if (this.isSimPlaying) {
        this.nightSkyPath.push({ x: x_sky, y: y_sky });
        if (this.nightSkyPath.length > 1000) {
          this.nightSkyPath.shift();
        }
      }

      // Permanent solid trail
      if (this.nightSkyPath.length > 1) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        let first = true;
        for (let i = 0; i < this.nightSkyPath.length; i++) {
          const pt = this.nightSkyPath[i];
          if (first) {
            ctx.moveTo(pt.x, pt.y);
            first = false;
           } else {
            const prevPt = this.nightSkyPath[i - 1];
            // Skip drawing lines across viewport wraps
            if (Math.abs(pt.x - prevPt.x) > (ns_right - ns_left) * 0.4) {
              ctx.moveTo(pt.x, pt.y);
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        ctx.stroke();
      }

      // Sky Planet dot
      ctx.save();
      const skyPlanetGlow = ctx.createRadialGradient(x_sky, y_sky, 1, x_sky, y_sky, 8);
      skyPlanetGlow.addColorStop(0, '#ffffff');
      skyPlanetGlow.addColorStop(0.3, '#f43f5e');
      skyPlanetGlow.addColorStop(1, 'rgba(244, 63, 94, 0)');
      ctx.fillStyle = skyPlanetGlow;
      ctx.beginPath();
      ctx.arc(x_sky, y_sky, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(x_sky, y_sky, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Planet Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 9px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(this.selectedPlanetName, x_sky, y_sky - 8);

      // Live Motion State overlay (Right Panel)
      ctx.fillStyle = isRetrograde ? '#f43f5e' : '#22c55e';
      ctx.font = 'bold 11px Outfit';
      ctx.textAlign = 'left';
      ctx.fillText(`Motion: ${isRetrograde ? 'RETROGRADE (Westward)' : 'PROGRADE (Eastward)'}`, xRightPanel + 15, yPanel + hPanel - 20);
    }

    ctx.restore(); // end Right Panel clip

    // Header info in center top
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 13px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Ptolemaic Epicycle Simulator', taskPanelWidth + W_illus / 2, 40);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 10px Outfit';
    ctx.fillText('Historical geocentric deferent-epicycle spirographs and apparent retrograde motion.', taskPanelWidth + W_illus / 2, 57);
  }

  animate() {
    try {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Deep space black canvas background
      const spaceGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      spaceGrad.addColorStop(0, '#020205');
      spaceGrad.addColorStop(0.5, '#050510');
      spaceGrad.addColorStop(1, '#020205');
      this.ctx.fillStyle = spaceGrad;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Dispatch draw calls according to subtask
      if (this.subtask === 'parallax') {
        this.drawParallaxView();
      } else if (this.subtask === 'epicycles') {
        this.drawEpicycleView();
      } else if (this.subtask === 'solving-epicycles') {
        this.drawSolvingEpicyclesView();
      }

      // Update simulation logic for epicycles tab
      if (this.subtask === 'epicycles' && this.isSimPlaying) {
        this.deferentAngle += this.deferentSpeed * 0.035;
        this.epicycleAngle += this.epicycleSpeed * 0.035;
        this.sunAngle += 1.0 * 0.035;
        this.time += 1.0;
      }

      // Trigger state callbacks back to the DOM UI if slider moves automatically
      if (this.subtask === 'parallax' && this.onOrbitUpdate) {
        // Auto-increment only if user hasn't interacted in the last 2.5 seconds
        if (!this.lastUserInteraction || Date.now() - this.lastUserInteraction > 2500) {
          this.progress = (this.progress + 0.15) % 100;
          this.onOrbitUpdate(this.progress);
        }
      }

      this.animationId = requestAnimationFrame(this.animate);
    } catch (err) {
      console.error("Level6: ERROR IN ANIMATE LOOP:", err);
    }
  }

  drawSolvingEpicyclesView() {
    const ctx = this.ctx;
    const taskPanelWidth = 400;
    const W_illus = this.canvas.width - taskPanelWidth;
    const H_illus = this.canvas.height;
    
    // We draw inside a single full panel on the right side of the screen
    const cx = taskPanelWidth + W_illus / 2 - 130;
    const cy = H_illus / 2;

    let R = this.solvingEpicyclesR;
    let r = this.solvingEpicyclesr;
    let w1 = this.solvingEpicyclesw1;
    let w2 = this.solvingEpicyclesw2;

    // Snapping points on the correct parameters if in challenge mode
    if (this.solvingEpicyclesMode === 'challenge') {
      const challenge = CHALLENGES.find(c => c.id === this.selectedChallengeId);
      if (challenge) {
        if (Math.abs(R - challenge.R) <= 3) R = challenge.R;
        if (Math.abs(r - challenge.r) <= 3) r = challenge.r;
        if (Math.abs(w1 - challenge.w1) <= 0.15) w1 = challenge.w1;
        if (Math.abs(w2 - challenge.w2) <= 0.15) w2 = challenge.w2;
      }
    }

    // Increment time
    if (this.solvingEpicyclesPlaying) {
      this.solvingEpicyclesTime += 0.025;
    }

    const t = this.solvingEpicyclesTime;

    // Calculate positions using complex number vector addition:
    // Z(t) = R * e^(i*w1*t) + r * e^(i*w2*t)
    const defX = R * Math.cos(w1 * t);
    const defY = R * Math.sin(w1 * t);
    
    const epiX = r * Math.cos(w2 * t);
    const epiY = r * Math.sin(w2 * t);

    const finalX = cx + defX + epiX;
    const finalY = cy + defY + epiY;

    // Record trace
    if (this.solvingEpicyclesPlaying) {
      this.solvingEpicyclesPath.push({ x: finalX, y: finalY });
      if (this.solvingEpicyclesPath.length > 800) {
        this.solvingEpicyclesPath.shift();
      }
    }

    // 1. Draw grid axes (slate-700 / slate-800 style)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(taskPanelWidth, cy); ctx.lineTo(this.canvas.width, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, this.canvas.height);
    ctx.stroke();

    // 2. Draw Target Path (dashed line) if in challenge mode
    if (this.solvingEpicyclesMode === 'challenge' && this.targetPath.length > 0) {
      ctx.save();
      const challenge = CHALLENGES.find(c => c.id === this.selectedChallengeId);
      const isMatched = (R === challenge.R && r === challenge.r && w1 === challenge.w1 && w2 === challenge.w2);

      ctx.strokeStyle = isMatched ? '#10b981' : '#eab308'; // Solid emerald if matched, dashed yellow otherwise
      ctx.lineWidth = isMatched ? 3 : 2;
      if (!isMatched) {
        ctx.setLineDash([4, 4]);
      }
      
      ctx.beginPath();
      this.targetPath.forEach((pt, i) => {
        const tx = cx + pt.x;
        const ty = cy + pt.y;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      });
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Orbit Circles
    if (this.showCircles) {
      // Deferent circle centered at Earth (cx, cy)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // Epicycle circle centered at Deferent vector tip (cx + defX, cy + defY)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx + defX, cy + defY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4. Draw Trace Path
    if (this.solvingEpicyclesPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#f472b6'; // pink-400
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(this.solvingEpicyclesPath[0].x, this.solvingEpicyclesPath[0].y);
      for (let i = 1; i < this.solvingEpicyclesPath.length; i++) {
        ctx.lineTo(this.solvingEpicyclesPath[i].x, this.solvingEpicyclesPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw Vectors
    if (this.showVectors) {
      // Deferent Vector: Earth (cx, cy) to Epicycle Center (cx + defX, cy + defY)
      ctx.strokeStyle = '#38bdf8'; // sky-400
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + defX, cy + defY);
      ctx.stroke();

      // Epicycle Center node
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx + defX, cy + defY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Epicycle Vector: Epicycle Center to Planet (finalX, finalY)
      ctx.strokeStyle = '#a78bfa'; // violet-400
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + defX, cy + defY);
      ctx.lineTo(finalX, finalY);
      ctx.stroke();
    }

    // 6. Draw Earth (Center)
    ctx.save();
    ctx.fillStyle = '#10b981'; // emerald-500
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#10b981';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // 7. Draw Planet
    ctx.save();
    ctx.fillStyle = '#f472b6'; // pink-400
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#f472b6';
    ctx.beginPath();
    ctx.arc(finalX, finalY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Real-time Equation glassmorphic Card Overlay (absolute card in top-left)
    ctx.save();
    const boxX = taskPanelWidth + 20;
    const boxY = 80;
    const boxW = 280;
    const boxH = 55;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1.5;
    this.drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("COMPLEX VECTOR ORBIT EQUATION", boxX + 12, boxY + 16);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`Z(t) = ${R}·e^(i·${w1.toFixed(1)}t) + ${r}·e^(i·${w2.toFixed(1)}t)`, boxX + 12, boxY + 36);
    ctx.restore();

    // Legends & Titles
    ctx.fillStyle = '#ffffff'; ctx.font = '600 13px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText("Ptolemaic Epicycle Simulator (Solving Epicycles)", taskPanelWidth + W_illus / 2, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 10px Outfit,sans-serif';
    ctx.fillText("Tune the deferent & epicycle radii and speeds to match the target curves.", taskPanelWidth + W_illus / 2, 57);
  }

  generateTargetPath(challenge) {
    this.targetPath = [];
    const steps = 1500;
    const maxT = 40 * Math.PI; // Ensure loops close
    const R = challenge.R;
    const r = challenge.r;
    const w1 = challenge.w1;
    const w2 = challenge.w2;

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * maxT;
      const x = R * Math.cos(w1 * t) + r * Math.cos(w2 * t);
      const y = R * Math.sin(w1 * t) + r * Math.sin(w2 * t);
      this.targetPath.push({ x, y });
    }
  }

  selectChallenge(challengeId) {
    this.selectedChallengeId = challengeId;
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    if (challenge) {
      this.generateTargetPath(challenge);
      
      // Scramble parameters to a random starting position
      // Ensure they don't accidentally start at the target
      this.solvingEpicyclesR = Math.round(50 + Math.random() * 80);
      while (Math.abs(this.solvingEpicyclesR - challenge.R) <= 5) {
        this.solvingEpicyclesR = Math.round(50 + Math.random() * 80);
      }
      this.solvingEpicyclesr = Math.round(20 + Math.random() * 40);
      while (Math.abs(this.solvingEpicyclesr - challenge.r) <= 5) {
        this.solvingEpicyclesr = Math.round(20 + Math.random() * 40);
      }
      this.solvingEpicyclesw1 = parseFloat((0.5 + Math.random() * 2).toFixed(1));
      while (Math.abs(this.solvingEpicyclesw1 - challenge.w1) <= 0.2) {
        this.solvingEpicyclesw1 = parseFloat((0.5 + Math.random() * 2).toFixed(1));
      }
      this.solvingEpicyclesw2 = parseFloat((-6 + Math.random() * 12).toFixed(1));
      while (Math.abs(this.solvingEpicyclesw2 - challenge.w2) <= 0.5) {
        this.solvingEpicyclesw2 = parseFloat((-6 + Math.random() * 12).toFixed(1));
      }

      // Clear trace and time
      this.solvingEpicyclesPath = [];
      this.solvingEpicyclesTime = 0;
      
      this.updateSolvingEpicyclesUI();
    }
  }

  updateSolvingEpicyclesUI() {
    if (this.subtask !== 'solving-epicycles') return;

    let R = this.solvingEpicyclesR;
    let r = this.solvingEpicyclesr;
    let w1 = this.solvingEpicyclesw1;
    let w2 = this.solvingEpicyclesw2;

    if (this.solvingEpicyclesMode === 'challenge') {
      const challenge = CHALLENGES.find(c => c.id === this.selectedChallengeId);
      if (challenge) {
        // Snapping logic:
        if (Math.abs(R - challenge.R) <= 3) {
          R = challenge.R;
          this.solvingEpicyclesR = R;
        }
        if (Math.abs(r - challenge.r) <= 3) {
          r = challenge.r;
          this.solvingEpicyclesr = r;
        }
        if (Math.abs(w1 - challenge.w1) <= 0.15) {
          w1 = challenge.w1;
          this.solvingEpicyclesw1 = w1;
        }
        if (Math.abs(w2 - challenge.w2) <= 0.15) {
          w2 = challenge.w2;
          this.solvingEpicyclesw2 = w2;
        }
      }
    }
    
    // Check if matched
    let matched = false;
    if (this.solvingEpicyclesMode === 'challenge') {
      const challenge = CHALLENGES.find(c => c.id === this.selectedChallengeId);
      if (challenge) {
        matched = (R === challenge.R && r === challenge.r && w1 === challenge.w1 && w2 === challenge.w2);
        if (matched && !this.solvedChallenges.includes(this.selectedChallengeId)) {
          this.solvedChallenges.push(this.selectedChallengeId);
          if (window.activeLevelUIInstance && typeof window.activeLevelUIInstance.verifySolvingEpicycle === 'function') {
            window.activeLevelUIInstance.verifySolvingEpicycle(this.selectedChallengeId, this.solvedChallenges);
          }
        }
      }
    }

    const paramPanel = document.getElementById('param-panel');
    if (paramPanel) {
      paramPanel.innerHTML = this.getSolvingEpicyclesParamPanelHTML(R, r, w1, w2, matched);
      this.attachSolvingEpicyclesEventListeners();
    }
  }

  getSolvingEpicyclesParamPanelHTML(R, r, w1, w2, matched) {
    const isChallenge = this.solvingEpicyclesMode === 'challenge';
    const challenge = CHALLENGES.find(c => c.id === this.selectedChallengeId);

    let chalSelectorHTML = '';
    if (isChallenge) {
      chalSelectorHTML = `
        <div class="space-y-1.5 mt-1 w-full">
          <span class="text-[9px] uppercase font-bold text-amber-400 tracking-wider">Select a Pattern:</span>
          <div class="grid grid-cols-2 gap-1.5">
            ${CHALLENGES.map(c => {
              const solved = this.solvedChallenges.includes(c.id);
              const active = this.selectedChallengeId === c.id;
              const borderClass = active ? 'border-amber-500 bg-amber-950/30 text-amber-300' : 'border-slate-800 bg-slate-950/40 text-slate-400';
              return `
                <button data-chal-id="${c.id}" class="chal-select-btn border text-[10px] py-1 px-1.5 rounded transition hover:bg-slate-800 flex items-center justify-between ${borderClass}">
                  <span>${c.name}</span>
                  ${solved ? '<span class="text-green-500 text-[9px]">✓</span>' : ''}
                </button>
              `;
            }).join('')}
          </div>
          <div class="bg-slate-950/50 border border-slate-850 p-2.5 rounded text-[10px] leading-relaxed text-slate-355 mt-1">
            <span class="font-bold text-amber-400 block mb-0.5">Hint:</span>
            ${challenge ? challenge.hint : ''}
          </div>
        </div>
      `;
    }

    const playPauseIcon = this.solvingEpicyclesPlaying ? 
      `<svg class="w-3.5 h-3.5 text-slate-200" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>` : 
      `<svg class="w-3.5 h-3.5 text-slate-200" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;

    return `
      <div class="flex flex-col gap-2 font-sans w-full font-sans">
        <!-- Header & Playback controls -->
        <div class="flex justify-between items-center border-b border-slate-800 pb-2">
          <div class="flex items-center gap-1.5">
            <h4 class="text-xs font-bold text-sky-400">Ptolemaic Epicycle Simulator</h4>
            <span class="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded uppercase font-semibold">${this.solvingEpicyclesMode}</span>
          </div>
          <div class="flex items-center gap-2">
            <button id="eso-play-btn" class="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-1.5 rounded-lg transition">
              ${playPauseIcon}
            </button>
            <button id="eso-reset-btn" class="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-1.5 rounded-lg transition" title="Reset Trace">
              <svg class="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mode Toggles (Freeplay / Challenges) -->
        <div class="flex bg-slate-950/60 rounded-lg p-0.5 border border-slate-850">
          <button id="mode-freeplay-btn" class="flex-1 text-[10px] py-1 rounded transition ${!isChallenge ? 'bg-slate-800 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'}">Freeplay</button>
          <button id="mode-challenge-btn" class="flex-1 text-[10px] py-1 rounded transition flex items-center justify-center gap-1.5 ${isChallenge ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/></svg>
            Challenges
          </button>
        </div>

        <!-- Preset buttons for Freeplay -->
        ${!isChallenge ? `
          <div class="space-y-1.5 mt-1">
            <span class="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Historical Presets:</span>
            <div class="grid grid-cols-3 gap-1.5">
              <button id="preset-mars-btn" class="bg-slate-800 hover:bg-slate-700 text-[10px] py-1 rounded border border-slate-700 transition">Mars</button>
              <button id="preset-jupiter-btn" class="bg-slate-800 hover:bg-slate-700 text-[10px] py-1 rounded border border-slate-700 transition">Jupiter</button>
              <button id="preset-fourier-btn" class="bg-slate-800 hover:bg-slate-700 text-[10px] py-1 rounded border border-slate-700 transition text-pink-300 border-pink-955/30">Fourier</button>
            </div>
          </div>
        ` : chalSelectorHTML}

        <!-- Show/Hide Toggles -->
        <div class="flex gap-4 items-center justify-between border-t border-slate-850 pt-2 mt-1">
          <label class="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200 transition">
            <input type="checkbox" id="toggle-vectors-chk" ${this.showVectors ? 'checked' : ''} class="rounded bg-slate-850 border-slate-700 accent-sky-400 w-3.5 h-3.5">
            <span>Show Vectors</span>
          </label>
          <label class="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200 transition">
            <input type="checkbox" id="toggle-circles-chk" ${this.showCircles ? 'checked' : ''} class="rounded bg-slate-850 border-slate-700 accent-sky-400 w-3.5 h-3.5">
            <span>Show Orbits</span>
          </label>
        </div>

        <!-- Success Message -->
        ${isChallenge && matched ? `
          <div class="bg-emerald-950/40 border border-emerald-500/30 text-green-400 p-2 rounded-lg flex items-center gap-2 mt-1 shadow-md">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            <span class="font-semibold text-[10px]">Perfect Match! Parameter solved.</span>
          </div>
        ` : ''}

        <!-- Sliders -->
        <div class="space-y-2 border-t border-slate-850 pt-2 mt-1">
          <div class="space-y-0.5">
            <div class="flex justify-between text-[10px] font-medium">
              <span class="text-sky-300">Deferent Radius (R):</span>
              <span class="text-slate-300 font-mono text-[9px] bg-slate-950/50 px-1.5 py-0.5 rounded">${R} px</span>
            </div>
            <input type="range" id="slider-eso-R" min="10" max="200" step="1" value="${R}" class="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400">
          </div>

          <div class="space-y-0.5">
            <div class="flex justify-between text-[10px] font-medium">
              <span class="text-violet-350">Epicycle Radius (r):</span>
              <span class="text-slate-300 font-mono text-[9px] bg-slate-950/50 px-1.5 py-0.5 rounded">${r} px</span>
            </div>
            <input type="range" id="slider-eso-r" min="0" max="150" step="1" value="${r}" class="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-violet-450">
          </div>

          <div class="space-y-0.5">
            <div class="flex justify-between text-[10px] font-medium">
              <span class="text-sky-300">Deferent Speed (&omega;₁):</span>
              <span class="text-slate-300 font-mono text-[9px] bg-slate-950/50 px-1.5 py-0.5 rounded">${w1.toFixed(1)}</span>
            </div>
            <input type="range" id="slider-eso-w1" min="-5" max="5" step="0.1" value="${w1}" class="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400">
          </div>

          <div class="space-y-0.5">
            <div class="flex justify-between text-[10px] font-medium">
              <span class="text-violet-350">Epicycle Speed (&omega;₂):</span>
              <span class="text-slate-300 font-mono text-[9px] bg-slate-950/50 px-1.5 py-0.5 rounded">${w2.toFixed(1)}</span>
            </div>
            <input type="range" id="slider-eso-w2" min="-15" max="15" step="0.1" value="${w2}" class="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-violet-450">
          </div>
        </div>
      </div>
    `;
  }

  attachSolvingEpicyclesEventListeners() {
    const playBtn = document.getElementById('eso-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.solvingEpicyclesPlaying = !this.solvingEpicyclesPlaying;
        this.updateSolvingEpicyclesUI();
      });
    }

    const resetBtn = document.getElementById('eso-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.solvingEpicyclesPath = [];
        this.solvingEpicyclesTime = 0;
        this.updateSolvingEpicyclesUI();
      });
    }

    const freeplayBtn = document.getElementById('mode-freeplay-btn');
    if (freeplayBtn) {
      freeplayBtn.addEventListener('click', () => {
        this.solvingEpicyclesMode = 'freeplay';
        this.solvingEpicyclesPath = [];
        this.solvingEpicyclesTime = 0;
        this.updateSolvingEpicyclesUI();
      });
    }

    const challengeBtn = document.getElementById('mode-challenge-btn');
    if (challengeBtn) {
      challengeBtn.addEventListener('click', () => {
        this.solvingEpicyclesMode = 'challenge';
        this.selectChallenge(this.selectedChallengeId);
      });
    }

    const marsBtn = document.getElementById('preset-mars-btn');
    if (marsBtn) {
      marsBtn.addEventListener('click', () => {
        this.solvingEpicyclesR = 130;
        this.solvingEpicyclesr = 85;
        this.solvingEpicyclesw1 = 1.0;
        this.solvingEpicyclesw2 = 2.14;
        this.solvingEpicyclesPath = [];
        this.solvingEpicyclesTime = 0;
        this.updateSolvingEpicyclesUI();
      });
    }

    const jupiterBtn = document.getElementById('preset-jupiter-btn');
    if (jupiterBtn) {
      jupiterBtn.addEventListener('click', () => {
        this.solvingEpicyclesR = 150;
        this.solvingEpicyclesr = 28;
        this.solvingEpicyclesw1 = 1.0;
        this.solvingEpicyclesw2 = 12.0;
        this.solvingEpicyclesPath = [];
        this.solvingEpicyclesTime = 0;
        this.updateSolvingEpicyclesUI();
      });
    }

    const fourierBtn = document.getElementById('preset-fourier-btn');
    if (fourierBtn) {
      fourierBtn.addEventListener('click', () => {
        this.solvingEpicyclesR = 100;
        this.solvingEpicyclesr = 33;
        this.solvingEpicyclesw1 = 1.0;
        this.solvingEpicyclesw2 = -2.0;
        this.solvingEpicyclesPath = [];
        this.solvingEpicyclesTime = 0;
        this.updateSolvingEpicyclesUI();
      });
    }

    const chalButtons = document.querySelectorAll('.chal-select-btn');
    chalButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const chalId = e.currentTarget.getAttribute('data-chal-id');
        this.selectChallenge(chalId);
      });
    });

    const vectorsChk = document.getElementById('toggle-vectors-chk');
    if (vectorsChk) {
      vectorsChk.addEventListener('change', (e) => {
        this.showVectors = e.target.checked;
      });
    }

    const circlesChk = document.getElementById('toggle-circles-chk');
    if (circlesChk) {
      circlesChk.addEventListener('change', (e) => {
        this.showCircles = e.target.checked;
      });
    }

    const R_slider = document.getElementById('slider-eso-R');
    if (R_slider) {
      R_slider.addEventListener('input', (e) => {
        this.solvingEpicyclesR = parseInt(e.target.value);
        this.updateSolvingEpicyclesUI();
      });
    }

    const r_slider = document.getElementById('slider-eso-r');
    if (r_slider) {
      r_slider.addEventListener('input', (e) => {
        this.solvingEpicyclesr = parseInt(e.target.value);
        this.updateSolvingEpicyclesUI();
      });
    }

    const w1_slider = document.getElementById('slider-eso-w1');
    if (w1_slider) {
      w1_slider.addEventListener('input', (e) => {
        this.solvingEpicyclesw1 = parseFloat(e.target.value);
        this.updateSolvingEpicyclesUI();
      });
    }

    const w2_slider = document.getElementById('slider-eso-w2');
    if (w2_slider) {
      w2_slider.addEventListener('input', (e) => {
        this.solvingEpicyclesw2 = parseFloat(e.target.value);
        this.updateSolvingEpicyclesUI();
      });
    }
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resizeBound);
    if (this.controls) {
      this.canvas.removeEventListener('mousedown', this.controls.onMouseDown);
      window.removeEventListener('mousemove', this.controls.onMouseMove);
      window.removeEventListener('mouseup', this.controls.onMouseUp);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
