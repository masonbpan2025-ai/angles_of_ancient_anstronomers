import { gameState } from '../core/GameState.js';

export class LevelUI {
  constructor(uiLayer) {
    this.container = document.createElement('div');
    this.container.className = 'level-ui';
    uiLayer.appendChild(this.container);

    gameState.subscribe((state) => {
      if (state.activeLevel === 1) {
        this.renderLevel1();
        this.show();
      } else if (state.activeLevel === 2) {
        this.renderLevel2();
        this.show();
      } else {
        this.hide();
      }
    });
  }

  renderLevel1() {
    this.container.innerHTML = `
      <div class="level-panel" style="max-height: calc(100% - 80px); overflow-y: auto;">
        <h2>Eratosthenes' Experiment</h2>
        <div class="story-container">
          <p class="story-short">
            In 240 BC, Eratosthenes calculated the Earth's circumference by comparing the Sun's angles at Alexandria and Syene. 
            <a href="https://www.eg.bucknell.edu/physics/astronomy/astr101/specials/eratosthenes.html" target="_blank" class="story-link">Read reference</a>.
            <span class="hover-tip">(Hover for details)</span>
          </p>
          <div class="story-details-tooltip">
            <div class="story-tooltip-title">Detailed Historical Context</div>
            <p>At noon on the summer solstice, the Sun shone directly down a deep vertical well in Syene, casting no shadow at all. This meant the Sun was positioned directly overhead.</p>
            <p>At the exact same moment in Alexandria, Eratosthenes noticed that a vertical obelisk (gnomon) did cast a shadow. He measured this shadow, calculating the angle between the obelisk and the sun's rays to be <strong>7.2°</strong>—which is exactly 1/50th of a full 360° circle.</p>
            <p>Assuming the Sun is immensely distant, its incoming rays arrive parallel at both locations. Applying simple geometry, the angle on the stick (7.2°) is equal to the angle at the center of the Earth between the two cities (alternate interior angles).</p>
            <p>Since this 7.2° arc represents 1/50th of the Earth's circumference, the physical distance between the cities (~800 km) must represent 1/50th of the global circumference. Multiplying 800 km by 50 yields the Earth's full size.</p>
          </div>
        </div>
        
        <div class="instruction-box">
          <strong>Instructions:</strong><br>
          <div id="step-1" style="margin-top: 6px; transition: all 0.3s;">• Click the yellow marker at <strong>Alexandria</strong> to erect the obelisk.</div>
          <div id="step-2" style="margin-top: 6px; opacity: 0.5; transition: all 0.3s;">• Observe that the shadow angle (7.2°) and central angle (7.2°) are equal.</div>
          <div id="step-3" style="margin-top: 6px; opacity: 0.5; transition: all 0.3s;">• Calculate the Earth's circumference: 50 × 800 km.</div>
        </div>

        <div class="input-group">
          <label>Earth's Circumference (km)</label>
          <div class="input-row">
            <input type="number" id="circumference-input" placeholder="e.g. 10000" />
            <button id="submit-btn">Verify</button>
          </div>
          <div id="feedback" class="feedback-msg"></div>
        </div>
      </div>
      
      <button class="back-btn" id="back-btn">Exit to Solar System</button>
    `;

    document.getElementById('back-btn').addEventListener('click', () => {
      gameState.activeLevel = null;
      gameState.notify();
    });

    document.getElementById('submit-btn').addEventListener('click', () => {
      const val = parseInt(document.getElementById('circumference-input').value, 10);
      const feedback = document.getElementById('feedback');
      
      if (val === 40000) {
        feedback.textContent = "Correct! The Earth's circumference is ~40,000 km.";
        feedback.className = "feedback-msg show success";
        setTimeout(() => {
          gameState.completeLevel(1);
        }, 2000);
      } else {
        feedback.textContent = "Incorrect. Remember: (360 / 7.2) * 800 = 50 * 800.";
        feedback.className = "feedback-msg show error";
      }
    });
  }

  renderLevel2() {
    const formatLocalTime = (deg) => {
      const d = parseFloat(deg);
      const totalMinutes = Math.round((12 * 60 + d * 4) % 1440);
      let hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      let dispHours = hours % 12;
      if (dispHours === 0) dispHours = 12;
      const dispMins = minutes.toString().padStart(2, '0');
      
      if (Math.abs(d - 0) < 0.1 || Math.abs(d - 360) < 0.1) return '12:00 PM (Noon)';
      if (Math.abs(d - 90) < 0.1) return '6:00 PM (Sunset)';
      if (Math.abs(d - 180) < 0.1) return '12:00 AM (Midnight)';
      if (Math.abs(d - 270) < 0.1) return '6:00 AM (Sunrise)';
      
      return `${dispHours}:${dispMins} ${ampm}`;
    };

    this.container.innerHTML = `
      <div class="level-panel" style="max-height: calc(100% - 80px); overflow-y: auto;">
        <h2>Lunar Orbit Inclination</h2>
        <div class="story-container">
          <p class="story-short">
            Ptolemy measured the Moon's orbit inclination (β) relative to the ecliptic plane by observing its transit near the summer solstice.
            <a href="https://jonvoisey.net/blog/2020/12/almagest-book-v-lunar-parallactic-observations/" target="_blank" class="story-link">Read reference</a>.
            <span class="hover-tip">(Hover for details)</span>
          </p>
          <div class="story-details-tooltip">
            <div class="story-tooltip-title">Detailed Mathematical Context</div>
            <p>To measure inclination without complex spherical trigonometry, Ptolemy observed the Moon transiting the meridian at the summer solstice. In this position, the Moon's circle of latitude and the meridian coincide.</p>
            <p>At Alexandria (observer latitude φ = 30;58°), the obliquity of the ecliptic is ε = 23;51°.</p>
            <p>During the solstice, when the Moon was at its northernmost orbital peak, Ptolemy measured its minimum zenith distance to be z = 2;7,30° (2 1/8°).</p>
            <p>Thus, the declination of the Moon was calculated as:<br>
            δ = φ - z = 30;58° - 2;7,30° = 28;50,30°</p>
            <p>Subtracting the ecliptic obliquity ε = 23;51° yields the inclination angle:<br>
            β = δ - ε = 28;50,30° - 23;51° = 4;59,30° ≈ <strong>5°</strong>.</p>
            <p>For context on Ptolemy's instruments and lunar distance scaling, see the <a href="https://jonvoisey.net/blog/2020/12/almagest-book-v-lunar-parallax/" target="_blank" class="story-link">Lunar Parallax overview</a>.</p>
          </div>
        </div>

        <div class="instruction-box" style="display: flex; flex-direction: column; gap: 10px;">
          <strong>Interactive Model Parameters:</strong>
          
          <div class="slider-group">
            <div class="slider-label-row" style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
              <span style="color: var(--text-main);">Moon Position (Longitude):</span>
              <span id="moon-long-val" style="color: var(--primary); font-weight: 600;">90°</span>
            </div>
            <input type="range" id="moon-long-slider" min="-90" max="270" step="1" value="90" class="observatory-slider" />
          </div>

          <div class="slider-group">
            <div class="slider-label-row" style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
              <span style="color: var(--text-main);">Sun Position (Longitude):</span>
              <span id="sun-long-val" style="color: var(--primary); font-weight: 600;">90°</span>
            </div>
            <input type="range" id="sun-long-slider" min="0" max="360" step="1" value="90" class="observatory-slider" />
          </div>

          <div class="slider-group">
            <div class="slider-label-row" style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
              <span style="color: var(--text-main);">Earth Self-Rotation:</span>
              <span id="earth-rot-val" style="color: var(--primary); font-weight: 600;">0° (12:00 PM Noon)</span>
            </div>
            <input type="range" id="earth-rot-slider" min="0" max="360" step="1" value="0" class="observatory-slider" />
          </div>

          <div class="slider-group">
            <div class="slider-label-row" style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
              <span style="color: var(--text-main);">Orbit Inclination (β):</span>
              <span id="moon-inc-val" style="color: var(--primary); font-weight: 600;">5.0°</span>
            </div>
            <input type="range" id="moon-inc-slider" min="0" max="10" step="0.1" value="5.0" class="observatory-slider" />
          </div>

          <div class="slider-group" style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <span style="color: var(--text-main); font-size: 0.85rem;">Reference Frame:</span>
            <div class="reference-toggle-group" style="display: flex; gap: 4px; background: rgba(0,0,0,0.3); padding: 2px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);">
              <button id="ref-rotate-earth-btn" class="toggle-pill" style="padding: 4px 10px; font-size: 0.72rem; border-radius: 4px; border: none; background: var(--primary); color: #05050a; font-weight: bold; cursor: pointer; transition: all 0.2s;">Rotate Earth</button>
              <button id="ref-fixed-horizon-btn" class="toggle-pill" style="padding: 4px 10px; font-size: 0.72rem; border-radius: 4px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; transition: all 0.2s;">Fixed Horizon</button>
            </div>
          </div>

          <div style="margin-top: 6px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Eclipse Sub-tasks:</div>
            <div id="solar-eclipse-task" style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-muted); transition: all 0.2s;">
              <span class="status-icon" style="color: #ef4444; font-weight: bold;">\u2717</span>
              <span>Solar Eclipse (Align at node, e.g. 90° & 90°)</span>
            </div>
            <div id="lunar-eclipse-task" style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-muted); transition: all 0.2s;">
              <span class="status-icon" style="color: #ef4444; font-weight: bold;">\u2717</span>
              <span>Lunar Eclipse (Align at nodes, e.g. 90° & 270°)</span>
            </div>
          </div>
        </div>

        <div class="instruction-box">
          <strong>Instructions:</strong><br>
          <div id="step-1" style="margin-top: 6px; transition: all 0.3s;">• Drag the 3D canvas to rotate the celestial sphere.</div>
          <div id="step-2" style="margin-top: 6px; transition: all 0.3s;">• Use the sliders to adjust Moon, Sun, and Earth rotation. Compare reference frames (**Rotate Earth** vs **Fixed Horizon**) to see how coordinates revolve.</div>
          <div id="step-3" style="margin-top: 6px; transition: all 0.3s;">• Find the correct positions for **Solar Eclipse** and **Lunar Eclipse** in the sub-tasks checklist.</div>
          <div id="step-4" style="margin-top: 6px; transition: all 0.3s;">• Enter Ptolemy's calculated orbital inclination angle β in the box below.</div>
        </div>

        <div class="input-group">
          <label>Orbital Inclination Angle β (degrees)</label>
          <div class="input-row">
            <input type="number" id="inclination-input" placeholder="e.g. 5.0" step="0.1" />
            <button id="submit-btn">Verify</button>
          </div>
          <div id="feedback" class="feedback-msg"></div>
        </div>
      </div>
      
      <button class="back-btn" id="back-btn">Exit to Solar System</button>
    `;

    document.getElementById('back-btn').addEventListener('click', () => {
      gameState.activeLevel = null;
      gameState.notify();
    });

    const longSlider = document.getElementById('moon-long-slider');
    const longVal = document.getElementById('moon-long-val');
    const sunSlider = document.getElementById('sun-long-slider');
    const sunVal = document.getElementById('sun-long-val');
    const rotSlider = document.getElementById('earth-rot-slider');
    const rotVal = document.getElementById('earth-rot-val');
    const incSlider = document.getElementById('moon-inc-slider');
    const incVal = document.getElementById('moon-inc-val');
    const rotateEarthBtn = document.getElementById('ref-rotate-earth-btn');
    const fixedHorizonBtn = document.getElementById('ref-fixed-horizon-btn');

    const updateToggleState = (rotateEarth) => {
      if (rotateEarth) {
        rotateEarthBtn.style.background = 'var(--primary)';
        rotateEarthBtn.style.color = '#05050a';
        rotateEarthBtn.style.fontWeight = 'bold';
        
        fixedHorizonBtn.style.background = 'transparent';
        fixedHorizonBtn.style.color = 'var(--text-muted)';
        fixedHorizonBtn.style.fontWeight = 'normal';
      } else {
        rotateEarthBtn.style.background = 'transparent';
        rotateEarthBtn.style.color = 'var(--text-muted)';
        rotateEarthBtn.style.fontWeight = 'normal';
        
        fixedHorizonBtn.style.background = 'var(--primary)';
        fixedHorizonBtn.style.color = '#05050a';
        fixedHorizonBtn.style.fontWeight = 'bold';
      }
    };

    rotateEarthBtn.addEventListener('click', () => {
      updateToggleState(true);
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setRotateEarth === 'function') {
        window.activeLevelInstance.setRotateEarth(true);
      }
    });

    fixedHorizonBtn.addEventListener('click', () => {
      updateToggleState(false);
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setRotateEarth === 'function') {
        window.activeLevelInstance.setRotateEarth(false);
      }
    });

    const checkEclipseAlignment = () => {
      const sunVal = parseFloat(sunSlider.value);
      const moonVal = parseFloat(longSlider.value);
      
      const solarEl = document.getElementById('solar-eclipse-task');
      const lunarEl = document.getElementById('lunar-eclipse-task');
      if (!solarEl || !lunarEl) return;
      
      // Helper to normalize angle to [0, 360)
      const norm = (deg) => (deg % 360 + 360) % 360;
      const sNorm = norm(sunVal);
      const mNorm = norm(moonVal);
      
      // Solar Eclipse: Conjunction at nodes (90 or 270)
      const isSolarNode = Math.abs(sNorm - 90) < 4 || Math.abs(sNorm - 270) < 4;
      const diff = Math.abs(sNorm - mNorm);
      const isSolarAligned = diff < 4 || diff > 356;
      
      if (isSolarNode && isSolarAligned) {
        solarEl.style.color = 'var(--primary)';
        solarEl.querySelector('.status-icon').textContent = '\u2713';
        solarEl.querySelector('.status-icon').style.color = 'var(--primary)';
      } else {
        solarEl.style.color = 'var(--text-muted)';
        solarEl.querySelector('.status-icon').textContent = '\u2717';
        solarEl.querySelector('.status-icon').style.color = '#ef4444';
      }
      
      // Lunar Eclipse: Opposition at nodes (90 and 270)
      const isLunarNode = (Math.abs(sNorm - 90) < 4 && Math.abs(mNorm - 270) < 4) || 
                          (Math.abs(sNorm - 270) < 4 && Math.abs(mNorm - 90) < 4);
      
      if (isLunarNode) {
        lunarEl.style.color = 'var(--primary)';
        lunarEl.querySelector('.status-icon').textContent = '\u2713';
        lunarEl.querySelector('.status-icon').style.color = 'var(--primary)';
      } else {
        lunarEl.style.color = 'var(--text-muted)';
        lunarEl.querySelector('.status-icon').textContent = '\u2717';
        lunarEl.querySelector('.status-icon').style.color = '#ef4444';
      }
    };

    longSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      longVal.textContent = val + '°';
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setMoonLongitude === 'function') {
        window.activeLevelInstance.setMoonLongitude(val);
      }
      checkEclipseAlignment();
    });

    sunSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      sunVal.textContent = val + '°';
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setSunLongitude === 'function') {
        window.activeLevelInstance.setSunLongitude(val);
      }
      checkEclipseAlignment();
    });

    rotSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      rotVal.textContent = `${val}° (${formatLocalTime(val)})`;
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setEarthRotation === 'function') {
        window.activeLevelInstance.setEarthRotation(val);
      }
    });

    incSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      incVal.textContent = parseFloat(val).toFixed(1) + '°';
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setInclination === 'function') {
        window.activeLevelInstance.setInclination(val);
      }
    });

    // Run once at start to check initial alignment
    checkEclipseAlignment();

    document.getElementById('submit-btn').addEventListener('click', () => {
      const val = parseFloat(document.getElementById('inclination-input').value);
      const feedback = document.getElementById('feedback');
      
      if (Math.abs(val - 5.0) < 0.15) {
        feedback.textContent = "Correct! Ptolemy measured β to be ~5° (specifically 4;59,30°).";
        feedback.className = "feedback-msg show success";
        setTimeout(() => {
          gameState.completeLevel(2);
        }, 2000);
      } else {
        feedback.textContent = "Incorrect. Subtract: (30;58° - 2;7,30°) - 23;51° = 4;59,30°.";
        feedback.className = "feedback-msg show error";
      }
    });
  }

  hide() {
    this.container.classList.remove('active');
    this.container.innerHTML = '';
  }

  show() {
    this.container.classList.add('active');
  }
}
