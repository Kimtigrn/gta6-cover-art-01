// Vice City Cover Studio v4 — gta6-cover-art-01 entry (Node 22, standard library only).
//
// The app is this directory's app/ folder: plain static files a desktop browser loads
// offline (app/index.html and its ES modules, no library, no network request). This file
// hands it in: it copies app/ and screenshots/ from beside itself to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored make.fun library.
//
// The cover maker itself: 9 multi-photo layouts, 8 gradient-map grades, halftone gradient
// titles, procedural poster motifs (striped sun, palm and skyline silhouettes, lens flare),
// per-panel crop presets with zoom and drag-pan, per-panel duotone and tone, and export of
// all three post sizes at once. Everything is drawn on canvas from the two bundled sample
// photos (made for make.fun with an image model) or a photo the user uploads.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes;
// the others refuse an entry the scorer would refuse — more than 4 screenshots or one
// over 256 KiB; more than 993 files in app/ or 48 MiB of app files in all; a path under
// app/ over 1000 bytes (app/ counts beside /output's own 1000-entry cap, with its
// screenshots/ and dossier.json). Kept as one named constant so the limits are visible.
const GATE = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
} as const;

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(join(out, 'dossier.json'), buildDossier(out, GATE));
