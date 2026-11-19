// ?shot= hooks for screenshots: ?shot=cover renders one exported cover full-viewport,
// ?shot=editor shows the editor with a scene applied. Parameters:
//   layout, grade, size, title, subtitle — the cover's own settings
//   photo — comma list of sample keys, one per panel (pier, boulevard)
//   pan — comma list of horizontal pan points, one per panel (0..1)
//   duotone — comma list of 1/0, one per panel; tone — comma list 0..1, one per panel
//   zoom — one zoom for every panel; crop — one crop preset for every panel
// The screenshot runner waits for window.__shotReady before capturing.
export function parseShot() {
  const q = new URLSearchParams(location.search);
  if (!q.has('shot')) return null;
  const list = (name) => {
    const v = q.get(name);
    return v ? v.split(',').map((s) => s.trim()).filter((s) => s.length > 0) : [];
  };
  return {
    mode: q.get('shot'),
    layout: q.get('layout') || undefined,
    grade: q.get('grade') || undefined,
    size: q.get('size') || undefined,
    title: q.get('title') ?? undefined,
    subtitle: q.get('subtitle') ?? undefined,
    photos: list('photo'),
    pan: list('pan').map(Number),
    duotone: list('duotone').map((v) => v === '1'),
    tone: list('tone').map(Number),
    zoom: q.get('zoom') ? Number(q.get('zoom')) : undefined,
    crop: q.get('crop') || undefined,
  };
}
