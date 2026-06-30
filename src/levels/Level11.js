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

    // Layout configuration
    const TASK_W = 400;
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
