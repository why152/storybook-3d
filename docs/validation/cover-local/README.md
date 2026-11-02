# Cover recovery comparison — 2026-11-02

**Review candidate only. No merge, deployment, owner sign-off, or real iPhone certification.**

Open [offline review](review.html) for matched screenshots and playable, unedited browser recordings. Main (`88fcc365`), PR #36 (`41db2d6`) and this corrected candidate use the same original art, 1440×900 desktop / 390×844 mobile viewports, 0/25/50/75/100% cover and GROW poses. Contact sheets use a consistent mobile crop only for legibility; videos retain the entire viewport. Fixed poses use reduced motion to hold source artwork steady; motion recordings use normal animation.

## Observed defect and selection

- **Main — reject for cover:** as the hardcover starts opening, the full-width pale paper stack is progressively unmasked to its left even though no physical page occupies that region. This is the visible light rectangle at 25–50%.
- **PR #36 — iterate:** mounting real HELLO on the left is useful for pose handoff. Its linear reveal paints an extra static HELLO fragment before the hardcover reaches that side. At 50% the rabbit appears on the static fragment while the same illustration is also printed on the rotating hardcover back.
- **Corrected candidate — keep for owner review:** retain the mounted HELLO underlay but hide its static copy during cover motion. Only the rotating hardcover back displays left artwork. The paper stack/shadow remain on the right. Both navigation and interactive dragging share CSS state, so cancelled drags cannot leave an inline clipping value behind.

The shell still shifts from portrait to landscape, one half-width hardcover rotates about the binding, and the interior segmented paper, original actors/artwork, chapter data, customization and gift links are unchanged. At landing the static HELLO takes over the already registered back-face artwork. Existing browser perspective differences remain: WebKit's rigid cover foreshortening is less pronounced than Chromium's. This pass does not claim renderer parity or final art approval.

## Evidence

- [Chromium mobile comparison](chromium-mobile-comparison.jpg), [desktop](chromium-desktop-comparison.jpg)
- [WebKit mobile comparison](webkit-mobile-comparison.jpg), [desktop](webkit-desktop-comparison.jpg)
- [Corrected Chromium mobile continuous recording](corrected/chromium-mobile-open-forward-back-close.webm)
- [Corrected WebKit mobile continuous recording](corrected/webkit-mobile-open-forward-back-close.webm)
- Equivalent desktop and both baseline recordings are linked in the offline review.
- [Interior parity](interior-parity.json): 17/20 GROW poses pixel-identical to main; remaining max full-viewport mean absolute channel error **0.003549 / 255**. This narrow comparison checks the cover change, not every mobile GPU/scene.
- Motion contact sheets sample the real recordings; they are secondary evidence, not a replacement for playback. Recording starts before navigation, so initial blank frames are startup rather than an in-book flash.

Full-resolution PNG captures remain local and ignored to avoid committing another large duplicate artifact tree. The capture and review-builder scripts reproduce them. No private letter material is present in these captures.

## Final local verification

ESLint, TypeScript, Vite production build, 30 original SVG planes and 14 source-registered actors: **pass**. Final full suites on Node **22.22.0**: **Chromium 84/84 passed; WebKit 83 passed / 1 Chromium-only CDP touch test skipped**. Both include the 25 cover checks (two viewports, two editions, five poses, repeated cycles, dragging reversal, pointer cancellation, reduced motion). [Machine-readable result](verification.json).

## Regression harness correction

The first full Chromium run passed 81/84 tests; HELLO/GROW/TOGETHER print-proof comparisons failed. The original main reproduced HELLO at **56.96** mean error, proving this was not introduced by the cover edit. WebKit also hit the same class of failure on DREAM. Inspecting the attached native/proof images showed the proof cloned the left art half, not a faulty printed pose.

At an exactly flat endpoint the mesh is `display:none`, replaced by native paper. The old test read its hidden descendant's used CSS dimensions before the first moving frame. It now waits for `data-paper-endpoint=none` before inspecting a real visible strip. The **2.5** pixel threshold is unchanged; mismatches retain both actual images. Four chapter handoff checks passed on unchanged main after this harness correction. [Diagnostic image](hidden-print-test-diagnostic.jpg).

## Timing scope

Each target's `timings.json` records one video-backed closed → HELLO → GROW → HELLO → closed cycle per browser/viewport. Total action time includes automation click dispatch, print preparation, the intentional 1.28s turn, video capture and completion polling. These are local smoke timings, **not FPS, a controlled speedup benchmark, or real iPhone GPU measurements**. There is no paper performance optimization claim in this cover-only milestone.

## Reproduction

Node 22 and committed `package-lock.json`:

```sh
npm ci --no-audit --no-fund
npm run lint
npm run typecheck
npm run build
npm run test:assets
npm run test:actors
npx playwright install chromium webkit
STORYBOOK_TEST_PRODUCTION=1 npm run test:e2e
STORYBOOK_TEST_PRODUCTION=1 STORYBOOK_TEST_BROWSER=webkit npm run test:e2e
```

Serve immutable main, PR #36, and corrected builds at separate local URLs. For each, run from the corrected checkout (replace target and URL):

```sh
COVER_REVIEW_TARGET=corrected COVER_REVIEW_URL=http://127.0.0.1:5175 node scripts/capture-cover-review.mjs
python3 scripts/build-cover-review.py
```

The Python builder requires Pillow. Browser binaries in this local run live in `/private/tmp/storybook-browsers`; set `PLAYWRIGHT_BROWSERS_PATH` accordingly when reproducing here. Use a production build when working inside a hidden recovery directory, since Vite's default watcher can ignore hidden parent paths.

## Local recovery and next gate

Original branch: `codex/flexible-paper-local@15b2a25`, zero unpushed commits against its upstream. Four pre-existing edited files, untracked evidence and test output were left intact. A binary-capable patch and audit were saved under the original checkout's `.local-recovery/20261102/`. No reset, forced checkout, stash or blind cherry-pick was used.

Main already contains flexible paper, native endpoints, physical drag, mobile layout and gift links; do not reintegrate the old engine wholesale. The unsaved DPR/zoom/alignment candidate remains separate for a later measured comparison. PR #37's private extraction tools remain a distinct content task. The authentic source video is now locally available; no public asset permission is implied.

Next: owner reviews the local cover and continuous footage; real iPhone Safari portrait/landscape and performance need separate verification. Only then consider merge or deployment.
