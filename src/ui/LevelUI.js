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
    this.distanceVerified = false;
    this.aristarchus2Verified = {
      size: false,
      taper: false,
      distance: false
    };

    this.ptolemyVerified = {
      parallax: false,
      epicycles: false
    };
    this.copernicusVerified = false;
    this.kepler1Verified = false;
    this.kepler23Verified = false;
    this.kepler8_1Verified = false;
    this.kepler8_23Verified = false;
    this.newton1Verified = false;
    this.newton2Verified = false;
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
      } else if (state.activeLevel === 4) {
        this.renderLevel4();
        this.show();
      } else if (state.activeLevel === 5) {
        this.renderLevel5();
        this.show();
      } else if (state.activeLevel === 6) {
        this.renderLevel6();
        this.show();
      } else if (state.activeLevel === 7) {
        this.renderLevel7();
        this.show();
      } else if (state.activeLevel === 8) {
        this.renderLevel8();
        this.show();
      } else if (state.activeLevel === 9) {
        this.renderLevel9();
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
      <div class="level-panel" style="width: 380px; max-height: calc(100% - 60px); bottom: 20px; left: 20px;">
        <div class="flex justify-between items-center">
          <h2 class="text-base font-bold text-sky-400">Level 3: Aristarchus 1</h2>
          <button class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2 py-1 rounded text-[10px] border border-slate-700 transition" id="exit-btn">Exit to Orbit</button>
        </div>
        <p class="text-[9px] text-slate-400 tracking-wider font-bold mt-1 uppercase">How he measured relative Sun & Moon distance</p>
        
        <div class="bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-2 mt-2">
          <h3 class="text-[10px] font-bold text-sky-400 uppercase tracking-wider">The Half-Moon Geometry</h3>
          <p class="text-[11px] leading-relaxed text-slate-300">
            Aristarchus of Samos (c. 310–230 BC) realized that when the Moon is exactly half-lit (dichotomy), the angle between the Earth-Moon line and the Moon-Sun line is exactly <strong>90°</strong>. 
            This forms a right-angled triangle with the Earth, Moon, and Sun.
          </p>
          <p class="text-[11px] leading-relaxed text-slate-300">
            By measuring the angle <strong>ψ</strong> (psi) between the Sun and Moon from Earth, we can calculate the ratio of the Earth-Sun distance (S) to the Earth-Moon distance (L):
            <br><span class="block text-center font-mono my-1.5 text-sky-400 text-xs">S / L = 1 / cos(ψ)</span>
          </p>
        </div>

        <div class="bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-2 mt-2">
          <span class="text-[11px] font-semibold text-slate-300">
            Aristarchus measured the angle ψ to be <strong>87°</strong>. Based on this measurement, how many times further away is the Sun compared to the Moon?
          </span>
          <div class="flex gap-2 mt-1">
            <input type="number" id="distance-input" class="flex-1 bg-slate-900 border border-slate-800 text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-sky-500 transition" placeholder="e.g. 19" step="0.1">
            <button id="verify-btn" class="bg-sky-500 hover:bg-sky-600 text-black font-semibold px-4 py-2 rounded-lg text-xs transition">Verify</button>
          </div>
          <div id="feedback" class="text-[11px] mt-1"></div>
        </div>

        <!-- Final Unlock Button -->
        <button id="final-submit-btn" disabled class="w-full py-2 rounded-xl bg-slate-800 text-slate-500 font-bold transition cursor-not-allowed text-xs border border-slate-700 mt-3">Verify & Unlock Next Level</button>
      </div>

      <!-- Parameter panel positioned at bottom right below the illustration -->
      <div class="absolute bottom-6 right-6 left-[420px] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-xl flex flex-col gap-2 text-slate-200 pointer-events-auto shadow-2xl" style="z-index: 100;">
        <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Interactive Model Parameters</span>
          <span id="time-val" class="text-sky-400 font-semibold text-xs">12.0h</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-[10px] text-slate-400 font-semibold w-20">Time of Day:</span>
          <input type="range" id="time-slider" min="0" max="24" step="0.1" value="12.0" class="flex-1 h-1 bg-slate-750 rounded appearance-none cursor-pointer accent-sky-400">
        </div>
      </div>
    `;

    document.getElementById('exit-btn').addEventListener('click', () => {
      gameState.activeLevel = null;
      gameState.notify();
    });

    const timeSlider = document.getElementById('time-slider');
    const timeVal = document.getElementById('time-val');
    
    timeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      timeVal.textContent = val.toFixed(1) + 'h';
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setTimeOfDay === 'function') {
        window.activeLevelInstance.setTimeOfDay(val);
      }
    });

    const distanceInput = document.getElementById('distance-input');
    const verifyBtn = document.getElementById('verify-btn');
    const feedback = document.getElementById('feedback');
    const finalSubmitBtn = document.getElementById('final-submit-btn');

    if (this.distanceVerified) {
      distanceInput.value = '19';
      feedback.innerHTML = `
        <div class="text-green-500 font-semibold mb-2">Correct! The Sun is ~19 times further away than the Moon according to Aristarchus' measurement of 87°.</div>
        <div class="text-slate-300 text-[11px] leading-relaxed mt-2 p-2 bg-slate-900/60 border border-slate-800 rounded">
          <strong>The Reality:</strong> The true angle is <strong>89.85°</strong>, which means the Sun is actually <strong>~400 times</strong> further away.<br><br>
          <strong>Why is it so hard to measure?</strong><br>
          1. <em>Terminator Uncertainty:</em> Determining the exact moment the Moon is exactly half-lit is very difficult because the lunar surface is covered in mountains and craters, making the shadow line jagged.<br>
          2. <em>Sensitivity:</em> Because 87° is so close to 90°, a tiny error of just 3° leads to a massive 20-fold difference in the calculated distance ratio.
        </div>
      `;
      finalSubmitBtn.disabled = false;
      finalSubmitBtn.style.background = 'rgb(34, 197, 94)';
      finalSubmitBtn.style.color = 'white';
      finalSubmitBtn.style.cursor = 'pointer';
      finalSubmitBtn.classList.remove('bg-slate-800', 'text-slate-500', 'cursor-not-allowed');
      finalSubmitBtn.classList.add('hover:bg-green-600');
    }

    verifyBtn.addEventListener('click', () => {
      const val = parseFloat(distanceInput.value);
      if (isNaN(val)) return;

      if (Math.abs(val - 19.1) < 1.15) {
        feedback.innerHTML = `
          <div class="text-green-500 font-semibold mb-2">Correct! The Sun is ~19 times further away than the Moon according to Aristarchus' measurement of 87°.</div>
          <div class="text-slate-300 text-[11px] leading-relaxed mt-2 p-2 bg-slate-900/60 border border-slate-800 rounded">
            <strong>The Reality:</strong> The true angle is <strong>89.85°</strong>, which means the Sun is actually <strong>~400 times</strong> further away.<br><br>
            <strong>Why is it so hard to measure?</strong><br>
            1. <em>Terminator Uncertainty:</em> Determining the exact moment the Moon is exactly half-lit is very difficult because the lunar surface is covered in mountains and craters, making the shadow line jagged.<br>
            2. <em>Sensitivity:</em> Because 87° is so close to 90°, a tiny error of just 3° leads to a massive 20-fold difference in the calculated distance ratio.
          </div>
        `;
        this.distanceVerified = true;
        finalSubmitBtn.disabled = false;
        finalSubmitBtn.style.background = 'rgb(34, 197, 94)';
        finalSubmitBtn.style.color = 'white';
        finalSubmitBtn.style.cursor = 'pointer';
        finalSubmitBtn.classList.remove('bg-slate-800', 'text-slate-500', 'cursor-not-allowed');
        finalSubmitBtn.classList.add('hover:bg-green-600');
      } else {
        feedback.innerHTML = `<span class="text-red-500 font-semibold">Incorrect. Compute 1 / cos(87°). Hint: cos(87°) ≈ 0.0523. Try 19.</span>`;
      }
    });
  }

  renderLevel4() {
    let activeTab = 'size';
    const tabData = {
      size: {
        title: "1. Relative Shadow Size",
        desc: "To measure the size of Earth's shadow relative to the Moon, Aristarchus observed total lunar eclipses. Look at the two looping animations on the right:<br>" +
              "• <strong>Movie 1 (Entering Shadow)</strong> shows the Moon taking <strong>1.0 hour</strong> to move from first contact to being fully eclipsed (traveling exactly 1.0 Moon diameter).<br>" +
              "• <strong>Movie 2 (Total Eclipse)</strong> shows the Moon spending <strong>2.7 hours</strong> completely inside the Earth's shadow umbra (traveling the inner width of the shadow).",
        question: "Based on these timings (2.7h / 1.0h), what is the ratio of Earth's shadow diameter to the Moon's diameter (d<sub>shadow</sub> / d<sub>M</sub>)?",
        placeholder: "e.g. 2.7",
        answer: 2.7
      },
      taper: {
        title: "2. Earth Shadow Taper Size",
        desc: "Because the Sun is a physical sphere, the Earth's shadow umbra is a cone that narrows (tapers) as it goes out. Let:<br>" +
              "• <strong>A</strong> be the Moon's angular diameter from Earth (A ≈ 0.5°).<br>" +
              "• <strong>B</strong> be the Sun's angular diameter from Earth (B ≈ 0.5°). Since they are nearly identical, <strong>A = B ≈ 0.5°</strong>.<br>" +
              "• <strong>C</strong> be the total shadow taper angle at the tip, and <strong>E</strong> be the taper angle on each side, so <strong>2E = C</strong>.<br>" +
              "• <strong>D</strong> be the Earth's angular radius as viewed from the Sun.<br><br>" +
              "By geometry, the shadow taper angle is <strong>C = 2E = B - 2D</strong>. Since the Sun is extremely far away, the angle <strong>D</strong> is negligible. Therefore, <strong>2E = C ≈ B ≈ 0.5°</strong>, which means the taper angle on each side is <strong>E ≈ 0.25°</strong>.<br><br>" +
              "Since <strong>E</strong> is exactly half of the Moon's angular size (<strong>A ≈ 0.5°</strong>), the shadow tapers by exactly <strong>0.5 Moon diameters</strong> on each side (a total taper of <strong>1.0 Moon diameter</strong> at the Moon's distance).<br><br>" +
              "<div class='math-block text-center bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg my-2 font-mono text-[10.5px] text-sky-400'>" +
              "Taper Size = 1.0 d<sub>M</sub><br>" +
              "d<sub>E</sub> = d<sub>shadow</sub> + Taper Size = 2.7 d<sub>M</sub> + 1.0 d<sub>M</sub> = 3.7 d<sub>M</sub>" +
              "</div>" +
              "<p class='text-[10px] text-slate-400 mt-2'>Refer to the Bucknell experiment details: <a href='https://www.eg.bucknell.edu/physics/astronomy/astr101/specials/aristarchus.html' target='_blank' class='text-sky-400 underline hover:text-sky-300'>Aristarchus and the Size of the Moon</a>.</p>",
        question: "What is the relative size of the Earth to the Moon (d<sub>E</sub> / d<sub>M</sub>) based on this tapering shadow calculation?",
        placeholder: "e.g. 3.7",
        answer: 3.7
      },
      distance: {
        title: "3. Earth-Moon Distance",
        desc: "Now that we know the Earth's diameter is <strong>3.7</strong> times the Moon's diameter, we have R<sub>M</sub> / R<sub>E</sub> = 1 / 3.7 ≈ 0.270. We can now calculate the distance to the Moon in terms of Earth radii (R<sub>E</sub>).<br><br>" +
              "The Moon's angular diameter viewed from Earth is θ = 0.5° (so angular radius α = 0.25°). By trigonometry:<br>" +
              "<div class='math-block text-center bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg my-2 font-mono text-[10.5px] text-sky-400'>" +
              "D<sub>EM</sub> = R<sub>M</sub> / sin(0.25°) = 0.270 R<sub>E</sub> / sin(0.25°)" +
              "</div>",
        question: "What is the Earth-Moon distance in units of Earth's radius (D<sub>EM</sub> / R<sub>E</sub>)? Round to 1 decimal place.",
        placeholder: "e.g. 61.9",
        answer: 61.9
      }
    };

    this.container.innerHTML = `
      <div class="level-panel" style="width: 380px; max-height: calc(100% - 60px); bottom: 20px; left: 20px;">
        <div class="flex justify-between items-center">
          <h2 class="text-base font-bold text-sky-400">Level 4: Aristarchus 2</h2>
          <button class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2 py-1 rounded text-[10px] border border-slate-700 transition" id="exit-btn">Exit to Orbit</button>
        </div>
        <p class="text-[9px] text-slate-400 tracking-wider font-bold mt-1 uppercase">Measure relative moon size & distance</p>
        
        <!-- Tabs Header -->
        <div class="flex border-b border-slate-800 gap-1 pb-1 mt-1">
          <button id="tab-size" class="tab-btn px-2 py-1 text-[10px] font-semibold rounded transition font-medium" style="background: rgb(56, 189, 248); color: black;">Shadow Size</button>
          <button id="tab-taper" class="tab-btn px-2 py-1 text-[10px] font-semibold rounded transition font-medium" style="background: transparent; color: rgb(148, 163, 184);">Shadow Taper</button>
          <button id="tab-distance" class="tab-btn px-2 py-1 text-[10px] font-semibold rounded transition font-medium" style="background: transparent; color: rgb(148, 163, 184);">Moon Distance</button>
        </div>

        <!-- Tab Contents Card -->
        <div class="bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-2">
          <h3 id="tab-title" class="text-[10px] font-bold text-sky-400 uppercase tracking-wider">1. Relative Shadow Size</h3>
          <p id="tab-desc" class="text-[11px] leading-relaxed text-slate-300">...</p>
          
          <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1.5">
            <span class="text-[11px] font-semibold text-slate-300" id="tab-question">...</span>
            <div class="flex gap-2">
              <input type="number" id="calc-input" class="flex-1 bg-slate-900 border border-slate-800 text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-sky-500 transition" placeholder="e.g. 2.5" step="0.1">
              <button id="verify-tab-btn" class="bg-sky-500 hover:bg-sky-600 text-black font-semibold px-4 py-2 rounded-lg text-xs transition">Verify</button>
            </div>
            <div id="tab-feedback" class="text-[11px] font-semibold hidden"></div>
          </div>
        </div>

        <!-- Sub-tasks Checklist -->
        <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1">
          <span class="text-[9px] uppercase font-bold tracking-wider text-slate-500">Sub-tasks:</span>
          <div id="check-size" class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium transition">
            <span class="status-check text-red-500">❌</span>
            <span>Shadow Size Ratio (d_shad / d_M) Verified</span>
          </div>
          <div id="check-taper" class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium transition">
            <span class="status-check text-red-500">❌</span>
            <span>Earth-Moon Size Ratio (d_E / d_M) Verified</span>
          </div>
          <div id="check-distance" class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium transition">
            <span class="status-check text-red-500">❌</span>
            <span>Earth-Moon Distance (D_EM / R_E) Verified</span>
          </div>
        </div>

        <!-- Final Unlock Button -->
        <button id="final-submit-btn" disabled class="w-full py-2 rounded-xl bg-slate-800 text-slate-500 font-bold transition cursor-not-allowed text-xs border border-slate-700 mt-2">Verify & Unlock Next Level</button>
      </div>

      <!-- Parameter panel positioned at bottom right below the illustration -->
      <div class="absolute bottom-6 right-6 left-[420px] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-xl flex flex-col gap-2 text-slate-200 pointer-events-auto shadow-2xl" style="z-index: 100;">
        <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Interactive Model Parameters</span>
          <span id="progress-val" class="text-sky-400 font-semibold text-xs">50%</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-[10px] text-slate-400 font-semibold w-24">Eclipse Progress:</span>
          <input type="range" id="progress-slider" min="0" max="100" step="0.1" value="50.0" class="flex-1 h-1 bg-slate-750 rounded appearance-none cursor-pointer accent-sky-400">
        </div>
      </div>
    `;

    document.getElementById('exit-btn').addEventListener('click', () => {
      gameState.activeLevel = null;
      gameState.notify();
    });

    const progressSlider = document.getElementById('progress-slider');
    const progressVal = document.getElementById('progress-val');
    
    progressSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      progressVal.textContent = Math.round(val) + '%';
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setProgress === 'function') {
        window.activeLevelInstance.setProgress(val);
      }
    });

    const tabTitle = document.getElementById('tab-title');
    const tabDesc = document.getElementById('tab-desc');
    const tabQuestion = document.getElementById('tab-question');
    const calcInput = document.getElementById('calc-input');
    const verifyTabBtn = document.getElementById('verify-tab-btn');
    const tabFeedback = document.getElementById('tab-feedback');
    const finalSubmitBtn = document.getElementById('final-submit-btn');

    const updateChecklist = () => {
      let allVerified = true;
      Object.keys(this.aristarchus2Verified).forEach(key => {
        const itemEl = document.getElementById(`check-${key}`);
        if (!itemEl) return;
        const iconEl = itemEl.querySelector('.status-check');
        if (this.aristarchus2Verified[key]) {
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
    };

    const updateTabContent = () => {
      const data = tabData[activeTab];
      tabTitle.textContent = data.title;
      tabDesc.innerHTML = data.desc;
      tabQuestion.innerHTML = data.question;
      calcInput.placeholder = data.placeholder;
      calcInput.value = '';
      tabFeedback.classList.add('hidden');

      if (activeTab === 'size') {
        calcInput.step = '0.1';
        if (this.aristarchus2Verified.size) {
          calcInput.value = '2.7';
          tabFeedback.textContent = "Correct! The shadow diameter is 2.7 times the Moon's diameter.";
          tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
          tabFeedback.classList.remove('hidden');
        }
      } else if (activeTab === 'taper') {
        calcInput.step = '0.1';
        if (this.aristarchus2Verified.taper) {
          calcInput.value = '3.7';
          tabFeedback.textContent = "Correct! Earth's diameter is ~3.7 times the Moon's diameter (historically Aristarchus estimated this boundary).";
          tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
          tabFeedback.classList.remove('hidden');
        }
      } else {
        calcInput.step = '0.1';
        if (this.aristarchus2Verified.distance) {
          calcInput.value = '61.9';
          tabFeedback.textContent = "Correct! D_EM = 0.270 R_E / sin(0.25°) ≈ 61.9 R_E.";
          tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
          tabFeedback.classList.remove('hidden');
        }
      }

      document.querySelectorAll('.tab-btn').forEach(btn => {
        const tabId = btn.id.replace('tab-', '');
        if (tabId === activeTab) {
          btn.style.background = 'rgb(56, 189, 248)';
          btn.style.color = 'black';
        } else {
          btn.style.background = 'transparent';
          btn.style.color = 'rgb(148, 163, 184)';
        }
      });

      // Proactively notify the canvas model of subtask change
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setSubtask === 'function') {
        window.activeLevelInstance.setSubtask(activeTab);
      }
    };

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeTab = e.target.id.replace('tab-', '');
        updateTabContent();
      });
    });

    verifyTabBtn.addEventListener('click', () => {
      const val = parseFloat(calcInput.value);
      if (isNaN(val)) return;

      const data = tabData[activeTab];
      tabFeedback.classList.remove('hidden');

      if (activeTab === 'size') {
        if (Math.abs(val - 2.7) < 0.05) {
          tabFeedback.textContent = "Correct! The shadow diameter is 2.7 times the Moon's diameter.";
          tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
          this.aristarchus2Verified.size = true;
          updateChecklist();
        } else {
          tabFeedback.textContent = "Incorrect. Use: duration in shadow / duration to enter = 2.7h / 1.0h = 2.7.";
          tabFeedback.className = "text-[11px] font-semibold text-red-500 mt-1";
        }
      } else if (activeTab === 'taper') {
        if (Math.abs(val - 3.7) < 0.05) {
          tabFeedback.textContent = "Correct! Earth's diameter is ~3.7 times the Moon's diameter (historically Aristarchus estimated this boundary).";
          tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
          this.aristarchus2Verified.taper = true;
          updateChecklist();
        } else {
          tabFeedback.textContent = "Incorrect. Subtract taper (1.0 d_M) and add shadow width (2.7 d_M): d_E = 2.7 d_M + 1.0 d_M = 3.7 d_M. Try 3.7.";
          tabFeedback.className = "text-[11px] font-semibold text-red-500 mt-1";
        }
      } else {
        if (Math.abs(val - 61.9) < 1.1) {
          tabFeedback.textContent = "Correct! D_EM = 0.270 R_E / sin(0.25°) ≈ 61.9 R_E.";
          tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
          this.aristarchus2Verified.distance = true;
          updateChecklist();
        } else {
          tabFeedback.textContent = "Incorrect. Compute 0.270 / sin(0.25°). Hint: sin(0.25°) ≈ 0.004363. Try 61.9.";
          tabFeedback.className = "text-[11px] font-semibold text-red-500 mt-1";
        }
      }
    });

    finalSubmitBtn.addEventListener('click', () => {
      gameState.completeLevel(4);
    });

    updateTabContent();
    updateChecklist();
  }

  renderLevel5() {
    this.container.innerHTML = `
      <div class="level-panel">
        <h2>Level 5: Eratosthenes' Experiment</h2>
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
            <input type="number" id="circumference-input" placeholder="e.g. 40000" />
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
          gameState.completeLevel(5);
        }, 2000);
      } else {
        feedback.textContent = "Incorrect. Remember: (360 / 7.2) * 800 = 50 * 800.";
        feedback.className = "feedback-msg show error";
      }
    });
  }

  renderLevel6() {
    let activeTab = 'parallax';
    const tabData = {
      parallax: {
        title: "1. Lack of Stellar Parallax",
        desc: "If the Earth orbits the Sun, our position in space shifts by 2 AU every 6 months. This shift should cause nearby stars to apparently change their positions relative to more distant background stars. This effect is called <strong>stellar parallax</strong>.<br><br>" +
              "Ancient Greek astronomers tried to measure this, but observed absolutely no shift. Because they could not detect stellar parallax, they concluded that the Earth must be stationary, rejecting the heliocentric (Sun-centered) model. In reality, the stars are so incredibly far away that stellar parallax is extremely tiny and required 19th-century telescopes to measure for the first time.<br><br>" +
              "For a star at distance <i>d</i> in parsecs (pc), the parallax angle <i>p</i> in arcseconds is given by:<br>" +
              "<div class='math-block text-center bg-slate-950/60 border border-slate-800/80 p-2 py-1.5 rounded my-1.5 font-mono text-[11px] text-sky-400'>p = 1 / d</div>" +
              "To convert arcseconds to degrees, recall that 1 degree = 3600 arcseconds. Therefore:<br>" +
              "<div class='math-block text-center bg-slate-950/60 border border-slate-800/80 p-2 py-1.5 rounded my-1.5 font-mono text-[11px] text-sky-400'>p_deg = p / 3600 = 1 / (d × 3600)</div>" +
              "<p class='text-[10px] text-slate-400 mt-2'>Refer to the LCO page: <a href='https://lco.global/spacebook/distance/parallax-and-distance-measurement/' target='_blank' class='text-sky-400 underline hover:text-sky-300'>Stellar Parallax and Distance Measurement</a>.</p>",
        question: "Using the realistic distance to the closest star, Proxima Centauri (1.30 pc), calculate what is the parallax angle in degrees. Round to 6 decimal places.",
        placeholder: "e.g. 0.000214",
        answer: 0.000214
      },
      epicycles: {
        title: "2. Retrograde & Epicycles",
        desc: "The word \"planet\" comes from the Late Latin word planēta, which was borrowed directly from the Ancient Greek term planētes. This Greek word was an abbreviation of asteres planētai, which translates literally to \"wandering stars.\"<br><br>" +
              "To explain their motion in a geocentric model, Ptolemy defined:<br>" +
              "• <strong>Deferant</strong> (Deferent Path): The main normalized orbit centered near Earth. Ptolemy fixed its radius to a standard value of <strong>60 parts</strong> for every planet.<br>" +
              "• <strong>Epicycle</strong>: A smaller circle whose center moves along the deferant. Its size represents the relative planet's orbit size compared to Earth's orbit. The relative orbital ratio is defined as:<br>" +
              "  - <strong>Outer Planets</strong> (Mars, Jupyter, Saturn): <i>planet orbit size / earth orbit size</i><br>" +
              "  - <strong>Inner Planets</strong> (Venus): <i>earth orbit size / planet orbit size</i><br><br>" +
              "An <strong>Astronomical Unit (AU)</strong> is the average Earth-Sun distance (Earth's orbit size = 1 AU). The task is to calculate the epicycle size given the planet's orbit size in AU using:<br>" +
              "<div class='math-block text-center bg-slate-950/60 border border-slate-800/80 p-1.5 py-1 rounded my-1 font-mono text-[10px] text-sky-400'>epicycle radius = 60 / ratio</div>" +
              "For example, Mars' orbit size is 1.52 AU. Its ratio is 1.52 / 1.0 = 1.52, so Mars' epicycle should be 60 / 1.52 ≈ 39.5.",
        question: "Calculate and verify the expected epicycle radius for Venus, Mars, Jupyter, and Saturn:<br>" +
                  "• <strong>Venus</strong>: 0.723 AU (ratio = 1.0 / 0.723)<br>" +
                  "• <strong>Mars</strong>: 1.52 AU (ratio = 1.52 / 1.0)<br>" +
                  "• <strong>Jupyter (Jupiter)</strong>: 5.20 AU (ratio = 5.20 / 1.0)<br>" +
                  "• <strong>Saturn</strong>: 9.58 AU (ratio = 9.58 / 1.0)",
        placeholder: "Calculations",
        answer: null
      }
    };

    this.container.innerHTML = `
      <div class="level-panel" style="width: 380px; max-height: calc(100% - 60px); bottom: 20px; left: 20px;">
        <div class="flex justify-between items-center">
          <h2 class="text-base font-bold text-sky-400">Level 6: Ptolemy</h2>
          <button class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2 py-1 rounded text-[10px] border border-slate-700 transition" id="exit-btn">Exit to Orbit</button>
        </div>
        <p class="text-[9px] text-slate-400 tracking-wider font-bold mt-1 uppercase">The Geocentric Model</p>
        
        <!-- Tabs Header -->
        <div class="flex border-b border-slate-800 gap-1 pb-1 mt-1">
          <button id="tab-parallax" class="tab-btn px-2 py-1 text-[10px] font-semibold rounded transition font-medium" style="background: rgb(56, 189, 248); color: black;">Stellar Parallax</button>
          <button id="tab-epicycles" class="tab-btn px-2 py-1 text-[10px] font-semibold rounded transition font-medium" style="background: transparent; color: rgb(148, 163, 184);">Retrograde & Epicycles</button>
        </div>

        <!-- Tab Contents Card -->
        <div class="bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-2">
          <h3 id="tab-title" class="text-[10px] font-bold text-sky-400 uppercase tracking-wider">1. Lack of Stellar Parallax</h3>
          <p id="tab-desc" class="text-[11px] leading-relaxed text-slate-300">...</p>
          
          <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1.5" id="verify-area">
            <span class="text-[11px] font-semibold text-slate-300" id="tab-question">...</span>
            
            <!-- Parallax Input -->
            <div class="flex gap-2" id="parallax-input-container">
              <input type="number" id="calc-input" class="flex-1 bg-slate-900 border border-slate-800 text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-sky-500 transition" placeholder="e.g. 0.000214" step="0.000001">
              <button id="verify-tab-btn" class="bg-sky-500 hover:bg-sky-600 text-black font-semibold px-4 py-2 rounded-lg text-xs transition">Verify</button>
            </div>

            <!-- Epicycles Inputs -->
            <div class="flex flex-col gap-2 hidden" id="epicycles-input-container">
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-400 font-semibold w-14">Venus:</span>
                  <input type="number" id="calc-venus" class="w-16 bg-slate-900 border border-slate-800 text-white text-xs px-2 py-1 rounded outline-none focus:border-sky-500" placeholder="e.g. 43.1" step="0.1">
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-400 font-semibold w-14">Mars:</span>
                  <input type="number" id="calc-mars" class="w-16 bg-slate-900 border border-slate-800 text-white text-xs px-2 py-1 rounded outline-none focus:border-sky-500" placeholder="e.g. 39.5" step="0.1">
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-400 font-semibold w-14">Jupyter:</span>
                  <input type="number" id="calc-jupiter" class="w-16 bg-slate-900 border border-slate-800 text-white text-xs px-2 py-1 rounded outline-none focus:border-sky-500" placeholder="e.g. 11.5" step="0.1">
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-400 font-semibold w-14">Saturn:</span>
                  <input type="number" id="calc-saturn" class="w-16 bg-slate-900 border border-slate-800 text-white text-xs px-2 py-1 rounded outline-none focus:border-sky-500" placeholder="e.g. 6.5" step="0.1">
                </div>
              </div>
              <button id="verify-epi-btn" class="bg-sky-500 hover:bg-sky-600 text-black font-semibold w-full py-1.5 rounded-lg text-xs transition">Verify Epicycles</button>
            </div>

            <div id="tab-feedback" class="text-[11px] font-semibold hidden"></div>
          </div>

          <!-- Earth Orbit Progress Slider (Only for Parallax) -->
          <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1.5" id="parallax-slider-area">
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Earth Orbit Progress</span>
              <span id="progress-val" class="text-sky-400 font-semibold text-xs">0%</span>
            </div>
            <div class="flex items-center gap-4">
              <input type="range" id="progress-slider" min="0" max="100" step="0.1" value="0" class="flex-1 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400">
            </div>
          </div>
        </div>

        <!-- Sub-tasks Checklist -->
        <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1">
          <span class="text-[9px] uppercase font-bold tracking-wider text-slate-500">Sub-tasks:</span>
          <div id="check-parallax" class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium transition">
            <span class="status-check text-red-500">❌</span>
            <span>Lack of Stellar Parallax Verified</span>
          </div>
          <div id="check-epicycles" class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium transition">
            <span class="status-check text-red-500">❌</span>
            <span>Epicycle Calculations Verified</span>
          </div>
        </div>

        <!-- Final Unlock Button -->
        <button id="final-submit-btn" disabled class="w-full py-2 rounded-xl bg-slate-800 text-slate-500 font-bold transition cursor-not-allowed text-xs border border-slate-700 mt-2">Verify & Unlock Next Level</button>
      </div>

      <!-- Parameter panel positioned at bottom right below the illustration -->
      <div id="param-panel" class="absolute bottom-6 right-6 left-[420px] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-xl flex flex-col gap-2.5 text-slate-200 pointer-events-auto shadow-2xl" style="z-index: 100;">
        <!-- Dynamic content filled based on active tab -->
      </div>
    `;

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
    const paramPanel = document.getElementById('param-panel');

    const progressSlider = document.getElementById('progress-slider');
    const progressVal = document.getElementById('progress-val');

    progressSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      progressVal.textContent = Math.round(val) + '%';
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setProgress === 'function') {
        window.activeLevelInstance.setProgress(val);
      }
    });

    const updateChecklist = () => {
      const pItem = document.getElementById('check-parallax');
      const eItem = document.getElementById('check-epicycles');
      
      if (pItem) {
        const iconEl = pItem.querySelector('.status-check');
        if (this.ptolemyVerified.parallax) {
          iconEl.textContent = '✅';
          pItem.classList.remove('text-slate-500');
          pItem.classList.add('text-green-500');
        } else {
          iconEl.textContent = '❌';
          pItem.classList.remove('text-green-500');
          pItem.classList.add('text-slate-500');
        }
      }

      if (eItem) {
        const iconEl = eItem.querySelector('.status-check');
        if (this.ptolemyVerified.epicycles) {
          iconEl.textContent = '✅';
          eItem.classList.remove('text-slate-500');
          eItem.classList.add('text-green-500');
        } else {
          iconEl.textContent = '❌';
          eItem.classList.remove('text-green-500');
          eItem.classList.add('text-slate-500');
        }
      }

      if (this.ptolemyVerified.parallax && this.ptolemyVerified.epicycles) {
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
    };

    const updateEpicycleControls = () => {
      if (!window.activeLevelInstance) return;
      const inst = window.activeLevelInstance;
      
      const planetSelect = document.getElementById('planet-select');
      if (planetSelect) {
        planetSelect.value = inst.selectedPlanetName;
      }

      const playPauseIcon = document.getElementById('play-pause-icon');
      const playPauseText = document.getElementById('play-pause-text');
      if (playPauseIcon && playPauseText) {
        playPauseIcon.textContent = inst.isSimPlaying ? '❚❚' : '▶';
        playPauseText.textContent = inst.isSimPlaying ? 'Pause' : 'Play';
      }

      const readoutEpiR = document.getElementById('readout-epi-r');
      const readoutDefSpeed = document.getElementById('readout-def-speed');
      const readoutEpiSpeed = document.getElementById('readout-epi-speed');
      
      if (readoutEpiR) readoutEpiR.textContent = inst.selectedPlanetName === 'All' ? 'All' : inst.epicycleRadius.toFixed(1);
      if (readoutDefSpeed) readoutDefSpeed.textContent = inst.selectedPlanetName === 'All' ? 'All' : inst.deferentSpeed.toFixed(2);
      if (readoutEpiSpeed) readoutEpiSpeed.textContent = inst.selectedPlanetName === 'All' ? 'All' : inst.epicycleSpeed.toFixed(2);
    };

    const updateTabContent = () => {
      const data = tabData[activeTab];
      tabTitle.textContent = data.title;
      tabDesc.innerHTML = data.desc;
      tabQuestion.innerHTML = data.question;

      const verifyArea = document.getElementById('verify-area');
      const parallaxSliderArea = document.getElementById('parallax-slider-area');
      const parallaxInputContainer = document.getElementById('parallax-input-container');
      const epicyclesInputContainer = document.getElementById('epicycles-input-container');
      
      if (activeTab === 'parallax') {
        verifyArea.classList.remove('hidden');
        parallaxInputContainer.classList.remove('hidden');
        epicyclesInputContainer.classList.add('hidden');
        parallaxSliderArea.classList.remove('hidden');
        calcInput.placeholder = data.placeholder;
        calcInput.value = '';
        tabFeedback.classList.add('hidden');
        if (this.ptolemyVerified.parallax) {
          calcInput.value = '0.000214';
          tabFeedback.textContent = "Correct! The parallax angle is extremely tiny (~0.000214°).";
          tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
          tabFeedback.classList.remove('hidden');
        }
        
        // Hide parameter panel for the parallax tab since there is no parameter to tune
        paramPanel.style.display = 'none';
        
      } else {
        // Epicycles Tab
        verifyArea.classList.remove('hidden');
        parallaxInputContainer.classList.add('hidden');
        epicyclesInputContainer.classList.remove('hidden');
        parallaxSliderArea.classList.add('hidden');
        tabFeedback.classList.add('hidden');

        if (this.ptolemyVerified.epicycles) {
          document.getElementById('calc-venus').value = '43.1';
          document.getElementById('calc-mars').value = '39.5';
          document.getElementById('calc-jupiter').value = '11.5';
          document.getElementById('calc-saturn').value = '6.5';
          tabFeedback.textContent = "Correct! Epicycle sizes match the Keplerian/Ptolemaic scale ratios.";
          tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
          tabFeedback.classList.remove('hidden');
        }
        
        // Show parameter panel for epicycles
        paramPanel.style.display = 'flex';
        
        // Render Epicycle Controls
        paramPanel.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-4 w-full">
            <!-- Planet Select Dropdown -->
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select Planet:</span>
              <select id="planet-select" class="bg-slate-950 border border-slate-800 text-sky-400 font-semibold text-xs px-3 py-1.5 rounded-lg outline-none focus:border-sky-500 transition cursor-pointer">
                <option value="All" selected>All Planets</option>
                <option value="Mars">Mars</option>
                <option value="Jupiter">Jupiter</option>
                <option value="Saturn">Saturn</option>
                <option value="Venus">Venus</option>
              </select>
            </div>

            <!-- Play/Pause & Reset Controls -->
            <div class="flex items-center gap-2">
              <button id="play-pause-btn" class="bg-sky-500 hover:bg-sky-600 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5">
                <span id="play-pause-icon">▶</span>
                <span id="play-pause-text">Play</span>
              </button>
              <button id="reset-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs border border-slate-700 transition">
                Reset
              </button>
            </div>

            <!-- Ratios Readout values -->
            <div class="flex gap-4 text-[10px] font-mono">
              <div class="flex flex-col">
                <span class="text-[9px] text-slate-500 uppercase font-bold">Deferent R</span>
                <span class="text-slate-300 font-semibold">60.0</span>
              </div>
              <div class="flex flex-col">
                <span class="text-[9px] text-slate-500 uppercase font-bold">Epicycle R</span>
                <span id="readout-epi-r" class="text-sky-400 font-bold">-</span>
              </div>
              <div class="flex flex-col">
                <span class="text-[9px] text-slate-500 uppercase font-bold">Deferent Speed</span>
                <span id="readout-def-speed" class="text-slate-300 font-semibold">-</span>
              </div>
              <div class="flex flex-col">
                <span class="text-[9px] text-slate-500 uppercase font-bold">Epicycle Speed</span>
                <span id="readout-epi-speed" class="text-sky-400 font-bold">-</span>
              </div>
            </div>
          </div>
        `;
        
        const planetSelect = document.getElementById('planet-select');
        const playPauseBtn = document.getElementById('play-pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        
        planetSelect.addEventListener('change', (e) => {
          const val = e.target.value;
          if (window.activeLevelInstance && typeof window.activeLevelInstance.selectPlanet === 'function') {
            window.activeLevelInstance.selectPlanet(val);
            updateEpicycleControls();
          }
        });
        
        playPauseBtn.addEventListener('click', () => {
          if (window.activeLevelInstance && typeof window.activeLevelInstance.togglePlay === 'function') {
            window.activeLevelInstance.togglePlay();
            updateEpicycleControls();
          }
        });
        
        resetBtn.addEventListener('click', () => {
          if (window.activeLevelInstance && typeof window.activeLevelInstance.resetSimulation === 'function') {
            window.activeLevelInstance.resetSimulation();
            updateEpicycleControls();
          }
        });
        
        updateEpicycleControls();
      }

      document.querySelectorAll('.tab-btn').forEach(btn => {
        const tabId = btn.id.replace('tab-', '');
        if (tabId === activeTab) {
          btn.style.background = 'rgb(56, 189, 248)';
          btn.style.color = 'black';
        } else {
          btn.style.background = 'transparent';
          btn.style.color = 'rgb(148, 163, 184)';
        }
      });

      // Notify canvas model of tab change
      console.log("LevelUI: activeTab is:", activeTab, "activeLevelInstance:", window.activeLevelInstance);
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setSubtask === 'function') {
        window.activeLevelInstance.setSubtask(activeTab);
      } else {
        console.warn("LevelUI: window.activeLevelInstance is not set or lacks setSubtask!");
      }
    };

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeTab = e.target.id.replace('tab-', '');
        updateTabContent();
      });
    });

    verifyTabBtn.addEventListener('click', () => {
      const val = parseFloat(calcInput.value);
      if (isNaN(val)) return;

      tabFeedback.classList.remove('hidden');

      if (activeTab === 'parallax') {
        // Correct answer: 0.000214. Accept within [0.000212, 0.000216]
        if (Math.abs(val - 0.000214) <= 0.000002) {
          tabFeedback.textContent = "Correct! The parallax angle is extremely tiny (~0.000214°).";
          tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
          this.ptolemyVerified.parallax = true;
          updateChecklist();
        } else {
          tabFeedback.textContent = "Incorrect. Use: p_deg = 1 / (d * 3600) = 1 / (1.30 * 3600) ≈ 0.000214°. Try 0.000214.";
          tabFeedback.className = "text-[11px] font-semibold text-red-500 mt-1";
        }
      }
    });

    // Epicycles verification handler
    const verifyEpiBtn = document.getElementById('verify-epi-btn');
    const calcVenus = document.getElementById('calc-venus');
    const calcMars = document.getElementById('calc-mars');
    const calcJupiter = document.getElementById('calc-jupiter');
    const calcSaturn = document.getElementById('calc-saturn');

    verifyEpiBtn.addEventListener('click', () => {
      const v = parseFloat(calcVenus.value);
      const m = parseFloat(calcMars.value);
      const j = parseFloat(calcJupiter.value);
      const s = parseFloat(calcSaturn.value);

      if (isNaN(v) || isNaN(m) || isNaN(j) || isNaN(s)) return;

      tabFeedback.classList.remove('hidden');

      // Venus expected: 43.1 or 43.4
      // Mars expected: 39.5
      // Jupiter expected: 11.5
      // Saturn expected: 6.5 or 6.3
      const vOk = Math.abs(v - 43.1) <= 0.45 || Math.abs(v - 43.38) <= 0.1;
      const mOk = Math.abs(m - 39.5) <= 0.15 || Math.abs(m - 39.47) <= 0.1;
      const jOk = Math.abs(j - 11.5) <= 0.15 || Math.abs(j - 11.54) <= 0.1;
      const sOk = Math.abs(s - 6.5) <= 0.25 || Math.abs(s - 6.26) <= 0.1;

      if (vOk && mOk && jOk && sOk) {
        tabFeedback.textContent = "Correct! Epicycle sizes match the Keplerian/Ptolemaic scale ratios.";
        tabFeedback.className = "text-[11px] font-semibold text-green-500 mt-1";
        this.ptolemyVerified.epicycles = true;
        updateChecklist();
      } else {
        tabFeedback.textContent = "Incorrect. Use: Venus (60 × 0.723 = 43.1/43.4), Mars (60 / 1.52 = 39.5), Jupyter (60 / 5.2 = 11.5), Saturn (60 / 9.58 = 6.5/6.3).";
        tabFeedback.className = "text-[11px] font-semibold text-red-500 mt-1";
      }
    });

    finalSubmitBtn.addEventListener('click', () => {
      gameState.completeLevel(6);
    });

    updateTabContent();
    updateChecklist();
  }
  renderLevel7() {
    this.container.innerHTML = `
      <div class="level-panel" style="width: 380px; max-height: calc(100% - 60px); bottom: 20px; left: 20px;">
        <div class="flex justify-between items-center">
          <h2 class="text-base font-bold text-sky-400">Level 7: Copernicus</h2>
          <button class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2 py-1 rounded text-[10px] border border-slate-700 transition" id="exit-btn">Exit to Orbit</button>
        </div>
        <p class="text-[9px] text-slate-400 tracking-wider font-bold mt-1 uppercase">The Heliocentric Model</p>

        <div class="bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-2 mt-2">
          <h3 class="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Copernicus' Breakthrough &amp; Limitations</h3>
          <p class="text-[10.5px] leading-relaxed text-slate-300">
            Nicolaus Copernicus (1473–1543) shifted the center of the cosmos from Earth to the Sun.
            His heliocentric model, published in <i>De revolutionibus orbium coelestium</i> (1543), naturally
            explained retrograde motion: as Earth overtakes a slower outer planet, it appears to drift
            backward against the background stars.<br><br>
            Crucially, Copernicus still assumed <strong>perfect circular orbits</strong>, so he still
            needed epicycles to match observations — his model was no more accurate than Ptolemy's.
          </p>
          <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1.5">
            <span class="text-[11px] font-semibold text-slate-300">Is Copernicus' heliocentric model more accurate than Ptolemy's geocentric model at predicting planetary positions?</span>
            <div class="flex flex-col gap-2 mt-1">
              <button id="cop-opt-yes" class="w-full text-left bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-xs transition active:scale-[0.99] focus:outline-none">
                <strong>A) Yes:</strong> Centering on the Sun resolved calculation errors and matched observations perfectly.
              </button>
              <button id="cop-opt-no" class="w-full text-left bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-xs transition active:scale-[0.99] focus:outline-none">
                <strong>B) No:</strong> Because Copernicus still used perfect circles, his model required epicycles and was not more accurate.
              </button>
            </div>
            <div id="cop-feedback" class="text-xs p-2.5 rounded-lg border border-slate-800 hidden leading-relaxed mt-1"></div>
          </div>
        </div>

        <!-- Checklist -->
        <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1">
          <span class="text-[9px] uppercase font-bold tracking-wider text-slate-500">Progress:</span>
          <div id="check-cop" class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium transition">
            <span class="status-check">❌</span>
            <span>Accuracy Question Answered</span>
          </div>
        </div>

        <button id="final-submit-btn" disabled
          class="w-full py-2 rounded-xl bg-slate-800 text-slate-500 font-bold transition cursor-not-allowed text-xs border border-slate-700 mt-2">
          Verify &amp; Unlock Next Level
        </button>
      </div>

      <!-- Bottom control panel -->
      <div id="param-panel"
        class="absolute bottom-6 right-6 left-[420px] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-xl flex flex-col gap-2.5 text-slate-200 pointer-events-auto"
        style="z-index: 100;">
      </div>
    `;

    document.getElementById('exit-btn').addEventListener('click', () => {
      gameState.activeLevel = null;
      gameState.notify();
    });

    const optYes = document.getElementById('cop-opt-yes');
    const optNo  = document.getElementById('cop-opt-no');
    const feedback = document.getElementById('cop-feedback');
    const finalBtn = document.getElementById('final-submit-btn');
    const checkEl = document.getElementById('check-cop');

    const unlock = () => {
      if (checkEl) {
        checkEl.querySelector('.status-check').textContent = '✅';
        checkEl.className = 'flex items-center gap-1.5 text-[11px] font-medium transition text-green-500';
      }
      finalBtn.disabled = false;
      finalBtn.style.background = 'rgb(34,197,94)';
      finalBtn.style.color = 'white';
      finalBtn.style.cursor = 'pointer';
    };

    optYes.addEventListener('click', () => {
      optYes.classList.add('border-red-500','bg-red-500/10'); optYes.classList.remove('border-slate-800');
      optNo.classList.remove('border-green-500','bg-green-500/10'); optNo.classList.add('border-slate-800');
      feedback.classList.remove('hidden','border-green-500/30','bg-green-500/5','text-green-400');
      feedback.classList.add('border-red-500/30','bg-red-500/5','text-red-400');
      feedback.innerHTML = `<strong>Incorrect.</strong> Copernicus still assumed perfect circular orbits, so his model required epicycles and matched real data no better than Ptolemy's. Try again!`;
    });

    optNo.addEventListener('click', () => {
      optNo.classList.add('border-green-500','bg-green-500/10'); optNo.classList.remove('border-slate-800');
      optYes.classList.remove('border-red-500','bg-red-500/10'); optYes.classList.add('border-slate-800');
      feedback.classList.remove('hidden','border-red-500/30','bg-red-500/5','text-red-400');
      feedback.classList.add('border-green-500/30','bg-green-500/5','text-green-400');
      feedback.innerHTML = `<strong>Correct!</strong> Copernicus still used perfect circular orbits and needed epicycles, so his predictive accuracy was no better than Ptolemy's. It took Kepler's elliptical orbits (Level 8) to achieve true precision.`;
      this.copernicusVerified = true;
      unlock();
    });

    finalBtn.addEventListener('click', () => { gameState.completeLevel(7); });

    // Restore state if already answered
    if (this.copernicusVerified) {
      optNo.classList.add('border-green-500','bg-green-500/10'); optNo.classList.remove('border-slate-800');
      feedback.classList.remove('hidden');
      feedback.classList.add('border-green-500/30','bg-green-500/5','text-green-400');
      feedback.innerHTML = `<strong>Correct!</strong> Copernicus still used perfect circular orbits and needed epicycles. It took Kepler's elliptical orbits to achieve true precision.`;
      unlock();
    }

    // Bottom param panel: planet selector + play/pause
    const paramPanel = document.getElementById('param-panel');
    paramPanel.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-4 w-full">
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select Planet:</span>
          <select id="planet-select" class="bg-slate-950 border border-slate-800 text-sky-400 font-semibold text-xs px-3 py-1.5 rounded-lg outline-none focus:border-sky-500 transition cursor-pointer">
            <option value="All" selected>All Planets</option>
            <option value="Mars">Mars</option>
            <option value="Jupiter">Jupiter</option>
            <option value="Saturn">Saturn</option>
            <option value="Venus">Venus</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <button id="play-pause-btn" class="bg-sky-500 hover:bg-sky-600 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5">
            <span id="play-pause-icon">❚❚</span>
            <span id="play-pause-text">Pause</span>
          </button>
          <button id="reset-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs border border-slate-700 transition">Reset</button>
        </div>
        <div class="text-[9px] text-slate-500 italic">Compare: geocentric (left) uses deferent + epicycle / heliocentric (right) uses concentric orbits</div>
      </div>
    `;

    document.getElementById('planet-select').addEventListener('change', (e) => {
      if (window.activeLevelInstance && typeof window.activeLevelInstance.selectPlanet === 'function') {
        window.activeLevelInstance.selectPlanet(e.target.value);
      }
    });
    document.getElementById('play-pause-btn').addEventListener('click', () => {
      if (window.activeLevelInstance && typeof window.activeLevelInstance.togglePlay === 'function') {
        window.activeLevelInstance.togglePlay();
        const inst = window.activeLevelInstance;
        document.getElementById('play-pause-icon').textContent = inst.isSimPlaying ? '❚❚' : '▶';
        document.getElementById('play-pause-text').textContent = inst.isSimPlaying ? 'Pause' : 'Play';
      }
    });
    document.getElementById('reset-btn').addEventListener('click', () => {
      if (window.activeLevelInstance && typeof window.activeLevelInstance.resetSimulation === 'function') {
        window.activeLevelInstance.resetSimulation();
      }
    });
  }

  renderLevel8() {
    this.container.innerHTML = `
      <div class="level-panel" style="width: 380px; max-height: calc(100% - 60px); bottom: 20px; left: 20px;">
        <div class="flex justify-between items-center">
          <h2 class="text-base font-bold text-violet-400">Level 8: Kepler's Laws</h2>
          <button class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2 py-1 rounded text-[10px] border border-slate-700 transition" id="exit-btn">Exit to Orbit</button>
        </div>
        <p class="text-[9px] text-slate-400 tracking-wider font-bold mt-1 uppercase">Elliptical Orbits &amp; Harmonic Laws</p>

        <!-- Tabs -->
        <div class="flex border-b border-slate-800 gap-1 pb-1 mt-1.5">
          <button id="tab-k1"  class="tab-k px-2 py-1 text-[10px] font-semibold rounded transition" style="background:rgb(139,92,246);color:#fff;">Kepler's 1st Law</button>
          <button id="tab-k23" class="tab-k px-2 py-1 text-[10px] font-semibold rounded transition" style="background:transparent;color:rgb(148,163,184);">Kepler's 2nd &amp; 3rd</button>
        </div>

        <!-- 1st Law content -->
        <div id="content-k1" class="flex flex-col gap-2 mt-2">
          <div class="bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-2">
            <h3 class="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Kepler's 1st Law: Elliptical Orbits</h3>
            <p class="text-[10.5px] leading-relaxed text-slate-300">
              Johannes Kepler used Tycho Brahe's ultra-precise Mars observations (orange dots) to find the true orbital shape.
              No circle — centered or offset — could pass through all of Tycho's data points.
              An <strong>ellipse with the Sun at one focus</strong> fits perfectly.
            </p>
            <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-2">
              <span class="text-[10.5px] font-semibold text-slate-300">Test a model against Tycho's data:</span>
              <div class="flex flex-col gap-1.5">
                <button id="model-circle-btn" class="w-full text-left bg-slate-900 hover:bg-slate-800 border border-violet-500 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs transition">
                  <strong>1. Copernican Circle:</strong> Sun at center — completely misses most data points.
                </button>
                <button id="model-offset-btn" class="w-full text-left bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs transition">
                  <strong>2. Off-Center Circle:</strong> Sun offset — still has an 8 arcminute bulge error.
                </button>
                <button id="model-ellipse-btn" class="w-full text-left bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs transition">
                  <strong>3. Kepler's Ellipse:</strong> Sun at focus — perfect alignment with all data. ✓
                </button>
              </div>
              <div id="kepler1-feedback" class="text-xs p-2 rounded-lg border border-red-900/30 bg-red-950/20 text-red-400 leading-relaxed">
                Model fails to align with Tycho's observations.
              </div>
            </div>
          </div>
        </div>

        <!-- 2nd &amp; 3rd Law content -->
        <div id="content-k23" class="flex flex-col gap-2 mt-2 hidden">
          <div class="bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-2">
            <h3 class="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Kepler's 2nd &amp; 3rd Laws</h3>
            <p class="text-[10.5px] leading-relaxed text-slate-300 font-medium" style="color:#67e8f9;">2nd Law: Equal Areas in Equal Times</p>
            <p class="text-[10.5px] leading-relaxed text-slate-400">
              The line joining the Sun to a planet sweeps equal areas in equal times. Near perihelion (closest to Sun) the planet moves fastest; near aphelion (furthest) it moves slowest. Each shaded wedge on the left covers equal area.
            </p>
            <p class="text-[10.5px] leading-relaxed font-semibold mt-1 border-t border-slate-900 pt-2" style="color:#c084fc;">3rd Law: T² = a³ (Harmonic Law)</p>
            <p class="text-[10.5px] leading-relaxed text-slate-400">
              The square of a planet's orbital period (T²) is proportional to the cube of its average distance from the Sun (a³). On the right panel, every planet falls on a perfect straight line — one of the most elegant laws in physics.
            </p>
          </div>
        </div>

        <!-- Checklist -->
        <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1">
          <span class="text-[9px] uppercase font-bold tracking-wider text-slate-500">Progress:</span>
          <div id="check-k1" class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium transition">
            <span class="status-check">❌</span><span>Elliptic Model Verified</span>
          </div>
          <div id="check-k23" class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium transition">
            <span class="status-check">❌</span><span>2nd &amp; 3rd Laws Explored</span>
          </div>
        </div>

        <button id="final-submit-btn" disabled
          class="w-full py-2 rounded-xl bg-slate-800 text-slate-500 font-bold transition cursor-not-allowed text-xs border border-slate-700 mt-2">
          Verify &amp; Unlock Next Level
        </button>
      </div>

      <!-- Bottom control panel -->
      <div id="k8-param-panel"
        class="absolute bottom-6 right-6 left-[420px] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-xl flex flex-col gap-2.5 text-slate-200 pointer-events-auto"
        style="z-index: 100;">
      </div>
    `;

    document.getElementById('exit-btn').addEventListener('click', () => {
      gameState.activeLevel = null;
      gameState.notify();
    });

    const finalBtn  = document.getElementById('final-submit-btn');
    const checkK1   = document.getElementById('check-k1');
    const checkK23  = document.getElementById('check-k23');
    const k1Fb      = document.getElementById('kepler1-feedback');

    const refreshChecklist = () => {
      if (this.kepler8_1Verified) {
        checkK1.querySelector('.status-check').textContent = '✅';
        checkK1.className = 'flex items-center gap-1.5 text-[11px] font-medium transition text-green-500';
      }
      if (this.kepler8_23Verified) {
        checkK23.querySelector('.status-check').textContent = '✅';
        checkK23.className = 'flex items-center gap-1.5 text-[11px] font-medium transition text-green-500';
      }
      if (this.kepler8_1Verified && this.kepler8_23Verified) {
        finalBtn.disabled = false;
        finalBtn.className = 'w-full py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold transition cursor-pointer text-xs border border-violet-750 mt-2';
      }
    };

    finalBtn.addEventListener('click', () => { gameState.completeLevel(8); });

    // Model selection buttons for 1st law
    const circleBtn   = document.getElementById('model-circle-btn');
    const offsetBtn   = document.getElementById('model-offset-btn');
    const ellipseBtn  = document.getElementById('model-ellipse-btn');

    const selectModel = (model) => {
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setKepler1Model === 'function') {
        window.activeLevelInstance.setKepler1Model(model);
      }
      circleBtn.className  = 'w-full text-left bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs transition';
      offsetBtn.className  = 'w-full text-left bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs transition';
      ellipseBtn.className = 'w-full text-left bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs transition';
      if (model === 'circle') {
        circleBtn.classList.add('border-violet-500','text-violet-300');
        k1Fb.innerHTML = '<strong>Simulation:</strong> Fails entirely — the circle misses the data points at the sides.';
        k1Fb.className = 'text-xs p-2 rounded-lg border border-red-900/30 bg-red-950/20 text-red-400 leading-relaxed';
      } else if (model === 'offset') {
        offsetBtn.classList.add('border-violet-500','text-violet-300');
        k1Fb.innerHTML = '<strong>Simulation:</strong> Closer, but notice the 8 arcminute bulge gap at top and bottom — this forced Kepler to abandon circles entirely.';
        k1Fb.className = 'text-xs p-2 rounded-lg border border-amber-900/30 bg-amber-950/20 text-amber-400 leading-relaxed';
      } else {
        ellipseBtn.classList.add('border-green-500','text-green-300');
        k1Fb.innerHTML = '<strong>✓ Perfect fit!</strong> The ellipse passes through every data point. This is Kepler\'s First Law — planetary orbits are ellipses with the Sun at one focus.';
        k1Fb.className = 'text-xs p-2 rounded-lg border border-green-900/30 bg-green-950/20 text-green-400 leading-relaxed';
        this.kepler8_1Verified = true;
        refreshChecklist();
      }
    };

    circleBtn.addEventListener('click',  () => selectModel('circle'));
    offsetBtn.addEventListener('click',  () => selectModel('offset'));
    ellipseBtn.addEventListener('click', () => selectModel('ellipse'));

    // Tab switching
    const tab1  = document.getElementById('tab-k1');
    const tab23 = document.getElementById('tab-k23');
    const con1  = document.getElementById('content-k1');
    const con23 = document.getElementById('content-k23');

    const switchTab = (which) => {
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setSubtask === 'function') {
        window.activeLevelInstance.setSubtask(which);
      }
      if (which === 'kepler1') {
        tab1.style.background  = 'rgb(139,92,246)'; tab1.style.color  = '#fff';
        tab23.style.background = 'transparent';     tab23.style.color = 'rgb(148,163,184)';
        con1.classList.remove('hidden'); con23.classList.add('hidden');
        renderK8Params('kepler1');
      } else {
        tab23.style.background = 'rgb(139,92,246)'; tab23.style.color = '#fff';
        tab1.style.background  = 'transparent';     tab1.style.color  = 'rgb(148,163,184)';
        con23.classList.remove('hidden'); con1.classList.add('hidden');
        this.kepler8_23Verified = true;
        refreshChecklist();
        renderK8Params('kepler23');
      }
    };

    tab1.addEventListener('click',  () => switchTab('kepler1'));
    tab23.addEventListener('click', () => switchTab('kepler23'));

    // Param panel renderer
    const renderK8Params = (tab) => {
      const pp = document.getElementById('k8-param-panel');
      if (!pp) return;
      if (tab === 'kepler1') {
        pp.innerHTML = `
          <div class="flex flex-wrap items-center gap-4 w-full">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kepler's 1st Law — Mars Orbit Fitting</span>
            <div class="flex items-center gap-2 ml-auto">
              <button id="k8-play-btn" class="bg-violet-500 hover:bg-violet-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5">
                <span id="k8-play-icon">❚❚</span><span id="k8-play-text">Pause</span>
              </button>
              <button id="k8-reset-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs border border-slate-700 transition">Reset</button>
            </div>
            <div class="text-[9px] text-slate-500 italic w-full">Orange dots = Tycho Brahe's observations of Mars. Select a model to test it.</div>
          </div>`;
      } else {
        pp.innerHTML = `
          <div class="flex flex-wrap items-center gap-4 w-full">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kepler's 2nd &amp; 3rd Laws Visualizer</span>
            <div class="flex items-center gap-2 ml-auto">
              <button id="k8-play-btn" class="bg-violet-500 hover:bg-violet-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5">
                <span id="k8-play-icon">❚❚</span><span id="k8-play-text">Pause</span>
              </button>
              <button id="k8-reset-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs border border-slate-700 transition">Reset</button>
            </div>
            <div class="flex gap-4 text-[9px] w-full">
              <span class="text-sky-400 font-semibold">Left: Equal-area sweep (2nd Law)</span>
              <span class="text-purple-400 font-semibold">Right: T² vs a³ log-log plot (3rd Law)</span>
            </div>
          </div>`;
      }
      document.getElementById('k8-play-btn').addEventListener('click', () => {
        if (window.activeLevelInstance && typeof window.activeLevelInstance.togglePlay === 'function') {
          window.activeLevelInstance.togglePlay();
          const inst = window.activeLevelInstance;
          document.getElementById('k8-play-icon').textContent = inst.isSimPlaying ? '❚❚' : '▶';
          document.getElementById('k8-play-text').textContent = inst.isSimPlaying ? 'Pause' : 'Play';
        }
      });
      document.getElementById('k8-reset-btn').addEventListener('click', () => {
        if (window.activeLevelInstance && typeof window.activeLevelInstance.resetSimulation === 'function') {
          window.activeLevelInstance.resetSimulation();
        }
      });
    };

    // Restore verified state
    refreshChecklist();
    if (this.kepler8_1Verified) selectModel('ellipse');

    // Default to 1st law tab
    switchTab('kepler1');
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

    if (gameState.activeLevel === 4 && window.activeLevelInstance) {
      const inst = window.activeLevelInstance;
      const progressSlider = document.getElementById('progress-slider');
      const progressVal = document.getElementById('progress-val');
      
      inst.onProgressUpdate = (val) => {
        if (progressSlider && progressVal) {
          progressSlider.value = val;
          progressVal.textContent = Math.round(val) + '%';
        }
      };
    }

    if (gameState.activeLevel === 6 && window.activeLevelInstance) {
      const inst = window.activeLevelInstance;
      const progressSlider = document.getElementById('progress-slider');
      const progressVal = document.getElementById('progress-val');
      
      inst.onOrbitUpdate = (val) => {
        if (progressSlider && progressVal) {
          progressSlider.value = val;
          progressVal.textContent = Math.round(val) + '%';
        }
      };
    }
  }

  renderLevel9() {
    this.container.innerHTML = `
      <div class="level-panel" style="width: 380px; max-height: calc(100% - 60px); bottom: 20px; left: 20px;">
        <div class="flex justify-between items-center">
          <h2 class="text-base font-bold text-violet-400">Level 9: Newton</h2>
          <button class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2 py-1 rounded text-[10px] border border-slate-700 transition" id="exit-btn">Exit to Orbit</button>
        </div>
        <p class="text-[9px] text-slate-400 tracking-wider font-bold mt-1 uppercase">Gravity which united the celestial and terrestrial rule</p>

        <!-- Tabs -->
        <div class="flex border-b border-slate-800 gap-1 pb-1 mt-1.5">
          <button id="tab-n1" class="tab-n px-2 py-1 text-[10px] font-semibold rounded transition" style="background:rgb(139,92,246);color:#fff;">Newton's Cannonball</button>
          <button id="tab-n2" class="tab-n px-2 py-1 text-[10px] font-semibold rounded transition" style="background:transparent;color:rgb(148,163,184);">Law of Gravity</button>
        </div>

        <!-- Cannonball Content -->
        <div id="content-n1" class="flex flex-col gap-2 mt-2">
          <div class="bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-2">
            <h3 class="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Newton's Cannonball &amp; The Moon</h3>
            <p class="text-[10.5px] leading-relaxed text-slate-300">
              Newton realized gravity is universal: the force pulling an apple to the ground is the same force keeping the Moon in orbit.
              If a cannonball is launched horizontally from a high mountain, it falls toward Earth. If its speed matches the curvature of the Earth, it falls indefinitely — creating a stable orbit.
            </p>
            <p class="text-[10.5px] leading-relaxed text-slate-400">
              For circular orbits, centripetal acceleration matches gravity (a = v<sup>2</sup> / R, so v<sup>2</sup> = a · R).
            </p>
            <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Earth-Moon Test Challenge:</span>
              <p class="text-[10px] text-slate-400">
                The Moon is at distance D ≈ 384,400 km (approx 60.3 Earth radii). By the inverse-square law, gravity falls off by 1 / d<sup>2</sup>.
                Given Earth gravity g = 9.8 m/s<sup>2</sup>:
                <br>• Moon acceleration: a<sub>moon</sub> = g / (60.3)<sup>2</sup> ≈ 0.0027 m/s<sup>2</sup>.
              </p>
              <span class="text-[10.5px] font-semibold text-slate-200">Calculate the Moon's orbital period in days:</span>
              <div class="flex gap-2">
                <input type="number" id="newton1-input" class="flex-1 bg-slate-900 border border-slate-800 text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-violet-500 transition" placeholder="e.g. 27.3" step="0.1">
                <button id="newton1-verify-btn" class="bg-violet-500 hover:bg-violet-600 text-white font-semibold px-4 py-2 rounded-lg text-xs transition">Verify</button>
              </div>
              <div id="newton1-feedback" class="text-[10.5px] font-medium hidden"></div>
            </div>
          </div>
        </div>

        <!-- Law of Gravity Content -->
        <div id="content-n2" class="flex flex-col gap-2 mt-2 hidden">
          <!-- Step content (updated dynamically by renderN9GravityStep) -->
          <div id="gravity-step-content" class="bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-1.5">
            <!-- populated by JS -->
          </div>
          <!-- G challenge (shown only on step 5) -->
          <div id="gravity-challenge" class="hidden bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-2">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gravitational Constant Challenge:</span>
            <p class="text-[10px] text-slate-400">
              Assume ρ = 3000 kg/m<sup>3</sup>, g = 9.8 m/s<sup>2</sup>, R = 6371 km.
              Using G = 3g / (4π · ρ · R):
            </p>
            <span class="text-[10.5px] font-semibold text-slate-200">Value of G in units of 10<sup>-11</sup> m<sup>3</sup> kg<sup>-1</sup> s<sup>-2</sup>?</span>
            <div class="flex gap-2">
              <input type="number" id="newton2-input" class="flex-1 bg-slate-900 border border-slate-800 text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-violet-500 transition" placeholder="e.g. 12.2" step="0.1">
              <button id="newton2-verify-btn" class="bg-violet-500 hover:bg-violet-600 text-white font-semibold px-4 py-2 rounded-lg text-xs transition">Verify</button>
            </div>
            <div id="newton2-feedback" class="text-[10.5px] font-medium hidden"></div>
          </div>
        </div>

        <!-- Checklist -->
        <div class="border-t border-slate-800/80 pt-2 flex flex-col gap-1">
          <span class="text-[9px] uppercase font-bold tracking-wider text-slate-500">Progress:</span>
          <div id="check-n1" class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium transition">
            <span class="status-check">❌</span><span>Moon Orbit Period Verified</span>
          </div>
          <div id="check-n2" class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium transition">
            <span class="status-check">❌</span><span>Gravitational Constant G Verified</span>
          </div>
        </div>

        <button id="final-submit-btn" disabled
          class="w-full py-2 rounded-xl bg-slate-800 text-slate-500 font-bold transition cursor-not-allowed text-xs border border-slate-700 mt-2">
          Verify &amp; Unlock Next Level
        </button>
      </div>

      <!-- Parameter panel -->
      <div id="n9-param-panel"
        class="absolute bottom-6 right-6 left-[420px] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-xl flex flex-col gap-2.5 text-slate-200 pointer-events-auto shadow-2xl"
        style="z-index: 100;">
      </div>
    `;

    document.getElementById('exit-btn').addEventListener('click', () => {
      gameState.activeLevel = null;
      gameState.notify();
    });

    const finalBtn  = document.getElementById('final-submit-btn');
    const checkN1   = document.getElementById('check-n1');
    const checkN2   = document.getElementById('check-n2');

    const refreshChecklist = () => {
      if (this.newton1Verified) {
        checkN1.querySelector('.status-check').textContent = '✅';
        checkN1.className = 'flex items-center gap-1.5 text-[11px] font-medium transition text-green-500';
      }
      if (this.newton2Verified) {
        checkN2.querySelector('.status-check').textContent = '✅';
        checkN2.className = 'flex items-center gap-1.5 text-[11px] font-medium transition text-green-500';
      }
      if (this.newton1Verified && this.newton2Verified) {
        finalBtn.disabled = false;
        finalBtn.className = 'w-full py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold transition cursor-pointer text-xs border border-violet-750 mt-2';
      }
    };

    finalBtn.addEventListener('click', () => {
      gameState.completeLevel(9);
    });

    // Verification tab 1
    const n1Input = document.getElementById('newton1-input');
    const n1VerifyBtn = document.getElementById('newton1-verify-btn');
    const n1Fb = document.getElementById('newton1-feedback');

    n1VerifyBtn.addEventListener('click', () => {
      const val = parseFloat(n1Input.value);
      if (val >= 27.0 && val <= 28.0) {
        n1Fb.textContent = '✓ Correct! Newton\'s Earth-Moon test predicts an orbital period of ~27.3 days, aligning perfectly with observations.';
        n1Fb.className = 'text-[11px] font-semibold text-green-500 mt-1';
        this.newton1Verified = true;
        refreshChecklist();
      } else {
        n1Fb.textContent = '❌ Incorrect. Hint: D = 3.844e8 m, a_moon = 0.00272 m/s². v = sqrt(a_moon*D) ≈ 1024 m/s. Period T = 2πD/v ≈ 27.3 days.';
        n1Fb.className = 'text-[11px] font-semibold text-red-500 mt-1';
      }
      n1Fb.classList.remove('hidden');
    });

    // Verification tab 2
    const n2Input = document.getElementById('newton2-input');
    const n2VerifyBtn = document.getElementById('newton2-verify-btn');
    const n2Fb = document.getElementById('newton2-feedback');

    n2VerifyBtn.addEventListener('click', () => {
      const val = parseFloat(n2Input.value);
      if (val >= 12.0 && val <= 12.5) {
        n2Fb.textContent = '✓ Correct! With this average density, G is calculated as ~12.2 x 10⁻¹¹ m³/kg·s². (The true G is ~6.67 x 10⁻¹¹ because Earth\'s actual core is much denser!)';
        n2Fb.className = 'text-[11px] font-semibold text-green-500 mt-1';
        this.newton2Verified = true;
        refreshChecklist();
      } else {
        n2Fb.textContent = '❌ Incorrect. Hint: G = 3*g / (4*π*ρ*R). ρ = 3000, R = 6.371e6, g = 9.8. G ≈ 1.22e-10 = 12.2e-11.';
        n2Fb.className = 'text-[11px] font-semibold text-red-500 mt-1';
      }
      n2Fb.classList.remove('hidden');
    });

    // Tab switching
    const tab1 = document.getElementById('tab-n1');
    const tab2 = document.getElementById('tab-n2');
    const con1 = document.getElementById('content-n1');
    const con2 = document.getElementById('content-n2');

    const switchTab = (which) => {
      if (window.activeLevelInstance && typeof window.activeLevelInstance.setSubtask === 'function') {
        window.activeLevelInstance.setSubtask(which);
      }
      if (which === 'cannonball') {
        tab1.style.background = 'rgb(139,92,246)'; tab1.style.color = '#fff';
        tab2.style.background = 'transparent';     tab2.style.color = 'rgb(148,163,184)';
        con1.classList.remove('hidden'); con2.classList.add('hidden');
        renderN9Params('cannonball');
      } else {
        tab2.style.background = 'rgb(139,92,246)'; tab2.style.color = '#fff';
        tab1.style.background = 'transparent';     tab1.style.color = 'rgb(148,163,184)';
        con2.classList.remove('hidden'); con1.classList.add('hidden');
        renderN9Params('gravity');
      }
    };

    tab1.addEventListener('click', () => switchTab('cannonball'));
    tab2.addEventListener('click', () => switchTab('gravity'));

    // Param panel renderer
    const renderN9Params = (tab) => {
      const pp = document.getElementById('n9-param-panel');
      if (!pp) return;
      if (tab === 'cannonball') {
        pp.innerHTML = `
          <div class="flex flex-wrap items-center gap-4 w-full">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Newton's Cannonball Parameters</span>
            <div class="flex items-center gap-4 flex-1">
              <span class="text-[10px] text-slate-400 font-semibold w-24">Launch Speed: <span id="n9-speed-val" class="text-violet-400">6.0 km/s</span></span>
              <input type="range" id="n9-speed-slider" min="1.0" max="15.0" step="0.1" value="6.0" class="flex-1 h-1 bg-slate-750 rounded appearance-none cursor-pointer accent-violet-400">
            </div>
            <div class="flex items-center gap-2">
              <button id="n9-fire-btn" class="bg-violet-500 hover:bg-violet-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition">Fire Cannon</button>
              <button id="n9-reset-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs border border-slate-700 transition">Reset</button>
            </div>
          </div>`;

        const slider = document.getElementById('n9-speed-slider');
        const valDisp = document.getElementById('n9-speed-val');
        slider.addEventListener('input', (e) => {
          const speed = parseFloat(e.target.value);
          valDisp.textContent = speed.toFixed(1) + ' km/s';
          if (window.activeLevelInstance && typeof window.activeLevelInstance.setSpeed === 'function') {
            window.activeLevelInstance.setSpeed(speed);
          }
        });

        document.getElementById('n9-fire-btn').addEventListener('click', () => {
          if (window.activeLevelInstance && typeof window.activeLevelInstance.fireCannon === 'function') {
            window.activeLevelInstance.fireCannon();
          }
        });

        document.getElementById('n9-reset-btn').addEventListener('click', () => {
          if (window.activeLevelInstance && typeof window.activeLevelInstance.resetSimulation === 'function') {
            window.activeLevelInstance.resetSimulation();
          }
        });
      } else {
        const stepTitles = [
          "Centripetal Force Concept",
          "Orbital Speed Formulation",
          "Substitute Speed into Force",
          "Apply Kepler's 3rd Law",
          "Incorporate Mutual Masses"
        ];
        pp.innerHTML = `
          <div class="flex items-center justify-between w-full">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Universal Gravity Derivation Slideshow</span>
            <div class="flex items-center gap-3">
              <button id="n9-back-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-700 transition">&larr; Back</button>
              <span id="n9-slide-label" class="text-[10.5px] font-bold text-violet-400 w-36 text-center">Step 1: ${stepTitles[0]}</span>
              <button id="n9-next-btn" class="bg-violet-500 hover:bg-violet-600 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs transition">Next &rarr;</button>
            </div>
          </div>`;

        const backBtn = document.getElementById('n9-back-btn');
        const nextBtn = document.getElementById('n9-next-btn');
        const slideLbl = document.getElementById('n9-slide-label');
        let currentStep = gameState.derivationStep;
        slideLbl.textContent = `Step ${currentStep + 1}: ${stepTitles[currentStep]}`;

        const gravityStepContent = [
          { title: 'The Universal Insight', body: 'Newton realized the same force pulling an apple down is what holds the Moon in orbit — a universal, inverse-square attraction. Watch the animation: the Moon and the apple both experience the identical force toward Earth.' },
          { title: 'Circular Motion &amp; F = mv²/r', body: 'A planet orbiting in a circle needs constant centripetal force toward the center. Newton used <em>F = ma</em> with centripetal acceleration <em>a = v²/r</em> to get <em>F<sub>c</sub> = mv²/r</em>.', eq: 'F = m · v² / r' },
          { title: "Kepler's Clue: T² ∝ r³", body: 'Kepler found the square of an orbit period is proportional to the cube of its radius. This means orbital speed follows <em>v ∝ 1/√r</em>, so <em>v² ∝ 1/r</em>.', eq: 'v² ∝ 1 / r' },
          { title: 'Inverse Square Law', body: 'Substitute <em>v² ∝ 1/r</em> into <em>F = mv²/r</em>. The two r terms multiply: F ∝ m/r². <strong>Double the distance → ¼ the force. Triple → ⅑.</strong>', eq: 'F ∝ m / r²' },
          { title: 'Perfect Symmetry — Final Law', body: "By Newton's 3rd Law, the force must equally depend on both masses M and m. Adding the gravitational constant G completes the famous equation:", eq: 'F = G · M · m / r²' },
        ];

        const renderGravityStep = (step) => {
          const el = document.getElementById('gravity-step-content');
          const challenge = document.getElementById('gravity-challenge');
          if (!el) return;
          const data = gravityStepContent[step];
          el.innerHTML = `
            <h3 class="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Step ${step + 1}: ${data.title}</h3>
            <p class="text-[10.5px] leading-relaxed text-slate-300">${data.body}</p>
            ${data.eq ? `<div class="text-center font-serif bg-slate-950/70 p-2 border border-slate-800 rounded-lg text-amber-400 text-sm font-bold">${data.eq}</div>` : ''}
          `;
          if (challenge) {
            challenge.className = step === 4 
              ? 'bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-2'
              : 'hidden';
          }
        };
        renderGravityStep(currentStep);

        const updateSlide = (dir) => {
          currentStep = Math.max(0, Math.min(stepTitles.length - 1, currentStep + dir));
          gameState.derivationStep = currentStep;
          if (window.activeLevelInstance) {
            window.activeLevelInstance.derivationStep = currentStep;
          }
          slideLbl.textContent = `Step ${currentStep + 1}: ${stepTitles[currentStep]}`;
          renderGravityStep(currentStep);
        };

        backBtn.addEventListener('click', () => updateSlide(-1));
        nextBtn.addEventListener('click', () => updateSlide(1));
        // Initialize gravity step content when tab first renders
        renderGravityStep(currentStep);
      }
    };

    // Restore verified state
    refreshChecklist();

    // Default to 1st tab
    switchTab('cannonball');
  }
}

