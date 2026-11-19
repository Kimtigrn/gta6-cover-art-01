// Vice City Cover Studio v2 — wires the editor: layout / size / grade pickers,
// per-panel photos with crop presets + duotone, drag to pan, caption editing,
// motifs, and PNG export (one size, or all three sizes at once). A `?shot=`
// query sets up a fixed scene for a screenshot instead (./shots.js). Photos are
// read on this machine only and never leave it.
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
function blankPanel() {
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
  panels: Array.from({ length: 9 }, blankPanel),
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

function panelCount() {
  return LAYOUTS[state.layout].panels.length;
}

function redraw() {
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

function markButtons(containerId, value) {
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
  selected = Math.min(selected, panelCount() - 1);
  markButtons('layouts', v);
  redraw();
});
buildPicker('sizes', SIZES, (v) => {
  state.size = v;
  markButtons('sizes', v);
  redraw();
});
buildPicker('presets', PRESETS, (v) => {
  state.preset = v;
  markButtons('presets', v);
  redraw();
});
markButtons('layouts', state.layout);
markButtons('sizes', state.size);
markButtons('presets', state.preset);

// Crop preset select: built from CROPS in cover.js so the list stays in sync.
const cropSelect = document.getElementById('crop');
for (const [value, entry] of Object.entries(CROPS)) {
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = entry.label;
  cropSelect.appendChild(opt);
}

document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
document.getElementById('vignette').addEventListener('change', (e) => { state.vignette = e.target.checked; redraw(); });
document.getElementById('motifs').addEventListener('change', (e) => { state.motifs = e.target.checked; redraw(); });
document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[selected].zoom = Number(e.target.value);
  redraw();
});
cropSelect.addEventListener('change', (e) => {
  const panel = state.panels[selected];
  const crop = CROPS[e.target.value] ?? CROPS.fill;
  panel.crop = e.target.value;
  panel.zoom = crop.zoom;
  panel.oy = crop.oy;
  redraw();
});
document.getElementById('tone').addEventListener('input', (e) => {
  state.panels[selected].tone = Number(e.target.value);
  redraw();
});
document.getElementById('duotonePanel').addEventListener('change', (e) => {
  state.panels[selected].duotone = e.target.checked;
  redraw();
});

async function setPanelPhoto(i, img, key) {
  state.panels[i].img = img;
  state.panels[i].key = key;
  state.panels[i].zoom = 1;
  state.panels[i].ox = 0;
  state.panels[i].oy = 0;
  state.panels[i].crop = 'fill';
  redraw();
}

document.getElementById('samplePier').addEventListener('click', async () => {
  await setPanelPhoto(selected, await loadImage('samples/pier.jpg'), 'pier');
});
document.getElementById('sampleBoulevard').addEventListener('click', async () => {
  await setPanelPhoto(selected, await loadImage('samples/boulevard.jpg'), 'boulevard');
});
document.getElementById('upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await setPanelPhoto(selected, await loadImage(URL.createObjectURL(file)), 'upload');
  status.textContent = `Loaded ${file.name} into panel ${selected + 1}.`;
});
document.getElementById('fillAll').addEventListener('click', () => {
  const src = state.panels[selected];
  if (!src.img) { status.textContent = 'Pick a photo for this panel first.'; return; }
  for (let i = 0; i < panelCount(); i++) {
    state.panels[i].img = src.img;
    state.panels[i].key = src.key;
    state.panels[i].zoom = src.zoom;
    state.panels[i].ox = src.ox;
    state.panels[i].oy = src.oy;
    state.panels[i].duotone = src.duotone;
    state.panels[i].tone = src.tone;
  }
  status.textContent = 'One photo now fills every panel.';
  redraw();
});
document.getElementById('duotoneAll').addEventListener('click', () => {
  const on = state.panels[selected].duotone;
  for (let i = 0; i < panelCount(); i++) {
    state.panels[i].duotone = on;
    state.panels[i].tone = state.panels[selected].tone;
  }
  status.textContent = on ? 'Duotone on for every panel.' : 'Duotone off for every panel.';
  redraw();
});
document.getElementById('clearPanel').addEventListener('click', () => {
  state.panels[selected] = blankPanel();
  redraw();
});

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = panelAt(state.layout, canvas.width, canvas.height, p.x, p.y);
  if (i === -1) return;
  selected = i;
  drag = { x: p.x, y: p.y, ox: state.panels[i].ox, oy: state.panels[i].oy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[selected];
  const rect = LAYOUTS[state.layout].panels[selected];
  panel.ox = drag.ox + (p.x - drag.x) / (rect[2] * canvas.width);
  panel.oy = drag.oy + (p.y - drag.y) / (rect[3] * canvas.height);
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

/** Renders the cover at one export size and downloads it as a PNG. */
function renderToBlob(size) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    drawCover(off, state);
    off.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** Renders the cover at the chosen export size and downloads it as a PNG. */
export async function exportPNG() {
  const size = SIZES[state.size];
  const blob = await renderToBlob(size);
  downloadBlob(blob, `cover-${size.w}x${size.h}.png`);
  status.textContent = `Saved cover-${size.w}x${size.h}.png`;
}

/** Renders all three post sizes at once and downloads three PNGs. */
export async function exportAllPNG() {
  const names = [];
  for (const [key, size] of Object.entries(SIZES)) {
    const blob = await renderToBlob(size);
    downloadBlob(blob, `cover-${size.w}x${size.h}.png`);
    names.push(`${size.w}x${size.h}`);
    // Small pause so the browser keeps all three downloads instead of
    // collapsing them into one.
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  status.textContent = `Saved all sizes: ${names.join(', ')}.`;
}
document.getElementById('export').addEventListener('click', exportPNG);
document.getElementById('exportAll').addEventListener('click', exportAllPNG);

// The bold display font must be ready before the first paint, or the canvas
// falls back to a system face and the lettering changes between runs.
async function start() {
  try {
    await document.fonts.load('900 100px "Liberation Sans"');
    await document.fonts.load('italic 700 40px "Liberation Sans"');
    await document.fonts.load('700 40px "Liberation Sans"');
    await document.fonts.ready;
  } catch { /* system face is an acceptable fallback */ }
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), {
      state, setPanelPhoto, redraw, markButtons, SIZES,
    });
  } else {
    // Default scene: the pier sample in the hero panel, boulevard below.
    try {
      const pier = await loadImage('samples/pier.jpg');
      const boulevard = await loadImage('samples/boulevard.jpg');
      state.panels[0].img = pier;
      state.panels[0].key = 'pier';
      state.panels[1].img = boulevard;
      state.panels[1].key = 'boulevard';
      state.panels[2].img = pier;
      state.panels[2].key = 'pier';
      state.panels[3].img = boulevard;
      state.panels[3].key = 'boulevard';
      state.panels[4].img = pier;
      state.panels[4].key = 'pier';
      state.panels[5].img = boulevard;
      state.panels[5].key = 'boulevard';
    } catch { /* samples missing: panels stay empty */ }
    redraw();
  }
}

start();
