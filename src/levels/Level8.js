import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Level 8: Kepler's Laws
export class Level8 {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
 
    this.logContainer = document.createElement('div');
    this.logContainer.className = 'absolute inset-0 z-10 hidden bg-slate-950';
    this.container.appendChild(this.logContainer);

    // Dandelin Three.js container for Ellipse Properties
    this.dandelinContainer = document.createElement('div');
    this.dandelinContainer.className = 'absolute top-0 left-[400px] w-[calc(100%-400px)] h-full hidden z-10 pointer-events-auto bg-[#0b0c10]';
    this.container.appendChild(this.dandelinContainer);

    // Simulation state
    this.subtask = 'kepler1';
    this.kepler1Model = 'circle';
    this.isSimPlaying = true;
    this.time = 0;
    this.keplerAngle = 0;
    this.meanAnomaly = 0;

    // Orbit equations subtask state
    this.dandelinSpeed = 1.0;
    this.dandelinAngle = 0;
    this.orbitEq_e = 0.60;
    this.orbitEq_E = 45; // in degrees
    this.orbitEq_highlight = 'all'; // 'sector' | 'triangle' | 'swept' | 'ideal' | 'all'

    // Tycho Brahe observation points for Mars (e = 0.40)
    this.tychoPoints = [];
    const eMars = 0.40;
    for (let i = 0; i < 16; i++) {
      const E = (i * 2 * Math.PI) / 16;
      const tx = Math.cos(E);
      const ty = Math.sqrt(1 - eMars * eMars) * Math.sin(E);
      this.tychoPoints.push({
        x: tx + Math.cos(i * 2.3) * 0.015,
        y: ty + Math.sin(i * 2.3) * 0.015
      });
    }

    // Background stars
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random(), y: Math.random(),
        r: 0.5 + Math.random() * 0.8,
        brightness: 0.3 + Math.random() * 0.7
      });
    }

    this.initDandelinThree();

    this.resizeBound = this.resize.bind(this);
    window.addEventListener('resize', this.resizeBound);
    this.resize();

    this.animateBound = this.animate.bind(this);
    this.animationId = requestAnimationFrame(this.animateBound);
  }

  resize() {
    this.canvas.width = this.container.clientWidth || window.innerWidth;
    this.canvas.height = this.container.clientHeight || window.innerHeight;
    if (this.dandelinRenderer && this.dandelinCamera) {
      const w = (this.container.clientWidth || window.innerWidth) - 400;
      const h = this.container.clientHeight || window.innerHeight;
      this.dandelinCamera.aspect = Math.max(0.1, w / h);
      this.dandelinCamera.updateProjectionMatrix();
      this.dandelinRenderer.setSize(Math.max(1, w), Math.max(1, h));
    }
  }

  togglePlay() {
    this.isSimPlaying = !this.isSimPlaying;
  }

  resetSimulation() {
    this.time = 0;
    this.keplerAngle = 0;
    this.meanAnomaly = 0;
  }

  setSubtask(subtask) {
    this.subtask = subtask;
    this.resetSimulation();
    if (subtask === 'ellipse_properties') {
      this.canvas.style.display = 'none';
      this.logContainer.style.display = 'none';
      if (this.dandelinContainer) this.dandelinContainer.style.display = 'block';
      this.resize();
    } else if (subtask === 'logarithm') {
      this.canvas.style.display = 'none';
      if (this.dandelinContainer) this.dandelinContainer.style.display = 'none';
      this.logContainer.style.display = 'block';
      this.renderLogarithmUI();
    } else {
      this.canvas.style.display = 'block';
      if (this.dandelinContainer) this.dandelinContainer.style.display = 'none';
      this.logContainer.style.display = 'none';
    }
  }

  setKepler1Model(model) {
    this.kepler1Model = model;
  }

  // ── Utilities ─────────────────────────────────────────────
  rrect(ctx, x, y, w, h, r) {
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

  sunAt(ctx, x, y, r) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, r * 2.5);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, '#fbbf24');
    g.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  solveKepler(M, e) {
    let E = M;
    for (let i = 0; i < 8; i++) {
      E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }
    return E;
  }

  // ── Main Loop ─────────────────────────────────────────────
  animate() {
    this.animationId = requestAnimationFrame(this.animateBound);

    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    if (!W || !H) return;

    // Background
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#010108');
    bg.addColorStop(0.5, '#040412');
    bg.addColorStop(1, '#010108');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Stars
    this.stars.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.brightness * (0.7 + 0.3 * Math.sin(this.time * 0.02 + s.x * 10));
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Update physics
    if (this.isSimPlaying) {
      this.time += 1;
      this.keplerAngle += 0.015;
      this.meanAnomaly += 0.012;

      if (this.subtask === 'orbit_equations') {
        // Solve eccentric anomaly from mean anomaly
        const E_rad = this.solveKepler(this.meanAnomaly, this.orbitEq_e);
        this.orbitEq_E = (E_rad * 180 / Math.PI) % 360;
        if (this.orbitEq_E < 0) this.orbitEq_E += 360;

        // Synchronize DOM elements
        const sliderE = document.getElementById('slider-k8-E');
        const valE = document.getElementById('slider-k8-E-val');
        if (sliderE) sliderE.value = Math.round(this.orbitEq_E);
        if (valE) valE.textContent = Math.round(this.orbitEq_E) + '°';
      }
    }

    const TASK_W = 400;
    const IX = TASK_W;
    const IW = W - TASK_W;
    const IH = H;

    try {
      if      (this.subtask === 'kepler1')  this.drawKepler1(ctx, IX, IW, IH);
      else if (this.subtask === 'ellipse_properties') this.updateDandelinFrame();
      else if (this.subtask === 'kepler23') this.drawKepler23(ctx, IX, IW, IH);
      else if (this.subtask === 'orbit_equations') this.drawOrbitEquations(ctx, IX, IW, IH);
    } catch (e) {
      console.error('Level8 draw error:', e);
    }
  }

  // ── Tab 1 — Kepler's 1st Law ──────────────────────────────
  drawKepler1(ctx, IX, IW, IH) {
    const pt = 80, ph = IH - 160;
    const pw = IW * 0.94;
    const panelX = IX + IW * 0.03;
    const cx = panelX + pw / 2;
    const cy = pt + ph / 2;
    const R  = ph * 0.36;

    // Mathematical parameters (exaggerated for clarity)
    const e = 0.4;
    const c = R * e; // focus offset (32 scaled)
    const b = R * Math.sqrt(1 - e * e); // semi-minor axis

    // True Center is shifted left by c; Sun is fixed at cx
    const centerX = cx - c;

    ctx.fillStyle = 'rgba(15,23,42,0.7)';
    ctx.strokeStyle = 'rgba(56,189,248,0.25)';
    ctx.lineWidth = 1.5;
    this.rrect(ctx, panelX, pt, pw, ph, 14);
    ctx.fill(); ctx.stroke();

    // 1. Reference lines (Horizontal and Vertical dashed lines)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(cx - R - 50, cy);
    ctx.lineTo(cx + R + 30, cy);
    ctx.stroke();

    // Vertical line through True Center (centerX)
    ctx.beginPath();
    ctx.moveTo(centerX, cy - R - 30);
    ctx.lineTo(centerX, cy + R + 30);
    ctx.stroke();

    // Vertical line through Sun (cx)
    ctx.beginPath();
    ctx.moveTo(cx, cy - R - 30);
    ctx.lineTo(cx, cy + R + 30);
    ctx.stroke();
    ctx.restore();

    // True Center text label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '500 8.5px Outfit,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('True Center', centerX - 6, cy - 6);

    // 2. Tycho Brahe data points (lie perfectly on the true ellipse centered at centerX)
    this.tychoPoints.forEach(pt2 => {
      const dpx = centerX + pt2.x * R;
      const dpy = cy - pt2.y * R;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(dpx, dpy, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(245,158,11,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(dpx, dpy, 6.5, 0, Math.PI * 2); ctx.stroke();
    });

    // 3. Draw Sun at its fixed position (cx, cy)
    this.sunAt(ctx, cx, cy, 6.5);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9.5px Outfit,sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('Sun', cx + 10, cy - 10);

    // 4. Model paths and error gaps
    if (this.kepler1Model === 'circle') {
      // Copernican Circle centered exactly on the Sun (cx)
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.8;
      ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 10px Outfit,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Copernican Circle (centered on Sun)', cx, cy - R - 13);

    } else if (this.kepler1Model === 'offset') {
      // Off-Center Circle centered at True Center (centerX)
      ctx.strokeStyle = '#f87171'; ctx.lineWidth = 1.8;
      ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.arc(centerX, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      // Error gaps at top and bottom of the True Center vertical axis
      const topC = cy - R;
      const topE = cy - b;
      const botC = cy + R;
      const botE = cy + b;

      // Draw Top Gap
      ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(centerX, topC); ctx.lineTo(centerX, topE);
      // Ticks at ends
      ctx.moveTo(centerX - 3, topC); ctx.lineTo(centerX + 3, topC);
      ctx.moveTo(centerX - 3, topE); ctx.lineTo(centerX + 3, topE);
      ctx.stroke();

      // Draw Bottom Gap
      ctx.beginPath();
      ctx.moveTo(centerX, botC); ctx.lineTo(centerX, botE);
      // Ticks at ends
      ctx.moveTo(centerX - 3, botC); ctx.lineTo(centerX + 3, botC);
      ctx.moveTo(centerX - 3, botE); ctx.lineTo(centerX + 3, botE);
      ctx.stroke();

      // Gap Label text
      ctx.fillStyle = '#f87171'; ctx.font = 'bold 9px Outfit,sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('Error Gap', centerX + 8, (topC + topE) / 2);

      ctx.fillStyle = '#f87171'; ctx.font = 'bold 10px Outfit,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Off-Center Circle (centered at True Center)', centerX, cy - R - 13);

    } else { // ellipse
      // Kepler Ellipse centered at True Center (centerX)
      ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(centerX, cy, R, b, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#4ade80'; ctx.font = 'bold 10px Outfit,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText("Kepler's Ellipse (centered at True Center)", centerX, cy - b - 13);
    }

    // 5. Animated Mars
    let mpx, mpy;
    if (this.kepler1Model === 'circle') {
      mpx = cx + Math.cos(this.keplerAngle) * R;
      mpy = cy - Math.sin(this.keplerAngle) * R;
    } else if (this.kepler1Model === 'offset') {
      mpx = centerX + Math.cos(this.keplerAngle) * R;
      mpy = cy      - Math.sin(this.keplerAngle) * R;
    } else {
      const Ek = this.solveKepler(this.keplerAngle, e);
      mpx = centerX + Math.cos(Ek) * R;
      mpy = cy      - Math.sin(Ek) * b;
    }
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(mpx, mpy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Outfit,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Mars', mpx, mpy - 10);

    // Header
    ctx.fillStyle = '#fff'; ctx.font = '600 13px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText("Kepler's First Law: Elliptical Orbits", IX + IW / 2, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 10px Outfit,sans-serif';
    ctx.fillText("Tycho Brahe's Mars observations (orange dots) cannot fit any circle — only an ellipse matches perfectly.", IX + IW / 2, 61);
  }

  // ── Tab 2 — Kepler's 2nd & 3rd Laws ──────────────────────
  drawKepler23(ctx, IX, IW, IH) {
    const pt = 80, ph = IH - 160;
    const pw = IW * 0.44;
    const xL = IX + IW * 0.03;
    const xR = IX + IW * 0.52;
    const cy = pt + ph / 2;
    const cxL = xL + pw / 2;

    ctx.fillStyle = 'rgba(15,23,42,0.7)';
    ctx.strokeStyle = 'rgba(56,189,248,0.25)';
    ctx.lineWidth = 1.5;
    this.rrect(ctx, xL, pt, pw, ph, 14); ctx.fill(); ctx.stroke();
    this.rrect(ctx, xR, pt, pw, ph, 14); ctx.fill(); ctx.stroke();

    // ─ LEFT: 2nd Law (Equal Area Sweep) ─
    ctx.save();
    ctx.beginPath(); this.rrect(ctx, xL, pt, pw, ph, 14); ctx.clip();

    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 11px Outfit,sans-serif'; ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText("Kepler's 2nd Law: Equal Areas in Equal Times", xL + 12, pt + 23);

    const a2 = pw * 0.31, eS = 0.68, b2 = a2 * Math.sqrt(1 - eS * eS);
    const fX = cxL - a2 * eS; // ellipse center; Sun at right focus cxL

    // Orbital path
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(fX, cy, a2, b2, 0, 0, Math.PI * 2); ctx.stroke();

    // Static equal-area wedges
    for (let k = 0; k < 8; k++) {
      const Mc = (k * 2 * Math.PI) / 8;
      const Ms = Mc - 0.18, Me = Mc + 0.18;
      ctx.fillStyle = 'rgba(56,189,248,0.13)';
      ctx.strokeStyle = 'rgba(56,189,248,0.28)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(cxL, cy);
      for (let s = 0; s <= 12; s++) {
        const Mc2 = Ms + (Me - Ms) * (s / 12);
        const Ec2 = this.solveKepler(Mc2, eS);
        ctx.lineTo(fX + a2 * Math.cos(Ec2), cy - b2 * Math.sin(Ec2));
      }
      ctx.lineTo(cxL, cy); ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // Active sweeping wedge (bright)
    const aMs = this.meanAnomaly - 0.28;
    ctx.fillStyle = 'rgba(56,189,248,0.42)';
    ctx.beginPath(); ctx.moveTo(cxL, cy);
    for (let s = 0; s <= 14; s++) {
      const Mc3 = aMs + (this.meanAnomaly - aMs) * (s / 14);
      const Ec3 = this.solveKepler(Mc3, eS);
      ctx.lineTo(fX + a2 * Math.cos(Ec3), cy - b2 * Math.sin(Ec3));
    }
    ctx.lineTo(cxL, cy); ctx.closePath(); ctx.fill();

    // Radius vector (Sun → planet)
    const Eact = this.solveKepler(this.meanAnomaly, eS);
    const aX = fX + a2 * Math.cos(Eact);
    const aY = cy - b2 * Math.sin(Eact);
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cxL, cy); ctx.lineTo(aX, aY); ctx.stroke();

    // Draw velocity vector arrow to clearly demonstrate non-constant speed
    const dE_dt = 1 / (1 - eS * Math.cos(Eact));
    const vx = -a2 * Math.sin(Eact) * dE_dt;
    const vy = -b2 * Math.cos(Eact) * dE_dt;

    // Scale velocity arrow length visually
    const arrowX = aX + vx * 0.15;
    const arrowY = aY + vy * 0.15;

    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(aX, aY); ctx.lineTo(arrowX, arrowY); ctx.stroke();
    // Arrowhead
    const arrowAngle = Math.atan2(arrowY - aY, arrowX - aX);
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - 7 * Math.cos(arrowAngle - Math.PI/6), arrowY - 7 * Math.sin(arrowAngle - Math.PI/6));
    ctx.lineTo(arrowX - 7 * Math.cos(arrowAngle + Math.PI/6), arrowY - 7 * Math.sin(arrowAngle + Math.PI/6));
    ctx.closePath(); ctx.fill();

    // Sun at left focus
    this.sunAt(ctx, cxL, cy, 4.5);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8.5px Outfit,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Sun', cxL, cy - 13);

    // Planet
    ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(aX, aY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.stroke();

    // Annotations
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = 'bold 9px Outfit,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Fastest (Perihelion)', cxL + a2 * 0.5, cy - 10);
    ctx.fillText('Slowest (Aphelion)', cxL - a2 * 1.6, cy - 10);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '500 8px Outfit,sans-serif';
    ctx.fillText('All shaded wedges sweep equal area', xL + pw / 2, pt + ph - 16);
    ctx.restore();

    // ─ RIGHT: 3rd Law (T² vs a³ log-log plot) ─
    ctx.save();
    ctx.beginPath(); this.rrect(ctx, xR, pt, pw, ph, 14); ctx.clip();

    ctx.fillStyle = '#c084fc'; ctx.font = 'bold 11px Outfit,sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText("Kepler's 3rd Law: T² = a³ (Harmonic Law)", xR + 12, pt + 23);

    // Shift plot upwards and reduce height to clear the bottom UI panel completely
    const pX = xR + 50, pY = pt + 32;
    const pW = pw - 70, pH = ph - 128;
    const minL = -2.0, maxL = 3.0;

    const coord = (a3, t2) => ({
      x: pX + ((Math.log10(Math.max(a3, 1e-5)) - minL) / (maxL - minL)) * pW,
      y: (pY + pH) - ((Math.log10(Math.max(t2, 1e-5)) - minL) / (maxL - minL)) * pH
    });

    // Grid lines and tick labels (larger font size for readability)
    [0.01, 0.1, 1, 10, 100, 1000].forEach(v => {
      const lv = Math.log10(v);
      const gx = pX + ((lv - minL) / (maxL - minL)) * pW;
      const gy = (pY + pH) - ((lv - minL) / (maxL - minL)) * pH;
      const lbl = String(v);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx, pY); ctx.lineTo(gx, pY + pH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pX, gy); ctx.lineTo(pX + pW, gy); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '600 8.5px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(lbl, gx, pY + pH + 4);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(lbl, pX - 4, gy);
    });

    // Axes border
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.2;
    ctx.strokeRect(pX, pY, pW, pH);

    // T² = a³ diagonal line
    const d0 = coord(0.01, 0.01), d1 = coord(1000, 1000);
    ctx.strokeStyle = 'rgba(167,139,250,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(d0.x, d0.y); ctx.lineTo(d1.x, d1.y); ctx.stroke();
    ctx.fillStyle = 'rgba(167,139,250,0.6)'; ctx.font = 'italic 10px Outfit,sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('T² = a³', d0.x + 12, d0.y - 8);

    // Axis labels (larger font size)
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = 'bold 10px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Distance Cubed: a³ (AU³)', pX + pW / 2, pY + pH + 17);
    ctx.save();
    ctx.translate(pX - 32, pY + pH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle';
    ctx.fillText('Period Squared: T² (yr²)', 0, 0);
    ctx.restore();

    // Planet data points
    const pdata = [
      { name: 'Mercury', a: 0.387, T: 0.241, col: '#9ca3af' },
      { name: 'Venus',   a: 0.723, T: 0.615, col: '#10b981' },
      { name: 'Earth',   a: 1.000, T: 1.000, col: '#3b82f6' },
      { name: 'Mars',    a: 1.524, T: 1.881, col: '#f59e0b' },
      { name: 'Jupiter', a: 5.204, T: 11.86, col: '#ef4444' },
      { name: 'Saturn',  a: 9.582, T: 29.46, col: '#a78bfa' }
    ];
    pdata.forEach(p => {
      const c = coord(p.a ** 3, p.T ** 2);
      ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9.5px Outfit,sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(' ' + p.name, c.x + 5, c.y);
    });
    ctx.restore();

    // Header
    ctx.fillStyle = '#fff'; ctx.font = '600 13px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText("Kepler's 2nd & 3rd Laws Visualizer", IX + IW / 2, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 10px Outfit,sans-serif';
    ctx.fillText('2nd Law: Equal area swept in equal time  |  3rd Law: T² ∝ a³ — all planets fall on one straight line', IX + IW / 2, 61);
  }

  renderLogarithmUI() {
    if (this.subtask !== 'logarithm') return;

    if (this.moonX === undefined) this.moonX = 180;
    if (this.showLogs === undefined) this.showLogs = false;

    const sunX = 20;
    const sunR = 40;
    const moonR = 10;
    const earthX = 320;
    const earthR = 15;

    const dx = this.moonX - sunX;
    const dy = sunR - moonR;
    const slope = dy / dx;
    const shadowLength = moonR / slope;
    const apexX = this.moonX + shadowLength;

    const distanceSunMoonReal = Math.floor((this.moonX / 200) * 152000);
    const moonRadiusReal = 1737;
    const sunRadiusReal = 696000;

    const numerator = distanceSunMoonReal * moonRadiusReal;
    const denominator = sunRadiusReal - moonRadiusReal;
    const trueLength = Math.floor(numerator / denominator);

    const isTotalEclipse = apexX >= earthX - earthR;

    if (!this.logUIInitialized) {
      this.logContainer.innerHTML = `
        <div class="flex flex-col lg:flex-row h-full w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
          <!-- Spacer to clear left task panel -->
          <div class="hidden lg:block lg:w-[420px] shrink-0 pointer-events-none"></div>
          <!-- Left Panel: Math Explanation & Slider -->
          <div class="w-full lg:w-[380px] bg-slate-900 border-r border-slate-800 p-4 flex flex-col z-20 overflow-y-auto shrink-0">
            <h2 class="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M3 3h18v18H3zM21 3L3 21"/></svg>
              The Shadow Cone Geometry
            </h2>
            <p class="text-[10.5px] text-slate-400 mb-4">
              How similar triangles forced Kepler to multiply massive numbers to find the length of the eclipse shadow.
            </p>

            <div class="flex flex-col gap-3">
              <!-- Formula Breakdown -->
              <div class="bg-slate-850/50 p-3 rounded-xl border border-slate-800/80">
                <h3 class="text-[11px] font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                  The Geometry of Shadows
                </h3>
                <p class="text-[10px] text-slate-300 mb-2 leading-relaxed">
                  To find the length of the dark shadow cone (L), Kepler used the law similar triangles. The ratio of the Moon's radius to its shadow is the same as the Sun's radius to the total distance.
                </p>
 
                <div class="bg-slate-950/50 p-2 rounded border border-slate-900 text-center font-mono text-[10.5px]">
                  <div class="flex items-center justify-center gap-3">
                    <div class="flex flex-col items-center">
                      <span class="border-b border-slate-600 pb-0.5 px-1.5 text-yellow-400">R_sun</span>
                      <span class="pt-0.5 px-1.5 text-[9.5px]">Dist + <span class="text-blue-400">L</span></span>
                    </div>
                    <span>=</span>
                    <div class="flex flex-col items-center">
                      <span class="border-b border-slate-600 pb-0.5 px-1.5 text-slate-300">R_moon</span>
                      <span class="pt-0.5 px-1.5 text-blue-400">L</span>
                    </div>
                  </div>
                </div>
 
                <p class="text-[10px] text-slate-300 mt-2.5 mb-1.5">When using algebra to solve for L, the final equation becomes:</p>
 
                <div class="bg-slate-950/50 p-2 rounded border border-slate-900 text-center font-mono text-[10.5px]">
                  <div class="flex items-center justify-center gap-2">
                    <span class="text-blue-400 font-bold">L</span>
                    <span>=</span>
                    <div class="flex flex-col items-center">
                      <span class="border-b border-slate-600 pb-0.5 px-1.5 text-red-400 font-bold bg-red-950/20 rounded">Dist × R_moon</span>
                      <span class="pt-0.5 px-1.5 text-slate-400 text-[9px]">R_sun - R_moon</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Logarithmic Simplification Explanation -->
              <div class="bg-slate-850/50 p-3 rounded-xl border border-slate-800/80">
                <h3 class="text-[11px] font-bold text-blue-400 mb-1.5 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 7h6m-6 4h6m-6 4h6M3 5h18v14H3z"/></svg>
                  Logarithmic approach to calculate L
                </h3>
                <p class="text-[10px] text-slate-300 mb-2 leading-relaxed">
                  By taking logs on both sides, we convert the multiplication in the numerator into addition, and the division into subtraction:
                </p>
                <div class="bg-slate-950/50 p-2 rounded border border-slate-900 font-mono text-[9px] space-y-1">
                  <div>log(L) = log(Dist × R_moon) - log(R_sun - R_moon)</div>
                  <div class="text-blue-400">log(L) = [log(Dist) + log(R_moon)] - log(R_sun - R_moon)</div>
                  <div class="text-emerald-400 font-bold">L = 10<sup>log(L)</sup> (Antilog lookup)</div>
                </div>
              </div>
 
              <!-- Interactive Calculator Box -->
              <div class="bg-slate-850/50 p-3 rounded-xl border border-slate-800/80">
                <!-- Mode Toggle -->
                <div class="flex bg-slate-950 rounded-lg p-0.5 mb-3.5 border border-slate-800">
                  <button id="btn-std-math" class="flex-1 text-[10.5px] py-1.5 rounded-md font-medium transition-colors">
                    Standard Math
                  </button>
                  <button id="btn-log-math" class="flex-1 text-[10.5px] py-1.5 rounded-md font-medium transition-colors">
                    Use Logarithms
                  </button>
                </div>

                <!-- Calculation Panel -->
                <div id="log-calc-panel" class="bg-slate-950 p-3 rounded-lg font-mono text-[11px] border border-slate-900 min-h-[140px] flex flex-col justify-center"></div>
              </div>
            </div>
          </div>

          <!-- Right Panel: SVG Canvas -->
          <div class="flex-grow relative bg-black flex flex-col h-full overflow-hidden">
            <div class="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800/80 backdrop-blur text-xs font-semibold">
              <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              Space Geometry View
            </div>
 
            <!-- Floating slider box in the top-right of illustration area -->
            <div class="absolute top-4 right-4 z-20 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl shadow-xl w-[260px] backdrop-blur-md">
              <h4 class="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>
                Calculate Shadow Length
              </h4>
              <div class="flex justify-between text-[10px] text-slate-400 mb-1.5">
                <span>Move Moon Closer/Further</span>
                <span id="log-dist-val" class="text-emerald-400 font-bold"></span>
              </div>
              <input type="range" id="moon-x-slider" min="100" max="260" value="${this.moonX}" 
                class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500">
            </div>

            <div class="flex-grow w-full h-full relative flex items-center justify-center p-6">
              <!-- Background Grid -->
              <div class="absolute inset-0 opacity-15 pointer-events-none" style="background-image: linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px); background-size: 30px 30px;"></div>

              <svg viewBox="0 -100 400 200" class="w-full max-h-[85%] z-10 overflow-visible">
                <defs>
                  <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#fef08a" />
                    <stop offset="70%" stop-color="#eab308" />
                    <stop offset="100%" stop-color="#ca8a04" stop-opacity="0" />
                  </radialGradient>
                </defs>

                <!-- Construction Lines -->
                <line id="svg-const-line1" x1="${sunX}" y1="${-sunR}" x2="${apexX}" y2="0" stroke="#f87171" stroke-width="0.8" stroke-dasharray="3,3" class="opacity-50" />
                <line id="svg-const-line2" x1="${sunX}" y1="${sunR}" x2="${apexX}" y2="0" stroke="#f87171" stroke-width="0.8" stroke-dasharray="3,3" class="opacity-50" />
                <line x1="-30" y1="0" x2="430" y2="0" stroke="#475569" stroke-width="0.5" stroke-dasharray="2,2" />

                <!-- Penumbra (light outer shadow) -->
                <polygon id="svg-penumbra" points="" fill="rgba(255,255,255,0.04)" />
                
                <!-- Umbra (dark shadow cone) -->
                <polygon id="svg-umbra" points="" fill="rgba(0,0,0,0.85)" stroke="#475569" stroke-width="0.5" />

                <!-- Sun -->
                <circle cx="${sunX}" cy="0" r="${sunR}" fill="url(#sunGlow)" />
                <line x1="${sunX}" y1="0" x2="${sunX}" y2="${-sunR}" stroke="#fef08a" stroke-width="1.2" />
                <text x="${sunX + 5}" y="${-sunR / 2}" fill="#fef08a" font-size="9" font-family="Outfit" font-weight="bold">R_sun</text>

                <!-- Earth -->
                <g transform="translate(${earthX}, 0)">
                  <circle cx="0" cy="0" r="${earthR}" fill="#1e3a8a" />
                  <path d="M 0 -${earthR} A ${earthR} ${earthR} 0 0 1 0 ${earthR} A ${earthR / 2} ${earthR} 0 0 0 0 -${earthR}" fill="#0f172a" class="opacity-75" />
                  <text x="0" y="24" fill="#94a3b8" font-size="9" font-family="Outfit" text-anchor="middle">Earth</text>
                  <circle id="svg-earth-dot" cx="-${earthR}" cy="0" r="2.5" fill="#ef4444" class="animate-pulse" />
                </g>

                <!-- Moon -->
                <g id="svg-moon-grp">
                  <circle cx="0" cy="0" r="${moonR}" fill="#94a3b8" />
                  <path d="M 0 -${moonR} A ${moonR} ${moonR} 0 0 1 0 ${moonR} A ${moonR / 2} ${moonR} 0 0 0 0 -${moonR}" fill="#334155" />
                  <line x1="0" y1="0" x2="0" y2="${-moonR}" stroke="#cbd5e1" stroke-width="1.2" />
                  <text x="5" y="${-moonR / 2}" fill="#cbd5e1" font-size="7.5" font-family="Outfit" font-weight="bold">R_moon</text>
                </g>

                <!-- Dimensions -->
                <g font-size="8.5" font-family="Outfit" fill="#10b981" font-weight="500">
                  <line id="svg-dim-dist-line" x1="${sunX}" y1="55" x2="${this.moonX}" y2="55" stroke="#10b981" stroke-width="0.8" />
                  <line x1="${sunX}" y1="52" x2="${sunX}" y2="58" stroke="#10b981" stroke-width="0.8" />
                  <line id="svg-dim-dist-tick2" x1="${this.moonX}" y1="52" x2="${this.moonX}" y2="58" stroke="#10b981" stroke-width="0.8" />
                  <text id="svg-dim-dist-text" x="${sunX + (this.moonX - sunX) / 2}" y="67" text-anchor="middle">Dist (D)</text>
                </g>

                <g font-size="8.5" font-family="Outfit" fill="#3b82f6" font-weight="500">
                  <line id="svg-dim-len-line" x1="${this.moonX}" y1="38" x2="${apexX}" y2="38" stroke="#3b82f6" stroke-width="0.8" />
                  <line id="svg-dim-len-tick1" x1="${this.moonX}" y1="35" x2="${this.moonX}" y2="41" stroke="#3b82f6" stroke-width="0.8" />
                  <line id="svg-dim-len-tick2" x1="${apexX}" y1="35" x2="${apexX}" y2="41" stroke="#3b82f6" stroke-width="0.8" />
                  <text id="svg-dim-len-text" x="${this.moonX + (apexX - this.moonX) / 2}" y="50" text-anchor="middle">Length (L)</text>
                </g>
              </svg>
            </div>

            <!-- Dynamic Status Bar -->
            <div id="log-status-bar" class="absolute bottom-4 right-4 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-2xl max-w-[240px] transition-colors"></div>
          </div>
        </div>
      `;

      const slider = this.logContainer.querySelector('#moon-x-slider');
      slider.addEventListener('input', (e) => {
        this.moonX = parseInt(e.target.value);
        this.renderLogarithmUI();
      });

      const btnStd = this.logContainer.querySelector('#btn-std-math');
      const btnLog = this.logContainer.querySelector('#btn-log-math');

      btnStd.addEventListener('click', () => {
        this.showLogs = false;
        this.renderLogarithmUI();
      });

      btnLog.addEventListener('click', () => {
        this.showLogs = true;
        this.renderLogarithmUI();
      });

      this.logUIInitialized = true;
    }

    // Dynamic Updates
    this.logContainer.querySelector('#moon-x-slider').value = this.moonX;
    this.logContainer.querySelector('#log-dist-val').textContent = `${distanceSunMoonReal.toLocaleString()} miles`;
    
    const btnStd = this.logContainer.querySelector('#btn-std-math');
    const btnLog = this.logContainer.querySelector('#btn-log-math');

    if (this.showLogs) {
      btnLog.className = 'flex-1 text-[10.5px] py-1.5 rounded-md font-medium transition-colors bg-blue-600 text-white font-bold';
      btnStd.className = 'flex-1 text-[10.5px] py-1.5 rounded-md font-medium transition-colors text-slate-400 hover:text-white';
    } else {
      btnStd.className = 'flex-1 text-[10.5px] py-1.5 rounded-md font-medium transition-colors bg-slate-800 text-white font-bold';
      btnLog.className = 'flex-1 text-[10.5px] py-1.5 rounded-md font-medium transition-colors text-slate-400 hover:text-white';
    }
 
    // Update Calc panel contents
    const calcPanel = this.logContainer.querySelector('#log-calc-panel');
    if (!this.showLogs) {
      calcPanel.innerHTML = `
        <div class="space-y-2.5">
          <div class="text-slate-500 text-[9px] uppercase tracking-wider font-bold">Numerator Calculation</div>
          <div class="flex flex-col text-right w-full border-b border-slate-800 pb-1.5">
            <span class="text-yellow-400">${distanceSunMoonReal.toLocaleString()}</span>
            <span class="text-slate-300">× ${moonRadiusReal.toLocaleString()}</span>
          </div>
          <div class="text-right text-red-400 font-bold">
            = ${numerator.toLocaleString()}
          </div>
          <div class="text-slate-500 text-[9px] uppercase tracking-wider font-bold mt-2">Division (divided by 694,263)</div>
          <div class="text-right text-emerald-400 font-bold text-xs">
            = ${trueLength.toLocaleString()} miles
          </div>
        </div>
      `;
    } else {
      calcPanel.innerHTML = `
        <div class="space-y-2.5">
          <div class="text-slate-500 text-[9px] uppercase tracking-wider font-bold">Logarithmic Addition</div>
          <div class="flex flex-col text-right w-full border-b border-slate-800 pb-1.5 text-[10px]">
            <span class="text-yellow-400">log(${distanceSunMoonReal}) → ${Math.log10(distanceSunMoonReal).toFixed(5)}</span>
            <span class="text-slate-300">+ log(${moonRadiusReal}) → ${Math.log10(moonRadiusReal).toFixed(5)}</span>
          </div>
          <div class="text-right text-blue-400 font-bold">
            = ${Math.log10(numerator).toFixed(5)}
          </div>
          <div class="text-slate-500 text-[9px] uppercase tracking-wider font-bold mt-2">Subtract log(denominator) &amp; reverse</div>
          <div class="text-right text-emerald-400 font-bold text-xs">
            = ${trueLength.toLocaleString()} miles
          </div>
        </div>
      `;
    }
 
    // Update SVG elements
    this.logContainer.querySelector('#svg-const-line1').setAttribute('x2', apexX);
    this.logContainer.querySelector('#svg-const-line2').setAttribute('x2', apexX);
    this.logContainer.querySelector('#svg-penumbra').setAttribute('points', `${this.moonX},-10 ${this.moonX},10 400,${10 + (400 - this.moonX) * 0.18} 400,${-10 - (400 - this.moonX) * 0.18}`);
    this.logContainer.querySelector('#svg-umbra').setAttribute('points', `${this.moonX},-10 ${this.moonX},10 ${apexX},0`);
    this.logContainer.querySelector('#svg-moon-grp').setAttribute('transform', `translate(${this.moonX}, 0)`);
    
    const earthDot = this.logContainer.querySelector('#svg-earth-dot');
    if (isTotalEclipse) {
      earthDot.classList.remove('hidden');
    } else {
      earthDot.classList.add('hidden');
    }
 
    this.logContainer.querySelector('#svg-dim-dist-line').setAttribute('x2', this.moonX);
    this.logContainer.querySelector('#svg-dim-dist-tick2').setAttribute('x1', this.moonX);
    this.logContainer.querySelector('#svg-dim-dist-tick2').setAttribute('x2', this.moonX);
    this.logContainer.querySelector('#svg-dim-dist-text').setAttribute('x', sunX + (this.moonX - sunX) / 2);
 
    this.logContainer.querySelector('#svg-dim-len-line').setAttribute('x1', this.moonX);
    this.logContainer.querySelector('#svg-dim-len-line').setAttribute('x2', apexX);
    this.logContainer.querySelector('#svg-dim-len-tick1').setAttribute('x1', this.moonX);
    this.logContainer.querySelector('#svg-dim-len-tick1').setAttribute('x2', this.moonX);
    this.logContainer.querySelector('#svg-dim-len-tick2').setAttribute('x1', apexX);
    this.logContainer.querySelector('#svg-dim-len-tick2').setAttribute('x2', apexX);
    this.logContainer.querySelector('#svg-dim-len-text').setAttribute('x', this.moonX + (apexX - this.moonX) / 2);
 
    // Update dynamic status bar
    const statusBar = this.logContainer.querySelector('#log-status-bar');
    if (isTotalEclipse) {
      statusBar.className = 'absolute bottom-4 right-4 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-2xl max-w-[240px] transition-colors bg-red-950/80 border-red-900/50 text-red-200';
      statusBar.innerHTML = `
        <h4 class="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Eclipse Status
        </h4>
        <p class="text-[10px] leading-relaxed opacity-90">
          The Umbra touches Earth! A Total Solar Eclipse is occurring.
        </p>
      `;
    } else {
      statusBar.className = 'absolute bottom-4 right-4 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-2xl max-w-[240px] transition-colors bg-slate-900/80 border-slate-700/50 text-slate-200';
      statusBar.innerHTML = `
        <h4 class="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Eclipse Status
        </h4>
        <p class="text-[10px] leading-relaxed opacity-90">
          The Umbra falls short. Observers on Earth see an Annular Eclipse (Ring of Fire).
        </p>
      `;
    }
  }

  drawOrbitEquations(ctx, IX, IW, IH) {
    const pt = 80, ph = IH - 160;
    const pw = IW * 0.94;
    const panelX = IX + IW * 0.03;
    const cx = panelX + pw / 2;
    const cy = pt + ph / 2;
    const R  = ph * 0.36;

    const e = this.orbitEq_e;
    const E_rad = this.orbitEq_E * Math.PI / 180;
    const b = R * Math.sqrt(1 - e * e);
    const focalDist = R * e;
    const highlight = this.orbitEq_highlight;

    // Card background
    ctx.fillStyle = 'rgba(15,23,42,0.7)';
    ctx.strokeStyle = 'rgba(139,92,246,0.25)';
    ctx.lineWidth = 1.5;
    this.rrect(ctx, panelX, pt, pw, ph, 14);
    ctx.fill(); ctx.stroke();

    // Key points
    const qX = cx + R * Math.cos(E_rad);
    const qY = cy - R * Math.sin(E_rad);
    const pX = cx + R * Math.cos(E_rad);
    const pY = cy - b * Math.sin(E_rad);
    const sunX = cx + focalDist;
    const sunY = cy;
    const M_rad = E_rad - e * Math.sin(E_rad);
    const M_deg = M_rad * 180 / Math.PI;
    const mX = cx + R * Math.cos(M_rad);
    const mY = cy - R * Math.sin(M_rad);
    const periapsisX = cx + R;
    const periapsisY = cy;

    // ── Area Highlights (behind everything) ──
    const drawSector = (fc, sc, sa, ea, rad, lw) => {
      ctx.save(); ctx.fillStyle = fc; ctx.strokeStyle = sc; ctx.lineWidth = lw || 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, rad, 0, -ea, true); ctx.lineTo(cx, cy); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.restore();
    };
    if (highlight === 'all' || highlight === 'sector')
      drawSector('rgba(167,139,250,0.30)', 'rgba(167,139,250,0.8)', 0, E_rad, R, 2);
    if (highlight === 'all' || highlight === 'triangle') {
      ctx.save(); ctx.fillStyle = 'rgba(251,191,36,0.40)'; ctx.strokeStyle = 'rgba(251,191,36,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(sunX, sunY); ctx.lineTo(qX, qY); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.restore();
    }
    if (highlight === 'all' || highlight === 'swept') {
      ctx.save(); ctx.fillStyle = 'rgba(56,189,248,0.30)'; ctx.strokeStyle = 'rgba(56,189,248,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sunX, sunY);
      ctx.arc(cx, cy, R, 0, -E_rad, true); ctx.lineTo(sunX, sunY); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgba(56,189,248,0.5)'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]); ctx.beginPath();
      ctx.moveTo(sunX, sunY); ctx.lineTo(periapsisX, periapsisY); ctx.stroke(); ctx.restore();
    }
    if (highlight === 'all' || highlight === 'ideal')
      drawSector('rgba(16,185,129,0.25)', 'rgba(16,185,129,0.7)', 0, M_rad, R, 2);

    // Grid axes
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(cx - R - 50, cy); ctx.lineTo(cx + R + 50, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - R - 30); ctx.lineTo(cx, cy + R + 30); ctx.stroke();
    ctx.restore();

    // Reference circle (dashed)
    ctx.save(); ctx.strokeStyle = 'rgba(148,163,184,0.35)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();

    // Orbit ellipse
    ctx.save(); ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.ellipse(cx, cy, R, b, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();

    // Q→axis drop
    ctx.save(); ctx.strokeStyle = 'rgba(203,213,225,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(qX, qY); ctx.lineTo(qX, cy); ctx.stroke(); ctx.restore();

    // Q→P lunula hint
    ctx.save(); ctx.strokeStyle = 'rgba(239,68,68,0.2)'; ctx.lineWidth = 0.8; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(qX, qY); ctx.lineTo(pX, pY); ctx.stroke(); ctx.restore();

    // C→Q line
    ctx.strokeStyle = 'rgba(167,139,250,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(qX, qY); ctx.stroke();

    // S→P (r)
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(sunX, sunY); ctx.lineTo(pX, pY); ctx.stroke();

    // Right triangle S–M–P
    if (highlight === 'distance_derivation') {
      ctx.save();
      ctx.fillStyle = 'rgba(249,115,22,0.22)'; // warm transluscent orange
      ctx.strokeStyle = '#f97316'; // solid orange
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(pX, sunY);
      ctx.lineTo(pX, pY);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
      
      // Draw right angle indicator
      const dx = Math.sign(sunX - pX) || 1;
      const dy = Math.sign(pY - sunY) || 1;
      ctx.save();
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const sqSize = 8;
      ctx.moveTo(pX + dx * sqSize, sunY);
      ctx.lineTo(pX + dx * sqSize, sunY + dy * sqSize);
      ctx.lineTo(pX, sunY + dy * sqSize);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save(); ctx.strokeStyle = 'rgba(56,189,248,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(sunX, sunY); ctx.lineTo(pX, sunY); ctx.lineTo(pX, pY); ctx.stroke(); ctx.restore();
      ctx.fillStyle = 'rgba(56,189,248,0.4)';
      ctx.beginPath(); ctx.rect(pX - 3, sunY - 3, 3, 3); ctx.fill();
    }

    // E angle arc
    drawSector('rgba(167,139,250,0.12)', '#a78bfa', 0, E_rad, 32, 1.2);

    // M radius line
    ctx.save(); ctx.strokeStyle = 'rgba(16,185,129,0.5)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mX, mY); ctx.stroke(); ctx.restore();

    // M angle arc
    drawSector('rgba(16,185,129,0.1)', '#10b981', 0, M_rad, 20, 1.2);
    // Points
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a78bfa'; ctx.beginPath(); ctx.arc(qX, qY, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    ctx.save(); ctx.shadowColor = 'rgba(56,189,248,0.8)'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(pX, pY, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    this.sunAt(ctx, sunX, sunY, 6.5);
    ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(mX, mY, 3.5, 0, Math.PI * 2); ctx.fill();

    // Helper to draw a dashed bezier leader curve and a large caption label out to the side
    const drawLeader = (label, startX, startY, endX, endY, color, textColor) => {
      ctx.save();
      // Draw leader line (dashed bezier curve)
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      const cpX = (startX + endX) / 2;
      ctx.bezierCurveTo(cpX, startY, cpX, endY, endX, endY);
      ctx.stroke();

      // Draw starting point dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(startX, startY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw underline under the label
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX + 15, endY);
      ctx.stroke();

      // Draw larger text
      ctx.fillStyle = textColor;
      ctx.font = 'bold italic 13px Georgia,serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, endX + 20, endY);
      ctx.restore();
    };

    // Labels
    ctx.fillStyle = '#f8fafc'; ctx.font = '500 13px Outfit,sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillText('C', cx - 8, cy + 12);
    ctx.textAlign = 'center'; ctx.fillText('Sun (S)', sunX, cy + 24);
    ctx.textAlign = qX >= cx ? 'left' : 'right'; ctx.fillText('Q', qX + (qX >= cx ? 8 : -8), qY - 2);
    ctx.textAlign = pX >= cx ? 'left' : 'right'; ctx.fillText('P', pX + (pX >= cx ? 8 : -8), pY + 14);
    
    const rLabelX = (sunX + pX) / 2, rLabelY = (sunY + pY) / 2;
    ctx.fillStyle = '#fcd34d'; ctx.font = 'italic bold 15px Georgia,serif'; ctx.fillText('r', rLabelX + 8, rLabelY - 4);
    
    ctx.fillStyle = '#c084fc'; ctx.font = 'italic 14px Georgia,serif';
    ctx.fillText('E', cx + 42 * Math.cos(E_rad / 2), cy - 42 * Math.sin(E_rad / 2));
    
    ctx.fillStyle = '#34d399'; ctx.font = 'italic 14px Georgia,serif';
    ctx.fillText('M', cx + 26 * Math.cos(M_rad / 2), cy - 26 * Math.sin(M_rad / 2));
    
    ctx.fillStyle = '#34d399'; ctx.font = '500 12px Outfit,sans-serif';
    ctx.textAlign = mX >= cx ? 'left' : 'right'; ctx.fillText('M', mX + (mX >= cx ? 6 : -6), mY - 4);
    
    ctx.fillStyle = '#94a3b8'; ctx.font = 'italic 12px Georgia,serif';
    ctx.fillText('ae', cx + focalDist / 2, cy - 6);
    
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '500 11px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('periapsis', periapsisX, cy + 16);

    // Area labels out to the side
    if (highlight === 'distance_derivation') {
      const baseMidX = (sunX + pX) / 2, baseMidY = sunY;
      const heightMidX = pX, heightMidY = (pY + sunY) / 2;
      const hypMidX = (sunX + pX) / 2, hypMidY = (pY + sunY) / 2;
      drawLeader('Base SM = a·cos E − ae', baseMidX, baseMidY, cx + R + 45, cy - 35, 'rgba(203,213,225,0.8)', '#cbd5e1');
      drawLeader('Height MP = b·sin E', heightMidX, heightMidY, cx + R + 45, cy + 5, 'rgba(56,189,248,0.8)', '#38bdf8');
      drawLeader('Hypotenuse r = a(1 − e·cos E)', hypMidX, hypMidY, cx + R + 45, cy + 45, 'rgba(251,191,36,0.8)', '#fbbf24');
    } else {
      if (highlight === 'all' || highlight === 'sector') {
        const sX = cx + R * 0.5 * Math.cos(E_rad / 2);
        const sY = cy - R * 0.5 * Math.sin(E_rad / 2);
        drawLeader('Sector Area = ½a²E', sX, sY, cx + R + 45, cy - 65, 'rgba(167,139,250,0.8)', '#c084fc');
      }
      if (highlight === 'all' || highlight === 'triangle') {
        const tx = (cx + sunX + qX) / 3, ty = (cy + sunY + qY) / 3;
        drawLeader('Triangle Area = ½a²e·sin E', tx, ty, cx + R + 45, cy - 25, 'rgba(251,191,36,0.8)', '#fbbf24');
      }
      if (highlight === 'all' || highlight === 'swept') {
        const sx = (pX + sunX) / 2, sy = (pY + sunY) / 2;
        drawLeader('Swept Area = ½a²M', sx, sy, cx + R + 45, cy + 15, 'rgba(56,189,248,0.8)', '#38bdf8');
      }
      if (highlight === 'all' || highlight === 'ideal') {
        const ix = cx + R * 0.45 * Math.cos(M_rad / 2);
        const iy = cy - R * 0.45 * Math.sin(M_rad / 2);
        drawLeader('Ideal Sector = ½a²M', ix, iy, cx + R + 45, cy + 55, 'rgba(16,185,129,0.8)', '#34d399');
      }
    }

    // Live math panel
    const sectorArea = 0.5 * E_rad;
    const triangleArea = 0.5 * e * Math.sin(E_rad);
    const sweptArea = sectorArea - triangleArea;
    const r_val = 1.0 * (1 - e * Math.cos(E_rad));
    const mathBoxW = 200, mathBoxH = highlight === 'all' ? 140 : 100;
    ctx.fillStyle = 'rgba(15,23,42,0.88)'; ctx.strokeStyle = 'rgba(139,92,246,0.3)'; ctx.lineWidth = 1;
    this.rrect(ctx, panelX + 16, pt + 16, mathBoxW, mathBoxH, 8); ctx.fill(); ctx.stroke();
    
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 10px Outfit,sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('LIVE CALCULATION', panelX + 24, pt + 30);
    
    ctx.font = '500 9px monospace'; let rowY = pt + 45;
    ctx.fillStyle = '#cbd5e1'; ctx.fillText(`a=1.000  e=${e.toFixed(3)}  E=${this.orbitEq_E.toFixed(1)}°`, panelX + 24, rowY);
    
    rowY += 13;
    ctx.fillStyle = '#fcd34d'; ctx.fillText(`r = a(1−e·cos E) = ${r_val.toFixed(3)}`, panelX + 24, rowY);
    
    if (highlight === 'all') {
      rowY += 13; ctx.fillStyle = '#c084fc';
      ctx.fillText(`Sector ½a²E = ${sectorArea.toFixed(4)}`, panelX + 24, rowY);
      rowY += 13; ctx.fillStyle = '#fbbf24';
      ctx.fillText(`Triangle ½a²e·sin E = ${triangleArea.toFixed(4)}`, panelX + 24, rowY);
      rowY += 13; ctx.fillStyle = '#38bdf8';
      ctx.fillText(`Swept = ${sweptArea.toFixed(4)}`, panelX + 24, rowY);
    }
    rowY += 13; ctx.fillStyle = '#34d399';
    ctx.fillText(`M = E−e·sin E = ${M_deg.toFixed(1)}°`, panelX + 24, rowY);

    // Bottom equation
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'italic 14px Georgia,serif'; ctx.textAlign = 'center';
    if (highlight === 'distance_derivation') {
      ctx.fillText('r² = (a·cos E − ae)² + (b·sin E)²  ⟹  r = a(1 − e·cos E)', cx, pt + ph - 16);
    } else {
      ctx.fillText('½a²M = ½a²E − ½a²e·sin E  ⟹  M = E − e·sin E', cx, pt + ph - 16);
    }

    // Header
    ctx.fillStyle = '#fff'; ctx.font = '600 16px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText("Kepler's Orbit Equations: From Geometry to Uniform Time", IX + IW / 2, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '500 12px Outfit,sans-serif';
    if (highlight === 'distance_derivation') {
      ctx.fillText('r = a(1 − e·cos E) — physical distance from the focus using eccentric anomaly E.', IX + IW / 2, 62);
    } else {
      ctx.fillText('½a²M = ½a²E − ½a²e·sin E  ⟹  M = E − e·sin E — the bridge from area to time.', IX + IW / 2, 62);
    }
  }

  // ── Dandelin Sphere Three.js Implementation ────────────────
  initDandelinThree() {
    const w = (this.container.clientWidth || window.innerWidth) - 400;
    const h = this.container.clientHeight || window.innerHeight;

    this.dandelinScene = new THREE.Scene();

    this.dandelinCamera = new THREE.PerspectiveCamera(45, Math.max(0.1, w / h), 0.1, 1000);
    this.dandelinCamera.position.set(15, 20, 25);

    this.dandelinRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.dandelinRenderer.setSize(Math.max(1, w), Math.max(1, h));
    this.dandelinRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.dandelinContainer.appendChild(this.dandelinRenderer.domElement);

    this.dandelinControls = new OrbitControls(this.dandelinCamera, this.dandelinRenderer.domElement);
    this.dandelinControls.enableDamping = true;
    this.dandelinControls.dampingFactor = 0.05;
    this.dandelinControls.target.set(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.dandelinScene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    this.dandelinScene.add(dirLight);

    // Floating Live Proof Overlay on top-right of 3D canvas
    this.dandelinOverlay = document.createElement('div');
    this.dandelinOverlay.className = 'ui-panel absolute top-4 right-4 p-4 rounded-xl shadow-2xl w-72 z-20 text-xs font-mono pointer-events-none bg-slate-900/85 backdrop-blur-md border border-slate-700/50 text-slate-200';
    this.dandelinOverlay.innerHTML = `
      <h2 class="text-xs font-bold text-teal-400 mb-2.5 tracking-wide flex items-center gap-1.5 font-sans">
        <span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
        DANDELIN LIVE PROOF
      </h2>

      <div class="space-y-1.5 mb-3">
        <div class="text-[10px] text-slate-400 font-sans font-semibold">Geometry: e = sin(θ) = c / a</div>
        <div class="flex justify-between"><span>Plane Tilt (θ)</span><span id="d-val-theta" class="text-white font-bold">30.0°</span></div>
        <div class="flex justify-between"><span>Eccentricity (e)</span><span id="d-val-e" class="text-teal-300 font-bold">0.500</span></div>
        <div class="flex justify-between"><span>Semi-Major (a)</span><span id="d-val-a" class="text-purple-300 font-bold">5.77</span></div>
        <div class="flex justify-between"><span>Semi-Minor (b)</span><span id="d-val-b" class="text-orange-300 font-bold">5.00</span></div>
        <div class="flex justify-between"><span>Focal Dist (c)</span><span id="d-val-c" class="text-blue-300 font-bold">2.89</span></div>
      </div>

      <div class="space-y-1.5 mb-3 pt-2.5 border-t border-slate-700/50">
        <div class="text-[10px] text-slate-400 font-sans font-semibold">Cartesian Eq: (x/a)² + (y/b)² = 1</div>
        <div class="flex justify-between text-cyan-400"><span>x² / a²</span><span id="d-val-x2a2">0.000</span></div>
        <div class="flex justify-between text-pink-400"><span>y² / b²</span><span id="d-val-y2b2">0.000</span></div>
        <div class="flex justify-between font-bold text-white mt-0.5"><span>Sum</span><span id="d-val-cartesian-sum" class="text-emerald-400">1.000</span></div>
      </div>

      <div class="space-y-1.5 pt-2.5 border-t border-slate-700/50">
        <div class="text-[10px] text-slate-400 font-sans font-semibold">Dandelin Angle Bisector Proof</div>
        <div class="text-[9px] text-slate-500 mb-1">∠(t → F₁) = ∠(t → E₁) and ∠(t → F₂) = ∠(t → E₂)</div>
        <div class="flex justify-between text-yellow-300"><span>α: ∠(t → P → F₁)</span><span id="d-val-angle-tf1">0.0°</span></div>
        <div class="flex justify-between text-cyan-300"><span>α: ∠(t → P → E₁)</span><span id="d-val-angle-te1">0.0°</span></div>
        <div class="flex justify-between text-yellow-300 mt-1"><span>β: ∠(t → P → F₂)</span><span id="d-val-angle-tf2">0.0°</span></div>
        <div class="flex justify-between text-cyan-300"><span>β: ∠(t → P → E₂)</span><span id="d-val-angle-te2">0.0°</span></div>
        <div class="text-[9px] text-emerald-400 font-bold mt-1 pt-1 border-t border-slate-700/50">∴ ∠F₁ = ∠F₂ (Reflection Law) ✓</div>
      </div>

      <div class="space-y-1.5 pt-2.5 border-t border-slate-700/50">
        <div class="text-[10px] text-slate-400 font-sans font-semibold">Distance Sum: PF₁ + PF₂ = 2a</div>
        <div class="flex justify-between text-red-400"><span>PF₁</span><span id="d-val-pf1">0.00</span></div>
        <div class="flex justify-between text-red-400"><span>PF₂</span><span id="d-val-pf2">0.00</span></div>
        <div class="flex justify-between font-bold text-white mt-0.5"><span>Sum</span><span id="d-val-pf-sum" class="text-emerald-400">0.00</span></div>
      </div>
    `;
    this.dandelinContainer.appendChild(this.dandelinOverlay);

    // Geometry Setup
    this.dandelinR = 5;
    this.dandelinPlaneAngle = THREE.MathUtils.degToRad(30);

    const cylinderGeo = new THREE.CylinderGeometry(this.dandelinR, this.dandelinR, 40, 64, 1, true);
    const cylinderMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transparent: true, opacity: 0.1,
      side: THREE.DoubleSide, depthWrite: false, roughness: 0.1
    });
    const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
    this.dandelinScene.add(cylinder);

    this.dandelinPlaneGroup = new THREE.Group();
    this.dandelinScene.add(this.dandelinPlaneGroup);

    const planeGeo = new THREE.PlaneGeometry(this.dandelinR * 8, this.dandelinR * 3);
    planeGeo.rotateX(-Math.PI / 2);
    const planeMat = new THREE.MeshPhysicalMaterial({
      color: 0x14b8a6, transparent: true, opacity: 0.35,
      side: THREE.DoubleSide, depthWrite: false
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    this.dandelinPlaneGroup.add(planeMesh);

    const sphereGeo = new THREE.SphereGeometry(this.dandelinR, 64, 64);
    const sphereMat = new THREE.MeshPhysicalMaterial({ color: 0x0d9488, transparent: true, opacity: 0.5, roughness: 0.2 });
    this.dandelinSphereTop = new THREE.Mesh(sphereGeo, sphereMat);
    this.dandelinSphereBot = new THREE.Mesh(sphereGeo, sphereMat);
    this.dandelinScene.add(this.dandelinSphereTop);
    this.dandelinScene.add(this.dandelinSphereBot);

    const ringGeo = new THREE.TorusGeometry(this.dandelinR, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    this.dandelinTopRing = new THREE.Mesh(ringGeo, ringMat);
    this.dandelinBottomRing = new THREE.Mesh(ringGeo, ringMat);
    this.dandelinTopRing.rotation.x = Math.PI / 2;
    this.dandelinBottomRing.rotation.x = Math.PI / 2;
    this.dandelinScene.add(this.dandelinTopRing);
    this.dandelinScene.add(this.dandelinBottomRing);

    const focusGeo = new THREE.SphereGeometry(0.25, 32, 32);
    const focusMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.dandelinFocus1 = new THREE.Mesh(focusGeo, focusMat);
    this.dandelinFocus2 = new THREE.Mesh(focusGeo, focusMat);
    this.dandelinPlaneGroup.add(this.dandelinFocus1);
    this.dandelinPlaneGroup.add(this.dandelinFocus2);

    const planetGeo = new THREE.SphereGeometry(0.3, 32, 32);
    const planetMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.dandelinPlanet = new THREE.Mesh(planetGeo, planetMat);
    this.dandelinPlaneGroup.add(this.dandelinPlanet);

    const createLine = (color, dashed = false) => {
      const mat = dashed
        ? new THREE.LineDashedMaterial({ color: color, dashSize: 0.3, gapSize: 0.2, linewidth: 2 })
        : new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
      return new THREE.Line(new THREE.BufferGeometry(), mat);
    };

    this.dLineToF1 = createLine(0xef4444);
    this.dLineToF2 = createLine(0xef4444);
    this.dLineGenerator = createLine(0x22c55e);
    this.dLineTangent = createLine(0xeab308);
    this.dLineNormal = createLine(0xffffff, true);

    this.dLineMagicVert = createLine(0xa855f7);
    this.dLineMagicRad = createLine(0xf97316);
    this.dLineMagicBase = createLine(0x3b82f6);

    // Lines for major axis right triangle: a = R / cos(theta)
    this.dLineHorizRef = createLine(0x38bdf8, true);   // horizontal reference line at y=0
    this.dLineMajorAxis = createLine(0x38bdf8);        // extended major axis line (-a to +a)
    this.dLineMajorVert = createLine(0xa855f7, true);  // vertical leg at X=R

    this.dandelinScene.add(this.dLineToF1, this.dLineToF2, this.dLineGenerator, this.dLineTangent, this.dLineNormal);
    this.dandelinScene.add(this.dLineMagicVert, this.dLineMagicRad, this.dLineMagicBase);
    this.dandelinScene.add(this.dLineHorizRef, this.dLineMajorVert);
    this.dandelinPlaneGroup.add(this.dLineMajorAxis);

    this.dLineXCoord = createLine(0x06b6d4);
    this.dLineYCoord = createLine(0xec4899);
    this.dandelinPlaneGroup.add(this.dLineXCoord);
    this.dandelinPlaneGroup.add(this.dLineYCoord);

    const ellipsePathMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    this.dandelinEllipseLine = new THREE.LineLoop(new THREE.BufferGeometry(), ellipsePathMat);
    this.dandelinPlaneGroup.add(this.dandelinEllipseLine);

    // ── Point Labels (HTML overlays positioned via project()) ──
    const labelStyle = (color) => `
      position:absolute; pointer-events:none; transform:translate(-50%,-100%);
      font: bold 13px 'Outfit',sans-serif; color:${color};
      text-shadow: 0 0 6px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.7);
      padding: 1px 4px; z-index: 30; white-space: nowrap;
    `;
    this.dandelinLabels = {};
    const labelDefs = [
      { id: 'P',  text: 'P',  color: '#ffffff' },
      { id: 'F1', text: 'F₁', color: '#ef4444' },
      { id: 'F2', text: 'F₂', color: '#ef4444' },
      { id: 'E1', text: 'E₁', color: '#22c55e' },
      { id: 'E2', text: 'E₂', color: '#22c55e' },
      { id: 't1', text: 't',  color: '#eab308' },
      { id: 't2', text: 't',  color: '#eab308' },
    ];
    labelDefs.forEach(def => {
      const el = document.createElement('div');
      el.style.cssText = labelStyle(def.color);
      el.textContent = def.text;
      this.dandelinContainer.appendChild(el);
      this.dandelinLabels[def.id] = el;
    });

    // ── E1 / E2 marker spheres on the tangent rings ──
    const e1Geo = new THREE.SphereGeometry(0.22, 16, 16);
    const e1Mat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    this.dandelinE1Marker = new THREE.Mesh(e1Geo, e1Mat);
    this.dandelinE2Marker = new THREE.Mesh(e1Geo.clone(), e1Mat.clone());
    this.dandelinScene.add(this.dandelinE1Marker);
    this.dandelinScene.add(this.dandelinE2Marker);

    // ── Angle arc lines ──
    const arcMat1 = new THREE.LineBasicMaterial({ color: 0xfbbf24, linewidth: 2 }); // t-to-F1 arc (gold)
    const arcMat2 = new THREE.LineBasicMaterial({ color: 0x22d3ee, linewidth: 2 }); // t-to-E1 arc (cyan)
    const arcMat3 = new THREE.LineBasicMaterial({ color: 0xfbbf24, linewidth: 2 }); // t-to-F2 arc (gold)
    const arcMat4 = new THREE.LineBasicMaterial({ color: 0x22d3ee, linewidth: 2 }); // t-to-E2 arc (cyan)
    const arcMatTheta = new THREE.LineBasicMaterial({ color: 0x14b8a6, linewidth: 3 }); // theta arc (teal)

    this.dArcTF1 = new THREE.Line(new THREE.BufferGeometry(), arcMat1);
    this.dArcTE1 = new THREE.Line(new THREE.BufferGeometry(), arcMat2);
    this.dArcTF2 = new THREE.Line(new THREE.BufferGeometry(), arcMat3);
    this.dArcTE2 = new THREE.Line(new THREE.BufferGeometry(), arcMat4);
    this.dArcThetaTop = new THREE.Line(new THREE.BufferGeometry(), arcMatTheta);
    this.dArcThetaOrig = new THREE.Line(new THREE.BufferGeometry(), arcMatTheta.clone());

    this.dandelinScene.add(this.dArcTF1, this.dArcTE1, this.dArcTF2, this.dArcTE2, this.dArcThetaTop, this.dArcThetaOrig);

    // ── Angle label HTML overlays ──
    const angleLabelStyle = (color) => `
      position:absolute; pointer-events:none; transform:translate(-50%,-50%);
      font: bold 12px 'Outfit',sans-serif; color:${color};
      text-shadow: 0 0 6px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.7);
      z-index: 30; white-space: nowrap;
    `;
    this.dandelinAngleLabels = {};
    const angleLabelDefs = [
      { id: 'a_tf1', text: 'α', color: '#fbbf24' },
      { id: 'a_te1', text: 'α', color: '#22d3ee' },
      { id: 'a_tf2', text: 'β', color: '#fbbf24' },
      { id: 'a_te2', text: 'β', color: '#22d3ee' },
      { id: 'a_theta_top', text: 'θ', color: '#14b8a6' },
      { id: 'a_theta_orig', text: 'θ', color: '#14b8a6' },
    ];
    angleLabelDefs.forEach(def => {
      const el = document.createElement('div');
      el.style.cssText = angleLabelStyle(def.color);
      el.textContent = def.text;
      this.dandelinContainer.appendChild(el);
      this.dandelinAngleLabels[def.id] = el;
    });

    this.updateDandelinGeometry(this.dandelinPlaneAngle);
  }

  updateLine(line, p1, p2, dashed = false) {
    line.geometry.setFromPoints([p1, p2]);
    if (dashed) line.computeLineDistances();
  }

  updateDandelinGeometry(angleRad) {
    this.dandelinPlaneAngle = angleRad;
    this.dandelinPlaneGroup.rotation.z = angleRad;

    const R = this.dandelinR;
    this.dandelinB = R;
    this.dandelinA = R / Math.cos(angleRad);
    this.dandelinC = R * Math.tan(angleRad);
    this.dandelinE = Math.sin(angleRad);

    const sphereY = R / Math.cos(angleRad);
    this.dandelinSphereTop.position.set(0, sphereY, 0);
    this.dandelinSphereBot.position.set(0, -sphereY, 0);
    this.dandelinTopRing.position.set(0, sphereY, 0);
    this.dandelinBottomRing.position.set(0, -sphereY, 0);

    this.dandelinFocus1.position.set(this.dandelinC, 0, 0);
    this.dandelinFocus2.position.set(-this.dandelinC, 0, 0);

    const centerWorld = new THREE.Vector3(0, 0, 0);
    const sphereCenterWorld = new THREE.Vector3(0, sphereY, 0);
    const f1World = new THREE.Vector3();
    this.dandelinFocus1.getWorldPosition(f1World);

    this.updateLine(this.dLineMagicVert, centerWorld, sphereCenterWorld, false);
    this.updateLine(this.dLineMagicRad, sphereCenterWorld, f1World, false);
    this.updateLine(this.dLineMagicBase, centerWorld, f1World, false);

    // Horizontal reference line at y=0 across cylinder
    this.updateLine(this.dLineHorizRef, new THREE.Vector3(-R * 1.4, 0, 0), new THREE.Vector3(R * 1.4, 0, 0), true);

    // Full Major Axis line extending across entire ellipse in local plane space (-a to +a)
    this.updateLine(this.dLineMajorAxis, new THREE.Vector3(-this.dandelinA, 0, 0), new THREE.Vector3(this.dandelinA, 0, 0), false);

    // Vertical leg of major axis right triangle: from (R,0,0) to (R, R*tan(theta), 0)
    const vertY = R * Math.tan(angleRad);
    this.updateLine(this.dLineMajorVert, new THREE.Vector3(R, 0, 0), new THREE.Vector3(R, vertY, 0), true);

    // 1. Theta arc at top vertex (sphereCenterWorld)
    const vecDown = new THREE.Vector3(0, -1, 0);
    const vecToF1 = f1World.clone().sub(sphereCenterWorld).normalize();
    const thetaArcRadius = 2.0;
    const totalTheta = vecDown.angleTo(vecToF1);
    const axisTheta = new THREE.Vector3().crossVectors(vecDown, vecToF1).normalize();
    const thetaArcPts = [];
    if (totalTheta > 0.001 && axisTheta.length() > 0.001) {
      for (let i = 0; i <= 20; i++) {
        const frac = i / 20;
        const angle = totalTheta * frac;
        const v = vecDown.clone().applyAxisAngle(axisTheta, angle).multiplyScalar(thetaArcRadius);
        thetaArcPts.push(sphereCenterWorld.clone().add(v));
      }
    }
    if (thetaArcPts.length > 1) {
      this.dArcThetaTop.geometry.setFromPoints(thetaArcPts);
      this.thetaTopMid = thetaArcPts[Math.floor(thetaArcPts.length / 2)];
    }

    // 2. Theta arc at origin (0, 0, 0) showing angle between horizontal reference line and major axis
    const vecHoriz = new THREE.Vector3(1, 0, 0);
    const vecMajorAxis = new THREE.Vector3(Math.cos(angleRad), Math.sin(angleRad), 0);
    const axisThetaOrig = new THREE.Vector3(0, 0, 1);
    const thetaOrigPts = [];
    if (angleRad > 0.001) {
      for (let i = 0; i <= 20; i++) {
        const frac = i / 20;
        const angle = angleRad * frac;
        const v = vecHoriz.clone().applyAxisAngle(axisThetaOrig, angle).multiplyScalar(2.2);
        thetaOrigPts.push(centerWorld.clone().add(v));
      }
    }
    if (thetaOrigPts.length > 1) {
      this.dArcThetaOrig.geometry.setFromPoints(thetaOrigPts);
      this.thetaOrigMid = thetaOrigPts[Math.floor(thetaOrigPts.length / 2)];
    }

    const ellipsePoints = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      ellipsePoints.push(new THREE.Vector3(this.dandelinA * Math.cos(theta), 0, this.dandelinB * Math.sin(theta)));
    }
    this.dandelinEllipseLine.geometry.setFromPoints(ellipsePoints);

    const elTheta = document.getElementById('d-val-theta');
    const elE = document.getElementById('d-val-e');
    const elA = document.getElementById('d-val-a');
    const elB = document.getElementById('d-val-b');
    const elC = document.getElementById('d-val-c');
    if (elTheta) elTheta.innerText = THREE.MathUtils.radToDeg(angleRad).toFixed(1) + '°';
    if (elE) elE.innerText = this.dandelinE.toFixed(3);
    if (elA) elA.innerText = this.dandelinA.toFixed(2);
    if (elB) elB.innerText = this.dandelinB.toFixed(2);
    if (elC) elC.innerText = this.dandelinC.toFixed(2);
  }

  setDandelinTilt(deg) {
    const rad = THREE.MathUtils.degToRad(deg);
    this.updateDandelinGeometry(rad);
  }

  setDandelinSpeed(spd) {
    this.dandelinSpeed = parseFloat(spd);
  }

  updateDandelinFrame() {
    if (!this.dandelinRenderer) return;
    this.dandelinControls.update();

    const a = this.dandelinA;
    const b = this.dandelinB;

    if (this.isSimPlaying) {
      const spd = this.dandelinSpeed !== undefined ? this.dandelinSpeed : 1.0;
      this.dandelinAngle += 0.003 * spd;
    }
    const E = this.dandelinAngle;

    const pX = a * Math.cos(E);
    const pZ = b * Math.sin(E);
    this.dandelinPlanet.position.set(pX, 0, pZ);

    this.updateLine(this.dLineXCoord, new THREE.Vector3(0, 0, 0), new THREE.Vector3(pX, 0, 0), false);
    this.updateLine(this.dLineYCoord, new THREE.Vector3(pX, 0, 0), new THREE.Vector3(pX, 0, pZ), false);

    const termX = Math.pow(pX / a, 2);
    const termY = Math.pow(pZ / b, 2);
    const elX2 = document.getElementById('d-val-x2a2');
    const elY2 = document.getElementById('d-val-y2b2');
    const elSum = document.getElementById('d-val-cartesian-sum');
    if (elX2) elX2.innerText = termX.toFixed(3);
    if (elY2) elY2.innerText = termY.toFixed(3);
    if (elSum) elSum.innerText = (termX + termY).toFixed(3);

    const pWorld = new THREE.Vector3();
    this.dandelinPlanet.getWorldPosition(pWorld);

    const f1World = new THREE.Vector3();
    this.dandelinFocus1.getWorldPosition(f1World);
    const f2World = new THREE.Vector3();
    this.dandelinFocus2.getWorldPosition(f2World);

    this.updateLine(this.dLineToF1, pWorld, f1World, false);
    this.updateLine(this.dLineToF2, pWorld, f2World, false);

    const sphereY = this.dandelinR / Math.cos(this.dandelinPlaneAngle);
    const genTop = new THREE.Vector3(pWorld.x, sphereY, pWorld.z);
    const genBot = new THREE.Vector3(pWorld.x, -sphereY, pWorld.z);
    this.updateLine(this.dLineGenerator, genTop, genBot, false);

    // E1 and E2: where the generator line meets the tangent rings
    const e1World = genTop.clone(); // top tangent ring point
    const e2World = genBot.clone(); // bottom tangent ring point
    this.dandelinE1Marker.position.copy(e1World);
    this.dandelinE2Marker.position.copy(e2World);

    const normXLocal = pX / (a * a);
    const normZLocal = pZ / (b * b);
    const nLocal = new THREE.Vector3(-normXLocal, 0, -normZLocal).normalize();
    const tLocal = new THREE.Vector3(-nLocal.z, 0, nLocal.x);

    const nWorld = nLocal.clone().transformDirection(this.dandelinPlaneGroup.matrixWorld);
    const tWorld = tLocal.clone().transformDirection(this.dandelinPlaneGroup.matrixWorld);

    const tStart = pWorld.clone().addScaledVector(tWorld, 4);
    const tEnd = pWorld.clone().addScaledVector(tWorld, -4);
    this.updateLine(this.dLineTangent, tStart, tEnd, false);

    const nEnd = pWorld.clone().addScaledVector(nWorld, 4);
    this.updateLine(this.dLineNormal, pWorld, nEnd, true);

    const vecPF1 = f1World.clone().sub(pWorld).normalize();
    const vecPF2 = f2World.clone().sub(pWorld).normalize();
    const vecPE1 = e1World.clone().sub(pWorld).normalize();
    const vecPE2 = e2World.clone().sub(pWorld).normalize();
    const tDir = tWorld.clone().normalize();
    const tDirNeg = tDir.clone().negate();

    // Compute the 4 angles from the Dandelin proof
    // α: angle between tangent t and PF₁ (use t direction on F1 side)
    const tForF1_a = (tDir.dot(vecPF1) > 0) ? tDir : tDirNeg;
    const angleTF1 = THREE.MathUtils.radToDeg(tForF1_a.angleTo(vecPF1));
    // α: angle between tangent t and PE₁ (use t direction on E1 side)
    const tForE1_a = (tDir.dot(vecPE1) > 0) ? tDir : tDirNeg;
    const angleTE1 = THREE.MathUtils.radToDeg(tForE1_a.angleTo(vecPE1));
    // β: angle between tangent t and PF₂ (use t direction on F2 side)
    const tForF2_a = (tDir.dot(vecPF2) > 0) ? tDir : tDirNeg;
    const angleTF2 = THREE.MathUtils.radToDeg(tForF2_a.angleTo(vecPF2));
    // β: angle between tangent t and PE₂ (use t direction on E2 side)
    const tForE2_a = (tDir.dot(vecPE2) > 0) ? tDir : tDirNeg;
    const angleTE2 = THREE.MathUtils.radToDeg(tForE2_a.angleTo(vecPE2));

    // Update overlay angle displays
    const elTF1 = document.getElementById('d-val-angle-tf1');
    const elTE1 = document.getElementById('d-val-angle-te1');
    const elTF2 = document.getElementById('d-val-angle-tf2');
    const elTE2 = document.getElementById('d-val-angle-te2');
    if (elTF1) elTF1.innerText = angleTF1.toFixed(1) + '°';
    if (elTE1) elTE1.innerText = angleTE1.toFixed(1) + '°';
    if (elTF2) elTF2.innerText = angleTF2.toFixed(1) + '°';
    if (elTE2) elTE2.innerText = angleTE2.toFixed(1) + '°';

    // Distance sum: PF₁ + PF₂ = 2a
    const distPF1 = pWorld.distanceTo(f1World);
    const distPF2 = pWorld.distanceTo(f2World);
    const elPF1 = document.getElementById('d-val-pf1');
    const elPF2 = document.getElementById('d-val-pf2');
    const elPFSum = document.getElementById('d-val-pf-sum');
    if (elPF1) elPF1.innerText = distPF1.toFixed(2);
    if (elPF2) elPF2.innerText = distPF2.toFixed(2);
    if (elPFSum) elPFSum.innerText = (distPF1 + distPF2).toFixed(2) + ' = 2a';

    // ── Project 3D points to 2D screen for HTML labels ──
    const projectToScreen = (pos3d) => {
      const v = pos3d.clone().project(this.dandelinCamera);
      const rect = this.dandelinRenderer.domElement;
      return {
        x: (v.x * 0.5 + 0.5) * rect.clientWidth,
        y: (-v.y * 0.5 + 0.5) * rect.clientHeight
      };
    };

    const positionLabel = (el, pos3d, offsetX = 0, offsetY = -12) => {
      if (!el) return;
      const s = projectToScreen(pos3d);
      el.style.left = (s.x + offsetX) + 'px';
      el.style.top = (s.y + offsetY) + 'px';
    };

    // Position point labels
    if (this.dandelinLabels) {
      positionLabel(this.dandelinLabels.P, pWorld, 0, -16);
      positionLabel(this.dandelinLabels.F1, f1World, 10, -14);
      positionLabel(this.dandelinLabels.F2, f2World, -10, -14);
      positionLabel(this.dandelinLabels.E1, e1World, 12, -14);
      positionLabel(this.dandelinLabels.E2, e2World, 12, -14);
      positionLabel(this.dandelinLabels.t1, tStart, 0, -14);
      positionLabel(this.dandelinLabels.t2, tEnd, 0, -14);
    }

    // ── Draw angle arcs showing the 4 equal angles from Dandelin proof ──
    // Arc helper: creates points along an arc from dir1 toward dir2 around center
    const makeArcPoints = (center, dir1, dir2, radius, numPts = 20) => {
      const points = [];
      const d1 = dir1.clone().normalize();
      const d2 = dir2.clone().normalize();

      // Compute angle between d1 and d2
      const totalAngle = d1.angleTo(d2);
      if (totalAngle < 0.001) return points;

      // Build rotation axis
      const axis = new THREE.Vector3().crossVectors(d1, d2).normalize();
      if (axis.length() < 0.001) return points;

      for (let i = 0; i <= numPts; i++) {
        const frac = i / numPts;
        const angle = totalAngle * frac;
        const v = d1.clone().applyAxisAngle(axis, angle).multiplyScalar(radius);
        points.push(center.clone().add(v));
      }
      return points;
    };

    const arcRadius = 1.2;

    // Reuse direction vectors from angle computation above
    // Arc 1: angle from tangent t toward F1 (on the F1 side)
    // Arc 2: angle from tangent t toward E1 (on the E1 side, same angle)
    // Arc 3: angle from tangent t toward F2 (on the F2 side)
    // Arc 4: angle from tangent t toward E2 (on the E2 side, same angle)

    const arcPts1 = makeArcPoints(pWorld, tForF1_a, vecPF1, arcRadius);
    const arcPts2 = makeArcPoints(pWorld, tForE1_a, vecPE1, arcRadius);
    const arcPts3 = makeArcPoints(pWorld, tForF2_a, vecPF2, arcRadius);
    const arcPts4 = makeArcPoints(pWorld, tForE2_a, vecPE2, arcRadius);

    if (arcPts1.length > 1) this.dArcTF1.geometry.setFromPoints(arcPts1);
    if (arcPts2.length > 1) this.dArcTE1.geometry.setFromPoints(arcPts2);
    if (arcPts3.length > 1) this.dArcTF2.geometry.setFromPoints(arcPts3);
    if (arcPts4.length > 1) this.dArcTE2.geometry.setFromPoints(arcPts4);

    // Position angle labels at midpoints of arcs
    if (this.dandelinAngleLabels) {
      const arcMid = (pts) => {
        if (pts.length < 2) return pWorld;
        return pts[Math.floor(pts.length / 2)];
      };
      positionLabel(this.dandelinAngleLabels.a_tf1, arcMid(arcPts1), 0, 0);
      positionLabel(this.dandelinAngleLabels.a_te1, arcMid(arcPts2), 0, 0);
      positionLabel(this.dandelinAngleLabels.a_tf2, arcMid(arcPts3), 0, 0);
      positionLabel(this.dandelinAngleLabels.a_te2, arcMid(arcPts4), 0, 0);
      if (this.thetaTopMid) {
        positionLabel(this.dandelinAngleLabels.a_theta_top, this.thetaTopMid, 0, 0);
      }
      if (this.thetaOrigMid) {
        positionLabel(this.dandelinAngleLabels.a_theta_orig, this.thetaOrigMid, 0, 0);
      }
    }

    this.dandelinRenderer.render(this.dandelinScene, this.dandelinCamera);
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resizeBound);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    if (this.logContainer && this.logContainer.parentNode) {
      this.logContainer.parentNode.removeChild(this.logContainer);
    }
    if (this.dandelinContainer && this.dandelinContainer.parentNode) {
      this.dandelinContainer.parentNode.removeChild(this.dandelinContainer);
    }
  }
}
