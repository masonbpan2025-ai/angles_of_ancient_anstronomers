import { gameState } from '../core/GameState.js';

export class LevelUI {
  constructor(uiLayer) {
    this.container = document.createElement('div');
    this.container.className = 'level-ui';
    uiLayer.appendChild(this.container);

    this.calendarVerified = {
      babylonian: false,
      chinese: false,
      julian: false,
      modern: false
    };

    gameState.subscribe((state) => {
      if (state.activeLevel === 1) {
        this.renderLevel1();
        this.show();
      } else if (state.activeLevel === 2) {
        this.renderLevel2();
        this.show();
      } else if (state.activeLevel === 3) {
        this.renderLevel3();
        this.show();
      } else {
        this.hide();
      }
    });
  }

  renderLevel1() {
    const tabData = {
      babylonian: {
        title: "Babylonian Calendar",
        desc: "The Babylonian calendar was lunisolar, meaning months were defined by the Moon's phase (~29.53 days) while the year was kept in sync with the Sun's seasons (~365.24 days). Because 12 lunar months are ~11 days shorter than a solar year, they added an extra intercalary month (Adaru or Elulu) 7 times within a 19-year cycle (the Metonic Cycle) to prevent seasonal drift.",
        question: "A Metonic cycle contains 19 solar years and 235 lunar months. If a regular year has 12 lunar months, how many intercalary months must be added to align the calendar over a full 19-year cycle?",
        placeholder: "e.g. 7",
        answer: 7
      },
      chinese: {
        title: "Traditional Chinese Calendar",
        desc: "The traditional Chinese calendar divides the solar year into 24 solar terms (Jieqi), starting with the spring equinox. It integrates lunar months beginning on the day of the new moon. To align the lunar cycles with solar years, a leap month (Runyue) is inserted roughly every 3 years. This alignment follows the same 19-year cycle math.",
        question: "Using the Metonic alignment of 19 solar years (235 lunar months), how many years out of the 19 years will contain a leap month (Runyue)?",
        placeholder: "e.g. 7",
        answer: 7
      },
      julian: {
        title: "Julian Calendar Drift",
        desc: "Proposed by Julius Caesar in 46 BC, the Julian calendar was a solar calendar defining the year as 365.25 days, adding a leap day every 4 years. However, the true solar year is ~365.2422 days, meaning the Julian year was too long by ~11.25 minutes. Over centuries, this causes the solar date of the equinox to shift earlier.",
        question: "If the Julian calendar year drifts by 11.25 minutes (0.1875 hours) per year, how many years will it take for the calendar to drift backward by exactly 1 full day (24 hours) relative to the sun?",
        placeholder: "e.g. 128",
        answer: 128
      },
      modern: {
        title: "Modern Gregorian Rule",
        desc: "The Gregorian calendar, introduced in 1582, corrected the Julian drift by skipping leap days in centurial years that are not divisible by 400 (e.g. 1700, 1800, 1900 were not leap years, but 2000 was). This yields an average year of 365.2425 days, reducing the drift to just 1 day every 3,200 years.",
        question: "In the modern Gregorian system, how many leap years occur in a span of 400 years?",
        placeholder: "e.g. 97",
        answer: 97
      }
    };

    let activeTab = 'babylonian';

    this.container.innerHTML = `
      <div class="absolute top-10 left-10 w-[440px] max-h-[calc(100%-80px)] overflow-y-auto bg-white/95 backdrop-blur-md border border-slate-200/80 p-6 rounded-2xl shadow-xl pointer-events-auto flex flex-col gap-5 text-slate-800" style="z-index: 100;">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">Calendar Systems</h2>
          <button class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs border border-slate-200 transition" id="exit-btn">Exit to Orbit</button>
        </div>
        
        <!-- Tabs Header -->
        <div class="flex border-b border-slate-200 gap-1 pb-1">
          <button id="tab-babylonian" class="tab-btn px-2.5 py-1.5 text-xs font-semibold rounded-lg transition font-medium" style="background: rgb(59, 130, 246); color: white;">Babylonian</button>
          <button id="tab-chinese" class="tab-btn px-2.5 py-1.5 text-xs font-semibold rounded-lg transition font-medium" style="background: transparent; color: rgb(71, 85, 105);">Chinese</button>
          <button id="tab-julian" class="tab-btn px-2.5 py-1.5 text-xs font-semibold rounded-lg transition font-medium" style="background: transparent; color: rgb(71, 85, 105);">Julian</button>
          <button id="tab-modern" class="tab-btn px-2.5 py-1.5 text-xs font-semibold rounded-lg transition font-medium" style="background: transparent; color: rgb(71, 85, 105);">Modern</button>
        </div>

        <!-- Tab Contents Card -->
        <div class="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-3">
          <h3 id="tab-title" class="text-xs font-bold text-slate-800 uppercase tracking-wider">Babylonian Calendar</h3>
          <p id="tab-desc" class="text-[11px] leading-relaxed text-slate-500">...</p>
          
          <div class="border-t border-slate-100 pt-3 flex flex-col gap-2">
            <span class="text-[11px] font-semibold text-slate-700" id="tab-question">...</span>
            <div class="flex gap-2">
              <input type="number" id="calc-input" class="flex-1 bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-lg outline-none focus:border-blue-500 transition" placeholder="e.g. 7">
              <button id="verify-tab-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition">Verify</button>
            </div>
            <div id="tab-feedback" class="text-[11px] font-semibold hidden"></div>
          </div>
        </div>

        <!-- Legend -->
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-3 flex wrap gap-2 items-center justify-around text-[10px]">
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-yellow-400"></span>
            <span class="font-medium text-slate-600">Sun Path</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            <span class="font-medium text-slate-600">Moon Path</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-gray-400"></span>
            <span class="font-medium text-slate-600">Equator</span>
          </div>
        </div>

        <!-- Dashboard 2x2 Grid -->
        <div class="grid grid-cols-2 gap-2.5">
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col">
            <span class="text-[9px] uppercase font-bold tracking-wider text-slate-400">Day of Year</span>
            <span id="dash-day" class="text-sm font-bold text-slate-800 mt-0.5">172.0</span>
          </div>
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col">
            <span class="text-[9px] uppercase font-bold tracking-wider text-slate-400">Sun Peak Alt</span>
            <span id="dash-sun-alt" class="text-sm font-bold text-slate-800 mt-0.5">72.4°</span>
          </div>
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col">
            <span class="text-[9px] uppercase font-bold tracking-wider text-slate-400">Moon Peak Alt</span>
            <span id="dash-moon-alt" class="text-sm font-bold text-slate-800 mt-0.5">40.1°</span>
          </div>
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col">
            <span class="text-[9px] uppercase font-bold tracking-wider text-slate-400">Moon Boundary</span>
            <span id="dash-moon-path" class="text-[11px] font-bold text-slate-600 mt-0.5">Within boundaries</span>
          </div>
        </div>

        <!-- Sliders -->
        <div class="flex flex-col gap-3.5">
          <div class="flex flex-col gap-1">
            <div class="flex justify-between text-[11px] font-bold text-slate-600">
              <span>Day of Year:</span>
              <span id="slider-day-val" class="text-blue-600">172.0</span>
            </div>
            <input type="range" id="slider-day" min="0" max="365" step="0.1" value="172" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
          </div>

          <div class="flex flex-col gap-1">
            <div class="flex justify-between text-[11px] font-bold text-slate-600">
              <span>Time of Day (Hours):</span>
              <span id="slider-time-val" class="text-blue-600">12.0</span>
            </div>
            <input type="range" id="slider-time" min="0" max="24" step="0.1" value="12" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
          </div>

          <div class="flex flex-col gap-1">
            <div class="flex justify-between text-[11px] font-bold text-slate-600">
              <span>Latitude:</span>
              <span id="slider-lat-val" class="text-blue-600">41°</span>
            </div>
            <input type="range" id="slider-lat" min="0" max="90" step="1" value="41" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
          </div>
        </div>

        <!-- Sub-tasks Checklist -->
        <div class="border-t border-slate-100 pt-3.5 flex flex-col gap-1.5">
          <span class="text-[9px] uppercase font-bold tracking-wider text-slate-400">Calendar Sub-tasks:</span>
          <div id="check-babylonian" class="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium transition">
            <span class="status-check-tw text-red-500">❌</span>
            <span>Babylonian Metonic Cycle Verified</span>
          </div>
          <div id="check-chinese" class="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium transition">
            <span class="status-check-tw text-red-500">❌</span>
            <span>Chinese Runyue Cycle Verified</span>
          </div>
          <div id="check-julian" class="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium transition">
            <span class="status-check-tw text-red-500">❌</span>
            <span>Julian Drift Calculation Verified</span>
          </div>
          <div id="check-modern" class="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium transition">
            <span class="status-check-tw text-red-500">❌</span>
            <span>Modern Gregorian Leap Rule Verified</span>
          </div>
        </div>

        <!-- Final Unlock Button -->
        <button id="final-submit-btn" disabled class="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold transition cursor-not-allowed text-xs border border-slate-200">Verify & Unlock Next Level</button>
      </div>
    `;

    // Exit button
    document.getElementById('exit-btn').addEventListener('click', () => {
      gameState.activeLevel = null;
      gameState.notify();
    });

    const tabTitle = document.getElementById('tab-title');
    const tabDesc = document.getElementById('tab-desc');
    const tabQuestion = document.getElementById('tab-question');
    const calcInput = document.getElementById('calc-input');
    const verifyTabBtn = document.getElementById('verify-tab-btn');
    const tabFeedback = document.getElementById('tab-feedback');
    const finalSubmitBtn = document.getElementById('final-submit-btn');

    // UI updating functions
    const updateTabContent = () => {
      const data = tabData[activeTab];
      tabTitle.textContent = data.title;
      tabDesc.textContent = data.desc;
      tabQuestion.textContent = data.question;
      calcInput.placeholder = data.placeholder;
      calcInput.value = '';
      tabFeedback.classList.add('hidden');
      
      // Update tab buttons visual
      document.querySelectorAll('.tab-btn').forEach(btn => {
        const tabId = btn.id.replace('tab-', '');
        if (tabId === activeTab) {
          btn.style.background = 'rgb(59, 130, 246)';
          btn.style.color = 'white';
        } else {
          btn.style.background = 'transparent';
          btn.style.color = 'rgb(71, 85, 105)';
        }
      });
    };

    const updateChecklist = () => {
      let allVerified = true;
      Object.keys(this.calendarVerified).forEach(key => {
        const itemEl = document.getElementById(`check-${key}`);
        const iconEl = itemEl.querySelector('.status-check-tw');
        if (this.calendarVerified[key]) {
          iconEl.textContent = '✅';
          itemEl.classList.remove('text-slate-400');
          itemEl.classList.add('text-green-600');
        } else {
          iconEl.textContent = '❌';
          itemEl.classList.remove('text-green-600');
          itemEl.classList.add('text-slate-400');
          allVerified = false;
        }
      });

      if (allVerified) {
        finalSubmitBtn.disabled = false;
        finalSubmitBtn.style.background = 'rgb(34, 197, 94)'; // green-500
        finalSubmitBtn.style.color = 'white';
        finalSubmitBtn.style.cursor = 'pointer';
        finalSubmitBtn.classList.remove('bg-slate-100', 'text-slate-400', 'cursor-not-allowed');
        finalSubmitBtn.classList.add('hover:bg-green-600');
      } else {
        finalSubmitBtn.disabled = true;
        finalSubmitBtn.style.background = 'rgb(241, 245, 249)'; // slate-100
        finalSubmitBtn.style.color = 'rgb(148, 163, 184)';
        finalSubmitBtn.style.cursor = 'not-allowed';
      }
    };

    // Tab buttons event listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeTab = e.target.id.replace('tab-', '');
        updateTabContent();
      });
    });

    // Verify button event listener
    verifyTabBtn.addEventListener('click', () => {
      const val = parseInt(calcInput.value, 10);
      const data = tabData[activeTab];
      tabFeedback.classList.remove('hidden');
      if (val === data.answer) {
        tabFeedback.textContent = "Correct!";
        tabFeedback.className = "text-[11px] font-semibold text-green-600 mt-1";
        this.calendarVerified[activeTab] = true;
        updateChecklist();
      } else {
        tabFeedback.textContent = "Incorrect. Try again!";
        tabFeedback.className = "text-[11px] font-semibold text-red-500 mt-1";
      }
    });

    // Final unlock event listener
    finalSubmitBtn.addEventListener('click', () => {
      gameState.completeLevel(1);
    });

    // Initialize tab content & checklist
    updateTabContent();
    updateChecklist();

    // Bind slider listeners
    const sliderDay = document.getElementById('slider-day');
    const valDay = document.getElementById('slider-day-val');
    const sliderTime = document.getElementById('slider-time');
    const valTime = document.getElementById('slider-time-val');
    const sliderLat = document.getElementById('slider-lat');
    const valLat = document.getElementById('slider-lat-val');

    const dashDay = document.getElementById('dash-day');
    const dashSunAlt = document.getElementById('dash-sun-alt');
    const dashMoonAlt = document.getElementById('dash-moon-alt');
    const dashMoonPath = document.getElementById('dash-moon-path');

    const updateDashboard = () => {
      const day = parseFloat(sliderDay.value);
      const time = parseFloat(sliderTime.value);
      const lat = parseFloat(sliderLat.value);

      valDay.textContent = day.toFixed(1);
      valTime.textContent = time.toFixed(1);
      valLat.textContent = lat + '°';

      dashDay.textContent = day.toFixed(1);

      // Trigger Three.js updates if instance exists
      if (window.activeLevelInstance && typeof window.activeLevelInstance.updateParameters === 'function') {
        window.activeLevelInstance.updateParameters(day, time, lat);
        
        // Retrieve calculated variables from active instance
        const inst = window.activeLevelInstance;
        dashSunAlt.textContent = inst.sunPeakAlt.toFixed(1) + '°';
        dashMoonAlt.textContent = inst.moonPeakAlt.toFixed(1) + '°';
        dashMoonPath.textContent = inst.moonPathStatus;
        if (inst.moonPathStatus === "Higher than Summer Sun") {
          dashMoonPath.className = "text-[11px] font-bold text-red-500 mt-0.5";
        } else if (inst.moonPathStatus === "Lower than Winter Sun") {
          dashMoonPath.className = "text-[11px] font-bold text-blue-500 mt-0.5";
        } else {
          dashMoonPath.className = "text-[11px] font-bold text-slate-600 mt-0.5";
        }
      }
    };

    sliderDay.addEventListener('input', updateDashboard);
    sliderTime.addEventListener('input', updateDashboard);
    sliderLat.addEventListener('input', updateDashboard);

    // Initial trigger
    setTimeout(updateDashboard, 50);
  }

  renderLevel2() {
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

  renderLevel3() {
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
