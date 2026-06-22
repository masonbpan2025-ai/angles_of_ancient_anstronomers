export class Level4 {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    
    this.progress = 50.0; // Slider value (0 to 100), 50 is center of eclipse
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    
    this.animate = this.animate.bind(this);
    this.animationId = requestAnimationFrame(this.animate);
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  setProgress(val) {
    this.progress = parseFloat(val);
  }
  
  drawModel() {
    const ctx = this.ctx;
    // Anchor to the right of the task panel (starting at x=400px)
    const taskPanelWidth = 400;
    const availWidth = Math.max(300, this.canvas.width - taskPanelWidth);
    const cx = taskPanelWidth + availWidth * 0.5;
    const cy = (this.canvas.height - 130) * 0.5 + 20;
    
    // Core geometry coordinates
    const X_Sun = taskPanelWidth + 60;
    const R_Sun = 55;
    
    const X_Earth = cx - 110;
    const R_Earth = 35;
    
    const X_Moon = cx + 110;
    const R_Moon = 10; // Exactly 1/3.5 of R_Earth (10/35 = 0.286)
    
    // Shadow cone tip position
    // Earth's shadow tapers from 35px at Earth to 25px at Moon (over 220px distance)
    // Taper rate = (35 - 25) / 220 = 10 / 220 = 1 / 22 (slope = 0.04545)
    // Tip distance = X_Earth + R_Earth / taperRate = X_Earth + 35 * 22 = X_Earth + 770 = cx + 660
    const X_Tip = X_Earth + 770;
    
    // Calculate Moon's Y position from progress slider (0 to 100)
    // Moves vertically across the shadow cone: Y ranges from cy - 90 to cy + 90
    const yMoon = cy + (this.progress - 50) * 1.8;
    
    // Calculate shadow radius at Moon's X position
    const R_Shadow_Moon = R_Earth - (X_Moon - X_Earth) * (R_Earth / 770); // Exactly 25px
    
    // 1. Draw Sun Rays & Light Fields
    // Umbra (dark inner shadow cone)
    const umbraGrad = ctx.createLinearGradient(X_Earth, cy, X_Tip, cy);
    umbraGrad.addColorStop(0, 'rgba(15, 23, 42, 0.7)');
    umbraGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.4)');
    umbraGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    
    ctx.save();
    ctx.fillStyle = umbraGrad;
    ctx.beginPath();
    ctx.moveTo(X_Earth, cy - R_Earth);
    ctx.lineTo(X_Tip, cy);
    ctx.lineTo(X_Earth, cy + R_Earth);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Penumbra (light outer shadow cone boundaries)
    // Ray 1: Sun Top to Earth Bottom
    // Slope = (R_Sun + R_Earth) / (X_Earth - X_Sun) = (55 + 35) / (cx - 110 - taskPanelWidth - 60)
    const dx_SE = X_Earth - X_Sun;
    const slope_pen = (R_Sun + R_Earth) / dx_SE;
    
    // Extrapolate to right boundary
    const X_End = this.canvas.width;
    const yPenTop = cy + R_Earth + slope_pen * (X_End - X_Earth);
    const yPenBottom = cy - R_Earth - slope_pen * (X_End - X_Earth);
    
    ctx.save();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.12)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    
    // Draw Penumbra boundary lines
    ctx.beginPath();
    ctx.moveTo(X_Sun, cy - R_Sun);
    ctx.lineTo(X_End, yPenTop);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(X_Sun, cy + R_Sun);
    ctx.lineTo(X_End, yPenBottom);
    ctx.stroke();
    ctx.restore();
    
    // Umbra boundary lines (Sun top to Earth top -> shadow tip)
    ctx.save();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(X_Sun, cy - R_Sun);
    ctx.lineTo(X_Tip, cy);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(X_Sun, cy + R_Sun);
    ctx.lineTo(X_Tip, cy);
    ctx.stroke();
    ctx.restore();
    
    // 2. Draw Central Axis (dashed reference line)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X_Sun, cy);
    ctx.lineTo(X_Tip + 50, cy);
    ctx.stroke();
    ctx.restore();
    
    // 3. Highlight Similar Triangles (Umbra Geometry)
    // Large Triangle: Earth Radius to Tip
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'; // Sky blue
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X_Earth, cy);
    ctx.lineTo(X_Earth, cy - R_Earth);
    ctx.lineTo(X_Tip, cy);
    ctx.closePath();
    ctx.stroke();
    
    // Small Triangle: Shadow Radius at Moon to Tip
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'; // Red
    ctx.beginPath();
    ctx.moveTo(X_Moon, cy);
    ctx.lineTo(X_Moon, cy - R_Shadow_Moon);
    ctx.lineTo(X_Tip, cy);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    
    // Labels for Similar Triangles
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 11px Outfit';
    ctx.fillText('R_E', X_Earth - 25, cy - R_Earth * 0.5 + 4);
    
    ctx.fillStyle = '#ef4444';
    ctx.font = '600 11px Outfit';
    ctx.fillText('R_shad', X_Moon + 6, cy - R_Shadow_Moon * 0.5 + 4);
    
    // Distance indicators below central axis
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    
    // D_EM (Earth to Moon)
    ctx.beginPath();
    ctx.moveTo(X_Earth, cy + 50);
    ctx.lineTo(X_Earth, cy + 65);
    ctx.moveTo(X_Moon, cy + 50);
    ctx.lineTo(X_Moon, cy + 65);
    ctx.moveTo(X_Earth, cy + 58);
    ctx.lineTo(X_Moon, cy + 58);
    ctx.stroke();
    
    // L_cone (Moon to Tip)
    ctx.beginPath();
    ctx.moveTo(X_Tip, cy + 50);
    ctx.lineTo(X_Tip, cy + 65);
    ctx.moveTo(X_Moon, cy + 58);
    ctx.lineTo(X_Tip, cy + 58);
    ctx.stroke();
    ctx.restore();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '600 10px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Earth-Moon Dist (D_EM)', (X_Earth + X_Moon) * 0.5, cy + 50);
    ctx.fillText('Remaining Cone (L - D_EM)', (X_Moon + X_Tip) * 0.5, cy + 50);
    
    // 4. Draw Sun
    ctx.save();
    const sunGlow = ctx.createRadialGradient(X_Sun, cy, 5, X_Sun, cy, R_Sun + 20);
    sunGlow.addColorStop(0, '#ffffff');
    sunGlow.addColorStop(0.2, '#fef08a');
    sunGlow.addColorStop(0.7, 'rgba(251, 191, 36, 0.15)');
    sunGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(X_Sun, cy, R_Sun + 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(X_Sun, cy, R_Sun, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 13px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Sun', X_Sun, cy + 4);
    ctx.restore();
    
    // 5. Draw Earth
    ctx.save();
    ctx.beginPath();
    ctx.arc(X_Earth, cy, R_Earth, 0, Math.PI * 2);
    ctx.fillStyle = '#1e3a8a'; // Deep blue
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // land masses
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(X_Earth - 8, cy - 8, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(X_Earth + 10, cy + 8, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 12px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Earth', X_Earth, cy + R_Earth + 18);
    ctx.restore();
    
    // 6. Draw Moon with partial/total Eclipse mapping
    // Base uneclipsed Moon (silver-white)
    ctx.save();
    ctx.beginPath();
    ctx.arc(X_Moon, yMoon, R_Moon, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    
    // Clip to the Earth's Umbra shadow cone range to draw the coppery-red eclipsed portion
    ctx.beginPath();
    ctx.moveTo(X_Earth, cy - R_Earth);
    ctx.lineTo(X_Tip, cy);
    ctx.lineTo(X_Earth, cy + R_Earth);
    ctx.closePath();
    ctx.clip();
    
    ctx.beginPath();
    ctx.arc(X_Moon, yMoon, R_Moon, 0, Math.PI * 2);
    ctx.fillStyle = '#991b1b'; // Copper/Blood Red inside umbra shadow
    ctx.fill();
    ctx.restore();
    
    // Label Moon
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px Outfit';
    ctx.fillText('Moon', X_Moon + R_Moon + 6, yMoon + 4);
    
    // Draw Umbra / Penumbra labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'italic 10px Outfit';
    ctx.fillText('Umbra (Shadow Cone)', X_Moon + 20, cy - 6);
    ctx.fillText('Penumbra', X_Moon + 60, cy - R_Shadow_Moon - 12);
    
    // Scale footnote
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'italic 10px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('*Illustrative scale: Sun distance and size are modified to fit screen geometry', cx, this.canvas.height - 145);
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Deep dark outer space background
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    bgGrad.addColorStop(0, '#02020a');
    bgGrad.addColorStop(0.5, '#050714');
    bgGrad.addColorStop(1, '#090d22');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Stars
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 50; i++) {
      let x = (Math.sin(i * 12345) * 0.5 + 0.5) * this.canvas.width;
      let y = (Math.cos(i * 54321) * 0.5 + 0.5) * this.canvas.height;
      if (x > 400) {
        this.ctx.fillRect(x, y, 1.2, 1.2);
      }
    }
    this.ctx.restore();
    
    this.drawModel();
    this.animationId = requestAnimationFrame(this.animate);
  }
  
  destroy() {
    cancelAnimationFrame(this.animationId);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
