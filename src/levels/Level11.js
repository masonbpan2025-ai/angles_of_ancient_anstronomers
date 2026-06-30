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
    this.largeSpherePos = 0; // 0 (neutral / far) to 1 (active / close)

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
    // Deflection readout
    const angleRad = this.largeSpherePos * 0.06;
    const angleDeg = (angleRad * 180 / Math.PI).toFixed(2);
    const forceMicroN = (this.largeSpherePos * 0.15).toFixed(3);

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
            <span>Large Sphere Attraction:</span>
            <span class="text-violet-400 font-bold">${Math.round(this.largeSpherePos * 100)}%</span>
          </div>
          <input type="range" id="cav-spheres-slider" min="0" max="100" value="${this.largeSpherePos * 100}" 
            class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500">
          
          <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1 text-[9.5px]">
            <div class="flex justify-between">
              <span class="text-slate-500">Torque Force:</span>
              <span class="text-amber-400 font-mono font-bold">${forceMicroN} μN</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Twist Angle θ:</span>
              <span class="text-sky-400 font-mono font-bold">${angleDeg}°</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Laser Deflection Δx:</span>
              <span class="text-rose-400 font-mono font-bold">${Math.round(this.largeSpherePos * 52)} mm</span>
            </div>
            <p class="text-[9px] text-slate-400 leading-relaxed mt-1.5 border-t border-slate-850 pt-1.5">
              Deflection is measured by bouncing a laser off a mirror on the wire, amplifying the tiny angle over a long distance to scale.
            </p>
          </div>
        </div>
      </div>
    `;

    const slider = this.uiOverlay.querySelector('#cav-spheres-slider');
    slider.addEventListener('input', (e) => {
      this.largeSpherePos = parseInt(e.target.value) / 100;
      this.renderUIOverlay();
    });
  }

  resize() {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
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
    const cx = TASK_W + (W - TASK_W) / 2;
    const cy = H / 2 + 25;

    // Draw scale/ruler at top
    const scaleY = cy - 140;
    const scaleW = 340;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - scaleW / 2, scaleY);
    ctx.lineTo(cx + scaleW / 2, scaleY);
    ctx.stroke();

    // Scale ticks
    ctx.fillStyle = '#64748b';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    for (let i = -10; i <= 10; i++) {
      const tx = cx + i * 15;
      ctx.beginPath();
      ctx.moveTo(tx, scaleY);
      ctx.lineTo(tx, scaleY - (i % 5 === 0 ? 6 : 3));
      ctx.stroke();
      if (i % 5 === 0) {
        ctx.fillText(i * 10, tx, scaleY - 9);
      }
    }

    // Laser deflection math
    const theta = this.largeSpherePos * 0.06; // beam twist in radians (approx 3.4 degrees max)
    const deltaX = 140 * Math.tan(2 * theta); // reflected laser is deflected by 2*theta
    const scaleX = cx + deltaX;

    // Laser emitter unit
    const lx = cx - 140;
    const ly = cy + 40;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(Math.atan2(cy - ly, cx - lx));
    ctx.fillStyle = '#334155';
    ctx.fillRect(-15, -4, 25, 8);
    ctx.fillStyle = '#ef4444'; // laser tip
    ctx.fillRect(10, -2, 3, 4);
    ctx.restore();

    // Red Laser incident beam
    ctx.save();
    ctx.strokeStyle = 'rgba(239,68,68,0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(lx + 8, ly - 2);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.restore();

    // Red Laser reflected beam
    ctx.save();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(239,68,68,0.85)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(scaleX, scaleY);
    ctx.stroke();
    ctx.restore();

    // Laser dot on the scale
    ctx.save();
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(scaleX, scaleY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw central torsion wire hanging down
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 90);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Torsion rod and small spheres
    const rodLength = 120;
    // Rotation of rod is theta (torsion twist)
    const rx = (rodLength / 2) * Math.cos(theta);
    const ry = (rodLength / 2) * Math.sin(theta);

    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy - ry);
    ctx.lineTo(cx + rx, cy + ry);
    ctx.stroke();

    // Small spheres
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    // Small Sphere 1
    ctx.beginPath(); ctx.arc(cx - rx, cy - ry, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Small Sphere 2
    ctx.beginPath(); ctx.arc(cx + rx, cy + ry, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Central mirror plate on wire
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    // A small rectangle tilted by theta representing the mirror
    ctx.rect(cx - 6, cy - 4, 12, 8);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Large lead spheres (M)
    // Their neutral position is perpendicular to the rod. Active position rotates closer.
    const activeAngle = 0.5 - this.largeSpherePos * 0.42; // rotate from far to very close
    const largeRadius = 65; // radius from center to large spheres
    
    // Large Sphere 1 position
    const lx1 = cx - largeRadius * Math.cos(activeAngle);
    const ly1 = cy - largeRadius * Math.sin(activeAngle);
    
    // Large Sphere 2 position
    const lx2 = cx + largeRadius * Math.cos(activeAngle);
    const ly2 = cy + largeRadius * Math.sin(activeAngle);

    // Draw support brackets / lines for large spheres
    ctx.strokeStyle = 'rgba(71,85,105,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, largeRadius, 0.5 - 0.42, 0.5, true);
    ctx.stroke();

    // Draw Large Spheres
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    // Sphere 1
    ctx.beginPath(); ctx.arc(lx1, ly1, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Sphere 2
    ctx.beginPath(); ctx.arc(lx2, ly2, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();

    // Labels
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 9.5px Outfit,sans-serif';
    ctx.fillText("M (Large Sphere)", lx1 - 20, ly1 - 20);
    ctx.fillText("m", cx - rx - 15, cy - ry - 12);
    ctx.fillText("Mirror", cx - 18, cy + 22);

    // Subtitle headers
    ctx.fillStyle = '#fff'; ctx.font = '600 13px Outfit,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText("Cavendish Torsion Balance Setup", IX_center(W, TASK_W), 44);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 10px Outfit,sans-serif';
    ctx.fillText("Drag the slider to rotate the large masses (M) closer to the small ones (m). Bouncing light records the twist.", IX_center(W, TASK_W), 61);
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
