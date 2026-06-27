// Level 7: Copernicus — Heliocentric Model
export class Level7 {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    // Simulation state
    this.isSimPlaying = true;
    this.time = 0;
    this.deferentAngle = 0;
    this.epicycleAngle = 0;

    // Planet selection
    this.selectedPlanetName = 'All';
    this.deferentSpeed = 0.5;
    this.epicycleSpeed = 1.0;
    this.epicycleRadius = 39.5;
    this.planetOrbitSize = 1.52;

    this.planets = [
      { name: 'Mars',    deferentSpeed: 0.5,  epicycleSpeed: 1.0, epicycle: 39.5, orbitSize: 1.52 },
      { name: 'Jupiter', deferentSpeed: 0.08, epicycleSpeed: 1.0, epicycle: 11.5, orbitSize: 5.20 },
      { name: 'Saturn',  deferentSpeed: 0.03, epicycleSpeed: 1.0, epicycle: 6.5,  orbitSize: 9.58 },
      { name: 'Venus',   deferentSpeed: 1.0,  epicycleSpeed: 1.6, epicycle: 43.1, orbitSize: 0.723 }
    ];

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

  selectPlanet(name) {
    if (name === 'All') {
      this.selectedPlanetName = 'All';
    } else {
      const planet = this.planets.find(p => p.name === name);
      if (planet) {
        this.selectedPlanetName = name;
        this.deferentSpeed = planet.deferentSpeed;
        this.epicycleSpeed = planet.epicycleSpeed;
        this.epicycleRadius = planet.epicycle;
        this.planetOrbitSize = planet.orbitSize;
      }
    }
    this.resetSimulation();
  }

  togglePlay() {
    this.isSimPlaying = !this.isSimPlaying;
  }

  resetSimulation() {
    this.time = 0;
    this.deferentAngle = 0;
    this.epicycleAngle = 0;
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
      this.deferentAngle += this.deferentSpeed * 0.025;
      this.epicycleAngle += this.epicycleSpeed * 0.025;
    }

    // Left 400 px is the HTML task panel overlay
    const TASK_W = 400;
    const IX = TASK_W;
    const IW = W - TASK_W;
    const IH = H;

    try {
      this.drawCopernicus(ctx, IX, IW, IH);
    } catch (e) {
      console.error('Level7 draw error:', e);
    }
  }

  // ── Copernicus Illustration ────────────────────────────────
  drawCopernicus(ctx, IX, IW, IH) {
    const pt = 80, ph = IH - 160;
    const pw = IW * 0.44;
    const xL = IX + IW * 0.03;
    const xR = IX + IW * 0.52;
    const cy = pt + ph / 2;
    const cxL = xL + pw / 2;
    const cxR = xR + pw / 2;
    const R = pw * 0.33;

    // Panel backgrounds
    ctx.fillStyle = 'rgba(15,23,42,0.7)';
    ctx.strokeStyle = 'rgba(56,189,248,0.3)';
    ctx.lineWidth = 1.5;
    this.rrect(ctx, xL, pt, pw, ph, 14); ctx.fill(); ctx.stroke();
    this.rrect(ctx, xR, pt, pw, ph, 14); ctx.fill(); ctx.stroke();

    const isAll = (this.selectedPlanetName === 'All');

    // ─ LEFT: Ptolemy Geocentric ─
    ctx.save();
    ctx.beginPath(); this.rrect(ctx, xL, pt, pw, ph, 14); ctx.clip();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("Ptolemy's Geocentric Model", xL + 14, pt + 24);

    if (isAll) {
      const RB = pw * 0.22;
      const R_Sun = RB * 0.65;
      const geoAll = [
        { name: 'Venus',   rD: R_Sun,     rE: RB * 0.45, ds: 1.0,  es: 1.6,  col: '#10b981' },
        { name: 'Mars',    rD: RB * 0.85, rE: R_Sun,     ds: 0.5,  es: 1.0,  col: '#f59e0b' },
        { name: 'Jupiter', rD: RB * 1.1,  rE: R_Sun,     ds: 0.08, es: 1.0,  col: '#ef4444' },
        { name: 'Saturn',  rD: RB * 1.35, rE: R_Sun,     ds: 0.03, es: 1.0,  col: '#a78bfa' }
      ];

      // Earth glow
      const eg = ctx.createRadialGradient(cxL, cy, 1, cxL, cy, 12);
      eg.addColorStop(0, '#ffffff');
      eg.addColorStop(0.4, '#3b82f6');
      eg.addColorStop(1, 'rgba(59,130,246,0)');
      ctx.fillStyle = eg;
      ctx.beginPath(); ctx.arc(cxL, cy, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath(); ctx.arc(cxL, cy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '500 8px Outfit,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('Earth', cxL, cy - 14);

      // Draw Sun geocentric orbit & Sun itself
      const sunAngle = this.time * 1.0 * 0.025;
      const sx = cxL + Math.cos(sunAngle) * R_Sun;
      const sy = cy - Math.sin(sunAngle) * R_Sun;

      ctx.strokeStyle = 'rgba(251,191,36,0.18)'; ctx.lineWidth = 0.8;
      ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.arc(cxL, cy, R_Sun, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      this.sunAt(ctx, sx, sy, 4.5);
      ctx.fillStyle = '#fff'; ctx.font = '500 7px Outfit,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('Sun', sx, sy - 8);

      geoAll.forEach(p => {
        const da = this.time * p.ds * 0.025;
        const ea = this.time * p.es * 0.025;
        const dx = cxL + Math.cos(da) * p.rD;
        const dy = cy  - Math.sin(da) * p.rD;
        const px = dx  + Math.cos(ea) * p.rE;
        const py = dy  - Math.sin(ea) * p.rE;
        ctx.strokeStyle = p.col + '44'; ctx.lineWidth = 0.6;
        ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.arc(cxL, cy, p.rD, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(dx, dy, p.rE, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
        // label
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '500 7px Outfit,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, px, py - 7);
      });

    } else {
      const da = this.deferentAngle;
      const ea = this.epicycleAngle;
      const isOuter = this.planetOrbitSize > 1;
      const rEpi = isOuter ? R / this.planetOrbitSize : R * this.planetOrbitSize;
      const dx = cxL + Math.cos(da) * R;
      const dy = cy  - Math.sin(da) * R;
      const px = dx  + Math.cos(ea) * rEpi;
      const py = dy  - Math.sin(ea) * rEpi;

      const R_Sun = isOuter ? rEpi : R;
      const sunAngle = isOuter ? ea : da;
      const sx = cxL + Math.cos(sunAngle) * R_Sun;
      const sy = cy - Math.sin(sunAngle) * R_Sun;

      // Deferent
      ctx.strokeStyle = 'rgba(56,189,248,0.3)'; ctx.lineWidth = 1;
      ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.arc(cxL, cy, R, 0, Math.PI * 2); ctx.stroke();
      // Epicycle
      ctx.strokeStyle = 'rgba(167,139,250,0.4)';
      ctx.beginPath(); ctx.arc(dx, dy, rEpi, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      // Draw Sun geocentric orbit & Sun itself
      ctx.strokeStyle = 'rgba(251,191,36,0.18)'; ctx.lineWidth = 0.8;
      ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.arc(cxL, cy, R_Sun, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      this.sunAt(ctx, sx, sy, 4.5);
      ctx.fillStyle = '#fff'; ctx.font = '500 7.5px Outfit,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Sun', sx, sy - 8);

      // Earth
      ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(cxL, cy, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Outfit,sans-serif'; ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Earth', cxL, cy - 9);
      // Planet
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Outfit,sans-serif';
      ctx.fillText(this.selectedPlanetName, px, py - 9);
    }
    ctx.restore();

    // ─ RIGHT: Copernicus Heliocentric ─
    ctx.save();
    ctx.beginPath(); this.rrect(ctx, xR, pt, pw, ph, 14); ctx.clip();

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText("Copernicus' Heliocentric Model", xR + 14, pt + 24);

    this.sunAt(ctx, cxR, cy, 5);
    ctx.fillStyle = '#fff'; ctx.font = '500 8px Outfit,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Sun', cxR, cy - 16);

    if (isAll) {
      const RB = pw * 0.22;
      const helAll = [
        { name: 'Venus',   r: RB * 0.45, sp: 1.6,  col: '#10b981' },
        { name: 'Earth',   r: RB * 0.65, sp: 1.0,  col: '#3b82f6' },
        { name: 'Mars',    r: RB * 0.85, sp: 0.5,  col: '#f59e0b' },
        { name: 'Jupiter', r: RB * 1.1,  sp: 0.08, col: '#ef4444' },
        { name: 'Saturn',  r: RB * 1.38, sp: 0.03, col: '#a78bfa' }
      ];
      helAll.forEach(p => {
        const ang = this.time * p.sp * 0.025;
        const hx = cxR + Math.cos(ang) * p.r;
        const hy = cy  - Math.sin(ang) * p.r;
        ctx.strokeStyle = p.col + '44'; ctx.lineWidth = 0.6;
        ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.arc(cxR, cy, p.r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(hx, hy, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '500 7px Outfit,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(p.name, hx, hy - 7);
      });

    } else {
      const isOuter = this.planetOrbitSize > 1;
      const Re = isOuter ? R / this.planetOrbitSize : R;
      const Rp = isOuter ? R : R * this.planetOrbitSize;
      const eAng = this.time * 0.025;
      const pAng = isOuter ? this.time * this.deferentSpeed * 0.025
                           : this.time * this.epicycleSpeed * 0.025;
      const ex = cxR + Math.cos(eAng) * Re;
      const ey = cy  - Math.sin(eAng) * Re;
      const hpx = cxR + Math.cos(pAng) * Rp;
      const hpy = cy  - Math.sin(pAng) * Rp;

      ctx.strokeStyle = 'rgba(59,130,246,0.3)'; ctx.lineWidth = 1;
      ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.arc(cxR, cy, Re, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(245,158,11,0.3)';
      ctx.beginPath(); ctx.arc(cxR, cy, Rp, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Outfit,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('Earth', ex, ey - 8);
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(hpx, hpy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(this.selectedPlanetName, hpx, hpy - 8);
    }
    ctx.restore();

    // ─ Header ─
    ctx.fillStyle = '#fff'; ctx.font = '600 13px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Orbital Geometry: Ptolemy vs. Copernicus', IX + IW / 2, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 10px Outfit,sans-serif';
    ctx.fillText("Heliocentrism removes the deferent — epicycles map directly to Earth's orbital motion.", IX + IW / 2, 61);
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resizeBound);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
