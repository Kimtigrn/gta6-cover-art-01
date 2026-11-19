// Renders a multi-panel GTA-style cover onto a canvas at the canvas's own size.
// The cover is built from normalised panel rectangles (fractions of the canvas),
// so the same drawing code serves the live preview and every export size
// (1080x1080, 1080x1350, 1920x1080). All photos are drawn from images already
// loaded on the user's machine; nothing here ever touches the network.

/** Panel rectangles per layout, as [x, y, w, h] fractions of the canvas. */
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
};

/** Colour grades: a wash over the whole cover plus a bottom legibility gradient. */
export const PRESETS = {
  sunset: {
    label: 'Vice Sunset',
    wash: ['rgba(255, 122, 26, 0.16)', 'rgba(214, 38, 120, 0.30)'],
    glow: 'rgba(255, 176, 66, 0.55)',
    title: '#fff7e8',
    titleStroke: '#2a0a2e',
    subtitle: '#ffd9a0',
  },
  neon: {
    label: 'Neon Night',
    wash: ['rgba(64, 224, 255, 0.14)', 'rgba(150, 32, 220, 0.34)'],
    glow: 'rgba(64, 224, 255, 0.45)',
    title: '#eafcff',
    titleStroke: '#12002e',
    subtitle: '#8ef3ff',
  },
  pastel: {
    label: 'Pastel Day',
    wash: ['rgba(255, 182, 213, 0.14)', 'rgba(120, 200, 255, 0.18)'],
    glow: 'rgba(255, 240, 180, 0.5)',
    title: '#ffffff',
    titleStroke: '#17324a',
    subtitle: '#dff3ff',
  },
};

/** Deterministic pseudo-random generator, so the film grain is identical on every run. */
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

/** Draws one photo into a panel rect, cover-fit, with zoom and pan offsets. */
function drawPanel(ctx, panel, rect, w, h) {
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
    const cx = x + pw / 2 + (panel.ox || 0) * pw;
    const cy = y + ph / 2 + (panel.oy || 0) * ph;
    ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih);
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

/** Bold outlined lettering with a subtle drop shadow, fitted to maxWidth. */
function drawTitle(ctx, text, cx, baselineY, maxWidth, maxSize, fill, stroke) {
  let size = maxSize;
  ctx.font = `900 ${size}px "Liberation Sans", sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 12) {
    size -= 2;
    ctx.font = `900 ${size}px "Liberation Sans", sans-serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = size * 0.12;
  ctx.shadowOffsetY = size * 0.04;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, cx, baselineY);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = fill;
  ctx.fillText(text, cx, baselineY);
  return size;
}

function drawGrain(ctx, w, h) {
  const rng = mulberry32(20261119);
  const step = Math.max(1, Math.round(w / 960));
  ctx.save();
  ctx.globalAlpha = 0.04;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const v = rng();
      ctx.fillStyle = v > 0.5 ? '#ffffff' : '#000000';
      ctx.fillRect(x, y, step, step);
    }
  }
  ctx.restore();
}

/**
 * Draws the whole cover.
 * state: { layout, preset, title, subtitle, grain, vignette, panels }
 * panels: [{ img|null, zoom, ox, oy }] — one per layout panel, extra entries ignored.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.hero2;
  const preset = PRESETS[state.preset] ?? PRESETS.sunset;

  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, w, h);

  layout.panels.forEach((rect, i) => {
    drawPanel(ctx, state.panels[i] ?? {}, rect, w, h);
  });

  // Sunset / neon sun glow, top right of the first panel.
  const glow = ctx.createRadialGradient(w * 0.82, h * 0.16, 0, w * 0.82, h * 0.16, w * 0.34);
  glow.addColorStop(0, preset.glow);
  glow.addColorStop(1, 'rgba(255, 176, 66, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Colour wash over the whole poster.
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, preset.wash[0]);
  wash.addColorStop(1, preset.wash[1]);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  // Bottom band so the lettering always reads.
  const band = ctx.createLinearGradient(0, h * 0.62, 0, h);
  band.addColorStop(0, 'rgba(10, 4, 18, 0)');
  band.addColorStop(0.55, 'rgba(10, 4, 18, 0.45)');
  band.addColorStop(1, 'rgba(10, 4, 18, 0.82)');
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
  if (title) {
    const size = drawTitle(
      ctx, title, w / 2, h - h * 0.075, w * 0.92, h * 0.115,
      preset.title, preset.titleStroke,
    );
    const sub = (state.subtitle || '').trim().toUpperCase();
    if (sub) {
      ctx.font = `700 ${Math.max(10, Math.round(size * 0.26))}px "Liberation Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      // Letter-space the subtitle by hand (canvas has no letter-spacing everywhere).
      const chars = [...sub].join('\u2009');
      ctx.fillStyle = preset.subtitle;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(chars, w / 2, h - h * 0.075 - size * 1.18);
      ctx.shadowBlur = 0;
    }
  }

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
