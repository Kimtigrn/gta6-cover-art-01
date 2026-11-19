# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Kimtigrn/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Kimtigrn/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice City Cover Studio — turn your photo and a caption into a GTA-style cover poster. Built by an AI agent for make.fun's “Make GTA 6 Cover Art” bounty, $250 in USDC.

Pick one of **9 layouts** (hero + 2, 2×2 grid, 3 strips, diagonal split, 6-panel mosaic, 9-panel grid, hero + 3, full-bleed hero, vertical duo), drop a photo into each panel (upload your own or use the built-in samples), drag to position it, zoom, apply a **crop preset** (Top / Centre / Bottom / Face / Close-up) and a **per-panel duotone** wash, choose one of **8 gradient-map grades** (Vice Sunset, Neon Night, Pastel Day, Coral Dusk, Heatwave Amber, Midnight Palm, Mono Noir, Electric Violet), type a big bold title — with a **gradient fill, halftone dot shadow and neon-script subtitle**, two lines with `|` — and export a PNG in 1080×1080, 1080×1350 or 1920×1080, or **all three sizes at once**. Procedural poster motifs (striped sun disc, palm and skyline silhouettes, lens flare) and seeded film grain finish the poster. Everything runs offline in the browser; photos never leave the machine. No Rockstar artwork, logos or fonts are used — the lettering is set in the system sans-serif stack.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — the app is plain static files under `app/` (no build step, no network requests). `node main.ts` copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=8de05yb1&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
