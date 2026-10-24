# Visual fidelity target — reference video review (2026-10-25)

## Correction to our earlier interpretation
The provided ~30-second reference is **not** primarily a physical paper book with curling leaves and visible page stacks. The dominant visual is a **single rounded-rectangle illustration card**, floating in a nearly black textured stage, that rotates in 3D about a vertical axis to transition between editorial spreads. Some moments involve a portrait cover.

The previous R3F demo over-emphasized generic 3D page engineering and a dashboard/editor layout; it did not reproduce the reference's composition or art direction. It remains a technical spike only.

## Frame observations
Measured approximately against 1280 × 720 frame captures supplied in the conversation:

| Element | Observed |
|---|---|
| Stage | almost black, subtle diagonal brush/noise |
| Title | tiny centered white stacked text at top |
| Main scene | landscape rounded card approximately x=250–1035, y=126–575 (roughly 1.74:1) |
| Card color | distinct saturated color by chapter; coral, botanical jade, blush |
| Lettering | intentionally oversized condensed illustrated lettering dominates the card |
| Illustration | editorial flat vector/chalk/paper-cut characters over/around lettering |
| Navigation | hand-drawn white directional arrows in side gutters |
| Progress | tiny colored dots below center card |
| Footer | barely visible branding/social text hugging the bottom |
| Motion | entire card moves edge-on in 3D, with following scene visible during turnover |
| Cover | portrait dark cover centered on the same stage |

## New visual acceptance gates
1. A desktop frame must place the rounded illustrated card in **roughly the same viewport region and scale** as the reference. The work must feel like a gallery installation, not a dashboard.
2. Character artwork, typography, palette and grain all need coherent design. Geometric placeholder people are not release art.
3. At 0 / 25 / 50 / 75 / 100% flip, the panel must visibly narrow, change face, and land on the next spread without mirrored text or ordering glitches.
4. Foreground, lettering and backgrounds must have meaningful independent depth and coordinated motion, verified at oblique angles.
5. Portrait cover introduction, arrow/dot navigation and timing should resemble the reference's interaction language.
6. At least one transition video + corresponding stills must be reviewed by the owner; passing TypeScript tests alone **does not meet the visual gate**.

## Current implementation decisions
- **CSS 3D** with a dual-sided animated leaf for the first high-fidelity proof. This is a practical response to what the reference actually shows; a complex curling-paper shader is neither necessary nor desirable by default.
- **GSAP** controls the turn. Actual editorial illustrations are new SVG drawings with depth-separated layers, not borrowed art.
- All customer-facing customization controls live in a secondary drawer instead of competing with the central art.
- Current SVG artwork is an improvement over placeholders but is still a draft. The final visual review can require art production improvements and a further rendering redesign.

## Comparison procedure
Capture the supplied reference frames locally; do not commit its copyrighted visuals as code assets. For our renderer, record the same five normalized turn poses in a desktop viewport and do side-by-side review. Report deviations in composition, silhouette, typography, character quality, perspective and shadows.
