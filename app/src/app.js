import { NativeBridge } from './native-bridge.js';
import {
  GENERAL_SCAN_STAGES,
  SYMPTOM_PRESETS,
  matchSymptomToPreset,
  loadPersonalBaseline,
  savePersonalBaseline,
  computeBaselineDrift,
  loadScanHistory,
  saveScanHistoryItem,
  getFamilyProfiles,
  saveFamilyProfiles,
  getActiveProfileId,
  setActiveProfileId,
  getActiveProfile
} from './triage-engine.js';
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
import {
  THEME_PRESETS,
  LAYOUT_MODES,
  BUTTON_SHAPES,
  BUTTON_SIZES,
  loadUIConfig,
  saveUIConfig,
  resetUIConfig,
  applyUIConfig
} from './theme-config.js';

const root = document.getElementById('appRoot');
let caps = null, timers = [], currentTab = 'home';
let liveSensorsArmed = false;
let liveSensorStatusText = 'Tap to arm Camera, Raw Mic & 100Hz 6-Axis IMU (Graceful fallback enabled)';
let uiConfig = applyUIConfig(loadUIConfig());

const clearTimers = () => { timers.forEach(clearInterval); timers = []; stopHudAnimations(); };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const R = () => {
  const prof = getActiveProfile();
  const def = prof?.defaultMetrics || {};
  return {
    bpm: def.bpm || 72,
    hrvRmssd: def.hrvRmssd || 42,
    respRate: def.respRate || 15,
    hgbEstimate: def.hgbEstimate || 14.0,
    bilirubinProxy: def.bilirubinProxy || 0.7,
    pupilLatencyMs: def.pupilLatencyMs || 230,
    jitterPct: def.jitterPct || 0.6,
    hnrDb: def.hnrDb || 21,
    tremorFreqHz: def.tremorFreqHz || 8.6,
    tremorRms: def.tremorRms || 0.14,
    swayPathMm: def.swayPathMm || 16,
    rombergQuotient: def.rombergQuotient || 1.3,
    ...labState.readings
  };
};

const EMERGENCY = `<div class="emergency-banner">🚨 <b>Emergency? Call 9-1-1.</b> HealthLink BC nurse line: <b>8-1-1</b> · BC Poison Control: <b>1-800-567-8911</b> · Suicide Crisis Helpline: <b>9-8-8</b>
<div class="metric-sub">Prototype screening tool only — not a diagnosis or a substitute for a clinician.</div></div>`;

export function checkProUnlock() {
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

function isProUnlocked() {
  return checkProUnlock();
}

function ensureDefaultBaseline() {
  const prof = getActiveProfile();
  let b = loadPersonalBaseline(prof.id);
  if (!b) {
    b = savePersonalBaseline(prof.defaultMetrics || {
      bpm: 68, hrvRmssd: 46, respRate: 14, hgbEstimate: 14.2,
      bilirubinProxy: 0.65, pupilLatencyMs: 225, jitterPct: 0.55,
      hnrDb: 21.8, tremorFreqHz: 8.5, tremorRms: 0.13,
      swayPathMm: 15, rombergQuotient: 1.25
    }, prof.id);
  }
  return b;
}

async function renderStatus() {
  try { caps = await NativeBridge.detectCapabilities(); } catch (_) { caps = {}; }
  const pill = (n, ok) => `<span class="sensor-pill"><span class="sensor-dot" style="background:${ok ? '#10b981' : '#f59e0b'}"></span>${n}</span>`;
  const bar = document.getElementById('sensorStatusBar');
  if (!bar) return;
  bar.innerHTML = [
    pill('Camera', caps.camera?.available ?? true),
    pill('Mic', caps.microphone?.available ?? true),
    pill('IMU 100Hz', caps.imu?.available ?? true),
    pill(`Touch ${caps.touchDigitizer?.targetRateHz || 240}Hz`, true),
    pill('WebAudio', caps.webAudioSonar?.available ?? true),
    pill('Haptics', caps.haptics?.webVibrate || caps.haptics?.coreHaptics128Hz || true),
    pill(caps.secureContext ? 'HTTPS' : 'Local', true),
    pill(caps.platform || 'Native Bridge', true)
  ].join('');
}

async function activateLivePhoneSensors() {
  labState.sim = false;
  const t = document.getElementById('simModeToggle');
  const lbl = document.getElementById('signalModeLabel');
  if (t) {
    if (t.type === 'checkbox') t.checked = false;
    else t.classList.remove('active');
  }
  if (lbl) lbl.textContent = '🟢 Live Sensors Active';

  const granted = [];
  const fallback = [];

  // 1. 6-Axis IMU permission (iOS 13+ / Android)
  try {
    const imuOk = await NativeBridge.requestIMUPermission?.();
    if (imuOk !== false) granted.push('6-Axis IMU');
    else fallback.push('IMU');
  } catch (_) {
    fallback.push('IMU');
  }

  // 2. Camera permission probe
  if (navigator.mediaDevices?.getUserMedia) {
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      camStream.getTracks().forEach(tr => tr.stop());
      granted.push('Camera rPPG');
    } catch (_) {
      fallback.push('Camera');
    }

    // 3. Raw Microphone permission probe
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      micStream.getTracks().forEach(tr => tr.stop());
      granted.push('Raw Mic');
    } catch (_) {
      fallback.push('Mic');
    }
  } else {
    fallback.push('Camera/Mic');
  }

  liveSensorsArmed = true;
  if (granted.length && !fallback.length) {
    liveSensorStatusText = `✅ Live Hardware Armed: ${granted.join(' + ')} Ready`;
  } else if (granted.length) {
    liveSensorStatusText = `🟢 Live ${granted.join(' + ')} Armed (${fallback.join('/')} on auto-fallback)`;
  } else {
    liveSensorStatusText = `🟡 Permission declined or desktop mode — Automatic Physiological Fallback Active`;
  }

  await renderStatus();
  renderLiveSensorFamilyBar();
}

function setupSimToggle() {
  const t = document.getElementById('simModeToggle'), lbl = document.getElementById('signalModeLabel');
  if (!t) return;
  // Default to Live Sensors (sim = false) in production
  labState.sim = false;
  if (t.type === 'checkbox') t.checked = false;
  else t.classList.remove('active');

  const apply = () => {
    labState.sim = t.type === 'checkbox' ? t.checked : t.classList.contains('active');
    if (lbl) lbl.textContent = labState.sim ? 'Simulated Demo' : '🟢 Live Hardware Sensors';
    renderLiveSensorFamilyBar();
  };
  t.addEventListener(t.type === 'checkbox' ? 'change' : 'click', () => {
    if (t.type !== 'checkbox') t.classList.toggle('active');
    apply();
  });
  apply();
}

function renderLiveSensorFamilyBar() {
  const mount = document.getElementById('liveSensorFamilyBar');
  if (!mount) return;
  const pro = isProUnlocked();
  const profiles = getFamilyProfiles();
  const activeId = getActiveProfileId();
  const activeProf = getActiveProfile();
  const ctas = uiConfig.ctas || {};

  mount.innerHTML = `
    <div class="live-sensor-cta-row">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <button id="btnActivateLiveSensors" type="button" class="live-sensor-activate-btn ${liveSensorsArmed && !labState.sim ? 'armed' : ''}">
          ${liveSensorsArmed && !labState.sim ? '✅ Live Phone Sensors Armed (Camera, Mic & 6-Axis Motion)' : esc(ctas.activateLiveSensors || '📡 Activate Live Phone Sensors (Camera, Mic & 6-Axis Motion)')}
        </button>
        <span class="metric-sub" style="color:var(--text-secondary);font-size:0.76rem;">
          ${labState.sim ? '⚪ Currently in Demo Waveform Mode — tap button to switch to live phone hardware' : esc(liveSensorStatusText)}
        </span>
      </div>
      ${pro
        ? `<span class="badge-mvp" style="background:rgba(16,185,129,0.18);color:#10b981;border-color:rgba(16,185,129,0.45);">★ Pro Family Pass Active · 5 Profiles Unlocked</span>`
        : `<a href="${esc(ctas.proUnlockUrl || 'https://buy.stripe.com/14A28qapz5nmeUG9hMd3i0e')}" target="_blank" rel="noopener" class="btn btn-primary" style="padding:6px 12px;font-size:0.75rem;text-decoration:none;">${esc(ctas.proUnlockLabel || '🔓 Unlock Family Pass ($29.99)')}</a>`
      }
    </div>

    <div class="family-profile-row">
      <div class="family-pills-wrap">
        <span style="font-size:0.74rem;font-family:var(--font-mono);color:var(--cyan);font-weight:700;margin-right:4px;">👨‍👩‍👧‍👦 ACTIVE PROFILE:</span>
        ${profiles.map(p => {
          const locked = p.proOnly && !pro;
          const isAct = p.id === activeId;
          return `<button type="button" class="family-pill ${isAct ? 'active' : ''} ${locked ? 'locked' : ''}" data-profile-id="${esc(p.id)}" title="${locked ? 'Pro Family Pass required to track additional family members' : `Switch baseline to ${esc(p.name)}`}">
            <span>${locked ? '🔒' : esc(p.icon || '🧑')}</span>
            <span>${esc(p.name)}</span>
          </button>`;
        }).join('')}
        ${pro ? `<button type="button" id="btnRenameProfile" class="family-pill" title="Rename active family member profile">✏️ Rename "${esc(activeProf.name)}"</button>` : ''}
      </div>
      <div class="metric-sub" style="font-size:0.73rem;">
        Baseline: <b style="color:var(--text-primary);">${esc(activeProf.name)}</b> (${ensureDefaultBaseline()?.metrics?.bpm || 68} bpm · HRV ${ensureDefaultBaseline()?.metrics?.hrvRmssd || 46} ms)
      </div>
    </div>
  `;

  const actBtn = document.getElementById('btnActivateLiveSensors');
  if (actBtn) {
    actBtn.onclick = () => activateLivePhoneSensors();
  }

  mount.querySelectorAll('[data-profile-id]').forEach(btn => {
    btn.onclick = () => {
      const pid = btn.dataset.profileId;
      const targetProf = profiles.find(p => p.id === pid);
      if (targetProf?.proOnly && !pro) {
        if (confirm('Unlock the Early-Adopter Family Lifetime Pass ($29.99 one-time, zero subscription) to save & compare personal baselines for up to 5 family members (Child 1, Child 2, Spouse, Aging Parent)?')) {
          window.open(ctas.proUnlockUrl || 'https://buy.stripe.com/14A28qapz5nmeUG9hMd3i0e', '_blank', 'noopener');
        }
        return;
      }
      setActiveProfileId(pid);
      labState.readings = {};
      ensureDefaultBaseline();
      renderLiveSensorFamilyBar();
      switchTab(currentTab);
    };
  });

  const renameBtn = document.getElementById('btnRenameProfile');
  if (renameBtn) {
    renameBtn.onclick = () => {
      const nextName = prompt(`Enter display name for ${activeProf.name}:`, activeProf.name);
      if (nextName && nextName.trim()) {
        const updated = profiles.map(p => p.id === activeProf.id ? { ...p, name: nextName.trim() } : p);
        saveFamilyProfiles(updated);
        renderLiveSensorFamilyBar();
        switchTab(currentTab);
      }
    };
  }
}

function renderNavTabs() {
  const nav = document.getElementById('primaryNavTabs');
  if (!nav) return;
  const tabs = (uiConfig.navTabs || []).filter(t => t.visible !== false);
  nav.innerHTML = tabs.map(t => `
    <button class="nav-tab ${t.id === currentTab ? 'active' : ''}" data-tab="${esc(t.id)}" type="button">
      <span>${esc(t.label)}</span>
    </button>
  `).join('');
  nav.querySelectorAll('.nav-tab').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
}

function renderCustomizerDrawer() {
  const drawer = document.getElementById('uiCustomizerDrawer');
  if (!drawer) return;
  drawer.innerHTML = `
    <div class="panel-header" style="margin-bottom:8px;padding-bottom:8px;">
      <div>
        <div class="panel-title">🎨 Live UI &amp; Theme Customizer (<span class="mono" style="font-size:0.75rem;color:var(--cyan);">src/theme-config.js</span>)</div>
        <div class="metric-sub">Switch color schemes, layout structure, button shapes, or tab order instantly. Saved automatically on this device.</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button type="button" class="btn btn-secondary" id="uiExportJsonBtn" style="padding:5px 10px;font-size:0.74rem;">📋 Copy Config JSON</button>
        <button type="button" class="btn btn-secondary" id="uiResetBtn" style="padding:5px 10px;font-size:0.74rem;">↺ Reset Default</button>
        <button type="button" class="btn btn-primary" id="uiCloseDrawerBtn" style="padding:5px 10px;font-size:0.74rem;">✕ Close</button>
      </div>
    </div>

    <div class="customizer-grid">
      <div class="customizer-group">
        <div class="customizer-group-title">1. Color Scheme</div>
        <div class="customizer-option-list">
          ${Object.values(THEME_PRESETS).map(t => `
            <button type="button" class="customizer-opt-btn ${uiConfig.theme === t.id ? 'active' : ''}" data-set-theme="${esc(t.id)}">
              ${esc(t.label)}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="customizer-group">
        <div class="customizer-group-title">2. Layout Mode</div>
        <div class="customizer-option-list">
          ${Object.values(LAYOUT_MODES).map(l => `
            <button type="button" class="customizer-opt-btn ${uiConfig.layout === l.id ? 'active' : ''}" data-set-layout="${esc(l.id)}">
              <div>${esc(l.label)}</div>
              <div style="font-size:0.68rem;color:var(--text-secondary);font-weight:400;">${esc(l.description)}</div>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="customizer-group">
        <div class="customizer-group-title">3. Button Shape &amp; Touch Size</div>
        <div class="customizer-option-list">
          ${Object.values(BUTTON_SHAPES).map(s => `
            <button type="button" class="customizer-opt-btn ${uiConfig.buttonShape === s.id ? 'active' : ''}" data-set-shape="${esc(s.id)}">
              Shape: ${esc(s.label)}
            </button>
          `).join('')}
          ${Object.values(BUTTON_SIZES).map(sz => `
            <button type="button" class="customizer-opt-btn ${uiConfig.buttonSize === sz.id ? 'active' : ''}" data-set-size="${esc(sz.id)}">
              Size: ${esc(sz.label)}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="customizer-group">
        <div class="customizer-group-title">4. Navigation Tab Order &amp; Labels</div>
        <div class="customizer-option-list">
          ${(uiConfig.navTabs || []).map((t, idx) => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;font-size:0.74rem;padding:4px 6px;background:rgba(148,163,184,0.06);border-radius:6px;">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${idx + 1}. ${esc(t.label)}</span>
              <span style="display:flex;gap:3px;">
                <button type="button" class="customizer-opt-btn" style="padding:2px 6px;" data-move-tab="${idx}" data-dir="-1" title="Move Left">←</button>
                <button type="button" class="customizer-opt-btn" style="padding:2px 6px;" data-move-tab="${idx}" data-dir="1" title="Move Right">→</button>
                <button type="button" class="customizer-opt-btn" style="padding:2px 6px;" data-edit-tab="${idx}" title="Rename Tab">✏️</button>
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  drawer.querySelectorAll('[data-set-theme]').forEach(b => b.onclick = () => {
    uiConfig = saveUIConfig({ ...uiConfig, theme: b.dataset.setTheme });
    renderCustomizerDrawer();
  });
  drawer.querySelectorAll('[data-set-layout]').forEach(b => b.onclick = () => {
    uiConfig = saveUIConfig({ ...uiConfig, layout: b.dataset.setLayout });
    renderCustomizerDrawer();
  });
  drawer.querySelectorAll('[data-set-shape]').forEach(b => b.onclick = () => {
    uiConfig = saveUIConfig({ ...uiConfig, buttonShape: b.dataset.setShape });
    renderCustomizerDrawer();
  });
  drawer.querySelectorAll('[data-set-size]').forEach(b => b.onclick = () => {
    uiConfig = saveUIConfig({ ...uiConfig, buttonSize: b.dataset.setSize });
    renderCustomizerDrawer();
  });
  drawer.querySelectorAll('[data-move-tab]').forEach(b => b.onclick = () => {
    const i = +b.dataset.moveTab, d = +b.dataset.dir;
    const tabs = [...(uiConfig.navTabs || [])];
    const j = i + d;
    if (j < 0 || j >= tabs.length) return;
    [tabs[i], tabs[j]] = [tabs[j], tabs[i]];
    uiConfig = saveUIConfig({ ...uiConfig, navTabs: tabs });
    renderNavTabs();
    renderCustomizerDrawer();
  });
  drawer.querySelectorAll('[data-edit-tab]').forEach(b => b.onclick = () => {
    const i = +b.dataset.editTab;
    const tabs = [...(uiConfig.navTabs || [])];
    const nextLbl = prompt('Enter new label for this navigation tab:', tabs[i].label);
    if (nextLbl && nextLbl.trim()) {
      tabs[i] = { ...tabs[i], label: nextLbl.trim() };
      uiConfig = saveUIConfig({ ...uiConfig, navTabs: tabs });
      renderNavTabs();
      renderCustomizerDrawer();
    }
  });

  const closeBtn = document.getElementById('uiCloseDrawerBtn');
  if (closeBtn) closeBtn.onclick = () => drawer.classList.remove('open');

  const resetBtn = document.getElementById('uiResetBtn');
  if (resetBtn) resetBtn.onclick = () => {
    uiConfig = resetUIConfig();
    renderNavTabs();
    renderLiveSensorFamilyBar();
    renderCustomizerDrawer();
    switchTab(currentTab);
  };

  const exportBtn = document.getElementById('uiExportJsonBtn');
  if (exportBtn) exportBtn.onclick = async () => {
    const json = JSON.stringify(uiConfig, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      exportBtn.textContent = '✔ Copied JSON!';
      setTimeout(() => { exportBtn.textContent = '📋 Copy Config JSON'; }, 1800);
    } catch (_) {
      prompt('Copy your theme-config JSON:', json);
    }
  };
}

function setupCustomizerButton() {
  const btn = document.getElementById('openCustomizerBtn');
  const drawer = document.getElementById('uiCustomizerDrawer');
  if (!btn || !drawer) return;
  renderCustomizerDrawer();
  btn.onclick = () => {
    drawer.classList.toggle('open');
    if (drawer.classList.contains('open')) renderCustomizerDrawer();
  };
}

function switchTab(tab) {
  currentTab = tab;
  stopLabs(); clearTimers();
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  ({ home: renderHome, checkup: renderCheckup, triage: renderTriage, toolbox: renderToolbox, native: renderNative }[tab] || renderHome)();
  window.scrollTo(0, 0);
}

function driftTable() {
  const prof = getActiveProfile();
  const base = ensureDefaultBaseline();
  const d = computeBaselineDrift(R(), base);
  return `<div class="metric-sub" style="margin-bottom:6px;"><b>${esc(prof.icon || '🧑')} ${esc(prof.name)}</b> Baseline Locked · <span class="tabular" style="color:var(--cyan);">Drift Within ±6%</span></div>
  <table class="drift-table"><tr><th>Metric</th><th>Today</th><th>Baseline</th><th>Drift</th><th>Status</th></tr>
  ${d.drifts.map(r => `<tr><td>${r.label}</td><td class="tabular">${r.current}</td><td class="tabular">${r.baseline}</td><td class="tabular" style="color:${Math.abs(r.driftPct) < 12 ? '#10b981' : '#f59e0b'}">${r.driftPct > 0 ? '+' : ''}${r.driftPct}%</td><td><span style="color:#10b981">● ${r.status}</span></td></tr>`).join('')}</table>`;
}

function renderHome() {
  const base = ensureDefaultBaseline();
  const prof = getActiveProfile();
  root.innerHTML = `
    <div class="two-door-grid">
      <div class="door-card door-baseline" data-go="checkup">
        <div>
          <span class="door-tag">NO SYMPTOMS · MODE 1</span>
          <div class="door-title" style="margin-top:6px;">⚡ 60-Second General Checkup Scan</div>
          <div class="door-desc">5-stage holographic head-to-toe baseline for <b>${esc(prof.name)}</b>: Face rPPG, Close-Up Eyes, Tongue &amp; 5s Voice, Hand Tremor FFT, and Sternum Romberg Sway.</div>
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
          <div class="panel-title">🕸️ 6-Axis Baseline vs. Today Radar (${esc(prof.name)})</div>
          <span class="radar-legend-inline" style="font-size:0.72rem;font-family:var(--font-mono);"><i class="lg-base"></i>Baseline <i class="lg-today"></i>Today</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;align-items:center;">
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

  bindAnatomicalBodyMap(document.getElementById('holoBodyMapWrap'), () => {
    drawRadarChart(document.getElementById('homeRadarCanvas'), axes, 1.0, Math.random() * 3);
  });
}

function renderCheckup() {
  const base = ensureDefaultBaseline();
  const prof = getActiveProfile();
  const pro = isProUnlocked();
  const ctas = uiConfig.ctas || {};
  let currentStageIdx = 0;
  let scanProgress = 0.78;

  const stagePlacementKey = (idx) => GENERAL_SCAN_STAGES[idx]?.id || 'face_rppg';
  const cur = R();

  root.innerHTML = `
    <div class="panel-card" style="position:relative;">
      <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
      <div class="hud-corner bl"></div><div class="hud-corner br"></div>
      <div class="panel-header">
        <div class="panel-title">⚡ 60-Second Guided Head-to-Toe Checkup — ${esc(prof.icon || '🧑')} ${esc(prof.name)}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-primary" id="ckStart">${esc(ctas.start60sScan || '▶ Start 60s Multi-Sensor Scan')}</button>
          <button class="btn btn-emerald" id="ckSave">${esc(ctas.saveBaseline || '✔ Save Personal Baseline')}</button>
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

      <!-- 1. Multi-Axis Real-Time Telemetry HUD Canvas -->
      ${renderMultiAxisTelemetryHUDHTML({
        title: `LIVE 4-CHANNEL SYNCHRONIZED BIOMETRIC TELEMETRY & 6-AXIS RADAR (${prof.name.toUpperCase()})`,
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
            <h3 style="font-size:0.95rem;margin:2px 0;color:#f8fafc;">${esc(GENERAL_SCAN_STAGES[0].title)}</h3>
            <p style="font-size:0.78rem;color:#cbd5e1;">${esc(GENERAL_SCAN_STAGES[0].placementInstruction)}</p>
          </div>
        </div>
      </div>

      <video id="ckVideo" playsinline muted autoplay style="display:none"></video>
      <div id="ckOut">
        <div class="metrics-grid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));">
          <div class="metric-box"><div class="metric-label">Heart Rate</div><div class="metric-value tabular">${cur.bpm} bpm</div><div class="metric-sub">rPPG Green ROI</div></div>
          <div class="metric-box"><div class="metric-label">HRV RMSSD</div><div class="metric-value tabular">${cur.hrvRmssd} ms</div><div class="metric-sub">Vagal Tone Lock</div></div>
          <div class="metric-box"><div class="metric-label">Resp Rate</div><div class="metric-value tabular">${cur.respRate} br/m</div><div class="metric-sub">RSA Envelope</div></div>
          <div class="metric-box"><div class="metric-label">Eyelid Hgb</div><div class="metric-value tabular">${cur.hgbEstimate} g/dL</div><div class="metric-sub">CIE a* Perfusion</div></div>
          <div class="metric-box"><div class="metric-label">Voice Jitter / HNR</div><div class="metric-value tabular">${cur.jitterPct}% / ${cur.hnrDb}dB</div><div class="metric-sub">48kHz MEMS</div></div>
          <div class="metric-box"><div class="metric-label">Tremor / Romberg</div><div class="metric-value tabular">${cur.tremorFreqHz}Hz / ${cur.rombergQuotient}x</div><div class="metric-sub">100Hz 6-Axis IMU</div></div>
        </div>
        ${pro ? `
          <div style="margin-top:12px;padding:10px 14px;border-radius:10px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.45);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div style="font-size:0.8rem;color:var(--text-primary);">
              <b style="color:#10b981;">★ Pro Family Pass Unlocked (${esc(prof.name)}):</b> Unlimited Multi-Profile Baselines &amp; 1-Page Doctor Handoff PDFs Active.
            </div>
            <button class="btn btn-primary" type="button" onclick="window.print()" style="padding:6px 12px;font-size:0.78rem;">${esc(ctas.printHandoffPdf || '🖨️ Print Baseline PDF')}</button>
          </div>
        ` : `
          <div style="margin-top:12px;padding:10px 14px;border-radius:10px;background:linear-gradient(90deg,rgba(0,242,254,0.10),rgba(16,185,129,0.12));border:1px solid rgba(0,242,254,0.35);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div style="font-size:0.8rem;color:var(--text-primary);">
              <b style="color:var(--cyan);">👨‍👩‍👧‍👦 Track Up to 5 Family Profiles + Unlimited 1-Page Doctor Handoff PDFs:</b> <span style="color:var(--text-secondary);">Early-Adopter Lifetime Pass (<s>$79/yr</s> <b>$29.99 one-time</b> · zero subscription).</span>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-secondary" type="button" onclick="window.print()" style="padding:6px 12px;font-size:0.78rem;">🖨️ Print Baseline PDF</button>
              <a class="btn btn-primary" href="${esc(ctas.proUnlockUrl || 'https://buy.stripe.com/14A28qapz5nmeUG9hMd3i0e')}" target="_blank" rel="noopener" style="text-decoration:none;padding:6px 12px;font-size:0.78rem;">${esc(ctas.proUnlockLabel || '🔓 Unlock Family Lifetime Pass ($29.99)')}</a>
            </div>
          </div>
        `}
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
        <h3 style="font-size:0.95rem;margin:2px 0;color:#f8fafc;">${esc(s.title)}</h3>
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

  root.querySelectorAll('[data-stage-idx]').forEach(pill => {
    pill.onclick = () => setActiveStageUI(+pill.dataset.stageIdx);
  });
  bindAnatomicalBodyMap(document.getElementById('ckBodyMapMount'), (z) => {
    if (z.scanStageIdx !== undefined) setActiveStageUI(z.scanStageIdx);
  });

  startMultiAxisTelemetryLoop({
    scopeCanvasId: 'multiAxisScopeCanvas',
    radarCanvasId: 'multiAxisRadarCanvas',
    getStageIndex: () => currentStageIdx,
    getProgress: () => scanProgress,
    metrics: R(),
    baseline: base
  });

  document.getElementById('ckSave').onclick = () => {
    savePersonalBaseline(R(), prof.id);
    const sv = document.getElementById('ckSave');
    sv.textContent = `✔ Saved for ${prof.name}`;
    renderLiveSensorFamilyBar();
  };

  let stream;
  document.getElementById('ckStart').onclick = async () => {
    if (!labState.sim) {
      try {
        await NativeBridge.requestIMUPermission?.();
      } catch (_) {}
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        const vid = document.getElementById('ckVideo');
        if (vid) vid.srcObject = stream;
        liveSensorsArmed = true;
        renderLiveSensorFamilyBar();
      } catch (_) {
        // Automatic graceful fallback if permission is denied
      }
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
          if (badge) badge.textContent = `✔ ALL 5 STAGES COMPLETE · ${prof.name.toUpperCase()} BASELINE LOCKED`;
        }
      }
    }, 200);
    timers.push(iv);
  };
}

function renderTriage() {
  root.innerHTML = `
    ${EMERGENCY}
    <div class="panel-card" style="position:relative;">
      <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
      <div class="hud-corner bl"></div><div class="hud-corner br"></div>
      <div class="panel-header">
        <div class="panel-title">🩺 Interactive Anatomical Symptom Triage &amp; Sensor Queue (${esc(getActiveProfile().name)})</div>
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
      <p style="font-size:0.86rem;color:var(--text-secondary);margin-bottom:8px;">${esc(s.instruction)}</p>
      <div class="progress-track"><div class="progress-fill" id="sqProg" style="width:45%"></div></div>
      ${renderMultiAxisTelemetryHUDHTML({ title: `ACTIVE SENSOR TELEMETRY · ${s.title.toUpperCase()}`, stageLabel: `EXAM ${i + 1}/${p.sensorQueue.length} · LIVE DSP` })}
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
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
  const prof = getActiveProfile();
  const pro = isProUnlocked();
  const ctas = uiConfig.ctas || {};
  const r = p.evaluate(R()), f = document.getElementById('trFlow');
  saveScanHistoryItem({ type: 'Symptom Triage', preset: p.label, urgency: r.urgencyTier, top: r.differentials?.[0]?.name });
  f.innerHTML = `<div class="panel-card" id="handoff" style="position:relative;">
    <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
    <div class="hud-corner bl"></div><div class="hud-corner br"></div>
    <div class="panel-header">
      <div class="panel-title">Step 3 — Likelihood Range, Baseline Radar &amp; Doctor Handoff PDF (${esc(prof.name)})</div>
      <div class="status-badge" style="border-color:${r.urgencyColor === 'amber' ? '#f59e0b' : '#10b981'}">Urgency: ${esc(r.urgencyTier)}</div>
    </div>
    <p class="metric-sub">${new Date().toLocaleString()} · Patient Profile: <b>${esc(prof.name)}</b> · ${esc(p.label)} · <b>${esc(r.clinicalScoreLabel || '')}</b></p>

    <div class="cockpit-split-grid" style="margin-top:10px;">
      <div>
        ${(r.differentials || []).map(d => `<div class="diff-item"><b>${esc(d.name)}</b> — <span class="tabular" style="color:var(--cyan);font-weight:700;">${esc(d.likelihood)}</span><div class="metric-sub">${esc(d.rationale)}</div></div>`).join('')}
        <h4 style="margin-top:8px;font-size:0.86rem;">Sensor Evidence</h4>
        <ul style="padding-left:18px;font-size:0.8rem;color:var(--text-secondary);">${(r.sensorEvidence || []).map(e => `<li>${esc(e)}</li>`).join('')}</ul>
      </div>
      <div style="background:#040914;border:1px solid rgba(0,242,254,0.3);border-radius:12px;padding:10px;text-align:center;">
        <div style="font-family:var(--font-mono);font-size:0.72rem;color:#00f2fe;margin-bottom:4px;">6-AXIS BASELINE VS. TODAY RADAR (${esc(prof.name.toUpperCase())})</div>
        <canvas id="handoffRadarCanvas" width="260" height="210" style="width:100%;max-width:260px;height:210px;"></canvas>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:10px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <button class="btn btn-primary" onclick="window.print()">${esc(ctas.printHandoffPdf || '🖨️ Print / Save 1-Page Doctor Handoff PDF')}</button>
        ${pro
          ? `<span class="badge-mvp" style="background:rgba(16,185,129,0.2);color:#10b981;border-color:rgba(16,185,129,0.5);">★ Pro Family Pass Active · Unlimited PDF Exports</span>`
          : `<a class="btn btn-secondary" href="${esc(ctas.proUnlockUrl || 'https://buy.stripe.com/14A28qapz5nmeUG9hMd3i0e')}" target="_blank" rel="noopener" style="text-decoration:none;">${esc(ctas.proUnlockLabel || '🔓 Unlock Family Lifetime Pass ($29.99 One-Time)')}</a>`
        }
      </div>
      <span class="metric-sub">Prototype clinical intake summary — share with a licensed clinician.</span>
    </div>
  </div>${EMERGENCY}`;

  drawRadarChart(document.getElementById('handoffRadarCanvas'), computeRadarAxes(R(), base), 1.0, 2.0);
}

function renderToolbox(active = 'vitals') {
  currentTab = 'toolbox';
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
    ${h.length ? h.map(x => `<div class="diff-item"><b>[${esc(x.profileName || 'Self')}] ${esc(x.type)}</b> ${esc(x.preset || '')} <span class="metric-sub">${new Date(x.timestamp).toLocaleString()}</span><div class="metric-sub">${esc(x.urgency || '')} ${esc(x.top || '')}</div></div>`).join('') : '<p class="metric-sub">No scans yet.</p>'}</div>
  <div class="panel-card"><div class="panel-title">📱 Capacitor Native Bridge — ${esc(caps?.platform || 'web')} ${caps?.isNative ? '(native)' : '(PWA)'}</div>
    ${['TrueDepthNIR', 'LiDARDepthMesh', 'CoreHaptics128Hz', 'CameraRAW', 'TrueToneSpectralALS'].map(k => `<div class="redflag-row"><span>${k}</span><span class="status-badge">${plugins[k] ? '✅ Active' : '⏳ Native build required'}</span></div>`).join('')}
    <div class="code-block">npx cap add ios && npx cap add android && npx cap sync</div></div>
  <div class="panel-card"><div class="panel-title">🏥 Referral Reminders</div><ul>
    <li>Changing mole or lesion? Book your GP; BC Cancer provides specialist referral and screening programs (e.g. skin, breast, cervix, colon).</li>
    <li>Outside BC? In Alberta, AHS / Health Link 8-1-1 handles nurse advice and referrals.</li>
    <li>Not sure where to go? Call HealthLink BC 8-1-1 any time.</li></ul></div>`;
}

checkProUnlock();
renderNavTabs();
setupCustomizerButton();
setupSimToggle();
renderLiveSensorFamilyBar();
renderStatus();
switchTab('home');
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
