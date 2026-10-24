# Art direction and asset pipeline

## Visual target
An illustrated storybook with a dark stage/background, vivid editorial compositions, recognizable page-to-page changes, layered parallax and restrained but expressive transitions. The reference video guides *interaction quality*, not asset copying.

## Demo concept (provisional)
A short, original birthday-themed story: cover → chance encounter → a shared moment → a final wish. This is replaceable and should not block building the rendering proof of concept.

## Visual style decision
Initial candidate: geometric paper-cut/editorial illustration with warm muted peach, amber, teal and navy accents. Keep figures and backgrounds simple enough to split into depth layers. Do not generate final assets until a single style master is approved.

## Rendering contract
- Logical design canvas: 1920 × 1080 (16:9) for interior pages; distinguish cover ratio if needed.
- Typical per-scene exports: `background.webp` (opaque), `character.png` (alpha), `foreground.png` (alpha), `effects.png` (alpha).
- All full-canvas layers use consistent canvas bounds. Alternatively use a sprite atlas with documented per-element bounds.
- Never bake customizable names or messages into artwork.
- Text uses an explicit region, alignment, type scale, contrast and maximum line count.
- Keep 5–10% safe margins for readable copy; verify mobile layout.
- Name files by story/page/role, e.g. `public/assets/demo/p02/character.png`.
- Add metadata for license/source, dimensions, crop bounding box, anchor and intended depth if needed.

## Recommended generation process
1. Produce one **style master** for approval.
2. Create stable recurring character sheets to establish proportions, clothes and palette.
3. Generate scene art without embedded lettering.
4. Derive compatible layered assets and inspect their transparency/edges on dark and light backgrounds.
5. Verify composition against the page-turn at multiple angles; refine assets for parallax.
6. Export web-optimized files; preserve full-quality masters outside git if huge.

## Demo scenes
- Cover: central illustrated gift/book, bold shape design and a clear open action.
- Scene 1: first meeting; minimum three parallax depths and an entry animation.
- Scene 2: starry or city evening; two moving decorative elements.
- Scene 3: final wish; gift reveal/confetti and replaceable greeting.

## Acceptance criteria
- Distinct depth is visible at oblique angles, not just flat images pasted onto planes.
- Character identity and palette remain consistent across pages.
- No unintended cutout halos, mirrored text, clipped important subjects, or illegible copy.
- Asset sizes and combined GPU usage documented after integration.


## HELLO scene — actual layered asset delivery (2026-10-25)

The first complete file-based illustration scene now lives at
`public/assets/hello/` and uses **six independent SVG layers**, not a
flattened infographic image. Each is a real vector file with the same
`1200 × 700` viewport; the underlying background is opaque and the other
five artworks have transparent outer regions.

| File | Local page Z | Function |
|---|---:|---|
| `background.svg` | 0 | Sunset sky, distant town, hills |
| `midground.svg` | 11 | Branches, architectural facades, lamps and footbridge |
| `lettering.svg` | 27 | Oversized distressed *HELLO* display letters |
| `characters.svg` | 48 | Rabbit and fox interacting with the word |
| `foreground.svg` | 68 | Plants and flowers framing the scene |
| `effects.svg` | 78 | Floating petals, stars and butterflies |

Full metadata: [HELLO layer manifest](../public/assets/hello/manifest.json).
The file-based renderer lives in `HelloArtwork()` in `src/App.tsx`,
with each Z depth and optional motion defined in `src/styles.css`.

### Distinction between assets and moodboards

Earlier generated images in the conversation were **composite concept boards**.
They are **not** transparent PNG exports, and we have **not** inserted
them into the application. These SVG files are the usable layered assets.
The art is a deliberately original, editable vector interpretation;
it is still below the supplied reference's hand-painted sophistication.

### Remaining visual QA

- Open the page in desktop Chrome and validate the six images actually load.
- Capture still frames at 0, 25, 50, 75, and 100% turnover.
- Inspect characters' outlines, intentional overlaps, layered z-depth, and
  clipping at oblique angles. Revise if any SVG is cropped unexpectedly.
- Check desktop / mobile readability and CPU usage.
- Only after user approves the master scene, extend the system to other pages.

### Production guidance

Do **not** bake the recipient's name/wish into `lettering.svg`. The
decorative word HELLO is a fixed page illustration; customer copy stays
in accessible HTML. Real customer-provided image uploads are not part
of this work.
