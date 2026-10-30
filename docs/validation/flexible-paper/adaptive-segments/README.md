# Adaptive paper segments — browser evidence

The candidate keeps the physical bound book and chooses 8–13 connected strips
from the actual leaf width and pixel-rounded cuts. It remains **work in progress**:
the Chromium 393px reverse endpoint and real-device/user acceptance are open.

- `*-grow-poses.png`: original GROW art, 13-strip baseline versus adaptive
  candidate at 0/25/50/75/100%, in the same viewport and camera.
- `*-cover-poses.png`: authentic cover-opening poses. Chromium's comparison
  repeats the unchanged candidate cover because its old raw cover frames were
  not retained; the earlier matched cover contacts are in `../closing-banded/`.
- `*-opening-forward-back.webm`: untrimmed real browser opening, forward,
  backward and closing. `*-video-contact.png` samples these recordings.
- `*-flexible-grow-*.png`: original full-resolution candidate screenshots.
- `webkit-mobile-interleaved.json`: three alternating baseline/candidate runs,
  four interior turns per run including print preparation, 390×844, DPR 1.
  p95 baseline 57/59/59 ms; candidate 33/35/34 ms. This is an automated
  macOS browser viewport, not phone hardware or a GPU benchmark.
- `*-timings.json`: separate cover/interior four-turn captures, not the same
  measurement scope as the interleaved interior-only benchmark.
- `chromium-393-regression/`: actual failing frames and numeric metrics;
  mean RGB 3.8206 versus the unchanged <2 gate.
- `manifest.json`: baseline commit, source hashes and capture conditions.

Reproduce the timing comparison by serving baseline commit `3c13983` at port
5179 and this candidate's built `dist/` at port 5175, then run
`PLAYWRIGHT_BROWSERS_PATH=<browser-path> node scripts/benchmark-paper-segments.mjs`.
The script reports rAF intervals, not a claim of sustained FPS.
