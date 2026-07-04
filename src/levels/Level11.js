// Level 11: Gravity Constant
import { gameState } from '../core/GameState.js';

export class Level11 {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    // Simulation state
    this.time = 0;
    this.largeSphereRadius = 20; // Radius in pixels (10 to 35)

    this.activeTab = 'measuring-g';
    this.startTime = Date.now();
    this.periodDays = 100;
    this.starMassSolar = 1.0;

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

    // Create parameters overlay
    this.initOverlayUI();

    // Start loop
    this.animationId = requestAnimationFrame(this.animateBound);
  }

  initOverlayUI() {
    // 1. Cavendish Overlay (Measuring G)
    this.uiOverlay = document.createElement('div');
    this.uiOverlay.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 100;
      pointer-events: auto;
    `;
    this.container.appendChild(this.uiOverlay);
    
    this.uiOverlay.innerHTML = `
      <div class="bg-slate-900/95 border border-slate-800 p-4 rounded-2xl shadow-2xl w-[280px] font-sans text-slate-200 backdrop-blur-md">
        <h4 class="text-xs font-bold text-white mb-2.5 flex items-center gap-1.5">
          <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
          </svg>
          Cavendish Apparatus Controls
        </h4>
        
        <div class="space-y-3">
          <div class="flex justify-between text-[10px] text-slate-400">
            <span>Large Lead Sphere Radius:</span>
            <span id="cav-radius-text" class="text-violet-400 font-bold">20 px</span>
          </div>
          <input type="range" id="cav-spheres-slider" min="10" max="35" value="20" 
            class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500">
          
          <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1 text-[9.5px]">
            <div class="flex justify-between">
              <span class="text-slate-500">Lead Sphere Mass (M):</span>
              <span id="cav-mass-readout" class="text-amber-400 font-mono font-bold">0 kg</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Gravitational Torque:</span>
              <span id="cav-torque-readout" class="text-sky-400 font-mono font-bold">0 μN·m</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Torsion Deflection θ:</span>
              <span id="cav-deflection-readout" class="text-green-400 font-mono font-bold">0.00°</span>
            </div>
            <p class="text-[9px] text-slate-400 leading-relaxed mt-1.5 border-t border-slate-850 pt-1.5">
              Increasing the size of the large spheres increases their mass and gravitational pull, generating a larger torque that twists the suspended fiber.
            </p>
          </div>
        </div>
      </div>
    `;

    this.radiusTextEl = this.uiOverlay.querySelector('#cav-radius-text');
    this.massReadoutEl = this.uiOverlay.querySelector('#cav-mass-readout');
    this.torqueReadoutEl = this.uiOverlay.querySelector('#cav-torque-readout');
    this.deflectionReadoutEl = this.uiOverlay.querySelector('#cav-deflection-readout');
    
    const slider = this.uiOverlay.querySelector('#cav-spheres-slider');
    slider.addEventListener('input', (e) => {
      this.largeSphereRadius = parseInt(e.target.value);
      this.updateUI();
    });

    this.updateUI();

    // 2. Exoplanet Overlay
    this.exoplanetOverlay = document.createElement('div');
    this.exoplanetOverlay.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      bottom: 20px;
      width: 450px;
      z-index: 100;
      pointer-events: auto;
      overflow-y: auto;
      display: none;
    `;
    this.container.appendChild(this.exoplanetOverlay);

    this.exoplanetOverlay.innerHTML = `
      <div class="bg-slate-900/95 border border-slate-800 p-4 rounded-2xl shadow-2xl flex flex-col gap-4 text-slate-200 backdrop-blur-md">
        <h4 class="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/><path d="m13.56 11.747 4.332-.924"/><path d="m16 21-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/><path d="m6.158 8.633 1.114 4.456"/><path d="m8 21 3.105-6.21"/><circle cx="12" cy="13" r="2"/></svg>
          Exoplanet Orbit Parameters
        </h4>
        
        <div class="space-y-3.5">
          <div>
            <div class="flex justify-between text-[10px] mb-1">
              <span class="text-slate-400">Transit Period (T):</span>
              <span id="exo-period-readout" class="text-blue-400 font-bold">100 Days</span>
            </div>
            <input type="range" id="exo-period-slider" min="10" max="365" step="1" value="100"
              class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500">
          </div>
          
          <div>
            <div class="flex justify-between text-[10px] mb-1">
              <span class="text-slate-400">Host Star Mass (M):</span>
              <span id="exo-mass-readout" class="text-orange-400 font-bold">1.0 Solar Masses</span>
            </div>
            <input type="range" id="exo-mass-slider" min="0.1" max="3.0" step="0.1" value="1.0"
              class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500">
          </div>
        </div>

        <div class="border-t border-slate-800/80 pt-3">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Transit Light Curve</span>
          <div id="exo-lightcurve-container"></div>
        </div>

        <div class="border-t border-slate-800/80 pt-3 flex flex-col gap-3">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">The Physics of the Orbit</span>
          
          <div class="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 text-[10px] leading-relaxed">
            <p class="font-bold text-slate-400">Step 1: Equating forces</p>
            <p class="text-slate-400">Centripetal acceleration equals gravitational acceleration:</p>
            <div class="text-center font-mono text-white text-xs my-1">
              v² / r = GM / r²
            </div>
          </div>

          <div class="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 text-[10px] leading-relaxed">
            <p class="font-bold text-slate-400">Step 2: Substitute velocity</p>
            <p class="text-slate-400">Orbital speed around a circular path of circumference 2&pi;r:</p>
            <div class="text-center font-mono text-white text-xs my-1">
              v = 2&pi;r / T
            </div>
            <p class="text-slate-450 italic mt-0.5">Substitute v into Step 1: (2&pi;r / T)² = GM / r</p>
          </div>

          <div class="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 text-[10px] leading-relaxed">
            <p class="font-bold text-slate-400">Step 3: Solve for Distance (r)</p>
            <div class="text-center font-mono text-emerald-400 text-xs my-1">
              r = ∛(GMT² / 4&pi;²)
            </div>
          </div>

          <div class="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 text-[10px] leading-relaxed">
            <p class="font-bold text-slate-400">Step 4: Plug in measured values</p>
            <ul class="text-slate-400 space-y-0.5 list-disc list-inside">
              <li>G = 6.6743 &times; 10<sup>-11</sup> m³ kg<sup>-1</sup> s<sup>-2</sup></li>
              <li>M = <span id="exo-step4-mass">1.0</span> M<sub>&odot;</sub> = <span id="exo-step4-mass-kg">1.989e30</span> kg</li>
              <li>T = <span id="exo-step4-period">100</span> days = <span id="exo-step4-period-sec">8.64e6</span> s</li>
            </ul>
            <div id="exo-step4-r-au" class="text-center font-bold text-emerald-400 text-sm mt-2 border-t border-slate-850 pt-2">
              r = 0.422 AU
            </div>
            <div id="exo-step4-r-km" class="text-center text-[9px] text-slate-500">
              (63.1 million kilometers)
            </div>
          </div>
        </div>
      </div>
    `;

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

    this.updateExoplanetUI();
  }

  updateUI() {
    const volume = (4/3) * Math.PI * Math.pow(this.largeSphereRadius, 3);
    const maxVolume = (4/3) * Math.PI * Math.pow(35, 3);
    
    const theta = (volume / maxVolume) * 0.08;
    const angleDeg = (theta * 180 / Math.PI).toFixed(2);
    const forceMicroN = (volume / maxVolume * 0.15).toFixed(3);
    const leadMassKg = Math.round(volume * 0.0011);

    this.radiusTextEl.textContent = `${this.largeSphereRadius} px`;
    this.massReadoutEl.textContent = `${leadMassKg} kg`;
    this.torqueReadoutEl.textContent = `${forceMicroN} μN·m`;
    this.deflectionReadoutEl.textContent = `${angleDeg}°`;
  }

  updateExoplanetUI() {
    const G = 6.6743e-11;
    const M_SUN = 1.989e30;
    const SECONDS_IN_DAY = 86400;
    const AU_IN_METERS = 1.496e11;

    const starMassKg = this.starMassSolar * M_SUN;
    const periodSeconds = this.periodDays * SECONDS_IN_DAY;

    const rCubed = (G * starMassKg * Math.pow(periodSeconds, 2)) / (4 * Math.pow(Math.PI, 2));
    const rMeters = Math.pow(rCubed, 1 / 3);
    const rAU = rMeters / AU_IN_METERS;

    // Update overlay readouts
    const periodReadout = this.exoplanetOverlay.querySelector('#exo-period-readout');
    const massReadout = this.exoplanetOverlay.querySelector('#exo-mass-readout');
    if (periodReadout) periodReadout.textContent = `${this.periodDays} Days`;
    if (massReadout) massReadout.textContent = `${this.starMassSolar.toFixed(1)} Solar Masses`;

    // Update Step 4 items
    const step4Mass = this.exoplanetOverlay.querySelector('#exo-step4-mass');
    const step4MassKg = this.exoplanetOverlay.querySelector('#exo-step4-mass-kg');
    const step4Period = this.exoplanetOverlay.querySelector('#exo-step4-period');
    const step4PeriodSec = this.exoplanetOverlay.querySelector('#exo-step4-period-sec');
    const step4rAu = this.exoplanetOverlay.querySelector('#exo-step4-r-au');
    const step4rKm = this.exoplanetOverlay.querySelector('#exo-step4-r-km');

    if (step4Mass) step4Mass.textContent = this.starMassSolar.toFixed(1);
    if (step4MassKg) step4MassKg.textContent = starMassKg.toExponential(3);
    if (step4Period) step4Period.textContent = this.periodDays;
    if (step4PeriodSec) step4PeriodSec.textContent = periodSeconds.toExponential(3);
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
    const totalDays = periodDays * 3;
    const numPoints = 200;
    
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * totalDays;
      let brightness = 1.0;
      const timeInPeriod = x % periodDays;
      const transitWidthDays = periodDays * 0.1;
      
      if (timeInPeriod < transitWidthDays / 2 || timeInPeriod > periodDays - (transitWidthDays / 2)) {
         const distFromCenter = timeInPeriod < transitWidthDays / 2 ? timeInPeriod : periodDays - timeInPeriod;
         const normalizedDist = distFromCenter / (transitWidthDays / 2);
         brightness = 1.0 - (0.05 * (1 - Math.pow(normalizedDist, 2)));
      }
      points.push({ x, brightness });
    }

    const svgWidth = 400;
    const svgHeight = 120;
    const padding = 25;
    
    const getX = (val) => padding + (val / totalDays) * (svgWidth - padding * 2);
    const getY = (val) => padding + ((1.05 - val) / 0.1) * (svgHeight - padding * 2);

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.x)} ${getY(p.brightness)}`).join(' ');

    const t1X = getX(periodDays);
    const t2X = getX(periodDays * 2);
    const arrowY = 25;

    return `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-auto bg-slate-950/60 rounded-lg border border-slate-850 p-1">
        <!-- Grid lines -->
        <line x1="${padding}" y1="${getY(1.0)}" x2="${svgWidth-padding}" y2="${getY(1.0)}" stroke="#1e293b" stroke-width="1" stroke-dasharray="3 3" />
        
        <!-- The Light Curve -->
        <path d="${pathD}" fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-linejoin="round" />
        
        <!-- Measurement Arrows to show 'T' -->
        <line x1="${t1X}" y1="${arrowY}" x2="${t2X}" y2="${arrowY}" stroke="#f472b6" stroke-width="1.5" />
        <polygon points="${t1X},${arrowY} ${t1X+5},${arrowY-3} ${t1X+5},${arrowY+3}" fill="#f472b6" />
        <polygon points="${t2X},${arrowY} ${t2X-5},${arrowY-3} ${t2X-5},${arrowY+3}" fill="#f472b6" />
        
        <!-- Vertical markers for transits -->
        <line x1="${t1X}" y1="${arrowY}" x2="${t1X}" y2="${getY(0.95)}" stroke="#f472b6" stroke-width="0.8" stroke-dasharray="2 2" />
        <line x1="${t2X}" y1="${arrowY}" x2="${t2X}" y2="${getY(0.95)}" stroke="#f472b6" stroke-width="0.8" stroke-dasharray="2 2" />

        <!-- Label -->
        <text x="${(t1X + t2X) / 2}" y="${arrowY - 6}" fill="#f472b6" font-size="10" font-weight="bold" text-anchor="middle">
          Period (T) = ${periodDays}d
        </text>

        <!-- Axes Labels -->
        <text x="${padding}" y="${svgHeight - 4}" fill="#64748b" font-size="9" font-family="sans-serif">Time</text>
        <text x="8" y="${getY(1.0) - 4}" fill="#64748b" font-size="9" font-family="sans-serif" transform="rotate(-90 8 ${getY(1.0)})">Brightness</text>
      </svg>
    `;
  }

  setTab(tab) {
    this.activeTab = tab;
    if (tab === 'measuring-g') {
      this.uiOverlay.style.display = 'block';
      this.exoplanetOverlay.style.display = 'none';
    } else {
      this.uiOverlay.style.display = 'none';
      this.exoplanetOverlay.style.display = 'block';
      this.updateExoplanetUI();
    }
  }

  resize() {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
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

    const TASK_W = 400;

    if (this.activeTab === 'measuring-g') {
      // --- DRAW CAVENDISH TORSION BALANCE ---
      const cx = TASK_W + (W - TASK_W) / 2;
      const cy = H / 2 + 10;

      const casingRadius = 180; // Large casing circle
      const rodLength = 300;   // Large rod

      // Torsion/twist deflection math
      const volume = (4/3) * Math.PI * Math.pow(this.largeSphereRadius, 3);
      const maxVolume = (4/3) * Math.PI * Math.pow(35, 3);
      const theta = (volume / maxVolume) * 0.08; // Rod deflection twist angle (up to 4.6 degrees)

      // --- DRAW DETAILED PROTRACTOR DIALS (Enclosure scales) ---
      ctx.save();
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.2)';
      ctx.lineWidth = 1;
      
      // Draw tick marks on left and right scales
      const drawTicks = (baseAngle) => {
        for (let d = -12; d <= 12; d += 2) {
          const tickAngle = baseAngle + (d * Math.PI / 180);
          const startR = casingRadius - 4;
          const endR = casingRadius + 4;
          ctx.beginPath();
          ctx.moveTo(cx + startR * Math.cos(tickAngle), cy + startR * Math.sin(tickAngle));
          ctx.lineTo(cx + endR * Math.cos(tickAngle), cy + endR * Math.sin(tickAngle));
          ctx.stroke();

          // Numbers on main divisions
          if (d % 6 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '7.5px monospace';
            const labelR = casingRadius + 14;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${d > 0 ? '+' : ''}${d}°`, cx + labelR * Math.cos(tickAngle), cy + labelR * Math.sin(tickAngle));
          }
        }
      };
      
      drawTicks(Math.PI);
      drawTicks(0);
      ctx.restore();

      // Draw main casing ring (casingRadius)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, casingRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw central torsion wire hanging down from ceiling to mirror
      ctx.strokeStyle = 'rgba(148,163,184,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 170);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Draw Torsion rod (rotated by theta)
      const rx = (rodLength / 2) * Math.cos(theta);
      const ry = (rodLength / 2) * Math.sin(theta);

      ctx.save();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - rx, cy - ry);
      ctx.lineTo(cx + rx, cy + ry);
      ctx.stroke();

      // Pointer wires at the ends of the rod to read deflection on scale
      ctx.strokeStyle = '#f97316'; // orange pointer
      ctx.lineWidth = 1.2;
      // Left pointer
      ctx.beginPath();
      ctx.moveTo(cx - rx, cy - ry);
      ctx.lineTo(cx - (casingRadius - 4) * Math.cos(theta), cy - (casingRadius - 4) * Math.sin(theta));
      ctx.stroke();
      // Right pointer
      ctx.beginPath();
      ctx.moveTo(cx + rx, cy + ry);
      ctx.lineTo(cx + (casingRadius - 4) * Math.cos(theta), cy + (casingRadius - 4) * Math.sin(theta));
      ctx.stroke();

      // Small lead spheres (m)
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      // Small Sphere 1
      ctx.beginPath(); ctx.arc(cx - rx, cy - ry, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Small Sphere 2
      ctx.beginPath(); ctx.arc(cx + rx, cy + ry, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Central mirror plate on wire (representing the angle visualizer of the wire)
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.rect(cx - 6, cy - 4, 12, 8);
      ctx.fill(); ctx.stroke();
      ctx.restore();

      // --- STATIC LARGE SPHERES (M) ---
      // Positioned radially further out at largeRadius=185 to completely prevent overlap.
      const fixedAngle = 0.35; // Angle offset
      const largeRadius = 185;
      
      // Large Sphere 1 position (tilted slightly counterclockwise from left small sphere)
      const lx1 = cx - largeRadius * Math.cos(fixedAngle);
      const ly1 = cy - largeRadius * Math.sin(fixedAngle);
      
      // Large Sphere 2 position (tilted slightly counterclockwise from right small sphere)
      const lx2 = cx + largeRadius * Math.cos(fixedAngle);
      const ly2 = cy + largeRadius * Math.sin(fixedAngle);

      // Draw Large Spheres
      ctx.save();
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      // Sphere 1
      ctx.beginPath(); ctx.arc(lx1, ly1, this.largeSphereRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Sphere 2
      ctx.beginPath(); ctx.arc(lx2, ly2, this.largeSphereRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();

      // Labels
      ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 9.5px Outfit,sans-serif';
      ctx.fillText("M (Large Sphere)", lx1 - 20, ly1 - this.largeSphereRadius - 8);
      ctx.fillText("m", cx - rx - 18, cy - ry - 14);
      ctx.fillText("Casing Scale", cx - casingRadius + 10, cy - casingRadius - 10);

      // Subtitle headers
      ctx.fillStyle = '#fff'; ctx.font = '600 13px Outfit,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText("Cavendish Torsion Balance Setup", IX_center(W, TASK_W), 44);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 10px Outfit,sans-serif';
      ctx.fillText("Increasing sphere mass (M) increases gravitational pull, deflecting the torsion rod pointers along the protractor scale.", IX_center(W, TASK_W), 61);
    } else {
      // --- DRAW EXOPLANET ORBIT SIMULATION (TOP-DOWN, FRONT VIEW, & DYNAMIC LIGHT CURVE) ---
      const cx = TASK_W + (W - 450 - TASK_W) / 2;
      
      // Calculate vertical centers for three illustrations
      const cyTop = H * 0.24;
      const cyBottom = H * 0.54;
      const cyGraph = H * 0.83;

      // Orbit Simulation rendering - make radius smaller so three stacked views fit perfectly
      const maxRadius = Math.min(W - 450 - TASK_W, H / 3) / 2 - 12;
      const scale = maxRadius / 2.0; 
      
      // Physics constants
      const G_const = 6.6743e-11;
      const M_SUN_const = 1.989e30;
      const SECONDS_IN_DAY_const = 86400;
      const AU_IN_METERS_const = 1.496e11;

      const starMassKg = this.starMassSolar * M_SUN_const;
      const periodSeconds = this.periodDays * SECONDS_IN_DAY_const;

      const rCubed = (G_const * starMassKg * Math.pow(periodSeconds, 2)) / (4 * Math.pow(Math.PI, 2));
      const rMeters = Math.pow(rCubed, 1 / 3);
      const rAU = rMeters / AU_IN_METERS_const;

      // Star core visual radius
      const starVisualRadius = 12 + (this.starMassSolar * 3.5);
      const frontStarRadius = starVisualRadius * 1.5;

      // Adjust pixel radius so the planet orbits outside the star and transits correctly
      const pixelRadius = Math.max(rAU * scale * 2.5, frontStarRadius * 1.5);

      const elapsedMs = Date.now() - this.startTime;
      // Faster period = faster animation. Let's map 365 days to 10 seconds per rotation.
      const rotationSpeed = (365 / this.periodDays) * (2 * Math.PI / 10000); 
      const angle = elapsedMs * rotationSpeed;

      // Current normalized angle [0, 2*PI]
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

      // ----------------------------------------------------
      // 1. TOP-DOWN ORBIT VIEW (Moved up)
      // ----------------------------------------------------
      const planetX = cx + Math.cos(angle) * pixelRadius;
      const planetY = cyTop + Math.sin(angle) * pixelRadius;

      // Draw Orbit Path (Dashed circle)
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

      // Draw Planet (Top View)
      const drawPlanetTop = () => {
        ctx.beginPath();
        ctx.arc(planetX, planetY, 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#60a5fa'; // Blue-400
        ctx.fill();
        ctx.strokeStyle = '#1e3a8a'; // Blue-900
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };

      if (Math.sin(angle) < 0) {
        drawPlanetTop(); // Behind
        // Re-draw star core over it
        ctx.beginPath();
        ctx.arc(cx, cyTop, starVisualRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff7ed';
        ctx.fill();
      } else {
        drawPlanetTop(); // In front
      }

      // Distance Line
      ctx.beginPath();
      ctx.moveTo(cx, cyTop);
      ctx.lineTo(planetX, planetY);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)'; // Emerald-400
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

      // ----------------------------------------------------
      // 2. Observer's FRONT TRANSIT VIEW (Moved up)
      // ----------------------------------------------------
      
      // Draw horizontal reference line for transit plane
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

      // Horizontal coordinate in front view
      const planetFrontX = cx + Math.cos(angle) * pixelRadius;
      const planetFrontY = cyBottom;

      if (!isBehindFront) {
        // Planet is in front of the star (Transit phase)
        if (isTransiting) {
          // Inside the star's disk: small black dot moving in front of the host star
          ctx.beginPath();
          ctx.arc(planetFrontX, planetFrontY, 3.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#000000'; // Black dot silhouette
          ctx.fill();
        } else {
          // Outside the star's disk: regular blue planet dot
          ctx.beginPath();
          ctx.arc(planetFrontX, planetFrontY, 4.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#60a5fa';
          ctx.fill();
          ctx.strokeStyle = '#1e3a8a';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else {
        // Planet is behind the star: draw only if not occluded by star's disk
        const distFromCenterFront = Math.abs(Math.cos(normalizedAngle) * pixelRadius);
        if (distFromCenterFront > frontStarRadius) {
          ctx.beginPath();
          ctx.arc(planetFrontX, planetFrontY, 4.0, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(96, 165, 250, 0.3)'; // Dim blue dot
          ctx.fill();
        }
      }

      // Section label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = 'bold 8.5px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText("TRANSIT VIEW FROM EARTH (FRONT VIEW)", cx - maxRadius - 20, cyBottom - frontStarRadius - 12);

      // ----------------------------------------------------
      // 3. DYNAMIC LIGHT INTENSITY GRAPH (Synchronized)
      // ----------------------------------------------------
      const graphWidth = 260;
      const graphHeight = 35;

      // Draw Graph container box
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.rect(cx - graphWidth / 2, cyGraph - graphHeight / 2, graphWidth, graphHeight);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Draw Grid Line representation for 100% and 92% levels
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // 100% line
      ctx.moveTo(cx - graphWidth / 2, cyGraph - 10);
      ctx.lineTo(cx + graphWidth / 2, cyGraph - 10);
      // 92% line
      ctx.moveTo(cx - graphWidth / 2, cyGraph + 10);
      ctx.lineTo(cx + graphWidth / 2, cyGraph + 10);
      ctx.stroke();

      // Draw the Light Intensity curve
      ctx.beginPath();
      for (let dx = -graphWidth / 2; dx <= graphWidth / 2; dx++) {
        const a = ((dx + graphWidth / 2) / graphWidth) * 2 * Math.PI;
        const b = getTransitBrightness(a);

        // Map b (1.0 to 0.92) to Y coordinates
        // b = 1.0 is at cyGraph - 10, b = 0.92 is at cyGraph + 10
        const yVal = cyGraph - 10 + (1.0 - b) * 250; // 0.08 maps to 20px dip
        if (dx === -graphWidth / 2) {
          ctx.moveTo(cx + dx, yVal);
        } else {
          ctx.lineTo(cx + dx, yVal);
        }
      }
      ctx.strokeStyle = '#60a5fa'; // Bright blue path
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Draw current timeline cursor line (pink)
      const indicatorX = cx - graphWidth / 2 + (normalizedAngle / (2 * Math.PI)) * graphWidth;
      const currentYVal = cyGraph - 10 + (1.0 - currentBrightness) * 250;

      ctx.beginPath();
      ctx.moveTo(indicatorX, cyGraph - graphHeight / 2);
      ctx.lineTo(indicatorX, cyGraph + graphHeight / 2);
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.35)'; // Pink line
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw pink indicator dot
      ctx.beginPath();
      ctx.arc(indicatorX, currentYVal, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#f472b6'; // Pink indicator dot
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

      // Main header text titles
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
    if (this.uiOverlay && this.uiOverlay.parentNode) {
      this.uiOverlay.parentNode.removeChild(this.uiOverlay);
    }
    if (this.exoplanetOverlay && this.exoplanetOverlay.parentNode) {
      this.exoplanetOverlay.parentNode.removeChild(this.exoplanetOverlay);
    }
  }
}

function IX_center(W, TASK_W) {
  return TASK_W + (W - TASK_W) / 2;
}


