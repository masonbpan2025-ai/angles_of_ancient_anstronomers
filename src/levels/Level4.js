export class Level4 {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    
    this.progress = 50.0; // Slider value (0 to 100)
    this.subtask = 'size'; // Default subtask
    this.startTime = Date.now(); // Start time for animations
    
    this.resizeBound = this.resize.bind(this);
    this.resize();
    window.addEventListener('resize', this.resizeBound);
    
    this.animate = this.animate.bind(this);
    this.animationId = requestAnimationFrame(this.animate);
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  setProgress(val) {
    this.progress = parseFloat(val);
    const T1 = 3000;
    const P1 = 800;
    const T2 = 4500;
    const P2 = 1200;
    const cycleTotal = T1 + P1 + T2 + P2;
    this.startTime = Date.now() - (this.progress / 100) * cycleTotal;
  }
  
  setSubtask(tab) {
    this.subtask = tab;
    this.startTime = Date.now(); // Reset start time for movie loop
  }
  
  drawRoundedRect(ctx, x, y, w, h, r) {
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
  
  drawArrowLine(ctx, x1, y1, x2, y2, label, color, alignLeft = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw arrows
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowSize = 5;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + arrowSize * Math.cos(angle + Math.PI/6), y1 + arrowSize * Math.sin(angle + Math.PI/6));
    ctx.lineTo(x1 + arrowSize * Math.cos(angle - Math.PI/6), y1 + arrowSize * Math.sin(angle - Math.PI/6));
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowSize * Math.cos(angle + Math.PI/6), y2 - arrowSize * Math.sin(angle + Math.PI/6));
    ctx.lineTo(x2 - arrowSize * Math.cos(angle - Math.PI/6), y2 - arrowSize * Math.sin(angle - Math.PI/6));
    ctx.closePath();
    ctx.fill();
    
    // Draw text label
    ctx.font = '600 10px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (y1 === y2) {
      // Horizontal
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, (x1 + x2)/2, y1 - 10);
    } else {
      // Vertical
      ctx.fillStyle = '#ffffff';
      if (alignLeft) {
        ctx.textAlign = 'right';
        ctx.fillText(label, x1 - 8, (y1 + y2)/2);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(label, x1 + 8, (y1 + y2)/2);
      }
    }
    ctx.restore();
  }
  
  drawSubtaskSize() {
    const ctx = this.ctx;
    const taskPanelWidth = 400;
    const availWidth = Math.max(300, this.canvas.width - taskPanelWidth);
    const availHeight = this.canvas.height;
    
    // Centers of the two visual modules
    const cyTop = (availHeight - 120) * 0.32 + 10;
    const cyBottom = (availHeight - 120) * 0.76 + 10;
    
    const cardW = 280;
    const cardH = 150;
    const cx_mov = taskPanelWidth + availWidth * 0.5;
    
    // --- TIMING CYCLE FOR MOVIES ---
    const T1 = 3000;      // Movie 1 duration
    const P1 = 800;       // Pause after Movie 1
    const T2 = 4500;      // Movie 2 duration
    const P2 = 1200;      // Pause after Movie 2
    
    const cycleTotal = T1 + P1 + T2 + P2;
    const elapsed = (Date.now() - this.startTime) % cycleTotal;
    
    let activeMovie = 1; // 1 = Movie 1, 2 = Movie 2
    let mt = 0;          // movie progress (0 to 1)
    let displayTime = '';
    let movieTitle = '';
    let movieSub = '';
    
    // Coordinate values for the top shadow cone diagram
    const sx = taskPanelWidth + availWidth * 0.12;
    const ex = taskPanelWidth + availWidth * 0.44;
    const tx = taskPanelWidth + availWidth * 0.90;
    const mx_base = ex + (tx - ex) * 0.28;
    
    const sr_draw = 51;
    const er_draw = 30;
    const mr_draw = 8;
    const r_shad_draw = 21.6; // Shadow radius at mx_base (2.7 * mr_draw)
    
    let topMoonY = cyTop - r_shad_draw - mr_draw; // Start pos
    
    if (elapsed < T1) {
      activeMovie = 1;
      mt = elapsed / T1;
      displayTime = (mt * 1.0).toFixed(1) + ' h';
      movieTitle = 'Movie 1: Entering Shadow';
      movieSub = 'Travels 1.0 Moon Diameter in 1.0h';
      
      const startY = cyTop - r_shad_draw - mr_draw;
      const endY = cyTop - r_shad_draw + mr_draw;
      topMoonY = startY + mt * (endY - startY);
    } else if (elapsed < T1 + P1) {
      activeMovie = 1;
      mt = 1.0;
      displayTime = '1.0 h';
      movieTitle = 'Movie 1: Entering Shadow';
      movieSub = 'Travels 1.0 Moon Diameter in 1.0h';
      topMoonY = cyTop - r_shad_draw + mr_draw;
    } else if (elapsed < T1 + P1 + T2) {
      activeMovie = 2;
      mt = (elapsed - (T1 + P1)) / T2;
      displayTime = (mt * 2.7).toFixed(1) + ' h';
      movieTitle = 'Movie 2: Total Eclipse Transit';
      movieSub = 'Remains fully inside umbra for 2.7h';
      
      const startY = cyTop - r_shad_draw + mr_draw;
      const endY = cyTop + r_shad_draw - mr_draw;
      topMoonY = startY + mt * (endY - startY);
    } else {
      activeMovie = 2;
      mt = 1.0;
      displayTime = '2.7 h';
      movieTitle = 'Movie 2: Total Eclipse Transit';
      movieSub = 'Remains fully inside umbra for 2.7h';
      topMoonY = cyTop + r_shad_draw - mr_draw;
    }
    
    // Call progress callback to sync the UI slider
    const progressPercent = (elapsed / cycleTotal) * 100;
    if (this.onProgressUpdate) {
      this.onProgressUpdate(progressPercent);
    }
    
    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 16px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Lunar Eclipse Timing Observations', taskPanelWidth + availWidth * 0.5, cyTop - 85);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 11px Outfit';
    ctx.fillText('Aristarchus timed how long the Moon spent entering the shadow vs. fully eclipsed', taskPanelWidth + availWidth * 0.5, cyTop - 67);
    
    // --- DRAW TOP SHADOW CONE ILLUSTRATION ---
    ctx.save();
    
    // Draw Shadow Cone (Umbra)
    const umbraGrad = ctx.createLinearGradient(ex, cyTop, tx, cyTop);
    umbraGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
    umbraGrad.addColorStop(0.5, 'rgba(153, 27, 27, 0.35)');
    umbraGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    
    ctx.fillStyle = umbraGrad;
    ctx.beginPath();
    ctx.moveTo(ex, cyTop - er_draw);
    ctx.lineTo(tx, cyTop);
    ctx.lineTo(ex, cyTop + er_draw);
    ctx.closePath();
    ctx.fill();
    
    // Rays
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, cyTop - sr_draw);
    ctx.lineTo(tx, cyTop);
    ctx.moveTo(sx, cyTop + sr_draw);
    ctx.lineTo(tx, cyTop);
    ctx.stroke();
    
    // Central Axis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(sx - 20, cyTop);
    ctx.lineTo(tx + 30, cyTop);
    ctx.stroke();
    ctx.restore();
    
    // Draw Moon Orbit Path (vertical dashed line) on top diagram
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx_base, cyTop - er_draw - 15);
    ctx.lineTo(mx_base, cyTop + er_draw + 15);
    ctx.stroke();
    ctx.restore();
    
    // Draw Sun
    ctx.save();
    const sunGlow = ctx.createRadialGradient(sx, cyTop, 5, sx, cyTop, sr_draw + 15);
    sunGlow.addColorStop(0, '#ffffff');
    sunGlow.addColorStop(0.3, '#fef08a');
    sunGlow.addColorStop(0.8, 'rgba(251, 191, 36, 0.15)');
    sunGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sx, cyTop, sr_draw + 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(sx, cyTop, sr_draw, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 11px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sun', sx, cyTop);
    ctx.restore();
    
    // Draw Earth
    ctx.save();
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(ex, cyTop, er_draw, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(ex - 6, cyTop - 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + 8, cyTop + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Earth', ex, cyTop + er_draw + 14);
    ctx.restore();
    
    // Draw Moon at topMoonY (partially/fully eclipsed)
    // Draw base uneclipsed Moon
    ctx.save();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(mx_base, topMoonY, mr_draw, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(mx_base, topMoonY, mr_draw, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw eclipsed copper Moon
    ctx.save();
    // Clip to the Earth's shadow cone
    ctx.beginPath();
    ctx.moveTo(ex, cyTop - er_draw);
    ctx.lineTo(tx, cyTop);
    ctx.lineTo(ex, cyTop + er_draw);
    ctx.closePath();
    ctx.clip();
    
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(mx_base, topMoonY, mr_draw, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '600 10px Outfit';
    ctx.textAlign = 'left';
    ctx.fillText('Moon', mx_base + mr_draw + 6, topMoonY + 3);
    ctx.restore();
    
    // --- DRAW BOTTOM MOVIE VIEWPORT ---
    ctx.save();
    
    // Card frame
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    this.drawRoundedRect(ctx, cx_mov - cardW * 0.5, cyBottom - cardH * 0.5, cardW, cardH, 12);
    ctx.fill();
    ctx.stroke();
    
    // Viewport clip
    ctx.beginPath();
    this.drawRoundedRect(ctx, cx_mov - cardW * 0.5 + 4, cyBottom - cardH * 0.5 + 4, cardW - 8, cardH - 8, 8);
    ctx.clip();
    
    // Stars inside movie
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 20; i++) {
      let msx = cx_mov - cardW * 0.5 + ((Math.sin(i * 432) * 0.5 + 0.5) * cardW);
      let msy = cyBottom - cardH * 0.5 + ((Math.cos(i * 765) * 0.5 + 0.5) * cardH);
      ctx.fillRect(msx, msy, 1.2, 1.2);
    }
    
    // Movie shadow
    const sx_c = cx_mov;
    const sy_c = cyBottom;
    const sr_c = 42;
    const mr_c = 42 / 2.7; // Ratio: 42 / mr_c = 2.7
    
    const shadowGrad_c = ctx.createRadialGradient(sx_c, sy_c, sr_c * 0.8, sx_c, sy_c, sr_c);
    shadowGrad_c.addColorStop(0, 'rgba(15, 23, 42, 0.98)');
    shadowGrad_c.addColorStop(0.8, 'rgba(30, 20, 20, 0.9)');
    shadowGrad_c.addColorStop(1, 'rgba(153, 27, 27, 0.35)');
    
    ctx.fillStyle = shadowGrad_c;
    ctx.beginPath();
    ctx.arc(sx_c, sy_c, sr_c, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(153, 27, 27, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx_c, sy_c, sr_c, 0, Math.PI * 2);
    ctx.stroke();
    
    // Close-up movie orbit line
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sx_c, sy_c - sr_c - 20);
    ctx.lineTo(sx_c, sy_c + sr_c + 20);
    ctx.stroke();
    ctx.restore();
    
    // Calculate local Moon Y for close-up viewport
    let my_c = sy_c - sr_c - mr_c;
    if (activeMovie === 1) {
      const startY = sy_c - sr_c - mr_c;
      const endY = sy_c - sr_c + mr_c;
      my_c = startY + mt * (endY - startY);
    } else {
      const startY = sy_c - sr_c + mr_c;
      const endY = sy_c + sr_c - mr_c;
      my_c = startY + mt * (endY - startY);
    }
    
    // Draw Moon
    if (activeMovie === 1) {
      // Base uneclipsed
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(sx_c, my_c, mr_c, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(sx_c, my_c, mr_c, 0, Math.PI * 2);
      ctx.stroke();
      
      // Eclipsed copper
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx_c, sy_c, sr_c, 0, Math.PI * 2);
      ctx.clip();
      
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(sx_c, my_c, mr_c, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Completely eclipsed inside shadow
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(sx_c, my_c, mr_c, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx_c, my_c, mr_c, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Labels & overlays on movie frame
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px Outfit';
    ctx.textAlign = 'left';
    ctx.fillText(movieTitle, cx_mov - cardW * 0.5 + 15, cyBottom - cardH * 0.5 + 20);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '500 8.5px Outfit';
    ctx.fillText(movieSub, cx_mov - cardW * 0.5 + 15, cyBottom - cardH * 0.5 + 32);
    
    // Timeline progress bar
    const barW = cardW - 30;
    const barX = cx_mov - cardW * 0.5 + 15;
    const barY = cyBottom + cardH * 0.5 - 20;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, barY, barW, 3);
    
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(barX, barY, barW * mt, 3);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Outfit';
    ctx.textAlign = 'right';
    ctx.fillText(displayTime, cx_mov + cardW * 0.5 - 15, barY - 5);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 8.5px Outfit';
    ctx.textAlign = 'left';
    ctx.fillText(activeMovie === 1 ? 'Duration: 1.0h' : 'Duration: 2.7h', barX, barY - 5);
    
    ctx.restore();
    
    // Scale reference footnote at bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'italic 10px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('*Note: The speed of the Moon is uniform. Comparing transit durations directly reveals the shadow size ratio.', taskPanelWidth + availWidth * 0.5, cyBottom + cardH * 0.5 + 25);
  }
  
  drawSubtaskTaper() {
    const ctx = this.ctx;
    const taskPanelWidth = 400;
    const availWidth = Math.max(300, this.canvas.width - taskPanelWidth);
    const availHeight = this.canvas.height;
    
    const cy = (availHeight - 120) * 0.5 + 30;
    
    const sx = taskPanelWidth + availWidth * 0.12;
    const ex = taskPanelWidth + availWidth * 0.44;
    const tx = taskPanelWidth + availWidth * 0.90;
    const mx = ex + (tx - ex) * (10 / 37);
    
    const sr_draw = 63;
    const er_draw = 37;
    const mr_draw = 10;
    const r_shad_draw = 27; // er_draw - taper(10) = 27
    
    // Draw Header
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 16px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Earth Shadow Cone Taper Geometry', taskPanelWidth + availWidth * 0.5, cy - 100);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 11px Outfit';
    ctx.fillText('The shadow narrows (tapers) because the Sun is physically larger than the Earth', taskPanelWidth + availWidth * 0.5, cy - 82);
    
    // Draw Umbra Shadow Cone
    const umbraGrad = ctx.createLinearGradient(ex, cy, tx, cy);
    umbraGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
    umbraGrad.addColorStop(0.5, 'rgba(153, 27, 27, 0.35)');
    umbraGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    
    ctx.save();
    ctx.fillStyle = umbraGrad;
    ctx.beginPath();
    ctx.moveTo(ex, cy - er_draw);
    ctx.lineTo(tx, cy);
    ctx.lineTo(ex, cy + er_draw);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Boundary rays (Sun top/bottom -> Earth top/bottom -> Shadow tip)
    ctx.save();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, cy - sr_draw);
    ctx.lineTo(tx, cy);
    ctx.moveTo(sx, cy + sr_draw);
    ctx.lineTo(tx, cy);
    ctx.stroke();
    ctx.restore();
    
    // Central Axis
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(sx - 20, cy);
    ctx.lineTo(tx + 30, cy);
    ctx.stroke();
    ctx.restore();
    
    // Draw Sun
    ctx.save();
    const sunGlow = ctx.createRadialGradient(sx, cy, 5, sx, cy, sr_draw + 15);
    sunGlow.addColorStop(0, '#ffffff');
    sunGlow.addColorStop(0.3, '#fef08a');
    sunGlow.addColorStop(0.8, 'rgba(251, 191, 36, 0.15)');
    sunGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sx, cy, sr_draw + 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw base Sun core
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(sx, cy, sr_draw, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 11px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sun', sx, cy);
    ctx.restore();
    
    // Draw Earth
    ctx.save();
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(ex, cy, er_draw, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();
    // land masses
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(ex - 6, cy - 6, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + 8, cy + 6, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Earth', ex, cy + er_draw + 14);
    ctx.restore();
    
    // --- GEOMETRY LINES & LABELS ---
    
    // Sun's viewing angle B from Earth (lines from Earth to Sun edges)
    ctx.save();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(ex, cy);
    ctx.lineTo(sx, cy - sr_draw);
    ctx.moveTo(ex, cy);
    ctx.lineTo(sx, cy + sr_draw);
    ctx.stroke();
    
    // Arc B at Earth facing Sun
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(ex, cy, 25, Math.PI - 0.22, Math.PI + 0.22);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 10px Outfit';
    ctx.textAlign = 'right';
    ctx.fillText('B ≈ 0.5°', ex - 32, cy - 5);

    // Rays defining Moon's viewing angle A from Earth
    const angle_A = Math.atan2(mr_draw, mx - ex);
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(ex, cy);
    ctx.lineTo(mx, cy - mr_draw);
    ctx.moveTo(ex, cy);
    ctx.lineTo(mx, cy + mr_draw);
    ctx.stroke();
    ctx.restore();

    // Arc A at Earth facing Moon (Moon's viewing angle A)
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(ex, cy, 25, -angle_A, angle_A);
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 10px Outfit';
    ctx.textAlign = 'left';
    ctx.fillText('A = B ≈ 0.5°', ex + 32, cy - 5);
    ctx.restore();

    // Arcs defining taper angle E at Earth's top/bottom edges
    const theta_E = Math.atan2(er_draw, tx - ex);
    
    // Top E
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1.2;
    // Horizontal dashed extension
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(ex, cy - er_draw);
    ctx.lineTo(ex + 45, cy - er_draw);
    ctx.stroke();
    // Arc E
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(ex, cy - er_draw, 25, 0, theta_E);
    ctx.stroke();
    // Text label E
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 10px Outfit';
    ctx.textAlign = 'left';
    ctx.fillText('E', ex + 28, cy - er_draw + 8);
    ctx.restore();

    // Bottom E
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1.2;
    // Horizontal dashed extension
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(ex, cy + er_draw);
    ctx.lineTo(ex + 45, cy + er_draw);
    ctx.stroke();
    // Arc E
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(ex, cy + er_draw, 25, -theta_E, 0);
    ctx.stroke();
    // Text label E
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 10px Outfit';
    ctx.textAlign = 'left';
    ctx.fillText('E', ex + 28, cy + er_draw - 8);
    ctx.restore();

    // Arcs defining angle D at Sun's top/bottom edges
    const angle_to_center = Math.atan2(sr_draw, ex - sx);
    const angle_boundary = Math.atan2(sr_draw - er_draw, ex - sx);

    // Top D
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sx, cy - sr_draw, 22, angle_boundary, angle_to_center);
    ctx.stroke();
    // Text label D
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 10px Outfit';
    ctx.textAlign = 'left';
    ctx.fillText('D', sx + 25, cy - sr_draw + 8);
    ctx.restore();

    // Bottom D
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sx, cy + sr_draw, 22, -angle_to_center, -angle_boundary);
    ctx.stroke();
    // Text label D
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 10px Outfit';
    ctx.textAlign = 'left';
    ctx.fillText('D', sx + 25, cy + sr_draw - 8);
    ctx.restore();
    
    // Earth diameter label
    // Earth diameter label removed as it is the target verification question
    
    // Taper angle at tip tx (angle C)
    ctx.save();
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(tx, cy, 35, Math.PI - 0.18, Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#a78bfa';
    ctx.font = '600 10px Outfit';
    ctx.textAlign = 'right';
    ctx.fillText('C = 2E = B - 2D ≈ B ≈ 0.5°', tx - 42, cy - 14);
    ctx.restore();
    
    // Horizontal extensions for boundaries
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(ex, cy - er_draw);
    ctx.lineTo(mx + 25, cy - er_draw);
    ctx.moveTo(mx, cy - r_shad_draw);
    ctx.lineTo(mx + 25, cy - r_shad_draw);
    ctx.moveTo(mx, cy + r_shad_draw);
    ctx.lineTo(mx + 25, cy + r_shad_draw);
    ctx.moveTo(ex, cy + er_draw);
    ctx.lineTo(mx + 25, cy + er_draw);
    ctx.stroke();
    ctx.restore();
    
    // Arrow lines at Moon position mx
    this.drawArrowLine(ctx, mx, cy - er_draw, mx, cy - r_shad_draw, 'Taper: 0.5 d_M', '#ef4444', false);
    this.drawArrowLine(ctx, mx, cy - r_shad_draw, mx, cy + r_shad_draw, '', '#a78bfa', false); // No text on middle line to avoid Moon overlap
    this.drawArrowLine(ctx, mx, cy + r_shad_draw, mx, cy + er_draw, 'Taper: 0.5 d_M', '#ef4444', false);
    
    // Shadow label text to the right of Moon's circle
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 10px Outfit';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Shadow: 2.7 d_M', mx + 16, cy);
    ctx.restore();

    // Draw Moon at mx (inside shadow, drawn last so it sits on top of lines)
    ctx.save();
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(mx, cy, mr_draw, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mx, cy, mr_draw, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '600 10px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Moon', mx, cy + mr_draw + 14);
    ctx.restore();

    // Math Formula Box below showing key geometric relationships
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    this.drawRoundedRect(ctx, taskPanelWidth + availWidth * 0.22, cy + er_draw + 35, availWidth * 0.56, 45, 8);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 12px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Angular Sizes: A = B ≈ 0.5°   |   Shadow Taper: C = 2E = B - 2D ≈ B ≈ 0.5°', taskPanelWidth + availWidth * 0.5, cy + er_draw + 62);
    ctx.restore();
  }
  
  drawSubtaskDistance() {
    const ctx = this.ctx;
    const taskPanelWidth = 400;
    const availWidth = Math.max(300, this.canvas.width - taskPanelWidth);
    const availHeight = this.canvas.height;
    
    const cy = (availHeight - 120) * 0.5 + 30;
    const ex = taskPanelWidth + availWidth * 0.22;
    const mx = taskPanelWidth + availWidth * 0.76;
    
    const er_draw = 42;
    const mr_draw = 15;
    
    // Draw Header
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 16px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Measuring Earth-Moon Distance', taskPanelWidth + availWidth * 0.5, cy - 100);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 11px Outfit';
    ctx.fillText('Using the Moon\'s angular radius (α = 0.25°) and physical radius (R_M = 0.270 R_E)', taskPanelWidth + availWidth * 0.5, cy - 82);
    
    // Draw Central Axis (adjacent side of triangle)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(ex, cy);
    ctx.lineTo(mx, cy);
    ctx.stroke();
    ctx.restore();
    
    const d_dist = mx - ex;
    const alpha_rad = Math.asin(mr_draw / d_dist);
    const tx_m = mx - mr_draw * Math.sin(alpha_rad);
    const ty_m = cy - mr_draw * Math.cos(alpha_rad);

    // Draw Right Triangle (with right angle at point of tangency on Moon's top edge)
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
    ctx.beginPath();
    ctx.moveTo(ex, cy);
    ctx.lineTo(tx_m, ty_m);
    ctx.lineTo(mx, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Right angle marker at the point of tangency (tx_m, ty_m)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    const size_sq = 8;
    const cos_a = Math.cos(alpha_rad);
    const sin_a = Math.sin(alpha_rad);
    
    ctx.beginPath();
    ctx.moveTo(tx_m - size_sq * cos_a, ty_m + size_sq * sin_a);
    ctx.lineTo(tx_m - size_sq * cos_a + size_sq * sin_a, ty_m + size_sq * sin_a + size_sq * cos_a);
    ctx.lineTo(tx_m + size_sq * sin_a, ty_m + size_sq * cos_a);
    ctx.stroke();
    ctx.restore();
    
    // Draw Earth
    ctx.save();
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(ex, cy, er_draw, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // land masses
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(ex - 8, cy - 8, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + 10, cy + 8, 9, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Earth (R_E)', ex, cy + er_draw + 15);
    ctx.restore();
    
    // Draw Moon
    ctx.save();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(mx, cy, mr_draw, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Moon', mx, cy + mr_draw + 15);
    ctx.restore();
    
    // Labels for the triangle sides
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Distance (D_EM)', (ex + mx) * 0.5, cy + 18);
    
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 11px Outfit';
    ctx.textAlign = 'left';
    ctx.fillText('R_M = 0.270 R_E', mx + 12, cy - mr_draw * 0.75);
    
    // Angle Arc at Earth
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ex, cy, 45, -alpha_rad, 0);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 11px Outfit';
    ctx.fillText('α = 0.25°', ex + 55, cy - 8);
    ctx.restore();
    
    // Math Formula Box below
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    this.drawRoundedRect(ctx, taskPanelWidth + availWidth * 0.25, cy + er_draw + 35, availWidth * 0.5, 45, 8);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 12px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('D_EM = R_M / sin(0.25°) = 0.270 R_E / sin(0.25°) ≈ 61.9 R_E', taskPanelWidth + availWidth * 0.5, cy + er_draw + 62);
    ctx.restore();
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
    
    // Stars background
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < 40; i++) {
      let x = (Math.sin(i * 13579) * 0.5 + 0.5) * this.canvas.width;
      let y = (Math.cos(i * 24680) * 0.5 + 0.5) * this.canvas.height;
      if (x > 400) {
        this.ctx.fillRect(x, y, 1.2, 1.2);
      }
    }
    this.ctx.restore();
    
    // Draw current subtask model
    if (this.subtask === 'size') {
      this.drawSubtaskSize();
    } else if (this.subtask === 'taper') {
      this.drawSubtaskTaper();
    } else {
      this.drawSubtaskDistance();
    }
    
    this.animationId = requestAnimationFrame(this.animate);
  }
  
  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resizeBound);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
