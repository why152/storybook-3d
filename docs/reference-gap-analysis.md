# Reference gap review — 2026-10-25

## Sources and scope

- Original live project: https://howtotalktowhitekidsaboutracism.com/
- Original author's case study: https://www.hellomonday.com/work/how-to-talk-to-white-kids-about-racism
- Secondary agency case study: https://www.dept.global/case/how-to-talk-to-white-kids-about-racism/
- Our baseline: `main` merge `eff4b60` from PR #9; five-chapter
  illustration book, React+CSS 3D+GSAP, real browser tests in
  https://github.com/why152/storybook-3d/actions/runs/40124556778.

**Important difference in intended output:** the reference site presents a
handcrafted editorial faux-2.5D flipbook; the user explicitly wants a
**physical two-page book with a hinged central spine**. The original site is a
benchmark for *craft*, not a mandate to clone its page geometry, copy its
educational content, or undo the approved book-first architecture.

## What the reference actually claims

The official agency case study explicitly describes a **custom WebGL parallax
shader** capable of displacing individual per-page illustrations in a
**single draw call**. It also credits professional UI/UX, concept,
illustration, copywriting and development work. The public site carries
a narrative around educating oneself, privilege, diversifying heroes,
friendships, responsibility, action and challenging intolerance, and includes
links to additional resources.

We do **not** possess the original unpublished code or a reliable performance
trace. Claims about their exact FPS, implementation classes, CMS, number of
internal layers per scene, or production workflow would be speculation.

## Gap matrix

| Category | Verified original | Our current demo | Gap | Priority |
| --- | --- | --- | --- | --- |
| Bound-book geometry | Faux-2.5D flipbook experience | Physical two-page spine and half-leaf turns | Intentionally **different** | Preserve |
| Illustration | Editorial artwork with bespoke characters/scenes | 5 original vector stories, 30 source SVG planes | Characters, detail and print texture less refined | P1 |
| Distinct typographic direction | Scene-specific illustrated display lettering | Distressed SVG words + accessible Chinese HTML copy | Better scene-specific letter silhouettes, balanced composition needed | P1 |
| Depth/parallax | WebGL shader displaces illustration elements | Mouse-controlled differential flat SVG plane offsets | Lacks nonlinear depth and per-object responsiveness | P2 |
| Character acting | Illustrations/scene movement integrated | Mostly decorative particle float | Needs independent gestures and story beats | P1 |
| Page dynamics | Hand-authored transitions | Hinge rigid half-sheet, GSAP | Introduce convincing paper bend / directional light if possible | P2 |
| Mobile readability | Responsive interactive project | Book works in Playwright; printed text extremely small on 390px devices | Make entire narrative readable outside miniature page | P0/P1 |
| Narrative | Structured educational progression and links | 5 linear birthday chapters + customizable last note | More varied per-chapter interactive moments | P2 |
| Performance | Single-draw-call shader stated; no public FPS | Multiple SVG planes per physical half and GSAP | Measure actual paint, layout and memory before adding shader | P2 |
| Product features | Purpose-built web experience | Customizable name/wish with basic drawer | Better preview UX, no deploy/share pipeline yet | P2 |

## Concrete next experiments and acceptance

1. **Baseline integrity (do now):** use a 5-scene `test:assets`
   validator in CI for manifest, SVG coordinate system and safety.
   Keep `main` on one book engine and one canonical data model.
2. **Readable mobile story (do now):** separate full-size 12–15px
   narration below the actual small two-page drawing. Book itself must
   retain its proportions; 390×844 real-browser screenshot/DOM test.
3. **Character acting:** each chapter's `characters.svg` currently
   combines rabbit and fox. Split to independent character/material
   sprites, animate motion paths, gestures and easing, and review
   a full real 8–12-second video. Preserve original copyright.
4. **Paper movement:** prototype subtle shape/hinge lighting under
   forward and reverse turn; don't reintroduce a whole landscape
   flip-card. Screenshot 0/25/50/75/100 and compare side-on continuity.
5. **Shader/parallax evaluation:** small isolated WebGL experiment
   only if a visible improvement survives real mobile FPS/CPU checks;
   keep fallback CSS page physics.
6. **Visual QA protocol:** evaluate artwork density, type, color,
   spine seam, border, character consistency and legibility; owner
   decides when to replace current illustrations wholesale.

### Release gates

- Typecheck, ESLint, asset contract, Vite production build and Playwright
  desktop/mobile all pass.
- Video from real Chromium shows **opening + next + previous**, with no
  clipped scene planes, phantom book cover or inherited transforms.
- Future "fidelity" estimates must state their rubric; don't invent
  a pseudo-scientific similarity percentage. A passing CI build is not
  sufficient for visual craft approval.
