# Authentic ink integration — 2026-11-02

**Local private release candidate. Not visually approved, merged, or deployed.**

The owner requires the first new release to include the friend's actual handwriting. It is not deferred to a later text-only edition. The five original illustrated spreads, scene actors, central binding, flexible mesh and birthday/share features remain intact.

## Implemented

- Reused PR #37's private extraction workflow on top of the verified cover candidate (`18c343d`, PR #38; its CI is success).
- Inspected a completed frame of the local non-birthday `4569.mp4`, selected 12 natural line/paragraph fragments across the ten physical page faces, and retained the original source mapping and signature/date privately.
- Found and fixed a real extraction bug: ffmpeg's YUV420 crop rounds odd coordinates and dimensions. Convert the **complete** frame to RGB before exact cropping. All **12/12 PNGs match their corresponding complete-frame regions pixel-for-pixel**, including original paper and antialiasing. No reconstructed glyphs, generated handwriting, OCR fill-in, or source-video publication.
- Native ink images render inside `SceneArt`'s existing physical page surfaces. The same `PageHalf` is used for static pages, native flat endpoints and every curved front/back strip. This retains the original pixels without baking handwriting into a second snapshot. Mounted image decoding now includes ink for cover readiness. Native vector lettering and the established `paperPrint.ts` art capture remain unchanged.
- Restored the original art to full visibility in the authentic-ink edition; removed the large typed letter panels for that edition. Small original-paper fragments sit above the existing scene art. A phone reader can expand the same real crops for legibility.
- Private asset/provenance inputs and the private production build stay outside every public checkout. The optional Vite provider emits no ink in ordinary CI. Private previews cannot write their build into the public checkout. `publishedHandwriting.ts` is intentionally empty until the owner approves the specific fragments for public use.

## Actual browser evidence

Private evidence is deliberately **not** uploaded to this public repository or CI artifacts. The local review contains all 12 source fragments, five chapters in desktop/mobile, readable phone expansions, five physical turn poses, endpoint comparisons, and unedited cover → forward → reverse → cover recordings for Chromium and WebKit.

**Code-only final regression:** Chromium **90 passed / 8 private tests skipped**; WebKit **89 passed / 9 skipped** (8 private, 1 Chromium CDP). Lint, TypeScript, production builds, 30 original planes and 14 actors pass.

Dedicated source-backed private checks: **Chromium 8/8, WebKit 8/8**. Front/back endpoint screenshot mean errors are far below the unchanged **2/255** gate. All original ink is attached to the same physical page and its clipping; the front and reverse have distinct crops. Original SVG lettering remains readable in both directions.

Visual observations: the five original scenes remain the dominant illustration. This first integration uses deliberately visible small paper ribbons rather than transparent ink matting, preserving every source pixel. The phone's small physical spreads require the expansion reader for comfortable handwriting reading. These are real browser results; owner art direction and actual iPhone Safari verification remain outstanding.

## Measured resource improvement

The first instrumented cycles showed four temporary print URLs retained after landing and after closing, about **1.47–1.62 MB of PNG blobs** at mobile viewport size. Native pages no longer use these textures. The renderer now releases the print and decoded-print state immediately after landing. Every final measured cycle in both engines/viewports retains **zero** application-created print URLs and **zero** associated blob bytes while idle; the next turn still prepares its actual current actor poses.

The recordings also retain readiness and requestAnimationFrame samples. Mobile initial flexible-leaf readiness in these local runs was roughly **140–210 ms**. Headless WebKit still showed slower frame pacing than Chromium (including large desktop frames). These measurements include video recording and are **not real iPhone GPU FPS**, a promised 60 FPS, or proof that all performance work is finished. No renderer rewrite or reduction to rigid cards was used.

## Reproduce privately

Node 22, `npm ci`, browser binaries and ffmpeg are required. Pillow is used only for local source-pixel verification. Keep the source video, source map and crop directory outside Git.

```sh
node scripts/extract-handwriting.mjs --source /PRIVATE/4569.mp4 --manifest /PRIVATE/crop-map.json --output /PRIVATE/crops
python3 scripts/verify-private-ink.py /PRIVATE/source-frame.png /PRIVATE/crop-map.json /PRIVATE/crops
STORYBOOK_PRIVATE_INK_DIR=/PRIVATE/crops npm run build -- --outDir /PRIVATE/build
npm run preview -- --outDir /PRIVATE/build --host 127.0.0.1 --port 5178
STORYBOOK_TEST_PRIVATE_INK=1 STORYBOOK_PRIVATE_EVIDENCE_DIR=/PRIVATE/evidence STORYBOOK_TEST_BASE_URL=http://127.0.0.1:5178 npx playwright test tests/authentic-ink.spec.ts --output=/PRIVATE/test-results
# Repeat with STORYBOOK_TEST_BROWSER=webkit.
```

Alongside `private-source-map.json`, the private crop directory contains a reviewed `layout.json` with typed fragment IDs, chapter/page side, local PNG filename, percentage left/top/width, order and a cautious accessible label. Full original handwriting, not the partial label, is the visual source of truth.

Normal public code-only builds have no private ink and preserve the earlier typed fallback until publication is approved. Run the standard full browser suites against that public build; private tests intentionally skip in ordinary CI. The real private integration is verified separately above, not falsely attributed to public CI.

## Release gate and rollback

Owner review must cover the actual image/animation and the public-use scope of the selected fragments, including the original address, signature and date. The prepared private build can be packaged without exposing the source video or provenance. After approval, copy only the selected PNGs to `public/handwriting/` and populate `src/data/publishedHandwriting.ts` with their reviewed layout and deployment-base-aware URLs; run the final public checks before publishing. Until then the published list stays empty.

Cover-only rollback is `18c343d`; original main remains `88fcc365`. No production site was changed. Old local work and private source files were preserved.
