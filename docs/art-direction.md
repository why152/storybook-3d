# Illustration system — bound 3D book

## Creative direction

Original birthday-themed illustrated journey:
COVER → HELLO → GROW → TOGETHER → DREAM → WISH.

Five interior chapters are distinct 1200×700 landscape **double-page
compositions**. Every scene is read in **two facing physical book pages**;
important faces, handwritten title details and customizable text should
avoid the central 5% gutter.

Our craft inspiration is the editorial quality of
https://howtotalktowhitekidsaboutracism.com/, **not its licensed assets
or card-flip geometry**. The target product is a physically hinged book.

## Current original scenes

| Scene | Palette / story | Illustration files |
|---|---|---|
| HELLO | Coral town, two characters greeting | `public/assets/hello/` |
| GROW | Green forest, watering a plant | `public/assets/grow/` |
| TOGETHER | Peach seashore, friends sharing tea | `public/assets/together/` |
| DREAM | Indigo night sky, stargazing / paper boat | `public/assets/dream/` |
| WISH | Rose-colored celebration, gifts and cake | `public/assets/wish/` |

Each asset directory holds these **six independent original SVG planes**:
`background.svg`, `midground.svg`, `lettering.svg`,
`characters.svg`, `foreground.svg`, `effects.svg`.
All art shares the exact same 1200×700 `viewBox`, including transparent
unoccupied regions. Editing a layer must never crop or rescale its artboard.

The active renderer is `src/components/SceneArt.tsx`; do not put SVG
inline in `src/App.tsx`. Data/text lives in `src/data/story.ts`;
name and wish are accessible HTML, never baked into SVG.

## Layer preview

Run Vite and open `/art-inspector.html?scene=hello` to inspect all
six planes with an independent angle, fan-out control and visibility toggles.
Use `scene=grow`, `together`, `dream`, or `wish` for the other sets.

For integrated book screenshots use `/?scene=hello` etc. For the actual
rigid half-page rotation use `/?pose=0.25&from=grow`, and compare all
0/25/50/75/100% poses in Playwright.

## Remaining creative work

These illustrations are vector originals, not borrowed copyrighted
site art. They are still an early candidate: character illustration,
motion timing, brush grain, typographic art direction, lighting and
the realism of the binding require further polish. Passing build/test
is not a claim of matching the reference's expert visual art.
