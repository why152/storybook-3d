# Open source page-turn evaluation — 2026-11-04

The [Notion project hub](https://app.notion.com/p/403d0befadbd81cbaba2e9061105d171) calls for a source and browser comparison before changing renderers. The acceptance target is the existing hardcover, two-page spread and one flexible half-width leaf visibly hinged to the spine. The five original illustrations, original ink, living actors, touch, keyboard, reduced motion and reading zoom remain requirements.

| Project | Source and license reviewed | Fit and decision |
| --- | --- | --- |
| [StPageFlip](https://github.com/Nodlik/StPageFlip/tree/ab30ecc1d9f6d98de1a99b8e296469382f41c120) | MIT. `HTMLPage.ts` clips and rotates flat DOM pages. `ImagePage.ts` uses a matching canvas operation. | **Keep as control.** The real image-mode run is light, but the folded face crosses the spread along a crease. It does not reproduce Storybook's visibly lifted sheet. |
| [The Book of Qbject](https://github.com/Qbject/the-book-of-qbject/tree/6a753c6b0aa0d649f5ebd68afd697f5ce2029482) | MIT. `src/page.ts` uses textured Three.js box faces and denser geometry near the spine. | **Keep as geometry reference.** Replacing the book with its scene would require porting camera, lighting, artwork layers and reading interactions. No performance result for that integration. |
| [book-flip](https://github.com/shiarauzo/book-flip/tree/65a52d4dc83a081247660bc1a04094bdd0416f54) | No license file or explicit package license found at the reviewed revision. | **Research only.** A subdivided plane and a progress uniform are relevant ideas. No code or assets adopted. |
| [Grabfold](https://github.com/javocsoft/grabfold/tree/d291f1172a38243c44cc1d4f1ce8912468a73123) | MIT. Tested `grabfold@0.1.0` from npm. One DOM slot per page, with optional WebGL curl and a bounded texture cache. | **Keep the experiment as a comparison, adopt the lifecycle lesson.** Both modes turn smoothly in the lab. The travelling crease in the WebGL version looks different from the spine-driven bend. |

## Browser experiment

`compare-open-source-turns.mjs` takes left and right snapshots from the actual HELLO, GROW and TOGETHER pages, including their original ink, at 390×844 / DPR 3. It loads the two pinned upstream packages in a local browser harness and records HELLO → GROW → TOGETHER → GROW → HELLO. Storybook runs its ordinary route and retains live scene layers. The upstream runs reuse decoded stills. The same viewport, page sizes and page contents make this a useful renderer comparison. Predecoding, motion geometry, animation timing and feature scope differ. The upstream WebM frames are wall-clock samples, not equivalent 3D pose percentages.

| WebKit on macOS | Four per-turn median rAF intervals | Four per-turn p95 rAF intervals | Wall time per turn |
| --- | ---: | ---: | ---: |
| Storybook with transparent ink and cached art | 16–17 ms | 36–42 ms | 1505–1542 ms |
| StPageFlip canvas | 17 ms | 18–22 ms | 459–461 ms |
| Grabfold DOM | 17 ms | 18–22 ms | 1285–1300 ms |
| Grabfold WebGL | 17 ms | 18–21 ms | 1291–1300 ms |

StPageFlip's effective turn was shorter even with the same nominal duration setting. Both Grabfold paths had fewer long frames on these predecoded pages. In the recorded middle of the turn, the incoming face follows a crease that sweeps across the spread. Storybook's page silhouette visibly rises around the central binding. The different motion and the absence of native actor and reading state in the lab prevent these results from certifying a full replacement. The browser run measures local rAF intervals. Real iPhone frame time, memory and touch remain to be checked.

## Production decision

Keep the measured transparent-ink and single-art-cache repair. Borrow Grabfold's approach of avoiding duplicate page work in the turn lifecycle. Mount the curved strips after their face print is available, omit the unused generic artwork-decode pass for flexible turns, and skip writing the cover-only lighting variable on those frames. Keep the existing image-ready handoff, native settled surfaces, cover and paper geometry. No new runtime dependency or vendor code. The [Safari validation record](iphone-safari-ink-performance.md) tracks the repair and its independent evidence.

Run the lab against a local production preview at port 5174:

```sh
npm install --prefix /tmp/storybook-lab --ignore-scripts --no-audit --no-fund --no-package-lock grabfold@0.1.0 page-flip@2.0.7
node scripts/compare-open-source-turns.mjs /tmp/storybook-lab/node_modules test-results/open-source-turns
```

The lab outputs continuous WebM, settled screenshots and JSON. Review artifacts are excluded from the shipped app. The app's five-pose and cover/turn evidence is captured separately with `scripts/capture-safari-repair.mjs`.
