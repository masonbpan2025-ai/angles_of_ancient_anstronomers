// Level 10: Applying Newton's Law
import { gameState } from '../core/GameState.js';

export class Level10 {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    // Common state
    this.time = 0;
    this.activeTab = 'black-hole'; // 'black-hole' or 'exoplanet'

    // Black Hole state
    this.gravityFactor = 0; // 0 to 80. At 50, light orbits. At >50, light is captured.

    // Exoplanet Orbit state
    this.periodDays = 100;
    this.starMassSolar = 1.0;
    this.startTime = Date.now();

    // Stars background
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.5 + Math.random() * 1.2,
        brightness: 0.3 + Math.random() * 0.7
      });
    }

    // Bind methods
    this.resizeBound = this.resize.bind(this);
    this.animateBound = this.animate.bind(this);

    window.addEventListener('resize', this.resizeBound);
    this.resize();

    // Create both parameter overlays
    this.initOverlayUI();

    // Start loop
    this.animationId = requestAnimationFrame(this.animateBound);
  }

  setTab(tab) {
    this.activeTab = tab;
    if (tab === 'black-hole') {
      this.bhOverlay.style.display = 'block';
      this.exoplanetOverlay.style.display = 'none';
    } else {
      this.bhOverlay.style.display = 'none';
      this.exoplanetOverlay.style.display = 'block';
      this.updateExoplanetUI();
    }
  }

  initOverlayUI() {
    // 1. Black Hole Overlay
    this.bhOverlay = document.createElement('div');
    this.bhOverlay.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 100;
      pointer-events: auto;
      display: block;
    `;
    this.container.appendChild(this.bhOverlay);
    
    this.bhOverlay.innerHTML = `
      <div class="bg-slate-900/95 border border-slate-800 p-4 rounded-2xl shadow-2xl w-[280px] font-sans text-slate-200 backdrop-blur-md">
        <h4 class="text-xs font-bold text-white mb-2.5 flex items-center gap-1.5">
          <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          Gravity &amp; Mass Slider
        </h4>
        
        <div class="space-y-3">
          <div class="flex justify-between text-[10px] text-slate-400">
            <span>Mass Scale:</span>
            <span id="bh-mass-scale" class="text-violet-400 font-bold font-mono">0.0x</span>
          </div>
          <input type="range" id="bh-gravity-slider" min="0" max="80" value="0" 
            class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500">
          
          <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1">
            <span class="text-[9px] uppercase font-bold text-slate-500">Trajectory Status:</span>
            <span id="bh-status-text" class="text-[10.5px] font-bold">Straight Beam</span>
            <p id="bh-status-desc" class="text-[9.5px] leading-relaxed text-slate-400">Under normal conditions, light travels in straight lines.</p>
          </div>
        </div>
      </div>
    `;

    this.massScaleEl = this.bhOverlay.querySelector('#bh-mass-scale');
    this.statusTextEl = this.bhOverlay.querySelector('#bh-status-text');
    this.statusDescEl = this.bhOverlay.querySelector('#bh-status-desc');
    const bhSlider = this.bhOverlay.querySelector('#bh-gravity-slider');

    bhSlider.addEventListener('input', (e) => {
      this.gravityFactor = parseInt(e.target.value);
      this.updateBHUI();
    });

    this.updateBHUI();

    // 2. Exoplanet Overlay
    this.exoplanetOverlay = document.createElement('div');
    this.exoplanetOverlay.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 100;
      pointer-events: auto;
      display: none;
    `;
    this.container.appendChild(this.exoplanetOverlay);

    this.exoplanetOverlay.innerHTML = `
      <div class="bg-slate-900/95 border border-slate-800 p-4 rounded-2xl shadow-2xl w-[280px] font-sans text-slate-200 backdrop-blur-md flex flex-col gap-3 max-h-[calc(100vh-60px)] overflow-y-auto custom-scrollbar">
        <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
          <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Exoplanet Orbit Parameters
        </h4>

        <!-- Sliders -->
        <div class="space-y-2.5">
          <div class="flex flex-col gap-1">
            <div class="flex justify-between text-[10px] text-slate-450">
              <span>Transit Period (T):</span>
              <span id="exo-period-readout" class="text-violet-400 font-bold font-mono">100 Days</span>
            </div>
            <input type="range" id="exo-period-slider" min="10" max="365" value="100" 
              class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500">
          </div>

          <div class="flex flex-col gap-1">
            <div class="flex justify-between text-[10px] text-slate-450">
              <span>Host Star Mass (M<sub>*</sub>):</span>
              <span id="exo-mass-readout" class="text-violet-400 font-bold font-mono">1.0 M<sub>&odot;</sub></span>
            </div>
            <input type="range" id="exo-mass-slider" min="0.1" max="3.0" value="1.0" step="0.1"
              class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500">
          </div>
        </div>

        <!-- Light Curve Graph Preview -->
        <div class="border-t border-slate-800 pt-2">
          <span class="text-[9px] uppercase font-bold text-slate-500 block mb-1">Observed Light Curve Template:</span>
          <div id="exo-lightcurve-container"></div>
        </div>

        <!-- Derivation Checklist Cards -->
        <div class="border-t border-slate-800 pt-2.5 flex flex-col gap-2">
          <span class="text-[9.5px] uppercase font-bold tracking-wider text-slate-450 block">THE PHYSICS OF THE ORBIT</span>

          <div class="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 text-[10px] leading-relaxed">
            <p class="font-bold text-slate-400">Step 1: Kepler's 3rd Law (Newtonian)</p>
            <p class="text-slate-400">For any circular orbit of radius <i>r</i> around host star of mass <i>M<sub>*</sub></i> and period <i>T</i>:</p>
            <div class="text-center font-serif text-white text-xs my-1">
              r³ = G · M<sub>*</sub> · T² / (4&pi;²)
            </div>
          </div>

          <div class="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 text-[10px] leading-relaxed">
            <p class="font-bold text-slate-400">Step 2: Reference to Earth's Orbit</p>
            <p class="text-slate-400">For Earth orbiting the Sun (<i>r<sub>e</sub></i> = 1 AU, <i>M<sub>e</sub></i> = 1 M<sub>&odot;</sub>, <i>T<sub>e</sub></i> = 365.25 days):</p>
            <div class="text-center font-serif text-white text-xs my-1">
              (1 AU)³ = G · (1 M<sub>&odot;</sub>) · (365.25)² / (4&pi;²)
            </div>
          </div>

          <div class="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 text-[10px] leading-relaxed">
            <p class="font-bold text-slate-400">Step 3: Solve by Ratio</p>
            <p class="text-slate-400">Divide the planet's equation by Earth's equation to cancel out G and 4&pi;²:</p>
            <div class="text-center font-serif text-emerald-400 text-xs my-1">
              r³ / (1 AU)³ = (M<sub>*</sub> / 1 M<sub>&odot;</sub>) · (T / 365.25)²
            </div>
          </div>

          <div class="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 text-[10px] leading-relaxed">
            <p class="font-bold text-slate-400">Step 4: Calculate Orbit Size in AU</p>
            <p class="text-slate-400">Take the cube root to solve directly for <i>r</i> (in AU):</p>
            <div class="text-center font-serif text-emerald-400 text-[11px] font-bold my-1">
              r = ∛( M<sub>*</sub> · (T / 365.25)² ) AU
            </div>
            <p class="text-slate-400 border-t border-slate-850/80 pt-1.5 mt-1.5">
              • M<sub>*</sub> = <span id="exo-step4-mass">1.0</span> M<sub>&odot;</sub>
              <br>• T = <span id="exo-step4-period">100</span> days
            </p>
            <div id="exo-step4-r-au" class="text-center font-bold text-emerald-400 text-xs mt-2 border-t border-slate-850 pt-2">
              r = 0.422 AU
            </div>
            <div id="exo-step4-r-km" class="text-center text-[9px] text-slate-500">
              (63.1 million kilometers)
            </div>
          </div>
        </div>
      </div>
    `;

    // Sliders Event Handlers
    const periodSlider = this.exoplanetOverlay.querySelector('#exo-period-slider');
    const massSlider = this.exoplanetOverlay.querySelector('#exo-mass-slider');

    periodSlider.addEventListener('input', (e) => {
      this.periodDays = parseInt(e.target.value);
      this.updateExoplanetUI();
    });

    massSlider.addEventListener('input', (e) => {
      this.starMassSolar = parseFloat(e.target.value);
      this.updateExoplanetUI();
    });
  }

  updateBHUI() {
    this.massScaleEl.textContent = `${(this.gravityFactor * 2.0).toFixed(1)}x`;

    if (this.gravityFactor === 0) {
      this.statusTextEl.textContent = 'Straight Beam';
      this.statusTextEl.className = 'text-[10.5px] font-bold text-slate-400';
      this.statusDescEl.textContent = 'Under normal conditions, light travels in straight lines.';
    } else if (this.gravityFactor > 0 && this.gravityFactor < 50) {
      this.statusTextEl.textContent = 'Gravitational Lensing';
      this.statusTextEl.className = 'text-[10.5px] font-bold text-sky-400';
      this.statusDescEl.textContent = 'Light is bent by the massive gravity field, but has escape velocity.';
    } else if (this.gravityFactor === 50) {
      this.statusTextEl.textContent = 'Dark Star Condition (Orbit)';
      this.statusTextEl.className = 'text-[10.5px] font-bold text-green-400 animate-pulse';
      this.statusDescEl.textContent = 'The surface orbital velocity exactly equals the speed of light! The photons orbit the Earth.';
    } else if (this.gravityFactor > 50) {
      this.statusTextEl.textContent = 'Singularity Capture (Black Hole)';
      this.statusTextEl.className = 'text-[10.5px] font-bold text-red-400';
      this.statusDescEl.textContent = 'Gravity is so strong that the escape velocity exceeds the speed of light. Light is trapped!';
    }
  }

  updateExoplanetUI() {
    // Proportional Kepler's 3rd Law calculation
    const rAU = Math.pow(this.starMassSolar * Math.pow(this.periodDays / 365.25, 2), 1 / 3);
    const AU_IN_METERS = 1.4959787e11;
    const rMeters = rAU * AU_IN_METERS;

    // Update overlay readouts
    const periodReadout = this.exoplanetOverlay.querySelector('#exo-period-readout');
    const massReadout = this.exoplanetOverlay.querySelector('#exo-mass-readout');
    if (periodReadout) periodReadout.textContent = `${this.periodDays} Days`;
    if (massReadout) {
      massReadout.innerHTML = `${this.starMassSolar.toFixed(1)} M<sub>&odot;</sub>`;
    }

    // Update Step 4 items (using ratio formulas)
    const step4Mass = this.exoplanetOverlay.querySelector('#exo-step4-mass');
    const step4Period = this.exoplanetOverlay.querySelector('#exo-step4-period');
    const step4rAu = this.exoplanetOverlay.querySelector('#exo-step4-r-au');
    const step4rKm = this.exoplanetOverlay.querySelector('#exo-step4-r-km');

    if (step4Mass) step4Mass.innerHTML = this.starMassSolar.toFixed(1);
    if (step4Period) step4Period.textContent = this.periodDays;
    if (step4rAu) step4rAu.textContent = `r = ${rAU.toFixed(3)} AU`;
    if (step4rKm) step4rKm.textContent = `(${(rMeters / 1e9).toFixed(1)} million kilometers)`;

    // Update Light Curve
    const lcContainer = this.exoplanetOverlay.querySelector('#exo-lightcurve-container');
    if (lcContainer) {
      lcContainer.innerHTML = this.getLightCurveSVGHTML();
    }
  }

  getLightCurveSVGHTML() {
    const periodDays = this.periodDays;
    const svgWidth = 240;
    const svgHeight = 70;
    const padding = 15;

    const dipCount = 3;
    const spacing = (svgWidth - 2 * padding) / (dipCount - 1);
    
    let pathD = `M ${padding} 25`;
    const dipWidth = 16; 
    
    for (let i = 0; i < dipCount; i++) {
      const cx = padding + i * spacing;
      const xStart = cx - dipWidth / 2;
      const xEnd = cx + dipWidth / 2;
      
      if (i === 0) {
        pathD = `M ${padding} 25`;
      } else {
        pathD += ` L ${xStart} 25`;
      }
      
      pathD += ` C ${xStart + dipWidth * 0.25} 25, ${xStart + dipWidth * 0.25} 45, ${cx} 45`;
      pathD += ` C ${cx + dipWidth * 0.25} 45, ${cx + dipWidth * 0.25} 25, ${xEnd} 25`;
    }
    pathD += ` L ${svgWidth - padding} 25`;

    const arrowY = 54;
    const t1X = padding;
    const t2X = padding + spacing;

    return `
      <svg width="100%" height="70" viewBox="0 0 ${svgWidth} ${svgHeight}" class="mt-1">
        <line x1="${padding}" y1="25" x2="${svgWidth - padding}" y2="25" stroke="#334155" stroke-width="1" stroke-dasharray="4 4" />
        <path d="${pathD}" fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-linejoin="round" />
        <line x1="${t1X}" y1="${arrowY}" x2="${t2X}" y2="${arrowY}" stroke="#f472b6" stroke-width="1.5" />
        <polygon points="${t1X},${arrowY} ${t1X + 5},${arrowY - 3} ${t1X + 5},${arrowY + 3}" fill="#f472b6" />
        <polygon points="${t2X},${arrowY} ${t2X - 5},${arrowY - 3} ${t2X - 5},${arrowY + 3}" fill="#f472b6" />
        <line x1="${t1X}" y1="25" x2="${t1X}" y2="${arrowY}" stroke="#f472b6" stroke-width="1" stroke-dasharray="2 2" />
        <line x1="${t2X}" y1="25" x2="${t2X}" y2="${arrowY}" stroke="#f472b6" stroke-width="1" stroke-dasharray="2 2" />
        <text x="${(t1X + t2X) / 2}" y="${arrowY - 5}" fill="#f472b6" font-size="9" font-weight="bold" text-anchor="middle">
          Period (T) = ${periodDays}d
        </text>
        <text x="${padding}" y="${svgHeight - 2}" fill="#64748b" font-size="8">Time</text>
        <text x="${svgWidth - padding}" y="${svgHeight - 2}" fill="#64748b" font-size="8" text-anchor="end">Brightness (92% dip)</text>
      </svg>
    `;
  }

  resize() {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
  }

  drawEarth(ctx, cx, cy, r) {
    if (this.gravityFactor >= 50) {
      // Draw Black Hole / Gravitational lensing ring
      const gRing = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 45);
      gRing.addColorStop(0, '#000000');
      gRing.addColorStop(0.12, '#000000');
      gRing.addColorStop(0.15, '#f59e0b'); // amber accretion ring
      gRing.addColorStop(0.2, '#c084fc'); // violet lensing ring
      gRing.addColorStop(0.4, 'rgba(167,139,250,0.15)');
      gRing.addColorStop(1, 'rgba(167,139,250,0)');
      ctx.fillStyle = gRing;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 45, 0, Math.PI * 2);
      ctx.fill();

      // Event horizon center
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
      ctx.fill();

      // Event horizon border
      ctx.strokeStyle = 'rgba(167,139,250,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    // Normal Earth
    // Atmosphere glow
    const gAtm = ctx.createRadialGradient(cx, cy, r - 5, cx, cy, r + 25);
    gAtm.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gAtm.addColorStop(0.4, 'rgba(59, 130, 246, 0.15)');
    gAtm.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = gAtm;
    ctx.beginPath(); ctx.arc(cx, cy, r + 25, 0, Math.PI * 2); ctx.fill();

    // Ocean body
    const gOcean = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 5, cx, cy, r);
    gOcean.addColorStop(0, '#3b82f6');
    gOcean.addColorStop(0.7, '#1d4ed8');
    gOcean.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = gOcean;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    // Continent landmass shapes
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#10b981';
    
    // North America/Europe
    ctx.beginPath(); ctx.arc(cx - 20, cy - 40, r * 0.5, 0, Math.PI * 2); ctx.fill();
    // Africa/South America
    ctx.beginPath(); ctx.arc(cx + 10, cy + 20, r * 0.6, 0, Math.PI * 2); ctx.fill();
    // Asia/Australia
    ctx.beginPath(); ctx.arc(cx + 50, cy - 10, r * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Draw crust outline
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  }

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
    bg.addColorStop(0.5, '#03030f');
    bg.addColorStop(1, '#010108');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Stars
    this.stars.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.brightness * (0.7 + 0.3 * Math.sin(this.time * 0.025 + s.x * 12));
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    this.time += 1;

    // Layout configuration
    const TASK_W = 400;

    if (this.activeTab === 'black-hole') {
      // --- DRAW BLACK HOLE SIMULATION ---
      const cx = TASK_W + (W - TASK_W) / 2;
      const cy = H / 2;
      const R_earth = 100;
      const H_mountain = 14;

      this.drawEarth(ctx, cx, cy, R_earth);

      // Draw Mountain & Flashlight (only if normal Earth, hides when it is a black hole)
      if (this.gravityFactor < 50) {
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy - R_earth);
        ctx.lineTo(cx, cy - R_earth - H_mountain);
        ctx.lineTo(cx + 7, cy - R_earth);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Flashlight barrel
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.rect(cx - 2, cy - R_earth - H_mountain - 4, 8, 4);
        ctx.fill(); ctx.stroke();
      }

      // Flashlight beam calculations
      // In critical circular orbit, v = 5.0 pixels/step, r = 114 pixels.
      // GM_crit = v^2 * r = 25 * 114 = 2850.
      const v0 = 5.0;
      const GM = (this.gravityFactor / 50) * 2850;

      let x = cx;
      let y = cy - R_earth - H_mountain - 2;
      let vx = v0;
      let vy = 0;

      const path = [{ x, y }];
      let captured = false;
      let escaped = false;

      // Run trajectory tracing
      for (let i = 0; i < 1500; i++) {
        const dx = x - cx;
        const dy = y - cy;
        const r = Math.sqrt(dx * dx + dy * dy);

        if (r < R_earth) {
          captured = true;
          break;
        }
        if (r > Math.max(W, H)) {
          escaped = true;
          break;
        }

        // Acceleration (1/r^2 force field)
        const ax = -GM * dx / (r * r * r);
        const ay = -GM * dy / (r * r * r);

        const dt = 0.5;
        vx += ax * dt;
        vy += ay * dt;
        x += vx * dt;
        y += vy * dt;

        path.push({ x, y });
      }

      // Draw Laser path
      if (path.length > 1) {
        ctx.save();
        ctx.shadowColor = this.gravityFactor >= 50 ? '#ec4899' : '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = this.gravityFactor >= 50 ? 'rgba(236,72,153,0.85)' : 'rgba(6,182,212,0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Titles
      ctx.fillStyle = '#fff'; ctx.font = '600 13px Outfit,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText("Light Path Bending (Newtonian Dark Star)", IX_center(W, TASK_W), 44);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 10px Outfit,sans-serif';
      ctx.fillText("Adjust gravity/mass scale in top-right. At 50x, surface orbit velocity matches speed of light.", IX_center(W, TASK_W), 61);

    } else {
      // --- DRAW EXOPLANET ORBIT SIMULATION (TOP-DOWN, FRONT VIEW, & DYNAMIC LIGHT CURVE) ---
      const cx = TASK_W + (W - 450 - TASK_W) / 2;
      
      const cyTop = H * 0.24;
      const cyBottom = H * 0.54;
      const cyGraph = H * 0.83;

      const maxRadius = Math.min(W - 450 - TASK_W, H / 3) / 2 - 12;
      const scale = maxRadius / 2.0; 
      
      // Proportional Kepler's 3rd Law to find rAU
      const rAU = Math.pow(this.starMassSolar * Math.pow(this.periodDays / 365.25, 2), 1 / 3);

      // Star core visual radius
      const starVisualRadius = 12 + (this.starMassSolar * 3.5);
      const frontStarRadius = starVisualRadius * 1.5;

      // Adjust pixel radius so the planet orbits outside the star and transits correctly
      const pixelRadius = Math.max(rAU * scale * 2.5, frontStarRadius * 1.5);

      const elapsedMs = Date.now() - this.startTime;
      const rotationSpeed = (365 / this.periodDays) * (2 * Math.PI / 10000); 
      const angle = elapsedMs * rotationSpeed;
      const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

      // Calculate transit angle and brightness dynamically for a smooth U-shaped dip
      const transitCenter = 0.5 * Math.PI;
      const transitHalfWidth = Math.asin(Math.min(0.99, frontStarRadius / pixelRadius));

      const getTransitBrightness = (a) => {
        let dist = Math.abs(a - transitCenter);
        if (dist > Math.PI) {
          dist = 2 * Math.PI - dist;
        }
        if (dist < transitHalfWidth) {
          const normalizedDist = dist / transitHalfWidth;
          return 1.0 - 0.08 * (1 - Math.pow(normalizedDist, 2));
        }
        return 1.0;
      };

      const currentBrightness = getTransitBrightness(normalizedAngle);
      const isBehindFront = Math.sin(normalizedAngle) < 0;
      const isTransiting = !isBehindFront && Math.abs(normalizedAngle - transitCenter) < transitHalfWidth;

      // 1. TOP-DOWN ORBIT VIEW
      const planetX = cx + Math.cos(angle) * pixelRadius;
      const planetY = cyTop + Math.sin(angle) * pixelRadius;

      // Draw Orbit Path
      ctx.beginPath();
      ctx.arc(cx, cyTop, pixelRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Star Glow
      const topGlow = ctx.createRadialGradient(cx, cyTop, starVisualRadius * 0.1, cx, cyTop, starVisualRadius * 3);
      topGlow.addColorStop(0, 'rgba(251, 146, 60, 0.9)');
      topGlow.addColorStop(0.3, 'rgba(251, 146, 60, 0.6)');
      topGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.beginPath();
      ctx.arc(cx, cyTop, starVisualRadius * 3, 0, 2 * Math.PI);
      ctx.fillStyle = topGlow;
      ctx.fill();

      // Draw Star Core
      ctx.beginPath();
      ctx.arc(cx, cyTop, starVisualRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff7ed';
      ctx.fill();

      // Draw Planet
      const drawPlanetTop = () => {
        ctx.beginPath();
        ctx.arc(planetX, planetY, 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#60a5fa'; 
        ctx.fill();
        ctx.strokeStyle = '#1e3a8a'; 
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };

      if (Math.sin(angle) < 0) {
        drawPlanetTop(); 
        ctx.beginPath();
        ctx.arc(cx, cyTop, starVisualRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff7ed';
        ctx.fill();
      } else {
        drawPlanetTop(); 
      }

      // Distance Line
      ctx.beginPath();
      ctx.moveTo(cx, cyTop);
      ctx.lineTo(planetX, planetY);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)'; 
      ctx.lineWidth = 1;
      ctx.stroke();

      // Distance label
      const midX = (cx + planetX) / 2;
      const midY = (cyTop + planetY) / 2 - 9;
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`r = ${rAU.toFixed(2)} AU`, midX, midY);

      // Section label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = 'bold 8.5px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText("ORBIT VIEW (TOP-DOWN)", cx - maxRadius - 20, cyTop - maxRadius - 8);

      // 2. Observer's FRONT TRANSIT VIEW
      ctx.beginPath();
      ctx.moveTo(cx - pixelRadius, cyBottom);
      ctx.lineTo(cx + pixelRadius, cyBottom);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Star Glow
      const frontGradient = ctx.createRadialGradient(cx, cyBottom, frontStarRadius * 0.1, cx, cyBottom, frontStarRadius * 2.2);
      frontGradient.addColorStop(0, 'rgba(251, 146, 60, 0.8)');
      frontGradient.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.beginPath();
      ctx.arc(cx, cyBottom, frontStarRadius * 2.2, 0, 2 * Math.PI);
      ctx.fillStyle = frontGradient;
      ctx.fill();

      // Draw Star Core
      ctx.beginPath();
      ctx.arc(cx, cyBottom, frontStarRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff7ed';
      ctx.fill();

      // Horizontal coordinate
      const planetFrontX = cx + Math.cos(angle) * pixelRadius;
      const planetFrontY = cyBottom;

      if (!isBehindFront) {
        if (isTransiting) {
          ctx.beginPath();
          ctx.arc(planetFrontX, planetFrontY, 3.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#000000'; 
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(planetFrontX, planetFrontY, 4.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#60a5fa';
          ctx.fill();
          ctx.strokeStyle = '#1e3a8a';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else {
        const distFromCenterFront = Math.abs(Math.cos(normalizedAngle) * pixelRadius);
        if (distFromCenterFront > frontStarRadius) {
          ctx.beginPath();
          ctx.arc(planetFrontX, planetFrontY, 4.0, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(96, 165, 250, 0.3)'; 
          ctx.fill();
        }
      }

      // Section label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = 'bold 8.5px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText("TRANSIT VIEW FROM EARTH (FRONT VIEW)", cx - maxRadius - 20, cyBottom - frontStarRadius - 12);

      // 3. DYNAMIC LIGHT INTENSITY GRAPH
      const graphWidth = 260;
      const graphHeight = 35;

      // Graph container box
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.rect(cx - graphWidth / 2, cyGraph - graphHeight / 2, graphWidth, graphHeight);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Grid line representation (100% and 92% levels)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - graphWidth / 2, cyGraph - 10);
      ctx.lineTo(cx + graphWidth / 2, cyGraph - 10);
      ctx.moveTo(cx - graphWidth / 2, cyGraph + 10);
      ctx.lineTo(cx + graphWidth / 2, cyGraph + 10);
      ctx.stroke();

      // Light Intensity curve
      ctx.beginPath();
      for (let dx = -graphWidth / 2; dx <= graphWidth / 2; dx++) {
        const a = ((dx + graphWidth / 2) / graphWidth) * 2 * Math.PI;
        const b = getTransitBrightness(a);
        const yVal = cyGraph - 10 + (1.0 - b) * 250; 
        if (dx === -graphWidth / 2) {
          ctx.moveTo(cx + dx, yVal);
        } else {
          ctx.lineTo(cx + dx, yVal);
        }
      }
      ctx.strokeStyle = '#60a5fa'; 
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Timeline cursor line
      const indicatorX = cx - graphWidth / 2 + (normalizedAngle / (2 * Math.PI)) * graphWidth;
      const currentYVal = cyGraph - 10 + (1.0 - currentBrightness) * 250;

      ctx.beginPath();
      ctx.moveTo(indicatorX, cyGraph - graphHeight / 2);
      ctx.lineTo(indicatorX, cyGraph + graphHeight / 2);
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.35)'; 
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pink indicator dot
      ctx.beginPath();
      ctx.arc(indicatorX, currentYVal, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#f472b6'; 
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Labels on Graph
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = 'bold 8.5px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText("OBSERVED LIGHT INTENSITY", cx - graphWidth / 2, cyGraph - graphHeight / 2 - 6);

      ctx.textAlign = 'right';
      ctx.fillStyle = currentBrightness < 1.0 ? '#f472b6' : 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.fillText(`Light: ${(currentBrightness * 100).toFixed(1)}%`, cx + graphWidth / 2, cyGraph - graphHeight / 2 - 6);

      // Titles
      ctx.fillStyle = '#fff'; ctx.font = '600 13px Outfit,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText("Exoplanet Keplerian Orbit & Transit Simulation", cx, 40);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 10px Outfit,sans-serif';
      ctx.fillText("Observe the transit occlusion (small black dot) as it transits in front of the host star, dipping starlight.", cx, 57);
    }
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resizeBound);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    if (this.bhOverlay && this.bhOverlay.parentNode) {
      this.bhOverlay.parentNode.removeChild(this.bhOverlay);
    }
    if (this.exoplanetOverlay && this.exoplanetOverlay.parentNode) {
      this.exoplanetOverlay.parentNode.removeChild(this.exoplanetOverlay);
    }
  }
}

function IX_center(W, TASK_W) {
  return TASK_W + (W - TASK_W) / 2;
}
