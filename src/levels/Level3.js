export class Level3 {
  constructor(container) {
    this.container = container;
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

    this.resize();
    window.addEventListener('resize', this.resize.bind(this));

    // Listen for drag interactions on the left panel only
    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));

    this.animate = this.animate.bind(this);
    this.animationId = requestAnimationFrame(this.animate);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    const leftMargin = 410;
    const rightMargin = 30;
    const availableWidth = Math.max(300, this.canvas.width - leftMargin - rightMargin);
    
    this.dividerX = leftMargin + availableWidth * 0.5;
    
    // Position both views centered in their respective halves
    this.cx1 = leftMargin + availableWidth * 0.25;
    this.cy1 = this.canvas.height / 2 + 10;
    
    this.cx2 = leftMargin + availableWidth * 0.75;
    this.cy2 = this.canvas.height / 2 + 10;
    
    // Spheres scale radii - optimized for size and screen limits
    this.radius = Math.min(availableWidth * 0.22, (this.canvas.height - 80) * 0.5);
    if (this.radius < 120) this.radius = 120;
    if (this.radius > 260) this.radius = 260;
    
    this.radiusSky = this.radius * 0.95;
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
  }

  setSunLongitude(val) {
    this.sunLongitude = parseFloat(val);
  }

  setEarthRotation(val) {
    this.earthRotation = parseFloat(val);
  }

  setInclination(val) {
    this.inclination = parseFloat(val);
  }

  setRotateEarth(val) {
    this.rotateEarth = val === true || val === 'true';
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
    const obsRE = 45; // virtual Earth radius for topocentric parallax
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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = 'italic 11px Outfit';
      ctx.fillText('*Align Sun & Moon transiting Meridian (Noon, Solstice) to show angles', this.cx1 - 180, this.cy1 + this.radius + 25);
    }

    // Bounding 3D circle
    ctx.beginPath();
    ctx.arc(this.cx1, this.cy1, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Divider Line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.setLineDash([6, 6]);
    ctx.moveTo(this.dividerX, 20);
    ctx.lineTo(this.dividerX, this.canvas.height - 20);
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '600 13px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('3D Celestial Sphere (Heliocentric Reference)', this.cx1, 20);
    ctx.fillText('Observer\'s Local Sky View (Alexandria)', cx2, 20);
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background space gradient
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    bgGrad.addColorStop(0, '#020208');
    bgGrad.addColorStop(0.5, '#050711');
    bgGrad.addColorStop(1, '#090c1e');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawSphere();

    this.animationId = requestAnimationFrame(this.animate);
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
