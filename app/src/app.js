import { NativeBridge } from './native-bridge.js';
import { GENERAL_SCAN_STAGES, SYMPTOM_PRESETS, matchSymptomToPreset, loadPersonalBaseline, savePersonalBaseline, computeBaselineDrift, loadScanHistory, saveScanHistoryItem } from './triage-engine.js';
import { LAB_LIST, renderLab, stopLabs, labState, drawWave } from './labs.js';
import {
  ANATOMY_ZONES,
  computeRadarAxes,
  drawRadarChart,
  renderAnatomicalBodyMapHTML,
  bindAnatomicalBodyMap,
  renderPhonePlacementGuideHTML,
  renderMultiAxisTelemetryHUDHTML,
  startMultiAxisTelemetryLoop,
  stopHudAnimations
} from './hud-visuals.js';

const root = document.getElementById('appRoot');
let caps = null, timers = [];
const clearTimers = () => { timers.forEach(clearInterval); timers = []; stopHudAnimations(); };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const R = () => ({ bpm: 72, hrvRmssd: 42, respRate: 15, hgbEstimate: 14.0, bilirubinProxy: 0.7, pupilLatencyMs: 230, jitterPct: 0.6, hnrDb: 21, tremorFreqHz: 8.6, tremorRms: 0.14, swayPathMm: 16, rombergQuotient: 1.3, ...labState.readings });

const EMERGENCY = `<div class="emergency-banner">🚨 <b>Emergency? Call 9-1-1.</b> HealthLink BC nurse line: <b>8-1-1</b> · BC Poison Control: <b>1-800-567-8911</b> · Suicide Crisis Helpline: <b>9-8-8</b>
<div class="metric-sub">Prototype screening tool only — not a diagnosis or a substitute for a clinician.</div></div>`;

function ensureDefaultBaseline() {
  let b = loadPersonalBaseline();
  if (!b) {
    b = savePersonalBaseline({
      bpm: 68, hrvRmssd: 46, respRate: 14, hgbEstimate: 14.2,
      bilirubinProxy: 0.65, pupilLatencyMs: 225, jitterPct: 0.55,
      hnrDb: 21.8, tremorFreqHz: 8.5, tremorRms: 0.13,
      swayPathMm: 15, rombergQuotient: 1.25
    });
  }
  return b;
}

async function renderStatus() {
  try { caps = await NativeBridge.detectCapabilities(); } catch (_) { caps = {}; }
  const pill = (n, ok) => `<span class="sensor-pill"><span class="sensor-dot" style="background:${ok ? '#10b981' : '#f59e0b'}"></span>${n}</span>`;
  document.getElementById('sensorStatusBar').innerHTML = [
    pill('Camera', caps.camera?.available ?? true), pill('Mic', caps.microphone?.available ?? true), pill('IMU 100Hz', caps.imu?.available ?? true),
    pill(`Touch ${caps.touchDigitizer?.targetRateHz || 240}Hz`, true), pill('WebAudio', caps.webAudioSonar?.available ?? true),
    pill('Haptics', caps.haptics?.webVibrate || caps.haptics?.coreHaptics128Hz || true), pill(caps.secureContext ? 'HTTPS' : 'Local', true),
    pill(caps.platform || 'Native Bridge', true)].join('');
}

function setupSimToggle() {
  const t = document.getElementById('simModeToggle'), lbl = document.getElementById('signalModeLabel');
  if (!t) return;
  const apply = () => { labState.sim = t.type === 'checkbox' ? t.checked : t.classList.contains('active'); if (lbl) lbl.textContent = labState.sim ? 'Simulated Demo' : 'Live Sensors'; };
  t.addEventListener(t.type === 'checkbox' ? 'change' : 'click', () => { if (t.type !== 'checkbox') t.classList.toggle('active'); apply(); });
  apply();
}

function switchTab(tab) {
  stopLabs(); clearTimers();
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  ({ home: renderHome, checkup: renderCheckup, triage: renderTriage, toolbox: renderToolbox, native: renderNative }[tab] || renderHome)();
  window.scrollTo(0, 0);
}

function driftTable() {
  const base = ensureDefaultBaseline();
  const d = computeBaselineDrift(R(), base);
  return `<div class="metric-sub" style="margin-bottom:6px;">Personal Baseline Locked · <span class="tabular" style="color:#00f2fe;">Drift Within ±6%</span></div>
  <table class="drift-table"><tr><th>Metric</th><th>Today</th><th>Baseline</th><th>Drift</th><th>Status</th></tr>
  ${d.drifts.map(r => `<tr><td>${r.label}</td><td class="tabular">${r.current}</td><td class="tabular">${r.baseline}</td><td class="tabular" style="color:${Math.abs(r.driftPct) < 12 ? '#10b981' : '#f59e0b'}">${r.driftPct > 0 ? '+' : ''}${r.driftPct}%</td><td><span style="color:#10b981">● ${r.status}</span></td></tr>`).join('')}</table>`;
}

function renderHome() {
  const base = ensureDefaultBaseline();
  root.innerHTML = `
    <div class="two-door-grid">
      <div class="door-card door-baseline" data-go="checkup">
        <div>
          <span class="door-tag">NO SYMPTOMS · MODE 1</span>
          <div class="door-title" style="margin-top:6px;">⚡ 60-Second General Checkup Scan</div>
          <div class="door-desc">5-stage holographic head-to-toe baseline: Face rPPG, Close-Up Eyes, Tongue &amp; 5s Voice, Hand Tremor FFT, and Sternum Romberg Sway.</div>
        </div>
        <div class="door-steps-preview">${GENERAL_SCAN_STAGES.map(s => `<span class="step-chip">${s.stepNumber}. ${esc(s.title.split(':')[0])}</span>`).join('')}</div>
      </div>
      <div class="door-card door-symptom" data-go="triage">
        <div>
          <span class="door-tag">SYMPTOMS · MODE 2</span>
          <div class="door-title" style="margin-top:6px;">🩺 Something's Bothering Me</div>
          <div class="door-desc">Click any anatomical region or describe symptoms → Step 1 Red-Flag Gate → Step 2 Targeted Phone Sensor Queue → 1-Tap Doctor Handoff PDF.</div>
        </div>
        <div class="door-steps-preview">
          <span class="step-chip">1. Red-Flag Screen</span>
          <span class="step-chip">2. 2–4 Sensor Exams</span>
          <span class="step-chip">3. Differential + PDF</span>
        </div>
      </div>
    </div>

    <div class="cockpit-split-grid">
      ${renderAnatomicalBodyMapHTML({ activeZoneId: 'chest_cardio_pulm', scanning: false })}

      <div class="panel-card" style="position:relative;margin-bottom:0;display:flex;flex-direction:column;justify-content:space-between;">
        <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
        <div class="hud-corner bl"></div><div class="hud-corner br"></div>
        <div class="panel-header" style="margin-bottom:8px;padding-bottom:6px;">
          <div class="panel-title">🕸️ 6-Axis Baseline vs. Today Radar</div>
          <span class="radar-legend-inline" style="font-size:0.72rem;font-family:var(--font-mono);"><i class="lg-base"></i>Baseline <i class="lg-today"></i>Today</span>
        </div>
        <div style="display:grid;grid-template-columns:235px 1fr;gap:10px;align-items:center;">
          <div style="background:#040914;border:1px solid rgba(0,242,254,0.3);border-radius:10px;padding:4px;">
            <canvas id="homeRadarCanvas" width="235" height="205" style="width:100%;height:205px;display:block;"></canvas>
          </div>
          <div>${driftTable()}</div>
        </div>
      </div>
    </div>

    <div class="panel-card" style="margin-bottom:0;">
      <div class="panel-header"><div class="panel-title">🧰 Doctor's Black Bag — Direct Sensor Instruments</div></div>
      <div class="preset-grid">${LAB_LIST.map(l => `<button class="preset-btn" data-lab="${l.id}">${l.label}</button>`).join('')}</div>
    </div>
  `;

  root.querySelectorAll('[data-go]').forEach(c => c.onclick = () => switchTab(c.dataset.go));
  root.querySelectorAll('[data-lab]').forEach(b => b.onclick = () => renderToolbox(b.dataset.lab));

  const axes = computeRadarAxes(R(), base);
  drawRadarChart(document.getElementById('homeRadarCanvas'), axes, 1.0, 1.2);

  bindAnatomicalBodyMap(document.getElementById('holoBodyMapWrap'), (zone) => {
    // Clicking a zone on Home updates the radar highlight or jumps straight into that symptom preset if double-clicked
    drawRadarChart(document.getElementById('homeRadarCanvas'), axes, 1.0, Math.random() * 3);
  });
}

function renderCheckup() {
  const base = ensureDefaultBaseline();
  let currentStageIdx = 0;
  let scanProgress = 0.78;

  const stagePlacementKey = (idx) => GENERAL_SCAN_STAGES[idx]?.id || 'face_rppg';

  root.innerHTML = `
    <div class="panel-card" style="position:relative;">
      <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
      <div class="hud-corner bl"></div><div class="hud-corner br"></div>
      <div class="panel-header">
        <div class="panel-title">⚡ 60-Second Guided Head-to-Toe Holographic Checkup</div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" id="ckStart">▶ Start 60s Multi-Sensor Scan</button>
          <button class="btn btn-emerald" id="ckSave">✔ Save Personal Baseline</button>
        </div>
      </div>

      <div class="stage-stepper">
        ${GENERAL_SCAN_STAGES.map((s, i) => `
          <span class="stage-pill ${i === 0 ? 'active' : ''}" id="sp${i}" data-stage-idx="${i}">
            <b>STAGE ${s.stepNumber} (${s.timeRange})</b><br>${esc(s.title.split(':')[0])}
          </span>
        `).join('')}
      </div>

      <div class="progress-track"><div class="progress-fill" id="ckProg" style="width:78%"></div></div>

      <!-- 1. Multi-Axis Real-Time Telemetry HUD Canvas (4-Channel Oscilloscope + FFT Waterfall + 6-Axis Radar) -->
      ${renderMultiAxisTelemetryHUDHTML({
        title: 'LIVE 4-CHANNEL SYNCHRONIZED BIOMETRIC TELEMETRY & 6-AXIS RADAR',
        stageLabel: 'STAGE 1/5 · CAMERA rPPG + CIE L*a*b* + IMU LOCK'
      })}

      <!-- 2. Interactive Anatomical Laser Scanner + Phone-Placement Vector Guide -->
      <div class="cockpit-split-grid" style="margin-top:10px;margin-bottom:8px;">
        <div id="ckBodyMapMount">
          ${renderAnatomicalBodyMapHTML({ activeZoneId: 'eyes_color_pupil', scanStageIdx: 0, scanning: true })}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;justify-content:space-between;">
          <div id="ckPlacementMount">
            ${renderPhonePlacementGuideHTML('face_rppg')}
          </div>
          <div class="panel-card" id="ckStage" style="margin:0;padding:10px 12px;background:rgba(12,20,36,0.92);">
            <div style="font-family:var(--font-mono);font-size:0.72rem;color:#00f2fe;">ACTIVE STAGE PROTOCOL</div>
            <h3 style="font-size:0.95rem;margin:2px 0;">${esc(GENERAL_SCAN_STAGES[0].title)}</h3>
            <p style="font-size:0.78rem;color:#cbd5e1;">${esc(GENERAL_SCAN_STAGES[0].placementInstruction)}</p>
          </div>
        </div>
      </div>

      <video id="ckVideo" playsinline muted autoplay style="display:none"></video>
      <div id="ckOut">
        <div class="metrics-grid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));">
          <div class="metric-box"><div class="metric-label">Heart Rate</div><div class="metric-value tabular">72 bpm</div><div class="metric-sub">rPPG Green ROI</div></div>
          <div class="metric-box"><div class="metric-label">HRV RMSSD</div><div class="metric-value tabular">42 ms</div><div class="metric-sub">Vagal Tone Lock</div></div>
          <div class="metric-box"><div class="metric-label">Resp Rate</div><div class="metric-value tabular">15 br/m</div><div class="metric-sub">RSA Envelope</div></div>
          <div class="metric-box"><div class="metric-label">Eyelid Hgb</div><div class="metric-value tabular">14.0 g/dL</div><div class="metric-sub">CIE a* Perfusion</div></div>
          <div class="metric-box"><div class="metric-label">Voice Jitter / HNR</div><div class="metric-value tabular">0.6% / 21dB</div><div class="metric-sub">48kHz MEMS</div></div>
          <div class="metric-box"><div class="metric-label">Tremor / Romberg</div><div class="metric-value tabular">8.6Hz / 1.3x</div><div class="metric-sub">100Hz 6-Axis IMU</div></div>
        </div>
        <div style="margin-top:12px;padding:10px 14px;border-radius:10px;background:linear-gradient(90deg,rgba(0,242,254,0.10),rgba(16,185,129,0.12));border:1px solid rgba(0,242,254,0.35);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div style="font-size:0.8rem;color:#e2e8f0;">
            <b style="color:#00f2fe;">👨‍👩‍👧‍👦 Track Up to 5 Family Profiles + Unlimited 1-Page Doctor Handoff PDFs:</b> <span style="color:#cbd5e1;">Early-Adopter Lifetime Pass (<s>$79/yr</s> <b>$29.99 one-time</b> · zero subscription).</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary" type="button" onclick="window.print()" style="padding:6px 12px;font-size:0.78rem;">🖨️ Print Baseline PDF</button>
            <a class="btn btn-primary" href="https://buy.stripe.com/14A28qapz5nmeUG9hMd3i0e" target="_blank" rel="noopener" style="text-decoration:none;padding:6px 12px;font-size:0.78rem;">🔓 Unlock Family Lifetime Pass ($29.99)</a>
          </div>
        </div>
      </div>
    </div>
  `;

  const stageZones = ['chest_cardio_pulm', 'eyes_color_pupil', 'tongue_voice', 'hands_tremor', 'posture_balance'];

  const setActiveStageUI = (idx) => {
    currentStageIdx = idx;
    const s = GENERAL_SCAN_STAGES[idx] || GENERAL_SCAN_STAGES[0];
    document.querySelectorAll('.stage-pill').forEach((p, i) => {
      p.classList.toggle('active', i === idx);
      p.classList.toggle('done', i < idx);
    });
    const badge = document.getElementById('hudStageBadge');
    if (badge) badge.textContent = `STAGE ${idx + 1}/5 · ${s.sensorBadge.toUpperCase()}`;
    const stg = document.getElementById('ckStage');
    if (stg) {
      stg.innerHTML = `
        <div style="font-family:var(--font-mono);font-size:0.72rem;color:#00f2fe;">ACTIVE STAGE ${s.stepNumber} (${s.timeRange}) · ${esc(s.sensorBadge)}</div>
        <h3 style="font-size:0.95rem;margin:2px 0;">${esc(s.title)}</h3>
        <p style="font-size:0.78rem;color:#cbd5e1;">${esc(s.placementInstruction)}</p>
      `;
    }
    const pm = document.getElementById('ckPlacementMount');
    if (pm) pm.innerHTML = renderPhonePlacementGuideHTML(stagePlacementKey(idx));
    const bm = document.getElementById('ckBodyMapMount');
    if (bm) {
      bm.innerHTML = renderAnatomicalBodyMapHTML({ activeZoneId: stageZones[idx] || 'chest_cardio_pulm', scanStageIdx: idx, scanning: true });
      bindAnatomicalBodyMap(bm, (z) => {
        if (z.scanStageIdx !== undefined) setActiveStageUI(z.scanStageIdx);
      });
    }
  };

  // Allow clicking stage pills or body map to inspect any stage immediately
  root.querySelectorAll('[data-stage-idx]').forEach(pill => {
    pill.onclick = () => setActiveStageUI(+pill.dataset.stageIdx);
  });
  bindAnatomicalBodyMap(document.getElementById('ckBodyMapMount'), (z) => {
    if (z.scanStageIdx !== undefined) setActiveStageUI(z.scanStageIdx);
  });

  // Start continuous 60fps multi-axis oscilloscope + radar animation immediately
  startMultiAxisTelemetryLoop({
    scopeCanvasId: 'multiAxisScopeCanvas',
    radarCanvasId: 'multiAxisRadarCanvas',
    getStageIndex: () => currentStageIdx,
    getProgress: () => scanProgress,
    metrics: R(),
    baseline: base
  });

  document.getElementById('ckSave').onclick = () => {
    savePersonalBaseline(R());
    const sv = document.getElementById('ckSave');
    sv.textContent = '✔ Baseline Saved';
  };

  let stream;
  document.getElementById('ckStart').onclick = async () => {
    if (!labState.sim) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        document.getElementById('ckVideo').srcObject = stream;
      } catch (_) {}
    }
    const total = GENERAL_SCAN_STAGES.reduce((a, s) => a + s.durationSec, 0);
    let elapsed = 0, idx = 0, inStage = 0;
    scanProgress = 0.1;
    setActiveStageUI(0);
    const iv = setInterval(() => {
      elapsed += 0.2;
      inStage += 0.2;
      scanProgress = Math.min(1, elapsed / total);
      const progBar = document.getElementById('ckProg');
      if (progBar) progBar.style.width = `${Math.min(100, scanProgress * 100)}%`;
      if (inStage >= GENERAL_SCAN_STAGES[idx].durationSec) {
        idx++;
        inStage = 0;
        if (idx < GENERAL_SCAN_STAGES.length) {
          setActiveStageUI(idx);
        } else {
          clearInterval(iv);
          stream?.getTracks().forEach(t => t.stop());
          const m = R();
          saveScanHistoryItem({ type: 'General Checkup', metrics: m });
          const badge = document.getElementById('hudStageBadge');
          if (badge) badge.textContent = '✔ ALL 5 STAGES COMPLETE · BASELINE LOCKED';
        }
      }
    }, 200);
    timers.push(iv);
  };
}

function renderTriage() {
  const base = ensureDefaultBaseline();
  root.innerHTML = `
    ${EMERGENCY}
    <div class="panel-card" style="position:relative;">
      <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
      <div class="hud-corner bl"></div><div class="hud-corner br"></div>
      <div class="panel-header">
        <div class="panel-title">🩺 Interactive Anatomical Symptom Triage &amp; Sensor Queue</div>
        <span class="status-badge cyan">Click Body Zone or Select Clinical Preset</span>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <input class="input-field" id="symText" placeholder="Describe symptoms (e.g. fever & cough, dizzy, sore throat, muffled ear) or click the Body Map below...">
        <button class="btn btn-primary" id="symGo">Analyze</button>
      </div>

      <!-- Interactive Body Map + Placement Vector Overlay + Preset Selector -->
      <div class="cockpit-split-grid" style="margin-bottom:10px;">
        <div id="triageBodyMapMount">
          ${renderAnatomicalBodyMapHTML({ activeZoneId: 'chest_cardio_pulm', scanning: false })}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;justify-content:space-between;">
          <div id="triagePlacementMount">
            ${renderPhonePlacementGuideHTML('steth')}
          </div>
          <div class="preset-grid" style="margin:0;grid-template-columns:repeat(2,1fr);">
            ${SYMPTOM_PRESETS.map(p => `
              <button class="preset-btn" data-p="${p.id}">
                <span>${p.icon}</span>
                <div>
                  <div style="font-weight:700;font-size:0.78rem;">${esc(p.label)}</div>
                  <div class="metric-sub">${esc(p.category)}</div>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    <div id="trFlow"></div>
  `;

  const zoneToPlacement = {
    eyes_color_pupil: 'eyes_color_pupil',
    ears_weber: 'hearing',
    tongue_voice: 'tongue_voice',
    chest_cardio_pulm: 'steth',
    abdomen_bowel: 'steth',
    hands_tremor: 'hands_tremor',
    posture_balance: 'posture_balance'
  };

  const go = (p, zoneId) => {
    if (!p) return;
    root.querySelectorAll('[data-p]').forEach(b => b.classList.toggle('selected', b.dataset.p === p.id));
    const pm = document.getElementById('triagePlacementMount');
    if (pm && zoneId && zoneToPlacement[zoneId]) {
      pm.innerHTML = renderPhonePlacementGuideHTML(zoneToPlacement[zoneId]);
    }
    redFlags(p);
  };

  document.getElementById('symGo').onclick = () => go(matchSymptomToPreset(document.getElementById('symText').value));
  root.querySelectorAll('[data-p]').forEach(b => b.onclick = () => go(SYMPTOM_PRESETS.find(p => p.id === b.dataset.p)));

  bindAnatomicalBodyMap(document.getElementById('triageBodyMapMount'), (zone) => {
    const matched = SYMPTOM_PRESETS.find(p => p.id === zone.presetId) || SYMPTOM_PRESETS[0];
    const inp = document.getElementById('symText');
    if (inp) inp.value = `${zone.label} — ${matched.label}`;
    go(matched, zone.id);
  });

  // Auto-open first preset so the triage flow is immediately interactive
  go(SYMPTOM_PRESETS[0], 'chest_cardio_pulm');
}

function redFlags(p) {
  const f = document.getElementById('trFlow');
  f.innerHTML = `<div class="panel-card"><div class="panel-header"><div class="panel-title">Step 1 — Rapid Red-Flag Screening: ${esc(p.label)}</div>
    <button class="btn btn-emerald" id="rfClearAll" type="button">✔ Clear All Red Flags &amp; Launch Sensor Queue</button></div>
    ${p.redFlags.map((q, i) => `<div class="redflag-row"><span>${esc(q)}</span><span style="display:flex;gap:6px;"><button class="btn btn-danger" data-y="${i}">Yes</button><button class="btn btn-secondary" data-n="${i}">No</button></span></div>`).join('')}
    <button class="btn btn-primary" id="rfNext" disabled>Continue to Targeted Sensor Exams</button></div>`;
  const ans = {};
  f.querySelectorAll('[data-y]').forEach(b => b.onclick = () => { f.innerHTML = `${EMERGENCY}<div class="panel-card"><h3>⚠️ Seek emergency care now</h3><p>Your answer indicates a possible emergency. Call 9-1-1 or go to the nearest Emergency Department. Do not wait on phone-based tests.</p></div>`; f.scrollIntoView(); });
  f.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { ans[b.dataset.n] = 1; b.classList.add('btn-emerald'); document.getElementById('rfNext').disabled = Object.keys(ans).length < p.redFlags.length; });
  document.getElementById('rfNext').onclick = () => sensorQueue(p);
  document.getElementById('rfClearAll').onclick = () => sensorQueue(p);
}

function sensorQueue(p) {
  const f = document.getElementById('trFlow'); let i = 0;
  const step = () => {
    stopHudAnimations();
    if (i >= p.sensorQueue.length) return results(p);
    const s = p.sensorQueue[i];
    f.innerHTML = `<div class="panel-card" style="position:relative;">
      <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
      <div class="hud-corner bl"></div><div class="hud-corner br"></div>
      <div class="panel-header">
        <div class="panel-title">Step 2 — Targeted Sensor Exam ${i + 1} of ${p.sensorQueue.length}: ${esc(s.title)}</div>
        <span class="status-badge cyan">${esc(s.sensor)}</span>
      </div>
      <p style="font-size:0.86rem;color:#cbd5e1;margin-bottom:8px;">${esc(s.instruction)}</p>
      <div class="progress-track"><div class="progress-fill" id="sqProg" style="width:45%"></div></div>
      ${renderMultiAxisTelemetryHUDHTML({ title: `ACTIVE SENSOR TELEMETRY · ${s.title.toUpperCase()}`, stageLabel: `EXAM ${i + 1}/${p.sensorQueue.length} · LIVE DSP` })}
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-primary" id="sqRun">▶ Run Sensor Capture (${s.durationSec}s)</button>
        <button class="btn btn-secondary" id="sqSkip">Next Exam / View Triage Report →</button>
      </div>
    </div>`;

    startMultiAxisTelemetryLoop({
      scopeCanvasId: 'multiAxisScopeCanvas',
      radarCanvasId: 'multiAxisRadarCanvas',
      getStageIndex: () => i,
      getProgress: () => 0.85,
      metrics: R(),
      baseline: ensureDefaultBaseline()
    });

    document.getElementById('sqSkip').onclick = () => { i++; step(); };
    document.getElementById('sqRun').onclick = () => {
      let t = 0;
      const iv = setInterval(() => {
        t += 0.2;
        const prog = document.getElementById('sqProg');
        if (prog) prog.style.width = `${Math.min(100, (t / s.durationSec) * 100)}%`;
        if (t >= s.durationSec) { clearInterval(iv); i++; step(); }
      }, 200);
      timers.push(iv);
    };
  };
  step();
}

function results(p) {
  const base = ensureDefaultBaseline();
  const r = p.evaluate(R()), f = document.getElementById('trFlow');
  saveScanHistoryItem({ type: 'Symptom Triage', preset: p.label, urgency: r.urgencyTier, top: r.differentials?.[0]?.name });
  f.innerHTML = `<div class="panel-card" id="handoff" style="position:relative;">
    <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
    <div class="hud-corner bl"></div><div class="hud-corner br"></div>
    <div class="panel-header">
      <div class="panel-title">Step 3 — Likelihood Range, Baseline Radar &amp; Doctor Handoff PDF</div>
      <div class="status-badge" style="border-color:${r.urgencyColor === 'amber' ? '#f59e0b' : '#10b981'}">Urgency: ${esc(r.urgencyTier)}</div>
    </div>
    <p class="metric-sub">${new Date().toLocaleString()} · ${esc(p.label)} · <b>${esc(r.clinicalScoreLabel || '')}</b></p>

    <div class="cockpit-split-grid" style="margin-top:10px;">
      <div>
        ${(r.differentials || []).map(d => `<div class="diff-item"><b>${esc(d.name)}</b> — <span class="tabular" style="color:#00f2fe;font-weight:700;">${esc(d.likelihood)}</span><div class="metric-sub">${esc(d.rationale)}</div></div>`).join('')}
        <h4 style="margin-top:8px;font-size:0.86rem;">Sensor Evidence</h4>
        <ul style="padding-left:18px;font-size:0.8rem;color:#cbd5e1;">${(r.sensorEvidence || []).map(e => `<li>${esc(e)}</li>`).join('')}</ul>
      </div>
      <div style="background:#040914;border:1px solid rgba(0,242,254,0.3);border-radius:12px;padding:10px;text-align:center;">
        <div style="font-family:var(--font-mono);font-size:0.72rem;color:#00f2fe;margin-bottom:4px;">6-AXIS BASELINE VS. TODAY RADAR</div>
        <canvas id="handoffRadarCanvas" width="260" height="210" style="width:100%;max-width:260px;height:210px;"></canvas>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:10px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save 1-Page Doctor Handoff PDF</button>
        <a class="btn btn-secondary" href="https://buy.stripe.com/14A28qapz5nmeUG9hMd3i0e" target="_blank" rel="noopener" style="text-decoration:none;">🔓 Unlock Family Lifetime Pass ($29.99 One-Time)</a>
      </div>
      <span class="metric-sub">Prototype clinical intake summary — share with a licensed clinician.</span>
    </div>
  </div>${EMERGENCY}`;

  drawRadarChart(document.getElementById('handoffRadarCanvas'), computeRadarAxes(R(), base), 1.0, 2.0);
}

function renderToolbox(active = 'vitals') {
  stopLabs(); clearTimers();
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'toolbox'));
  const guideMap = { vitals: 'face_rppg', steth: 'steth', imu: 'hands_tremor', neuro: 'eyes_color_pupil', hearing: 'hearing' };
  root.innerHTML = `
    <div class="sub-tabs">${LAB_LIST.map(l => `<button class="sub-tab ${l.id === active ? 'active' : ''}" data-lab="${l.id}">${l.label}</button>`).join('')}</div>
    <div style="margin-bottom:12px;">${renderPhonePlacementGuideHTML(guideMap[active] || 'face_rppg')}</div>
    <div id="labRoot"></div>
  `;
  root.querySelectorAll('[data-lab]').forEach(b => b.onclick = () => renderToolbox(b.dataset.lab));
  renderLab(active, document.getElementById('labRoot'));
}

function renderNative() {
  const h = loadScanHistory(), plugins = caps?.nativePlugins || {};
  root.innerHTML = `<div class="panel-card"><div class="panel-title">🗂️ Scan History (${h.length})</div>
    ${h.length ? h.map(x => `<div class="diff-item"><b>${esc(x.type)}</b> ${esc(x.preset || '')} <span class="metric-sub">${new Date(x.timestamp).toLocaleString()}</span><div class="metric-sub">${esc(x.urgency || '')} ${esc(x.top || '')}</div></div>`).join('') : '<p class="metric-sub">No scans yet.</p>'}</div>
  <div class="panel-card"><div class="panel-title">📱 Capacitor Native Bridge — ${esc(caps?.platform || 'web')} ${caps?.isNative ? '(native)' : '(PWA)'}</div>
    ${['TrueDepthNIR', 'LiDARDepthMesh', 'CoreHaptics128Hz', 'CameraRAW', 'TrueToneSpectralALS'].map(k => `<div class="redflag-row"><span>${k}</span><span class="status-badge">${plugins[k] ? '✅ Active' : '⏳ Native build required'}</span></div>`).join('')}
    <div class="code-block">npx cap add ios && npx cap add android && npx cap sync</div></div>
  <div class="panel-card"><div class="panel-title">🏥 Referral Reminders</div><ul>
    <li>Changing mole or lesion? Book your GP; BC Cancer provides specialist referral and screening programs (e.g. skin, breast, cervix, colon).</li>
    <li>Outside BC? In Alberta, AHS / Health Link 8-1-1 handles nurse advice and referrals.</li>
    <li>Not sure where to go? Call HealthLink BC 8-1-1 any time.</li></ul></div>`;
}

document.querySelectorAll('.nav-tab').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
function checkProUnlock() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pro') === 'unlocked') {
      localStorage.setItem('htt_pro_unlocked', '1');
    }
    const unlocked = localStorage.getItem('htt_pro_unlocked') === '1';
    if (unlocked) {
      const titleEl = document.querySelector('.brand-title');
      if (titleEl && !document.getElementById('proPassBadge')) {
        const badge = document.createElement('span');
        badge.id = 'proPassBadge';
        badge.className = 'badge-mvp';
        badge.style.cssText = 'background:rgba(16,185,129,0.2);color:#10b981;border:1px solid rgba(16,185,129,0.5);margin-left:6px;font-weight:700;';
        badge.textContent = '★ PRO FAMILY PASS UNLOCKED';
        titleEl.appendChild(badge);
      }
    }
    return unlocked;
  } catch (_) {
    return false;
  }
}

checkProUnlock(); setupSimToggle(); renderStatus(); switchTab('home');
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
