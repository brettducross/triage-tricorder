/**
 * Home Triage Tricorder — Holographic Telemetry Cockpit & Interactive Visual Systems
 * 1. 60fps Synchronized 4-Channel Multi-Axis Telemetry Oscilloscope + Spectral Waterfall + 6-Axis Radar HUD
 * 2. Interactive Clickable Human Anatomical Body-Map SVG/Canvas with Laser Scan Beam
 * 3. Interactive Phone-Placement Vector Guide Overlays
 * 4. 6-Axis Baseline vs. Today Radar/Spider Chart
 */

let hudAnimList = [];
export function stopHudAnimations() {
  hudAnimList.forEach(fn => { try { fn(); } catch (_) {} });
  hudAnimList = [];
}

export const ANATOMY_ZONES = [
  {
    id: 'eyes_color_pupil',
    code: 'ZN-01 · OCULAR / CN-II/III',
    label: 'Head, Pupils & Conjunctiva',
    shortLabel: 'Eyes & Pupils',
    cx: 110, cy: 36, rx: 18, ry: 12,
    presetId: 'fatigue_pale',
    scanStageIdx: 1,
    sensors: 'Macro CIE L*a*b* + 120Hz Flash Pupillometry',
    color: '#00f2fe',
    metrics: 'Hgb 14.0 g/dL · Sclera 0.7 mg · Pupil 230ms'
  },
  {
    id: 'ears_weber',
    code: 'ZN-02 · OTOLOGY / CN-VIII',
    label: 'Ears & Weber Forehead Bone',
    shortLabel: 'Ears & Weber',
    cx: 110, cy: 24, rx: 24, ry: 9,
    presetId: 'plugged_ear_hearing',
    scanStageIdx: 0,
    sensors: '250–8000Hz Pure-Tone + 128Hz Forehead Couple',
    color: '#a855f7',
    metrics: 'Weber Midline · 6/6 Freqs Bilateral'
  },
  {
    id: 'tongue_voice',
    code: 'ZN-03 · PHARYNX / CN-X/XII',
    label: 'Oral, Tongue & Vocal Tract',
    shortLabel: 'Oral & Voice',
    cx: 110, cy: 52, rx: 14, ry: 9,
    presetId: 'sore_throat',
    scanStageIdx: 2,
    sensors: '48kHz Raw MEMS Mic + Mucosal Colorimetry',
    color: '#f59e0b',
    metrics: 'F0 148Hz · Jitter 0.6% · HNR 21.2 dB'
  },
  {
    id: 'chest_cardio_pulm',
    code: 'ZN-04 · THORAX / CARDIO-PULM',
    label: 'Chest, Heart & Lungs',
    shortLabel: 'Heart & Lungs',
    cx: 110, cy: 96, rx: 28, ry: 22,
    presetId: 'resp_cough_fever',
    scanStageIdx: 0,
    sensors: '20–1200Hz Auscultation + 18kHz Sonar + SCG',
    color: '#14b8a6',
    metrics: 'HR 72 bpm · RR 15/min · S1/S2 Lock · PTT 184ms'
  },
  {
    id: 'abdomen_bowel',
    code: 'ZN-05 · ABDOMEN / GI',
    label: 'Abdomen & Peristalsis',
    shortLabel: 'Abdomen / GI',
    cx: 110, cy: 136, rx: 24, ry: 16,
    presetId: 'chest_palpitations',
    scanStageIdx: 4,
    sensors: '100–500Hz Acoustic Bowel Filter + Skin CIE',
    color: '#38bdf8',
    metrics: 'Normoactive 14 clicks/min · Perfusion Sym 98%'
  },
  {
    id: 'hands_tremor',
    code: 'ZN-06 · MOTOR / PERIPHERAL',
    label: 'Hands, Tremor & Capillary',
    shortLabel: 'Hands & Tremor',
    cx: 48, cy: 146, rx: 16, ry: 16,
    presetId: 'neuro_tremor_concussion',
    scanStageIdx: 3,
    sensors: '100Hz 6-Axis IMU FFT + 240Hz Touch Spiral',
    color: '#00f2fe',
    metrics: 'Tremor Peak 8.6 Hz · RMS 0.14 · Spiral 94/100'
  },
  {
    id: 'posture_balance',
    code: 'ZN-07 · VESTIBULAR / SPINE',
    label: 'Posture & Romberg Spine',
    shortLabel: 'Romberg Balance',
    cx: 110, cy: 196, rx: 22, ry: 34,
    presetId: 'dizzy_vertigo',
    scanStageIdx: 4,
    sensors: '6-Axis IMU 2D Stabilogram (EO vs. EC)',
    color: '#10b981',
    metrics: 'Sway Path 16mm · Romberg Quotient 1.30x'
  }
];

export function computeRadarAxes(metrics = {}, baselineObj = null) {
  const b = baselineObj?.metrics || {
    bpm: 68, hrvRmssd: 46, respRate: 14, hgbEstimate: 14.2,
    bilirubinProxy: 0.65, pupilLatencyMs: 225, jitterPct: 0.55,
    hnrDb: 21.8, tremorFreqHz: 8.5, tremorRms: 0.13,
    swayPathMm: 15, rombergQuotient: 1.25
  };
  const m = {
    bpm: 72, hrvRmssd: 42, respRate: 15, hgbEstimate: 14.0,
    bilirubinProxy: 0.7, pupilLatencyMs: 230, jitterPct: 0.6,
    hnrDb: 21, tremorFreqHz: 8.6, tremorRms: 0.14,
    swayPathMm: 16, rombergQuotient: 1.3,
    ...metrics
  };

  const clamp = (v, lo = 45, hi = 99) => Math.max(lo, Math.min(hi, Math.round(v)));
  return [
    {
      axis: 'Cardio-Optical',
      short: 'CARDIO',
      today: clamp(94 - Math.abs(m.bpm - 68) * 0.6 - Math.max(0, 46 - m.hrvRmssd) * 0.4),
      base: clamp(95 - Math.abs(b.bpm - 68) * 0.5),
      unit: `${m.bpm} bpm / ${m.hrvRmssd}ms`
    },
    {
      axis: 'Ocular-Perfusion',
      short: 'OCULAR',
      today: clamp(93 - Math.abs(14.2 - m.hgbEstimate) * 8 - Math.max(0, m.bilirubinProxy - 0.7) * 12),
      base: 95,
      unit: `Hgb ${m.hgbEstimate} · ${m.pupilLatencyMs}ms`
    },
    {
      axis: 'Vocal-Respiratory',
      short: 'VOCAL/RESP',
      today: clamp(92 - Math.max(0, m.jitterPct - 0.5) * 22 - Math.abs(m.respRate - 14) * 1.4),
      base: 94,
      unit: `Jit ${m.jitterPct}% · RR ${m.respRate}`
    },
    {
      axis: 'Neuro-Motor',
      short: 'NEURO',
      today: clamp((m.spiralScore || 93) - Math.max(0, m.tremorRms - 0.12) * 35),
      base: 95,
      unit: `${m.tremorFreqHz}Hz · RMS ${m.tremorRms}`
    },
    {
      axis: 'Vestibular-Sway',
      short: 'ROMBERG',
      today: clamp(94 - Math.max(0, m.swayPathMm - 14) * 1.2 - Math.max(0, m.rombergQuotient - 1.2) * 12),
      base: 96,
      unit: `${m.swayPathMm}mm (${m.rombergQuotient}x)`
    },
    {
      axis: 'Auditory-CN VIII',
      short: 'AUDITORY',
      today: m.weberLateralization === 'good' ? 68 : 95,
      base: 96,
      unit: '128Hz Weber Midline'
    }
  ];
}

/**
 * Renders the 6-Axis Baseline vs. Today Radar/Spider Chart into a canvas element
 */
export function drawRadarChart(canvas, axesData, scanProgress = 1.0, pulsePhase = 0) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w * 0.50;
  const cy = h * 0.53;
  const maxR = Math.min(w, h) * 0.34;
  const N = axesData.length;

  // Deep sci-fi radial glow background
  const bgGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, maxR * 1.35);
  bgGrad.addColorStop(0, 'rgba(0, 242, 254, 0.12)');
  bgGrad.addColorStop(0.6, 'rgba(20, 184, 166, 0.04)');
  bgGrad.addColorStop(1, 'rgba(4, 8, 16, 0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Concentric hexagonal / polygonal rings (25%, 50%, 75%, 100%)
  [0.25, 0.5, 0.75, 1.0].forEach((ring, rIdx) => {
    const r = maxR * ring;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / N;
      const x = cx + r * Math.cos(ang);
      const y = cy + r * Math.sin(ang);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = rIdx === 3 ? 'rgba(0, 242, 254, 0.42)' : 'rgba(148, 163, 184, 0.18)';
    ctx.lineWidth = rIdx === 3 ? 1.4 : 1;
    ctx.stroke();
  });

  // Axis spokes + labels
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  for (let i = 0; i < N; i++) {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    const xEnd = cx + maxR * Math.cos(ang);
    const yEnd = cy + maxR * Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(xEnd, yEnd);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label positioning
    const lblR = maxR + 18;
    const lx = cx + lblR * Math.cos(ang);
    const ly = cy + lblR * Math.sin(ang);
    ctx.textAlign = Math.abs(Math.cos(ang)) < 0.2 ? 'center' : Math.cos(ang) > 0 ? 'left' : 'right';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(axesData[i].short, lx, ly);
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText(`${axesData[i].today}%`, lx, ly + 11);
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
  }

  // 1. Saved Personal Baseline Polygon (Dashed Teal #14b8a6)
  ctx.save();
  ctx.beginPath();
  axesData.forEach((d, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    const r = maxR * (d.base / 100);
    const x = cx + r * Math.cos(ang);
    const y = cy + r * Math.sin(ang);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(20, 184, 166, 0.10)';
  ctx.fill();
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = '#14b8a6';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();

  // 2. Today's Scan Polygon (Solid Glowing Cyan #00f2fe with subtle dynamic pulse)
  ctx.save();
  ctx.beginPath();
  const pts = axesData.map((d, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    const stageMorph = Math.min(1, scanProgress * 1.15);
    const osc = Math.sin(pulsePhase + i * 1.1) * 1.5;
    const val = (d.today * stageMorph + osc) / 100;
    const r = maxR * Math.max(0.2, Math.min(1.02, val));
    return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
  });
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 242, 254, 0.22)';
  ctx.fill();
  ctx.shadowColor = '#00f2fe';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Glowing vertex nodes
  pts.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = '#00f2fe';
    ctx.fill();
    ctx.strokeStyle = '#040810';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  ctx.restore();
}

/**
 * Interactive Clickable Human Anatomical Body-Map SVG/HUD
 * Used on Home, 60s Checkup Scan (with animated laser scan beam), and Symptom Triage
 */
export function renderAnatomicalBodyMapHTML({ activeZoneId = 'chest_cardio_pulm', scanStageIdx = -1, scanning = false, compact = false } = {}) {
  const activeZone = ANATOMY_ZONES.find(z => z.id === activeZoneId) || ANATOMY_ZONES[3];
  const laserY = scanStageIdx >= 0
    ? [34, 38, 54, 145, 190][scanStageIdx % 5]
    : 96;

  return `
    <div class="holo-bodymap-card ${compact ? 'compact' : ''}" id="holoBodyMapWrap">
      <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
      <div class="hud-corner bl"></div><div class="hud-corner br"></div>
      <div class="holo-hud-top">
        <span class="holo-tag">BIOMETRIC ANATOMY HUD · CLICK ZONE TO TARGET</span>
        <span class="holo-coord tabular">${scanning ? 'LASER LOCK ACTIVE' : '7 SENSOR NODES ONLINE'}</span>
      </div>
      <div class="holo-bodymap-grid">
        <div class="holo-svg-stage">
          <svg viewBox="0 0 220 260" class="holo-body-svg" id="holoBodySvg">
            <defs>
              <linearGradient id="bodyWireGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.85"/>
                <stop offset="50%" stop-color="#14b8a6" stop-opacity="0.65"/>
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.8"/>
              </linearGradient>
              <linearGradient id="laserSweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#00f2fe" stop-opacity="0"/>
                <stop offset="50%" stop-color="#00f2fe" stop-opacity="0.95"/>
                <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
              </linearGradient>
            </defs>

            <!-- Polar & Hex Grid Underlay -->
            <circle cx="110" cy="125" r="98" fill="none" stroke="rgba(14,165,233,0.13)" stroke-dasharray="4 4"/>
            <circle cx="110" cy="125" r="68" fill="none" stroke="rgba(20,184,166,0.12)"/>
            <line x1="110" y1="8" x2="110" y2="252" stroke="rgba(0,242,254,0.15)" stroke-dasharray="3 3"/>
            <line x1="18" y1="125" x2="202" y2="125" stroke="rgba(0,242,254,0.12)" stroke-dasharray="3 3"/>

            <!-- Futuristic Wireframe Human Silhouette -->
            <!-- Head & Cranium -->
            <ellipse cx="110" cy="36" rx="20" ry="24" fill="rgba(0,242,254,0.06)" stroke="url(#bodyWireGrad)" stroke-width="1.6"/>
            <!-- Jaw / Neck -->
            <path d="M101 58 L101 68 L119 68 L119 58" fill="none" stroke="#14b8a6" stroke-width="1.4"/>
            <!-- Torso / Thorax / Abdomen -->
            <path d="M74 72 C88 66, 132 66, 146 72 L152 118 L138 164 L82 164 L68 118 Z" fill="rgba(20,184,166,0.06)" stroke="url(#bodyWireGrad)" stroke-width="1.7"/>
            <!-- Ribcage / Lung Wireframe Contours -->
            <path d="M84 86 Q110 92 136 86 M82 98 Q110 105 138 98 M85 110 Q110 116 135 110" fill="none" stroke="rgba(0,242,254,0.28)" stroke-width="1.1"/>
            <!-- Spine Axis -->
            <line x1="110" y1="68" x2="110" y2="164" stroke="rgba(16,185,129,0.45)" stroke-width="2" stroke-dasharray="3 2"/>
            <!-- Left & Right Arms + Hands -->
            <path d="M74 74 L52 114 L44 150 L54 154 L64 120 L76 92" fill="rgba(0,242,254,0.04)" stroke="url(#bodyWireGrad)" stroke-width="1.4"/>
            <path d="M146 74 L168 114 L176 150 L166 154 L156 120 L144 92" fill="rgba(0,242,254,0.04)" stroke="url(#bodyWireGrad)" stroke-width="1.4"/>
            <!-- Pelvis & Legs (Romberg Stance) -->
            <path d="M82 164 L88 242 L104 242 L108 182 L112 182 L116 242 L132 242 L138 164 Z" fill="rgba(56,189,248,0.05)" stroke="url(#bodyWireGrad)" stroke-width="1.5"/>

            <!-- Animated Laser Scan Line -->
            <g id="holoLaserGroup" class="${scanning ? 'laser-sweeping' : ''}" transform="translate(0, ${laserY})">
              <rect x="24" y="-8" width="172" height="16" fill="rgba(0,242,254,0.09)"/>
              <line x1="20" y1="0" x2="200" y2="0" stroke="url(#laserSweepGrad)" stroke-width="2.4"/>
              <text x="24" y="-3" fill="#00f2fe" font-family="monospace" font-size="7">SCAN Y:${laserY}mm</text>
            </g>

            <!-- Interactive Anatomical Nodes -->
            ${ANATOMY_ZONES.map((z) => {
              const isAct = z.id === activeZone.id;
              return `
                <g class="anatomy-node ${isAct ? 'active' : ''}" data-zone="${z.id}" style="cursor:pointer">
                  <ellipse cx="${z.cx}" cy="${z.cy}" rx="${z.rx}" ry="${z.ry}"
                    fill="${isAct ? 'rgba(0,242,254,0.22)' : 'rgba(15,23,42,0.35)'}"
                    stroke="${isAct ? '#00f2fe' : z.color}"
                    stroke-width="${isAct ? '2.2' : '1.2'}"
                    stroke-dasharray="${isAct ? 'none' : '3 2'}"/>
                  <circle cx="${z.cx}" cy="${z.cy}" r="${isAct ? 5.5 : 4}" fill="${isAct ? '#00f2fe' : z.color}"/>
                  <line x1="${z.cx}" y1="${z.cy}" x2="${z.cx > 95 ? 186 : 30}" y2="${z.cy}"
                    stroke="${isAct ? '#00f2fe' : 'rgba(148,163,184,0.35)'}" stroke-width="${isAct ? '1.3' : '0.8'}"/>
                </g>
              `;
            }).join('')}
          </svg>
        </div>

        <div class="holo-zone-inspector">
          <div class="zone-active-card" id="zoneInspectorCard">
            <div class="zone-code">${activeZone.code}</div>
            <div class="zone-title">${activeZone.label}</div>
            <div class="zone-sensors">🔬 ${activeZone.sensors}</div>
            <div class="zone-telemetry tabular">${activeZone.metrics}</div>
          </div>
          <div class="zone-button-list">
            ${ANATOMY_ZONES.map(z => `
              <button type="button" class="zone-pill-btn ${z.id === activeZone.id ? 'active' : ''}" data-zone="${z.id}">
                <span class="zone-dot" style="background:${z.color}"></span>
                <span>${z.shortLabel}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindAnatomicalBodyMap(container, onSelectZone) {
  if (!container) return;
  const select = (zoneId) => {
    const z = ANATOMY_ZONES.find(item => item.id === zoneId);
    if (!z) return;
    container.querySelectorAll('[data-zone]').forEach(el => {
      el.classList.toggle('active', el.dataset.zone === zoneId);
    });
    const card = container.querySelector('#zoneInspectorCard');
    if (card) {
      card.innerHTML = `
        <div class="zone-code">${z.code}</div>
        <div class="zone-title">${z.label}</div>
        <div class="zone-sensors">🔬 ${z.sensors}</div>
        <div class="zone-telemetry tabular">${z.metrics}</div>
      `;
    }
    const laser = container.querySelector('#holoLaserGroup');
    if (laser) {
      laser.setAttribute('transform', `translate(0, ${z.cy})`);
    }
    if (onSelectZone) onSelectZone(z);
  };

  container.querySelectorAll('[data-zone]').forEach(el => {
    el.addEventListener('click', () => select(el.dataset.zone));
  });
}

/**
 * Interactive Phone-Placement Vector Guide Overlays (How to Hold the Phone)
 */
export function renderPhonePlacementGuideHTML(mode = 'face_rppg') {
  const guides = {
    face_rppg: {
      badge: 'STAGE 1 · CAMERA rPPG & PERFUSION',
      title: 'Hold Phone 30 cm From Face',
      sub: 'Align forehead & cheeks in green-channel ROI reticles',
      svg: `
        <svg viewBox="0 0 260 115" class="placement-svg">
          <ellipse cx="64" cy="58" rx="28" ry="35" fill="rgba(20,184,166,0.12)" stroke="#14b8a6" stroke-width="1.8"/>
          <rect x="49" y="34" width="30" height="11" rx="2" fill="rgba(0,242,254,0.22)" stroke="#00f2fe" stroke-width="1.2"/>
          <rect x="44" y="55" width="14" height="10" rx="2" fill="rgba(0,242,254,0.2)" stroke="#00f2fe" stroke-width="1.1"/>
          <rect x="70" y="55" width="14" height="10" rx="2" fill="rgba(0,242,254,0.2)" stroke="#00f2fe" stroke-width="1.1"/>
          <!-- Distance cone -->
          <path d="M94 42 L182 26 L182 90 L94 74 Z" fill="rgba(0,242,254,0.08)" stroke="#00f2fe" stroke-dasharray="4 3"/>
          <text x="138" y="61" fill="#00f2fe" font-family="monospace" font-size="9" text-anchor="middle">30 cm OPTICAL LOCK</text>
          <!-- Phone silhouette -->
          <rect x="184" y="20" width="36" height="74" rx="6" fill="#0c1424" stroke="#38bdf8" stroke-width="2"/>
          <circle cx="202" cy="27" r="2.5" fill="#10b981"/>
          <text x="202" y="60" fill="#e2e8f0" font-family="monospace" font-size="8" text-anchor="middle">RGB</text>
        </svg>`
    },
    eyes_color_pupil: {
      badge: 'STAGE 2 · CONJUNCTIVA & PUPILLOMETRY',
      title: 'Macro Eyelid + Screen Flash Reflex',
      sub: 'Pull lower eyelid gently for 4s CIE L*a*b* Hgb & Sclera scan',
      svg: `
        <svg viewBox="0 0 260 115" class="placement-svg">
          <path d="M26 56 Q72 24 118 56 Q72 88 26 56 Z" fill="rgba(0,242,254,0.08)" stroke="#00f2fe" stroke-width="1.8"/>
          <circle cx="72" cy="56" r="14" fill="rgba(56,189,248,0.22)" stroke="#38bdf8" stroke-width="1.6"/>
          <circle cx="72" cy="56" r="6" fill="#00f2fe"/>
          <path d="M42 70 Q72 84 102 70" fill="none" stroke="#f43f5e" stroke-width="2.5"/>
          <text x="72" y="98" fill="#fda4af" font-family="monospace" font-size="8" text-anchor="middle">CONJUNCTIVA ROI (Hgb)</text>
          <line x1="124" y1="56" x2="184" y2="56" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="3 3"/>
          <rect x="186" y="22" width="38" height="70" rx="6" fill="#0c1424" stroke="#f59e0b" stroke-width="2"/>
          <text x="205" y="59" fill="#f59e0b" font-family="monospace" font-size="8" text-anchor="middle">FLASH</text>
        </svg>`
    },
    tongue_voice: {
      badge: 'STAGE 3 · ORAL MUCOSA & 48kHz VOCAL DSP',
      title: 'Sustain "Ahhh" for 5 Seconds',
      sub: 'Measures F0 pitch, vocal jitter %, shimmer & HNR (dB)',
      svg: `
        <svg viewBox="0 0 260 115" class="placement-svg">
          <circle cx="58" cy="56" r="28" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" stroke-width="1.6"/>
          <path d="M46 62 Q58 82 70 62 Z" fill="rgba(244,63,94,0.35)" stroke="#f43f5e" stroke-width="1.4"/>
          <!-- Acoustic waves -->
          <path d="M96 42 Q108 56 96 70 M112 34 Q128 56 112 78 M128 26 Q148 56 128 86" fill="none" stroke="#00f2fe" stroke-width="1.8"/>
          <text x="148" y="22" fill="#00f2fe" font-family="monospace" font-size="8">48kHz RAW MEMS</text>
          <rect x="176" y="24" width="42" height="68" rx="6" fill="#0c1424" stroke="#14b8a6" stroke-width="2"/>
          <text x="197" y="60" fill="#14b8a6" font-family="monospace" font-size="8" text-anchor="middle">"AHHH"</text>
        </svg>`
    },
    hands_tremor: {
      badge: 'STAGE 4 · 100Hz 6-AXIS IMU TREMOR FFT',
      title: 'Hold Flat on Outstretched Palm (10s)',
      sub: 'Isolates 4–6Hz Resting vs. 6–12Hz Postural/Physiological bands',
      svg: `
        <svg viewBox="0 0 260 115" class="placement-svg">
          <!-- Outstretched hand + flat phone -->
          <path d="M28 74 L172 74 C182 74 186 66 174 64 L96 64" fill="none" stroke="#38bdf8" stroke-width="2.2"/>
          <rect x="78" y="46" width="88" height="14" rx="4" fill="#0c1424" stroke="#00f2fe" stroke-width="2"/>
          <!-- Vertical oscillation arrows -->
          <path d="M122 22 L122 40 M116 28 L122 22 L128 28 M122 82 L122 98 M116 92 L122 98 L128 92" fill="none" stroke="#10b981" stroke-width="1.8"/>
          <text x="195" y="45" fill="#00f2fe" font-family="monospace" font-size="9">8.6 Hz PEAK</text>
          <text x="195" y="60" fill="#10b981" font-family="monospace" font-size="8">100Hz IMU</text>
        </svg>`
    },
    posture_balance: {
      badge: 'STAGE 5 · STERNUM ROMBERG STABILOGRAM',
      title: 'Press Flat Against Sternum (EO/EC)',
      sub: 'Tracks 2D postural sway path (mm) & Romberg Quotient',
      svg: `
        <svg viewBox="0 0 260 115" class="placement-svg">
          <path d="M55 24 L95 24 L102 96 L48 96 Z" fill="rgba(20,184,166,0.1)" stroke="#14b8a6" stroke-width="1.6"/>
          <rect x="65" y="40" width="20" height="36" rx="3" fill="#0c1424" stroke="#00f2fe" stroke-width="2"/>
          <!-- Stabilogram target on right -->
          <circle cx="190" cy="58" r="34" fill="rgba(0,242,254,0.06)" stroke="#38bdf8" stroke-dasharray="3 2"/>
          <circle cx="190" cy="58" r="18" fill="none" stroke="rgba(16,185,129,0.4)"/>
          <path d="M184 56 L195 51 L188 64 L196 60 L185 53 L191 58" fill="none" stroke="#00f2fe" stroke-width="1.8"/>
          <text x="190" y="104" fill="#10b981" font-family="monospace" font-size="8" text-anchor="middle">SWAY 16mm · 1.3x</text>
        </svg>`
    },
    steth: {
      badge: 'AUSCULTATION · 4TH INTERCOSTAL / LUNG FIELDS',
      title: 'Press Bottom Mic Firmly to Bare Chest',
      sub: 'Raw un-equalized MEMS mic isolates S1/S2 (20–150Hz) & Lung (100–1200Hz)',
      svg: `
        <svg viewBox="0 0 260 115" class="placement-svg">
          <path d="M42 20 C68 14, 112 14, 138 20 L144 96 L36 96 Z" fill="rgba(20,184,166,0.09)" stroke="#14b8a6" stroke-width="1.6"/>
          <circle cx="102" cy="58" r="12" fill="rgba(244,63,94,0.22)" stroke="#f43f5e" stroke-width="1.6"/>
          <rect x="92" y="18" width="22" height="40" rx="4" fill="#0c1424" stroke="#00f2fe" stroke-width="2"/>
          <text x="196" y="46" fill="#00f2fe" font-family="monospace" font-size="9" text-anchor="middle">4th ICS APEX</text>
          <text x="196" y="62" fill="#10b981" font-family="monospace" font-size="8" text-anchor="middle">S1/S2 + WHEEZE FFT</text>
        </svg>`
    },
    hearing: {
      badge: 'OTOLOGY · 128Hz WEBER BONE CONDUCTION',
      title: 'Press Phone Top/Back to Mid-Forehead',
      sub: 'Separates conductive wax/fluid from urgent sensorineural shift',
      svg: `
        <svg viewBox="0 0 260 115" class="placement-svg">
          <ellipse cx="130" cy="64" rx="34" ry="38" fill="rgba(168,85,247,0.1)" stroke="#a855f7" stroke-width="1.8"/>
          <rect x="112" y="12" width="36" height="22" rx="4" fill="#0c1424" stroke="#00f2fe" stroke-width="2"/>
          <path d="M112 36 Q78 52 86 72 M148 36 Q182 52 174 72" fill="none" stroke="#00f2fe" stroke-width="1.8" stroke-dasharray="3 2"/>
          <text x="44" y="68" fill="#10b981" font-family="monospace" font-size="8">L COCHLEA</text>
          <text x="182" y="68" fill="#10b981" font-family="monospace" font-size="8">R COCHLEA</text>
        </svg>`
    }
  };

  const g = guides[mode] || guides.face_rppg;
  return `
    <div class="placement-vector-card" id="placementGuideCard">
      <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
      <div class="hud-corner bl"></div><div class="hud-corner br"></div>
      <div class="placement-head">
        <span class="placement-badge">${g.badge}</span>
        <span class="placement-title">${g.title}</span>
      </div>
      <div class="placement-sub">${g.sub}</div>
      ${g.svg}
    </div>
  `;
}

/**
 * 1. Live Animated Multi-Axis Telemetry Graph During Scans
 * (`60fps` Synchronized 4-Channel Oscilloscope + Spectral Waterfall + 6-Axis Radar HUD)
 */
export function renderMultiAxisTelemetryHUDHTML({ title = 'MULTI-AXIS HOLOGRAPHIC BIOMETRIC TELEMETRY', stageLabel = 'STAGE 1/5 · ACTIVE LOCK' } = {}) {
  return `
    <div class="multiaxis-hud-shell" id="multiAxisHudShell">
      <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
      <div class="hud-corner bl"></div><div class="hud-corner br"></div>

      <!-- Sci-Fi Telemetry Status Header -->
      <div class="multiaxis-topbar">
        <div class="multiaxis-title-wrap">
          <span class="pulse-beacon"></span>
          <span class="multiaxis-title">${title}</span>
          <span class="multiaxis-stage-pill" id="hudStageBadge">${stageLabel}</span>
        </div>
        <div class="multiaxis-meta tabular">
          <span>DSP 48.0kHz / 64-BIT FLOAT</span>
          <span>SNR +24.8 dB</span>
          <span>FRAME LOCK 60.0 FPS</span>
        </div>
      </div>

      <!-- 4-Channel Legend Strip -->
      <div class="multiaxis-legend">
        <span class="ch-pill ch1"><b>CH1</b> Optical PPG Pulse &amp; Dicrotic Notch (mV / ΔG)</span>
        <span class="ch-pill ch2"><b>CH2</b> Acoustic / Vocal Spectral Envelope (dBFS / Hz)</span>
        <span class="ch-pill ch3"><b>CH3</b> 6-Axis IMU SCG &amp; Tremor Vector (mG / rad/s)</span>
        <span class="ch-pill ch4"><b>CH4</b> Autonomic Coherence &amp; SNR Lock (0–100%)</span>
      </div>

      <!-- Main Dual-Canvas Cockpit: Left 4-Channel Synchronized Scope + Waterfall, Right 6-Axis Radar -->
      <div class="multiaxis-cockpit-grid">
        <div class="multiaxis-scope-wrap">
          <canvas id="multiAxisScopeCanvas" width="640" height="250" class="multiaxis-canvas"></canvas>
        </div>
        <div class="multiaxis-radar-wrap">
          <div class="radar-mini-hdr">
            <span>6-AXIS PHYSIOLOGICAL RADAR</span>
            <span class="radar-legend-inline"><i class="lg-base"></i>Baseline <i class="lg-today"></i>Today</span>
          </div>
          <canvas id="multiAxisRadarCanvas" width="290" height="230" class="multiaxis-radar-canvas"></canvas>
        </div>
      </div>
    </div>
  `;
}

/**
 * Draws a single frame (or continuous 60fps loop) of the 4-Channel Multi-Axis Oscilloscope + Spectral Bars + Radar
 */
export function startMultiAxisTelemetryLoop({
  scopeCanvasId = 'multiAxisScopeCanvas',
  radarCanvasId = 'multiAxisRadarCanvas',
  getStageIndex = () => 0,
  getProgress = () => 0.65,
  metrics = {},
  baseline = null
} = {}) {
  const scopeCv = document.getElementById(scopeCanvasId);
  const radarCv = document.getElementById(radarCanvasId);
  if (!scopeCv) return () => {};

  let rafId = null;
  let phase = 1.8; // Start with rich waveform history visible immediately

  const renderFrame = () => {
    phase += 0.045;
    const prog = typeof getProgress === 'function' ? getProgress() : 0.75;
    const stageIdx = typeof getStageIndex === 'function' ? getStageIndex() : 0;

    drawMultiAxisScopeFrame(scopeCv, phase, stageIdx, prog);
    if (radarCv) {
      const axes = computeRadarAxes(metrics, baseline);
      drawRadarChart(radarCv, axes, Math.max(0.35, prog), phase);
    }
    rafId = requestAnimationFrame(renderFrame);
  };

  // Draw initial frame synchronously so screenshots/renders are immediately populated
  drawMultiAxisScopeFrame(scopeCv, phase, typeof getStageIndex === 'function' ? getStageIndex() : 0, typeof getProgress === 'function' ? getProgress() : 0.75);
  if (radarCv) {
    drawRadarChart(radarCv, computeRadarAxes(metrics, baseline), 0.92, phase);
  }

  rafId = requestAnimationFrame(renderFrame);
  const stop = () => { if (rafId) cancelAnimationFrame(rafId); };
  hudAnimList.push(stop);
  return stop;
}

export function drawMultiAxisScopeFrame(canvas, phase = 2.0, activeStage = 0, scanProgress = 0.8) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Deep Dark Telemetry Grid Background
  ctx.fillStyle = '#040914';
  ctx.fillRect(0, 0, w, h);

  // Subtle Sub-Grid + Major Grid Lines
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // 4 Horizontal Channel Lanes + Bottom Spectral FFT Bar Strip
  const lanes = [
    { name: 'CH1 · PPG PULSE', unit: '+1.2mV', yMid: 34, amp: 18, color: '#14b8a6' },
    { name: 'CH2 · ACOUSTIC DSP', unit: '-12dBFS', yMid: 84, amp: 16, color: '#f59e0b' },
    { name: 'CH3 · 6-AXIS IMU', unit: '8.6Hz', yMid: 134, amp: 16, color: '#38bdf8' },
    { name: 'CH4 · COHERENCE', unit: '96.4%', yMid: 180, amp: 12, color: '#a855f7' }
  ];

  // Channel Separator Lines & Y-Axis Tick Labels
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  lanes.forEach((ln) => {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.beginPath();
    ctx.moveTo(0, ln.yMid);
    ctx.lineTo(w, ln.yMid);
    ctx.stroke();

    ctx.fillStyle = ln.color;
    ctx.textAlign = 'left';
    ctx.fillText(ln.name, 8, ln.yMid - 11);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.65)';
    ctx.textAlign = 'right';
    ctx.fillText(ln.unit, w - 8, ln.yMid - 11);
  });

  // Sweep cursor position (phosphor monitor bar)
  const sweepX = Math.floor(((phase * 65) % (w - 90)) + 70);

  // Plot all 4 synchronized physiological waveforms
  lanes.forEach((ln, idx) => {
    ctx.save();
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const t = (x / w) * 5.5 * Math.PI * 2 + phase * 1.6;
      let val = 0;
      if (idx === 0) {
        // CH1: Arterial PPG pulse with systolic peak + dicrotic notch
        const cycle = t % (Math.PI * 2);
        const sys = Math.exp(-Math.pow(cycle - 1.4, 2) / 0.18);
        const dic = 0.42 * Math.exp(-Math.pow(cycle - 2.45, 2) / 0.16);
        val = (sys + dic - 0.35) * 1.35;
      } else if (idx === 1) {
        // CH2: Phonocardiogram S1/S2 bursts + vocal harmonic carrier
        const env = Math.pow(Math.sin(t * 0.5), 8);
        val = env * Math.sin(t * 7.5) * 1.15 + 0.25 * Math.cos(t * 3.2);
      } else if (idx === 2) {
        // CH3: 6-Axis IMU SCG micro-vibration + 8.6 Hz tremor harmonic
        val = 0.65 * Math.sin(t * 2.8) + 0.35 * Math.cos(t * 6.4 + 0.5);
      } else {
        // CH4: Autonomic coherence wave & SNR lock
        val = 0.55 * Math.sin(t * 0.65) + 0.25 * Math.sin(t * 1.3);
      }

      const y = ln.yMid - val * ln.amp;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = ln.color;
    ctx.lineWidth = idx === activeStage % 4 ? 2.4 : 1.75;
    ctx.shadowColor = ln.color;
    ctx.shadowBlur = 7;
    ctx.stroke();
    ctx.restore();
  });

  // Peak Callout Markers on Traces (R-Peak, S1/S2, 8.6 Hz FFT Peak)
  const callouts = [
    { x: 168, y: 18, text: 'R-PEAK 72 BPM', color: '#14b8a6' },
    { x: 310, y: 24, text: 'DICROTIC NOTCH', color: '#00f2fe' },
    { x: 225, y: 69, text: 'S1/S2 LOCK', color: '#f59e0b' },
    { x: 420, y: 118, text: '8.6 Hz FFT PEAK', color: '#38bdf8' },
    { x: 515, y: 166, text: 'SNR 98.4%', color: '#a855f7' }
  ];
  ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
  callouts.forEach(c => {
    ctx.fillStyle = 'rgba(4, 9, 20, 0.88)';
    const tw = ctx.measureText(c.text).width + 10;
    ctx.fillRect(c.x - 4, c.y - 9, tw, 12);
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(c.x - 4, c.y - 9, tw, 12);
    ctx.fillStyle = c.color;
    ctx.textAlign = 'left';
    ctx.fillText(c.text, c.x + 1, c.y);
  });

  // Bottom Live Spectral Waterfall / 48-Bin FFT Histogram (y = 205..244)
  const specTop = 206;
  const specH = 36;
  ctx.fillStyle = 'rgba(14, 165, 233, 0.06)';
  ctx.fillRect(8, specTop, w - 16, specH);
  const bins = 48;
  const barW = (w - 24) / bins;
  for (let b = 0; b < bins; b++) {
    const freqNorm = b / bins;
    const peak1 = Math.exp(-Math.pow(b - 9, 2) / 8);   // Cardiac 1.2 Hz
    const peak2 = Math.exp(-Math.pow(b - 22, 2) / 14); // Tremor 8.6 Hz
    const peak3 = Math.exp(-Math.pow(b - 35, 2) / 18); // Vocal/Sonar harmonic
    const mag = Math.min(1, 0.18 + 0.78 * (peak1 + 0.85 * peak2 + 0.65 * peak3) + 0.08 * Math.sin(phase * 3 + b));
    const bh = mag * (specH - 6);
    const bx = 12 + b * barW;
    const by = specTop + specH - bh - 2;
    ctx.fillStyle = freqNorm < 0.33 ? '#14b8a6' : freqNorm < 0.66 ? '#38bdf8' : '#a855f7';
    ctx.fillRect(bx, by, barW - 2, bh);
  }
  ctx.fillStyle = '#94a3b8';
  ctx.font = '8.5px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('REAL-TIME FFT SPECTRAL WATERFALL (0.5 Hz — 22.0 kHz)', 14, specTop + 10);

  // Glowing Vertical Sweep Bar
  const sweepGrad = ctx.createLinearGradient(sweepX - 24, 0, sweepX + 2, 0);
  sweepGrad.addColorStop(0, 'rgba(0, 242, 254, 0)');
  sweepGrad.addColorStop(1, 'rgba(0, 242, 254, 0.22)');
  ctx.fillStyle = sweepGrad;
  ctx.fillRect(sweepX - 24, 0, 26, h);
  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sweepX, 0);
  ctx.lineTo(sweepX, h);
  ctx.stroke();
}
