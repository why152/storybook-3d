# Authentic handwriting — PRIVATE image preparation

The public Storybook currently uses a typed excerpt of the separate **non-birthday** original source stored in the private `why152/envelope-mvp/reference/4569.mp4`. This is **not** an authentic reproduction of the pen strokes. **Never** mix in the birthday greeting `4568.mp4`.

## Private source workflow

1. Obtain the original video from its owner as a file located **outside** the public `storybook-3d` checkout.
2. Visually identify completed letter frames and manually record natural paragraph/sentence crop rectangles. No OCR guesses; keep order and punctuation.
3. Save the private crop mapping outside the checkout, e.g. `/private/4569-map.json`. Example *placeholder values only*:

    { "sourceSha256": "", "segments": [
      {"id":"hello-left-01","chapter":"hello","side":"left",
       "timestampSeconds":0,"crop":{"x":0,"y":0,"width":1,"height":1}}
    ] }

4. Replace those placeholders with actual inspected frame coordinates; install `ffmpeg` locally and execute:

    node scripts/extract-handwriting.mjs --source /private/4569.mp4 --manifest /private/4569-map.json --output /private/4569-crops

The tool refuses to read a source inside the public repository and refuses to place cropped handwriting, full original or private source maps within this checkout. It refuses to overwrite existing outputs. It records the SHA-256 of the original source with a segment-to-frame/crop provenance map.

## Required human / editorial review

- Every resulting PNG is a **raw video pixel crop**, including the original background. Fine strokes may be lost with automatic background deletion; clean backgrounds only after careful side-by-side visual review.
- Keep natural pen strokes, original author attribution, sentence order, dates and signature. Do not invent obscured phrases or use a handwriting font.
- Review mobile readability before deciding which existing illustrated leaf gets each fragment. Do not require every leaf to contain text.
- The target Storybook repo and GitHub Pages are public, including PR branches. **Do not push identifiable handwriting or its private video until permission for public visibility has been verified.**
- When approved, integrate fragments into the existing illustrated `SceneArt` and two-sided `paperPrint` pipeline so they ride the deforming paper and preserve original scene animations.

## Verified local integration — 2026-11-02

The actual local source is now available. The current candidate extracted 12 raw PNG fragments and verified exact pixel registration against a completed frame. The extractor converts the complete frame to RGB before cropping: the original YUV420 crop defaults otherwise round odd coordinates/dimensions and can trim or shift strokes.

`src/components/Handwriting.tsx` renders native original crop images in the same `PageHalf` used by settled pages and curved front/back strips; it does not retype or synthesize the letter. `STORYBOOK_PRIVATE_INK_DIR` selects a reviewed external `layout.json` and PNG directory. A private build must use an external `--outDir`. Public CI has no private asset input. `src/data/publishedHandwriting.ts` stays empty until the owner approves the selected fragments for public use.

See `docs/validation/authentic-ink/README.md` for actual browser checks, resource measurements, reproduction and remaining release gates. No source video, private source map or original-ink screenshot has been pushed to the public repository.
