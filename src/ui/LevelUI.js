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

    this.inclinationVerified = {
      inclination: false,
      lunar: false,
      solar: false
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
      <!-- Left sidebar card -->
      <div class="absolute top-6 left-6 w-[420px] max-h-[calc(100%-48px)] overflow-y-auto bg-white/95 backdrop-blur-md border border-slate-200/80 p-5 rounded-2xl shadow-xl pointer-events-auto flex flex-col gap-4 text-slate-800" style="z-index: 100;">
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

      <!-- Right parameter panel (horizontal, placed bottom-right below the canvas) -->
      <div class="absolute bottom-6 right-6 left-[460px] bg-white/95 backdrop-blur-md border border-slate-200/80 p-4 rounded-2xl shadow-xl pointer-events-auto flex flex-col gap-3 text-slate-800" style="z-index: 100;">
        <div class="flex gap-4">
          <!-- Column 1: Legend & Dashboard (w-32%) -->
          <div class="w-[32%] flex flex-col gap-2">
            <!-- Legend -->
            <div class="bg-slate-50 border border-slate-100 rounded-xl p-2 flex justify-around items-center text-[10px] gap-1.5">
              <div class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span class="font-medium text-slate-600">Sun Path</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full border border-slate-300" style="background: linear-gradient(90deg, #ffffff 50%, #1e293b 50%);"></span>
                <span class="font-medium text-slate-600">Moon Path</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span class="font-medium text-slate-600">Equator</span>
              </div>
            </div>

            <!-- Dashboard 2x2 Grid -->
            <div class="grid grid-cols-2 gap-1.5">
              <div class="bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex flex-col justify-center">
                <span class="text-[8px] uppercase font-bold tracking-wider text-slate-400">Day of Year</span>
                <span id="dash-day" class="text-xs font-bold text-slate-800 mt-0.5">172.0</span>
              </div>
              <div class="bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex flex-col justify-center">
                <span class="text-[8px] uppercase font-bold tracking-wider text-slate-400">Sun Peak Alt</span>
                <span id="dash-sun-alt" class="text-xs font-bold text-slate-800 mt-0.5">72.4°</span>
              </div>
              <div class="bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex flex-col justify-center">
                <span class="text-[8px] uppercase font-bold tracking-wider text-slate-400">Moon Peak Alt</span>
                <span id="dash-moon-alt" class="text-xs font-bold text-slate-800 mt-0.5">40.1°</span>
              </div>
              <div class="bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex flex-col justify-center">
                <span class="text-[8px] uppercase font-bold tracking-wider text-slate-400">Moon Boundary</span>
                <span id="dash-moon-path" class="text-[10px] font-bold text-slate-600 mt-0.5 truncate">Within boundaries</span>
              </div>
            </div>
          </div>

          <!-- Column 2: Sliders (w-46%) -->
          <div class="w-[46%] flex flex-col justify-between py-0.5 gap-2">
            <div class="flex flex-col gap-0.5">
              <div class="flex justify-between text-[10px] font-bold text-slate-600">
                <span>Day of Year:</span>
                <span id="slider-day-val" class="text-blue-600">172.0</span>
              </div>
              <input type="range" id="slider-day" min="0" max="365" step="0.1" value="172" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
            </div>

            <div class="flex flex-col gap-0.5">
              <div class="flex justify-between text-[10px] font-bold text-slate-600">
                <span>Time of Day (Hours):</span>
                <span id="slider-time-val" class="text-blue-600">12.0</span>
              </div>
              <input type="range" id="slider-time" min="0" max="24" step="0.1" value="12" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
            </div>

            <div class="flex flex-col gap-0.5">
              <div class="flex justify-between text-[10px] font-bold text-slate-600">
                <span>Latitude:</span>
                <span id="slider-lat-val" class="text-blue-600">30°</span>
              </div>
              <input type="range" id="slider-lat" min="0" max="90" step="1" value="30" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
            </div>
          </div>

          <!-- Column 3: Play Controls (w-22%) -->
          <div class="w-[22%] border-l border-slate-200/60 pl-4 flex flex-col justify-between py-1 gap-2">
            <!-- Play/Pause Button -->
            <button id="play-btn" class="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]">
              <span id="play-icon">▶</span>
              <span id="play-text">Play</span>
            </button>

            <!-- Play Speed Slider -->
            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-[9px] font-bold text-slate-500">
                <span>Play Speed:</span>
                <span id="speed-val" class="text-blue-600 font-semibold">15.0x</span>
              </div>
              <input type="range" id="slider-speed" min="0.1" max="30.0" step="0.1" value="15.0" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
            </div>
          </div>
        </div>
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

    // Play controls DOM elements
    const playBtn = document.getElementById('play-btn');
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');
    const sliderSpeed = document.getElementById('slider-speed');
    const valSpeed = document.getElementById('speed-val');

    this.updateDashboard = (fromPlay = false) => {
      let day, time, lat;
      const inst = window.activeLevelInstance;

      if (fromPlay && inst) {
        day = inst.day;
        time = inst.time;
        lat = inst.latitude;
        
        sliderDay.value = day;
        sliderTime.value = time;
      } else {
        day = parseFloat(sliderDay.value);
        time = parseFloat(sliderTime.value);
        lat = parseFloat(sliderLat.value);
      }

      valDay.textContent = day.toFixed(1);
      valTime.textContent = time.toFixed(1);
      valLat.textContent = lat + '°';

      dashDay.textContent = day.toFixed(1);

      if (inst && typeof inst.updateParameters === 'function') {
        if (!fromPlay) {
          inst.updateParameters(day, time, lat);
        }
        
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

    sliderDay.addEventListener('input', () => this.updateDashboard(false));
    sliderTime.addEventListener('input', () => this.updateDashboard(false));
    sliderLat.addEventListener('input', () => this.updateDashboard(false));

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const inst = window.activeLevelInstance;
        if (inst) {
          inst.isPlaying = !inst.isPlaying;
          if (inst.isPlaying) {
            playBtn.className = "w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]";
            playIcon.textContent = "❚❚";
            playText.textContent = "Pause";
          } else {
            playBtn.className = "w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]";
            playIcon.textContent = "▶";
            playText.textContent = "Play";
          }
        }
      });
    }

    if (sliderSpeed) {
      sliderSpeed.addEventListener('input', () => {
        const speed = parseFloat(sliderSpeed.value);
        valSpeed.textContent = speed.toFixed(1) + 'x';
        const inst = window.activeLevelInstance;
        if (inst) {
          inst.playSpeed = speed;
        }
      });
    }

    // Initial trigger
    setTimeout(() => this.updateDashboard(false), 50);
  }

  renderLevel2() {
    const tabData = {
      inclination: {
        title: "1. Lunar Inclination",
        desc: "Ancient Greek astronomers realized that eclipses are caused by shadows (the Earth's shadow on the Moon during a lunar eclipse, and the Moon's shadow on the Earth during a solar eclipse). However, this raised a fundamental question: if the Moon orbits the Earth every single month, why isn't there an eclipse every month? They realized that the Moon's orbital plane is slightly tilted (inclined) relative to the Earth's orbital plane (the ecliptic). Eclipses can only occur when both the Sun and Moon are near the points where their orbits intersect—the nodes. Ptolemy measured this inclination angle (β) at Alexandria during a solstice meridian transit.",
        question: "Calculate Ptolemy's lunar inclination angle β (in degrees) by subtracting the obliquity of the ecliptic (ε = 23;51° ≈ 23.85°) from the Moon's peak declination (δ = 28;50,30° ≈ 28.85°): β = δ - ε. Round to the nearest degree.",
        placeholder: "e.g. 5.0",
        answer: 5.0
      },
      lunar: {
        title: "2. Lunar Eclipse Alignment",
        desc: "A lunar eclipse occurs when the Earth passes directly between the Sun and the Moon, casting its shadow (umbra) onto the lunar surface. This only happens during a full moon when the Moon is aligned close to one of the orbital nodes. Ancient civilizations, such as the Babylonians, predicted lunar eclipses using the Saros cycle—a period of approximately 18 years, 11 days, and 8 hours after which eclipses repeat with very similar geometry. Globally, there are at least two lunar eclipses every year.",
        question: "To verify, adjust the celestial sliders at the bottom: Sun to one node (e.g. 90° or 270°) and Moon to the opposite node (opposition, e.g. 270° or 90°). Then click Verify Alignment.",
        placeholder: "",
        answer: null
      },
      solar: {
        title: "3. Solar Eclipse Alignment",
        desc: "A solar eclipse occurs when the Moon passes directly between the Sun and the Earth, blocking the Sun's light. Total solar eclipses are rare at any specific location because the Moon's shadow cone (umbra) is very narrow on Earth's surface. Ancient civilizations predicted them using the Saros cycle and meticulous astronomical tables. They happen 2 to 5 times a year globally, but are seen only as partial eclipses for most of the path.",
        question: "To verify, adjust the celestial sliders at the bottom: Sun and Moon aligned at the same node (conjunction, e.g. both at 90° or both at 270°). Then click Verify Alignment.",
        placeholder: "",
        answer: null
      }
    };

    let activeTab = 'inclination';

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
      <div class="level-panel" style="width: 380px; max-height: calc(100% - 60px); bottom: 20px; left: 20px;">
        <div class="flex justify-between items-center">
          <h2 class="text-base font-bold text-cyan-400">Eclipse & Lunar Inclination</h2>
          <button class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2 py-1 rounded text-[10px] border border-slate-700 transition" id="exit-btn">Exit to Orbit</button>
        </div>
        
        <!-- Tabs Header -->
        <div class="flex border-b border-slate-800 gap-1 pb-1 mt-1">
          <button id="tab-inclination" class="tab-btn px-2 py-1 text-[10px] font-semibold rounded transition font-medium" style="background: rgb(6, 182, 212); color: black;">Inclination</button>
          <button id="tab-lunar" class="tab-btn px-2 py-1 text-[10px] font-semibold rounded transition font-medium" style="background: transparent; color: rgb(148, 163, 184);">Lunar Eclipse</button>
          <button id="tab-solar" class="tab-btn px-2 py-1 text-[10px] font-semibold rounded transition font-medium" style="background: transparent; color: rgb(148, 163, 184);">Solar Eclipse</button>
        </div>

        <!-- Tab Contents Card -->
        <div class="bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-2">
          <h3 id="tab-title" class="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Lunar Inclination</h3>
          <p id="tab-desc" class="text-[11px] leading-relaxed text-slate-300">...</p>
          
          <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1.5">
            <span class="text-[11px] font-semibold text-slate-300" id="tab-question">...</span>
            <div class="flex gap-2" id="input-area">
              <!-- Dynamically updated -->
            </div>
            <div id="tab-feedback" class="text-[11px] font-semibold hidden"></div>
          </div>
        </div>

        <!-- Sub-tasks Checklist -->
        <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1">
          <span class="text-[9px] uppercase font-bold tracking-wider text-slate-500">Sub-tasks:</span>
          <div id="check-inclination" class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium transition">
            <span class="status-check text-red-500">❌</span>
            <span>Inclination Angle β Verified</span>
          </div>
          <div id="check-lunar" class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium transition">
            <span class="status-check text-red-500">❌</span>
            <span>Lunar Eclipse Alignment Verified</span>
          </div>
          <div id="check-solar" class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium transition">
            <span class="status-check text-red-500">❌</span>
            <span>Solar Eclipse Alignment Verified</span>
          </div>
        </div>

        <!-- Sliders & Toggles (always visible) -->
        <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-2 text-slate-200">
          <span class="text-[9px] uppercase font-bold tracking-wider text-slate-500">Interactive Model Parameters:</span>
          
          <div class="flex flex-col gap-0.5">
            <div class="flex justify-between text-[10px] text-slate-400">
              <span>Moon Position (Longitude):</span>
              <span id="moon-long-val" class="text-cyan-400 font-semibold">90°</span>
            </div>
            <input type="range" id="moon-long-slider" min="-90" max="270" step="1" value="90" class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400">
          </div>

          <div class="flex flex-col gap-0.5">
            <div class="flex justify-between text-[10px] text-slate-400">
              <span>Sun Position (Longitude):</span>
              <span id="sun-long-val" class="text-cyan-400 font-semibold">90°</span>
            </div>
            <input type="range" id="sun-long-slider" min="0" max="360" step="1" value="90" class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400">
          </div>

          <div class="flex flex-col gap-0.5">
            <div class="flex justify-between text-[10px] text-slate-400">
              <span>Earth Self-Rotation:</span>
              <span id="earth-rot-val" class="text-cyan-400 font-semibold">0° (12:00 PM Noon)</span>
            </div>
            <input type="range" id="earth-rot-slider" min="0" max="360" step="1" value="0" class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400">
          </div>

          <div class="flex flex-col gap-0.5">
            <div class="flex justify-between text-[10px] text-slate-400">
              <span>Orbit Inclination (β):</span>
              <span id="moon-inc-val" class="text-cyan-400 font-semibold">5.0°</span>
            </div>
            <input type="range" id="moon-inc-slider" min="0" max="10" step="0.1" value="5.0" class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400">
          </div>

          <div class="flex justify-between items-center text-[10px] text-slate-400 mt-0.5">
            <span>Reference Frame:</span>
            <div class="flex gap-1 bg-slate-950 p-0.5 border border-slate-800 rounded-lg">
              <button id="ref-rotate-earth-btn" class="px-2 py-0.5 text-[9px] rounded bg-cyan-400 text-slate-950 font-bold transition">Rotate Earth</button>
              <button id="ref-fixed-horizon-btn" class="px-2 py-0.5 text-[9px] rounded bg-transparent text-slate-400 transition font-medium">Fixed Horizon</button>
            </div>
          </div>
        </div>

        <!-- Final Unlock Button -->
        <button id="final-submit-btn" disabled class="w-full py-2 rounded-xl bg-slate-800 text-slate-500 font-bold transition cursor-not-allowed text-xs border border-slate-700 mt-1">Verify & Unlock Next Level</button>
      </div>
    `;

    document.getElementById('exit-btn').addEventListener('click', () => {
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
        rotateEarthBtn.className = "px-2 py-0.5 text-[9px] rounded bg-cyan-400 text-slate-950 font-bold transition";
        fixedHorizonBtn.className = "px-2 py-0.5 text-[9px] rounded bg-transparent text-slate-400 transition font-medium";
      } else {
        rotateEarthBtn.className = "px-2 py-0.5 text-[9px] rounded bg-transparent text-slate-400 transition font-medium";
        fixedHorizonBtn.className = "px-2 py-0.5 text-[9px] rounded bg-cyan-400 text-slate-950 font-bold transition";
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
      
      const norm = (deg) => (deg % 360 + 360) % 360;
      const sNorm = norm(sunVal);
      const mNorm = norm(moonVal);

      // Solar Eclipse: Conjunction at nodes (90 or 270)
      const isSolarNode = Math.abs(sNorm - 90) < 4 || Math.abs(sNorm - 270) < 4;
      const diff = Math.abs(sNorm - mNorm);
      const isSolarAligned = diff < 4 || diff > 356;

      // Lunar Eclipse: Opposition at nodes (90 and 270)
      const isLunarNode = (Math.abs(sNorm - 90) < 4 && Math.abs(mNorm - 270) < 4) || 
                          (Math.abs(sNorm - 270) < 4 && Math.abs(mNorm - 90) < 4);

      if (isLunarNode) {
        this.inclinationVerified.lunar = true;
        updateChecklist();
      }
      if (isSolarNode && isSolarAligned) {
        this.inclinationVerified.solar = true;
        updateChecklist();
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

    const tabTitle = document.getElementById('tab-title');
    const tabDesc = document.getElementById('tab-desc');
    const tabQuestion = document.getElementById('tab-question');
    const inputArea = document.getElementById('input-area');
    const tabFeedback = document.getElementById('tab-feedback');
    const finalSubmitBtn = document.getElementById('final-submit-btn');

    const updateChecklist = () => {
      let allVerified = true;
      Object.keys(this.inclinationVerified).forEach(key => {
        const itemEl = document.getElementById(`check-${key}`);
        if (!itemEl) return;
        const iconEl = itemEl.querySelector('.status-check');
        if (this.inclinationVerified[key]) {
          iconEl.textContent = '✅';
          itemEl.classList.remove('text-slate-500');
          itemEl.classList.add('text-green-500');
        } else {
          iconEl.textContent = '❌';
          itemEl.classList.remove('text-green-500');
          itemEl.classList.add('text-slate-500');
          allVerified = false;
        }
      });

      if (finalSubmitBtn) {
        if (allVerified) {
          finalSubmitBtn.disabled = false;
          finalSubmitBtn.style.background = 'rgb(34, 197, 94)'; // green-500
          finalSubmitBtn.style.color = 'white';
          finalSubmitBtn.style.cursor = 'pointer';
          finalSubmitBtn.classList.remove('bg-slate-800', 'text-slate-500', 'cursor-not-allowed');
          finalSubmitBtn.classList.add('hover:bg-green-600');
        } else {
          finalSubmitBtn.disabled = true;
          finalSubmitBtn.style.background = 'rgb(30, 41, 59)'; // slate-800
          finalSubmitBtn.style.color = 'rgb(100, 116, 139)';
          finalSubmitBtn.style.cursor = 'not-allowed';
          finalSubmitBtn.classList.remove('hover:bg-green-600');
        }
      }
    };

    const updateTabContent = () => {
      const data = tabData[activeTab];
      tabTitle.textContent = data.title;
      tabDesc.textContent = data.desc;
      tabQuestion.textContent = data.question;
      tabFeedback.classList.add('hidden');

      if (activeTab === 'inclination') {
        inputArea.innerHTML = `
          <input type="number" id="calc-input" class="flex-1 bg-slate-900 border border-slate-800 text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-cyan-500 transition" placeholder="e.g. 5.0" step="0.1">
          <button id="verify-tab-btn" class="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-4 py-2 rounded-lg text-xs transition">Verify</button>
        `;
        const verifyBtn = document.getElementById('verify-tab-btn');
        const calcInput = document.getElementById('calc-input');
        if (this.inclinationVerified.inclination) {
          calcInput.value = '5.0';
          tabFeedback.textContent = "Correct! Ptolemy measured β to be ~5° (specifically 4;59,30°).";
          tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
          tabFeedback.classList.remove('hidden');
        }
        verifyBtn.addEventListener('click', () => {
          const val = parseFloat(calcInput.value);
          tabFeedback.classList.remove('hidden');
          if (Math.abs(val - 5.0) < 0.15) {
            tabFeedback.textContent = "Correct! Ptolemy measured β to be ~5° (specifically 4;59,30°).";
            tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
            this.inclinationVerified.inclination = true;
            updateChecklist();
          } else {
            tabFeedback.textContent = "Incorrect. Subtract: (30;58° - 2;7,30°) - 23;51° = 4;59,30° ≈ 5°.";
            tabFeedback.className = "text-[11px] font-semibold text-red-500 mt-1";
          }
        });
      } else {
        inputArea.innerHTML = `
          <button id="verify-alignment-btn" class="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 rounded-lg text-xs transition">Verify Alignment</button>
        `;
        const verifyAlignmentBtn = document.getElementById('verify-alignment-btn');
        if (this.inclinationVerified[activeTab]) {
          tabFeedback.textContent = activeTab === 'lunar' ? "Correct! Lunar eclipse alignment achieved." : "Correct! Solar eclipse alignment achieved.";
          tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
          tabFeedback.classList.remove('hidden');
        }
        verifyAlignmentBtn.addEventListener('click', () => {
          tabFeedback.classList.remove('hidden');
          const sunVal = parseFloat(sunSlider.value);
          const moonVal = parseFloat(longSlider.value);
          
          const norm = (deg) => (deg % 360 + 360) % 360;
          const sNorm = norm(sunVal);
          const mNorm = norm(moonVal);

          if (activeTab === 'lunar') {
            const isLunarNode = (Math.abs(sNorm - 90) < 4 && Math.abs(mNorm - 270) < 4) || 
                                (Math.abs(sNorm - 270) < 4 && Math.abs(mNorm - 90) < 4);
            if (isLunarNode) {
              tabFeedback.textContent = "Correct! Lunar eclipse alignment achieved.";
              tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
              this.inclinationVerified.lunar = true;
              updateChecklist();
            } else {
              tabFeedback.textContent = "Incorrect. Adjust the Sun and Moon to opposite nodes (one at 90°, the other at 270°) to align the Earth's shadow.";
              tabFeedback.className = "text-[11px] font-semibold text-red-500 mt-1";
            }
          } else {
            const isSolarNode = Math.abs(sNorm - 90) < 4 || Math.abs(sNorm - 270) < 4;
            const diff = Math.abs(sNorm - mNorm);
            const isSolarAligned = diff < 4 || diff > 356;
            if (isSolarNode && isSolarAligned) {
              tabFeedback.textContent = "Correct! Solar eclipse alignment achieved.";
              tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
              this.inclinationVerified.solar = true;
              updateChecklist();
            } else {
              tabFeedback.textContent = "Incorrect. Adjust both Sun and Moon to the same node (both at 90° or both at 270°) to align the Moon's shadow.";
              tabFeedback.className = "text-[11px] font-semibold text-red-500 mt-1";
            }
          }
        });
      }

      document.querySelectorAll('.tab-btn').forEach(btn => {
        const tabId = btn.id.replace('tab-', '');
        if (tabId === activeTab) {
          btn.style.background = 'rgb(6, 182, 212)';
          btn.style.color = 'black';
        } else {
          btn.style.background = 'transparent';
          btn.style.color = 'rgb(148, 163, 184)';
        }
      });
    };

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeTab = e.target.id.replace('tab-', '');
        updateTabContent();
      });
    });

    finalSubmitBtn.addEventListener('click', () => {
      gameState.completeLevel(2);
    });

    updateTabContent();
    updateChecklist();
    checkEclipseAlignment();
  }

  renderLevel3() {
    this.container.innerHTML = `
      <div class="level-panel">
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
          gameState.completeLevel(3);
        }, 2000);
      } else {
        feedback.textContent = "Incorrect. Remember: (360 / 7.2) * 800 = 50 * 800.";
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

    // Bind active level callbacks if they exist
    if (gameState.activeLevel === 1 && window.activeLevelInstance) {
      const inst = window.activeLevelInstance;
      const sliderDay = document.getElementById('slider-day');
      const sliderTime = document.getElementById('slider-time');
      const playBtn = document.getElementById('play-btn');
      const playIcon = document.getElementById('play-icon');
      const playText = document.getElementById('play-text');
      const sliderSpeed = document.getElementById('slider-speed');
      const valSpeed = document.getElementById('speed-val');
      
      inst.onTimeUpdate = (day, time) => {
        if (sliderDay && sliderTime) {
          sliderDay.value = day;
          sliderTime.value = time;
          if (this.updateDashboard) {
            this.updateDashboard(true);
          }
        }
      };
      
      // Update play button & speed state in UI from instance state
      if (playBtn && playIcon && playText) {
        if (inst.isPlaying) {
          playBtn.className = "w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]";
          playIcon.textContent = "❚❚";
          playText.textContent = "Pause";
        } else {
          playBtn.className = "w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]";
          playIcon.textContent = "▶";
          playText.textContent = "Play";
        }
      }

      if (sliderSpeed && valSpeed) {
        sliderSpeed.value = inst.playSpeed;
        valSpeed.textContent = inst.playSpeed.toFixed(1) + 'x';
      }
    }
  }
}
