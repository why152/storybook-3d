# Reference and project acceptance (book-first correction, 2026-10-25)

## Distinguish reference aesthetics from our product geometry

Reference inspiration: https://howtotalktowhitekidsaboutracism.com/.
Its editorial artwork, character staging, handmade typography, rich animated
depth and framing set a high **visual craft** bar.

The supplied ~30s reference footage prominently shows a rotating editorial
**card-like** stage. That observation is historically accurate, but it is
**not our product requirement**. The owner explicitly corrected the target:
**our demo must be a 3D bound BOOK whose physical right-hand page turns over
the central spine**, not a whole-spread flip card.

No agent should reinstate a landscape card-turn engine in pursuit of closer
reference-video motion. `AGENTS.md` is the source of truth.

## Visual features to borrow, not copy

- Dark minimal gallery environment that does not distract from the book.
- Warm expressive original vector illustrations; refined character gestures.
- Generous large display typography that interacts with art.
- Clear color palette per chapter and restrained printed-paper texture.
- Layer composition, subtle shadow and movement; original artwork only.

## Non-negotiable book visual gates

1. Portrait **closed cover** appears centered before opening.
2. Open **two-page landscape spread** with visible middle binding and page edges.
3. Forward flip: **right half-width leaf** pivots around book center to left.
4. Reverse flip: leaf pivots from left to right; page order remains correct.
5. Cover-opening transition unfolds paper stack, without large unexplained
   blank paper appearing in advance of the spine opening.
6. At 0%, 25%, 50%, 75%, 100% of turning: one hinged half-width leaf,
   distinct front/back artwork, correct stationary left/right pages, no
   mirrored letters, ghost overlay, clipping shards or inherited 180° transforms.
7. Five complete interior original spreads + cover: HELLO, GROW,
   TOGETHER, DREAM, WISH; readable Chinese personalizable last page.
8. Mobile legibility, reduced motion, keyboard and touch.
9. CI + **authentic browser video** and human review. Green tests
   do not mean art-direction sign-off.

## Authoring method

All five scenes use original 1200×700 artwork authored as a complete
landscape spread with six editable SVG planes. Renderer splits each scene
at the central binding; don't make 10 separate misaligned assets or
flatten to one PNG. The cover is its own portrait surface.

## Out of scope for current demo

Deformable page-curl mesh / WebGL paper shader, accounts, backend, payment,
customer uploads and published-share links.

## Meaningful review questions

- Does it read unmistakably as a book rather than a panel carousel?
- Is the page turning around the **binding**, not its own center?
- Do illustrations make sense across the center split and stay registered?
- Does the completed leaf become stable readable left/right paper surfaces?
- How far is the art quality from the original reference's specialist craft?
