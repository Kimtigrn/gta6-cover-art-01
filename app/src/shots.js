// Fixed scenes for screenshots: ?shot=editor shows the editor with sample
// photos loaded; ?shot=cover shows the cover alone, filling the viewport.
// Query params: layout, size (square|portrait|wide), preset, title, subtitle,
// photo (comma-separated sample names, one per panel), pan (per-panel vertical
// offsets), zoom, grain, vignette, duotone (0/1 or a per-panel list), tone,
// motifs (0/1), crop (per-panel crop preset names). Use " | " inside the title
// for a two-line title. window.__shotReady is set once the scene has painted.
import { LAYOUTS, CROPS } from './cover.js';
import { loadImage } from './main.js';

function parseList(query, key, fallback) {
  const raw = query.get(key);
  if (raw === null || raw === '') return fallback;
  return raw.split(',').map((s) => s.trim());
}
function parseNumbers(query, key) {
  return parseList(query, key, []).map((s) => Number(s) || 0);
}

export async function runShot(shot, query, api) {
  const { state, setPanelPhoto, redraw, markButtons } = api;
  if (shot === 'cover') document.body.classList.add('shot-cover');

  const layoutName = query.get('layout');
  if (layoutName && LAYOUTS[layoutName]) state.layout = layoutName;
  const sizeName = query.get('size');
  if (sizeName && api.SIZES[sizeName]) state.size = sizeName;
  if (query.get('preset')) state.preset = query.get('preset');
  if (query.get('title') !== null) state.title = query.get('title');
  if (query.get('subtitle') !== null) state.subtitle = query.get('subtitle');
  if (query.get('grain') !== null) state.grain = query.get('grain') !== '0';
  if (query.get('vignette') !== null) state.vignette = query.get('vignette') !== '0';
  if (query.get('motifs') !== null) state.motifs = query.get('motifs') !== '0';
  if (query.get('duotone') !== null) state.duotone = query.get('duotone') !== '0';

  const names = parseList(query, 'photo', ['pier']);
  const pans = parseNumbers(query, 'pan');
  const zooms = parseNumbers(query, 'zoom');
  const tones = parseNumbers(query, 'tone');
  const duotones = parseList(query, 'duotone', []);
  const crops = parseList(query, 'crop', []);
  const count = LAYOUTS[state.layout].panels.length;
  for (let i = 0; i < count; i++) {
    const name = names[Math.min(i, names.length - 1)];
    const img = await loadImage(`samples/${name}.jpg`);
    await setPanelPhoto(i, img, name);
    // Pan shifts the photo inside its panel (positive = show more of the top).
    if (pans[i]) state.panels[i].oy = pans[i];
    if (zooms[i] && zooms[i] !== 1) state.panels[i].zoom = zooms[i];
    // Per-panel duotone: "1" alone turns it on for every panel, a list like
    // "1,0,1" sets it per panel.
    if (duotones.length > 1) {
      state.panels[i].duotone = duotones[i] === '1';
    } else if (duotones[0] === '1') {
      state.panels[i].duotone = true;
    }
    if (tones[i]) state.panels[i].tone = tones[i];
    // Crop preset names (top/centre/bottom/face/closeup) pre-set zoom + pan.
    if (crops[i] && CROPS[crops[i]]) {
      state.panels[i].crop = crops[i];
      state.panels[i].zoom = CROPS[crops[i]].zoom;
      state.panels[i].oy = CROPS[crops[i]].oy;
    }
  }

  // Keep the visible controls in sync with the scene (editor shots show them).
  const titleInput = document.getElementById('title');
  const subtitleInput = document.getElementById('subtitle');
  if (titleInput) titleInput.value = state.title;
  if (subtitleInput) subtitleInput.value = state.subtitle;
  const grainBox = document.getElementById('grain');
  const vignetteBox = document.getElementById('vignette');
  const motifsBox = document.getElementById('motifs');
  if (grainBox) grainBox.checked = state.grain;
  if (vignetteBox) vignetteBox.checked = state.vignette;
  if (motifsBox) motifsBox.checked = state.motifs;
  markButtons('layouts', state.layout);
  markButtons('sizes', state.size);
  markButtons('presets', state.preset);

  redraw();
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  window.__shotReady = true;
}
