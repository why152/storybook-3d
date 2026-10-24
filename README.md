# Storybook 3D — illustrated interactive experience

**Private work-in-progress. Not yet visually accepted.**

An original, personalized illustrated flip-card story inspired by the *interaction language* of a reference video: dark immersive stage, one central rounded editorial spread, dramatic typography, chalk/paper grain, hand-drawn navigation and a reversible vertical-axis 3D turnover.

## Why it was rebuilt

The initial React Three Fiber implementation proved only that the package installed and a few texture planes could rotate. It looked **nothing like the reference** and was rejected after visual review. That attempt is preserved in branch `feat/interactive-demo-foundation` and Draft PR #7. The new design lives in `feat/reference-stage-rebuild` / Draft PR #9.

The supplied video reads more like an editorial 2.5D rotating art card than a realistic physically curled book. Therefore the new spike intentionally uses CSS 3D + GSAP rather than shoehorning Three.js into the solution. This technical choice remains revisable if actual visual comparison exposes a limitation.

## Features in this visual iteration

- Dark fullscreen gallery/stage, small masthead, colored progress markers, directional doodle arrows.
- Portrait cover and three original landscape illustrated pages.
- Double-sided 3D card on Y-axis with reversible GSAP turnover.
- Six independent original SVG planes for each of HELLO, GROW and WISH (18 illustration assets), plus staggered GSAP entrances, depth-aware mouse parallax, ambient effects and turn shading.
- Original SVG illustrations (no borrowed original artwork).
- Customizable recipient name and wish in a secondary drawer.
- Keyboard left/right and simple touch swipe navigation, reduced-motion behavior.
- Playwright desktop/mobile smoke tests and screenshots.

## Run

Node.js 22+ recommended.

```bash
npm install
npm run dev
```

Vite prints the local URL, typically http://localhost:5173.

```bash
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Tests save screenshots under `test-results/` and the CI workflow uploads an artifact. Build passing is **not** proof of visual fidelity.

## Proposed architecture

- `src/App.tsx`: exhibition/turnover controller, file-based 6-plane art renderer, animated scene arrivals, motion choreography, scene content and editor drawer. This deliberately starts as one fast-to-review vertical slice and should be split into typed data and reusable artwork components once fidelity is approved.
- `src/styles.css`: full-screen art direction, paper texture, depth layering, responsive rules.
- `tests/demo.spec.ts`: visual-frame capture and interaction coverage.
- `docs/reference-fidelity.md`: measured reference composition and acceptance plan.
- `docs/art-direction.md`: original layered art pipeline proposal.
- `docs/roadmap.md`: product milestones (to be revised after the visual gate).

## Acceptance policy

Owner-approved side-by-side video/frame review is a **blocker**. Current iteration is another candidate, not an accepted match. Do not merge #9 before desktop turn and mobile screenshots have been inspected and the owner is satisfied.

## Scope boundary

No order processing, customer accounts, DB, payments, commercial deployment, AI-created dynamic illustration system or production file uploading until the visual proof-of-concept is accepted.

## Intellectual property

The reference is used as a style of interaction to learn from, not a source of copyable artwork or code. The demo content and SVG illustrations are original.


## First production-structured illustration: HELLO

All **three chapters** now contain six **independent** original source files each under
`public/assets/{hello,grow,wish}/`: background, midground, lettering,
characters, foreground and effects (18 aligned SVG files, 1200×700). The material is original
vector artwork, not an AI-generated collage or transparent PNG export.

To inspect any scene's six layers one by one, open this URL after `npm run dev`:

**http://localhost:5173/art-inspector.html?scene=hello**

Use `?scene=grow` or `?scene=wish` to inspect the other original illustration sets.
The legacy HELLO-specific inspector remains at `/assets/hello/preview.html`.

The built-in inspector lets you rotate the page, fan out the depth layers,
turn each one on/off, and reset to the original composite.

For static flipbook states, open `http://localhost:5173/?pose=0.5` and try
values `0`, `0.25`, `0.5`, `0.75`, and `1`.

The SVGs demonstrate real independent artwork and depth control, but the
hand-painted refinement and detailed animation of the original reference
remain a separate quality gate; they are not yet 1:1.

## Scene motion and reproducible previews

- Each chapter uses a 6-plane 1200×700 original vector material set plus `manifest.json`.
- When a 3D leaf settles, GSAP staggers the midground, typography, characters and foreground into view while preserving their independent Z values.
- Mouse movement adds subtle depth-scaled parallax when the leaf is settled; moving out of the book resets it. Ambient motifs float independently.
- An overlay shade peaks at mid-turn and fades as the leaf lands; reduced-motion users skip or shorten motion.
- Open `/?scene=hello`, `/?scene=grow`, or `/?scene=wish` for deterministic chapter compositions; use `/?pose=0.25` etc. for deterministic flip angles.
- UI smoke tests inspect real browser renderings and SVG completeness. A successful build is **not** a substitute for approving the visual direction against the reference project.

The illustrations are original vector assets inspired by the **interaction format**, not copied from `howtotalktowhitekidsaboutracism.com`. This remains a design prototype rather than a finished, commercial-grade parallax shader implementation.
