// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover shows the cover alone, filling the viewport.
// Query params: layout, size (square|portrait|wide), preset, title, subtitle,
// photo (comma-separated sample names, one per panel), pan (per-panel vertical
// offsets), zoom, grain, vignette, duotone (0/1 or per-panel list), tone,
// motifs (0/1), crop (per-panel crop preset names). Use " | " inside the title
// for a two-line title. window.__shotReady is set once the scene has painted.
import { LAYOUTS, CROPS } from './cover.js';
import { loadImage } from './main.js';

export async function runShot(shot, query, api) {
  const { state, setPanelPhoto, redraw, markButtons } = api;
  if (shot === 'cover') document.body.classList.add('shot-cover');

  if (query.get('layout') && LAYOUTS[query.get('layout')]) state.layout = query.get('layout');
  if (query.get('size') && api.SIZES[query.get('size')]) state.size = query.get('size');
  if (query.get('preset')) state.preset = query.get('preset');
  if (query.get('title') !== null) state.title = query.get('title');
  if (query.get('subtitle') !== null) state.subtitle = query.get('subtitle');
  if (query.get('grain') !== null) state.grain = query.get('grain') !== '0';
  if (query.get('vignette') !== null) state.vignette = query.get('vignette') !== '0';
  if (query.get('motifs') !== null) state.motifs = query.get('motifs') !== '0';
  if (query.get('duotone') !== null) state.duotone = query.get('duotone') !== '0';

  const names = (query.get('photo') ?? 'pier').split(',').map((s) => s.trim()).filter(Boolean);
  const pans = (query.get('pan') ?? '').split(',').map((s) => Number(s) || 0);
  const zooms = (query.get('zoom') ?? '').split(',').map((s) => Number(s) || 1);
  const tones = (query.get('tone') ?? '').split(',').map((s) => Number(s) || 0);
  const duotones = (query.get('duotone') ?? '').split(',').map((s) => s.trim());
  const crops = (query.get('crop') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const count = LAYOUTS[state.layout].panels.length;
  for (let i = 0; i < count; i++) {
    const name = names[Math.min(i, names.length - 1)];
    const img = await loadImage(`samples/${name}.jpg`);
    await setPanelPhoto(i, img, name);
    // Pan shifts the photo inside its panel (positive = show more of the top).
    if (pans[i]) state.panels[i].oy = pans[i];
    if (zooms[i] && zooms[i] !== 1) state.panels[i].zoom = zooms[i];
    // Per-panel duotone: "1" or a per-panel list like "1,0,1".
    if (duotones.length > 1) {
      state.panels[i].duotone = duotones[i] === '1';
    } else if (duotones[0] === '1') {
      state.panels[i].duotone = true;
    }
    if (tones[i]) state.panels[i].tone = tones[i];
    // Crop preset names (top/centre/bottom/closeup) pre-set zoom + pan.
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
