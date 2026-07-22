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
    this.activeTab = 'black-hole'; // 'black-hole' | 'exoplanet' | 'binomial'

    // Black Hole state
    this.gravityFactor = 0; // 0 to 80. At 50, light orbits. At >50, light is captured.

    // Exoplanet Orbit state
    this.periodDays = 100;
    this.starMassSolar = 1.0;

    // Binomial state (Task 3: Pascal Grid)
    this.bin_grid = this.generateInitialGrid();
    this.bin_active = null;
    this.bin_playing = false;
    this.bin_show_zeroes = true;
    this.bin_finished = false;
    this.bin_fractional_n = 0.5;
    this.lastStepTime = 0;

    // Binomial Apps state (Task 4: Series convergence)
    this.bin_x = 0.50;
    this.bin_terms = 3;
    
    // Roche Limit state (Task 6)
    this.roche_distance_ratio = 2.20;
    this.roche_density_ratio = 0.26;

    // Tidal Lock state (Task 7)
    this.lock_a = 2.50; // equivalent to orbitRadius = 250
    this.lock_M = 1.0;  // equivalent to planetMass = 10000
    this.lock_omega_ratio = 1.05; // 5% spin kick above synchronicity
    this.lock_k2_q = 30; // default friction slider val is 30
    this.lock_sim_speed = 100; // default speed slider val is 100%
    this.lock_sim_running = false;
    this.lock_orbit_angle = 0; // position moon on the right side
    this.lock_moon_angle = 0;  // align spin orientation to 0
    this.lock_spin_w = Math.sqrt(10000 / 250) * 1.05; // pre-initialize spin rate

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
    if (this.rocheOverlay) this.rocheOverlay.style.display = 'none';
    if (this.tidalLockOverlay) this.tidalLockOverlay.style.display = 'none';
    if (this.lunarPerturbOverlay) this.lunarPerturbOverlay.style.display = 'none';

    if (tab === 'black-hole') {
      this.bhOverlay.style.display = 'block';
      this.exoplanetOverlay.style.display = 'none';
      if (this.binomialOverlay) this.binomialOverlay.style.display = 'none';
      if (this.binomialAppsOverlay) this.binomialAppsOverlay.style.display = 'none';
    } else if (tab === 'exoplanet') {
      this.bhOverlay.style.display = 'none';
      this.exoplanetOverlay.style.display = 'block';
      if (this.binomialOverlay) this.binomialOverlay.style.display = 'none';
      if (this.binomialAppsOverlay) this.binomialAppsOverlay.style.display = 'none';
      this.updateExoplanetUI();
    } else if (tab === 'binomial') {
      this.bhOverlay.style.display = 'none';
      this.exoplanetOverlay.style.display = 'none';
      if (this.binomialOverlay) {
        this.binomialOverlay.style.display = 'block';
        this.updateBinomialOverlayUI();
      }
    } else if (tab === 'binomial-apps' || tab === 'tidal-force') {
      this.bhOverlay.style.display = 'none';
      this.exoplanetOverlay.style.display = 'none';
      if (this.binomialOverlay) this.binomialOverlay.style.display = 'none';
    } else if (tab === 'roche-limit') {
      this.bhOverlay.style.display = 'none';
      this.exoplanetOverlay.style.display = 'none';
      if (this.binomialOverlay) this.binomialOverlay.style.display = 'none';
      if (this.rocheOverlay) this.rocheOverlay.style.display = 'block';
    } else if (tab === 'tidal-lock') {
      this.bhOverlay.style.display = 'none';
      this.exoplanetOverlay.style.display = 'none';
      if (this.binomialOverlay) this.binomialOverlay.style.display = 'none';
      if (this.tidalLockOverlay) this.tidalLockOverlay.style.display = 'block';
    } else if (tab === 'lunar-perturbation') {
      this.bhOverlay.style.display = 'none';
      this.exoplanetOverlay.style.display = 'none';
      if (this.binomialOverlay) this.binomialOverlay.style.display = 'none';
      if (this.lunarPerturbOverlay) this.lunarPerturbOverlay.style.display = 'block';
    }
  }

  setRocheParams(dist, density) {
    this.roche_distance_ratio = dist;
    this.roche_density_ratio = density;
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

    // 3. Binomial Overlay (Pascal Grid)
    this.binomialOverlay = document.createElement('div');
    this.binomialOverlay.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 100;
      pointer-events: auto;
      display: none;
    `;
    this.container.appendChild(this.binomialOverlay);

    this.binomialOverlay.innerHTML = `
      <div class="bg-slate-900/95 border border-slate-800 p-4 rounded-2xl shadow-2xl w-[290px] font-sans text-slate-200 backdrop-blur-md flex flex-col gap-3 max-h-[calc(100vh-60px)] overflow-y-auto custom-scrollbar">
        <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
          <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Pascal Grid Controls
        </h4>

        <!-- Controls -->
        <div class="grid grid-cols-2 gap-2">
          <button id="bin-play-btn" class="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1.5 px-3 rounded text-xs transition">
            Auto Play
          </button>
          <button id="bin-step-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-1.5 px-3 rounded text-xs transition">
            Step
          </button>
          <button id="bin-fill-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-1.5 px-3 rounded text-xs transition">
            Fill All
          </button>
          <button id="bin-reset-btn" class="bg-rose-900/40 border border-rose-800/60 text-rose-300 font-semibold py-1.5 px-3 rounded text-xs transition">
            Reset
          </button>
        </div>

        <label class="flex items-center gap-2 cursor-pointer mt-1 select-none">
          <input type="checkbox" id="bin-show-zeroes" checked class="w-3.5 h-3.5 bg-slate-800 border-slate-700 rounded text-cyan-500 focus:ring-0">
          <span class="text-[10px] text-slate-300">Show Out-of-Bounds Zeroes</span>
        </label>

        <!-- Fractional slider -->
        <div class="border-t border-slate-800 pt-2 flex flex-col gap-1">
          <div class="flex justify-between text-[10px] text-slate-400">
            <span>Fractional Power (n):</span>
            <span id="bin-frac-readout" class="text-purple-400 font-bold font-mono">0.50</span>
          </div>
          <input type="range" id="bin-frac-slider" min="-5" max="5" value="0.5" step="0.1"
            class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500">
        </div>

        <!-- Active Calculation Card -->
        <div id="bin-calc-card" class="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 text-[10px] leading-relaxed flex flex-col gap-1.5">
          <span class="font-bold text-slate-400 flex items-center gap-1">
            Active Calculation
          </span>
          <div id="bin-calc-body" class="text-slate-400 font-mono text-[9px]">
            Click Step or Auto Play to begin extrapolating the matrix.
          </div>
        </div>

        <!-- Explanation card -->
        <div class="bg-slate-950/20 border border-slate-800 p-2.5 rounded-lg text-[9px] text-slate-400 leading-relaxed">
          <span class="font-semibold text-slate-200 block mb-0.5">Newton's Addition Rule:</span>
          In Pascal's triangle, <strong>Below = Target + Left</strong>.<br>
          Newton rearranged this algebraically to expand upwards:
          <span class="block text-center text-emerald-400 font-mono font-bold my-0.5 text-[10px]">Target = Below − Left</span>
        </div>
      </div>
    `;

    const binPlayBtn = this.binomialOverlay.querySelector('#bin-play-btn');
    const binStepBtn = this.binomialOverlay.querySelector('#bin-step-btn');
    const binFillBtn = this.binomialOverlay.querySelector('#bin-fill-btn');
    const binResetBtn = this.binomialOverlay.querySelector('#bin-reset-btn');
    const binShowZeroesCb = this.binomialOverlay.querySelector('#bin-show-zeroes');
    const binFracSliderActual = this.binomialOverlay.querySelector('#bin-frac-slider');

    binPlayBtn.addEventListener('click', () => {
      this.bin_playing = !this.bin_playing;
      binPlayBtn.textContent = this.bin_playing ? 'Pause' : 'Auto Play';
      binPlayBtn.className = this.bin_playing ? 'bg-amber-600 hover:bg-amber-500 text-white font-semibold py-1.5 px-3 rounded text-xs transition' : 'bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1.5 px-3 rounded text-xs transition';
    });

    binStepBtn.addEventListener('click', () => {
      this.calculateBinomialStep();
    });

    binFillBtn.addEventListener('click', () => {
      this.handleBinomialFastForward();
    });

    binResetBtn.addEventListener('click', () => {
      this.handleBinomialReset();
      binPlayBtn.textContent = 'Auto Play';
      binPlayBtn.className = 'bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1.5 px-3 rounded text-xs transition';
    });

    binShowZeroesCb.addEventListener('change', (e) => {
      this.bin_show_zeroes = e.target.checked;
    });

    binFracSliderActual.addEventListener('input', (e) => {
      this.bin_fractional_n = parseFloat(e.target.value);
      this.updateBinomialOverlayUI();
    });

    // 4. Binomial Apps Overlay (Removed as requested)
    this.binomialAppsOverlay = null;

    // 5. Roche Limit Overlay (Parameter Panel in Illustration Area)
    this.rocheOverlay = document.createElement('div');
    this.rocheOverlay.style.cssText = `
      position: absolute;
      top: 240px;
      right: 20px;
      z-index: 9999;
      pointer-events: auto;
      display: none;
    `;
    document.body.appendChild(this.rocheOverlay);

    this.rocheOverlay.innerHTML = `
      <div class="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-2xl w-[310px] font-sans text-slate-200 backdrop-blur-md flex flex-col gap-2">
        <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
          <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
          </svg>
          Interactive Simulation Controls
        </h4>
        
        <div class="space-y-2.5">
          <div class="flex flex-col gap-1">
            <div class="flex justify-between text-[10.5px]">
              <span class="text-slate-300">Orbital Distance (d / R<sub>Primary</sub>):</span>
              <span id="roche-dist-val-canvas" class="font-bold text-amber-400 font-mono">2.20</span>
            </div>
            <input type="range" id="roche-dist-slider-canvas" min="1.0" max="4.0" step="0.05" value="2.20" 
              class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500">
          </div>

          <div class="flex flex-col gap-1">
            <div class="flex justify-between text-[10.5px]">
              <span class="text-slate-300">Density Ratio (ρ<sub>Primary</sub> / ρ<sub>Satellite</sub>):</span>
              <span id="roche-density-val-canvas" class="font-bold text-cyan-400 font-mono">0.26</span>
            </div>
            <input type="range" id="roche-density-slider-canvas" min="0.10" max="1.00" step="0.02" value="0.26" 
              class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500">
          </div>
          
          <p class="text-[9px] text-slate-400 italic border-t border-slate-800/80 pt-1.5 mt-0.5">
            Tune distance below the red Roche boundary to disrupt planet into a ring!
          </p>
        </div>
      </div>
    `;

    const distSliderCanvas = this.rocheOverlay.querySelector('#roche-dist-slider-canvas');
    const distValCanvas = this.rocheOverlay.querySelector('#roche-dist-val-canvas');
    const densitySliderCanvas = this.rocheOverlay.querySelector('#roche-density-slider-canvas');
    const densityValCanvas = this.rocheOverlay.querySelector('#roche-density-val-canvas');

    distSliderCanvas.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.roche_distance_ratio = val;
      distValCanvas.textContent = val.toFixed(2);
    });

    densitySliderCanvas.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.roche_density_ratio = val;
      densityValCanvas.textContent = val.toFixed(2);
    });

    // 6. Tidal Lock Overlay (Parameter Panel placed directly under derivation text at top: 240px, right: 20px)
    this.tidalLockOverlay = document.createElement('div');
    this.tidalLockOverlay.style.cssText = `
      position: absolute;
      top: 240px;
      right: 20px;
      z-index: 9999;
      pointer-events: auto;
      display: none;
    `;
    document.body.appendChild(this.tidalLockOverlay);

    this.tidalLockOverlay.innerHTML = `
      <div class="bg-slate-900/95 border border-slate-800 p-3 rounded-2xl shadow-2xl w-[310px] font-sans text-slate-200 backdrop-blur-md flex flex-col gap-2 pointer-events-auto">
        <div class="flex justify-between items-center mb-0.5">
          <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
            <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tidal Locking Simulation Controls
          </h4>
        </div>
        
        <div class="space-y-1.5 pointer-events-auto">
          <div class="flex flex-col gap-0.5">
            <div class="flex justify-between text-[10px]">
              <span class="text-slate-300">Tidal Dissipation (Friction):</span>
              <span id="tidelock-dissipation-val" class="font-bold text-emerald-400 font-mono">30</span>
            </div>
            <input type="range" id="tidelock-dissipation-slider" min="0" max="100" value="30" 
              class="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 pointer-events-auto">
          </div>

          <div class="flex gap-2 pt-1 pointer-events-auto">
            <button id="tidelock-play-btn" class="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition pointer-events-auto">
              Play Simulation
            </button>
            <button id="tidelock-reset-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-1.5 px-3 rounded-lg text-xs transition border border-slate-700 pointer-events-auto">
              Reset
            </button>
          </div>
        </div>
      </div>
    `;

    const dissipationSlider = this.tidalLockOverlay.querySelector('#tidelock-dissipation-slider');
    const dissipationVal = this.tidalLockOverlay.querySelector('#tidelock-dissipation-val');

    const playBtnTL = this.tidalLockOverlay.querySelector('#tidelock-play-btn');
    const resetBtnTL = this.tidalLockOverlay.querySelector('#tidelock-reset-btn');

    const setupSlider = (sliderEl, updateFn) => {
      ['pointerdown', 'mousedown', 'touchstart'].forEach(evtName => {
        sliderEl.addEventListener(evtName, (e) => e.stopPropagation());
      });
      const onInput = () => {
        const val = parseFloat(sliderEl.value);
        updateFn(val);
      };
      sliderEl.addEventListener('input', onInput);
      sliderEl.addEventListener('change', onInput);
    };

    // Hardcode the physics settings from the reference file `tidal`
    this.lock_a = 2.50; // equivalent to orbitRadius = 250 (scaled to fit screen coords)
    this.lock_M = 1.0;  // equivalent to planetMass = 10000
    this.lock_omega_ratio = 1.05; // 5% faster than orbital velocity for quick lock oscillation demonstration

    // Sliders
    setupSlider(dissipationSlider, (val) => {
      this.lock_k2_q = val; // maps directly to the slider value [0, 100]
      dissipationVal.textContent = val.toFixed(0);
    });

    playBtnTL.addEventListener('click', (e) => {
      e.stopPropagation();
      this.lock_sim_running = !this.lock_sim_running;
      
      const omega_orbit = Math.sqrt(10000 / 250);
      const spinDiff = Math.abs(this.lock_spin_w - omega_orbit);
      
      // If playing and already tidally locked, reset spin to 5% kick so lock sequence runs again
      if (this.lock_sim_running && spinDiff < 0.0002) {
        this.lock_spin_w = omega_orbit * 1.05;
        this.lock_moon_angle = this.lock_orbit_angle || 0;
      }

      playBtnTL.textContent = this.lock_sim_running ? 'Pause' : 'Play Simulation';
      playBtnTL.className = this.lock_sim_running 
        ? 'flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition pointer-events-auto' 
        : 'flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition pointer-events-auto';
    });

    resetBtnTL.addEventListener('click', (e) => {
      e.stopPropagation();
      this.lock_sim_running = false;
      const omega_orbit = Math.sqrt(10000 / 250);
      this.lock_orbit_angle = 0;
      this.lock_moon_angle = 0;
      this.lock_spin_w = omega_orbit * 1.05;
      dissipationSlider.value = 30;
      this.lock_k2_q = 30;
      dissipationVal.textContent = '30';
      this.lock_sim_speed = 100; // locked to 100%
      playBtnTL.textContent = 'Play Simulation';
      playBtnTL.className = 'flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition pointer-events-auto';
    });

    // 7. Lunar Perturbation Overlay (Parameter Panel placed at top: 240px, right: 20px)
    this.lunar_sun_mult = 1.0;
    this.lunar_earth_dist_mult = 1.0;
    this.lunar_moon_vel_scale = 1.0;
    this.lunar_show_vectors = true;
    this.lunar_show_apsidal = true;
    this.lunar_sim_running = true;
    this.lunar_active_force = 'all';
    this.lunar_time = 0;
    this.lunar_moon_state = { initialized: false, trail: [] };

    this.lunarPerturbOverlay = document.createElement('div');
    this.lunarPerturbOverlay.style.cssText = `
      position: absolute;
      top: 240px;
      right: 20px;
      z-index: 9999;
      pointer-events: auto;
      display: none;
    `;
    document.body.appendChild(this.lunarPerturbOverlay);

    this.lunarPerturbOverlay.innerHTML = `
      <div class="bg-slate-900/95 border border-slate-800 p-3 rounded-2xl shadow-2xl w-[310px] font-sans text-slate-200 backdrop-blur-md flex flex-col gap-2 pointer-events-auto">
        <div class="flex justify-between items-center mb-0.5">
          <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
            <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            Lunar Perturbation Controls
          </h4>
        </div>
        
        <div class="space-y-2 pointer-events-auto">
          <div class="flex flex-col gap-0.5">
            <div class="flex justify-between text-[10px]">
              <span class="text-slate-300">Sun Mass (M<sub>S</sub>):</span>
              <span id="lunar-sun-val" class="font-bold text-amber-400 font-mono">1.0x</span>
            </div>
            <input type="range" id="lunar-sun-slider" min="0.5" max="30" step="0.5" value="1.0" 
              class="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 pointer-events-auto">
          </div>

          <div class="flex flex-col gap-0.5">
            <div class="flex justify-between text-[10px]">
              <span class="text-slate-300">Earth Orbit Distance (R<sub>E</sub>):</span>
              <span id="lunar-dist-val" class="font-bold text-sky-400 font-mono">1.0x</span>
            </div>
            <input type="range" id="lunar-dist-slider" min="0.5" max="2.0" step="0.1" value="1.0" 
              class="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 pointer-events-auto">
          </div>

          <div class="flex flex-col gap-0.5">
            <div class="flex justify-between text-[10px]">
              <span class="text-slate-300">Moon Initial Velocity (v<sub>0</sub>):</span>
              <span id="lunar-vel-val" class="font-bold text-indigo-400 font-mono">1.00x</span>
            </div>
            <input type="range" id="lunar-vel-slider" min="0.6" max="1.2" step="0.01" value="1.0" 
              class="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 pointer-events-auto">
          </div>

          <div class="flex gap-1.5 pt-1 pointer-events-auto">
            <button id="lunar-apsidal-btn" class="flex-1 bg-violet-600/40 border border-violet-500 text-violet-200 font-bold py-1 px-2 rounded-lg text-[10.5px] transition pointer-events-auto">
              Toggle Orbit Axis
            </button>
            <button id="lunar-vectors-btn" class="flex-1 bg-amber-600/40 border border-amber-500 text-amber-200 font-bold py-1 px-2 rounded-lg text-[10.5px] transition pointer-events-auto">
              Toggle Vectors
            </button>
          </div>

          <div id="lunar-force-modes" class="flex gap-1 pt-0.5 pointer-events-auto">
            <button id="lunar-force-all" class="flex-1 bg-slate-800 border border-slate-600 text-amber-400 font-bold py-0.5 px-1.5 rounded text-[9.5px] transition pointer-events-auto">
              All Forces
            </button>
            <button id="lunar-force-rad" class="flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold py-0.5 px-1.5 rounded text-[9.5px] transition pointer-events-auto">
              Radial
            </button>
            <button id="lunar-force-trans" class="flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold py-0.5 px-1.5 rounded text-[9.5px] transition pointer-events-auto">
              Transverse
            </button>
          </div>

          <div class="flex gap-2 pt-0.5 pointer-events-auto">
            <button id="lunar-play-btn" class="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition pointer-events-auto">
              Pause
            </button>
            <button id="lunar-reset-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-1.5 px-3 rounded-lg text-xs transition border border-slate-700 pointer-events-auto">
              Reset
            </button>
          </div>
        </div>
      </div>
    `;

    const sunSlider = this.lunarPerturbOverlay.querySelector('#lunar-sun-slider');
    const sunVal = this.lunarPerturbOverlay.querySelector('#lunar-sun-val');
    const distSlider = this.lunarPerturbOverlay.querySelector('#lunar-dist-slider');
    const distVal = this.lunarPerturbOverlay.querySelector('#lunar-dist-val');
    const velSlider = this.lunarPerturbOverlay.querySelector('#lunar-vel-slider');
    const velVal = this.lunarPerturbOverlay.querySelector('#lunar-vel-val');

    const apsidalBtn = this.lunarPerturbOverlay.querySelector('#lunar-apsidal-btn');
    const vectorsBtn = this.lunarPerturbOverlay.querySelector('#lunar-vectors-btn');
    const playBtnLP = this.lunarPerturbOverlay.querySelector('#lunar-play-btn');
    const resetBtnLP = this.lunarPerturbOverlay.querySelector('#lunar-reset-btn');

    setupSlider(sunSlider, (val) => {
      this.lunar_sun_mult = val;
      sunVal.textContent = `${val.toFixed(1)}x`;
      this.lunar_moon_state.initialized = false;
    });

    setupSlider(distSlider, (val) => {
      this.lunar_earth_dist_mult = val;
      distVal.textContent = `${val.toFixed(1)}x`;
      this.lunar_moon_state.initialized = false;
    });

    setupSlider(velSlider, (val) => {
      this.lunar_moon_vel_scale = val;
      velVal.textContent = `${val.toFixed(2)}x`;
      this.lunar_moon_state.initialized = false;
    });

    apsidalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.lunar_show_apsidal = !this.lunar_show_apsidal;
      apsidalBtn.className = this.lunar_show_apsidal
        ? 'flex-1 bg-violet-600/40 border border-violet-500 text-violet-200 font-bold py-1 px-2 rounded-lg text-[10.5px] transition pointer-events-auto'
        : 'flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-1 px-2 rounded-lg text-[10.5px] border border-slate-700 transition pointer-events-auto';
    });

    vectorsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.lunar_show_vectors = !this.lunar_show_vectors;
      vectorsBtn.className = this.lunar_show_vectors
        ? 'flex-1 bg-amber-600/40 border border-amber-500 text-amber-200 font-bold py-1 px-2 rounded-lg text-[10.5px] transition pointer-events-auto'
        : 'flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-1 px-2 rounded-lg text-[10.5px] border border-slate-700 transition pointer-events-auto';
    });

    const btnForceAll = this.lunarPerturbOverlay.querySelector('#lunar-force-all');
    const btnForceRad = this.lunarPerturbOverlay.querySelector('#lunar-force-rad');
    const btnForceTrans = this.lunarPerturbOverlay.querySelector('#lunar-force-trans');

    const updateForceButtons = () => {
      btnForceAll.className = (this.lunar_active_force === 'all')
        ? 'flex-1 bg-slate-800 border border-slate-500 text-amber-400 font-bold py-0.5 px-1.5 rounded text-[9.5px] transition pointer-events-auto'
        : 'flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold py-0.5 px-1.5 rounded text-[9.5px] transition pointer-events-auto';
      btnForceRad.className = (this.lunar_active_force === 'radial')
        ? 'flex-1 bg-slate-800 border border-red-500/80 text-red-400 font-bold py-0.5 px-1.5 rounded text-[9.5px] transition pointer-events-auto'
        : 'flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold py-0.5 px-1.5 rounded text-[9.5px] transition pointer-events-auto';
      btnForceTrans.className = (this.lunar_active_force === 'transverse')
        ? 'flex-1 bg-slate-800 border border-green-500/80 text-green-400 font-bold py-0.5 px-1.5 rounded text-[9.5px] transition pointer-events-auto'
        : 'flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold py-0.5 px-1.5 rounded text-[9.5px] transition pointer-events-auto';
    };

    btnForceAll.addEventListener('click', (e) => { e.stopPropagation(); this.lunar_active_force = 'all'; updateForceButtons(); });
    btnForceRad.addEventListener('click', (e) => { e.stopPropagation(); this.lunar_active_force = 'radial'; updateForceButtons(); });
    btnForceTrans.addEventListener('click', (e) => { e.stopPropagation(); this.lunar_active_force = 'transverse'; updateForceButtons(); });

    playBtnLP.addEventListener('click', (e) => {
      e.stopPropagation();
      this.lunar_sim_running = !this.lunar_sim_running;
      playBtnLP.textContent = this.lunar_sim_running ? 'Pause' : 'Play Simulation';
      playBtnLP.className = this.lunar_sim_running
        ? 'flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition pointer-events-auto'
        : 'flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition pointer-events-auto';
    });

    resetBtnLP.addEventListener('click', (e) => {
      e.stopPropagation();
      this.lunar_sun_mult = 1.0;
      this.lunar_earth_dist_mult = 1.0;
      this.lunar_moon_vel_scale = 1.0;
      this.lunar_show_apsidal = true;
      this.lunar_show_vectors = true;
      this.lunar_sim_running = true;
      this.lunar_moon_state.initialized = false;
      this.lunar_moon_state.trail = [];
      this.lunar_moon_state.activeTrail = [];
      this.lunar_time = 0;

      sunSlider.value = 1.0; sunVal.textContent = '1.0x';
      distSlider.value = 1.0; distVal.textContent = '1.0x';
      velSlider.value = 1.0; velVal.textContent = '1.00x';
      playBtnLP.textContent = 'Pause';
      playBtnLP.className = 'flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition pointer-events-auto';
      apsidalBtn.className = 'flex-1 bg-violet-600/40 border border-violet-500 text-violet-200 font-bold py-1 px-2 rounded-lg text-[10.5px] transition pointer-events-auto';
      vectorsBtn.className = 'flex-1 bg-amber-600/40 border border-amber-500 text-amber-200 font-bold py-1 px-2 rounded-lg text-[10.5px] transition pointer-events-auto';
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

    // Auto-step Binomial Grid (Task 3)
    if (this.activeTab === 'binomial' && this.bin_playing) {
      const now = Date.now();
      if (now - this.lastStepTime > 800) {
        this.calculateBinomialStep();
        this.lastStepTime = now;
      }
    }

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

    } else if (this.activeTab === 'exoplanet') {
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
    } else if (this.activeTab === 'binomial') {
      this.drawBinomial(ctx, W, H, TASK_W);
    } else if (this.activeTab === 'binomial-apps') {
      this.drawBinomialApps(ctx, W, H, TASK_W);
    } else if (this.activeTab === 'tidal-force') {
      this.drawTidalForce(ctx, W, H, TASK_W);
    } else if (this.activeTab === 'roche-limit') {
      this.drawRocheLimit(ctx, W, H, TASK_W);
    } else if (this.activeTab === 'tidal-lock') {
      this.drawTidalLock(ctx, W, H, TASK_W);
    } else if (this.activeTab === 'lunar-perturbation') {
      this.drawLunarPerturbation(ctx, W, H, TASK_W);
    }
  }

  updateBinomialOverlayUI() {
    if (!this.binomialOverlay) return;
    const fracReadout = this.binomialOverlay.querySelector('#bin-frac-readout');
    if (fracReadout) fracReadout.textContent = this.bin_fractional_n.toFixed(2);

    const calcBody = this.binomialOverlay.querySelector('#bin-calc-body');
    if (calcBody) {
      if (this.bin_active) {
        const valBelow = this.bin_grid[this.bin_active.n + 1]?.[this.bin_active.k] ?? 0;
        const valLeft = this.bin_grid[this.bin_active.n]?.[this.bin_active.k - 1] ?? 0;
        const valTarget = this.bin_grid[this.bin_active.n][this.bin_active.k] ?? 0;
        calcBody.innerHTML = `
          Finding: Row <span class="text-cyan-300 font-bold">n = ${this.bin_active.n}</span>, Term <span class="text-cyan-300 font-bold">k = ${this.bin_active.k}</span><br>
          Formula: <span class="text-cyan-300">Target</span> = <span class="text-emerald-400">Below</span> − <span class="text-rose-400">Left</span><br>
          <div class="h-px bg-slate-800 my-1"></div>
          Below (n=${this.bin_active.n + 1}, k=${this.bin_active.k}): <span class="text-emerald-300 font-bold">${valBelow}</span><br>
          Left (n=${this.bin_active.n}, k=${this.bin_active.k - 1}): <span class="text-rose-300 font-bold">${valLeft}</span><br>
          <div class="text-[10px] text-white mt-1">
            Value = <span class="text-emerald-400">${valBelow}</span> − (<span class="text-rose-400">${valLeft}</span>) = <span class="font-bold text-cyan-400">${valTarget}</span>
          </div>
        `;
      } else if (this.bin_finished) {
        calcBody.innerHTML = `
          <div class="text-cyan-400 font-bold text-center">Calculation Complete!</div>
          <div class="text-[8.5px] text-slate-400 mt-1">Newton successfully extended Pascal's Triangle to negative integers.</div>
        `;
      } else {
        calcBody.textContent = 'Click Step or Auto Play to begin extrapolating the matrix.';
      }
    }
  }

  updateBinomialAppsUI() {
    if (!this.binomialAppsOverlay) return;
    const readoutX = this.binomialAppsOverlay.querySelector('#bin-x-readout');
    const readoutTerms = this.binomialAppsOverlay.querySelector('#bin-terms-readout');
    const exactEl = this.binomialAppsOverlay.querySelector('#bin-area-exact');
    const approxEl = this.binomialAppsOverlay.querySelector('#bin-area-approx');
    const errorEl = this.binomialAppsOverlay.querySelector('#bin-area-error');

    if (readoutX) readoutX.textContent = this.bin_x.toFixed(2);
    if (readoutTerms) readoutTerms.textContent = `${this.bin_terms} Term${this.bin_terms > 1 ? 's' : ''}`;

    const exactArea = 0.5 * this.bin_x * Math.sqrt(1 - this.bin_x * this.bin_x) + 0.5 * Math.asin(this.bin_x);
    const approxArea = this.getBinomialApprox(this.bin_x, this.bin_terms);
    const error = Math.abs(exactArea - approxArea);

    if (exactEl) exactEl.textContent = exactArea.toFixed(5);
    if (approxEl) approxEl.textContent = approxArea.toFixed(5);
    if (errorEl) errorEl.textContent = error.toFixed(5);
  }

  getBinomialApprox(x, n) {
    let sum = 0;
    const coefficients = [
      1.0,
      -1.0 / 6.0,
      -1.0 / 40.0,
      -1.0 / 112.0,
      -5.0 / 1152.0,
      -7.0 / 2816.0
    ];
    for (let i = 0; i < n; i++) {
      sum += coefficients[i] * Math.pow(x, 2 * i + 1);
    }
    return sum;
  }

  generateInitialGrid() {
    const MIN_N = -5;
    const MAX_N = 5;
    const MIN_K = -1;
    const MAX_K = 5;
    const g = {};
    for (let n = MIN_N; n <= MAX_N; n++) {
      g[n] = {};
      for (let k = MIN_K; k <= MAX_K; k++) {
        if (k === -1) {
          g[n][k] = 0;
        } else if (n >= 0) {
          g[n][k] = this.getBinomialCoeff(n, k);
        } else {
          g[n][k] = null;
        }
      }
    }
    return g;
  }

  getBinomialCoeff(n, k) {
    if (k === 0) return 1;
    if (k < 0) return 0;
    let res = 1;
    for (let i = 1; i <= k; i++) {
      res = res * (n - i + 1) / i;
    }
    return Math.abs(Math.round(res) - res) < 0.0001 ? Math.round(res) : Number(res.toFixed(3));
  }

  getNextCell(currentActive) {
    const MIN_N = -5;
    const MAX_N = 5;
    const MIN_K = -1;
    const MAX_K = 5;

    if (!currentActive) {
      return { n: -1, k: 0 };
    }
    let nextN = currentActive.n;
    let nextK = currentActive.k + 1;

    if (nextK > MAX_K) {
      nextN = currentActive.n - 1;
      nextK = 0;
    }

    if (nextN < MIN_N) {
      return null;
    }
    return { n: nextN, k: nextK };
  }

  calculateBinomialStep() {
    const nextCell = this.getNextCell(this.bin_active);
    if (!nextCell) {
      this.bin_playing = false;
      this.bin_finished = true;
      this.updateBinomialOverlayUI();
      return;
    }

    this.bin_active = nextCell;
    const valBelow = this.bin_grid[nextCell.n + 1]?.[nextCell.k] ?? 0;
    const valLeft = this.bin_grid[nextCell.n]?.[nextCell.k - 1] ?? 0;
    this.bin_grid[nextCell.n][nextCell.k] = valBelow - valLeft;

    this.updateBinomialOverlayUI();
  }

  handleBinomialReset() {
    this.bin_playing = false;
    this.bin_finished = false;
    this.bin_active = null;
    this.bin_grid = this.generateInitialGrid();
    this.updateBinomialOverlayUI();
  }

  handleBinomialFastForward() {
    this.bin_playing = false;
    let currCell = this.getNextCell(this.bin_active);
    while (currCell) {
      const valBelow = this.bin_grid[currCell.n + 1]?.[currCell.k] ?? 0;
      const valLeft = this.bin_grid[currCell.n]?.[currCell.k - 1] ?? 0;
      this.bin_grid[currCell.n][currCell.k] = valBelow - valLeft;
      currCell = this.getNextCell(currCell);
    }
    this.bin_active = null;
    this.bin_finished = true;
    this.updateBinomialOverlayUI();
  }

  drawBinomial(ctx, W, H, TASK_W) {
    const cellSize = Math.min(32, (H - 200) / 13);
    const gridWidth = 7 * cellSize;
    const gridHeight = 11 * cellSize;
    const cx = TASK_W + (W - 300 - TASK_W) / 2;
    const cy = H / 2 - 10;

    const startX = cx - gridWidth / 2;
    const startY = cy - gridHeight / 2;

    const MIN_N = -5;
    const MAX_N = 5;
    const MIN_K = -1;
    const MAX_K = 5;

    // Title
    ctx.fillStyle = '#fff'; ctx.font = '600 15px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText("Newton's Extrapolated Pascal Triangle", cx, 36);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '500 11px Outfit,sans-serif';
    ctx.fillText("Newton extended Pascal's triangle leftward to find coefficients for negative and fractional powers.", cx, 52);

    // Draw Column Headers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let k = MIN_K; k <= MAX_K; k++) {
      const colIdx = k - MIN_K;
      const x = startX + colIdx * cellSize + cellSize / 2;
      ctx.fillText(`k=${k}`, x, startY - 12);
    }

    // Draw Grid Cells
    for (let n = MIN_N; n <= MAX_N; n++) {
      const rowIdx = n - MIN_N;
      const y = startY + rowIdx * cellSize;

      // Draw Row Header
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`n=${n}`, startX - 10, y + cellSize / 2);

      for (let k = MIN_K; k <= MAX_K; k++) {
        const colIdx = k - MIN_K;
        const x = startX + colIdx * cellSize;

        const val = this.bin_grid[n]?.[k];
        const isTarget = this.bin_active?.n === n && this.bin_active?.k === k;
        const isBelow = this.bin_active?.n + 1 === n && this.bin_active?.k === k;
        const isLeft = this.bin_active?.n === n && this.bin_active?.k - 1 === k;

        ctx.save();
        if (isTarget) {
          ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 1.5;
        } else if (isBelow) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.2;
        } else if (isLeft) {
          ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1.2;
        } else {
          ctx.fillStyle = val === null ? 'rgba(30, 41, 59, 0.2)' : 'rgba(30, 41, 59, 0.6)';
          ctx.strokeStyle = val === null ? 'rgba(71, 85, 105, 0.2)' : 'rgba(71, 85, 105, 0.5)';
          ctx.lineWidth = 1;
        }

        // Draw rounded rectangle
        ctx.beginPath();
        const r = 4;
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + cellSize - r, y);
        ctx.quadraticCurveTo(x + cellSize, y, x + cellSize, y + r);
        ctx.lineTo(x + cellSize, y + cellSize - r);
        ctx.quadraticCurveTo(x + cellSize, y + cellSize, x + cellSize - r, y + cellSize);
        ctx.lineTo(x + r, y + cellSize);
        ctx.quadraticCurveTo(x, y + cellSize, x, y + cellSize - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Draw Value
        if (val !== null && (val !== 0 || this.bin_show_zeroes || k === -1)) {
          ctx.save();
          if (isTarget) {
            ctx.fillStyle = '#22d3ee';
            ctx.font = 'bold 11px monospace';
          } else if (isBelow) {
            ctx.fillStyle = '#6ee7b7';
            ctx.font = 'bold 10px monospace';
          } else if (isLeft) {
            ctx.fillStyle = '#fda4af';
            ctx.font = 'bold 10px monospace';
          } else if (n < 0) {
            ctx.fillStyle = '#38bdf8';
            ctx.font = '10px monospace';
          } else if (val === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.font = '10px monospace';
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = '10px monospace';
          }
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(val), x + cellSize / 2, y + cellSize / 2);
          ctx.restore();
        }
      }
    }

    // Draw Fractional Power Row
    const fracY = startY + 12.0 * cellSize;

    // Fractional header
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`n=${this.bin_fractional_n.toFixed(2)}`, startX - 10, fracY + cellSize / 2);

    for (let k = MIN_K; k <= MAX_K; k++) {
      const colIdx = k - MIN_K;
      const x = startX + colIdx * cellSize;

      const val = k === -1 ? 0 : this.getBinomialCoeff(this.bin_fractional_n, k);

      ctx.save();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      const r = 4;
      ctx.moveTo(x + r, fracY);
      ctx.lineTo(x + cellSize - r, fracY);
      ctx.quadraticCurveTo(x + cellSize, fracY, x + cellSize, fracY + r);
      ctx.lineTo(x + cellSize, fracY + cellSize - r);
      ctx.quadraticCurveTo(x + cellSize, fracY + cellSize, x + cellSize - r, fracY + cellSize);
      ctx.lineTo(x + r, fracY + cellSize);
      ctx.quadraticCurveTo(x, fracY + cellSize, x, fracY + cellSize - r);
      ctx.lineTo(x, fracY + r);
      ctx.quadraticCurveTo(x, fracY, x + r, fracY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#e9d5ff';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), x + cellSize / 2, fracY + cellSize / 2);
      ctx.restore();
    }
  }

  drawBinomialApps(ctx, W, H, TASK_W) {
    const cx = TASK_W + (W - TASK_W) * 0.28;
    const cy1 = H * 0.34;
    const cy2 = H * 0.73;
    const R = Math.min(W - 150 - TASK_W, H / 3) * 0.58;

    const textX = cx + R + 45;

    // Titles of page
    ctx.fillStyle = '#fff'; ctx.font = '600 15px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText("Newton's Binomial Theorem & Circle Areas", TASK_W + (W - TASK_W) / 2, 32);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '500 11px Outfit,sans-serif';
    ctx.fillText("Approximating circle segment areas using sums (Σ) of series terms instead of calculus integration.", TASK_W + (W - TASK_W) / 2, 48);

    // ==========================================
    // 1. STANDARD EXHAUSTION (SEMI-CIRCLE / QUADRANT)
    // ==========================================
    // Semicircle boundary arc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy1, R, Math.PI, 0, false);
    ctx.stroke();

    // Solid shaded background for the target quadrant (x = 0 to 1)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.beginPath();
    ctx.moveTo(cx, cy1);
    ctx.arc(cx, cy1, R, -Math.PI / 2, 0, false);
    ctx.closePath();
    ctx.fill();

    // Horizontal axis line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - R - 20, cy1);
    ctx.lineTo(cx + R + 20, cy1);
    ctx.stroke();

    // Vertical axis line
    ctx.beginPath();
    ctx.moveTo(cx, cy1 + 10);
    ctx.lineTo(cx, cy1 - R - 15);
    ctx.stroke();

    // Semicircle outline (unshaded left quadrant)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy1, R, Math.PI, -Math.PI / 2, false);
    ctx.stroke();

    // Shaded circle boundary arc for right quadrant
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(cx, cy1, R, -Math.PI / 2, 0, false);
    ctx.stroke();

    // Vertical Slabs (Method of Exhaustion) for x = 0 to 1
    const slabsCount1 = 12;
    const slabW1 = R / slabsCount1;
    for (let i = 0; i < slabsCount1; i++) {
      const slabX = (i + 0.5) / slabsCount1;
      const slabY = Math.sqrt(1 - slabX * slabX);
      const left = cx + i * slabW1;
      const height = slabY * R;

      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.rect(left, cy1 - height, slabW1, height);
      ctx.fill();
      ctx.stroke();
    }

    // Grid labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText("0", cx, cy1 + 8);
    ctx.fillText("1", cx + R, cy1 + 8);
    ctx.fillText("-1", cx - R, cy1 + 8);

    // Text equation for top illustration
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 13px Outfit,sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText("NEWTON'S QUADRANT SUM (x = 0 to 1)", textX, cy1 - R - 15);
    
    ctx.font = '500 12px Outfit,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText("Newton integrates the quadrant using a finite sum", textX, cy1 - R + 8);
    ctx.fillText("of slabs (exhaustion) and binomial expansion:", textX, cy1 - R + 26);

    ctx.font = 'bold italic 12px Georgia, serif';
    ctx.fillStyle = '#67e8f9';
    ctx.fillText("π/4 ≈ ∑(i=0..N-1) √[1 − (i/N)²] · 1/N", textX, cy1 - R + 52);
    ctx.fillText("    = ∑(i=0..N-1) [1 − ½(i/N)² − ⅛(i/N)⁴ − ⅟₁₆(i/N)⁶ − ...] · 1/N", textX, cy1 - R + 72);
    ctx.fillText("    = 1 − 1/(2N³)∑i² − 1/(8N⁵)∑i⁴ − 1/(16N⁷)∑i⁶ − ...", textX, cy1 - R + 92);
    ctx.fillText("    ≈ 1 − 1/(2N³) · N³/3 − 1/(8N⁵) · N⁵/5 − 1/(16N⁷) · N⁷/7 − ...", textX, cy1 - R + 112);
    ctx.fillText("    = 1 − ⅙ − ⅟₄₀ − ⅟₁₁₂ − ...", textX, cy1 - R + 132);
    
    ctx.font = 'bold 13px Outfit,sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText("⟹  π = 4 · (1 − ⅙ − ⅟₄₀ − ⅟₁₁₂ − ...)", textX, cy1 - R + 158);

    ctx.font = '550 11px Outfit,sans-serif';
    ctx.fillStyle = 'rgba(244, 63, 94, 0.75)';
    ctx.fillText("⚠️ Error: Converges extremely slowly near x = 1.0!", textX, cy1 - R + 182);


    // ==========================================
    // 2. NEWTON'S IMPROVEMENT (PI/12 SECTOR AT x = 0.5)
    // ==========================================
    // Semicircle boundary arc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy2, R, Math.PI, 0, false);
    ctx.stroke();

    // Horizontal axis line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - R - 20, cy2);
    ctx.lineTo(cx + R + 20, cy2);
    ctx.stroke();

    // Vertical axis line
    ctx.beginPath();
    ctx.moveTo(cx, cy2 + 10);
    ctx.lineTo(cx, cy2 - R - 15);
    ctx.stroke();

    // Unshaded arc boundary
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy2, R, Math.PI, -Math.PI / 3, false);
    ctx.stroke();

    // Shaded arc boundary for sector
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(cx, cy2, R, -Math.PI / 2, -Math.PI / 3, false);
    ctx.stroke();

    // Shading the 30° Sector (violet)
    ctx.fillStyle = 'rgba(167, 139, 250, 0.12)';
    ctx.beginPath();
    ctx.moveTo(cx, cy2);
    ctx.arc(cx, cy2, R, -Math.PI / 2, -Math.PI / 3, false);
    ctx.closePath();
    ctx.fill();

    // Shading the right triangle (amber)
    ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
    ctx.beginPath();
    ctx.moveTo(cx, cy2);
    ctx.lineTo(cx + 0.5 * R, cy2);
    ctx.lineTo(cx + 0.5 * R, cy2 - Math.sqrt(0.75) * R);
    ctx.closePath();
    ctx.fill();

    // Slabs (Method of Exhaustion) from x = 0 to 0.5
    const slabsCount2 = 6;
    const slabW2 = (0.5 * R) / slabsCount2;
    for (let i = 0; i < slabsCount2; i++) {
      const slabX = 0.5 * (i + 0.5) / slabsCount2;
      const slabY = Math.sqrt(1 - slabX * slabX);
      const left = cx + i * slabW2;
      const height = slabY * R;

      ctx.fillStyle = 'rgba(167, 139, 250, 0.18)';
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.rect(left, cy2 - height, slabW2, height);
      ctx.fill();
      ctx.stroke();
    }

    // Radial line dividing sector and triangle
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy2);
    ctx.lineTo(cx + 0.5 * R, cy2 - Math.sqrt(0.75) * R);
    ctx.stroke();

    // Grid labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText("0", cx, cy2 + 8);
    ctx.fillText("0.5", cx + 0.5 * R, cy2 + 8);
    ctx.fillText("1.0", cx + R, cy2 + 8);

    // Labels for areas inside the circles
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 10.5px Outfit,sans-serif';
    ctx.fillText("Sector", cx + 0.18 * R, cy2 - 0.7 * R);
    ctx.fillText("(π/12)", cx + 0.18 * R, cy2 - 0.57 * R);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10.5px Outfit,sans-serif';
    ctx.fillText("Triangle", cx + 0.42 * R, cy2 - 0.28 * R);
    ctx.fillText("(√3/8)", cx + 0.42 * R, cy2 - 0.15 * R);

    // Text equation for bottom illustration
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 13px Outfit,sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText("NEWTON'S IMPROVEMENT (Rapid)", textX, cy2 - R - 15);

    ctx.font = '500 12px Outfit,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText("Summing slabs only from x = 0 to 0.5,", textX, cy2 - R + 8);
    ctx.fillText("avoiding slow convergence near x = 1.0:", textX, cy2 - R + 26);

    ctx.font = 'bold italic 12px Georgia, serif';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText("Area(0.5) = π/12 + √3/8", textX, cy2 - R + 52);
    ctx.fillText("          ≈ ∑(i=0..N/2-1) √[1 − (i/N)²] · 1/N", textX, cy2 - R + 72);
    ctx.fillText("          = 0.5 − 1/(2N³)∑i² − 1/(8N⁵)∑i⁴ − 1/(16N⁷)∑i⁶ − ...", textX, cy2 - R + 92);
    ctx.fillText("          ≈ 0.5 − 1/(2N³) · (N/2)³/3 − 1/(8N⁵) · (N/2)⁵/5 − 1/(16N⁷) · (N/2)⁷/7 − ...", textX, cy2 - R + 112);
    ctx.fillText("          = 0.5 − 1/48 − 1/1280 − 1/14336 − ...", textX, cy2 - R + 132);

    ctx.font = 'bold 13px Outfit,sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText("⟹  π = 12 · [ (0.5 − √3/8) − 1/48 − 1/1280 − 1/14336 − ... ]", textX, cy2 - R + 158);
    
    ctx.font = '550 11px Outfit,sans-serif';
    ctx.fillStyle = 'rgba(52, 211, 153, 0.85)';
    ctx.fillText("✓ Success: Converges 100x faster than Archimedes!", textX, cy2 - R + 182);
  }

  drawTidalForce(ctx, W, H, TASK_W) {
    const W_draw = W - TASK_W;
    const cx_left = TASK_W + W_draw * 0.14;
    const cx_right = TASK_W + W_draw * 0.38;
    const cy_top = H * 0.28;
    const cy_bottom = H * 0.72;
    const textX = TASK_W + W_draw * 0.44;

    // Titles of page
    ctx.fillStyle = '#fff'; ctx.font = '600 15px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText("Newton's Binomial Theorem & Tidal Forces", TASK_W + W_draw / 2, 32);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '500 11px Outfit,sans-serif';
    ctx.fillText("Explaining ocean bulges and gravity differentials using binomial approximations.", TASK_W + W_draw / 2, 48);

    const rEarth = 22;
    const rOrbit = 50;
    const rMoon = 5.5;
    const rSun = 8.5;

    const phases = [
      { name: "NEW MOON", type: "SPRING TIDE", cx: cx_left, cy: cy_top, angle: -Math.PI / 2 },
      { name: "FIRST QUARTER", type: "NEAP TIDE", cx: cx_right, cy: cy_top, angle: Math.PI },
      { name: "FULL MOON", type: "SPRING TIDE", cx: cx_left, cy: cy_bottom, angle: Math.PI / 2 },
      { name: "THIRD QUARTER", type: "NEAP TIDE", cx: cx_right, cy: cy_bottom, angle: 0 }
    ];

    phases.forEach(({ name, type, cx, cy, angle }) => {
      // 1. Draw Sun (at top of each system)
      ctx.fillStyle = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.arc(cx, cy - 82, rSun, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 7.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("SUN", cx, cy - 82);

      // 2. Draw Orbit Dotted Circle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, rOrbit, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Draw Ocean Tide Bulges
      if (type === "SPRING TIDE") {
        // Solar tide (orange) - vertical
        ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rEarth * 1.18, rEarth * 1.35, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Lunar tide (white) - vertical
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rEarth * 1.15, rEarth * 1.45, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else {
        // Lunar tide (white) - horizontal (towards Moon)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rEarth * 1.42, rEarth * 1.12, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Solar tide (orange) - vertical (towards Sun)
        ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rEarth * 1.12, rEarth * 1.25, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }

      // Add labels & pointers for one of the Spring Tide configurations
      if (name === "NEW MOON") {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 7px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText("SOLAR TIDE", cx + rEarth * 1.3, cy - rEarth * 0.6);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 7px Outfit, sans-serif';
        ctx.fillText("LUNAR TIDE", cx - rEarth * 2.3, cy + rEarth * 1.1);
      }

      // 4. Draw Earth
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(cx, cy, rEarth, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Earth detail (continents)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(cx - 6, cy - 4, 5, 0, 2 * Math.PI);
      ctx.arc(cx + 6, cy + 4, 6, 0, 2 * Math.PI);
      ctx.arc(cx + 2, cy - 8, 4, 0, 2 * Math.PI);
      ctx.fill();

      // 5. Draw Moon
      const mx = cx + rOrbit * Math.cos(angle);
      const my = cy + rOrbit * Math.sin(angle);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(mx, my, rMoon, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 6. Labels below
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(name, cx, cy + rOrbit + 12);
      
      ctx.fillStyle = type === "SPRING TIDE" ? '#fb7185' : '#38bdf8';
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.fillText(type, cx, cy + rOrbit + 26);
    });

    // ==========================================
    // Math Derivation (Right Column) - Side-by-Side (Near vs Far)
    // ==========================================
    const startY = 60;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 13px Outfit,sans-serif';
    ctx.fillText("TIDAL FORCE DERIVATION (NEAR VS. FAR SIDE)", textX, startY);

    // 1. Center Force
    ctx.font = '500 11px Outfit,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText("1. Force exerted by Moon at Earth's center:", textX, startY + 20);

    ctx.font = 'bold italic 11.5px Georgia, serif';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText("F_center = G · M · m / R²", textX + 15, startY + 34);

    // 2. Parallel Columns for Near vs Far side
    const col1 = textX + 10;
    const col2 = textX + 235;

    ctx.font = '500 11px Outfit,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText("2. Force at surface on Near Side vs. Far Side:", textX, startY + 54);

    ctx.font = 'bold 10.5px Outfit, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText("NEAR SIDE (closer by r):", col1, startY + 70);
    ctx.font = 'bold italic 11px Georgia, serif';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText("F_near = G · M · m / (R − r)²", col1, startY + 84);

    ctx.font = 'bold 10.5px Outfit, sans-serif';
    ctx.fillStyle = '#fb7185';
    ctx.fillText("FAR SIDE (farther by r):", col2, startY + 70);
    ctx.font = 'bold italic 11px Georgia, serif';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText("F_far = G · M · m / (R + r)²", col2, startY + 84);

    // 3. Differential Tidal Forces
    ctx.font = '500 11px Outfit,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText("3. Differential Tidal Force (F_surface − F_center):", textX, startY + 104);

    ctx.font = 'bold italic 10.5px Georgia, serif';
    ctx.fillStyle = '#67e8f9';
    ctx.fillText("F_near_tidal = (GMm/R²)·[ (1 − r/R)⁻² − 1 ]", col1, startY + 118);
    ctx.fillText("F_far_tidal  = (GMm/R²)·[ (1 + r/R)⁻² − 1 ]", col2, startY + 118);

    // 4. Binomial Expansions
    ctx.font = '500 11px Outfit,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText("4. Generalized Binomial expansion for r ≪ R [(1 ∓ x)⁻² ≈ 1 ∓ 2x]:", textX, startY + 138);

    ctx.font = 'bold italic 10.5px Georgia, serif';
    ctx.fillStyle = '#ff7171';
    ctx.fillText("(1 − r/R)⁻² ≈ 1 + 2(r/R)", col1, startY + 152);
    ctx.fillText("(1 + r/R)⁻² ≈ 1 − 2(r/R)", col2, startY + 152);

    // 5. Resulting Net Tidal Forces
    ctx.font = '500 11px Outfit,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText("5. Resulting Net Tidal Force on each side:", textX, startY + 172);

    ctx.font = 'bold 11.5px Outfit,sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText("⟹ F_near ≈ + 2 · G · M · m · r / R³", col1, startY + 186);

    ctx.fillStyle = '#f472b6';
    ctx.fillText("⟹ F_far  ≈ − 2 · G · M · m · r / R³", col2, startY + 186);

    ctx.font = '500 9px Outfit,sans-serif';
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText("(Pulls ocean towards Earth, away from Moon)", col1, startY + 202);
    ctx.fillStyle = '#fca5a5';
    ctx.fillText("(Throws ocean away from Earth and Moon)", col2, startY + 202);

    // 6. Summary Mechanism Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
    ctx.fillRect(textX, startY + 224, W_draw * 0.53, 115);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(textX, startY + 224, W_draw * 0.53, 115);

    ctx.font = 'bold 10.5px Outfit,sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText("SYMMETRIC DUAL-BULGE STRETCHING MECHANISM", textX + 10, startY + 238);

    ctx.font = '500 9.5px Outfit,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText("• Near Side (+): Moon pulls ocean stronger than Earth's center,", textX + 10, startY + 254);
    ctx.fillText("  pulling ocean towards Earth, away from the Moon.", textX + 20, startY + 267);

    ctx.fillText("• Far Side (−): Moon pulls Earth's center stronger than far ocean,", textX + 10, startY + 283);
    ctx.fillText("  throwing ocean away from Earth and Moon.", textX + 20, startY + 296);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 9.5px Outfit,sans-serif';
    ctx.fillText("✓ Opposite signs produce equal outward stretching on BOTH sides!", textX + 10, startY + 316);
  }

  drawRocheLimit(ctx, W, H, TASK_W) {
    ctx.save(); // Protect global canvas state context from any transform leakage
    try {
      const W_draw = W - TASK_W;
      const cx = TASK_W + W_draw * 0.40;
      const cy = H * 0.48;

      // Titles of page
      ctx.fillStyle = '#fff'; ctx.font = '600 15px Outfit,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText("Tidal Disruption & The Roche Limit", TASK_W + W_draw * 0.40, 32);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '500 11px Outfit,sans-serif';
      ctx.fillText("Calculating the threshold distance where tidal forces tear orbiting bodies apart.", TASK_W + W_draw * 0.40, 48);

      // Primary Body parameters
      const R_primary = 65; // Primary star radius in pixels (enlarged)
      const d_ratio = this.roche_distance_ratio || 2.20;
      const density_ratio = this.roche_density_ratio || 0.26;
      
      // Roche limit in units of R_primary: d_roche = 2.44 * (density_ratio)^(1/3)
      const roche_factor = 2.44 * Math.pow(density_ratio, 1 / 3);
      const d_roche_px = roche_factor * R_primary;
      const d_actual_px = d_ratio * R_primary;

      const isDisrupted = d_ratio <= roche_factor;

      // 1. Draw Primary Star
      ctx.fillStyle = '#f59e0b';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy, R_primary, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("PRIMARY", cx, cy - 8);
      ctx.font = '500 10.5px Outfit, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText("(Mass M, Radius R)", cx, cy + 10);

      // 2. Draw Roche Limit Boundary Circle (Dashed Red Line)
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.75)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, d_roche_px, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label for Roche Limit Circle
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 10.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`Roche Limit Boundary (d = ${roche_factor.toFixed(2)} R)`, cx, cy - d_roche_px - 6);

      // 3. Draw Orbit Path for Satellite (Dashed Gray Line)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, d_actual_px, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Draw Satellite / Orbiting Body or Disrupted Ring Debris
      const timeSec = (Date.now() - (this.startTime || Date.now())) / 1000;
      const orbitAngle = timeSec * 0.8;
      const r_sat = 15;

      if (!isDisrupted) {
        // Planet is intact! Position on orbit:
        const satX = cx + d_actual_px * Math.cos(orbitAngle);
        const satY = cy + d_actual_px * Math.sin(orbitAngle);

        // Tidal stretching: as d approaches d_roche, planet elongates radially towards the primary star
        const proximity = Math.max(0, 1 - (d_ratio - roche_factor) / 1.5);
        const stretchX = r_sat * (1 + proximity * 0.45);
        const stretchY = r_sat * (1 - proximity * 0.25);
        const satAngle = Math.atan2(satY - cy, satX - cx);

        ctx.save();
        ctx.translate(satX, satY);
        ctx.rotate(satAngle);

        ctx.beginPath();
        ctx.ellipse(0, 0, stretchX, stretchY, 0, 0, 2 * Math.PI);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Safe Orbit Label
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 11px Outfit,sans-serif';
        ctx.fillText(`✓ Safe Orbit: d = ${d_ratio.toFixed(2)} R > d_Roche (${roche_factor.toFixed(2)} R)`, cx, cy + Math.max(d_actual_px, d_roche_px) + 26);
      } else {
        // Disrupted Debris Ring Particles
        ctx.save();
        const particleCount = 85;
        for (let i = 0; i < particleCount; i++) {
          const pAngle = timeSec * (0.6 + (i % 5) * 0.08) + (i * Math.PI * 2) / particleCount;
          const spreadR = d_actual_px + (Math.sin(i * 3) * 10);
          const px = cx + spreadR * Math.cos(pAngle);
          const py = cy + spreadR * Math.sin(pAngle);
          const pSize = 1.8 + (i % 3);

          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, 2 * Math.PI);
          ctx.fillStyle = (i % 2 === 0) ? '#f87171' : '#fb923c';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 6;
          ctx.fill();
        }
        ctx.restore();

        // Disruption Warning Banner
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 11px Outfit,sans-serif';
        ctx.fillText(`⚠️ ROCHE LIMIT EXCEEDED: d = ${d_ratio.toFixed(2)} R ≤ d_Roche (${roche_factor.toFixed(2)} R)`, cx, cy + Math.max(d_actual_px, d_roche_px) + 24);
        ctx.font = '500 10px Outfit,sans-serif';
        ctx.fillStyle = '#fca5a5';
        ctx.fillText("Tidal forces overcome self-gravity! Satellite disintegrates into a planetary debris ring.", cx, cy + Math.max(d_actual_px, d_roche_px) + 38);
      }
    } finally {
      ctx.restore();
    }
  }

  drawTidalLock(ctx, W, H, TASK_W) {
    const W_draw = W - TASK_W;
    const cx = TASK_W + W_draw * 0.28;
    const cy = H * 0.48;
    const textX = TASK_W + W_draw * 0.58;
    const startY = 25;

    // Parameters mapped from reference file `tidal`
    const a = this.lock_a || 2.50; // equivalent to orbitRadius = 250 (screen coords scale)
    const M = this.lock_M || 1.0;
    const spinRatioInit = 1.05; // 5% initial relative spin kick for rapid capture sequence
    const k2_q = this.lock_k2_q !== undefined ? this.lock_k2_q : 30; // default friction slider val is 30
    const simSpeed = this.lock_sim_speed !== undefined ? this.lock_sim_speed : 100; // default speed slider val is 100%

    // Keplerian orbital rate: Math.sqrt(G * massPlanet / orbitRadius) = Math.sqrt(10000 / 250) = Math.sqrt(40)
    const omega_orbit = Math.sqrt(10000 / 250); 
 
    // Initialize angles and velocities if undefined
    if (this.lock_orbit_angle === undefined) {
      this.lock_orbit_angle = 0;
      this.lock_moon_angle = 0;
      this.lock_spin_w = omega_orbit * spinRatioInit;
    }

    // Time scale maps directly to the slider value [0, 200] divided by 100 (standard physics speed dt)
    const timeScale = simSpeed / 100;
    const baseTimeStep = 1.0;
    
    // Distribute timeScale across physics steps to make it extremely stable and fast
    const steps = Math.max(1, Math.floor(timeScale));
    const dt = (timeScale / steps) * baseTimeStep;

    let phaseLag = 0;
    let torque = 0;

    if (this.lock_sim_running) {
      for (let i = 0; i < steps; i++) {
        // 1. Update orbital position (modulo 2PI)
        this.lock_orbit_angle += omega_orbit * dt;
        this.lock_orbit_angle = this.lock_orbit_angle % (Math.PI * 2);

        // 2. Calculate Phase Lag: relative angle normalized to [-PI, PI]
        phaseLag = this.lock_moon_angle - this.lock_orbit_angle;
        while (phaseLag > Math.PI) phaseLag -= Math.PI * 2;
        while (phaseLag < -Math.PI) phaseLag += Math.PI * 2;

        // 3. Apply Restoring Torque
        const bulgeTorqueStrength = 0.005;
        torque = -bulgeTorqueStrength * Math.sin(2 * phaseLag);

        // 4. Apply Tidal Dissipation (Internal Friction)
        const dissipationFactor = k2_q / 10000; // range maps [0, 100] slider to [0, 0.01]
        const relativeSpin = this.lock_spin_w - omega_orbit;
        const friction = -dissipationFactor * relativeSpin;

        // Update angular velocity
        this.lock_spin_w += (torque + friction) * dt;

        // Update spin angle
        this.lock_moon_angle += this.lock_spin_w * dt;
        this.lock_moon_angle = this.lock_moon_angle % (Math.PI * 2);
      }
    } else {
      // Pause state: calculate phase lag for visual representation and UI stats
      phaseLag = this.lock_moon_angle - this.lock_orbit_angle;
      while (phaseLag > Math.PI) phaseLag -= Math.PI * 2;
      while (phaseLag < -Math.PI) phaseLag += Math.PI * 2;
    }

    const currentSpinRatio = (this.lock_spin_w / omega_orbit);
    const spinDiff = Math.abs(this.lock_spin_w - omega_orbit);
    
    // Status Determination
    let displayPhase = phaseLag * 180 / Math.PI;
    if (displayPhase > 90) displayPhase -= 180;
    if (displayPhase < -90) displayPhase += 180;

    const isLocked = spinDiff < 0.0001 && Math.abs(displayPhase) < 1.0;

    // Titles of page
    ctx.fillStyle = '#fff'; ctx.font = '600 13.5px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText("Tidal Friction & Rotational Locking (Tidal Lock)", cx, 32);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 10px Outfit,sans-serif';
    ctx.fillText("Restoring torque τ ∝ a⁻⁶ slows spin until synchronous rotation (t_lock ∝ a⁶ / M²).", cx, 48);

    // 1. Draw Orbit path (Dashed Circle)
    const orbitR = a * 75;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, orbitR, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // 2. Draw Planet at (cx, cy)
    const planetR = 45 * Math.cbrt(M);
    const planetGrad = ctx.createRadialGradient(cx - 15, cy - 15, 5, cx, cy, planetR);
    planetGrad.addColorStop(0, '#60a5fa'); // blue-400
    planetGrad.addColorStop(1, '#1e3a8a'); // blue-900

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, planetR, 0, 2 * Math.PI);
    ctx.fillStyle = planetGrad;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(96, 165, 250, 0.5)';
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Outfit,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("PRIMARY", cx, cy - 4);
    ctx.font = '500 9.5px Outfit,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(`(Mass M = ${M.toFixed(1)})`, cx, cy + 11);

    // 3. Calculate Moon Position
    const mx = cx + orbitR * Math.cos(this.lock_orbit_angle);
    const my = cy + orbitR * Math.sin(this.lock_orbit_angle);

    // Draw Center Line (Planet to Moon)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(mx, my);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Draw Moon body (deformed oval, rotated around its center by lock_moon_angle)
    const baseMoonR = 22;
    const bulgeHeight = Math.min(16, 7.0 * (M / Math.pow(a, 2.3)));
    const rx = baseMoonR + bulgeHeight; // equatorial radius (major axis)
    const ry = Math.max(13, baseMoonR - bulgeHeight * 0.45); // polar radius (minor axis)

    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(this.lock_moon_angle); // Rotate moon around its own center by lock_moon_angle

    // Deformed Moon Ellipse
    const moonGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, rx);
    moonGrad.addColorStop(0, '#94a3b8'); // slate-400
    moonGrad.addColorStop(1, '#334155'); // slate-700

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI);
    ctx.fillStyle = moonGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    // Near Side Red Marker dot (indicates facing physical side of moon)
    ctx.beginPath();
    ctx.arc(rx - 6, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444'; // red marker
    ctx.fill();

    // Red dashed line along the major axis of moon
    ctx.beginPath();
    ctx.moveTo(-rx - 10, 0);
    ctx.lineTo(rx + 10, 0);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.setLineDash([2, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    // 4. Draw Tidal Force Arrows on Bulges (pointing towards Planet)
    // Find positions of the two bulges in global coordinates
    const bulgeNearX = mx + rx * Math.cos(this.lock_moon_angle);
    const bulgeNearY = my + rx * Math.sin(this.lock_moon_angle);
    const bulgeFarX = mx - rx * Math.cos(this.lock_moon_angle);
    const bulgeFarY = my - rx * Math.sin(this.lock_moon_angle);

    // Distance of bulges to planet center
    const dxNear = cx - bulgeNearX;
    const dyNear = cy - bulgeNearY;
    const distNear = Math.sqrt(dxNear * dxNear + dyNear * dyNear);

    const dxFar = cx - bulgeFarX;
    const dyFar = cy - bulgeFarY;
    const distFar = Math.sqrt(dxFar * dxFar + dyFar * dyFar);

    // Inverse cube scaling for force vectors (tidal force visual)
    const forceScale = 50000000 * M;
    const fNear = forceScale / (distNear * distNear * distNear);
    const nxNear = (dxNear / distNear) * fNear;
    const nyNear = (dyNear / distNear) * fNear;

    const fFar = forceScale / (distFar * distFar * distFar);
    const nxFar = (dxFar / distFar) * fFar;
    const nyFar = (dyFar / distFar) * fFar;

    // Helper function to draw arrow
    const drawArrow = (arrowCtx, fromx, fromy, tox, toy, arrowWidth, color) => {
      const headlen = 8;
      const angle = Math.atan2(toy - fromy, tox - fromx);

      arrowCtx.save();
      arrowCtx.strokeStyle = color;
      arrowCtx.beginPath();
      arrowCtx.moveTo(fromx, fromy);
      arrowCtx.lineTo(tox, toy);
      arrowCtx.lineWidth = arrowWidth;
      arrowCtx.stroke();

      arrowCtx.beginPath();
      arrowCtx.moveTo(tox, toy);
      arrowCtx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7), toy - headlen * Math.sin(angle - Math.PI / 7));
      arrowCtx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 7), toy - headlen * Math.sin(angle + Math.PI / 7));
      arrowCtx.lineTo(tox, toy);
      arrowCtx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7), toy - headlen * Math.sin(angle - Math.PI / 7));
      arrowCtx.fillStyle = color;
      arrowCtx.fill();
      arrowCtx.restore();
    };

    // Draw force arrow on near bulge (stronger, emerald green)
    drawArrow(ctx, bulgeNearX, bulgeNearY, bulgeNearX + nxNear, bulgeNearY + nyNear, 3.2, '#10b981');
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 9px Outfit,sans-serif';
    ctx.fillText("F_tidal (Near)", bulgeNearX + 8, bulgeNearY - 8);

    // Draw force arrow on far bulge (weaker, medium green)
    drawArrow(ctx, bulgeFarX, bulgeFarY, bulgeFarX + nxFar, bulgeFarY + nyFar, 2.0, '#34d399');
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 9px Outfit,sans-serif';
    ctx.fillText("F_tidal (Far)", bulgeFarX - 52, bulgeFarY + 12);

    // 5. Restoring Torque indicator curve (when misaligned)
    if (Math.abs(Math.sin(phaseLag)) > 0.05) {
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(this.lock_moon_angle);
      const torqueDir = Math.sin(phaseLag) > 0 ? 1 : -1;

      ctx.beginPath();
      const startArc = 0;
      const endArc = torqueDir * 0.6;
      ctx.arc(0, 0, rx + 16, startArc, endArc, torqueDir < 0);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Arrowhead for torque curved indicator
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      const headX = (rx + 16) * Math.cos(endArc);
      const headY = (rx + 16) * Math.sin(endArc);
      ctx.translate(headX, headY);
      ctx.rotate(endArc + (torqueDir < 0 ? -Math.PI / 2 : Math.PI / 2));
      ctx.moveTo(5, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(mx, my);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10.5px Outfit,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("Restoring Torque τ", 0, -ry - 22);
      ctx.restore();
    }

    // 6. Live Status Banner at bottom of illustration area
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 12px Outfit,sans-serif';
    if (isLocked) {
      ctx.fillStyle = '#34d399';
      ctx.fillText(`✓ TIDALLY LOCKED (Synchronous Rotation: ω / Ω = 1.00x)`, cx, cy + orbitR + 22);
      ctx.font = '500 10px Outfit,sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`Status: Tidally Locked | Phase Lag: ${displayPhase.toFixed(1)}°`, cx, cy + orbitR + 40);
    } else {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`Spin / Orbit Ratio: ${currentSpinRatio.toFixed(2)}x ➔ 1.00x`, cx, cy + orbitR + 22);
      ctx.font = '500 10px Outfit,sans-serif';
      ctx.fillStyle = spinDiff < 0.01 ? '#fbbf24' : 'rgba(255,255,255,0.5)';
      ctx.fillText(`Status: ${spinDiff < 0.01 ? 'Damping (Libration)' : 'Rotating freely'} | Phase Lag: ${displayPhase.toFixed(1)}°`, cx, cy + orbitR + 40);
    }

    // ==========================================
    // Math Derivation (Right Column - Simplified & Shifted Up)
    // ==========================================
  }

  drawLunarPerturbation(ctx, W, H, TASK_W) {
    ctx.save();
    try {
      const W_draw = W - TASK_W;
      const cx = TASK_W + W_draw * 0.40;
      const cy = H * 0.48;

      // Page Title
      ctx.fillStyle = '#fff'; ctx.font = '600 15px Outfit,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText("Lunar Perturbation & Apsidal Precession", cx, 32);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '500 11px Outfit,sans-serif';
      ctx.fillText("How solar differential gravity causes the Moon's orbital axis (perigee) to precess.", cx, 48);

      // Physics Parameters (Normalized units matching reference file `lunar_perturbation`)
      const G = 1;
      const BASE_M_E = 1;
      const BASE_M_S = 333000;
      const BASE_D_M = 1;
      const BASE_D_E = 389;

      const M_S = BASE_M_S * (this.lunar_sun_mult || 1.0);
      const R_E = BASE_D_E * (this.lunar_earth_dist_mult || 1.0);
      const w_earth = Math.sqrt((G * M_S) / Math.pow(R_E, 3));

      // Visual rendering scale
      const renderScaleEarth = (W_draw * 0.22) / BASE_D_E; // Earth distance on canvas
      const renderScaleMoon = 65 / BASE_D_M;              // Moon distance around Earth on canvas

      // Physics integration step
      if (this.lunar_sim_running) {
        const dt = 0.01;
        const speed = 6;
        const substeps = 10;
        const step_dt = (dt * speed) / substeps;

        for (let i = 0; i < substeps; i++) {
          const t = this.lunar_time || 0;
          const m = this.lunar_moon_state;

          if (!m.initialized) {
            m.x = BASE_D_M;
            m.y = 0;
            const v_circ = Math.sqrt(G * BASE_M_E / BASE_D_M);
            m.vx = 0;
            m.vy = v_circ * (this.lunar_moon_vel_scale || 1.0);
            m.initialized = true;
            m.trail = [];
            m._apsidal_angle = 0; // reset analytical precession angle
            this.lunar_time = 0;  // reset simulation time
            
            // Calculate initial accelerations
            const X_E = R_E * Math.cos(w_earth * t);
            const Y_E = R_E * Math.sin(w_earth * t);
            const r_mag = Math.max(0.05, Math.hypot(m.x, m.y));
            const a_E_x = -(G * BASE_M_E / (r_mag * r_mag)) * (m.x / r_mag);
            const a_E_y = -(G * BASE_M_E / (r_mag * r_mag)) * (m.y / r_mag);

            const M_sun_X = X_E + m.x;
            const M_sun_Y = Y_E + m.y;
            const d_sun_sq = M_sun_X * M_sun_X + M_sun_Y * M_sun_Y;
            const d_sun = Math.sqrt(d_sun_sq);
            const a_SM_x = -(G * M_S / d_sun_sq) * (M_sun_X / d_sun);
            const a_SM_y = -(G * M_S / d_sun_sq) * (M_sun_Y / d_sun);

            const a_SE_x = -(G * M_S / (R_E * R_E)) * (X_E / R_E);
            const a_SE_y = -(G * M_S / (R_E * R_E)) * (Y_E / R_E);

            m.ax = a_E_x + (a_SM_x - a_SE_x);
            m.ay = a_E_y + (a_SM_y - a_SE_y);
          }

          // Velocity Verlet Step 1: Position
          m.x += m.vx * step_dt + 0.5 * m.ax * step_dt * step_dt;
          m.y += m.vy * step_dt + 0.5 * m.ay * step_dt * step_dt;

          this.lunar_time = (this.lunar_time || 0) + step_dt;
          const t_new = this.lunar_time;
          const X_E_new = R_E * Math.cos(w_earth * t_new);
          const Y_E_new = R_E * Math.sin(w_earth * t_new);

          // Accelerations at t_new
          const r_mag_new = Math.max(0.05, Math.hypot(m.x, m.y));
          const a_E_x_new = -(G * BASE_M_E / (r_mag_new * r_mag_new)) * (m.x / r_mag_new);
          const a_E_y_new = -(G * BASE_M_E / (r_mag_new * r_mag_new)) * (m.y / r_mag_new);

          const M_sun_X_new = X_E_new + m.x;
          const M_sun_Y_new = Y_E_new + m.y;
          const d_sun_sq_new = M_sun_X_new * M_sun_X_new + M_sun_Y_new * M_sun_Y_new;
          const d_sun_new = Math.sqrt(d_sun_sq_new);
          const a_SM_x_new = -(G * M_S / d_sun_sq_new) * (M_sun_X_new / d_sun_new);
          const a_SM_y_new = -(G * M_S / d_sun_sq_new) * (M_sun_Y_new / d_sun_new);

          const a_SE_x_new = -(G * M_S / (R_E * R_E)) * (X_E_new / R_E);
          const a_SE_y_new = -(G * M_S / (R_E * R_E)) * (Y_E_new / R_E);

          const pert_x_new = a_SM_x_new - a_SE_x_new;
          const pert_y_new = a_SM_y_new - a_SE_y_new;
          const ax_new = a_E_x_new + pert_x_new;
          const ay_new = a_E_y_new + pert_y_new;

           // Velocity Verlet Step 2: Velocity
          m.vx += 0.5 * (m.ax + ax_new) * step_dt;
          m.vy += 0.5 * (m.ay + ay_new) * step_dt;
          m.ax = ax_new;
          m.ay = ay_new;
          m.pert_x = pert_x_new;
          m.pert_y = pert_y_new;
          m.r_mag = r_mag_new;
        }

        // --- Analytical apsidal precession (outside substep loop) ---
        // The osculating eccentricity vector oscillates ±30° within each orbit
        // (short-period perturbation), while the secular advance is only ~1.5°
        // per orbit. No filter can reliably extract the secular signal.
        //
        // Instead, we use the analytically-known result from perturbation theory:
        //   ω̇ = (3/4) × n_sun² / n_moon
        // This is always PROGRADE (same direction as Moon's orbital motion),
        // exactly matching the real 8.85-year apsidal precession cycle.
        // Ref: https://en.wikipedia.org/wiki/Lunar_precession
        const mState = this.lunar_moon_state;
        const n_moon = Math.sqrt(G * BASE_M_E / Math.pow(BASE_D_M, 3));
        const precessionSpeedup = 15.0; // Visual acceleration factor (15x faster than real-time ratio)
        const omega_dot = precessionSpeedup * 0.75 * (w_earth * w_earth) / n_moon; // secular rate [rad/time]

        // Accumulate apsidal angle from analytical rate (always prograde)
        const dt_frame = substeps * step_dt;
        mState._apsidal_angle = (mState._apsidal_angle || 0) + omega_dot * dt_frame;

        // Construct e_vec for rendering from analytical angle + fixed display eccentricity
        const display_e = 0.065;
        mState.e_vec = {
          x: display_e * Math.cos(mState._apsidal_angle),
          y: display_e * Math.sin(mState._apsidal_angle)
        };
      }

      const t_curr = this.lunar_time || 0;
      const currentEarthX = R_E * Math.cos(w_earth * t_curr);
      const currentEarthY = R_E * Math.sin(w_earth * t_curr);

      // 1. Draw Sun (Center)
      ctx.fillStyle = '#fbbf24';
      ctx.shadowBlur = 35 * Math.min(this.lunar_sun_mult || 1.0, 2.5);
      ctx.shadowColor = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy, 28 * Math.sqrt(this.lunar_sun_mult || 1.0), 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("SUN", cx, cy);

      // 2. Draw Earth Orbit Ring around Sun
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, R_E * renderScaleEarth, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);

      const screenEarthX = cx + currentEarthX * renderScaleEarth;
      const screenEarthY = cy + currentEarthY * renderScaleEarth;

      const m = this.lunar_moon_state;

      // Calculate True Physical Perturbation Ratio
      const r_mag = Math.max(0.05, Math.hypot(m.x || BASE_D_M, m.y || 0));
      const earthPull = (G * BASE_M_E) / (r_mag * r_mag);
      const maxPerturbation = (2 * G * M_S * r_mag) / Math.pow(R_E, 3);
      const pertRatio = maxPerturbation / earthPull;
      const isUnstable = pertRatio > 0.18 || r_mag > 2.2;

      // 3. Draw Continuous Apsidal Line (Orbital Major Axis / Perigee Axis)
      if (this.lunar_show_apsidal && m.e_vec) {
        const apsAngle = Math.atan2(m.e_vec.y, m.e_vec.x);
        const ux = Math.cos(apsAngle);
        const uy = Math.sin(apsAngle);
        const lineLen = BASE_D_M * 1.6 * renderScaleMoon;

        ctx.beginPath();
        ctx.moveTo(screenEarthX + ux * lineLen, screenEarthY + uy * lineLen);
        ctx.lineTo(screenEarthX - ux * lineLen, screenEarthY - uy * lineLen);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Perigee Dot (Closest point direction marker)
        ctx.beginPath();
        ctx.arc(screenEarthX + ux * renderScaleMoon, screenEarthY + uy * renderScaleMoon, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#c084fc';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Apogee Dot
        ctx.beginPath();
        ctx.arc(screenEarthX - ux * renderScaleMoon, screenEarthY - uy * renderScaleMoon, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();

        // Label for Orbit Axis
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 9.5px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Perigee", screenEarthX + ux * (lineLen + 12), screenEarthY + uy * (lineLen + 12));
      }

      // 4. Compute 100% Continuous Physical Moon Position & Trail
      // Always uses physical coordinates (m.x, m.y) so there are ZERO snaps, jumps, or threshold mode switches!
      const screenMoonX = screenEarthX + (m.x || BASE_D_M) * renderScaleMoon;
      const screenMoonY = screenEarthY + (m.y || 0) * renderScaleMoon;

      if (this.lunar_sim_running) {
        if (!m.trail) m.trail = [];
        m.trail.push({ x: (m.x || BASE_D_M) * renderScaleMoon, y: (m.y || 0) * renderScaleMoon });
        if (m.trail.length > 140) m.trail.shift();
      }

      // 5. Draw Continuous Physical Moon Trail around Earth
      if (m.trail && m.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(screenEarthX + m.trail[0].x, screenEarthY + m.trail[0].y);
        for (let i = 1; i < m.trail.length; i++) {
          ctx.lineTo(screenEarthX + m.trail[i].x, screenEarthY + m.trail[i].y);
        }
        ctx.strokeStyle = isUnstable ? 'rgba(239, 68, 68, 0.85)' : 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = isUnstable ? 2.5 : 2;
        ctx.stroke();
      }

      // 7. Draw Earth
      ctx.fillStyle = '#3b82f6';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#3b82f6';
      ctx.beginPath();
      ctx.arc(screenEarthX, screenEarthY, 14, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("EARTH", screenEarthX, screenEarthY);

      // 8. Draw Moon
      ctx.fillStyle = isUnstable ? '#f87171' : '#f3f4f6';
      ctx.shadowBlur = 10;
      ctx.shadowColor = isUnstable ? '#ef4444' : '#f3f4f6';
      ctx.beginPath();
      ctx.arc(screenMoonX, screenMoonY, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 9. Force Vectors Visualization
      if (this.lunar_show_vectors) {
        const activeForce = this.lunar_active_force || 'all';

        const dx_moon_earth = -(m.x || BASE_D_M);
        const dy_moon_earth = -(m.y || 0);
        const dist_moon_earth = Math.hypot(dx_moon_earth, dy_moon_earth);
        const u_rad_x = dx_moon_earth / dist_moon_earth;
        const u_rad_y = dy_moon_earth / dist_moon_earth;

        const u_trans_x = -u_rad_y;
        const u_trans_y = u_rad_x;

        const pertX = m.pert_x || 0;
        const pertY = m.pert_y || 0;

        const rad_mag = -(pertX * u_rad_x + pertY * u_rad_y);
        const trans_mag = (pertX * u_trans_x + pertY * u_trans_y);

        const vScale = 50 / ((2 * G * M_S * BASE_D_M) / Math.pow(R_E, 3));

        const vecRadialX = u_rad_x * rad_mag * vScale * -1;
        const vecRadialY = u_rad_y * rad_mag * vScale * -1;
        const vecTransX = u_trans_x * trans_mag * vScale;
        const vecTransY = u_trans_y * trans_mag * vScale;

        // Vector to Sun (Yellow Solid Arrow)
        const dx_sun = cx - screenMoonX;
        const dy_sun = cy - screenMoonY;
        const dist_sun = Math.hypot(dx_sun, dy_sun);
        const u_sun_x = dx_sun / dist_sun;
        const u_sun_y = dy_sun / dist_sun;

        const drawArrow = (fromX, fromY, vecX, vecY, color, isDashed = false, isThick = false) => {
          if (Math.hypot(vecX, vecY) < 0.1) return;
          const headlen = isThick ? 9 : 6;
          const angle = Math.atan2(vecY, vecX);
          const toX = fromX + vecX;
          const toY = fromY + vecY;

          ctx.beginPath();
          if (isDashed) ctx.setLineDash([4, 4]);
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.strokeStyle = color;
          ctx.lineWidth = isThick ? 3.5 : 1.5;
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.beginPath();
          ctx.moveTo(toX, toY);
          ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
          ctx.lineTo(toX, toY);
          ctx.fillStyle = color;
          ctx.fill();
        };

        // Draw Direction to Sun (Thin, Solid, Yellow)
        if (activeForce === 'all') {
          drawArrow(screenMoonX, screenMoonY, u_sun_x * 35, u_sun_y * 35, '#fde047', false, false);
        }

        // Draw Net Disturbing Force Vector (Gold, Thick)
        if (activeForce === 'all') {
          drawArrow(screenMoonX, screenMoonY, pertX * vScale, pertY * vScale, '#f59e0b', false, true);
        }

        // Draw Radial Component Vector (Red, Dashed)
        if (activeForce === 'all' || activeForce === 'radial') {
          drawArrow(screenMoonX, screenMoonY, vecRadialX, vecRadialY, '#ef4444', true, false);
        }

        // Draw Transverse Component Vector (Green, Dashed)
        if (activeForce === 'all' || activeForce === 'transverse') {
          drawArrow(screenMoonX, screenMoonY, vecTransX, vecTransY, '#22c55e', true, false);
        }

        // 10. Forces Legend Panel (Top Right of canvas)
        const legX = W_draw * 0.72 + TASK_W;
        const legY = 65;
        const legW = 165;
        const legH = 95;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(legX, legY, legW, legH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 10px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText("Forces on Moon", legX + 10, legY + 8);

        ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
        ctx.beginPath();
        ctx.moveTo(legX + 10, legY + 22);
        ctx.lineTo(legX + legW - 10, legY + 22);
        ctx.stroke();

        // Items
        const items = [
          { color: '#fde047', label: 'Direction to Sun', dashed: false, thick: false },
          { color: '#f59e0b', label: 'Disturbing Force (Net)', dashed: false, thick: true },
          { color: '#ef4444', label: 'Radial Component', dashed: true, thick: false },
          { color: '#22c55e', label: 'Transverse Component', dashed: true, thick: false }
        ];

        let iy = legY + 28;
        items.forEach(item => {
          ctx.beginPath();
          if (item.dashed) ctx.setLineDash([3, 3]);
          ctx.moveTo(legX + 10, iy + 4);
          ctx.lineTo(legX + 26, iy + 4);
          ctx.strokeStyle = item.color;
          ctx.lineWidth = item.thick ? 2.5 : 1.5;
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = item.dashed ? '#94a3b8' : '#e2e8f0';
          ctx.font = '9px Outfit, sans-serif';
          ctx.fillText(item.label, legX + 32, iy);
          iy += 15;
        });
      }

      // 11. Dynamic Live Status Banner
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      let statusText = "✓ NOMINAL APSIDAL PRECESSION: Solar differential torque rotates Moon's orbit axis (perigee)";
      let statusColor = "#34d399";
      let detailText = "Real World: The major axis rotates once every 8.85 years (~118 orbits). Accelerated 15× in rendering for clear visibility.";

      if (r_mag > 3.0 || pertRatio > 0.6) {
        statusText = "🚨 ORBIT UNSTABLE / EJECTED: Solar gravity overcomes Earth's pull, throwing Moon out of Earth orbit!";
        statusColor = "#ef4444";
        detailText = "Massive solar mass (or small Earth distance) increases differential force F_pert beyond Earth's binding gravity.";
      } else if (pertRatio > 0.18) {
        statusText = "⚠️ HIGH PERTURBATION: Heavy solar gravity warps & stretches Moon's orbit chaotically!";
        statusColor = "#f59e0b";
        detailText = "Strong solar differential force disrupts the closed Keplerian ellipse into a chaotic trajectory.";
      }

      ctx.fillStyle = statusColor;
      ctx.font = 'bold 11px Outfit,sans-serif';
      ctx.fillText(statusText, cx, cy + R_E * renderScaleEarth + 28);

      ctx.font = '500 10px Outfit,sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(detailText, cx, cy + R_E * renderScaleEarth + 46);

    } finally {
      ctx.restore();
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
    if (this.binomialOverlay && this.binomialOverlay.parentNode) {
      this.binomialOverlay.parentNode.removeChild(this.binomialOverlay);
    }
    if (this.binomialAppsOverlay && this.binomialAppsOverlay.parentNode) {
      this.binomialAppsOverlay.parentNode.removeChild(this.binomialAppsOverlay);
    }
    if (this.rocheOverlay && this.rocheOverlay.parentNode) {
      this.rocheOverlay.parentNode.removeChild(this.rocheOverlay);
    }
    if (this.tidalLockOverlay && this.tidalLockOverlay.parentNode) {
      this.tidalLockOverlay.parentNode.removeChild(this.tidalLockOverlay);
    }
    if (this.lunarPerturbOverlay && this.lunarPerturbOverlay.parentNode) {
      this.lunarPerturbOverlay.parentNode.removeChild(this.lunarPerturbOverlay);
    }
  }
}

function IX_center(W, TASK_W) {
  return TASK_W + (W - TASK_W) / 2;
}
