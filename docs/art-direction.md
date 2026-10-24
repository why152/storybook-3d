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
