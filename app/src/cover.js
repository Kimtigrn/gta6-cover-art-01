// Vice City Cover Studio v2 — renders a multi-panel GTA-style cover poster.
// All drawing is canvas, deterministic and offline: panel photos come from files
// already on the user's machine, every motif (sun disc, palm, skyline, flare) is
// drawn procedurally, and the grain is a seeded pre-rendered tile, so two runs
// produce byte-identical output. No network, no borrowed art, no Rockstar assets.

// Panel rectangles per layout, as [x, y, w, h] fractions of the canvas. The
// picker in main.js is generated from these entries, so adding a layout here is
// enough to offer it in the editor. Gaps are baked into the fractions.
export const LAYOUTS = {
  hero2: {
    label: 'Hero + 2',
    panels: [
      [0, 0, 1, 0.615],
      [0, 0.635, 0.49, 0.365],
      [0.51, 0.635, 0.49, 0.365],
    ],
  },
  grid: {
    label: '2 x 2 grid',
    panels: [
      [0, 0, 0.49, 0.49],
      [0.51, 0, 0.49, 0.49],
      [0, 0.51, 0.49, 0.49],
      [0.51, 0.51, 0.49, 0.49],
    ],
  },
  strips: {
    label: '3 strips',
    panels: [
      [0, 0, 0.3267, 1],
      [0.3367, 0, 0.3267, 1],
      [0.6733, 0, 0.3267, 1],
    ],
  },
  split: {
    label: 'Diagonal split',
    panels: [
      [0, 0, 0.615, 1],
      [0.635, 0, 0.365, 0.49],
      [0.635, 0.51, 0.365, 0.49],
    ],
  },
  mosaic: {
    label: 'Mosaic (6)',
    panels: [
      [0, 0, 0.66, 0.665],
      [0.67, 0, 0.33, 0.325],
      [0.67, 0.335, 0.33, 0.33],
      [0, 0.675, 0.325, 0.325],
      [0.335, 0.675, 0.325, 0.325],
      [0.67, 0.675, 0.33, 0.325],
    ],
  },
  grid9: {
    label: '9-panel grid',
    panels: [
      [0, 0, 0.3267, 0.3267],
      [0.3367, 0, 0.3267, 0.3267],
      [0.6733, 0, 0.3267, 0.3267],
      [0, 0.3367, 0.3267, 0.3267],
      [0.3367, 0.3367, 0.3267, 0.3267],
      [0.6733, 0.3367, 0.3267, 0.3267],
      [0, 0.6733, 0.3267, 0.3267],
      [0.3367, 0.6733, 0.3267, 0.3267],
      [0.6733, 0.6733, 0.3267, 0.3267],
    ],
  },
  hero3: {
    label: 'Hero + 3',
    panels: [
      [0, 0, 1, 0.6],
      [0, 0.62, 0.3267, 0.38],
      [0.3367, 0.62, 0.3267, 0.38],
      [0.6733, 0.62, 0.3267, 0.38],
    ],
  },
  herofull: {
    label: 'Full-bleed hero',
    panels: [[0, 0, 1, 1]],
  },
};

// Colour grades. Each grade is a gradient map: `map` runs from the deep shadow
// colour to the hot highlight colour and is washed over the poster; `titleFrom`
// / `titleTo` fill the title with a vertical gradient; `duo` is the two-colour
// pair used by the per-panel duotone wash; `halftone` colours the dot shadow
// under the title; `sun` colours the procedural sun disc.
export const PRESETS = {
  sunset: {
    label: 'Vice Sunset',
    map: ['rgba(255, 122, 26, 0.18)', 'rgba(214, 38, 120, 0.32)'],
    glow: 'rgba(255, 176, 66, 0.55)',
    titleFrom: '#fff3c4',
    titleTo: '#ffb03a',
    title: '#fff7e8',
    titleStroke: '#2a0a2e',
    subtitle: '#ffd9a0',
    duo: ['#1c0b33', '#ff9a3c'],
    halftone: 'rgba(255, 122, 26, 0.85)',
    sun: ['#ffe9a8', '#ff7a1a'],
  },
  neon: {
    label: 'Neon Night',
    map: ['rgba(64, 224, 255, 0.16)', 'rgba(150, 32, 220, 0.36)'],
    glow: 'rgba(64, 224, 255, 0.45)',
    titleFrom: '#d9fbff',
    titleTo: '#4dd8ff',
    title: '#eafcff',
    titleStroke: '#12002e',
    subtitle: '#8ef3ff',
    duo: ['#0a1030', '#37e6ff'],
    halftone: 'rgba(64, 224, 255, 0.85)',
    sun: ['#c9f6ff', '#2bb8ff'],
  },
  pastel: {
    label: 'Pastel Day',
    map: ['rgba(255, 182, 213, 0.16)', 'rgba(120, 200, 255, 0.20)'],
    glow: 'rgba(255, 240, 180, 0.5)',
    titleFrom: '#ffffff',
    titleTo: '#ffe3f0',
    title: '#ffffff',
    titleStroke: '#17324a',
    subtitle: '#dff3ff',
    duo: ['#274b63', '#ffb6d5'],
    halftone: 'rgba(255, 150, 200, 0.85)',
    sun: ['#fff6c9', '#ffb347'],
  },
  coral: {
    label: 'Coral Dusk',
    map: ['rgba(255, 94, 98, 0.20)', 'rgba(120, 20, 90, 0.34)'],
    glow: 'rgba(255, 120, 110, 0.5)',
    titleFrom: '#ffe8d6',
    titleTo: '#ff6b5e',
    title: '#fff0e4',
    titleStroke: '#33061f',
    subtitle: '#ffc4b0',
    duo: ['#2e0a2e', '#ff5e62'],
    halftone: 'rgba(255, 94, 98, 0.85)',
    sun: ['#ffd9a0', '#ff4e50'],
  },
  amber: {
    label: 'Heatwave Amber',
    map: ['rgba(255, 170, 0, 0.20)', 'rgba(190, 40, 0, 0.34)'],
    glow: 'rgba(255, 190, 60, 0.6)',
    titleFrom: '#fff8d0',
    titleTo: '#ff9d00',
    title: '#fff6cf',
    titleStroke: '#2e1200',
    subtitle: '#ffe08a',
    duo: ['#331500', '#ffb300'],
    halftone: 'rgba(255, 170, 0, 0.9)',
    sun: ['#fff3b0', '#ff8c00'],
  },
  midnight: {
    label: 'Midnight Palm',
    map: ['rgba(20, 90, 120, 0.22)', 'rgba(8, 10, 48, 0.40)'],
    glow: 'rgba(80, 200, 190, 0.45)',
    titleFrom: '#e8fff6',
    titleTo: '#4fe3c1',
    title: '#eafff6',
    titleStroke: '#02141c',
    subtitle: '#9ff5dd',
    duo: ['#04121f', '#2fd6b5'],
    halftone: 'rgba(80, 220, 190, 0.85)',
    sun: ['#d8fff2', '#19b8a6'],
  },
  noir: {
    label: 'Mono Noir',
    map: ['rgba(0, 0, 0, 0.28)', 'rgba(255, 255, 255, 0.10)'],
    glow: 'rgba(255, 255, 255, 0.35)',
    titleFrom: '#ffffff',
    titleTo: '#b8b8b8',
    title: '#ffffff',
    titleStroke: '#000000',
    subtitle: '#e8e8e8',
    duo: ['#000000', '#ffffff'],
    halftone: 'rgba(255, 255, 255, 0.8)',
    sun: ['#ffffff', '#8a8a8a'],
  },
};

// Crop presets: named vertical anchors for a panel photo. `fill` is the plain
// cover fit; the others pre-set zoom + vertical pan so a face or skyline lands
// where the poster needs it. Applied in main.js, stored as zoom/oy on the panel.
export const CROPS = {
  fill: { label: 'Fill', zoom: 1, oy: 0 },
  top: { label: 'Top', zoom: 1.25, oy: 0.22 },
  centre: { label: 'Centre', zoom: 1.25, oy: 0 },
  bottom: { label: 'Bottom', zoom: 1.25, oy: -0.22 },
  closeup: { label: 'Close-up', zoom: 1.8, oy: 0.05 },
};

/** Deterministic pseudo-random generator, so grain and motifs are identical on every run. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pre-rendered film-grain tile, built once and reused: a 128x128 canvas of
// seeded black/white speckles. Tiling it is far faster than the old per-pixel
// loop and reads as real film grain at alpha ~0.09.
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const rng = mulberry32(20261119);
  const img = tctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rng() > 0.5 ? 255 : 0;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  grainTile = tile;
  return tile;
}

/** Draws one photo into a panel rect, cover-fit, with zoom, pan and duotone. */
function drawPanel(ctx, panel, rect, w, h, preset) {
  const [fx, fy, fw, fh] = rect;
  const x = fx * w;
  const y = fy * h;
  const pw = fw * w;
  const ph = fh * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();
  if (panel.img) {
    const img = panel.img;
    const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
    const scale = base * (panel.zoom || 1);
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;
    const cxRaw = x + pw / 2 + (panel.ox || 0) * pw;
    const cyRaw = y + ph / 2 + (panel.oy || 0) * ph;
    // Clamp the photo's centre so it always covers the panel: a big pan on a
    // short panel saturates at the photo's edge instead of sliding the photo
    // out of frame (which left empty bands in early screenshots).
    const cx = Math.min(Math.max(cxRaw, x + pw - iw / 2), x + iw / 2);
    const cy = Math.min(Math.max(cyRaw, y + ph - ih / 2), y + ih / 2);
    ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih);
    // Per-panel duotone: a two-colour gradient map laid over the photo at the
    // panel's tone strength. `overlay` keeps the photo's light and shade.
    const tone = panel.duotone ? (panel.tone ?? 0.55) : 0;
    if (tone > 0) {
      const duo = ctx.createLinearGradient(x, y, x + pw, y + ph);
      duo.addColorStop(0, preset.duo[0]);
      duo.addColorStop(1, preset.duo[1]);
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = tone;
      ctx.fillStyle = duo;
      ctx.fillRect(x, y, pw, ph);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  } else {
    const g = ctx.createLinearGradient(x, y, x + pw, y + ph);
    g.addColorStop(0, '#3a1c4d');
    g.addColorStop(1, '#141024');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, pw, ph);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 ${Math.round(ph * 0.07)}px "Liberation Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', x + pw / 2, y + ph / 2);
  }
  // Thin inner shade so panels read as separate frames.
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = Math.max(1, w * 0.002);
  ctx.strokeRect(x, y, pw, ph);
  ctx.restore();
}

// Procedural sun disc with horizontal stripe cuts, floating over the hero
// panel. The stripes are punched out with destination-out, so the photo shows
// through the gaps — the classic sunset-poster sun.
function drawSunDisc(ctx, w, h, preset) {
  const cx = w * 0.78;
  const cy = h * 0.20;
  const r = Math.min(w, h) * 0.115;
  ctx.save();
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, preset.sun[0]);
  disc.addColorStop(1, preset.sun[1]);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  const gap = r * 0.28;
  for (let i = 0; i < 3; i++) {
    const y = cy + r * 0.18 + i * gap;
    ctx.fillRect(cx - r, y, r * 2, gap * 0.42);
  }
  ctx.restore();
}

// Palm-tree silhouette: a curved trunk and five drooping bezier fronds, drawn
// at the bottom-left corner of the first (hero) panel, over the photo and
// under the title band. Anchored to the hero panel's bottom edge so it sits on
// the poster's ground line in every layout.
function drawPalm(ctx, w, h, layout) {
  const hero = layout.panels[0];
  const baseX = (hero[0] + 0.045) * w;
  const baseY = (hero[1] + hero[3]) * h;
  const s = Math.min(w, h) * 0.0011;
  ctx.save();
  ctx.fillStyle = 'rgba(8, 3, 16, 0.88)';
  ctx.strokeStyle = 'rgba(8, 3, 16, 0.88)';
  ctx.lineCap = 'round';
  // Trunk: a gentle S-curve rising from the hero panel's bottom edge.
  ctx.lineWidth = 9 * s;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY + 6 * s);
  ctx.quadraticCurveTo(baseX + 24 * s, baseY - 55 * s, baseX + 8 * s, baseY - 135 * s);
  ctx.stroke();
  // Fronds: five arcs fanning out from the crown, each drooping so the tip
  // falls below the control point — the palm's signature downward curve.
  const crownX = baseX + 8 * s;
  const crownY = baseY - 135 * s;
  const fronds = [
    [-140, -55, -105, 25],
    [-115, -105, -60, -20],
    [-45, -140, 15, -55],
    [50, -125, 105, -35],
    [100, -70, 150, 30],
  ];
  ctx.lineWidth = 7 * s;
  for (const [c1x, c1y, ex, ey] of fronds) {
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(crownX + c1x * s, crownY + c1y * s, crownX + ex * s, crownY + ey * s);
    ctx.stroke();
  }
  // Two coconuts tucked under the crown.
  ctx.beginPath();
  ctx.arc(crownX - 6 * s, crownY + 8 * s, 5 * s, 0, Math.PI * 2);
  ctx.arc(crownX + 7 * s, crownY + 10 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Low skyline silhouette along the bottom edge of the first panel row: a row
// of seeded building blocks rising from a solid ground strip, with a few lit
// windows. Short and grounded, it reads as a city skyline divider instead of
// floating blocks.
function drawSkyline(ctx, w, h, layout) {
  const hero = layout.panels[0];
  const base = Math.min((hero[1] + hero[3]) * h, h * 0.66);
  const rng = mulberry32(77019);
  let x = w * 0.02;
  ctx.save();
  // Ground strip the buildings stand on.
  ctx.fillStyle = 'rgba(8, 3, 16, 0.9)';
  ctx.fillRect(0, base, w, Math.max(2, h * 0.004));
  while (x < w * 0.98) {
    const bw = w * (0.028 + rng() * 0.04);
    const bh = h * (0.012 + rng() * 0.038);
    ctx.fillRect(x, base - bh, bw, bh);
    // Antenna on the tallest few.
    if (bh > h * 0.04) ctx.fillRect(x + bw / 2 - 1, base - bh - h * 0.022, 2, h * 0.022);
    x += bw + w * 0.006;
  }
  // A scattering of lit windows.
  ctx.fillStyle = 'rgba(255, 214, 130, 0.75)';
  const rng2 = mulberry32(90210);
  for (let i = 0; i < 30; i++) {
    ctx.fillRect(w * (0.03 + rng2() * 0.94), base - h * 0.05 * rng2(), 3, 4);
  }
  ctx.restore();
}

// Subtle lens flare: a bright core where the sun sits plus a faint diagonal
// streak and two ghost circles, all radial gradients.
function drawLensFlare(ctx, w, h, preset) {
  const cx = w * 0.78;
  const cy = h * 0.20;
  ctx.save();
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.05);
  core.addColorStop(0, 'rgba(255,255,255,0.85)');
  core.addColorStop(0.25, preset.glow);
  core.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(cx - w * 0.05, cy - w * 0.05, w * 0.1, w * 0.1);
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = Math.max(1, w * 0.0012);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.22, cy + h * 0.10);
  ctx.lineTo(cx + w * 0.22, cy - h * 0.10);
  ctx.stroke();
  for (const [gx, gy, gr] of [[0.62, 0.32, 0.018], [0.52, 0.40, 0.011]]) {
    const ghost = ctx.createRadialGradient(w * gx, h * gy, 0, w * gx, h * gy, w * gr);
    ghost.addColorStop(0, preset.glow);
    ghost.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = ghost;
    ctx.fillRect(w * gx - w * gr, h * gy - w * gr, w * gr * 2, w * gr * 2);
  }
  ctx.restore();
}

// Halftone dot shadow under the title: rows of dots that shrink as they fall
// away from the lettering — the print-poster texture the top entries use.
function drawHalftone(ctx, cx, y, width, preset, size) {
  const rows = 3;
  const step = Math.max(5, size * 0.09);
  ctx.save();
  ctx.fillStyle = preset.halftone;
  for (let r = 0; r < rows; r++) {
    const radius = Math.max(1, size * 0.035 * (1 - r * 0.3));
    const yy = y + r * step;
    for (let x = cx - width / 2; x <= cx + width / 2; x += step) {
      ctx.beginPath();
      ctx.arc(x + (r % 2 ? step / 2 : 0), yy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Title lines: split on " | " (or a newline) into up to two lines, each fitted
// to maxWidth, filled with the grade's vertical gradient and outlined. The
// subtitle is drawn as a neon-script accent: slanted, letterspaced, glowing.
function drawTitleBlock(ctx, title, subtitle, w, h, preset) {
  const lines = title.split(/\s*\|\s*|\n/).map((s) => s.trim()).filter(Boolean).slice(0, 2);
  if (!lines.length) return 0;
  const maxSize = h * 0.115;
  const bandBottom = h - h * 0.075;
  // Measure the widest line first so both lines share one size.
  let size = maxSize;
  const fit = () => {
    ctx.font = `900 ${size}px "Liberation Sans", sans-serif`;
    return Math.max(...lines.map((l) => ctx.measureText(l).width));
  };
  while (fit() > w * 0.92 && size > 12) size -= 2;
  const lineHeight = size * 1.04;
  const totalHeight = lineHeight * lines.length;
  const firstBaseline = bandBottom - totalHeight + size;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  lines.forEach((line, i) => {
    const baseline = firstBaseline + i * lineHeight;
    const grad = ctx.createLinearGradient(0, baseline - size, 0, baseline + size * 0.12);
    grad.addColorStop(0, preset.titleFrom);
    grad.addColorStop(1, preset.titleTo);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.04;
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = preset.titleStroke;
    ctx.strokeText(line, w / 2, baseline);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = grad;
    ctx.fillText(line, w / 2, baseline);
  });
  // Halftone dots under the last line.
  const lastWidth = ctx.measureText(lines[lines.length - 1]).width;
  drawHalftone(ctx, w / 2, bandBottom + size * 0.16, Math.min(lastWidth, w * 0.92), preset, size);
  // Neon-script subtitle above the title: slanted (sheared), letterspaced, glowing.
  // It sits clear above the first line's cap height, never struck through by it.
  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    const subSize = Math.max(10, Math.round(size * 0.26));
    ctx.save();
    ctx.translate(w / 2, firstBaseline - size * 1.02);
    ctx.transform(1, 0, -0.18, 1, 0, 0);
    ctx.font = `italic 700 ${subSize}px "Liberation Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = preset.glow;
    ctx.shadowBlur = subSize * 0.55;
    ctx.fillStyle = preset.subtitle;
    ctx.fillText([...sub].join('\u2009'), 0, 0);
    // Second pass without blur so the letters stay crisp under the glow.
    ctx.shadowBlur = 0;
    ctx.fillText([...sub].join('\u2009'), 0, 0);
    ctx.restore();
  }
  return size;
}

function drawGrain(ctx, w, h) {
  const tile = getGrainTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/**
 * Draws the whole cover.
 * state: { layout, preset, title, subtitle, grain, vignette, duotone, motifs, panels }
 * panels: [{ img|null, zoom, ox, oy, duotone, tone, crop }] — one per layout panel.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.hero2;
  const preset = PRESETS[state.preset] ?? PRESETS.sunset;

  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, w, h);

  layout.panels.forEach((rect, i) => {
    drawPanel(ctx, state.panels[i] ?? {}, rect, w, h, preset);
  });

  // Poster motifs sit over the photos and under the wash, so they read as
  // part of the poster rather than stickers on top of it.
  if (state.motifs !== false) {
    drawSunDisc(ctx, w, h, preset);
    drawPalm(ctx, w, h, layout);
    drawSkyline(ctx, w, h, layout);
    drawLensFlare(ctx, w, h, preset);
  }

  // Warm sun glow, top right of the first panel.
  const glow = ctx.createRadialGradient(w * 0.82, h * 0.16, 0, w * 0.82, h * 0.16, w * 0.34);
  glow.addColorStop(0, preset.glow);
  glow.addColorStop(1, 'rgba(255, 176, 66, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Gradient-map colour wash over the whole poster (shadow colour -> highlight).
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, preset.map[0]);
  wash.addColorStop(0.55, preset.map[0]);
  wash.addColorStop(1, preset.map[1]);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  // Bottom band so the lettering always reads. It starts low (0.70h) so the
  // lower panels stay visible, and deepens only toward the very bottom.
  const band = ctx.createLinearGradient(0, h * 0.70, 0, h);
  band.addColorStop(0, 'rgba(10, 4, 18, 0)');
  band.addColorStop(0.5, 'rgba(10, 4, 18, 0.38)');
  band.addColorStop(1, 'rgba(10, 4, 18, 0.78)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, w, h);

  // Thin poster frame.
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.strokeRect(w * 0.012, h * 0.012, w * 0.976, h * 0.976);

  if (state.vignette !== false) {
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  const title = (state.title || '').trim().toUpperCase();
  if (title) drawTitleBlock(ctx, title, state.subtitle || '', w, h, preset);

  if (state.grain !== false) drawGrain(ctx, w, h);
}

/** Which layout panel (index) contains point (x, y) in canvas pixels, or -1. */
export function panelAt(layoutName, w, h, x, y) {
  const layout = LAYOUTS[layoutName] ?? LAYOUTS.hero2;
  for (let i = 0; i < layout.panels.length; i++) {
    const [fx, fy, fw, fh] = layout.panels[i];
    if (x >= fx * w && x < (fx + fw) * w && y >= fy * h && y < (fy + fh) * h) return i;
  }
  return -1;
}
