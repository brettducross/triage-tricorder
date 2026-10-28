/**
 * Home Triage Tricorder — Centralized UI Theme, Layout & Button Configuration
 * ============================================================================
 * Edit this single file (or use the in-app "🎨 Customize UI" drawer) to change:
 *   1. Color Schemes (cyan-hud, clinical-light, amber-tactical, emerald-bio)
 *   2. Layout Modes (split, stacked, compact)
 *   3. Button Shapes & Sizes (rounded, pill, sharp | normal, large-touch)
 *   4. Navigation Tab Order, Labels & Primary CTA Button Copy/URLs
 */

export const UI_CONFIG_STORAGE_KEY = 'htt_ui_config_v1';

export const THEME_PRESETS = {
  'cyan-hud': {
    id: 'cyan-hud',
    label: '🌌 Sci-Fi Cyan HUD (Default)',
    tokens: {
      '--bg-primary': '#060b14',
      '--bg-elevated': '#0c1424',
      '--bg-card': '#101b30',
      '--bg-glass': 'rgba(16, 27, 48, 0.84)',
      '--border-subtle': 'rgba(148, 163, 184, 0.16)',
      '--border-accent': 'rgba(0, 242, 254, 0.45)',
      '--text-primary': '#f1f5f9',
      '--text-secondary': '#94a3b8',
      '--text-muted': '#64748b',
      '--accent-primary': '#0ea5e9',
      '--accent-secondary': '#10b981',
      '--cyan': '#00f2fe',
      '--sky': '#0ea5e9',
      '--emerald': '#10b981',
      '--amber': '#f59e0b',
      '--rose': '#f43f5e'
    }
  },
  'clinical-light': {
    id: 'clinical-light',
    label: '🏥 Clinical Daylight (White & Navy)',
    tokens: {
      '--bg-primary': '#f1f5f9',
      '--bg-elevated': '#ffffff',
      '--bg-card': '#ffffff',
      '--bg-glass': 'rgba(255, 255, 255, 0.92)',
      '--border-subtle': 'rgba(15, 23, 42, 0.14)',
      '--border-accent': 'rgba(2, 132, 199, 0.5)',
      '--text-primary': '#0f172a',
      '--text-secondary': '#334155',
      '--text-muted': '#64748b',
      '--accent-primary': '#0284c7',
      '--accent-secondary': '#059669',
      '--cyan': '#0284c7',
      '--sky': '#0369a1',
      '--emerald': '#059669',
      '--amber': '#d97706',
      '--rose': '#e11d48'
    }
  },
  'amber-tactical': {
    id: 'amber-tactical',
    label: '🟠 Night-Shift Amber (Low Blue Light)',
    tokens: {
      '--bg-primary': '#0c0905',
      '--bg-elevated': '#161008',
      '--bg-card': '#1f160b',
      '--bg-glass': 'rgba(31, 22, 11, 0.88)',
      '--border-subtle': 'rgba(245, 158, 11, 0.2)',
      '--border-accent': 'rgba(251, 191, 36, 0.5)',
      '--text-primary': '#fef3c7',
      '--text-secondary': '#fbbf24',
      '--text-muted': '#b45309',
      '--accent-primary': '#f59e0b',
      '--accent-secondary': '#10b981',
      '--cyan': '#fbbf24',
      '--sky': '#f59e0b',
      '--emerald': '#34d399',
      '--amber': '#f59e0b',
      '--rose': '#f43f5e'
    }
  },
  'emerald-bio': {
    id: 'emerald-bio',
    label: '🧬 Bio-Telemetry Emerald',
    tokens: {
      '--bg-primary': '#04100c',
      '--bg-elevated': '#071c15',
      '--bg-card': '#0b271e',
      '--bg-glass': 'rgba(11, 39, 30, 0.88)',
      '--border-subtle': 'rgba(52, 211, 153, 0.18)',
      '--border-accent': 'rgba(16, 185, 129, 0.5)',
      '--text-primary': '#ecfdf5',
      '--text-secondary': '#6ee7b7',
      '--text-muted': '#34d399',
      '--accent-primary': '#10b981',
      '--accent-secondary': '#06b6d4',
      '--cyan': '#34d399',
      '--sky': '#10b981',
      '--emerald': '#06b6d4',
      '--amber': '#f59e0b',
      '--rose': '#f43f5e'
    }
  }
};

export const LAYOUT_MODES = {
  split: {
    id: 'split',
    label: '🪟 2-Column Cockpit Split',
    description: 'Side-by-side anatomical scanner & telemetry panels on wider screens.'
  },
  stacked: {
    id: 'stacked',
    label: '📱 Focused Single-Column Stack',
    description: 'Full-width stacked cards for maximum readability and mobile thumb reach.'
  },
  compact: {
    id: 'compact',
    label: '📊 High-Density Clinical Grid',
    description: 'Tighter padding and compact telemetry cards to fit more data per screen.'
  }
};

export const BUTTON_SHAPES = {
  rounded: { id: 'rounded', label: 'Rounded (8px)', radius: '8px' },
  pill: { id: 'pill', label: 'Pill (Full Capsule)', radius: '999px' },
  sharp: { id: 'sharp', label: 'Tactical Sharp (3px)', radius: '3px' }
};

export const BUTTON_SIZES = {
  normal: { id: 'normal', label: 'Standard Clinical', padY: '10px', padX: '16px', fontSize: '0.85rem' },
  'large-touch': { id: 'large-touch', label: 'Large Mobile Touch', padY: '13px', padX: '20px', fontSize: '0.93rem' }
};

export const DEFAULT_BUTTON_CONFIG = {
  navTabs: [
    { id: 'home', label: '🏠 Home & Baseline', visible: true },
    { id: 'checkup', label: '⚡ 60s Checkup Scan', visible: true },
    { id: 'triage', label: '🩺 Symptom Triage', visible: true },
    { id: 'toolbox', label: "🧰 Doctor's Black Bag", visible: true },
    { id: 'native', label: '📱 History & Bridge', visible: true }
  ],
  ctas: {
    activateLiveSensors: '📡 Activate Live Phone Sensors (Camera, Mic & 6-Axis Motion)',
    start60sScan: '▶ Start 60s Multi-Sensor Scan',
    saveBaseline: '✔ Save Personal Baseline',
    printHandoffPdf: '🖨️ Print / Save 1-Page Doctor Handoff PDF',
    proUnlockLabel: '🔓 Unlock Family Lifetime Pass ($29.99)',
    proUnlockUrl: 'https://buy.stripe.com/14A28qapz5nmeUG9hMd3i0e'
  }
};

export const DEFAULT_UI_CONFIG = {
  theme: 'cyan-hud',
  layout: 'split',
  buttonShape: 'rounded',
  buttonSize: 'normal',
  navTabs: DEFAULT_BUTTON_CONFIG.navTabs,
  ctas: { ...DEFAULT_BUTTON_CONFIG.ctas }
};

export function loadUIConfig() {
  try {
    const raw = localStorage.getItem(UI_CONFIG_STORAGE_KEY);
    if (!raw) return structuredClone ? structuredClone(DEFAULT_UI_CONFIG) : JSON.parse(JSON.stringify(DEFAULT_UI_CONFIG));
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_UI_CONFIG,
      ...parsed,
      navTabs: Array.isArray(parsed.navTabs) && parsed.navTabs.length ? parsed.navTabs : DEFAULT_BUTTON_CONFIG.navTabs,
      ctas: { ...DEFAULT_BUTTON_CONFIG.ctas, ...(parsed.ctas || {}) }
    };
  } catch (_) {
    return JSON.parse(JSON.stringify(DEFAULT_UI_CONFIG));
  }
}

export function saveUIConfig(cfg) {
  const merged = {
    ...DEFAULT_UI_CONFIG,
    ...cfg,
    ctas: { ...DEFAULT_BUTTON_CONFIG.ctas, ...(cfg.ctas || {}) }
  };
  try {
    localStorage.setItem(UI_CONFIG_STORAGE_KEY, JSON.stringify(merged));
  } catch (_) {}
  applyUIConfig(merged);
  return merged;
}

export function resetUIConfig() {
  try {
    localStorage.removeItem(UI_CONFIG_STORAGE_KEY);
  } catch (_) {}
  const fresh = JSON.parse(JSON.stringify(DEFAULT_UI_CONFIG));
  applyUIConfig(fresh);
  return fresh;
}

export function applyUIConfig(cfg = loadUIConfig()) {
  if (typeof document === 'undefined') return cfg;
  const rootEl = document.documentElement;
  const preset = THEME_PRESETS[cfg.theme] || THEME_PRESETS['cyan-hud'];
  Object.entries(preset.tokens).forEach(([k, v]) => rootEl.style.setProperty(k, v));

  const shape = BUTTON_SHAPES[cfg.buttonShape] || BUTTON_SHAPES.rounded;
  const size = BUTTON_SIZES[cfg.buttonSize] || BUTTON_SIZES.normal;
  rootEl.style.setProperty('--btn-radius', shape.radius);
  rootEl.style.setProperty('--radius-sm', shape.radius);
  rootEl.style.setProperty('--btn-pad-y', size.padY);
  rootEl.style.setProperty('--btn-pad-x', size.padX);
  rootEl.style.setProperty('--btn-font-size', size.fontSize);

  document.body?.setAttribute('data-theme', preset.id);
  document.body?.setAttribute('data-layout', cfg.layout || 'split');
  document.body?.setAttribute('data-btn-shape', shape.id);
  document.body?.setAttribute('data-btn-size', size.id);
  return cfg;
}
