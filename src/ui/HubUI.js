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

    // Define all 8 historical levels + Overview screen
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
        title: 'Level 2: Eclipse and Lunar Inclination', 
        target: 'earth-moon', 
        desc: 'Orbit inclination & eclipse geometries', 
        briefingTitle: 'Eclipse & Lunar Inclination', 
        briefingText: 'Explore how shadows cause solar and lunar eclipses, determine why they do not occur every month, and calculate the tilt (inclination) of the Moon\'s orbit relative to the ecliptic plane.' 
      },
      { 
        id: 3, 
        title: 'Level 3: Aristarchus 1', 
        target: 'earth-moon', 
        desc: 'How he measured relative Sun & Moon distance', 
        briefingTitle: 'Aristarchus\' Relative Distance', 
        briefingText: 'Aristarchus estimated the relative distance to the Sun by measuring the angle between the Sun and Moon when the Moon is exactly half lit.' 
      },
      { 
        id: 4, 
        title: 'Level 4: Aristarchus 2', 
        target: 'earth-moon', 
        desc: 'Measure relative moon size', 
        briefingTitle: 'Aristarchus\' Moon Size & Distance', 
        briefingText: 'Use the geometry of similar triangles during a lunar eclipse to calculate the Moon\'s radius relative to Earth\'s radius, and then deduce the Earth-Moon distance.' 
      },
      { 
        id: 5, 
        title: 'Level 5: Eratosthenes', 
        target: 'earth', 
        desc: 'Measure the Earth\'s size', 
        briefingTitle: 'Eratosthenes\' Circumference', 
        briefingText: 'In 240 BC, Eratosthenes calculated the Earth\'s circumference using shadow geometry in Alexandria and Syene. Place an obelisk at Alexandria, measure the shadow angle (7.2°), and calculate the circumference.' 
      },
      { 
        id: 6, 
        title: 'Level 6: Ptolemy', 
        target: 'earth-polar', 
        desc: 'The Geocentric Model', 
        briefingTitle: 'The Geocentric Model & Stellar Parallax', 
        briefingText: 'Explore the geocentric model. Under a heliocentric hypothesis, Earth\'s orbit should cause stars to shift position (stellar parallax). Since ancient astronomers observed no parallax, they rejected heliocentrism and refined the geocentric model using epicycles to explain retrograde motion.' 
      },
      { 
        id: 7, 
        title: 'Level 7: Copernicus', 
        target: 'system-inner', 
        desc: 'The Heliocentric model', 
        briefingTitle: 'Copernicus\' Heliocentric Model', 
        briefingText: 'Understand how Nicolaus Copernicus shifted the center of the cosmos to the Sun. Compare the geometric equivalence of geocentric epicycles and heliocentric concentric orbits, and learn why perfect circles limited his model\'s accuracy.' 
      },
      { 
        id: 8, 
        title: 'Level 8: Kepler\'s Law', 
        target: 'system-inner', 
        desc: 'Empirical orbital scales', 
        briefingTitle: 'Kepler\'s Empirical Orbits', 
        briefingText: 'Analyze Tycho Brahe\'s raw observational positional markers to verify that planetary orbits are elliptical and adhere to Kepler\'s third ratio: P² ∝ a³.' 
      },
      { 
        id: 9, 
        title: 'Level 9: Newton', 
        target: 'earth-moon', 
        desc: 'Universal Gravitation', 
        briefingTitle: 'Newton\'s Universal Gravitation', 
        briefingText: 'Explore Newton\'s Cannonball thought experiment to see how gravity governs orbits, and visualise the mathematical derivation of the Universal Law of Gravity.' 
      },
      { 
        id: 10, 
        title: 'Level 10: Black Hole', 
        target: 'earth-moon', 
        desc: 'Find black hole condition using Newtonian physics', 
        briefingTitle: 'Dark Stars & Black Holes', 
        briefingText: 'Explore the Newtonian concept of a "Dark Star" — an object so massive or dense that its orbital velocity at the surface matches the speed of light, preventing light from escaping.' 
      },
      { 
        id: 11, 
        title: 'Level 11: Gravity Constant', 
        target: 'earth', 
        desc: 'How the Gravity Constant and the density of earth is measured', 
        briefingTitle: 'Cavendish\'s Gravity Constant', 
        briefingText: 'Analyze Henry Cavendish\'s famous 1798 torsion balance experiment, which measured the tiny gravitational attraction between lead spheres to determine the gravitational constant G and "weigh" the Earth.' 
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
      <div class="hub-title-container" style="position: relative; display: flex; flex-direction: column; gap: 6px;">
        <!-- SVGs/decorations -->
        <div class="header-decorations" style="display: flex; gap: 8px; margin-bottom: 2px; align-items: center; color: #a78bfa;">
          <!-- Telescope SVG -->
          <svg class="header-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(167, 139, 250, 0.45));">
            <path d="M10 8l9-5 1.5 2.5-9 5z"/>
            <path d="M11.5 10.5l-2 1.2-2-.6-.8-1.5.5-2 2-1.2"/>
            <path d="M8 12l-4 7"/>
            <path d="M12 12l4 7"/>
            <path d="M10 12v7"/>
          </svg>
          <!-- Astrolabe/Sextant SVG -->
          <svg class="header-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(167, 139, 250, 0.45));">
            <circle cx="12" cy="12" r="10" stroke-dasharray="3,3"/>
            <path d="M12 2v20M2 12h20"/>
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 12l6-6"/>
            <path d="M12 12l-5 5"/>
          </svg>
          <!-- Sparkle/Star SVG -->
          <svg class="header-icon animate-pulse" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="1" style="color: #38bdf8;">
            <path d="M12 3l2.5 6.5 6.5 2.5-6.5 2.5-2.5 6.5-2.5-6.5-6.5-2.5 6.5-2.5z"/>
          </svg>
        </div>
        <h1 class="fancy-title">Angles of Ancient Astronomers</h1>
        <p>solve the puzzles of the universe with ancient astronomers</p>
        <div style="width: 100%; height: 1.5px; background: linear-gradient(90deg, transparent 0%, rgba(167, 139, 250, 0.4) 30%, rgba(56, 189, 248, 0.4) 70%, transparent 100%); margin-top: 4px;"></div>
      </div>
    `;
    sidebar.appendChild(header);

    const listContainer = document.createElement('div');
    listContainer.className = 'level-list';
    sidebar.appendChild(listContainer);

    this.levels.forEach(level => {
      if (level.id === 0) return; // Hide Overview Screen button from the level list
      
      const btn = document.createElement('button');
      btn.className = `level-btn ${this.selectedLevelId === level.id ? 'active' : ''}`;
      btn.dataset.levelId = level.id;
      
      // others unlocked programmatically in gameState
      const isUnlocked = gameState.unlockedLevels.includes(level.id);
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
        btns.forEach((b) => {
          if (parseInt(b.dataset.levelId) === level.id) b.classList.add('active');
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
      // If returning to the hub, default to no level selected (Overview screen)
      this.selectedLevelId = 0;

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


