export class Level3 {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    
    this.timeOfDay = 12.0; // slider value (0 to 24)
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    
    this.animate = this.animate.bind(this);
    this.animationId = requestAnimationFrame(this.animate);
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  setTimeOfDay(val) {
    this.timeOfDay = parseFloat(val);
  }
  
  drawModel() {
    const ctx = this.ctx;
    // Anchor to the right of the task panel (starting at x=400px)
    const taskPanelWidth = 400;
    const availWidth = Math.max(300, this.canvas.width - taskPanelWidth);
    const cx = taskPanelWidth + availWidth * 0.5;
    const cy = this.canvas.height * 0.5;
    
    // Base radii
    const dMoon = 85;
    const dSun = 280;
    
    // Triangle rotation based on time of day (0 to 24 hours maps to 0 to 2*PI)
    const rotationAngle = (this.timeOfDay / 24) * Math.PI * 2;
    
    // Moon position
    const mx = cx + dMoon * Math.cos(rotationAngle);
    const my = cy + dMoon * Math.sin(rotationAngle);
    
    // Sun position: in the right-angled triangle at half-moon, the angle at the Moon is 90 degrees.
    const dMoonSun = Math.sqrt(dSun * dSun - dMoon * dMoon);
    
    // Perpendicular direction (counter-clockwise)
    const sx = mx - dMoonSun * Math.sin(rotationAngle);
    const sy = my + dMoonSun * Math.cos(rotationAngle);
    
    // 1. Draw Sun rays / light cone towards Earth and Moon
    ctx.save();
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.08)';
    ctx.lineWidth = 1;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      const perpAngle = rotationAngle + Math.PI/2 + (i * 0.05);
      ctx.lineTo(sx + 800 * Math.cos(perpAngle), sy + 800 * Math.sin(perpAngle));
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw Triangle lines
    ctx.save();
    ctx.lineWidth = 1.5;
    
    // Earth - Moon (Adjacent L)
    ctx.strokeStyle = '#38bdf8'; // Sky blue
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(mx, my);
    ctx.stroke();
    
    // Moon - Sun (Opposite)
    ctx.strokeStyle = '#ef4444'; // Red
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    
    // Earth - Sun (Hypotenuse S)
    ctx.strokeStyle = '#fbbf24'; // Amber
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    ctx.restore();
    
    // 3. Draw Right-Angle Marker at Moon
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const size = 12;
    const rx1 = mx - size * Math.cos(rotationAngle);
    const ry1 = my - size * Math.sin(rotationAngle);
    const rx2 = rx1 - size * Math.sin(rotationAngle);
    const ry2 = ry1 + size * Math.cos(rotationAngle);
    const rx3 = mx - size * Math.sin(rotationAngle);
    const ry3 = my + size * Math.cos(rotationAngle);
    ctx.moveTo(rx1, ry1);
    ctx.lineTo(rx2, ry2);
    ctx.lineTo(rx3, ry3);
    ctx.stroke();
    ctx.restore();
    
    // 4. Draw Angle Arc at Earth (psi)
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const psiDraw = Math.acos(dMoon / dSun);
    ctx.arc(cx, cy, 30, rotationAngle, rotationAngle + psiDraw);
    ctx.stroke();
    ctx.restore();
    
    // Label psi at Earth
    const labelPsiAngle = rotationAngle + psiDraw * 0.5;
    ctx.fillStyle = '#60a5fa';
    ctx.font = '600 11px Outfit';
    ctx.fillText('ψ = 87°', cx + 38 * Math.cos(labelPsiAngle) - 15, cy + 38 * Math.sin(labelPsiAngle) + 4);
    
    // 5. Draw Earth
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#1e3a8a'; // Deep blue
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Draw land masses
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 8, cy + 6, 7, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Earth', cx, cy + 34);
    ctx.restore();
    
    // 6. Draw Sun
    ctx.save();
    const sunGlow = ctx.createRadialGradient(sx, sy, 3, sx, sy, 30);
    sunGlow.addColorStop(0, '#ffffff');
    sunGlow.addColorStop(0.3, '#fef08a');
    sunGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.beginPath();
    ctx.arc(sx, sy, 30, 0, Math.PI * 2);
    ctx.fillStyle = sunGlow;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(sx, sy, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 12px Outfit';
    ctx.fillText('Sun', sx + 20, sy + 4);
    ctx.restore();
    
    // 7. Draw Moon (Exactly Half-Lit as seen from Earth)
    ctx.save();
    ctx.translate(mx, my);
    const angleToSun = rotationAngle + Math.PI/2 + Math.PI; 
    ctx.rotate(angleToSun);
    
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, 11, -Math.PI/2, Math.PI/2, false);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.restore();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px Outfit';
    ctx.fillText('Moon', mx + 16, my + 4);
    
    // 8. Draw Labels on Triangle edges
    const lx = cx + (dMoon * 0.5) * Math.cos(rotationAngle);
    const ly = cy + (dMoon * 0.5) * Math.sin(rotationAngle);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 11px Outfit';
    ctx.fillText('L', lx - 10 * Math.sin(rotationAngle), ly + 10 * Math.cos(rotationAngle));
    
    const midSunAngle = rotationAngle + psiDraw * 0.5;
    const sx_mid = cx + (dSun * 0.4) * Math.cos(midSunAngle);
    const sy_mid = cy + (dSun * 0.4) * Math.sin(midSunAngle);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 11px Outfit';
    ctx.fillText('S', sx_mid - 12 * Math.sin(midSunAngle), sy_mid + 12 * Math.cos(midSunAngle));
    
    ctx.fillStyle = '#ef4444';
    ctx.font = '600 11px Outfit';
    ctx.fillText('90°', mx - 22 * Math.cos(rotationAngle) - 8, my - 22 * Math.sin(rotationAngle) + 4);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'italic 10px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('*Illustrative scale: Sun distance (S) is exaggeratedly short to fit screen', cx, this.canvas.height - 30);
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    bgGrad.addColorStop(0, '#020208');
    bgGrad.addColorStop(0.5, '#050711');
    bgGrad.addColorStop(1, '#090c1e');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 40; i++) {
      let x = (Math.sin(i * 12345) * 0.5 + 0.5) * this.canvas.width;
      let y = (Math.cos(i * 54321) * 0.5 + 0.5) * this.canvas.height;
      if (x > 400) {
        this.ctx.fillRect(x, y, 1.2, 1.2);
      }
    }
    
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
