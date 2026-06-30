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

    // Simulation state
    this.subtask = 'kepler1';
    this.kepler1Model = 'circle';
    this.isSimPlaying = true;
    this.time = 0;
    this.keplerAngle = 0;
    this.meanAnomaly = 0;

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

    this.resizeBound = this.resize.bind(this);
    window.addEventListener('resize', this.resizeBound);
    this.resize();

    this.animateBound = this.animate.bind(this);
    this.animationId = requestAnimationFrame(this.animateBound);
  }

  resize() {
    this.canvas.width = this.container.clientWidth || window.innerWidth;
    this.canvas.height = this.container.clientHeight || window.innerHeight;
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
    if (subtask === 'logarithm') {
      this.canvas.style.display = 'none';
      this.logContainer.style.display = 'block';
      this.renderLogarithmUI();
    } else {
      this.canvas.style.display = 'block';
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
    }

    const TASK_W = 400;
    const IX = TASK_W;
    const IW = W - TASK_W;
    const IH = H;

    try {
      if      (this.subtask === 'kepler1')  this.drawKepler1(ctx, IX, IW, IH);
      else if (this.subtask === 'kepler23') this.drawKepler23(ctx, IX, IW, IH);
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

    this.logContainer.innerHTML = `
      <div class="flex flex-col lg:flex-row h-full w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
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
              <div class="mb-4">
                <div class="flex justify-between text-[10.5px] text-slate-400 mb-1.5">
                  <span>Move Moon Closer/Further</span>
                  <span class="text-emerald-400 font-bold">${distanceSunMoonReal.toLocaleString()} miles</span>
                </div>
                <input type="range" id="moon-x-slider" min="100" max="260" value="${this.moonX}" 
                  class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500">
              </div>

              <!-- Mode Toggle -->
              <div class="flex bg-slate-950 rounded-lg p-0.5 mb-3.5 border border-slate-800">
                <button id="btn-std-math" class="flex-1 text-[10.5px] py-1.5 rounded-md font-medium transition-colors ${!this.showLogs ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}">
                  Standard Math
                </button>
                <button id="btn-log-math" class="flex-1 text-[10.5px] py-1.5 rounded-md font-medium transition-colors ${this.showLogs ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}">
                  Use Logarithms
                </button>
              </div>

              <!-- Calculation Panel -->
              <div class="bg-slate-950 p-3 rounded-lg font-mono text-[11px] border border-slate-900 min-h-[140px] flex flex-col justify-center">
                ${!this.showLogs ? `
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
                ` : `
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
                `}
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: SVG Canvas -->
        <div class="flex-grow relative bg-black flex flex-col h-full overflow-hidden">
          <div class="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800/80 backdrop-blur text-xs font-semibold">
            <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            Space Geometry View
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
              <line x1="${sunX}" y1="${-sunR}" x2="${apexX}" y2="0" stroke="#f87171" stroke-width="0.8" stroke-dasharray="3,3" class="opacity-50" />
              <line x1="${sunX}" y1="${sunR}" x2="${apexX}" y2="0" stroke="#f87171" stroke-width="0.8" stroke-dasharray="3,3" class="opacity-50" />
              <line x1="-30" y1="0" x2="430" y2="0" stroke="#475569" stroke-width="0.5" stroke-dasharray="2,2" />

              <!-- Penumbra (light outer shadow) -->
              <polygon points="${this.moonX},${-moonR} ${this.moonX},${moonR} 400,${moonR + (400 - this.moonX) * 0.18} 400,${-moonR - (400 - this.moonX) * 0.18}" fill="rgba(255,255,255,0.04)" />
              
              <!-- Umbra (dark shadow cone) -->
              <polygon points="${this.moonX},${-moonR} ${this.moonX},${moonR} ${apexX},0" fill="rgba(0,0,0,0.85)" stroke="#475569" stroke-width="0.5" />

              <!-- Sun -->
              <circle cx="${sunX}" cy="0" r="${sunR}" fill="url(#sunGlow)" />
              <line x1="${sunX}" y1="0" x2="${sunX}" y2="${-sunR}" stroke="#fef08a" stroke-width="1.2" />
              <text x="${sunX + 5}" y="${-sunR / 2}" fill="#fef08a" font-size="9" font-family="Outfit" font-weight="bold">R_sun</text>

              <!-- Earth -->
              <g transform="translate(${earthX}, 0)">
                <circle cx="0" cy="0" r="${earthR}" fill="#1e3a8a" />
                <path d="M 0 -${earthR} A ${earthR} ${earthR} 0 0 1 0 ${earthR} A ${earthR / 2} ${earthR} 0 0 0 0 -${earthR}" fill="#0f172a" class="opacity-75" />
                <text x="0" y="24" fill="#94a3b8" font-size="9" font-family="Outfit" text-anchor="middle">Earth</text>
                ${isTotalEclipse ? `
                  <circle cx="-${earthR}" cy="0" r="2.5" fill="#ef4444" class="animate-pulse" />
                ` : ''}
              </g>

              <!-- Moon -->
              <g transform="translate(${this.moonX}, 0)">
                <circle cx="0" cy="0" r="${moonR}" fill="#94a3b8" />
                <path d="M 0 -${moonR} A ${moonR} ${moonR} 0 0 1 0 ${moonR} A ${moonR / 2} ${moonR} 0 0 0 0 -${moonR}" fill="#334155" />
                <line x1="0" y1="0" x2="0" y2="${-moonR}" stroke="#cbd5e1" stroke-width="1.2" />
                <text x="5" y="${-moonR / 2}" fill="#cbd5e1" font-size="7.5" font-family="Outfit" font-weight="bold">R_moon</text>
              </g>

              <!-- Dimensions -->
              <g font-size="8.5" font-family="Outfit" fill="#10b981" font-weight="500">
                <line x1="${sunX}" y1="55" x2="${this.moonX}" y2="55" stroke="#10b981" stroke-width="0.8" />
                <line x1="${sunX}" y1="52" x2="${sunX}" y2="58" stroke="#10b981" stroke-width="0.8" />
                <line x1="${this.moonX}" y1="52" x2="${this.moonX}" y2="58" stroke="#10b981" stroke-width="0.8" />
                <text x="${sunX + (this.moonX - sunX) / 2}" y="67" text-anchor="middle">Dist (D)</text>
              </g>

              <g font-size="8.5" font-family="Outfit" fill="#3b82f6" font-weight="500">
                <line x1="${this.moonX}" y1="38" x2="${apexX}" y2="38" stroke="#3b82f6" stroke-width="0.8" />
                <line x1="${this.moonX}" y1="35" x2="${this.moonX}" y2="41" stroke="#3b82f6" stroke-width="0.8" />
                <line x1="${apexX}" y1="35" x2="${apexX}" y2="41" stroke="#3b82f6" stroke-width="0.8" />
                <text x="${this.moonX + (apexX - this.moonX) / 2}" y="50" text-anchor="middle">Length (L)</text>
              </g>
            </svg>
          </div>

          <!-- Dynamic Status Bar -->
          <div class="absolute bottom-4 right-4 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-2xl max-w-[240px] transition-colors ${isTotalEclipse ? 'bg-red-950/80 border-red-900/50 text-red-200' : 'bg-slate-900/80 border-slate-700/50 text-slate-200'}">
            <h4 class="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
              ${isTotalEclipse ? `
                <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              ` : `
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              `}
              Eclipse Status
            </h4>
            <p class="text-[10px] leading-relaxed opacity-90">
              ${isTotalEclipse ? "The Umbra touches Earth! A Total Solar Eclipse is occurring." : "The Umbra falls short. Observers on Earth see an Annular Eclipse (Ring of Fire)."}
            </p>
          </div>
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
  }
}
