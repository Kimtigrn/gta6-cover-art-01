// Vice City Cover Studio — cover renderer (vanilla canvas, no dependencies).
//
// Everything a poster is, drawn from a state object and a list of loaded photos:
// multi-photo layouts, gradient-map colour grades, a gradient halftone title, and
// procedural poster motifs (striped sun, skyline, palm, lens flare) over a film grain.
// Deterministic: every random choice comes from a seeded generator keyed on the cover's
// own layout, grade and caption, so the same state always paints the same poster.

/** A small seeded generator (mulberry32): stable motifs per cover, no Date/Math.random. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A string hashed to a 32-bit seed, so a caption always grows the same skyline. */
export function seedOf(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The three export sizes: name, width, height. */
export const SIZES = {
  wide: { label: '1920 × 1080', w: 1920, h: 1080 },
  portrait: { label: '1080 × 1350', w: 1080, h: 1350 },
  square: { label: '1080 × 1080', w: 1080, h: 1080 },
};

/** One colour grade: wash colours, title gradient, subtitle/glow, sun, silhouette ink. */
export const GRADES = [
  {
    id: 'sunset', label: 'Vice Sunset',
    washTop: '#ff7a3c', washBottom: '#ff2e63', washAlpha: 0.34,
    titleFrom: '#ffd166', titleTo: '#ff5e78', sub: '#ffe9a8', glow: '#ff9e00',
    sun: '#ffd166', ink: '#1c1030', grain: 0.08,
  },
  {
    id: 'neon', label: 'Neon Night',
    washTop: '#ff2fb3', washBottom: '#00e5ff', washAlpha: 0.36,
    titleFrom: '#ff7ad9', titleTo: '#37e6ff', sub: '#c8f6ff', glow: '#ff2fb3',
    sun: '#ff5ce1', ink: '#0d0620', grain: 0.08,
  },
  {
    id: 'pastel', label: 'Pastel Day',
    washTop: '#ffd9a0', washBottom: '#8fd8c2', washAlpha: 0.26,
    titleFrom: '#fff3d6', titleTo: '#ffb3c1', sub: '#ffffff', glow: '#ffb3c1',
    sun: '#fff0b8', ink: '#20303a', grain: 0.06,
  },
  {
    id: 'coral', label: 'Coral Dusk',
    washTop: '#ff6b5e', washBottom: '#ffb347', washAlpha: 0.36,
    titleFrom: '#ffe3c2', titleTo: '#ff7a5c', sub: '#ffd9a0', glow: '#ff6b5e',
    sun: '#ff9e5e', ink: '#241019', grain: 0.08,
  },
  {
    id: 'amber', label: 'Heatwave Amber',
    washTop: '#ffb400', washBottom: '#e63b2e', washAlpha: 0.38,
    titleFrom: '#ffe27a', titleTo: '#ff7a1a', sub: '#fff0b8', glow: '#ffb400',
    sun: '#ffd23e', ink: '#200f08', grain: 0.08,
  },
  {
    id: 'midnight', label: 'Midnight Palm',
    washTop: '#0f766e', washBottom: '#134e6f', washAlpha: 0.4,
    titleFrom: '#a7f3d0', titleTo: '#5eead4', sub: '#ccfbf1', glow: '#2dd4bf',
    sun: '#5eead4', ink: '#04141c', grain: 0.07,
  },
  {
    id: 'noir', label: 'Mono Noir',
    washTop: '#9ca3af', washBottom: '#111827', washAlpha: 0.3,
    titleFrom: '#ffffff', titleTo: '#d1d5db', sub: '#f3f4f6', glow: '#ffffff',
    sun: '#e5e7eb', ink: '#000000', grain: 0.06,
  },
  {
    id: 'violet', label: 'Electric Violet',
    washTop: '#a855f7', washBottom: '#6366f1', washAlpha: 0.38,
    titleFrom: '#e9d5ff', titleTo: '#c084fc', sub: '#ddd6fe', glow: '#a855f7',
    sun: '#c084fc', ink: '#150826', grain: 0.08,
  },
];

/** Crop presets: where a panel's photo sits and how far it is zoomed in. */
export const CROPS = [
  { id: 'full', label: 'Full', zoom: 1.0, px: 0.5, py: 0.5 },
  { id: 'face', label: 'Face', zoom: 1.65, px: 0.5, py: 0.28 },
  { id: 'center', label: 'Centre', zoom: 1.25, px: 0.5, py: 0.5 },
  { id: 'top', label: 'Top', zoom: 1.3, px: 0.5, py: 0.22 },
  { id: 'left', label: 'Left', zoom: 1.3, px: 0.28, py: 0.5 },
  { id: 'right', label: 'Right', zoom: 1.3, px: 0.72, py: 0.5 },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

export function cropById(id) {
  return CROPS.find((c) => c.id === id) ?? CROPS[0];
}

/** A panel's photo placement: { photo, zoom, px, py, crop, duotone, tone }. */
export function defaultPanel(photoIndex) {
  return { photo: photoIndex, zoom: 1.0, px: 0.5, py: 0.5, crop: 'full', duotone: false, tone: 0.5 };
}

/** Split a rectangle into two halves along the reading direction. */
function halves(W, H) {
  if (W >= H) return [{ x: 0, y: 0, w: W / 2, h: H }, { x: W / 2, y: 0, w: W / 2, h: H }];
  return [{ x: 0, y: 0, w: W, h: H / 2 }, { x: 0, y: H / 2, w: W, h: H / 2 }];
}

/** Split a rectangle into three strips along the reading direction. */
function thirds(W, H) {
  if (W >= H) {
    return [0, 1, 2].map((i) => ({ x: (W * i) / 3, y: 0, w: W / 3, h: H }));
  }
  return [0, 1, 2].map((i) => ({ x: 0, y: (H * i) / 3, w: W, h: H / 3 }));
}

/**
 * The nine layouts. Each one names its cells as pixel rects for a canvas of W×H;
 * rects are normalised fractions of the canvas, so one definition serves every size.
 * `clip` marks the diagonal split: its two cells both cover the canvas and the renderer
 * clips each to its own triangle.
 */
export const LAYOUTS = [
  {
    id: 'duo', label: 'Vertical duo',
    cells(W, H) { return halves(W, H); },
  },
  {
    id: 'hero2', label: 'Hero + 2',
    cells(W, H) {
      if (W >= H) {
        return [
          { x: 0, y: 0, w: W * 0.62, h: H },
          { x: W * 0.62, y: 0, w: W * 0.38, h: H / 2 },
          { x: W * 0.62, y: H / 2, w: W * 0.38, h: H / 2 },
        ];
      }
      return [
        { x: 0, y: 0, w: W, h: H * 0.62 },
        { x: 0, y: H * 0.62, w: W / 2, h: H * 0.38 },
        { x: W / 2, y: H * 0.62, w: W / 2, h: H * 0.38 },
      ];
    },
  },
  {
    id: 'grid4', label: '2 × 2 grid',
    cells(W, H) {
      return [
        { x: 0, y: 0, w: W / 2, h: H / 2 },
        { x: W / 2, y: 0, w: W / 2, h: H / 2 },
        { x: 0, y: H / 2, w: W / 2, h: H / 2 },
        { x: W / 2, y: H / 2, w: W / 2, h: H / 2 },
      ];
    },
  },
  {
    id: 'strips3', label: '3 strips',
    cells(W, H) { return thirds(W, H); },
  },
  {
    id: 'diagonal', label: 'Diagonal split',
    clip: true,
    cells(W, H) {
      return [{ x: 0, y: 0, w: W, h: H }, { x: 0, y: 0, w: W, h: H }];
    },
  },
  {
    id: 'mosaic', label: 'Mosaic (5)',
    cells(W, H) {
      if (W >= H) {
        return [
          { x: 0, y: 0, w: W * 0.5, h: H },
          { x: W * 0.5, y: 0, w: W * 0.25, h: H / 2 },
          { x: W * 0.75, y: 0, w: W * 0.25, h: H / 2 },
          { x: W * 0.5, y: H / 2, w: W * 0.25, h: H / 2 },
          { x: W * 0.75, y: H / 2, w: W * 0.25, h: H / 2 },
        ];
      }
      return [
        { x: 0, y: 0, w: W, h: H * 0.5 },
        { x: 0, y: H * 0.5, w: W / 2, h: H / 4 },
        { x: W / 2, y: H * 0.5, w: W / 2, h: H / 4 },
        { x: 0, y: H * 0.75, w: W / 2, h: H / 4 },
        { x: W / 2, y: H * 0.75, w: W / 2, h: H / 4 },
      ];
    },
  },
  {
    id: 'grid9', label: '9-panel grid',
    cells(W, H) {
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({ x: (W * c) / 3, y: (H * r) / 3, w: W / 3, h: H / 3 });
        }
      }
      return out;
    },
  },
  {
    id: 'hero3', label: 'Hero + 3',
    cells(W, H) {
      if (W >= H) {
        return [
          { x: 0, y: 0, w: W, h: H * 0.62 },
          { x: 0, y: H * 0.62, w: W / 3, h: H * 0.38 },
          { x: W / 3, y: H * 0.62, w: W / 3, h: H * 0.38 },
          { x: (W * 2) / 3, y: H * 0.62, w: W / 3, h: H * 0.38 },
        ];
      }
      return [
        { x: 0, y: 0, w: W, h: H * 0.55 },
        { x: 0, y: H * 0.55, w: W / 3, h: H * 0.45 },
        { x: W / 3, y: H * 0.55, w: W / 3, h: H * 0.45 },
        { x: (W * 2) / 3, y: H * 0.55, w: W / 3, h: H * 0.45 },
      ];
    },
  },
  {
    id: 'herofull', label: 'Full-bleed hero',
    cells(W, H) { return [{ x: 0, y: 0, w: W, h: H }]; },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

/** Draw one photo into its cell, cover-fit, with the panel's zoom and pan point. */
function paintPhoto(ctx, img, cell, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(cell.w / iw, cell.h / ih) * panel.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = cell.x + cell.w / 2 - dw * panel.px;
  const dy = cell.y + cell.h / 2 - dh * panel.py;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** A grade's wash over one cell: a top-to-bottom gradient-map tint. */
function paintWash(ctx, cell, grade, tone) {
  const strength = grade.washAlpha * (0.5 + tone);
  const g = ctx.createLinearGradient(cell.x, cell.y, cell.x, cell.y + cell.h);
  g.addColorStop(0, grade.washTop);
  g.addColorStop(1, grade.washBottom);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = strength;
  ctx.fillStyle = g;
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = strength * 0.7;
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  ctx.restore();
}

/** The diagonal clip for the split layout: cell 0 keeps the top-left triangle. */
function diagonalClip(ctx, W, H, index) {
  ctx.beginPath();
  if (index === 0) {
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(0, H);
    ctx.closePath();
  } else {
    ctx.moveTo(W, 0);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
  }
  ctx.clip();
}

/** A striped sun disc, cut on its own layer so the stripes stay transparent. */
function paintSun(ctx, W, H, grade) {
  // Top-right corner, clear of the subjects' faces in every layout.
  const cx = W * 0.85;
  const cy = H * 0.11;
  const r = H * 0.075;
  const layer = document.createElement('canvas');
  layer.width = Math.ceil(r * 2 + 4);
  layer.height = Math.ceil(r * 2 + 4);
  const g = layer.getContext('2d');
  g.fillStyle = grade.sun;
  g.beginPath();
  g.arc(r + 2, r + 2, r, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = 'destination-out';
  const stripes = 4;
  for (let i = 0; i < stripes; i++) {
    const y = r + 2 + (r * 0.15 + (i * r * 0.22));
    g.fillRect(0, y, layer.width, r * 0.07);
  }
  ctx.drawImage(layer, cx - r - 2, cy - r - 2);
  // A soft flare around the disc.
  const flare = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.6);
  flare.addColorStop(0, 'rgba(255,255,255,0.30)');
  flare.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = flare;
  ctx.fillRect(cx - r * 2.6, cy - r * 2.6, r * 5.2, r * 5.2);
  ctx.restore();
}

/** A seeded skyline silhouette, its base at 60% of the height. */
function paintSkyline(ctx, W, H, grade, rng) {
  const base = H * 0.6;
  ctx.save();
  ctx.fillStyle = grade.ink;
  let x = 0;
  while (x < W) {
    const bw = W * (0.018 + rng() * 0.045);
    const bh = H * (0.015 + rng() * 0.055);
    ctx.fillRect(x, base - bh, bw, bh);
    if (rng() < 0.45) ctx.fillRect(x + bw * 0.25, base - bh - H * 0.012, bw * 0.18, H * 0.012);
    x += bw + W * 0.004;
  }
  ctx.fillRect(0, base - 1, W, 2);
  // A few lit windows, warm dots on the dark band.
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < Math.floor(W / 26); i++) {
    const wx = rng() * W;
    const wy = base - rng() * H * 0.055;
    ctx.globalAlpha = 0.5 + rng() * 0.5;
    ctx.fillRect(wx, wy, 2.5, 2.5);
  }
  ctx.restore();
}

/** A palm silhouette in the bottom-left corner, drawn as strokes. */
function paintPalm(ctx, W, H, grade) {
  const u = Math.min(W, H);
  const baseX = W * 0.055;
  const baseY = H * 0.985;
  const crownX = W * 0.095;
  const crownY = H * 0.845;
  ctx.save();
  ctx.strokeStyle = grade.ink;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, u * 0.006);
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + u * 0.02, H * 0.92, crownX, crownY);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, u * 0.004);
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI * (0.08 + i * 0.17);
    const len = u * (0.075 + (i % 2) * 0.02);
    const ex = crownX + Math.cos(angle) * len;
    const ey = crownY - Math.sin(angle) * len * 0.7;
    const mx = crownX + Math.cos(angle) * len * 0.55;
    const my = crownY - Math.sin(angle) * len * 0.95;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

/** Split a caption into lines on | or a newline. */
function captionLines(caption) {
  return String(caption ?? '')
    .split(/[\n|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** A gradient title with a dark outline, a slanted glowing subtitle, halftone dots. */
function paintTitleBlock(ctx, W, H, grade, title, subtitle) {
  const lines = captionLines(title);
  if (lines.length === 0) return;
  const bandTop = H * 0.63;
  const bandBottom = H * 0.965;
  const bandH = bandBottom - bandTop;
  // The subtitle sits above the title; the title fills the rest of the band.
  const subH = H * 0.045;
  const titleAreaH = bandH - subH - H * 0.02;
  let size = (titleAreaH / Math.max(1, lines.length)) * 0.92;
  const maxW = W * 0.92;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const setTitleFont = (s) => {
    ctx.font = `900 ${s}px system-ui, "Segoe UI", sans-serif`;
    try { ctx.letterSpacing = '1px'; } catch { /* older canvas: no letter spacing */ }
  };
  setTitleFont(size);
  let widest = 0;
  for (const line of lines) widest = Math.max(widest, ctx.measureText(line).width);
  while (widest > maxW && size > H * 0.04) {
    size *= 0.94;
    setTitleFont(size);
    widest = 0;
    for (const line of lines) widest = Math.max(widest, ctx.measureText(line).width);
  }
  const titleGrad = ctx.createLinearGradient(0, bandTop + subH, 0, bandBottom);
  titleGrad.addColorStop(0, grade.titleFrom);
  titleGrad.addColorStop(1, grade.titleTo);
  // Subtitle: slanted, letterspaced, glowing.
  const subLines = captionLines(subtitle);
  if (subLines.length > 0) {
    const subText = subLines.join('  ·  ').toUpperCase();
    let subSize = subH * 0.72;
    ctx.font = `italic 800 ${subSize}px system-ui, "Segoe UI", sans-serif`;
    try { ctx.letterSpacing = '6px'; } catch { /* older canvas */ }
    while (ctx.measureText(subText).width > maxW && subSize > H * 0.015) {
      subSize *= 0.94;
      ctx.font = `italic 800 ${subSize}px system-ui, "Segoe UI", sans-serif`;
    }
    ctx.save();
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = H * 0.02;
    ctx.fillStyle = grade.sub;
    ctx.fillText(subText, W / 2, bandTop + subH * 0.5);
    ctx.restore();
  }
  // Title lines, gradient-filled with a dark outline. (Reset the font: the subtitle
  // block above changed it, and the title must be drawn at its own size.)
  setTitleFont(size);
  const lineH = titleAreaH / lines.length;
  lines.forEach((line, i) => {
    const y = bandTop + subH + H * 0.01 + lineH * (i + 0.5);
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10, 5, 20, 0.9)';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeText(line, W / 2, y);
    ctx.fillStyle = titleGrad;
    ctx.fillText(line, W / 2, y);
    ctx.restore();
  });
  // Halftone dots under the title: three rows, tapering toward the edges.
  const dotY = bandTop + subH + titleAreaH + H * 0.012;
  const span = W * 0.7;
  const cols = 46;
  for (let row = 0; row < 3; row++) {
    for (let c = 0; c < cols; c++) {
      const t = c / (cols - 1);
      const edge = 1 - Math.abs(t - 0.5) * 1.6;
      const r = Math.max(0.4, (H * 0.0032 - row * H * 0.0007) * Math.max(0.25, edge));
      ctx.fillStyle = grade.titleFrom;
      ctx.globalAlpha = 0.9 - row * 0.25;
      ctx.beginPath();
      ctx.arc(W / 2 - span / 2 + t * span, dotY + row * H * 0.008, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
}

/** A pre-rendered film-grain tile, the same every render (fixed seed). */
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const g = tile.getContext('2d');
  const rng = mulberry32(1337);
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rng() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = tile;
  return tile;
}

/**
 * Paint one cover onto a canvas.
 * state: { layout, grade, size, title, subtitle, panels: [{photo, zoom, px, py, crop, duotone, tone}] }
 * images: loaded photos by index (an entry may be null when its photo failed to load).
 * dims: optional {w, h} to paint at — the preview and shot modes paint at viewport
 * size; without it the cover paints at its export size.
 */
export function renderCover(canvas, state, images, dims) {
  const size = dims ?? SIZES[state.size] ?? SIZES.wide;
  const W = size.w;
  const H = size.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = gradeById(state.grade);
  const layout = layoutById(state.layout);
  const cells = layout.cells(W, H);
  const rng = mulberry32(seedOf(`${state.layout}|${state.grade}|${state.title}|${state.subtitle}`));

  ctx.fillStyle = grade.ink;
  ctx.fillRect(0, 0, W, H);

  cells.forEach((cell, i) => {
    const panel = state.panels[i] ?? defaultPanel(i % Math.max(1, images.length));
    const img = images[panel.photo];
    ctx.save();
    if (layout.clip) diagonalClip(ctx, W, H, i);
    ctx.beginPath();
    ctx.rect(cell.x, cell.y, cell.w, cell.h);
    ctx.clip();
    if (img) {
      if (panel.duotone) ctx.filter = 'grayscale(1) contrast(1.12) brightness(1.05)';
      paintPhoto(ctx, img, cell, panel);
      ctx.filter = 'none';
    } else {
      const g = ctx.createLinearGradient(cell.x, cell.y, cell.x, cell.y + cell.h);
      g.addColorStop(0, grade.washTop);
      g.addColorStop(1, grade.washBottom);
      ctx.fillStyle = g;
      ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
    }
    paintWash(ctx, cell, grade, panel.tone ?? 0.5);
    ctx.restore();
  });

  // Panel dividers so the collage reads as separate frames.
  ctx.save();
  ctx.strokeStyle = 'rgba(10, 5, 20, 0.9)';
  ctx.lineWidth = Math.max(2, W * 0.002);
  for (const cell of cells) ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);
  ctx.restore();

  paintSun(ctx, W, H, grade);
  paintSkyline(ctx, W, H, grade, rng);
  paintPalm(ctx, W, H, grade);
  paintTitleBlock(ctx, W, H, grade, state.title, state.subtitle);

  // A thin double frame, then grain and a vignette to finish the poster.
  const inset = Math.min(W, H) * 0.012;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.003);
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(1, Math.min(W, H) * 0.0015);
  ctx.strokeRect(inset * 1.8, inset * 1.8, W - inset * 3.6, H - inset * 3.6);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = grade.grain;
  ctx.fillStyle = ctx.createPattern(getGrainTile(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}
