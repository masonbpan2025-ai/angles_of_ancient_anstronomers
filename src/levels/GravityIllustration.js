/**
 * GravityIllustration.js
 *
 * Creates a canvas-area SVG overlay that renders the 5-step derivation
 * of Newton's Law of Universal Gravitation.
 *
 * Architecture: attaches to document.body as a fixed overlay covering only
 * the RIGHT portion of the screen (left: 400px), sitting between the
 * spoke-container canvas (z-index 10) and the ui-layer (z-index 20).
 *
 * The left UI panel (in #ui-layer) already shows the step text via LevelUI.
 * This module shows only the animated SVG visualization in the canvas area.
 *
 * Usage:
 *   const gi = new GravityIllustration(onStepChange);
 *   gi.setStep(0); // 0–4
 *   gi.show();
 *   gi.hide();
 *   gi.destroy();
 */

// ---------- SVG Templates (one per step) -----------------------------------

const SVG_INTRO = /* html */`
<svg viewBox="0 0 520 360" style="width:100%;height:100%;display:block;overflow:visible;">
  <defs>
    <marker id="gi-arrow-red-intro" markerWidth="10" markerHeight="10" refX="7" refY="3"
      orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#ef4444"/>
    </marker>
    <radialGradient id="gi-earth-grd" cx="40%" cy="35%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="70%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </radialGradient>
    <radialGradient id="gi-atmo-grd" cx="40%" cy="35%">
      <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(96,165,250,0.2)"/>
    </radialGradient>
  </defs>
  <style>
    @keyframes gi-orbit-moon {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes gi-drop-apple {
      0%,10%  { transform: translateY(0);    opacity: 0; }
      20%     { opacity: 1; }
      80%     { transform: translateY(55px); opacity: 1; }
      90%,100%{ transform: translateY(55px); opacity: 0; }
    }
    @keyframes gi-twinkle { 0%,100%{opacity:.4} 50%{opacity:1} }
  </style>

  <!-- Background -->
  <rect width="520" height="360" fill="#020617"/>

  <!-- Stars -->
  <circle cx="40"  cy="30"  r="1.2" fill="#fff" style="animation:gi-twinkle 2.1s ease-in-out infinite"/>
  <circle cx="480" cy="20"  r="1.0" fill="#fff" style="animation:gi-twinkle 3.2s ease-in-out infinite"/>
  <circle cx="430" cy="80"  r="0.9" fill="#fff" style="animation:gi-twinkle 2.7s ease-in-out infinite"/>
  <circle cx="60"  cy="100" r="1.1" fill="#fff" style="animation:gi-twinkle 1.9s ease-in-out infinite"/>
  <circle cx="490" cy="200" r="1.0" fill="#fff" style="animation:gi-twinkle 3.5s ease-in-out infinite"/>
  <circle cx="20"  cy="230" r="1.3" fill="#fff" style="animation:gi-twinkle 2.3s ease-in-out infinite"/>
  <circle cx="450" cy="300" r="0.9" fill="#fff" style="animation:gi-twinkle 4.0s ease-in-out infinite"/>
  <circle cx="150" cy="50"  r="0.8" fill="#fff" style="animation:gi-twinkle 2.8s ease-in-out infinite"/>
  <circle cx="370" cy="330" r="1.1" fill="#fff" style="animation:gi-twinkle 3.1s ease-in-out infinite"/>

  <!-- Orbit path dashed -->
  <circle cx="260" cy="240" r="170" fill="none" stroke="rgba(100,116,139,0.3)" stroke-dasharray="6,6" stroke-width="1.5"/>

  <!-- Earth -->
  <circle cx="260" cy="240" r="85" fill="url(#gi-earth-grd)"/>
  <!-- Atmosphere glow -->
  <circle cx="260" cy="240" r="85" fill="url(#gi-atmo-grd)"/>
  <!-- Continent blobs -->
  <circle cx="235" cy="215" r="32" fill="#10b981" opacity="0.7"/>
  <circle cx="285" cy="235" r="25" fill="#059669" opacity="0.65"/>
  <circle cx="245" cy="255" r="20" fill="#047857" opacity="0.6"/>
  <!-- Border -->
  <circle cx="260" cy="240" r="85" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  <text x="260" y="245" fill="#fff" font-size="13" font-weight="700" text-anchor="middle"
    font-family="Outfit,sans-serif" opacity="0.8">EARTH</text>

  <!-- Orbiting Moon group -->
  <g style="transform-origin:260px 240px;animation:gi-orbit-moon 12s linear infinite">
    <!-- Moon body -->
    <circle cx="260" cy="70" r="18" fill="#e2e8f0"/>
    <circle cx="254" cy="64" r="4" fill="#cbd5e1" opacity="0.5"/>
    <circle cx="269" cy="76" r="2.5" fill="#cbd5e1" opacity="0.4"/>
    <!-- Force arrow: moon → earth -->
    <line x1="260" y1="88" x2="260" y2="142" stroke="#ef4444" stroke-width="3.5"
      marker-end="url(#gi-arrow-red-intro)"/>
    <text x="278" y="118" fill="#ef4444" font-size="11" font-weight="700"
      font-family="Outfit,sans-serif">F</text>
  </g>

  <!-- Falling Apple group: appears at right of Earth, falls toward surface -->
  <g style="transform-origin:350px 180px;animation:gi-drop-apple 2.8s ease-in infinite">
    <circle cx="350" cy="180" r="9" fill="#ef4444"/>
    <path d="M350,171 Q357,164 354,160" fill="none" stroke="#22c55e" stroke-width="2"/>
    <!-- Force arrow: apple → earth -->
    <line x1="342" y1="183" x2="320" y2="200" stroke="#ef4444" stroke-width="2.5"
      marker-end="url(#gi-arrow-red-intro)"/>
    <text x="360" y="202" fill="#ef4444" font-size="11" font-weight="700"
      font-family="Outfit,sans-serif">F</text>
  </g>

  <!-- Title callout -->
  <rect x="80" y="12" width="360" height="32" rx="8" fill="rgba(239,68,68,0.1)"
    stroke="rgba(239,68,68,0.6)" stroke-width="1"/>
  <text x="260" y="32" fill="#ef4444" font-size="14" font-weight="800"
    text-anchor="middle" font-style="italic" font-family="Outfit,sans-serif">
    The exact same force!
  </text>
</svg>
`;

const SVG_CENTRIPETAL = /* html */`
<svg viewBox="0 0 520 360" style="width:100%;height:100%;display:block;">
  <defs>
    <marker id="gi-arrow-red-cp" markerWidth="10" markerHeight="10" refX="7" refY="3"
      orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#ef4444"/></marker>
    <marker id="gi-arrow-green-cp" markerWidth="10" markerHeight="10" refX="7" refY="3"
      orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#22c55e"/></marker>
    <radialGradient id="gi-sun-cp" cx="40%" cy="35%">
      <stop offset="0%"  stop-color="#fff"/>
      <stop offset="35%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="rgba(251,191,36,0)"/>
    </radialGradient>
    <style>
      @keyframes gi-orbit-planet-cp { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes gi-twinkle2 { 0%,100%{opacity:.3} 50%{opacity:.9} }
    </style>
  </defs>

  <rect width="520" height="360" fill="#020617"/>
  <!-- Stars -->
  <circle cx="30"  cy="20"  r="1.0" fill="#fff" style="animation:gi-twinkle2 2.1s ease-in-out infinite"/>
  <circle cx="490" cy="40"  r="0.9" fill="#fff" style="animation:gi-twinkle2 3.2s ease-in-out infinite"/>
  <circle cx="50"  cy="330" r="1.1" fill="#fff" style="animation:gi-twinkle2 1.8s ease-in-out infinite"/>
  <circle cx="480" cy="310" r="0.8" fill="#fff" style="animation:gi-twinkle2 4.1s ease-in-out infinite"/>
  <circle cx="460" cy="160" r="0.9" fill="#fff" style="animation:gi-twinkle2 2.9s ease-in-out infinite"/>

  <!-- Orbit path dashed -->
  <circle cx="260" cy="180" r="120" fill="none" stroke="rgba(100,116,139,0.3)" stroke-dasharray="5,5" stroke-width="1.5"/>

  <!-- Sun glow + core -->
  <circle cx="260" cy="180" r="70" fill="url(#gi-sun-cp)" opacity="0.4"/>
  <circle cx="260" cy="180" r="28" fill="#fbbf24"/>
  <circle cx="260" cy="180" r="20" fill="#fde68a"/>
  <text x="260" y="185" fill="#78350f" font-size="11" font-weight="800"
    text-anchor="middle" font-family="Outfit,sans-serif">SUN</text>

  <!-- Orbiting planet + arrows -->
  <g style="transform-origin:260px 180px;animation:gi-orbit-planet-cp 6s linear infinite">
    <circle cx="380" cy="180" r="14" fill="#38bdf8"/>
    <circle cx="375" cy="176" r="4" fill="#7dd3fc" opacity="0.7"/>
    <!-- Force arrow (toward center/sun) -->
    <line x1="366" y1="180" x2="303" y2="180" stroke="#ef4444" stroke-width="4"
      marker-end="url(#gi-arrow-red-cp)"/>
    <!-- Velocity arrow (tangent, upward from planet) -->
    <line x1="380" y1="166" x2="380" y2="82" stroke="#22c55e" stroke-width="4"
      marker-end="url(#gi-arrow-green-cp)"/>
    <!-- Labels -->
    <text x="322" y="172" fill="#ef4444" font-size="16" font-weight="700"
      font-family="Outfit,sans-serif" font-style="italic">F</text>
    <text x="395" y="120" fill="#22c55e" font-size="16" font-weight="700"
      font-family="Outfit,sans-serif" font-style="italic">v</text>
  </g>

  <!-- Legend -->
  <rect x="12" y="12" width="290" height="48" rx="8" fill="rgba(2,6,23,0.75)"
    stroke="rgba(56,189,248,0.2)" stroke-width="1"/>
  <circle cx="28" cy="28" r="5" fill="#ef4444"/>
  <text x="40" y="32" fill="#ef4444" font-size="10.5" font-weight="600"
    font-family="Outfit,sans-serif">F = centripetal force (inward)</text>
  <circle cx="28" cy="48" r="5" fill="#22c55e"/>
  <text x="40" y="52" fill="#22c55e" font-size="10.5" font-weight="600"
    font-family="Outfit,sans-serif">v = velocity (tangent to orbit)</text>

  <!-- Math callout -->
  <rect x="120" y="308" width="280" height="38" rx="8" fill="rgba(239,68,68,0.1)"
    stroke="rgba(239,68,68,0.35)" stroke-width="1"/>
  <text x="260" y="328" fill="#fbbf24" font-size="17" font-weight="700" font-style="italic"
    text-anchor="middle" font-family="Georgia,serif">F = m · v² / r</text>
</svg>
`;

const SVG_KEPLER = /* html */`
<svg viewBox="0 0 520 360" style="width:100%;height:100%;display:block;">
  <defs>
    <marker id="gi-arrow-green-kp" markerWidth="10" markerHeight="10" refX="7" refY="3"
      orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#22c55e"/></marker>
    <radialGradient id="gi-sun-kp" cx="40%" cy="35%">
      <stop offset="0%"  stop-color="#fff"/>
      <stop offset="35%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="rgba(251,191,36,0)"/>
    </radialGradient>
    <style>
      @keyframes gi-orb-fast { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes gi-orb-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes gi-twinkle3 { 0%,100%{opacity:.3} 50%{opacity:.9} }
    </style>
  </defs>

  <rect width="520" height="360" fill="#020617"/>
  <!-- Stars -->
  <circle cx="20"  cy="15"  r="1.1" fill="#fff" style="animation:gi-twinkle3 2.1s ease-in-out infinite"/>
  <circle cx="500" cy="25"  r="0.9" fill="#fff" style="animation:gi-twinkle3 3.4s ease-in-out infinite"/>
  <circle cx="30"  cy="340" r="1.0" fill="#fff" style="animation:gi-twinkle3 2.7s ease-in-out infinite"/>
  <circle cx="495" cy="330" r="1.2" fill="#fff" style="animation:gi-twinkle3 1.9s ease-in-out infinite"/>

  <!-- Orbit paths -->
  <circle cx="260" cy="180" r="75"  fill="none" stroke="rgba(100,116,139,0.25)" stroke-dasharray="4,4" stroke-width="1.5"/>
  <circle cx="260" cy="180" r="145" fill="none" stroke="rgba(100,116,139,0.25)" stroke-dasharray="4,4" stroke-width="1.5"/>

  <!-- Sun -->
  <circle cx="260" cy="180" r="55"  fill="url(#gi-sun-kp)" opacity="0.35"/>
  <circle cx="260" cy="180" r="22"  fill="#fbbf24"/>
  <circle cx="260" cy="180" r="15"  fill="#fde68a"/>
  <text x="260" y="184" fill="#78350f" font-size="10" font-weight="800"
    text-anchor="middle" font-family="Outfit,sans-serif">SUN</text>

  <!-- Inner (fast) orbit planet -->
  <g style="transform-origin:260px 180px;animation:gi-orb-fast 3s linear infinite">
    <circle cx="335" cy="180" r="10" fill="#a855f7"/>
    <circle cx="332" cy="177" r="3" fill="#d8b4fe" opacity="0.6"/>
    <!-- Long velocity arrow (fast) -->
    <line x1="335" y1="170" x2="335" y2="96" stroke="#22c55e" stroke-width="3.5"
      marker-end="url(#gi-arrow-green-kp)"/>
  </g>

  <!-- Outer (slow) orbit planet -->
  <g style="transform-origin:260px 180px;animation:gi-orb-slow 8.45s linear infinite">
    <circle cx="405" cy="180" r="13" fill="#ec4899"/>
    <circle cx="401" cy="176" r="4" fill="#f9a8d4" opacity="0.6"/>
    <!-- Short velocity arrow (slow) -->
    <line x1="405" y1="167" x2="405" y2="119" stroke="#22c55e" stroke-width="3.5"
      marker-end="url(#gi-arrow-green-kp)"/>
  </g>

  <!-- Legend -->
  <rect x="12" y="290" width="496" height="58" rx="8" fill="rgba(2,6,23,0.8)"
    stroke="rgba(56,189,248,0.15)" stroke-width="1"/>
  <circle cx="28" cy="308" r="6" fill="#a855f7"/>
  <text x="42" y="313" fill="#a855f7" font-size="11" font-weight="700"
    font-family="Outfit,sans-serif">Inner planet — closer to Sun = FASTER speed</text>
  <circle cx="28" cy="332" r="6" fill="#ec4899"/>
  <text x="42" y="337" fill="#ec4899" font-size="11" font-weight="700"
    font-family="Outfit,sans-serif">Outer planet — farther from Sun = SLOWER speed</text>

  <!-- Kepler callout top right -->
  <rect x="340" y="12" width="168" height="28" rx="6" fill="rgba(251,191,36,0.1)"
    stroke="rgba(251,191,36,0.35)" stroke-width="1"/>
  <text x="424" y="29" fill="#fbbf24" font-size="12" font-weight="700" font-style="italic"
    text-anchor="middle" font-family="Georgia,serif">T² ∝ r³</text>
</svg>
`;

const SVG_INVERSE_SQUARE = /* html */`
<svg viewBox="0 0 520 360" style="width:100%;height:100%;display:block;">
  <defs>
    <marker id="gi-arrow-red-inv" markerWidth="10" markerHeight="10" refX="7" refY="3"
      orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#ef4444"/></marker>
    <radialGradient id="gi-sun-inv" cx="40%" cy="35%">
      <stop offset="0%"  stop-color="#fff"/>
      <stop offset="35%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="rgba(251,191,36,0)"/>
    </radialGradient>
    <style>
      @keyframes gi-twinkle4 { 0%,100%{opacity:.3} 50%{opacity:.9} }
    </style>
  </defs>

  <rect width="520" height="360" fill="#020617"/>
  <circle cx="260" cy="20"  r="1.0" fill="#fff" style="animation:gi-twinkle4 2.1s ease-in-out infinite"/>
  <circle cx="490" cy="60"  r="0.8" fill="#fff" style="animation:gi-twinkle4 3.2s ease-in-out infinite"/>
  <circle cx="490" cy="290" r="1.1" fill="#fff" style="animation:gi-twinkle4 2.5s ease-in-out infinite"/>

  <!-- "Force diminishes rapidly" label -->
  <text x="260" y="22" fill="rgba(255,255,255,0.55)" font-size="10" font-style="italic"
    text-anchor="middle" font-family="Outfit,sans-serif">Force diminishes rapidly with distance</text>

  <!-- Sun (left) with glow -->
  <circle cx="55" cy="180" r="65" fill="url(#gi-sun-inv)" opacity="0.3"/>
  <circle cx="55" cy="180" r="35" fill="#fbbf24"/>
  <circle cx="55" cy="180" r="25" fill="#fde68a"/>
  <text x="55" y="185" fill="#78350f" font-size="9" font-weight="800"
    text-anchor="middle" font-family="Outfit,sans-serif">SUN</text>

  <!-- Horizontal dashed distance ruler -->
  <line x1="55" y1="180" x2="490" y2="180" stroke="rgba(100,116,139,0.35)" stroke-dasharray="4,4" stroke-width="1.5"/>

  <!-- Tick marks for R, 2R, 3R -->
  <line x1="155" y1="172" x2="155" y2="188" stroke="#475569" stroke-width="2"/>
  <text x="155" y="202" fill="#64748b" font-size="10" text-anchor="middle"
    font-family="Outfit,sans-serif">R</text>
  <line x1="295" y1="172" x2="295" y2="188" stroke="#475569" stroke-width="2"/>
  <text x="295" y="202" fill="#64748b" font-size="10" text-anchor="middle"
    font-family="Outfit,sans-serif">2R</text>
  <line x1="435" y1="172" x2="435" y2="188" stroke="#475569" stroke-width="2"/>
  <text x="435" y="202" fill="#64748b" font-size="10" text-anchor="middle"
    font-family="Outfit,sans-serif">3R</text>

  <!-- Planet at R (full, large arrow) -->
  <circle cx="155" cy="180" r="14" fill="#3b82f6"/>
  <circle cx="151" cy="176" r="4" fill="#93c5fd" opacity="0.7"/>
  <line x1="141" y1="180" x2="88" y2="180" stroke="#ef4444" stroke-width="7"
    marker-end="url(#gi-arrow-red-inv)"/>
  <text x="105" y="162" fill="#ef4444" font-size="18" font-weight="700"
    font-family="Outfit,sans-serif" font-style="italic">F</text>

  <!-- Planet at 2R (dimmer, smaller arrow) -->
  <g opacity="0.65">
    <circle cx="295" cy="180" r="14" fill="#3b82f6"/>
    <line x1="281" y1="180" x2="248" y2="180" stroke="#ef4444" stroke-width="4"
      marker-end="url(#gi-arrow-red-inv)"/>
    <text x="254" y="162" fill="#ef4444" font-size="14" font-weight="700"
      font-family="Outfit,sans-serif">¼ F</text>
  </g>

  <!-- Planet at 3R (dimmest, tiny arrow) -->
  <g opacity="0.32">
    <circle cx="435" cy="180" r="14" fill="#3b82f6"/>
    <line x1="421" y1="180" x2="407" y2="180" stroke="#ef4444" stroke-width="3"
      marker-end="url(#gi-arrow-red-inv)"/>
    <text x="395" y="162" fill="#ef4444" font-size="13" font-weight="700"
      font-family="Outfit,sans-serif">⅑ F</text>
  </g>

  <!-- Explanation box -->
  <rect x="12" y="225" width="496" height="58" rx="8" fill="rgba(2,6,23,0.8)"
    stroke="rgba(239,68,68,0.3)" stroke-width="1"/>
  <text x="26" y="245" fill="rgba(255,255,255,0.85)" font-size="11"
    font-family="Outfit,sans-serif">Double the distance → force is ¼ as strong  (2² = 4)</text>
  <text x="26" y="264" fill="rgba(255,255,255,0.85)" font-size="11"
    font-family="Outfit,sans-serif">Triple the distance → force is ⅑ as strong  (3² = 9)</text>
  <text x="26" y="276" fill="rgba(239,68,68,0.6)" font-size="9" font-style="italic"
    font-family="Outfit,sans-serif">Inverse Square Law: F ∝ 1 / r²</text>

  <!-- Final equation callout -->
  <rect x="158" y="298" width="204" height="48" rx="10" fill="rgba(239,68,68,0.1)"
    stroke="rgba(239,68,68,0.5)" stroke-width="1.5"/>
  <text x="260" y="326" fill="#fbbf24" font-size="20" font-weight="700" font-style="italic"
    text-anchor="middle" font-family="Georgia,serif">F ∝ m / r²</text>
</svg>
`;

const SVG_SYMMETRY = /* html */`
<svg viewBox="0 0 520 360" style="width:100%;height:100%;display:block;">
  <defs>
    <marker id="gi-arrow-orange-sym" markerWidth="10" markerHeight="10" refX="7" refY="3"
      orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#f97316"/></marker>
    <marker id="gi-arrow-blue-sym" markerWidth="10" markerHeight="10" refX="7" refY="3"
      orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#38bdf8"/></marker>
    <radialGradient id="gi-sun-sym" cx="40%" cy="35%">
      <stop offset="0%"  stop-color="#fff"/>
      <stop offset="35%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="rgba(251,191,36,0)"/>
    </radialGradient>
    <filter id="gi-glow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      @keyframes gi-pulse { 0%,100%{opacity:.3} 50%{opacity:.7} }
      @keyframes gi-twinkle5 { 0%,100%{opacity:.3} 50%{opacity:.9} }
    </style>
  </defs>

  <rect width="520" height="360" fill="#020617"/>

  <!-- Stars -->
  <circle cx="15"  cy="25"  r="1.0" fill="#fff" style="animation:gi-twinkle5 2.1s ease-in-out infinite"/>
  <circle cx="505" cy="15"  r="0.9" fill="#fff" style="animation:gi-twinkle5 3.2s ease-in-out infinite"/>
  <circle cx="260" cy="30"  r="1.2" fill="#fff" style="animation:gi-twinkle5 2.7s ease-in-out infinite"/>
  <circle cx="30"  cy="340" r="1.1" fill="#fff" style="animation:gi-twinkle5 4.0s ease-in-out infinite"/>
  <circle cx="490" cy="335" r="1.0" fill="#fff" style="animation:gi-twinkle5 1.9s ease-in-out infinite"/>

  <!-- Gravity field auras -->
  <circle cx="130" cy="185" r="110" fill="#fbbf24" opacity="0.03"
    style="animation:gi-pulse 3s ease-in-out infinite"/>
  <circle cx="380" cy="185" r="90"  fill="#38bdf8" opacity="0.04"
    style="animation:gi-pulse 3s ease-in-out infinite 0.5s"/>

  <!-- Newton's 3rd Law header -->
  <rect x="145" y="12" width="230" height="36" rx="8"
    fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  <text x="260" y="28" fill="#fff" font-size="12" font-weight="700"
    text-anchor="middle" letter-spacing="1" font-family="Outfit,sans-serif">NEWTON'S 3RD LAW</text>
  <text x="260" y="41" fill="#94a3b8" font-size="9.5" text-anchor="middle"
    font-family="Outfit,sans-serif">Equal &amp; Opposite Forces</text>

  <!-- Distance label r -->
  <line x1="130" y1="265" x2="380" y2="265" stroke="#475569" stroke-dasharray="4,4" stroke-width="1.2"/>
  <line x1="130" y1="258" x2="130" y2="272" stroke="#475569" stroke-width="1.5"/>
  <line x1="380" y1="258" x2="380" y2="272" stroke="#475569" stroke-width="1.5"/>
  <text x="255" y="282" fill="#94a3b8" font-size="16" font-style="italic"
    text-anchor="middle" font-family="Georgia,serif">r</text>

  <!-- Sun (M) -->
  <circle cx="130" cy="185" r="100" fill="url(#gi-sun-sym)" opacity="0.28"/>
  <circle cx="130" cy="185" r="40" fill="#fbbf24"/>
  <circle cx="130" cy="185" r="28" fill="#fde68a"/>
  <text x="130" y="192" fill="#78350f" font-size="22" font-weight="800"
    text-anchor="middle" font-family="Georgia,serif">M</text>
  <text x="130" y="140" fill="#fbbf24" font-size="12" font-weight="700"
    text-anchor="middle" font-family="Outfit,sans-serif">Sun's Mass</text>

  <!-- Planet (m) -->
  <circle cx="380" cy="185" r="18" fill="#38bdf8"/>
  <circle cx="375" cy="180" r="5" fill="#7dd3fc" opacity="0.6"/>
  <text x="380" y="191" fill="#0c4a6e" font-size="17" font-weight="800"
    text-anchor="middle" font-family="Georgia,serif">m</text>
  <text x="380" y="148" fill="#38bdf8" font-size="12" font-weight="700"
    text-anchor="middle" font-family="Outfit,sans-serif">Planet's Mass</text>

  <!-- Sun pulls planet (orange arrow) -->
  <line x1="362" y1="173" x2="210" y2="173" stroke="#f97316" stroke-width="5"
    marker-end="url(#gi-arrow-orange-sym)"/>
  <text x="288" y="162" fill="#f97316" font-size="10" font-weight="600"
    text-anchor="middle" font-family="Outfit,sans-serif">Sun pulls planet</text>

  <!-- Planet pulls Sun (blue arrow) -->
  <line x1="170" y1="197" x2="322" y2="197" stroke="#38bdf8" stroke-width="5"
    marker-end="url(#gi-arrow-blue-sym)"/>
  <text x="246" y="218" fill="#38bdf8" font-size="10" font-weight="600"
    text-anchor="middle" font-family="Outfit,sans-serif">Planet pulls Sun</text>

  <!-- Final equation glow box -->
  <rect x="115" y="296" width="290" height="52" rx="10"
    fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.6)" stroke-width="1.5"
    filter="url(#gi-glow)"/>
  <text x="260" y="322" fill="#fbbf24" font-size="21" font-weight="700"
    text-anchor="middle" font-style="italic" font-family="Georgia,serif">F = G · M · m / r²</text>
  <text x="260" y="339" fill="rgba(255,255,255,0.45)" font-size="9"
    text-anchor="middle" font-family="Outfit,sans-serif">Newton's Law of Universal Gravitation</text>
</svg>
`;

// ---------- Step metadata (text + SVG pairing) --------------------------------

const STEPS = [
  {
    label: 'Step 1 of 5 — The Universal Insight',
    svg: SVG_INTRO,
  },
  {
    label: 'Step 2 of 5 — Circular Motion & Centripetal Force',
    svg: SVG_CENTRIPETAL,
  },
  {
    label: "Step 3 of 5 — Kepler's Clue",
    svg: SVG_KEPLER,
  },
  {
    label: 'Step 4 of 5 — The Inverse Square Law',
    svg: SVG_INVERSE_SQUARE,
  },
  {
    label: 'Step 5 of 5 — Perfect Symmetry',
    svg: SVG_SYMMETRY,
  },
];

// ---------- Styles -----------------------------------------------------------

const STYLES = `
  #gi-canvas-overlay {
    position: fixed;
    top: 0;
    left: 400px;
    right: 0;
    bottom: 0;
    z-index: 15;
    background: #020617;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    overflow: hidden;
    pointer-events: none;
  }

  #gi-canvas-overlay.gi-visible {
    pointer-events: auto;
  }

  .gi-step-label {
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #38bdf8;
    text-align: center;
    margin-bottom: 4px;
  }

  .gi-svg-wrapper {
    width: 92%;
    max-width: 600px;
    aspect-ratio: 520/360;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(30,41,59,0.8);
    box-shadow: 0 0 40px rgba(0,0,0,0.7), 0 0 80px rgba(56,189,248,0.06);
    background: #020617;
    position: relative;
  }

  .gi-nav-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .gi-dot-row {
    display: flex;
    gap: 6px;
  }

  .gi-dot2 {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(56,189,248,0.2);
    border: 1px solid rgba(56,189,248,0.3);
    transition: background 0.2s;
  }

  .gi-dot2.gi-active {
    background: #38bdf8;
    box-shadow: 0 0 6px rgba(56,189,248,0.6);
  }

  .gi-nbtn {
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    font-weight: 700;
    padding: 7px 18px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    outline: none;
    transition: background 0.15s, opacity 0.15s, transform 0.1s;
    pointer-events: auto;
  }

  .gi-nbtn:active { transform: scale(0.96); }
  .gi-nbtn:disabled { opacity: 0.3; cursor: default; }

  .gi-nbtn-back {
    background: rgba(30,41,59,0.9);
    color: #94a3b8;
    border: 1px solid rgba(100,116,139,0.3);
  }

  .gi-nbtn-back:hover:not(:disabled) {
    background: #334155;
    color: #e2e8f0;
  }

  .gi-nbtn-next {
    background: #2563eb;
    color: #fff;
    box-shadow: 0 0 12px rgba(37,99,235,0.4);
  }

  .gi-nbtn-next:hover:not(:disabled) {
    background: #3b82f6;
    box-shadow: 0 0 20px rgba(59,130,246,0.55);
  }

  .gi-live-chip {
    position: absolute;
    top: 8px;
    right: 8px;
    font-family: 'Outfit', sans-serif;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #38bdf8;
    background: rgba(2,6,23,0.7);
    border: 1px solid rgba(56,189,248,0.3);
    border-radius: 999px;
    padding: 3px 8px;
    display: flex;
    align-items: center;
    gap: 5px;
    pointer-events: none;
  }

  .gi-live-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #38bdf8;
    animation: gi-pulse-dot 1.8s ease-in-out infinite;
  }

  @keyframes gi-pulse-dot {
    0%,100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
`;

// ---------- Class -----------------------------------------------------------

export class GravityIllustration {
  /**
   * @param {function} onStepChange  Optional callback(step) when nav buttons change step
   */
  constructor(onStepChange) {
    this.onStepChange = onStepChange || null;
    this._step = 0;
    this._visible = false;

    // Inject stylesheet once per document
    if (!document.getElementById('gi-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'gi-styles';
      styleEl.textContent = STYLES;
      document.head.appendChild(styleEl);
    }

    // Build overlay
    this._overlay = document.createElement('div');
    this._overlay.id = 'gi-canvas-overlay';
    this._overlay.style.display = 'none';

    // Step label
    this._label = document.createElement('div');
    this._label.className = 'gi-step-label';
    this._overlay.appendChild(this._label);

    // SVG wrapper
    this._svgWrapper = document.createElement('div');
    this._svgWrapper.className = 'gi-svg-wrapper';

    // Live chip
    const chip = document.createElement('div');
    chip.className = 'gi-live-chip';
    chip.innerHTML = '<span class="gi-live-dot"></span>Live Animation';
    this._svgWrapper.appendChild(chip);
    this._overlay.appendChild(this._svgWrapper);

    // Nav row
    this._nav = document.createElement('div');
    this._nav.className = 'gi-nav-row';

    this._backBtn = document.createElement('button');
    this._backBtn.className = 'gi-nbtn gi-nbtn-back';
    this._backBtn.textContent = '← Back';
    this._backBtn.addEventListener('click', () => this._navigate(-1));

    this._dotRow = document.createElement('div');
    this._dotRow.className = 'gi-dot-row';
    for (let i = 0; i < STEPS.length; i++) {
      const d = document.createElement('div');
      d.className = 'gi-dot2';
      this._dotRow.appendChild(d);
    }

    this._nextBtn = document.createElement('button');
    this._nextBtn.className = 'gi-nbtn gi-nbtn-next';
    this._nextBtn.textContent = 'Next →';
    this._nextBtn.addEventListener('click', () => this._navigate(+1));

    this._nav.appendChild(this._backBtn);
    this._nav.appendChild(this._dotRow);
    this._nav.appendChild(this._nextBtn);
    this._overlay.appendChild(this._nav);

    // Append to body (not spoke-container)
    document.body.appendChild(this._overlay);

    this._render();
  }

  // ── Public API ──────────────────────────────────────────────

  setStep(step) {
    this._step = Math.max(0, Math.min(STEPS.length - 1, step));
    this._render();
  }

  getStep() { return this._step; }

  show() {
    this._overlay.style.display = 'flex';
    this._overlay.classList.add('gi-visible');
    this._visible = true;
  }

  hide() {
    this._overlay.style.display = 'none';
    this._overlay.classList.remove('gi-visible');
    this._visible = false;
  }

  isVisible() { return this._visible; }

  destroy() {
    if (this._overlay && this._overlay.parentNode) {
      this._overlay.parentNode.removeChild(this._overlay);
    }
    const style = document.getElementById('gi-styles');
    if (style) style.parentNode && style.parentNode.removeChild(style);
  }

  // ── Private ─────────────────────────────────────────────────

  _render() {
    const data = STEPS[this._step];

    // Update label
    this._label.textContent = data.label;

    // Update SVG (keep the live chip)
    const chip = this._svgWrapper.querySelector('.gi-live-chip');
    this._svgWrapper.innerHTML = data.svg;
    if (chip) this._svgWrapper.appendChild(chip);

    // Update dots
    Array.from(this._dotRow.children).forEach((d, i) => {
      d.className = 'gi-dot2' + (i === this._step ? ' gi-active' : '');
    });

    // Update buttons
    this._backBtn.disabled = this._step === 0;
    this._nextBtn.textContent = this._step === STEPS.length - 1 ? 'Done ✓' : 'Next →';
    this._nextBtn.disabled = this._step === STEPS.length - 1;
  }

  _navigate(delta) {
    const newStep = Math.max(0, Math.min(STEPS.length - 1, this._step + delta));
    if (newStep === this._step) return;
    this._step = newStep;
    this._render();
    if (this.onStepChange) this.onStepChange(this._step);
  }
}

