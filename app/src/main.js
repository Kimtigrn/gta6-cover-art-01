// Vice City Cover Studio — the editor: state, pickers, panel editing, export.
//
// The editor keeps one state object (layout, grade, size, caption, one panel per
// layout cell) and repaints the preview canvas on every change. Photos are the two
// bundled samples plus anything the user uploads; panels remember their own photo,
// zoom, pan point, crop, duotone and tone. Export renders the same state offscreen
// at the exact post sizes and downloads PNGs.
import {
  SIZES, LAYOUTS, GRADES, CROPS,
  renderCover, gradeById, cropById, layoutById, defaultPanel,
} from './cover.js';
import { parseShot } from './shots.js';

const SAMPLES = [
  { key: 'pier', label: 'Pier', src: 'samples/pier.jpg' },
  { key: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' },
];

const state = {
  layout: 'duo',
  grade: 'violet',
  size: 'wide',
  title: 'VICE | CITY',
  subtitle: 'A LEONIDA STORY',
  panels: [],
};

let photos = []; // { key, label, src, img } — samples first, then uploads.
let selected = 0;
let shotSpec = null;

const preview = document.getElementById('preview');
const coverCanvas = document.getElementById('cover');

/** Rebuild the panel list for the current layout, keeping edits where cells match. */
function buildPanels() {
  const cells = layoutById(state.layout).cells(100, 100);
  const next = [];
  for (let i = 0; i < cells.length; i++) {
    const old = state.panels[i];
    next.push(old ?? defaultPanel(i % Math.max(1, photos.length)));
  }
  state.panels = next;
  selected = Math.min(selected, next.length - 1);
}

/** Keep a panel's pan point inside the photo so no gap ever shows. */
function clampPan(panel, cell, img) {
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(cell.w / iw, cell.h / ih) * panel.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const minPx = cell.w / (2 * dw);
  const minPy = cell.h / (2 * dh);
  panel.px = Math.min(Math.max(panel.px, minPx), 1 - minPx);
  panel.py = Math.min(Math.max(panel.py, minPy), 1 - minPy);
}

/** The preview canvas's pixel size for the current export size (max 960 wide). */
function previewDims() {
  const s = SIZES[state.size] ?? SIZES.wide;
  const scale = Math.min(1, 960 / Math.max(s.w, s.h));
  return { w: Math.round(s.w * scale), h: Math.round(s.h * scale) };
}

/** Paint the editor preview. */
function renderPreview() {
  const dims = previewDims();
  preview.width = dims.w;
  preview.height = dims.h;
  renderCover(preview, state, photos.map((p) => p.img ?? null), dims);
}

/** Paint a cover at exact pixel dimensions (export and shot mode). */
function renderExact(canvas, w, h) {
  renderCover(canvas, state, photos.map((p) => p.img ?? null), { w, h });
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadPhotos() {
  for (const s of SAMPLES) {
    const img = await loadImage(s.src);
    photos.push({ key: s.key, label: s.label, src: s.src, img });
  }
  buildPanels();
}

/** One picker button row from a list of {id, label} and the current value. */
function fillChips(containerId, items, current, onPick) {
  const box = document.getElementById(containerId);
  box.innerHTML = '';
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.label;
    if (item.id === current) b.classList.add('active');
    b.addEventListener('click', () => onPick(item.id));
    box.appendChild(b);
  }
}

function buildPickers() {
  fillChips('layoutRow', LAYOUTS, state.layout, (id) => {
    state.layout = id;
    buildPanels();
    buildPickers();
    syncPanelControls();
    renderPreview();
  });
  fillChips('gradeRow', GRADES, state.grade, (id) => {
    state.grade = id;
    buildPickers();
    renderPreview();
  });
  fillChips('sizeRow', Object.entries(SIZES).map(([id, s]) => ({ id, label: s.label })), state.size, (id) => {
    state.size = id;
    buildPickers();
    renderPreview();
  });
  fillChips('cropRow', CROPS, state.panels[selected]?.crop ?? 'full', (id) => {
    const panel = state.panels[selected];
    if (!panel) return;
    const preset = cropById(id);
    panel.crop = id;
    panel.zoom = preset.zoom;
    panel.px = preset.px;
    panel.py = preset.py;
    syncPanelControls();
    renderPreview();
  });
  const photoRow = document.getElementById('photoRow');
  photoRow.innerHTML = '';
  photos.forEach((photo, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = photo.label;
    if (state.panels[selected]?.photo === i) b.classList.add('active');
    b.addEventListener('click', () => {
      const panel = state.panels[selected];
      if (!panel) return;
      panel.photo = i;
      buildPickers();
      renderPreview();
    });
    photoRow.appendChild(b);
  });
}

function syncPanelControls() {
  const panel = state.panels[selected];
  if (!panel) return;
  document.getElementById('zoomRange').value = String(panel.zoom);
  document.getElementById('duotoneBox').checked = panel.duotone;
  document.getElementById('toneRange').value = String(panel.tone);
  document.querySelectorAll('#cropRow button').forEach((b, i) => {
    b.classList.toggle('active', CROPS[i].id === panel.crop);
  });
}

function downloadCanvas(canvas, name) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

async function exportSize(sizeId) {
  const s = SIZES[sizeId];
  const off = document.createElement('canvas');
  renderExact(off, s.w, s.h);
  downloadCanvas(off, `cover-${sizeId}-${s.w}x${s.h}.png`);
}

async function exportAll() {
  for (const sizeId of Object.keys(SIZES)) {
    exportSize(sizeId);
    await new Promise((r) => setTimeout(r, 350));
  }
}

/** Apply a ?shot= spec (from shots.js) on top of the default state. */
function applyShot(spec) {
  if (spec.layout && layoutById(spec.layout)) state.layout = spec.layout;
  if (spec.grade && gradeById(spec.grade)) state.grade = spec.grade;
  if (spec.size && SIZES[spec.size]) state.size = spec.size;
  if (spec.title !== undefined) state.title = spec.title;
  if (spec.subtitle !== undefined) state.subtitle = spec.subtitle;
  buildPanels();
  const keyToIndex = new Map(photos.map((p, i) => [p.key, i]));
  state.panels.forEach((panel, i) => {
    if (spec.photos[i] && keyToIndex.has(spec.photos[i])) panel.photo = keyToIndex.get(spec.photos[i]);
    if (spec.pan[i] !== undefined && !Number.isNaN(spec.pan[i])) panel.px = spec.pan[i];
    if (spec.pan[i + state.panels.length] !== undefined) panel.py = spec.pan[i + state.panels.length];
    if (spec.duotone[i] !== undefined) panel.duotone = spec.duotone[i];
    if (spec.tone[i] !== undefined && !Number.isNaN(spec.tone[i])) panel.tone = spec.tone[i];
    if (spec.zoom !== undefined && !Number.isNaN(spec.zoom)) panel.zoom = spec.zoom;
    if (spec.crop && cropById(spec.crop)) {
      const preset = cropById(spec.crop);
      panel.crop = spec.crop;
      panel.zoom = preset.zoom;
      panel.px = preset.px;
      panel.py = preset.py;
    }
  });
  // Shot pans can push a photo out of its cell (a pan point near an edge leaves a
  // black band); clamp every panel back inside its own cell before rendering.
  const size = SIZES[state.size] ?? SIZES.wide;
  const cells = layoutById(state.layout).cells(size.w, size.h);
  state.panels.forEach((panel, i) => {
    const img = photos[panel.photo]?.img;
    if (img && cells[i]) clampPan(panel, cells[i], img);
  });
}

function bindEditor() {
  document.getElementById('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value;
    renderPreview();
  });
  document.getElementById('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    renderPreview();
  });
  document.getElementById('zoomRange').addEventListener('input', (e) => {
    const panel = state.panels[selected];
    if (!panel) return;
    panel.zoom = Number(e.target.value);
    panel.crop = 'full';
    renderPreview();
  });
  document.getElementById('duotoneBox').addEventListener('change', (e) => {
    const panel = state.panels[selected];
    if (!panel) return;
    panel.duotone = e.target.checked;
    renderPreview();
  });
  document.getElementById('toneRange').addEventListener('input', (e) => {
    const panel = state.panels[selected];
    if (!panel) return;
    panel.tone = Number(e.target.value);
    renderPreview();
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    state.panels = state.panels.map((_, i) => defaultPanel(i % Math.max(1, photos.length)));
    syncPanelControls();
    renderPreview();
  });
  document.getElementById('exportOne').addEventListener('click', () => exportSize(state.size));
  document.getElementById('exportAll').addEventListener('click', exportAll);
  document.getElementById('upload').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(file);
    });
    const img = await loadImage(url);
    photos.push({ key: `upload-${photos.length}`, label: file.name.slice(0, 18), src: url, img });
    const panel = state.panels[selected];
    if (panel) panel.photo = photos.length - 1;
    buildPickers();
    renderPreview();
  });

  // Panel picking and drag-pan on the preview canvas.
  let drag = null;
  const toCanvas = (e) => {
    const rect = preview.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * preview.width,
      y: ((e.clientY - rect.top) / rect.height) * preview.height,
    };
  };
  const hitCell = (x, y) => {
    const cells = layoutById(state.layout).cells(preview.width, preview.height);
    return cells.findIndex((c) => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h);
  };
  preview.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e);
    const hit = hitCell(p.x, p.y);
    if (hit < 0) return;
    selected = hit;
    buildPickers();
    syncPanelControls();
    drag = { x: p.x, y: p.y };
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const panel = state.panels[selected];
    const img = photos[panel.photo]?.img;
    if (!panel || !img) return;
    const p = toCanvas(e);
    const cells = layoutById(state.layout).cells(preview.width, preview.height);
    const cell = cells[selected];
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(cell.w / iw, cell.h / ih) * panel.zoom;
    panel.px -= (p.x - drag.x) / (iw * scale);
    panel.py -= (p.y - drag.y) / (ih * scale);
    clampPan(panel, cell, img);
    panel.crop = 'full';
    drag = p;
    renderPreview();
  });
  preview.addEventListener('pointerup', () => { drag = null; });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[selected];
    if (!panel) return;
    panel.zoom = Math.min(3, Math.max(1, panel.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
    panel.crop = 'full';
    syncPanelControls();
    renderPreview();
  }, { passive: false });
}

async function boot() {
  shotSpec = parseShot();
  await loadPhotos();
  if (shotSpec) applyShot(shotSpec);
  buildPickers();
  syncPanelControls();
  bindEditor();
  if (shotSpec?.mode === 'cover') {
    document.body.classList.add('shot-cover');
    coverCanvas.hidden = false;
    coverCanvas.width = window.innerWidth;
    coverCanvas.height = window.innerHeight;
    const dims = { w: window.innerWidth, h: window.innerHeight };
    renderCover(coverCanvas, state, photos.map((p) => p.img ?? null), dims);
  } else {
    renderPreview();
  }
  window.__shotReady = true;
}

boot();
