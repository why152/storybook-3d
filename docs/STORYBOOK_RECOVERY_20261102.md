# Storybook recovery — implementation contract (2026-11-02)

Status: **implementation started**; not approved or deployed. Working branch: `fix/cover-opening-and-storybook-recovery-20261102` from `88fcc365`.

## Product target

An illustrated, center-bound physical five-chapter book with the existing flexible paper and character/scene animations. The original handwritten letter becomes printed visual content **inside** selected existing illustrated paper faces. It does not replace the artwork or reimplement animation as text slides.

The current app has two routes: the default `birthday` edition and `?story=letter`. Continue to preserve `#gift=` links and chapter URLs. Existing `src/data/letterStory.ts` is a *curated typed transcript*, not the author's authentic pen strokes.

## Tracking and order

- [#30](https://github.com/why152/storybook-3d/issues/30) overall epic
- [#31](https://github.com/why152/storybook-3d/issues/31) P0 cover opening/closing bug (first implementation here)
- [#32](https://github.com/why152/storybook-3d/issues/32) paper performance and real WebKit measurement
- [#33](https://github.com/why152/storybook-3d/issues/33) private authentic handwriting source map
- [#34](https://github.com/why152/storybook-3d/issues/34) render original ink on correct left/right flexible paper face
- [#35](https://github.com/why152/storybook-3d/issues/35) end-to-end visual and device release acceptance
- [#26](https://github.com/why152/storybook-3d/issues/26) existing user-reported visual blocker

**Release rule:** Do not merge or deploy before owner sees and approves actual motion; CI green does not establish artistic quality or actual iPhone GPU performance.

## Current architecture worth preserving

| Responsibility | Source |
| --- | --- |
| Stateful front/back book, cover/leaf turns, pointer dragging and GSAP | `src/components/Book.tsx` |
| Segment-mesh flexible paper transform | `src/components/paperGeometry.ts` |
| Print capture and two-sided texture lifecycle | `src/components/paperPrint.ts` |
| Original illustrated SVG layers and live actor sprites | `src/components/SceneArt.tsx`, `public/assets/{hello,grow,together,dream,wish}/` |
| Edition/story navigation | `src/data/story.ts`, `src/App.tsx` |
| Typed temporary letter / source notes | `src/data/letterStory.ts`, `docs/LETTER_4569_SOURCE.md` |
| Stage layout | `src/styles.css`, `src/styles.v2.css` |

### Cover repair hypothesis (requires visual confirmation)

In the previous `Book.tsx` cover opening from position 0 mounted `BlankPage` for the left static half, and `styles.css` hid it until the cover completed. On closing it also replaced the left chapter with a blank. The current branch changes only the *static first-chapter underlay*: keep HELLO mounted, clip it from the central binding according to cover progress, preserve moving cover/front/back and the interior curved-page engine. Tests compare the real DOM/content at fixed poses and complete forward/reverse trips. This is a **candidate** fix until browser screenshots and the user's reported symptom are checked.

## Handwriting integration contract

Source named in the existing private project: `why152/envelope-mvp/reference/4569.mp4` (non-birthday), **not** `4568.mp4`. This source is private; the storybook repository is public.

1. Select authentic complete source frames and define exact crop boxes with a private source-to-fragment manifest.
2. Make optimized visual fragments retaining the original handwriting, punctuation, signature and reading order. Do not synthesize or guess missing strokes.
3. Define typed chapter/page-side layout coordinates, with optional *separate* accessible transcript.
4. Extend scene printing so handwriting is included in `capturePaperPrint` / the two-sided deforming surface, **not** just static HTML on the page.
5. Keep original scene animation and SVGs; reject designs where a giant opaque letter card obscures the illustration.
6. Validate letter fragments on stationary spreads and 0/25/50/75/100% turn poses in both directions.
7. Keep source video, unpublished private text and recognizably authored writing out of public Git history until authorization for public display is verified.

## Performance work (after cover smoke tests)

Profile before changing renderer: paper capture/PNG encodes and decodes, object URL cleanup, dynamic segment count, GSAP frame path, image decode and filters. Compare actual measured input latency, frame times, leaks and WebKit visuals. Optimize without downgrading to rigid card flips.

## Verification and deployment

Run `npm run test:actors`, `npm run test:assets`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e`; collect Chromium/WebKit reports and real iPhone Safari recordings. Before release, inspect the actual mobile cover opening and letter/illustration balance side by side with existing production. Public `main` stays untouched until explicit review.
