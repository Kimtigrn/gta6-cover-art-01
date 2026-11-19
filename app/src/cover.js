// Vice City Cover Studio v3 — the cover renderer, rewritten from scratch.
// Everything is drawn on canvas, fully deterministic and offline: panel photos
// are files already on the user's machine, every poster motif (striped sun,
// palm, skyline, flare) is procedural, and the grain comes from a seeded tile,
// so two renders of the same state are byte-identical. No network, no borrowed
// art, no Rockstar assets. The editor (main.js) and the screenshot runner
// (shots.js) import LAYOUTS, PRESETS, CROPS, drawCover and panelAt from here.

// Layouts: panel rectangles as [x, y, w, h] fractions of the canvas. The
// editor builds its picker from these entries, so a new key here is a new
// layout in the UI. Gaps are baked into the fractions themselves.
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
  duo: {
    label: 'Vertical duo',
    panels: [
      [0, 0, 0.49, 1],
      [0.51, 0, 0.49, 1],
    ],
  },
};

// Colour grades. Each grade is a gradient map: `map` washes from the deep
// shadow colour to the hot highlight colour across the poster; `titleFrom` /
// `titleTo` fill the title with a vertical gradient; `duo` is the two-colour
// pair for the per-panel duotone wash; `halftone` colours the dot shadow under
// the title; `sun` colours the procedural sun disc; `glow` is the warm light
// pooled at the top right.
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
  violet: {
    label: 'Electric Violet',
    map: ['rgba(150, 80, 255, 0.20)', 'rgba(60, 0, 120, 0.36)'],
    glow: 'rgba(180, 120, 255, 0.5)',
    titleFrom: '#f2e8ff',
    titleTo: '#b678ff',
    title: '#f6ecff',
    titleStroke: '#1c0033',
    subtitle: '#d9b8ff',
    duo: ['#150029', '#a55cff'],
    halftone: 'rgba(150, 80, 255, 0.85)',
    sun: ['#ecd9ff', '#7a2bff'],
  },
};

// Crop presets: named anchors for a panel photo. `fill` is the plain cover
// fit; the others pre-set zoom + vertical pan so a face or a skyline lands
// where the poster needs it. main.js applies them as zoom/oy on the panel.
export const CROPS = {
  fill: { label: 'Fill', zoom: 1, oy: 0 },
  top: { label: 'Top', zoom: 1.25, oy: 0.22 },
  centre: { label: 'Centre', zoom: 1.25, oy: 0 },
  bottom: { label: 'Bottom', zoom: 1.25, oy: -0.22 },
  face: { label: 'Face', zoom: 1.5, oy: 0.12 },
  closeup: { label: 'Close-up', zoom: 1.8, oy: 0.05 },
};

/** Small deterministic PRNG, so grain and motif placement never change. */
function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Film grain as a pre-rendered 128x128 tile of seeded black/white speckles.
// Tiling it is far faster than a per-pixel loop and reads as real grain.
let grainCanvas = null;
function grainTile() {
  if (grainCanvas) return grainCanvas;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const rng = seededRandom(777001);
  const data = tctx.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = rng() > 0.5 ? 255 : 0;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  grainCanvas = tile;
  return tile;
}

/**
 * Cover-fit geometry for one photo inside one panel rect (all in pixels):
 * returns the drawn image rect [dx, dy, dw, dh] for the given zoom and pan.
 * The photo centre is clamped so the image always covers the panel — a big
 * pan on a short panel saturates at the photo edge instead of sliding the
 * photo out of frame and leaving an empty band.
 */
function coverFit(imgW, imgH, rect, zoom, ox, oy) {
  const [rx, ry, rw, rh] = rect;
  const base = Math.max(rw / imgW, rh / imgH);
  const scale = base * (zoom || 1);
  const dw = imgW * scale;
  const dh = imgH * scale;
  const wantX = rx + rw / 2 + (ox || 0) * rw;
  const wantY = ry + rh / 2 + (oy || 0) * rh;
  const cx = Math.min(Math.max(wantX, rx + rw - dw / 2), rx + dw / 2);
  const cy = Math.min(Math.max(wantY, ry + rh - dh / 2), ry + dh / 2);
  return [cx - dw / 2, cy - dh / 2, dw, dh];
}

/** Draws one panel: the photo (cover-fit, zoomed, panned, duotoned) or a placeholder. */
function paintPanel(ctx, panel, frac, w, h, preset) {
  const [fx, fy, fw, fh] = frac;
  const rect = [fx * w, fy * h, fw * w, fh * h];
  const [x, y, pw, ph] = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();
  if (panel.img) {
    const [dx, dy, dw, dh] = coverFit(
      panel.img.naturalWidth, panel.img.naturalHeight, rect, panel.zoom, panel.ox, panel.oy,
    );
    ctx.drawImage(panel.img, dx, dy, dw, dh);
    // Per-panel duotone: the grade's two-colour gradient over the photo at
    // the panel's tone strength, in `overlay` so light and shade survive.
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
  // Thin inner shade so neighbouring panels read as separate frames.
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = Math.max(1, w * 0.002);
  ctx.strokeRect(x, y, pw, ph);
  ctx.restore();
}

// Sun disc with horizontal stripe cuts, floating over the hero panel. The
// stripes are punched out with destination-out, so the photo shows through
// the gaps — the classic sunset-poster sun.
function paintSun(ctx, w, h, preset) {
  const cx = w * 0.68;
  const cy = h * 0.15;
  const r = Math.min(w, h) * 0.105;
  ctx.save();
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, preset.sun[0]);
  disc.addColorStop(1, preset.sun[1]);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  const gap = r * 0.24;
  for (let i = 0; i < 4; i++) {
    const y = cy + r * 0.08 + i * gap;
    ctx.fillRect(cx - r, y, r * 2, gap * 0.4);
  }
  ctx.restore();
}

// Palm silhouette: a curved trunk and six drooping bezier fronds, standing at
// the bottom-left of the first (hero) panel, over the photo and under the
// title band. It is anchored to the hero panel's bottom edge, so it sits on
// the poster's ground line in every layout.
function paintPalm(ctx, w, h, layout) {
  const hero = layout.panels[0];
  const groundX = (hero[0] + 0.045) * w;
  const groundY = (hero[1] + hero[3]) * h;
  const s = Math.min(w, h) * 0.0011;
  ctx.save();
  ctx.fillStyle = 'rgba(8, 3, 16, 0.88)';
  ctx.strokeStyle = 'rgba(8, 3, 16, 0.88)';
  ctx.lineCap = 'round';
  // Trunk: a gentle S-curve rising from the hero panel's bottom edge.
  ctx.lineWidth = 9 * s;
  ctx.beginPath();
  ctx.moveTo(groundX, groundY + 6 * s);
  ctx.quadraticCurveTo(groundX + 24 * s, groundY - 55 * s, groundX + 8 * s, groundY - 135 * s);
  ctx.stroke();
  // Fronds: six arcs fanning from the crown, each drooping so the tip falls
  // below its control point — the palm's signature downward curve.
  const crownX = groundX + 8 * s;
  const crownY = groundY - 135 * s;
  const fronds = [
    [-150, -40, -118, 38],
    [-128, -95, -72, -8],
    [-70, -138, -5, -48],
    [-10, -145, 55, -60],
    [62, -118, 112, -28],
    [108, -62, 156, 42],
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

// Low skyline silhouette along the bottom edge of the first panel row: seeded
// building blocks rising from a solid ground strip, a few with antennas and
// lit windows. Short and grounded, it reads as a city divider, not floating
// blocks.
function paintSkyline(ctx, w, h, layout) {
  const hero = layout.panels[0];
  // Capped at 0.60h so the strip never reaches the subtitle of a two-line
  // title (the subtitle sits near 0.68h); with a taller cap it struck through.
  const base = Math.min((hero[1] + hero[3]) * h, h * 0.60);
  const rng = seededRandom(77019);
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
  const rng2 = seededRandom(90210);
  for (let i = 0; i < 30; i++) {
    ctx.fillRect(w * (0.03 + rng2() * 0.94), base - h * 0.05 * rng2(), 3, 4);
  }
  ctx.restore();
}

// Lens flare: a bright core where the sun sits, a faint diagonal streak and
// two ghost circles, all radial gradients.
function paintFlare(ctx, w, h, preset) {
  const cx = w * 0.68;
  const cy = h * 0.15;
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

// Halftone dot shadow under the title: four rows of dots that shrink as they
// fall away from the lettering — the print-poster texture the top entries use.
function paintHalftone(ctx, cx, y, width, preset, size) {
  const rows = 4;
  const step = Math.max(5, size * 0.09);
  ctx.save();
  ctx.fillStyle = preset.halftone;
  for (let r = 0; r < rows; r++) {
    const radius = Math.max(1, size * 0.038 * (1 - r * 0.28));
    const yy = y + r * step;
    for (let x = cx - width / 2; x <= cx + width / 2; x += step) {
      ctx.beginPath();
      ctx.arc(x + (r % 2 ? step / 2 : 0), yy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Title block: one or two lines (split on " | " or a newline), each fitted to
// the poster width, filled with the grade's vertical gradient and outlined.
// The subtitle is a neon-script accent above the title: sheared, letterspaced
// and glowing, placed clear of the first line's cap height so the title never
// strikes through it.
function paintTitle(ctx, title, subtitle, w, h, preset) {
  const lines = title.split(/\s*\|\s*|\n/).map((s) => s.trim()).filter(Boolean).slice(0, 2);
  if (!lines.length) return 0;
  const maxSize = h * 0.115;
  const bandBottom = h - h * 0.075;
  // Measure the widest line first so both lines share one size.
  let size = maxSize;
  const widest = () => {
    ctx.font = `900 ${size}px "Liberation Sans", sans-serif`;
    return Math.max(...lines.map((l) => ctx.measureText(l).width));
  };
  while (widest() > w * 0.92 && size > 12) size -= 1;
  const lineHeight = size * 1.04;
  const blockHeight = lineHeight * lines.length;
  const firstBaseline = bandBottom - blockHeight + size;
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
  paintHalftone(ctx, w / 2, bandBottom + size * 0.16, Math.min(lastWidth, w * 0.92), preset, size);
  // Neon-script subtitle above the title.
  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    const subSize = Math.max(10, Math.round(size * 0.26));
    const spaced = [...sub].join('\u2009');
    ctx.save();
    ctx.translate(w / 2, firstBaseline - size * 1.02);
    ctx.transform(1, 0, -0.18, 1, 0, 0);
    ctx.font = `italic 700 ${subSize}px "Liberation Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = preset.glow;
    ctx.shadowBlur = subSize * 0.55;
    ctx.fillStyle = preset.subtitle;
    ctx.fillText(spaced, 0, 0);
    // Second pass without blur so the letters stay crisp under the glow.
    ctx.shadowBlur = 0;
    ctx.fillText(spaced, 0, 0);
    ctx.restore();
  }
  return size;
}

function paintGrain(ctx, w, h) {
  const tile = grainTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = 0.08;
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

  layout.panels.forEach((frac, i) => {
    paintPanel(ctx, state.panels[i] ?? {}, frac, w, h, preset);
  });

  // Poster motifs sit over the photos and under the wash, so they read as
  // part of the poster rather than stickers on top of it.
  if (state.motifs !== false) {
    paintSun(ctx, w, h, preset);
    paintPalm(ctx, w, h, layout);
    paintSkyline(ctx, w, h, layout);
    paintFlare(ctx, w, h, preset);
  }

  // Warm sun glow, where the sun disc sits.
  const glow = ctx.createRadialGradient(w * 0.68, h * 0.15, 0, w * 0.68, h * 0.15, w * 0.34);
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
  if (title) paintTitle(ctx, title, state.subtitle || '', w, h, preset);

  if (state.grain !== false) paintGrain(ctx, w, h);
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
