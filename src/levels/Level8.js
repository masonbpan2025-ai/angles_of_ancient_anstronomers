// Level 8: Kepler's Laws
export class Level8 {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

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

  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resizeBound);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
