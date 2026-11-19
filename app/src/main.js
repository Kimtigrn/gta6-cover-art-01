// Wires the editor: layout / size / grade pickers, per-panel photos, drag to pan,
// caption editing and PNG export. A `?shot=` query sets up a fixed scene for a
// screenshot instead (./shots.js). Photos are read on this machine only.
import { drawCover, panelAt, LAYOUTS, PRESETS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');

export const SIZES = {
  square: { label: '1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 x 1350', w: 1080, h: 1350 },
  wide: { label: '1920 x 1080', w: 1920, h: 1080 },
};

const state = {
  layout: 'hero2',
  size: 'square',
  preset: 'sunset',
  title: 'VICE CITY',
  subtitle: 'A LEONIDA STORY',
  grain: true,
  vignette: true,
  panels: [
    { img: null, key: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, key: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, key: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, key: null, zoom: 1, ox: 0, oy: 0 },
  ],
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
  document.getElementById('zoom').value = String(state.panels[selected].zoom);
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

document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
document.getElementById('vignette').addEventListener('change', (e) => { state.vignette = e.target.checked; redraw(); });
document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[selected].zoom = Number(e.target.value);
  redraw();
});

async function setPanelPhoto(i, img, key) {
  state.panels[i].img = img;
  state.panels[i].key = key;
  state.panels[i].zoom = 1;
  state.panels[i].ox = 0;
  state.panels[i].oy = 0;
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
  }
  status.textContent = 'One photo now fills every panel.';
  redraw();
});
document.getElementById('clearPanel').addEventListener('click', () => {
  state.panels[selected] = { img: null, key: null, zoom: 1, ox: 0, oy: 0 };
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

/** Renders the cover at the chosen export size and downloads it as a PNG. */
export function exportPNG() {
  return new Promise((resolve) => {
    const size = SIZES[state.size];
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    drawCover(off, state);
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cover-${size.w}x${size.h}.png`;
      a.click();
      status.textContent = `Saved cover-${size.w}x${size.h}.png`;
      resolve();
    }, 'image/png');
  });
}
document.getElementById('export').addEventListener('click', exportPNG);

// The bold display font must be ready before the first paint, or the canvas
// falls back to a system face and the lettering changes between runs.
async function start() {
  try {
    await document.fonts.load('900 100px "Liberation Sans"');
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
    } catch { /* samples missing: panels stay empty */ }
    redraw();
  }
}

start();
