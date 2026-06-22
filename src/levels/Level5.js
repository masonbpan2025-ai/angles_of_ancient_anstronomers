export class Level5 {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    
    this.obeliskPlaced = false;
    this.obeliskPos = null;
    this.angle = 7.2; // degrees (historical)
    
    // Listen for clicks to place obelisk
    this.canvas.addEventListener('click', this.onClick.bind(this));
    
    this.animate = this.animate.bind(this);
    this.animationId = requestAnimationFrame(this.animate);
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  onClick(e) {
    if(!this.obeliskPlaced) {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2 + 80;
      const radius = 180;
      
      const visualAngle = 25; // degrees for visual spacing
      const visualAngleRad = visualAngle * (Math.PI / 180);
      const alexX = centerX - Math.sin(visualAngleRad) * radius;
      const alexY = centerY - Math.cos(visualAngleRad) * radius;
      
      // Calculate click distance from Alexandria
      const dist = Math.hypot(e.clientX - alexX, e.clientY - alexY);

      // If clicked reasonably near Alexandria or the upper left quadrant of Earth, place it
      if (dist < 80 || (e.clientX < centerX && e.clientY < centerY - 40)) {
        this.obeliskPlaced = true;
        
        // Update DOM instruction states
        const s1 = document.getElementById('step-1');
        const s2 = document.getElementById('step-2');
        const s3 = document.getElementById('step-3');
        if (s1) {
          s1.innerHTML = '• <s>Click the yellow marker at <strong>Alexandria</strong> to erect the obelisk.</s> <span style="color: #4ade80; font-weight: bold; margin-left: 4px;">✓</span>';
          s1.style.color = 'var(--text-muted)';
        }
        if (s2) s2.style.opacity = '1';
        if (s3) s3.style.opacity = '1';
      }
    }
  }

  drawEarth() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2 + 80;
    const radius = 180;

    // --- EARTH CROSS SECTION INNER LAYERS ---
    // Outer atmosphere glow
    const glowGrad = ctx.createRadialGradient(cx, cy, radius - 10, cx, cy, radius + 15);
    glowGrad.addColorStop(0, 'rgba(37, 99, 235, 0.05)');
    glowGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.12)');
    glowGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 15, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Crust (Outer Earth)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#081329'; // Dark space blue
    ctx.fill();
    ctx.strokeStyle = '#2563eb'; // Neon blue outline
    ctx.lineWidth = 3;
    ctx.stroke();

    // Mantle Layer
    ctx.beginPath();
    ctx.arc(cx, cy, 110, 0, Math.PI * 2);
    ctx.fillStyle = '#1e1b4b'; // Slate deep purple
    ctx.fill();
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.25)'; // Faint orange mantle border
    ctx.lineWidth = 2;
    ctx.stroke();

    // Outer Core
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#3f1d0b'; // Deep brown-red magma core
    ctx.fill();
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner Core
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24'; // Glowing golden center
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Core label
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 11px Outfit';
    ctx.fillText('Core', cx - 12, cy + 4);

    // --- CITY ANGLE AND COORDINATES ---
    const visualAngle = 25; // degrees for visual spacing
    const visualAngleRad = visualAngle * (Math.PI / 180);

    const syeneX = cx;
    const syeneY = cy - radius;

    const alexX = cx - Math.sin(visualAngleRad) * radius;
    const alexY = cy - Math.cos(visualAngleRad) * radius;

    // --- SYENE DEEP WELL ---
    // Draw a dark rectangular well cut into the Earth at Syene (width 10, depth 25)
    ctx.save();
    ctx.translate(syeneX, syeneY);
    // Well goes straight down (towards center)
    ctx.fillStyle = '#020617'; // Well shadow
    ctx.fillRect(-5, 0, 10, 25);
    
    // Well walls
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-5, 25);
    ctx.moveTo(5, 0);
    ctx.lineTo(5, 25);
    ctx.stroke();
    
    // Bottom of the well
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.8)'; // illuminated bottom
    ctx.beginPath();
    ctx.moveTo(-5, 25);
    ctx.lineTo(5, 25);
    ctx.stroke();
    ctx.restore();

    // --- ABSOLUTE CENTER OF EARTH ---
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981'; // Emerald green center point
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.fillStyle = '#047857';
    ctx.font = '600 13px Outfit';
    ctx.fillText('Center of Earth (C)', cx + 12, cy + 4);

    // --- STAGE-SPECIFIC DRAWING ---
    // City markers
    // Syene City Marker (Red)
    ctx.beginPath();
    ctx.arc(syeneX, syeneY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 14px Outfit';
    ctx.fillText('Syene', syeneX + 12, syeneY - 12);

    // Alexandria City Marker (Yellow)
    ctx.beginPath();
    ctx.arc(alexX, alexY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 14px Outfit';
    ctx.fillText('Alexandria', alexX - 85, alexY - 12);

    // --- DISTANCE ARC BETWEEN CITIES ---
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, -Math.PI/2 - visualAngleRad, -Math.PI/2);
    ctx.strokeStyle = '#10b981'; // Green distance arc
    ctx.lineWidth = 3;
    ctx.stroke();

    // Distance Label: "800 km" (5000 stadia)
    const midAngle = -Math.PI/2 - visualAngleRad / 2;
    const lx = cx + Math.cos(midAngle) * (radius + 24);
    const ly = cy + Math.sin(midAngle) * (radius + 24);
    ctx.fillStyle = '#047857';
    ctx.font = '600 13px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('800 km', lx, ly);
    ctx.textAlign = 'left'; // Reset
    ctx.textBaseline = 'alphabetic'; // Reset

    // --- PARALLEL SUN RAYS ---
    // Background parallel rays (vertical)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.lineWidth = 1.5;
    const raySpacings = [-260, -180, -90, 90, 180, 260];
    for (const offset of raySpacings) {
      ctx.beginPath();
      ctx.moveTo(cx + offset, -50);
      ctx.lineTo(cx + offset, cy + radius - 20);
      ctx.stroke();
    }

    // Direct vertical Sun ray at Syene going ALL the way to the Earth center (through the well)
    // Draw the ray above Earth
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(syeneX, -50);
    ctx.lineTo(syeneX, syeneY);
    ctx.stroke();

    // Draw the ray inside the well (shining straight down)
    ctx.strokeStyle = '#fbbf24'; // Brighter inside the well
    ctx.beginPath();
    ctx.moveTo(syeneX, syeneY);
    ctx.lineTo(syeneX, syeneY + 25);
    ctx.stroke();

    // Radial Dashed Line from Syene (bottom of well) to Earth's Center
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(syeneX, syeneY + 25);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Radial Dashed Line from Alexandria to Earth's Center
    ctx.beginPath();
    ctx.moveTo(alexX, alexY);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    if (this.obeliskPlaced) {
      const obHeight = 60;
      const obTipX = alexX - Math.sin(visualAngleRad) * obHeight;
      const obTipY = alexY - Math.cos(visualAngleRad) * obHeight;

      // Draw Obelisk at Alexandria
      ctx.save();
      ctx.translate(alexX, alexY);
      ctx.rotate(-visualAngleRad);

      // Obelisk column body
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-3, -obHeight, 6, obHeight);

      // Golden pyramidion tip
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-3, -obHeight);
      ctx.lineTo(0, -obHeight - 8);
      ctx.lineTo(3, -obHeight);
      ctx.fill();
      ctx.restore();

      // --- SHADOW GEOMETRY (PERFECTLY VERTICAL SUN RAYS) ---
      // Alexandria sun ray is vertical: x = obTipX.
      // Shadow end point on ground tangent:
      const shadowLength = obHeight * Math.tan(visualAngleRad);
      const shadowEndX = obTipX;
      const shadowEndY = alexY + shadowLength * Math.sin(visualAngleRad);

      // Draw Obelisk Shadow cast along the tangent ground line
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(alexX, alexY);
      ctx.lineTo(shadowEndX, shadowEndY);
      ctx.stroke();

      // Label the shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.font = '500 12px Outfit';
      ctx.fillText('Shadow', shadowEndX - 45, shadowEndY + 12);

      // --- ALEXANDRIA SUN RAY (PERFECTLY VERTICAL) ---
      // Sunlight ray from top of screen to the obelisk tip
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(obTipX, -50);
      ctx.lineTo(obTipX, obTipY);
      ctx.stroke();

      // Tangent ray extension grazing the obelisk tip to the shadow end
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.85)';
      ctx.beginPath();
      ctx.moveTo(obTipX, obTipY);
      ctx.lineTo(shadowEndX, shadowEndY);
      ctx.stroke();
      ctx.setLineDash([]);

      // --- ANGLE ANNOTATIONS (ALTERNATE INTERIOR) ---
      // Angle A: Angle at the center of the Earth (between radial lines)
      ctx.beginPath();
      ctx.arc(cx, cy, 45, -Math.PI/2 - visualAngleRad, -Math.PI/2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label for Angle at Center
      ctx.fillStyle = '#d97706';
      ctx.font = '600 13px Outfit';
      ctx.fillText('7.2°', cx - 20, cy - 60);

      // Label "Central Angle"
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.font = '12px Outfit';
      ctx.fillText('Central Angle (θ)', cx - 95, cy - 35);

      // Angle B: Angle at the obelisk tip (between vertical ray and obelisk column axis)
      // Obelisk points inwards from tip to base at angle: Math.PI/2 - visualAngleRad.
      // Vertical ray goes straight down at angle: Math.PI/2.
      ctx.beginPath();
      ctx.arc(obTipX, obTipY, 25, Math.PI/2 - visualAngleRad, Math.PI/2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label for Angle at Tip
      ctx.fillStyle = '#d97706';
      ctx.font = '600 13px Outfit';
      ctx.fillText('7.2°', obTipX - 8, obTipY + 42);

      // Label "Shadow Angle"
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.font = '12px Outfit';
      ctx.fillText('Shadow Angle (θ)', obTipX - 102, obTipY + 22);

      // Connection/Explanation text
      ctx.fillStyle = '#047857';
      ctx.font = '600 13px Outfit';
      ctx.fillText('Alternate interior angles are equal (θ = 7.2°)', cx - 130, cy - 100);

      // Scale warning
      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.font = 'italic 11px Outfit';
      ctx.fillText('*Angles and scale exaggerated for visual clarity', cx - 120, cy + radius + 40);

    } else {
      ctx.fillStyle = '#0f172a';
      ctx.font = '500 16px Outfit';
      ctx.fillText('Click Alexandria (indicated by the yellow marker) to erect the obelisk', cx - 240, 45);
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Daylight sky background (vertical linear gradient)
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    skyGrad.addColorStop(0, '#7dd3fc');  // Sky blue at the top
    skyGrad.addColorStop(0.5, '#bae6fd'); // Light sky blue in the middle
    skyGrad.addColorStop(1, '#f0f9ff');   // Very light blue/white at the bottom
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawEarth();
    
    this.animationId = requestAnimationFrame(this.animate);
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
