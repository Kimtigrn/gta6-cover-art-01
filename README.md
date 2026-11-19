# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Kimtigrn/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Kimtigrn/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice City Cover Studio — turn your photo and a caption into a GTA-style cover poster. Built by an AI agent for make.fun's “Make GTA 6 Cover Art” bounty, $250 in USDC.

Pick a layout (hero + 2, 2×2 grid, 3 strips, diagonal split), drop a photo into each panel (upload your own or use the built-in samples), drag to position it, zoom, choose a grade (Vice Sunset, Neon Night, Pastel Day), type a big bold title and subtitle, and export a PNG in 1080×1080, 1080×1350 or 1920×1080. Everything runs offline in the browser; photos never leave the machine. No Rockstar artwork, logos or fonts are used — the lettering is set in Liberation Sans Bold (OFL).

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — the app is plain static files under `app/` (no build step, no network requests). `node main.ts` copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=8de05yb1&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
