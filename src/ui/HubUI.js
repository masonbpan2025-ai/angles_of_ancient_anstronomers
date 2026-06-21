import { gameState } from '../core/GameState.js';

export class HubUI {
  constructor(uiLayer, onLevelSelect, onSelectionChange, onControlChange) {
    this.uiLayer = uiLayer;
    this.container = document.createElement('div');
    this.container.className = 'hub-ui';
    uiLayer.appendChild(this.container);
    this.onLevelSelect = onLevelSelect;
    this.onSelectionChange = onSelectionChange;
    this.onControlChange = onControlChange;

    this.selectedLevelId = 0;

    // Define all 7 historical levels + Overview screen
    this.levels = [
      { 
        id: 0, 
        title: 'Overview Screen', 
        target: 'system', 
        desc: 'Solar System Tracker', 
        briefingTitle: 'Solar System Overview', 
        briefingText: 'Select a historical mission from the tracker menu to analyze how ancient astronomers calculated the mathematics of our cosmos.' 
      },
      { 
        id: 1, 
        title: 'Level 1: Calendar System', 
        target: 'earth-moon', 
        desc: 'Diurnal and annual orbits', 
        briefingTitle: 'Calendar Systems', 
        briefingText: 'Explore how ancient civilizations developed calendar systems by observing the diurnal and annual orbits of the Sun and Moon from a geocentric perspective.' 
      },
      { 
        id: 2, 
        title: 'Level 2: Eratosthenes', 
        target: 'earth', 
        desc: 'Measure the Earth\'s size', 
        briefingTitle: 'Eratosthenes\' Circumference', 
        briefingText: 'In 240 BC, Eratosthenes calculated the Earth\'s circumference using shadow geometry in Alexandria and Syene. Place an obelisk at Alexandria, measure the shadow angle (7.2°), and calculate the circumference.' 
      },
      { 
        id: 3, 
        title: 'Level 3: Lunar Inclination', 
        target: 'earth-moon', 
        desc: 'Measure Moon\'s orbit inclination', 
        briefingTitle: 'Lunar Orbit Inclination', 
        briefingText: 'Determine the 5° inclination of the Moon\'s orbit relative to the ecliptic by measuring the Moon\'s zenith distance at meridian transit during the summer solstice.' 
      },
      { 
        id: 4, 
        title: 'Level 4: Aristarchus', 
        target: 'earth-moon', 
        desc: 'Lunar eclipse alignment', 
        briefingTitle: 'Aristarchus\' Lunar Ratio', 
        briefingText: 'Measure the curvature of Earth\'s shadow during a lunar eclipse to deduce the relative size of the Moon and the distance to the Sun. Observe the Moon orbiting through the Earth\'s dark umbra shadow cone.' 
      },
      { 
        id: 5, 
        title: 'Level 5: Ptolemy', 
        target: 'earth-polar', 
        desc: 'Diurnal polar parallax', 
        briefingTitle: 'Ptolemy\'s Parallax Angle', 
        briefingText: 'Leverage Earth\'s structural rotation to calculate the parallax angle of the Moon relative to the absolute center of the Earth. Observe the Earth\'s rotation from a polar perspective.' 
      },
      { 
        id: 6, 
        title: 'Level 6: Kepler\'s Law', 
        target: 'system-inner', 
        desc: 'Empirical orbital scales', 
        briefingTitle: 'Kepler\'s Empirical Orbits', 
        briefingText: 'Analyze Tycho Brahe\'s raw observational positional markers to verify that planetary orbits are elliptical and adhere to Kepler\'s third ratio: P² ∝ a³.' 
      },
      { 
        id: 7, 
        title: 'Level 7: Transit of Venus', 
        target: 'venus-transit', 
        desc: 'Determine the AU distance', 
        briefingTitle: 'The Transit of Venus', 
        briefingText: 'Cross-reference transit observation recordings across global stations to deduce the true distance of 1 Astronomical Unit (the Sun-Earth distance) in kilometers.' 
      }
    ];

    this.render();

    gameState.subscribe((state) => {
      this.updateState(state);
    });
  }

  render() {
    this.container.innerHTML = '';

    // 1. Sidebar Panel
    const sidebar = document.createElement('div');
    sidebar.className = 'hub-sidebar';

    const header = document.createElement('div');
    header.className = 'hub-header';
    header.innerHTML = `
      <h1>AAA</h1>
      <p>Angles of the Ancient Astronomers</p>
    `;
    sidebar.appendChild(header);

    const listContainer = document.createElement('div');
    listContainer.className = 'level-list';
    sidebar.appendChild(listContainer);

    this.levels.forEach(level => {
      const btn = document.createElement('button');
      btn.className = `level-btn ${this.selectedLevelId === level.id ? 'active' : ''}`;
      
      // Level 0 is Overview, others unlocked programmatically in gameState
      const isUnlocked = gameState.unlockedLevels.includes(level.id) || level.id === 0;
      if (!isUnlocked) {
        btn.setAttribute('disabled', 'true');
      }

      btn.innerHTML = `
        <h3>${level.title}</h3>
        <p>${level.desc}</p>
      `;

      btn.addEventListener('click', () => {
        if (this.selectedLevelId === level.id) return;
        this.selectedLevelId = level.id;
        
        // Update active class on buttons
        const btns = listContainer.querySelectorAll('.level-btn');
        btns.forEach((b, idx) => {
          if (idx === level.id) b.classList.add('active');
          else b.classList.remove('active');
        });

        // Trigger camera target focus change in the Hub
        if (this.onSelectionChange) {
          this.onSelectionChange(level.target);
        }

        // Re-render briefing contents
        this.renderBriefing();
      });

      listContainer.appendChild(btn);
    });

    this.container.appendChild(sidebar);

    // 2. Briefing Panel
    this.briefingPanel = document.createElement('div');
    this.briefingPanel.className = 'hub-briefing';
    this.container.appendChild(this.briefingPanel);

    // Clean up existing observatory panel if any to avoid memory leaks
    if (this.observatoryPanel && this.observatoryPanel.parentNode) {
      this.observatoryPanel.parentNode.removeChild(this.observatoryPanel);
    }

    // 3. Observatory Camera Deck Panel (sliders + jsorrery link, collapsible)
    this.observatoryPanel = document.createElement('div');
    this.observatoryPanel.className = 'observatory-panel collapsed'; // default to collapsed
    this.observatoryPanel.innerHTML = `
      <div class="observatory-header">
        <span class="observatory-title">Observatory Controls</span>
        <button id="observatory-toggle-btn" class="observatory-toggle-btn">Expand ⌃</button>
      </div>
      
      <div class="observatory-content">
        <div class="observatory-info-box">
          To explore relative point of view (POV) cameras and night sky simulations, visit the 
          <a href="https://mgvez.github.io/jsorrery/" target="_blank" rel="noopener noreferrer" class="observatory-link">jsorrery interactive portal</a>.
        </div>
        
        <div class="observatory-group">
          <div class="slider-label-row">
            <label for="sun-intensity-slider">Sun Intensity:</label>
            <span id="sun-intensity-val">4.0</span>
          </div>
          <input type="range" id="sun-intensity-slider" class="observatory-slider" min="0.5" max="10.0" step="0.1" value="4.0">
        </div>
        
        <div class="observatory-group">
          <div class="slider-label-row">
            <label for="sim-speed-slider">Simulation Speed:</label>
            <span id="sim-speed-val">1.0x</span>
          </div>
          <input type="range" id="sim-speed-slider" class="observatory-slider" min="0.0" max="5.0" step="0.1" value="1.0">
        </div>
        
        <div class="observatory-group">
          <div class="slider-label-row">
            <label for="ambient-light-slider">Ambient Light:</label>
            <span id="ambient-light-val">0.40</span>
          </div>
          <input type="range" id="ambient-light-slider" class="observatory-slider" min="0.0" max="1.0" step="0.01" value="0.40">
        </div>
        
        <button id="reset-perspective-btn" class="observatory-btn">Reset View</button>
      </div>
    `;
    this.uiLayer.appendChild(this.observatoryPanel);

    // Bind toggle event
    const toggleBtn = this.observatoryPanel.querySelector('#observatory-toggle-btn');
    toggleBtn.addEventListener('click', () => {
      const isCollapsed = this.observatoryPanel.classList.toggle('collapsed');
      toggleBtn.innerText = isCollapsed ? 'Expand ⌃' : 'Collapse ⌵';
    });

    // Bind slider events
    const sunSlider = this.observatoryPanel.querySelector('#sun-intensity-slider');
    const sunVal = this.observatoryPanel.querySelector('#sun-intensity-val');
    const simSlider = this.observatoryPanel.querySelector('#sim-speed-slider');
    const simVal = this.observatoryPanel.querySelector('#sim-speed-val');
    const ambSlider = this.observatoryPanel.querySelector('#ambient-light-slider');
    const ambVal = this.observatoryPanel.querySelector('#ambient-light-val');
    const resetBtn = this.observatoryPanel.querySelector('#reset-perspective-btn');

    sunSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      sunVal.innerText = val.toFixed(1);
      if (this.onControlChange) this.onControlChange('sunIntensity', val);
    });

    simSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      simVal.innerText = val.toFixed(1) + 'x';
      if (this.onControlChange) this.onControlChange('simSpeed', val);
    });

    ambSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ambVal.innerText = val.toFixed(2);
      if (this.onControlChange) this.onControlChange('ambientLight', val);
    });

    resetBtn.addEventListener('click', () => {
      this.resetControls();
      const info = this.levels.find(l => l.id === this.selectedLevelId);
      if (info && this.onSelectionChange) {
        this.onSelectionChange(info.target);
      }
    });

    this.renderBriefing();
  }

  renderBriefing() {
    const info = this.levels.find(l => l.id === this.selectedLevelId);
    
    // Hide briefing panel on Overview screen (Level 0) so it doesn't block the view of the solar system
    if (this.selectedLevelId === 0) {
      this.briefingPanel.style.display = 'none';
      return;
    }
    
    this.briefingPanel.style.display = 'flex';
    const isPlayable = this.selectedLevelId !== 0;
    const isUnlocked = gameState.unlockedLevels.includes(this.selectedLevelId);
    
    this.briefingPanel.innerHTML = `
      <div class="briefing-content">
        <h2>${info.briefingTitle}</h2>
        <p>${info.briefingText}</p>
      </div>
      <div class="launch-btn-container" style="display: ${isPlayable && isUnlocked ? 'flex' : 'none'};">
        <button class="launch-btn">Launch Core Puzzle</button>
      </div>
    `;

    if (isPlayable && isUnlocked) {
      this.briefingPanel.querySelector('.launch-btn').addEventListener('click', () => {
        if (this.onLevelSelect) {
          this.onLevelSelect(this.selectedLevelId);
        }
      });
    }
  }

  updateState(state) {
    if (state.activeLevel !== null) {
      this.hide();
    } else {
      // Set selected level as the highest unlocked if current is locked or invalid
      const isUnlocked = gameState.unlockedLevels.includes(this.selectedLevelId) || this.selectedLevelId === 0;
      if (!isUnlocked) {
        this.selectedLevelId = Math.max(...gameState.unlockedLevels);
      }

      // Synchronize 3D camera target with current selection when returning to hub
      const info = this.levels.find(l => l.id === this.selectedLevelId);
      if (this.onSelectionChange && info) {
        this.onSelectionChange(info.target);
      }

      this.render();
      this.show();
    }
  }

  hide() {
    this.container.classList.add('hidden');
    if (this.observatoryPanel) {
      this.observatoryPanel.classList.add('hidden');
    }
  }

  show() {
    this.container.classList.remove('hidden');
    if (this.observatoryPanel) {
      this.observatoryPanel.classList.remove('hidden');
    }
  }

  resetControls() {
    const sunSlider = this.observatoryPanel.querySelector('#sun-intensity-slider');
    const simSlider = this.observatoryPanel.querySelector('#sim-speed-slider');
    const ambSlider = this.observatoryPanel.querySelector('#ambient-light-slider');

    if (sunSlider) {
      sunSlider.value = 4.0;
      this.observatoryPanel.querySelector('#sun-intensity-val').innerText = '4.0';
      if (this.onControlChange) this.onControlChange('sunIntensity', 4.0);
    }
    if (simSlider) {
      simSlider.value = 1.0;
      this.observatoryPanel.querySelector('#sim-speed-val').innerText = '1.0x';
      if (this.onControlChange) this.onControlChange('simSpeed', 1.0);
    }
    if (ambSlider) {
      ambSlider.value = 0.40;
      this.observatoryPanel.querySelector('#ambient-light-val').innerText = '0.40';
      if (this.onControlChange) this.onControlChange('ambientLight', 0.40);
    }
  }
}
