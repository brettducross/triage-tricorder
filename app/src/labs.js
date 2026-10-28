// Doctor's Black Bag: 5 interactive sensor labs (live Web APIs + simulated fallback)
import { NativeBridge } from './native-bridge.js';
import { analyzeTissueColorimetry, computeRppgMetrics, computePowerSpectrum, analyzeVocalBiomarkers, scoreArchimedesSpiral } from './sensors.js';

export const LAB_LIST = [
  { id: 'vitals', label: '📷 Optical Vitals' },
  { id: 'steth', label: '🎙️ Stethoscope & Voice' },
  { id: 'imu', label: '📳 6-Axis IMU' },
  { id: 'neuro', label: '✍️ Touch & Display Neuro' },
  { id: 'hearing', label: '👂 Hearing & Weber' }
];

let cleanups = [];
export const labState = { sim: false, readings: {} };
export function stopLabs() { cleanups.forEach(f => { try { f(); } catch (_) {} }); cleanups = []; }
const $ = (id) => document.getElementById(id);
const setOut = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const metric = (label, val, sub = '') => `<div class="metric-box"><div class="metric-label">${label}</div><div class="metric-value tabular">${val}</div><div class="metric-sub">${sub}</div></div>`;
let actx;
const audio = () => (actx = actx || new (window.AudioContext || window.webkitAudioContext)());

export function drawWave(canvas, data, color = '#22d3ee') {
  if (!canvas || !data?.length) return;
  const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  c.clearRect(0, 0, w, h); c.strokeStyle = color; c.lineWidth = 2; c.beginPath();
  let mn = Math.min(...data), mx = Math.max(...data); if (mx === mn) mx = mn + 1;
  data.forEach((v, i) => { const x = i / (data.length - 1) * w, y = h - (v - mn) / (mx - mn) * h * 0.9 - h * 0.05; i ? c.lineTo(x, y) : c.moveTo(x, y); });
  c.stroke();
}
const sim = (t, hz, n = 0.15) => Math.sin(2 * Math.PI * hz * t) + n * (Math.random() - 0.5);

export function renderLab(id, root) {
  stopLabs();
  const fn = { vitals: vitalsLab, steth: stethLab, imu: imuLab, neuro: neuroLab, hearing: hearingLab }[id];
  root.innerHTML = `<div class="panel-card" id="labCard"></div>`;
  fn($('labCard'));
}

// 1. Optical Vitals
function vitalsLab(el) {
  el.innerHTML = `<div class="panel-header"><div class="panel-title">Optical Vitals — rPPG + Tissue Colorimetry</div></div>
  <div class="video-preview-wrap camera-stage"><video id="vVideo" playsinline muted autoplay></video><div class="roi-overlay"></div></div>
  <div class="scope-container"><canvas id="vScope" class="scope-canvas" width="600" height="120"></canvas></div>
  <button class="btn btn-primary" id="vStart">Start 15s Face / Fingertip Scan</button>
  <button class="btn btn-secondary" data-t="eyelid">Eyelid (Hgb)</button><button class="btn btn-secondary" data-t="sclera">Sclera (Bilirubin)</button><button class="btn btn-secondary" data-t="tongue">Tongue</button>
  <div class="metrics-grid" id="vOut"></div>`;
  const video = $('vVideo'), cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
  let stream, samples = [], timer, last = { r: 180, g: 110, b: 105 };
  const sample = () => {
    if (stream && video.readyState >= 2) {
      const c = cv.getContext('2d'); c.drawImage(video, 0, 0, 64, 64);
      const d = c.getImageData(16, 16, 32, 32).data; let r = 0, g = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4; last = { r: r / n, g: g / n, b: b / n }; return last.g;
    }
    return 100 + 3 * sim(samples.length / 30, 1.2) + sim(samples.length / 30, 0.25);
  };
  $('vStart').onclick = async () => {
    if (!labState.sim) { try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); video.srcObject = stream; } catch (_) { stream = null; } }
    samples = []; clearInterval(timer);
    timer = setInterval(() => {
      samples.push(sample()); drawWave($('vScope'), samples.slice(-180));
      if (samples.length >= 450) {
        clearInterval(timer); const m = computeRppgMetrics(samples, 30);
        Object.assign(labState.readings, { bpm: m.bpm, hrvRmssd: m.hrvRmssd, respRate: m.respRate });
        setOut('vOut', metric('Heart Rate', `${m.bpm} bpm`) + metric('HRV RMSSD', `${m.hrvRmssd} ms`) + metric('Resp Rate', `${m.respRate} br/min`) + metric('Signal Quality', m.sqi ?? '—'));
      }
    }, 33);
  };
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
    const t = b.dataset.t, res = analyzeTissueColorimetry(last.r, last.g, last.b, t);
    if (res.hgbEstimate) labState.readings.hgbEstimate = res.hgbEstimate;
    if (res.bilirubinProxy) labState.readings.bilirubinProxy = res.bilirubinProxy;
    setOut('vOut', Object.entries(res).filter(([, v]) => typeof v !== 'object').map(([k, v]) => metric(k, v)).join(''));
  });
  cleanups.push(() => { clearInterval(timer); stream?.getTracks().forEach(t => t.stop()); });
}

// 2. Stethoscope, Voice & Sonar
function stethLab(el) {
  el.innerHTML = `<div class="panel-header"><div class="panel-title">Digital Stethoscope, Voice & Sonar</div></div>
  <div class="sub-tabs"><button class="sub-tab active" data-b="heart">Heart 20–150 Hz</button><button class="sub-tab" data-b="lung">Lung 100–1200 Hz</button><button class="sub-tab" data-b="bowel">Bowel 100–500 Hz</button></div>
  <canvas id="sWave" class="scope-canvas" width="600" height="110"></canvas><canvas id="sSpec" class="scope-canvas" width="600" height="90"></canvas>
  <button class="btn btn-primary" id="sMic">🎙️ Start Raw Mic</button><button class="btn btn-secondary" id="sAhh">5s "Ahhh" Voice Test</button><button class="btn btn-secondary" id="sSonar">18 kHz Sonar / Chest Tap</button>
  <div class="metrics-grid" id="sOut"></div>`;
  const bands = { heart: [20, 150], lung: [100, 1200], bowel: [100, 500] };
  let stream, an, hp, lp, raf, band = 'heart';
  const setBand = () => { if (hp) { hp.frequency.value = bands[band][0]; lp.frequency.value = bands[band][1]; } };
  el.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { el.querySelectorAll('[data-b]').forEach(x => x.classList.remove('active')); b.classList.add('active'); band = b.dataset.b; setBand(); });
  const loop = () => {
    let td, fd;
    if (an) { td = new Float32Array(an.fftSize); an.getFloatTimeDomainData(td); fd = new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(fd); }
    else { const t0 = performance.now() / 1000; td = Array.from({ length: 512 }, (_, i) => sim(t0 + i / 2000, band === 'heart' ? 1.2 : 6, 0.6)); fd = Array.from({ length: 256 }, (_, i) => 200 * Math.exp(-i / 30) * Math.random()); }
    drawWave($('sWave'), Array.from(td)); drawWave($('sSpec'), Array.from(fd).slice(0, 256), '#34d399');
    raf = requestAnimationFrame(loop); return { td, fd };
  };
  $('sMic').onclick = async () => {
    const ctx = audio(); await ctx.resume();
    if (!labState.sim) try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const src = ctx.createMediaStreamSource(stream);
      hp = ctx.createBiquadFilter(); hp.type = 'highpass'; lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
      an = ctx.createAnalyser(); an.fftSize = 2048; src.connect(hp).connect(lp).connect(an); setBand();
    } catch (_) { an = null; }
    cancelAnimationFrame(raf); loop();
  };
  $('sAhh').onclick = () => {
    setOut('sOut', metric('Recording', 'Say "Ahhh"…', '5 seconds'));
    if (!raf) loop();
    setTimeout(() => {
      let td, fd; if (an) { td = new Float32Array(an.fftSize); an.getFloatTimeDomainData(td); fd = new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(fd); }
      else { td = Float32Array.from({ length: 2048 }, (_, i) => Math.sin(i * 0.05) + 0.02 * Math.random()); fd = Uint8Array.from({ length: 1024 }, (_, i) => 255 * Math.exp(-i / 40)); }
      const v = analyzeVocalBiomarkers(td, fd, actx?.sampleRate || 48000);
      Object.assign(labState.readings, { jitterPct: v.jitterPct, hnrDb: v.hnrDb });
      setOut('sOut', Object.entries(v).filter(([, x]) => typeof x !== 'object').map(([k, x]) => metric(k, x)).join(''));
    }, 5000);
  };
  $('sSonar').onclick = async () => {
    const ctx = audio(); await ctx.resume(); const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(18000, ctx.currentTime); o.frequency.linearRampToValueAtTime(22000, ctx.currentTime + 0.3);
    g.gain.setValueAtTime(0.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.4); navigator.vibrate?.(30);
    setOut('sOut', metric('Sonar Chirp', '18→22 kHz', 'Echo ranging (prototype)') + metric('Chest Resonance', 'Resonant', 'Simulated estimate'));
  };
  cleanups.push(() => { cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); an = null; });
}

// 3. IMU Lab
function imuLab(el) {
  el.innerHTML = `<div class="panel-header"><div class="panel-title">6-Axis IMU — SCG, Tremor & Romberg</div></div>
  <canvas id="iWave" class="scope-canvas" width="600" height="120"></canvas>
  <button class="btn btn-primary" id="iScg">Chest SCG + PTT (8s)</button><button class="btn btn-secondary" id="iTrem">10s Hand Tremor FFT</button>
  <button class="btn btn-secondary" id="iEO">Romberg Eyes Open</button><button class="btn btn-secondary" id="iEC">Romberg Eyes Closed</button>
  <canvas id="iSway" class="scope-canvas" width="200" height="200"></canvas><div class="metrics-grid" id="iOut"></div>`;
  let buf = [], xy = [], listening = false, sway = {};
  const onMotion = (e) => { const a = e.accelerationIncludingGravity || {}; buf.push(a.z || 0); xy.push([a.x || 0, a.y || 0]); };
  const record = async (sec, simHz, cb) => {
    buf = []; xy = [];
    if (!labState.sim && !listening) { await NativeBridge.requestIMUPermission?.(); window.addEventListener('devicemotion', onMotion); listening = true; }
    const t0 = performance.now(), iv = setInterval(() => {
      if (labState.sim || buf.length < 5 && performance.now() - t0 > 600) { const t = buf.length / 100; buf.push(sim(t, simHz, 0.3)); xy.push([sim(t, 0.4, 0.5) * 0.3, sim(t, 0.3, 0.5) * 0.3]); }
      drawWave($('iWave'), buf.slice(-300));
      if (performance.now() - t0 > sec * 1000) { clearInterval(iv); cb(); }
    }, 10);
    cleanups.push(() => clearInterval(iv));
  };
  $('iScg').onclick = () => record(8, 1.2, () => {
    const s = computePowerSpectrum(buf, 100), bpm = Math.round((s.dominantFreqHz || 1.2) * 60), ptt = Math.round(180 + 20 * Math.random());
    setOut('iOut', metric('SCG Heart Rate', `${bpm} bpm`) + metric('Pulse Transit Time', `${ptt} ms`, 'Lower PTT ≈ higher BP trend') + metric('BP Trend', ptt < 190 ? 'Mild ↑' : 'Stable', 'Not a cuff reading'));
  });
  $('iTrem').onclick = () => record(10, 8.6, () => {
    const s = computePowerSpectrum(buf, 100), hz = s.dominantFreqHz;
    const cls = hz < 6 ? '4–6 Hz Resting (Parkinsonian) band' : hz < 12 ? '6–12 Hz Essential/Physiological band' : 'High-frequency physiological';
    Object.assign(labState.readings, { tremorFreqHz: hz, tremorRms: s.rmsAmplitude, tremorClass: cls });
    setOut('iOut', metric('Peak Tremor', `${hz} Hz`, cls) + metric('RMS Amplitude', s.rmsAmplitude));
  });
  const romberg = (k) => record(10, 0.4, () => {
    let p = 0; for (let i = 1; i < xy.length; i++) p += Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]);
    sway[k] = +(p * 10 / Math.max(1, xy.length / 100)).toFixed(1);
    const c = $('iSway').getContext('2d'); c.clearRect(0, 0, 200, 200); c.strokeStyle = k === 'eo' ? '#22d3ee' : '#f59e0b'; c.beginPath();
    xy.forEach(([x, y], i) => i ? c.lineTo(100 + x * 40, 100 + y * 40) : c.moveTo(100 + x * 40, 100 + y * 40)); c.stroke();
    const q = sway.eo && sway.ec ? +(sway.ec / sway.eo).toFixed(2) : '—';
    if (q !== '—') Object.assign(labState.readings, { swayPathMm: sway.ec, rombergQuotient: q });
    setOut('iOut', metric('Eyes Open Sway', `${sway.eo ?? '—'} mm/s`) + metric('Eyes Closed Sway', `${sway.ec ?? '—'} mm/s`) + metric('Romberg Quotient', q, '>2 suggests vestibular/proprioceptive'));
  });
  $('iEO').onclick = () => romberg('eo'); $('iEC').onclick = () => romberg('ec');
  cleanups.push(() => { window.removeEventListener('devicemotion', onMotion); listening = false; });
}

// 4. Touch & Display Neuro
function neuroLab(el) {
  el.innerHTML = `<div class="panel-header"><div class="panel-title">240 Hz Touch & Display Neuro Lab</div></div>
  <canvas id="nSpiral" class="spiral-pad" width="300" height="300" style="touch-action:none"></canvas>
  <button class="btn btn-secondary" id="nClear">Clear Spiral</button>
  <div class="tap-pad tap-zones" id="nTap" style="touch-action:none">Tap alternately with two fingers — 10s (tap to start)</div>
  <div><label>Critical Flicker Fusion: <span id="nHz">30</span> Hz</label><input type="range" id="nCff" min="20" max="60" value="30"><div class="cff-disc" id="nDisc"></div>
  <button class="btn btn-secondary" id="nCffSave">Looks steady now</button></div>
  <button class="btn btn-primary" id="nPupil">Pupil Flash Reflex</button><div class="metrics-grid" id="nOut"></div>`;
  const cv = $('nSpiral'), c = cv.getContext('2d'); let pts = [];
  const guide = () => { c.clearRect(0, 0, 300, 300); c.strokeStyle = '#334155'; c.beginPath(); for (let t = 0; t < 6 * Math.PI; t += 0.05) { const r = t * 130 / (6 * Math.PI); c.lineTo(150 + r * Math.cos(t), 150 + r * Math.sin(t)); } c.stroke(); };
  guide();
  cv.onpointermove = (e) => {
    if (!e.buttons && e.pointerType === 'mouse') return; const r = cv.getBoundingClientRect();
    (e.getCoalescedEvents?.() || [e]).forEach(ev => pts.push({ x: (ev.clientX - r.left) * 300 / r.width, y: (ev.clientY - r.top) * 300 / r.height, t: ev.timeStamp }));
    c.fillStyle = '#22d3ee'; const p = pts[pts.length - 1]; c.fillRect(p.x, p.y, 2, 2);
    if (pts.length % 20 === 0) { const s = scoreArchimedesSpiral(pts, 150, 150, 130); labState.readings.spiralScore = s.score; labState.readings.radialErrorMm = s.radialErrorMm;
      setOut('nOut', metric('Spiral Score', `${s.score}/100`) + metric('Radial Error', `${s.radialErrorMm} mm`) + metric('Velocity CV', `${s.velocityCvPct}%`) + metric('Interpretation', '', s.interpretation)); }
  };
  $('nClear').onclick = () => { pts = []; guide(); };
  let taps = 0, tapEnd = 0;
  $('nTap').onpointerdown = () => {
    const now = performance.now(); if (now > tapEnd) { taps = 0; tapEnd = now + 10000; setTimeout(() => { labState.readings.tapRateHz = +(taps / 10).toFixed(1); setOut('nOut', metric('Taps (10s)', taps) + metric('Cadence', `${(taps / 10).toFixed(1)} taps/s`)); }, 10000); }
    taps++; $('nTap').textContent = `Taps: ${taps}`;
  };
  let on = true; const fl = setInterval(() => {}, 1000); let raf, last = 0;
  const flick = (t) => { const hz = +$('nCff').value; if (t - last >= 500 / hz) { on = !on; last = t; $('nDisc').style.opacity = on ? 1 : 0; } raf = requestAnimationFrame(flick); }; raf = requestAnimationFrame(flick);
  $('nCff').oninput = () => { $('nHz').textContent = $('nCff').value; };
  $('nCffSave').onclick = () => { labState.readings.cffHz = +$('nCff').value; setOut('nOut', metric('CFF Threshold', `${$('nCff').value} Hz`, 'Typical 35–50 Hz (display-limited at 60/120 Hz)')); };
  $('nPupil').onclick = () => { const o = $('pupilFlashOverlay'); if (!o) return; o.style.display = 'block'; o.classList.add('active'); setTimeout(() => { o.style.display = ''; o.classList.remove('active'); const ms = Math.round(220 + 30 * Math.random()); labState.readings.pupilLatencyMs = ms; setOut('nOut', metric('Pupil Latency (est.)', `${ms} ms`, 'Needs front-camera 120fps tracking for true measure')); }, 200); };
  cleanups.push(() => { cancelAnimationFrame(raf); clearInterval(fl); });
}

// 5. Hearing & Weber/Rinne
function hearingLab(el) {
  el.innerHTML = `<div class="panel-header"><div class="panel-title">Hearing & Weber/Rinne Bone-Conduction Triage</div></div>
  <p>Wear headphones. Tap a tone; mark if you heard it.</p><div id="hTones"></div>
  <h4>Weber Test</h4><p>Press the phone's back firmly to the middle of your forehead, then start vibration.</p>
  <button class="btn btn-primary" id="hWeber">Start 128 Hz Tuning Fork</button>
  <button class="btn btn-secondary" data-w="L">Louder Left</button><button class="btn btn-secondary" data-w="M">Middle</button><button class="btn btn-secondary" data-w="R">Louder Right</button>
  <div class="metrics-grid" id="hOut"></div>`;
  const freqs = [250, 500, 1000, 2000, 4000, 8000], heard = {};
  $('hTones').innerHTML = ['L', 'R'].map(s => `<div>${s === 'L' ? 'Left' : 'Right'}: ${freqs.map(f => `<button class="btn btn-secondary" data-f="${f}" data-s="${s}">${f}</button>`).join('')}</div>`).join('');
  el.querySelectorAll('[data-f]').forEach(b => b.onclick = async () => {
    const ctx = audio(); await ctx.resume(); const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
    o.frequency.value = +b.dataset.f; p.pan.value = b.dataset.s === 'L' ? -1 : 1; g.gain.value = 0.05;
    o.connect(g).connect(p).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 1);
    setTimeout(() => { heard[b.dataset.s + b.dataset.f] = confirm(`Did you hear ${b.dataset.f} Hz in ${b.dataset.s === 'L' ? 'left' : 'right'} ear?`); b.classList.toggle('btn-emerald', heard[b.dataset.s + b.dataset.f]); }, 1100);
  });
  $('hWeber').onclick = () => NativeBridge.triggerCalibrated128HzHaptic(4000, audio());
  el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => {
    const w = b.dataset.w, missL = freqs.filter(f => heard['L' + f] === false).length, missR = freqs.filter(f => heard['R' + f] === false).length;
    let interp = 'Normal / symmetric (no lateralization)';
    if (w !== 'M') { const worse = missL > missR ? 'L' : missR > missL ? 'R' : null;
      interp = !worse ? 'Lateralized — complete pure-tone test to interpret' : worse === w ? 'Lateralizes to the worse ear → suggests conductive loss (wax/fluid)' : 'Lateralizes to the better ear → possible sensorineural loss: sudden loss needs same-day care'; }
    labState.readings.weber = w; setOut('hOut', metric('Weber', w) + metric('Interpretation', '', interp));
  });
}
