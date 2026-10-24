# Agent contract — physically paged 3D storybook

> **Owner correction (2026-10-25): THIS IS A BOOK, NOT A FLIP-CARD GALLERY.**
> This goal supersedes the prior "single editorial rotating art card" interpretation.
> All agents, Codex sessions and contributors must honor it before changing code.

## Product goal

Build a **beautiful, presentable, personalized 3D illustrated BOOK demo**.
The central object is a bound open book: a visible central spine/gutter,
**two distinct pages**, and one page physically flipping **from right to left**
(or left to right when going backward) around that shared spine.

A whole landscape image rotating about its own center is **NOT** an acceptable
substitute. It is the bug we are deliberately retiring.

The reference https://howtotalktowhitekidsaboutracism.com/ provides a standard
of editorial art, dramatic lettering, parallax and choreography, **not** permission
to copy assets and **not** a reason to replace book geometry with rotating cards.

## Hard visual and behavioral requirements

1. The closed book has a recognizable portrait **front cover**, spine and page edges.
   Opening it reveals a **landscape two-page spread**.
2. Every interior spread has an explicit **left page**, **right page**, central
   **gutter/spine**, page thickness/stack hints, and stable underlying pages.
3. Next: only the **right leaf** rotates around the **center binding** to the left.
   Previous reverses the exact same physical page motion.
   The turning leaf has distinct front/back artwork; typography may never mirror.
4. **No teleporting / ghosting**: at 0/25/50/75/100% of a turn, there must be one
   rotating leaf, correct page stacking, visible opposite page, and no leftover
   180-degree transform on the settled book. Opening/closing cover follows
   these same book-bound rules.
5. Target demo: **five original interior illustrated spreads** plus front cover:
   HELLO → GROW → TOGETHER → DREAM → WISH. Each is one two-page spread, not
   a single card. This is a demo; do not build a backend or storefront.
6. Art stays **original and layered**. The 1200×700 original SVG compositions
   can span an open spread and are sliced at the binding *only by the renderer*;
   maintain separate background, midground, lettering, characters, foreground,
   effects assets (six per chapter) where possible.
7. Preserve working name/message customization, arrows, keyboard and touch.
   Reduced-motion users should see an immediate coherent page state.
8. Treat footage of an authentic browser book turn and side-by-side poses as
   mandatory acceptance evidence; "build green" alone is not visual approval.

## Architecture rules

- Data: a single typed `src/data/story.ts` chapter model. No scene metadata
  duplicated in controls, components, and tests.
- Renderer: `src/components/Book.tsx` owns spine geometry, page halves,
  page flip animation and input lock; `src/components/SceneArt.tsx` owns asset
  planes and the cover. `src/App.tsx` stays thin (navigation + customization).
- CSS: keep only selectors actually used by the active book engine. Remove
  obsolete rotating-card classes, copied overlays, unused components, debug
  experiments and unnecessary dependencies.
- Keep React + TypeScript + CSS 3D + GSAP unless measured visual evidence
  justifies WebGL. Do not make an unnecessary shader rewrite in the demo.
- React elements for turning and settled leaves require distinct keys/identity
  so GSAP transforms cannot leak across states.
- Do not flatten a whole `preserve-3d` tree with ancestor filters or overflow;
  only clip individual page surface imagery where needed.

## Source-of-truth and workflow

1. Read this file, `README.md`, `docs/architecture.md`, `docs/roadmap.md`
   before implementing. If an older document calls the project a *flip-card*,
   this AGENTS contract wins.
2. Work on Draft PR #9 or a directly linked focused PR. Keep `main` untouched
   until user visual approval; never merge just because CI passed.
3. Original/appropriately licensed work only; do not copy reference artwork,
   code, protected fonts or third-party proprietary assets.
4. Run ESLint, TypeScript, Vite build and Playwright desktop + mobile checks.
   Export real screenshots and a video of **opening the cover** and a
   **forward/backward two-page book turn**, including 0/25/50/75/100% poses.
5. Report concrete observed defects and remaining artistic differences.
   Never present moodboards or static mockups as tested 3D output.
6. No real customer uploads, credentials, backend, payments or database.
   Keep accessibility, swipe/keyboard controls and reduced-motion support.

## Definition of done for this reboot

- **The object is unmistakably a book.** Two page halves and central binding
  remain visible throughout turn; only one page flips around the spine.
- Five original interior spreads are browsable forward and backward, with cover.
- No mirrored backface, jumping layout, twin-page ghost, clipping shards or
  invisible settled page.
- The structure is small, typed, modular and not burdened with abandoned
  flip-card implementations.
- Authentic browser video and screenshots inspected; CI passing, user visual
  feedback still required before merging.
