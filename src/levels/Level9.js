import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gameState } from '../core/GameState.js';
import { GravityIllustration } from './GravityIllustration.js';

export class Level9 {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    // Simulation state
    // Acceleration subtask container
    this.subtask = 'cannonball'; // 'cannonball', 'gravity', 'acceleration', or 'orbit'
    this.accelerationContainer = document.createElement('div');
    this.accelerationContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;pointer-events:auto;display:none;';
    this.container.appendChild(this.accelerationContainer);
    this.accelerationUIInitialized = false;

    // Orbit subtask container (Universal Orbit Proof)
    this.orbitContainer = document.createElement('div');
    this.orbitContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;pointer-events:auto;display:none;';
    this.container.appendChild(this.orbitContainer);
    this.orbitUIInitialized = false;
    this.orbitV_ratio = 1.0;
    this.orbitTime = 0;

    this.isSimPlaying = true;
    this.time = 0;

    // Cannonball subtask variables
    this.cannonballSpeed = 6.0; // km/s (7.9 km/s is circular orbit)
    this.ballX = 0;
    this.ballY = 0;
    this.ballVx = 0;
    this.ballVy = 0;
    this.ballActive = false;
    this.ballPath = [];
    this.ballCrashed = false;
    this.ballEscaped = false;
    this.fireTimer = 0;
    this.crashSite = null;

    // Gravity subtask variables
    this.orbitAngle = 0;

    // HTML/SVG illustration overlay for the Gravity tab
    // Attaches to document.body (not container) as a fixed overlay right of the UI panel
    this._gravityIllustration = new GravityIllustration(
      (step) => { gameState.derivationStep = step; }
    );
    // Sync initial step
    this._gravityIllustration.setStep(gameState.derivationStep || 0);

    // Background stars
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random(), y: Math.random(),
        r: 0.5 + Math.random() * 0.8,
        brightness: 0.3 + Math.random() * 0.7
      });
    }

    // Style canvas to fill container, behind ui-layer
    this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;';

    this.resizeBound = this.resize.bind(this);
    window.addEventListener('resize', this.resizeBound);
    this.resize();

    this.animateBound = this.animate.bind(this);
    this.animationId = requestAnimationFrame(this.animateBound);

    // Call setSubtask initially to ensure the GravityIllustration visibility is correct
    this.setSubtask(this.subtask);
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
    this.ballActive = false;
    this.ballPath = [];
    this.ballCrashed = false;
    this.ballEscaped = false;
    this.fireTimer = 0;
    this.crashSite = null;
  }

  setSubtask(subtask) {
    this.subtask = subtask;
    this.resetSimulation();
    if (subtask === 'gravity') {
      this._gravityIllustration.show();
      this.canvas.style.display = 'none';
      this.accelerationContainer.style.display = 'none';
      this.orbitContainer.style.display = 'none';
    } else if (subtask === 'acceleration') {
      this._gravityIllustration.hide();
      this.canvas.style.display = 'none';
      this.accelerationContainer.style.display = 'block';
      this.orbitContainer.style.display = 'none';
      this.renderAccelerationUI();
    } else if (subtask === 'orbit') {
      this._gravityIllustration.hide();
      this.canvas.style.display = 'none';
      this.accelerationContainer.style.display = 'none';
      this.orbitContainer.style.display = 'block';
      this.renderOrbitUI();
    } else {
      this._gravityIllustration.hide();
      this.canvas.style.display = 'block';
      this.accelerationContainer.style.display = 'none';
      this.orbitContainer.style.display = 'none';
    }
  }

  get derivationStep() {
    return gameState.derivationStep;
  }

  set derivationStep(step) {
    gameState.derivationStep = step;
    if (this._gravityIllustration) {
      this._gravityIllustration.setStep(step);
    }
  }

  setDerivationStep(step) {
    gameState.derivationStep = step;
    this._gravityIllustration.setStep(step);
  }

  setSpeed(speed) {
    this.cannonballSpeed = speed;
    this.resetSimulation();
  }

  fireCannon() {
    // Fire button resets physics and launches a new cannonball
    const W = this.canvas.width;
    const H = this.canvas.height;
    const TASK_W = 400;
    const cx = TASK_W + (W - TASK_W) / 2;
    const cy = H / 2;
    const R_earth = 100;
    const H_mountain = 14;

    this.ballX = cx;
    this.ballY = cy - R_earth - H_mountain;
    
    // Scale velocity: circular orbit speed 7.9 km/s maps exactly to 2.45 pixels/frame.
    const vScale = 2.45 / 7.9;
    this.ballVx = this.cannonballSpeed * vScale;
    this.ballVy = 0;

    this.ballPath = [{ x: this.ballX, y: this.ballY }];
    this.ballActive = true;
    this.ballCrashed = false;
    this.ballEscaped = false;
    this.fireTimer = 20; // fire flash duration in frames
    this.crashSite = null;
  }

  // ── Utilities ─────────────────────────────────────────────
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

  drawEarth(ctx, cx, cy, r) {
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

    // Continent landmass shapes (draw simplified green arcs/blobs inside Earth)
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    
    ctx.fillStyle = '#10b981';
    // North America/Europe
    ctx.beginPath();
    ctx.arc(cx - 20, cy - 40, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Africa/South America
    ctx.beginPath();
    ctx.arc(cx + 10, cy + 20, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    // Asia/Australia
    ctx.beginPath();
    ctx.arc(cx + 50, cy - 10, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw crust outline
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  }

  // ── Main Loop ─────────────────────────────────────────────
  animate() {
    this.animationId = requestAnimationFrame(this.animateBound);

    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    // Attempt resize if canvas has zero dimensions
    if (!W || !H) {
      this.resize();
      return;
    }

    try {

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

    // Update time
    if (this.isSimPlaying) {
      this.time += 1;
      this.orbitAngle += 0.012;
      if (this.fireTimer > 0) this.fireTimer--;
    }

    const TASK_W = 400;
    const IX = TASK_W;
    const IW = W - TASK_W;
    const IH = H;

    if (this.subtask === 'cannonball') {
      this.drawCannonball(ctx, IX, IW, IH);
    } else if (this.subtask === 'orbit') {
      this.renderOrbitUI();
    } else {
      this.drawGravity(ctx, IX, IW, IH);
    }
    } catch (err) {
      // Swallow errors so the animation loop keeps running
      console.error('[Level9 animate]', err);
    }
  }

  // ── Subtask 1: Cannonball Simulation ──────────────────────
  drawCannonball(ctx, IX, IW, IH) {
    const cx = IX + IW / 2;
    const cy = IH / 2;
    const R_earth = 100;
    const H_mountain = 14;

    // Earth drawing
    this.drawEarth(ctx, cx, cy, R_earth);

    // Draw Mountain on North Pole
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - R_earth);
    ctx.lineTo(cx, cy - R_earth - H_mountain);
    ctx.lineTo(cx + 7, cy - R_earth);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Draw Cannon on top of Mountain
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    // Tiny barrel pointing right
    ctx.rect(cx - 2, cy - R_earth - H_mountain - 4, 8, 4);
    ctx.fill(); ctx.stroke();

    // Fire explosion flash
    if (this.fireTimer > 0) {
      const gFlash = ctx.createRadialGradient(cx + 6, cy - R_earth - H_mountain - 2, 1, cx + 6, cy - R_earth - H_mountain - 2, 12);
      gFlash.addColorStop(0, '#ffffff');
      gFlash.addColorStop(0.3, '#f59e0b');
      gFlash.addColorStop(1, 'rgba(239,68,68,0)');
      ctx.fillStyle = gFlash;
      ctx.beginPath();
      ctx.arc(cx + 6, cy - R_earth - H_mountain - 2, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Trajectory physics step
    // Circular orbital speed is 7.9 km/s.
    // Analytical gravity center at (cx, cy).
    const GM = 629.1; // G * M scaling factor
    
    if (this.ballActive && this.isSimPlaying) {
      // Perform 5 micro-steps per frame to ensure smooth paths
      for (let step = 0; step < 5; step++) {
        const dx = this.ballX - cx;
        const dy = this.ballY - cy;
        const r = Math.sqrt(dx*dx + dy*dy);

        if (r < R_earth) {
          this.ballActive = false;
          this.ballCrashed = true;
          this.crashSite = { x: this.ballX, y: this.ballY };
          break;
        }
        if (r > 650) {
          this.ballActive = false;
          this.ballEscaped = true;
          break;
        }

        // Acceleration field
        const ax = -GM * dx / (r*r*r);
        const ay = -GM * dy / (r*r*r);

        const dt = 0.2;
        this.ballVx += ax * dt;
        this.ballVy += ay * dt;
        this.ballX  += this.ballVx * dt;
        this.ballY  += this.ballVy * dt;

        this.ballPath.push({ x: this.ballX, y: this.ballY });
      }
    }

    // Draw Trajectory Path
    if (this.ballPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = this.ballCrashed ? 'rgba(239,68,68,0.7)' : (this.ballEscaped ? 'rgba(167,139,250,0.7)' : 'rgba(56,189,248,0.7)');
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(this.ballPath[0].x, this.ballPath[0].y);
      for (let i = 1; i < this.ballPath.length; i++) {
        ctx.lineTo(this.ballPath[i].x, this.ballPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw Fired Cannonball
    if (this.ballActive) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(this.ballX, this.ballY, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.stroke();
    }

    // Draw Crash site marker
    if (this.ballCrashed && this.crashSite) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(this.crashSite.x, this.crashSite.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();

      // Crash dust cloud
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(this.time * 0.1);
      ctx.strokeStyle = '#f87171'; ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.arc(this.crashSite.x, this.crashSite.y, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // Status legend text box
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,42,0.8)';
    ctx.strokeStyle = 'rgba(56,189,248,0.2)';
    this.rrect(ctx, IX + 24, 80, 195, 75, 10);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fff'; ctx.font = 'bold 9.5px Outfit,sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Cannon Status:', IX + 36, 100);
    
    ctx.font = '500 9px Outfit,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(`Initial Speed: ${this.cannonballSpeed.toFixed(1)} km/s`, IX + 36, 116);
    
    // Status color selection
    let statusText = 'Ready to launch';
    let statusColor = '#94a3b8';
    if (this.ballActive) {
      statusText = 'In flight...';
      statusColor = '#38bdf8';
    } else if (this.ballCrashed) {
      statusText = 'Crashed into Earth!';
      statusColor = '#f87171';
    } else if (this.ballEscaped) {
      statusText = 'Escaped Earth gravity!';
      statusColor = '#c084fc';
    } else if (this.ballPath.length > 0) {
      // Completed full orbit!
      statusText = 'Completed stable orbit! ✓';
      statusColor = '#4ade80';
    }
    ctx.fillStyle = statusColor; ctx.font = 'bold 9px Outfit,sans-serif';
    ctx.fillText(statusText, IX + 36, 134);
    ctx.restore();

    // Subtitle headers
    ctx.fillStyle = '#fff'; ctx.font = '600 13px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText("Newton's Cannonball Thought Experiment", IX + IW / 2, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 10px Outfit,sans-serif';
    ctx.fillText("Adjust launch speed in bottom panel. Firing at 7.9 km/s curves the fall exactly matching Earth's surface.", IX + IW / 2, 61);
  }

  // ── Subtask 2: Law of Gravity Derivation ──────────────────
  // The HTML/SVG GravityIllustration overlay handles all rendering for this tab.
  drawGravity(ctx, IX, IW, IH) {
    // The overlay is position:absolute on top of the canvas.
    // The starfield (drawn in animate()) remains visible underneath.
    return;
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resizeBound);
    if (this._gravityIllustration) {
      this._gravityIllustration.destroy();
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    if (this.accelerationContainer && this.accelerationContainer.parentNode) {
      this.accelerationContainer.parentNode.removeChild(this.accelerationContainer);
    }
    if (this.orbitContainer && this.orbitContainer.parentNode) {
      this.orbitContainer.parentNode.removeChild(this.orbitContainer);
    }
    if (this._conic3d) {
      if (this._conic3d.animId) cancelAnimationFrame(this._conic3d.animId);
      if (this._conic3d.renderer) this._conic3d.renderer.dispose();
      this._conic3d = null;
    }
  }

  renderAccelerationUI() {
    if (this.subtask !== 'acceleration') return;

    if (this.accelerationX === undefined) this.accelerationX = 30; // 30 degrees for 2*theta

    const twoThetaDeg = this.accelerationX;
    const twoTheta = (twoThetaDeg * Math.PI) / 180;
    const theta = twoTheta / 2;

    const sunX = 200;
    const sunY = 200;
    const r = 150;

    const px = sunX + r * Math.sin(twoTheta);
    const py = sunY - r * Math.cos(twoTheta);

    if (!this.accelerationUIInitialized) {
      this.accelerationContainer.innerHTML = `
        <div class="flex flex-col lg:flex-row h-full w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
          <!-- Spacer to clear left task panel -->
          <div class="hidden lg:block lg:w-[420px] shrink-0 pointer-events-none"></div>

          <!-- Left Panel: Math Explanation & Proof Derivation -->
          <div class="w-full lg:w-[380px] bg-slate-900 border-r border-slate-800 p-4 flex flex-col z-20 overflow-y-auto shrink-0">
            <h2 class="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Geometric Acceleration Proof
            </h2>
            <p class="text-[10.5px] text-slate-400 mb-4 font-sans">
              How Newton geometrically derived the centripetal acceleration (a = v²/R) equation.
            </p>

            <div class="flex flex-col gap-3">
              <!-- Explanation Box -->
              <div class="bg-slate-850/50 p-3 rounded-xl border border-slate-800/80">
                <h3 class="text-[11px] font-bold text-violet-400 mb-1.5 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                  Newton's Geometric Insight
                </h3>
                <p class="text-[10px] text-slate-300 mb-2 leading-relaxed font-sans">
                  Newton analyzed an orbit as a series of constant falling drops towards the center.
                  Over a small time interval t:
                  <br>• The satellite travels horizontally by v · t (inertial tangent).
                  <br>• It falls vertically towards the center by ½ · a · t².
                </p>
                <p class="text-[10px] text-slate-400 leading-relaxed font-sans">
                  As the time interval t → 0 (drag the slider in the top-right to test), the approximation sin(2θ) ≈ 2θ and tanθ ≈ θ becomes exact.
                </p>
              </div>

              <!-- Trigonometric Limits Card -->
              <div class="bg-slate-850/50 p-3 rounded-xl border border-slate-800/80 font-sans">
                <h3 class="text-[11px] font-bold text-sky-400 mb-1.5 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
                  Trigonometric Limit
                </h3>
                <div class="space-y-2 text-[10px] text-slate-300 font-sans">
                  <div class="bg-slate-950/50 p-2 rounded border border-slate-900 leading-relaxed font-mono">
                    <div>tan(θ) = opposite / adjacent</div>
                    <div class="text-sky-400 font-bold">tan(θ) = (½ · a · t²) / (v · t)</div>
                    <div class="text-violet-400 font-bold">tan(θ) = ½ · a · t / v ≈ θ</div>
                  </div>
                  <div class="bg-slate-950/50 p-2 rounded border border-slate-900 leading-relaxed font-mono mt-1.5">
                    <div>sin(2θ) = opposite / hypotenuse</div>
                    <div class="text-yellow-400 font-bold">sin(2θ) = v · t / R</div>
                    <div class="text-violet-400 font-bold">sin(2θ) ≈ 2θ</div>
                  </div>
                </div>
              </div>

              <!-- Proof Derivation Card (Moved to Left Panel) -->
              <div class="bg-slate-850/50 p-3 rounded-xl border border-slate-800/80 font-mono text-[9.5px] space-y-2">
                <h3 class="text-[11px] font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5 font-sans">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                  Proof Derivation
                </h3>
                <div class="space-y-1 bg-slate-950/60 p-2.5 rounded border border-slate-850 leading-relaxed">
                  <div class="text-slate-400">tan(θ) = (½ · a · t²) / (v · t) ≈ θ</div>
                  <div class="text-slate-400">sin(2θ) = v · t / R</div>
                  <div class="text-white flex items-center gap-1.5 my-1.5">
                    <span>⟹</span>
                    <span class="text-sky-400 font-bold">2 · (½ · a · t) / v = v · t / R</span>
                  </div>
                  <div class="text-white flex items-center gap-1.5 font-bold">
                    <span>⟹</span>
                    <span class="text-yellow-400 font-extrabold">v² = a · R</span>
                  </div>
                  <div class="text-white flex items-center gap-1.5 font-bold mt-1">
                    <span>⟹</span>
                    <span class="text-green-400 font-extrabold">a = v² / R</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Panel: SVG Illustration -->
          <div class="flex-grow relative bg-black flex flex-col h-full overflow-hidden">
            <div class="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800/80 backdrop-blur text-xs font-semibold">
              <svg class="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              Space Geometry View
            </div>

            <!-- Floating slider box in the top-right of illustration area -->
            <div class="absolute top-4 right-4 z-20 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl shadow-xl w-[260px] backdrop-blur-md">
              <h4 class="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>
                Time Interval (Δt)
              </h4>
              <div class="flex justify-between text-[10px] text-slate-400 mb-1.5">
                <span>Angle 2θ:</span>
                <span id="accel-angle-val" class="text-violet-400 font-bold">${twoThetaDeg}°</span>
              </div>
              <input type="range" id="accel-x-slider" min="5" max="60" value="${twoThetaDeg}" 
                class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500">
            </div>

            <!-- Dynamic Status Bar in bottom-right -->
            <div id="accel-status-bar" class="absolute bottom-4 right-4 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-200 backdrop-blur-md shadow-2xl max-w-[240px]">
              <h4 class="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Limit Verification
              </h4>
              <p id="accel-status-desc" class="text-[10px] leading-relaxed opacity-90">
                Small angle approximation holds: sin(2θ) ≈ 2θ is verified.
              </p>
            </div>

            <div class="flex-grow w-full h-full relative flex items-center justify-center p-6 flex-col">
              <!-- Background Grid -->
              <div class="absolute inset-0 opacity-15 pointer-events-none" style="background-image: linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px); background-size: 30px 30px;"></div>

              <svg viewBox="0 0 400 400" class="w-full max-h-[92%] z-10 overflow-visible">
                <defs>
                  <!-- Arrow Markers -->
                  <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
                  </marker>
                </defs>

                <!-- Circle Orbit -->
                <circle cx="${sunX}" cy="${sunY}" r="${r}" fill="none" stroke="#475569" stroke-width="1.5" />

                <!-- Vertical diameter dashed line -->
                <line x1="${sunX}" y1="${sunY - r}" x2="${sunX}" y2="${sunY + r}" stroke="rgba(255,255,255,0.15)" stroke-dasharray="3,3" />

                <!-- Chords and lines -->
                <line id="svg-chord-top" x1="${sunX}" y1="${sunY - r}" x2="${px}" y2="${py}" stroke="#94a3b8" stroke-width="1" />
                <line id="svg-chord-bot" x1="${sunX}" y1="${sunY + r}" x2="${px}" y2="${py}" stroke="#64748b" stroke-width="1" />
                <line id="svg-radius-line" x1="${sunX}" y1="${sunY}" x2="${px}" y2="${py}" stroke="#eab308" stroke-width="1.2" />
                <text id="svg-radius-text" x="" y="" fill="#eab308" font-size="8.5" font-family="Outfit" font-weight="bold">R</text>

                <!-- Vertical segment representing fall (1/2 * a * t^2) -->
                <line id="svg-fall-line" x1="${sunX}" y1="${sunY - r}" x2="${sunX}" y2="${py}" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow-blue)" />
                <text id="svg-fall-text" x="${sunX - 55}" y="" fill="#38bdf8" font-size="7.5" font-family="Outfit" font-weight="bold">½ · a · t²</text>

                <!-- Horizontal segment representing velocity (v * t) -->
                <line id="svg-vel-line" x1="${sunX}" y1="${py}" x2="${px}" y2="${py}" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow-blue)" />
                <text id="svg-vel-text" x="" y="" fill="#38bdf8" font-size="7.5" font-family="Outfit" font-weight="bold" text-anchor="middle">v · t</text>

                <!-- Angle Arcs -->
                <path id="svg-arc-center" d="" fill="none" stroke="#eab308" stroke-width="1" />
                <text id="svg-arc-center-text" x="" y="" fill="#eab308" font-size="7" font-family="Outfit">2θ</text>

                <path id="svg-arc-bottom" d="" fill="none" stroke="#64748b" stroke-width="1" />
                <text id="svg-arc-bottom-text" x="" y="" fill="#64748b" font-size="7" font-family="Outfit">θ</text>

                <path id="svg-arc-chord" d="" fill="none" stroke="#94a3b8" stroke-width="1" />
                <text id="svg-arc-chord-text" x="" y="" fill="#94a3b8" font-size="7" font-family="Outfit">θ</text>
              </svg>
            </div>
          </div>
        </div>
      `;

      const slider = this.accelerationContainer.querySelector('#accel-x-slider');
      slider.addEventListener('input', (e) => {
        this.accelerationX = parseInt(e.target.value);
        this.renderAccelerationUI();
      });

      this.accelerationUIInitialized = true;
    }

    // --- DYNAMIC UPDATES ---
    this.accelerationContainer.querySelector('#accel-x-slider').value = this.accelerationX;
    this.accelerationContainer.querySelector('#accel-angle-val').textContent = `${twoThetaDeg}°`;

    const pxVal = sunX + r * Math.sin(twoTheta);
    const pyVal = sunY - r * Math.cos(twoTheta);

    this.accelerationContainer.querySelector('#svg-chord-top').setAttribute('x2', pxVal);
    this.accelerationContainer.querySelector('#svg-chord-top').setAttribute('y2', pyVal);
    
    this.accelerationContainer.querySelector('#svg-chord-bot').setAttribute('x2', pxVal);
    this.accelerationContainer.querySelector('#svg-chord-bot').setAttribute('y2', pyVal);

    this.accelerationContainer.querySelector('#svg-radius-line').setAttribute('x2', pxVal);
    this.accelerationContainer.querySelector('#svg-radius-line').setAttribute('y2', pyVal);
    
    const dxP = pxVal - sunX;
    const dyP = pyVal - sunY;
    const lenP = Math.sqrt(dxP*dxP + dyP*dyP);
    const uxP = dxP / (lenP || 1);
    const uyP = dyP / (lenP || 1);
    const perpX = -uyP;
    const perpY = uxP;
    const textX = sunX + dxP * 0.5 + perpX * 8;
    const textY = sunY + dyP * 0.5 + perpY * 8;
    this.accelerationContainer.querySelector('#svg-radius-text').setAttribute('x', textX);
    this.accelerationContainer.querySelector('#svg-radius-text').setAttribute('y', textY);

    this.accelerationContainer.querySelector('#svg-fall-line').setAttribute('y2', pyVal - 2);
    this.accelerationContainer.querySelector('#svg-fall-text').setAttribute('y', (sunY - r) + (pyVal - (sunY - r)) / 2 + 3);

    this.accelerationContainer.querySelector('#svg-vel-line').setAttribute('y1', pyVal);
    this.accelerationContainer.querySelector('#svg-vel-line').setAttribute('x2', pxVal - 2);
    this.accelerationContainer.querySelector('#svg-vel-line').setAttribute('y2', pyVal);
    this.accelerationContainer.querySelector('#svg-vel-text').setAttribute('x', sunX + (pxVal - sunX) / 2);
    this.accelerationContainer.querySelector('#svg-vel-text').setAttribute('y', pyVal + 10);

    const arcR1 = 28;
    const startX1 = sunX;
    const startY1 = sunY - arcR1;
    const endX1 = sunX + arcR1 * Math.sin(twoTheta);
    const endY1 = sunY - arcR1 * Math.cos(twoTheta);
    const pathD1 = `M ${startX1} ${startY1} A ${arcR1} ${arcR1} 0 0 1 ${endX1} ${endY1}`;
    this.accelerationContainer.querySelector('#svg-arc-center').setAttribute('d', pathD1);
    const labelAngle1 = -Math.PI/2 + twoTheta/2;
    this.accelerationContainer.querySelector('#svg-arc-center-text').setAttribute('x', sunX + (arcR1 + 10) * Math.cos(labelAngle1));
    this.accelerationContainer.querySelector('#svg-arc-center-text').setAttribute('y', sunY + (arcR1 + 10) * Math.sin(labelAngle1) + 3);

    const botY = sunY + r;
    const arcR2 = 35;
    const startX2 = sunX;
    const startY2 = botY - arcR2;
    const dxBot = pxVal - sunX;
    const dyBot = pyVal - botY;
    const chordAngle = Math.atan2(dyBot, dxBot);
    const endX2 = sunX + arcR2 * Math.cos(chordAngle);
    const endY2 = botY + arcR2 * Math.sin(chordAngle);
    const pathD2 = `M ${startX2} ${startY2} A ${arcR2} ${arcR2} 0 0 1 ${endX2} ${endY2}`;
    this.accelerationContainer.querySelector('#svg-arc-bottom').setAttribute('d', pathD2);
    const labelAngle2 = -Math.PI/2 + theta/2;
    this.accelerationContainer.querySelector('#svg-arc-bottom-text').setAttribute('x', sunX + (arcR2 + 10) * Math.cos(labelAngle2));
    this.accelerationContainer.querySelector('#svg-arc-bottom-text').setAttribute('y', botY + (arcR2 + 10) * Math.sin(labelAngle2) + 3);

    const arcR3 = 30;
    const startX3 = pxVal - arcR3;
    const startY3 = pyVal;
    const dxChord = sunX - pxVal;
    const dyChord = (sunY - r) - pyVal;
    const chordAngleTop = Math.atan2(dyChord, dxChord);
    const endX3 = pxVal + arcR3 * Math.cos(chordAngleTop);
    const endY3 = pyVal + arcR3 * Math.sin(chordAngleTop);
    const pathD3 = `M ${startX3} ${startY3} A ${arcR3} ${arcR3} 0 0 1 ${endX3} ${endY3}`;
    this.accelerationContainer.querySelector('#svg-arc-chord').setAttribute('d', pathD3);
    const labelAngle3 = Math.PI - theta/2;
    this.accelerationContainer.querySelector('#svg-arc-chord-text').setAttribute('x', pxVal + (arcR3 + 12) * Math.cos(labelAngle3));
    this.accelerationContainer.querySelector('#svg-arc-chord-text').setAttribute('y', pyVal + (arcR3 + 12) * Math.sin(labelAngle3) + 3);

    const statusDesc = this.accelerationContainer.querySelector('#accel-status-desc');
    const ratio = Math.sin(twoTheta) / (twoTheta || 1);
    const percentDrift = ((1 - ratio) * 100).toFixed(2);
    statusDesc.innerHTML = `
      Small angle approximation:
      <br>• sin(2θ) ≈ 2θ (error: <strong>${percentDrift}%</strong>).
      <br>• tan(θ) ≈ θ (error: <strong>${((Math.tan(theta) - theta) / (theta || 1) * 100).toFixed(2)}%</strong>).
      <br><span class="text-violet-400 font-bold">Limit holds!</span> As Δt → 0, a = v² / R is exact.
    `;
  }

  // ── Subtask 3: Universal Orbit Proof (Conic Sections & Derivation) ────
  renderOrbitUI() {
    if (this.subtask !== 'orbit') return;

    if (!this.orbitUIInitialized) {
      this.orbitContainer.innerHTML = `
        <div class="flex flex-col lg:flex-row h-full w-full bg-slate-950 text-slate-200 font-sans overflow-hidden relative">
          <!-- Spacer to clear left task panel -->
          <div class="hidden lg:block lg:w-[420px] shrink-0 pointer-events-none"></div>

          <!-- Left Panel: Math Explanation & Derivation -->
          <div class="w-full lg:w-[380px] bg-slate-900 border-r border-slate-800 p-4 flex flex-col z-20 overflow-y-auto shrink-0 space-y-3">
            <div>
              <h2 class="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-1 flex items-center gap-1.5 font-sans">
                <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Universal Orbit Kinematics
              </h2>
              <p class="text-[10px] text-slate-400 leading-relaxed font-sans">
                Unified kinematic derivation of orbital eccentricity e from local launch velocity v.
              </p>
            </div>

            <!-- Controls -->
            <div class="bg-slate-850/50 p-3 rounded-xl border border-slate-800/80">
              <label class="flex justify-between text-[11px] font-bold text-cyan-400 mb-1.5">
                <span>Launch Velocity (v)</span>
                <span id="orbit-lbl-v" class="text-yellow-300 font-mono font-bold">1.00 v₀</span>
              </label>
              <input type="range" id="orbit-v-slider" min="1.0" max="2.0" step="0.005" value="1.0"
                class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400">
              <div class="flex justify-between text-[9px] text-slate-500 mt-1 font-semibold">
                <span class="text-sky-400 font-bold">Circle (1.00 v₀)</span>
                <button id="snap-sqrt2-btn" class="text-yellow-400 font-bold hover:underline cursor-pointer bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/30 transition" title="Click to snap to Escape Speed (√2 v₀)">
                  ⚡ Parabola (√2 v₀ ≈ 1.414)
                </button>
                <span class="text-red-400 font-bold text-right">Hyperbola (&gt; 1.41 v₀)</span>
              </div>
            </div>

            <!-- Live Calculations -->
            <div class="bg-slate-850/50 p-3 rounded-xl border border-slate-800/80 font-mono text-[10px] space-y-2">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans mb-1 flex justify-between items-center">
                <span>Universal Formula</span>
                <span id="orbit-val-type" class="px-2 py-0.5 rounded text-[9.5px] font-bold bg-blue-500/20 text-blue-400">Circle</span>
              </div>

              <div class="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-850">
                <span class="text-slate-300 font-sans">Ratio (v / v₀)²</span>
                <span id="orbit-val-ratio" class="text-yellow-400 font-bold">1.000</span>
              </div>

              <div class="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-850">
                <span class="text-slate-300 font-sans">Eccentricity e = |(v/v₀)² − 1|</span>
                <span id="orbit-val-e" class="text-white font-bold">0.000</span>
              </div>
            </div>

            <!-- Proof Derivation Card (from @[orbit_derivation]) -->
            <div class="bg-slate-850/50 p-3 rounded-xl border border-slate-800/80 space-y-2 font-sans">
              <h3 class="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Kinematic Proof Steps
              </h3>
              <div class="text-[9.5px] text-slate-300 space-y-2">
                <div>
                  <span class="font-bold text-white">1. Conic &amp; Kinematic Equations:</span>
                  <div id="orbit-proof-step1" class="bg-slate-950/60 p-1.5 rounded border border-slate-850 font-mono text-[9px] text-cyan-300 mt-0.5">
                    (x+Ae)²/A² + y²/[A²(1-e²)] = 1<br>
                    y = v·t, x = (1-e)A − ½g·t² = r − ½g·t²
                  </div>
                </div>
                <div>
                  <span class="font-bold text-white">2. Taylor Limit (t⁴ → 0):</span>
                  <div class="bg-slate-950/60 p-1.5 rounded border border-slate-850 font-mono text-[9px] text-cyan-300 mt-0.5">
                    v² / [(1-e²)A] = g
                  </div>
                </div>
                <div>
                  <span class="font-bold text-white">3. Substitute g = v₀²/r &amp; r = A(1-e):</span>
                  <div class="bg-slate-950/60 p-1.5 rounded border border-slate-850 font-mono text-[9px] text-yellow-300 mt-0.5">
                    v² / [A(1-e)(1+e)] = v₀² / [A(1-e)]
                  </div>
                </div>
                <div>
                  <span class="font-bold text-white">4. Final Unification:</span>
                  <div class="bg-slate-950/60 p-1.5 rounded border border-slate-850 font-mono text-[9.5px] font-bold text-emerald-400 mt-0.5">
                    e = (v / v₀)² − 1
                  </div>
                </div>
              </div>
            </div>

            <!-- Visual Legend -->
            <div class="bg-slate-850/50 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-[9.5px] text-slate-300 font-sans">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Visual Legend</div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-blue-500/50 border border-blue-400"></div> Earth Focus &amp; Gravity (g)
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-0.5 bg-cyan-400"></div> True Orbital Path (Polar Conic)
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-0.5 border-b-2 border-dashed border-yellow-400"></div> Kinematic Parabola (x = r_p − ½gt²)
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-0.5 bg-pink-500"></div> Geometric Axes (A &amp; B, Center C)
              </div>
            </div>

            <!-- 3D Conic View Controls -->
            <div class="bg-slate-850/50 p-3 rounded-xl border border-slate-800/80 space-y-2 font-sans">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">3D Conic View Controls</div>
              <div>
                <label class="flex justify-between text-[10px] font-semibold text-cyan-400 mb-1">
                  <span>Illustration Width</span>
                  <span id="conic-width-lbl" class="text-yellow-300 font-mono">200px</span>
                </label>
                <input type="range" id="conic-width-slider" min="120" max="600" step="10" value="200"
                  class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400">
                <div class="flex justify-between text-[8px] text-slate-500 mt-0.5 font-semibold">
                  <span>120px</span>
                  <span>600px</span>
                </div>
              </div>
              <div>
                <label class="flex justify-between text-[10px] font-semibold text-cyan-400 mb-1">
                  <span>Illustration Height</span>
                  <span id="conic-height-lbl" class="text-yellow-300 font-mono">220px</span>
                </label>
                <input type="range" id="conic-height-slider" min="120" max="400" step="10" value="220"
                  class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400">
                <div class="flex justify-between text-[8px] text-slate-500 mt-0.5 font-semibold">
                  <span>120px</span>
                  <span>400px</span>
                </div>
              </div>
              <div>
                <label class="flex justify-between text-[10px] font-semibold text-cyan-400 mb-1">
                  <span>View Azimuth</span>
                  <span id="conic-azimuth-lbl" class="text-yellow-300 font-mono">45°</span>
                </label>
                <input type="range" id="conic-azimuth-slider" min="0" max="360" step="1" value="45"
                  class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400">
                <div class="flex justify-between text-[8px] text-slate-500 mt-0.5 font-semibold">
                  <span>0°</span>
                  <span>360°</span>
                </div>
              </div>
              <div>
                <label class="flex justify-between text-[10px] font-semibold text-cyan-400 mb-1">
                  <span>View Elevation</span>
                  <span id="conic-elevation-lbl" class="text-yellow-300 font-mono">-5°</span>
                </label>
                <input type="range" id="conic-elevation-slider" min="-90" max="90" step="1" value="-5"
                  class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400">
                <div class="flex justify-between text-[8px] text-slate-500 mt-0.5 font-semibold">
                  <span>-90°</span>
                  <span>90°</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Panel: Canvas Illustration Area -->
          <div class="flex-grow relative bg-slate-950 flex flex-col h-full overflow-hidden">
            <canvas id="orbit-canvas-inner" class="w-full h-full block"></canvas>

            <!-- 3D Conic Section Illustration Inset Card (bottom-right) -->
            <div id="conic-inset-card" class="absolute bottom-3 right-3 w-[200px] h-[220px] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-1.5 flex flex-col pointer-events-auto z-30">
              <div class="px-1 pb-1 mb-1 border-b border-slate-800/80 text-[10px] font-bold font-sans flex items-center justify-between text-cyan-400">
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                  3D Conic Section Cut
                </span>
              </div>
              <div id="conic-3d-canvas-container" class="w-full flex-grow relative rounded overflow-hidden" style="pointer-events:auto;">
                <div id="conic-angle-lbl" class="absolute top-1.5 left-1.5 z-10 px-2 py-0.5 bg-slate-950/80 backdrop-blur border border-amber-500/30 rounded text-[9.5px] font-mono text-amber-300 font-bold shadow pointer-events-none">
                  θ = 0.0° (Circle)
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      const slider = this.orbitContainer.querySelector('#orbit-v-slider');
      const snapBtn = this.orbitContainer.querySelector('#snap-sqrt2-btn');
      const sqrt2 = Math.SQRT2; // ~1.41421356

      slider.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        // Snap to sqrt(2) if within 0.025 distance
        if (Math.abs(val - sqrt2) < 0.025) {
          val = sqrt2;
          slider.value = val;
        }
        this.orbitV_ratio = val;
        this.orbitTime = 0;
      });

      if (snapBtn) {
        snapBtn.addEventListener('click', () => {
          this.orbitV_ratio = sqrt2;
          slider.value = sqrt2;
          this.orbitTime = 0;
        });
      }

      const conic3dBox = this.orbitContainer.querySelector('#conic-3d-canvas-container');
      if (conic3dBox) {
        this.initConic3D(conic3dBox);
      }

      // 3D Conic View size controls
      const conicInsetCard = this.orbitContainer.querySelector('#conic-inset-card');
      const conicWidthSlider = this.orbitContainer.querySelector('#conic-width-slider');
      const conicWidthLbl = this.orbitContainer.querySelector('#conic-width-lbl');
      const conicHeightSlider = this.orbitContainer.querySelector('#conic-height-slider');
      const conicHeightLbl = this.orbitContainer.querySelector('#conic-height-lbl');

      if (conicWidthSlider && conicInsetCard) {
        conicWidthSlider.addEventListener('input', (e) => {
          const w = parseInt(e.target.value);
          conicInsetCard.style.width = w + 'px';
          if (conicWidthLbl) conicWidthLbl.textContent = w + 'px';
        });
      }
      if (conicHeightSlider && conicInsetCard) {
        conicHeightSlider.addEventListener('input', (e) => {
          const h = parseInt(e.target.value);
          conicInsetCard.style.height = h + 'px';
          if (conicHeightLbl) conicHeightLbl.textContent = h + 'px';
        });
      }

      // Camera angle controls
      const azimuthSlider = this.orbitContainer.querySelector('#conic-azimuth-slider');
      const azimuthLbl = this.orbitContainer.querySelector('#conic-azimuth-lbl');
      const elevationSlider = this.orbitContainer.querySelector('#conic-elevation-slider');
      const elevationLbl = this.orbitContainer.querySelector('#conic-elevation-lbl');

      const updateCameraAngle = () => {
        if (!this._conic3d) return;
        const azDeg = parseFloat(azimuthSlider.value);
        const elDeg = parseFloat(elevationSlider.value);
        if (azimuthLbl) azimuthLbl.textContent = azDeg + '°';
        if (elevationLbl) elevationLbl.textContent = elDeg + '°';

        const az = azDeg * Math.PI / 180;
        const el = elDeg * Math.PI / 180;
        const radius = 57; // distance from target
        const target = this._conic3d.controls.target;

        this._conic3d.camera.position.set(
          target.x + radius * Math.cos(el) * Math.sin(az),
          target.y + radius * Math.sin(el),
          target.z + radius * Math.cos(el) * Math.cos(az)
        );
        this._conic3d.camera.lookAt(target);
        this._conic3d.controls.update();
      };

      if (azimuthSlider) azimuthSlider.addEventListener('input', updateCameraAngle);
      if (elevationSlider) elevationSlider.addEventListener('input', updateCameraAngle);

      this.orbitUIInitialized = true;
    }

    const innerCanvas = this.orbitContainer.querySelector('#orbit-canvas-inner');
    if (!innerCanvas) return;
    const ctx = innerCanvas.getContext('2d');
    const width = innerCanvas.clientWidth || (window.innerWidth - 380);
    const height = innerCanvas.clientHeight || window.innerHeight;

    if (innerCanvas.width !== width || innerCanvas.height !== height) {
      innerCanvas.width = width;
      innerCanvas.height = height;
    }

    this.drawOrbitCanvas(ctx, width, height);
    this.updateConic3D(this.orbitV_ratio);
  }

  drawOrbitCanvas(ctx, width, height) {
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, width, height);

    const centerX = width * 0.35;
    const centerY = height * 0.5;
    const R_PERIAPSIS = 140;

    const v_ratio = this.orbitV_ratio;
    // Force exact ratio_sq = 2.0 when v_ratio is Math.SQRT2
    const ratio_sq = Math.abs(v_ratio - Math.SQRT2) < 1e-6 ? 2.0 : v_ratio * v_ratio;
    let e = ratio_sq - 1;
    let isApogee = false;

    if (e < 0) {
      e = Math.abs(e);
      isApogee = true;
    }

    // Update DOM texts inside orbitContainer
    const lblV = this.orbitContainer.querySelector('#orbit-lbl-v');
    const valRatio = this.orbitContainer.querySelector('#orbit-val-ratio');
    const valE = this.orbitContainer.querySelector('#orbit-val-e');
    const valType = this.orbitContainer.querySelector('#orbit-val-type');

    const isSnappedSqrt2 = Math.abs(v_ratio - Math.SQRT2) < 1e-6;
    if (lblV) lblV.textContent = isSnappedSqrt2 ? '√2 v₀ (1.414)' : v_ratio.toFixed(2) + ' v₀';
    if (valRatio) valRatio.textContent = ratio_sq.toFixed(3);
    if (valE) valE.textContent = e.toFixed(3);

    if (valType) {
      let typeStr = "";
      let typeColor = "";
      let typeBg = "";
      if (Math.abs(e) < 0.001) {
        typeStr = "Circle"; typeColor = "text-blue-400"; typeBg = "bg-blue-500/20";
      } else if (Math.abs(e - 1.0) < 0.005) {
        typeStr = "Parabola (Escape)"; typeColor = "text-yellow-400"; typeBg = "bg-yellow-500/20";
      } else if (e < 1.0) {
        typeStr = "Ellipse"; typeColor = "text-green-400"; typeBg = "bg-green-500/20";
      } else {
        typeStr = "Hyperbola"; typeColor = "text-red-400"; typeBg = "bg-red-500/20";
      }
      valType.className = `px-2 py-0.5 rounded text-[9.5px] font-bold ${typeBg} ${typeColor}`;
      valType.textContent = typeStr;
    }

    const proofStep1 = this.orbitContainer.querySelector('#orbit-proof-step1');
    if (proofStep1) {
      if (Math.abs(e - 1.0) < 0.005 || isSnappedSqrt2) {
        proofStep1.innerHTML = `y = v·t, x = r − ½g·t²<br>r = v²/g; x = r − y²/(4r)`;
      } else {
        proofStep1.innerHTML = `(x+Ae)²/A² + y²/[A²(1-e²)] = 1<br>y = v·t, x = (1-e)A − ½g·t² = r − ½g·t²`;
      }
    }

    ctx.save();
    ctx.translate(centerX, centerY);

    // Semi-latus rectum p
    let p = isApogee ? R_PERIAPSIS * (1 - e) : R_PERIAPSIS * (1 + e);

    // Draw True Orbit (Cyan)
    ctx.beginPath();
    let startTheta = -Math.PI;
    let endTheta = Math.PI;
    if (e > 1) {
      const limit = Math.acos(-1 / (e || 1));
      startTheta = -limit + 0.1;
      endTheta = limit - 0.1;
    }

    for (let theta = startTheta; theta <= endTheta; theta += 0.01) {
      let effectiveTheta = isApogee ? theta + Math.PI : theta;
      let radius = p / (1 + e * Math.cos(effectiveTheta));
      let x = radius * Math.cos(theta);
      let y = radius * Math.sin(theta);

      if (theta === startTheta) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw Major & Minor Axes (Pink)
    if (e !== 1 && e < 3) {
      let A = Math.abs(R_PERIAPSIS / (1 - (isApogee ? -e : e)));
      let B = A * Math.sqrt(Math.abs(1 - e * e));
      let center_X = isApogee ? R_PERIAPSIS - A : (e < 1 ? R_PERIAPSIS - A : R_PERIAPSIS + A);

      ctx.beginPath();
      ctx.moveTo(center_X - A, 0); ctx.lineTo(center_X + A, 0);
      ctx.moveTo(center_X, -B); ctx.lineTo(center_X, B);
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(center_X, 0, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ec4899';
      ctx.fill();
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.fillText('C', center_X - 5, 16);
      ctx.fillText('A', center_X + A / 2, -6);
      ctx.fillText('B', center_X + 6, -B / 2);
    }

    // Kinematic Parabolic Approximation (Yellow Dashed)
    ctx.beginPath();
    const yRange = 260;
    for (let y = -yRange; y <= yRange; y += 4) {
      let direction = isApogee ? 1 : -1;
      let approx_x = R_PERIAPSIS + direction * (y * y) / (2 * R_PERIAPSIS * ratio_sq);
      if (y === -yRange) ctx.moveTo(approx_x, y);
      else ctx.lineTo(approx_x, y);
    }
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Earth Focus
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
    grad.addColorStop(0, '#60a5fa');
    grad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Gravity vector g
    ctx.beginPath();
    ctx.moveTo(R_PERIAPSIS - 10, 0);
    ctx.lineTo(R_PERIAPSIS - 38, 0);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.lineWidth = 2;
    ctx.lineTo(R_PERIAPSIS - 28, -4);
    ctx.moveTo(R_PERIAPSIS - 38, 0);
    ctx.lineTo(R_PERIAPSIS - 28, 4);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('g', R_PERIAPSIS - 25, -10);

    // Launch Point & Velocity Vector v
    ctx.beginPath();
    ctx.arc(R_PERIAPSIS, 0, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(R_PERIAPSIS, 0);
    const vLen = v_ratio * 45;
    ctx.lineTo(R_PERIAPSIS, -vLen);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2.5;
    ctx.lineTo(R_PERIAPSIS - 4, -vLen + 7);
    ctx.moveTo(R_PERIAPSIS, -vLen);
    ctx.lineTo(R_PERIAPSIS + 4, -vLen + 7);
    ctx.stroke();
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('v', R_PERIAPSIS + 10, -vLen / 2);

    // Animated Orbiting Satellite Body
    let speed = 0.02 * v_ratio;
    let effectiveAnimTheta = isApogee ? this.orbitTime + Math.PI : this.orbitTime;

    if (e > 1) {
      const limit = Math.acos(-1 / e) - 0.2;
      if (this.orbitTime > limit) this.orbitTime = -limit;
      else if (this.orbitTime < -limit) this.orbitTime = -limit;
    } else {
      if (this.orbitTime > Math.PI * 2) this.orbitTime -= Math.PI * 2;
    }

    let r_anim = p / (1 + e * Math.cos(effectiveAnimTheta));
    let anim_x = r_anim * Math.cos(this.orbitTime);
    let anim_y = r_anim * Math.sin(this.orbitTime);

    ctx.beginPath();
    ctx.arc(anim_x, -anim_y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (this.isSimPlaying) {
      let r_current = p / (1 + e * Math.cos(effectiveAnimTheta));
      this.orbitTime += (speed * R_PERIAPSIS * R_PERIAPSIS) / (r_current * r_current || 1);
    }

    ctx.restore();
  }

  // ── 3D Conic Section Illustration (based on @[conic]) ──────────────────
  initConic3D(container) {
    if (this._conic3d) return;

    const width = container.clientWidth || 254;
    const height = container.clientHeight || 230;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(40, -5, 40);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    renderer.domElement.style.pointerEvents = 'auto';
    renderer.domElement.style.touchAction = 'none';

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, -28, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(50, 80, 30);
    scene.add(dirLight);

    // Cone Geometry (45 degree slope angle)
    const coneSlopeAngle = Math.PI / 4;
    const coneHeight = 60;
    const coneRadius = coneHeight * Math.tan(coneSlopeAngle);

    const coneGroup = new THREE.Group();
    scene.add(coneGroup);

    // Transparent Cone Body
    const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 64, 1, true);
    coneGeo.translate(0, -coneHeight / 2, 0);
    const coneMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transparent: true, opacity: 0.12,
      side: THREE.DoubleSide, depthWrite: false, roughness: 0.2
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneGroup.add(coneMesh);

    // Wireframe Edges
    const edgeGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 16, 1, true);
    edgeGeo.translate(0, -coneHeight / 2, 0);
    const edges = new THREE.EdgesGeometry(edgeGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
    const coneEdges = new THREE.LineSegments(edges, edgeMat);
    coneGroup.add(coneEdges);

    // Axis Line
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 10, 0),
      new THREE.Vector3(0, -coneHeight - 10, 0)
    ]);
    const axisMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 1.5, gapSize: 1.5, transparent: true, opacity: 0.4 });
    const axisLine = new THREE.Line(axisGeo, axisMat);
    axisLine.computeLineDistances();
    coneGroup.add(axisLine);

    // Dynamic Slicing Group
    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);

    // Slicing Plane
    const planeGeo = new THREE.PlaneGeometry(120, 160);
    planeGeo.rotateX(-Math.PI / 2);
    const planeMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transparent: true, opacity: 0.22,
      side: THREE.DoubleSide, depthWrite: false
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);

    const pivotY = -25;
    const planePivot = new THREE.Group();
    planePivot.position.y = pivotY;
    planePivot.add(planeMesh);
    dynamicGroup.add(planePivot);

    // Intersection Line
    const curveMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 });
    const curveLine = new THREE.Line(new THREE.BufferGeometry(), curveMat);
    dynamicGroup.add(curveLine);

    // Intersection Surface
    const surfaceMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
    const surfaceMesh = new THREE.Mesh(new THREE.BufferGeometry(), surfaceMat);
    dynamicGroup.add(surfaceMesh);

    let animId = null;
    let lastW = 0, lastH = 0;
    const renderLoop = () => {
      if (this.subtask === 'orbit' && container.offsetParent !== null) {
        animId = requestAnimationFrame(renderLoop);
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 0 && h > 0 && (w !== lastW || h !== lastH)) {
          lastW = w;
          lastH = h;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
        // Camera angle is controlled by sliders
        controls.update();
        renderer.render(scene, camera);
      }
    };
    animId = requestAnimationFrame(renderLoop);

    this._conic3d = {
      scene, camera, renderer, controls, coneGroup, planePivot,
      curveLine, curveMat, surfaceMesh, surfaceMat, pivotY, coneHeight, animId
    };
  }

  updateConic3D(v_ratio) {
    if (!this._conic3d) return;

    const { planePivot, curveLine, curveMat, surfaceMesh, surfaceMat, pivotY, coneHeight } = this._conic3d;

    const ratio_sq = Math.abs(v_ratio - Math.SQRT2) < 1e-6 ? 2.0 : v_ratio * v_ratio;
    let e = Math.abs(ratio_sq - 1);

    let angleDeg = 0;
    let shapeType = 'Circle';
    let colorHex = 0x38bdf8; // Blue

    if (Math.abs(e) < 0.001) {
      angleDeg = 0;
      shapeType = 'Circle';
      colorHex = 0x38bdf8;
    } else if (Math.abs(e - 1.0) < 0.005) {
      angleDeg = 45;
      shapeType = 'Parabola (Escape)';
      colorHex = 0xfacc15; // Yellow
    } else if (e < 1.0) {
      angleDeg = Math.asin(e / Math.SQRT2) * (180 / Math.PI);
      shapeType = 'Ellipse';
      colorHex = 0x4ade80; // Green
    } else {
      angleDeg = 45 + Math.min(33, (e - 1) * 20);
      shapeType = 'Hyperbola';
      colorHex = 0xf97316; // Orange
    }

    const lbl = this.orbitContainer.querySelector('#conic-angle-lbl');
    if (lbl) {
      lbl.textContent = `θ = ${angleDeg.toFixed(1)}° (${shapeType})`;
    }

    curveMat.color.setHex(colorHex);
    surfaceMat.color.setHex(colorHex);

    const angleRad = THREE.MathUtils.degToRad(angleDeg);
    planePivot.rotation.z = angleRad;

    // Generate 3D intersection points (from @[conic])
    const points = [];
    const m = Math.tan(angleRad);
    const c = pivotY;

    if (angleDeg < 45) {
      // Ellipse / Circle
      const denom = 1 - m * m;
      const centerX = (m * c) / denom;
      const semiAxisX = Math.sqrt((c * c) / (denom * denom));
      const semiAxisZ = Math.sqrt((c * c) / denom);

      for (let i = 0; i <= 64; i++) {
        const t = (i / 64) * Math.PI * 2;
        const dx = semiAxisX * Math.cos(t);
        const z = semiAxisZ * Math.sin(t);
        const x = centerX + dx;
        const y = m * x + c;
        points.push(new THREE.Vector3(x, y, z));
      }
    } else if (angleDeg === 45) {
      // Parabola (m = 1)
      const zLimit = 40;
      for (let i = 0; i <= 64; i++) {
        const z = -zLimit + (i / 64) * (2 * zLimit);
        const x = (z * z - c * c) / (2 * c);
        const y = m * x + c;

        if (y >= -coneHeight) {
          points.push(new THREE.Vector3(x, y, z));
        }
      }
    } else {
      // Hyperbola
      const denom = m * m - 1;
      const centerX = -(m * c) / denom;
      const semiAxisX = Math.sqrt((c * c) / (denom * denom));
      const semiAxisZ = Math.sqrt((c * c) / denom);

      const tLimit = 1.2;
      for (let i = 0; i <= 64; i++) {
        const t = -tLimit + (i / 64) * (2 * tLimit);
        const dx = semiAxisX / Math.cos(t);
        const z = semiAxisZ * Math.tan(t);

        const x = centerX - dx;
        const y = m * x + c;

        if (y >= -coneHeight && y <= 0) {
          points.push(new THREE.Vector3(x, y, z));
        }
      }
    }

    curveLine.geometry.setFromPoints(points);

    if (points.length > 2) {
      const vertices = [];
      let cx = 0, cy = 0, cz = 0;
      for (let p of points) { cx += p.x; cy += p.y; cz += p.z; }
      cx /= points.length; cy /= points.length; cz /= points.length;

      for (let i = 0; i < points.length - 1; i++) {
        vertices.push(cx, cy, cz);
        vertices.push(points[i].x, points[i].y, points[i].z);
        vertices.push(points[i + 1].x, points[i + 1].y, points[i + 1].z);
      }

      if (angleDeg < 45) {
        vertices.push(cx, cy, cz);
        vertices.push(points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].z);
        vertices.push(points[0].x, points[0].y, points[0].z);
      }

      surfaceMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      surfaceMesh.geometry.computeVertexNormals();
    } else {
      surfaceMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    }
  }
}
