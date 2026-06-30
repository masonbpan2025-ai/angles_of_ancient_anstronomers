// Level 10: Black Hole
import { gameState } from '../core/GameState.js';

export class Level10 {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    // Simulation state
    this.time = 0;
    this.gravityFactor = 0; // 0 to 100. At 50, light orbits. At >50, light is captured.

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

    // Create the parameter overlay card
    this.initOverlayUI();

    // Start loop
    this.animationId = requestAnimationFrame(this.animateBound);
  }

  initOverlayUI() {
    this.uiOverlay = document.createElement('div');
    this.uiOverlay.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 100;
      pointer-events: auto;
    `;
    this.container.appendChild(this.uiOverlay);
    this.renderUIOverlay();
  }

  renderUIOverlay() {
    let statusText = 'Straight Beam';
    let statusColor = 'text-slate-400';
    let statusDesc = 'Under normal conditions, light travels in straight lines.';

    if (this.gravityFactor > 0 && this.gravityFactor < 50) {
      statusText = 'Gravitational Lensing';
      statusColor = 'text-sky-400';
      statusDesc = 'Light is bent by the massive gravity field, but has escape velocity.';
    } else if (this.gravityFactor === 50) {
      statusText = 'Dark Star Condition (Orbit)';
      statusColor = 'text-green-400 font-bold animate-pulse';
      statusDesc = 'The surface orbital velocity exactly equals the speed of light! The photons orbit the Earth.';
    } else if (this.gravityFactor > 50) {
      statusText = 'Singularity Capture (Black Hole)';
      statusColor = 'text-red-400 font-bold';
      statusDesc = 'Gravity is so strong that the escape velocity exceeds the speed of light. Light is trapped!';
    }

    this.uiOverlay.innerHTML = `
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
            <span class="text-violet-400 font-bold font-mono">${(this.gravityFactor * 2.0).toFixed(1)}x</span>
          </div>
          <input type="range" id="bh-gravity-slider" min="0" max="80" value="${this.gravityFactor}" 
            class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500">
          
          <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1">
            <span class="text-[9px] uppercase font-bold text-slate-500">Trajectory Status:</span>
            <span class="text-[10.5px] font-bold ${statusColor}">${statusText}</span>
            <p class="text-[9.5px] leading-relaxed text-slate-400">${statusDesc}</p>
          </div>
        </div>
      </div>
    `;

    const slider = this.uiOverlay.querySelector('#bh-gravity-slider');
    slider.addEventListener('input', (e) => {
      this.gravityFactor = parseInt(e.target.value);
      this.renderUIOverlay();
    });
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

    // Position setup
    const TASK_W = 400;
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
      // Glowing neon laser style
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

    // Subtitle headers
    ctx.fillStyle = '#fff'; ctx.font = '600 13px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText("Light Path Bending (Newtonian Dark Star)", IX_center(W, TASK_W), 44);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 10px Outfit,sans-serif';
    ctx.fillText("Adjust gravity/mass scale in top-right. At 50x, surface orbit velocity matches speed of light.", IX_center(W, TASK_W), 61);
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
  }
}

function IX_center(W, TASK_W) {
  return TASK_W + (W - TASK_W) / 2;
}
