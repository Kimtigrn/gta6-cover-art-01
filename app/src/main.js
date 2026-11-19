// Vice City Cover Studio v3 — the editor wiring: layout / size / grade
// pickers, per-panel photos with crop presets + duotone, drag to pan, caption
// editing, motifs, and PNG export (one size, or all three sizes at once).
// A `?shot=` query hands control to ./shots.js, which sets up a fixed scene
// for a screenshot instead. Photos are read on this machine only and never
// leave it.
import { drawCover, panelAt, LAYOUTS, PRESETS, CROPS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');

export const SIZES = {
  square: { label: '1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 x 1350', w: 1080, h: 1350 },
  wide: { label: '1920 x 1080', w: 1920, h: 1080 },
};

// Nine panel slots: the largest layout (9-panel grid) needs nine. Smaller
// layouts simply ignore the extra slots.
function emptyPanel() {
  return { img: null, key: null, zoom: 1, ox: 0, oy: 0, duotone: false, tone: 0.55, crop: 'fill' };
}

const state = {
  layout: 'mosaic',
  size: 'square',
  preset: 'amber',
  title: 'VICE CITY',
  subtitle: 'A LEONIDA STORY',
  grain: true,
  vignette: true,
  duotone: false,
  motifs: true,
  panels: Array.from({ length: 9 }, emptyPanel),
};

let selected = 0;
let drag = null;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function activePanelCount() {
  return LAYOUTS[state.layout].panels.length;
}

function paint() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
    canvas.style.aspectRatio = `${size.w} / ${size.h}`;
  }
  drawCover(canvas, state);
  document.getElementById('panelName').textContent = String(selected + 1);
  const panel = state.panels[selected];
  document.getElementById('zoom').value = String(panel.zoom);
  document.getElementById('crop').value = panel.crop;
  document.getElementById('tone').value = String(panel.tone);
  document.getElementById('duotonePanel').checked = panel.duotone;
}

function highlight(containerId, value) {
  for (const b of document.getElementById(containerId).children) {
    b.classList.toggle('on', b.dataset.value === value);
  }
}

function buildPicker(containerId, entries, onPick) {
  const box = document.getElementById(containerId);
  for (const [value, entry] of Object.entries(entries)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.value = value;
    b.textContent = entry.label;
    b.addEventListener('click', () => onPick(value));
    box.appendChild(b);
  }
}

buildPicker('layouts', LAYOUTS, (v) => {
  state.layout = v;
  selected = Math.min(selected, activePanelCount() - 1);
  highlight('layouts', v);
  paint();
});
buildPicker('sizes', SIZES, (v) => {
  state.size = v;
  highlight('sizes', v);
  paint();
});
buildPicker('presets', PRESETS, (v) => {
  state.preset = v;
  highlight('presets', v);
  paint();
});
highlight('layouts', state.layout);
highlight('sizes', state.size);
highlight('presets', state.preset);

// Crop preset select: built from CROPS in cover.js so the list stays in sync.
const cropSelect = document.getElementById('crop');
for (const [value, entry] of Object.entries(CROPS)) {
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = entry.label;
  cropSelect.appendChild(opt);
}

function bindText(id, apply) {
  document.getElementById(id).addEventListener('input', (e) => { apply(e.target.value); paint(); });
}
function bindCheck(id, apply) {
  document.getElementById(id).addEventListener('change', (e) => { apply(e.target.checked); paint(); });
}
bindText('title', (v) => { state.title = v; });
bindText('subtitle', (v) => { state.subtitle = v; });
bindCheck('grain', (v) => { state.grain = v; });
bindCheck('vignette', (v) => { state.vignette = v; });
bindCheck('motifs', (v) => { state.motifs = v; });

document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[selected].zoom = Number(e.target.value);
  paint();
});
cropSelect.addEventListener('change', (e) => {
  const panel = state.panels[selected];
  const crop = CROPS[e.target.value] ?? CROPS.fill;
  panel.crop = e.target.value;
  panel.zoom = crop.zoom;
  panel.oy = crop.oy;
  paint();
});
document.getElementById('tone').addEventListener('input', (e) => {
  state.panels[selected].tone = Number(e.target.value);
  paint();
});
document.getElementById('duotonePanel').addEventListener('change', (e) => {
  state.panels[selected].duotone = e.target.checked;
  paint();
});

async function placePhoto(i, img, key) {
  state.panels[i].img = img;
  state.panels[i].key = key;
  state.panels[i].zoom = 1;
  state.panels[i].ox = 0;
  state.panels[i].oy = 0;
  state.panels[i].crop = 'fill';
  paint();
}

document.getElementById('samplePier').addEventListener('click', async () => {
  await placePhoto(selected, await loadImage('samples/pier.jpg'), 'pier');
});
document.getElementById('sampleBoulevard').addEventListener('click', async () => {
  await placePhoto(selected, await loadImage('samples/boulevard.jpg'), 'boulevard');
});
document.getElementById('upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await placePhoto(selected, await loadImage(URL.createObjectURL(file)), 'upload');
  status.textContent = `Loaded ${file.name} into panel ${selected + 1}.`;
});
document.getElementById('fillAll').addEventListener('click', () => {
  const src = state.panels[selected];
  if (!src.img) { status.textContent = 'Pick a photo for this panel first.'; return; }
  for (let i = 0; i < activePanelCount(); i++) {
    state.panels[i].img = src.img;
    state.panels[i].key = src.key;
    state.panels[i].zoom = src.zoom;
    state.panels[i].ox = src.ox;
    state.panels[i].oy = src.oy;
    state.panels[i].duotone = src.duotone;
    state.panels[i].tone = src.tone;
  }
  status.textContent = 'One photo now fills every panel.';
  paint();
});
document.getElementById('duotoneAll').addEventListener('click', () => {
  const on = state.panels[selected].duotone;
  for (let i = 0; i < activePanelCount(); i++) {
    state.panels[i].duotone = on;
    state.panels[i].tone = state.panels[selected].tone;
  }
  status.textContent = on ? 'Duotone on for every panel.' : 'Duotone off for every panel.';
  paint();
});
document.getElementById('clearPanel').addEventListener('click', () => {
  state.panels[selected] = emptyPanel();
  paint();
});
document.getElementById('resetPanels').addEventListener('click', () => {
  state.panels = Array.from({ length: 9 }, emptyPanel);
  selected = 0;
  status.textContent = 'All panels cleared.';
  paint();
});

function pointerInCanvas(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

canvas.addEventListener('pointerdown', (e) => {
  const p = pointerInCanvas(e);
  const i = panelAt(state.layout, canvas.width, canvas.height, p.x, p.y);
  if (i === -1) return;
  selected = i;
  drag = { x: p.x, y: p.y, ox: state.panels[i].ox, oy: state.panels[i].oy };
  canvas.setPointerCapture(e.pointerId);
  paint();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = pointerInCanvas(e);
  const panel = state.panels[selected];
  const frac = LAYOUTS[state.layout].panels[selected];
  panel.ox = drag.ox + (p.x - drag.x) / (frac[2] * canvas.width);
  panel.oy = drag.oy + (p.y - drag.y) / (frac[3] * canvas.height);
  paint();
});
canvas.addEventListener('pointerup', () => { drag = null; });

/** Renders the cover at one export size and returns it as a PNG blob. */
function renderBlob(size) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    drawCover(off, state);
    off.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function saveBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** Renders the cover at the chosen export size and downloads it as a PNG. */
export async function exportPNG() {
  const size = SIZES[state.size];
  const blob = await renderBlob(size);
  saveBlob(blob, `cover-${size.w}x${size.h}.png`);
  status.textContent = `Saved cover-${size.w}x${size.h}.png`;
}

/** Renders all three post sizes at once and downloads three PNGs. */
export async function exportAllPNG() {
  const names = [];
  for (const [key, size] of Object.entries(SIZES)) {
    const blob = await renderBlob(size);
    saveBlob(blob, `cover-${size.w}x${size.h}.png`);
    names.push(`${size.w}x${size.h}`);
    // Small pause so the browser keeps all three downloads instead of
    // collapsing them into one.
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  status.textContent = `Saved all sizes: ${names.join(', ')}.`;
}
document.getElementById('export').addEventListener('click', exportPNG);
document.getElementById('exportAll').addEventListener('click', exportAllPNG);

// The lettering uses the system sans-serif stack (no bundled font file),
// so there is nothing to preload before the first paint — just wait for
// whatever system faces are loading, then paint.
async function boot() {
  try {
    await document.fonts.ready;
  } catch { /* no system faces to wait for */ }
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    await runShot(shot, params, {
      state, setPanelPhoto: placePhoto, redraw: paint, markButtons: highlight, SIZES,
    });
  } else {
    // Default scene: the pier sample in the hero panel, boulevard below.
    try {
      const pier = await loadImage('samples/pier.jpg');
      const boulevard = await loadImage('samples/boulevard.jpg');
      const keys = ['pier', 'boulevard'];
      for (let i = 0; i < 6; i++) {
        state.panels[i].img = i % 2 === 0 ? pier : boulevard;
        state.panels[i].key = keys[i % 2];
      }
    } catch { /* samples missing: panels stay empty */ }
    paint();
  }
}

boot();
