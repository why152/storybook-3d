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
- Three depth-separated illustration/text layers and small ambient animations.
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

- `src/App.tsx`: exhibition/turnover controller, original vector illustrations, scene content and editor drawer. This deliberately starts as one fast-to-review vertical slice and should be split into typed data and reusable artwork components once fidelity is approved.
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

The visual art master has six **independent** source files in
`public/assets/hello/`: background, midground, lettering, characters,
foreground and effects (SVG, aligned 1200×700). The material is original
vector artwork, not an AI-generated collage or transparent PNG export.

To inspect the layers one by one, open this URL after `npm run dev`:

**http://localhost:5173/assets/hello/preview.html**

The built-in inspector lets you rotate the page, fan out the depth layers,
turn each one on/off, and reset to the original composite.

For static flipbook states, open `http://localhost:5173/?pose=0.5` and try
values `0`, `0.25`, `0.5`, `0.75`, and `1`.

The SVGs demonstrate real independent artwork and depth control, but the
hand-painted refinement and detailed animation of the original reference
remain a separate quality gate; they are not yet 1:1.
