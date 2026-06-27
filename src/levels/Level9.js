// Level 9: Newton
import { gameState } from '../core/GameState.js';
import { GravityIllustration } from './GravityIllustration.js';

export class Level9 {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    // Simulation state
    this.subtask = 'cannonball'; // 'cannonball' or 'gravity'
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
    } else {
      this._gravityIllustration.hide();
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
  }
}


