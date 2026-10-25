# Architecture — bound physical storybook (2026-10-25)

**Authoritative intent:** `AGENTS.md` supersedes earlier card-flip prototypes.

## What we are building

An original, personalized **3D bound book**, not a rotating landscape
slideshow. The object has a closed portrait cover, two visible page halves
when open, a persistent central binding and one **half-width page leaf**
that pivots around the binding. Five illustrated interior spreads are
HELLO, GROW, TOGETHER, DREAM and WISH.

## Modules

| Module | Responsibility |
|---|---|
| `src/data/story.ts` | Single typed data source for five chapters, palette, text, initial routes |
| `src/components/SceneArt.tsx` | Six original SVG illustration planes per scene; 1200×700 compositions sliced into page halves |
| `src/components/Book.tsx` | Binding geometry, stationary pages, dual-sided turning leaf, GSAP animation and pointer parallax |
| `src/App.tsx` | Navigation and sequential bookmarks, keyboard / touch, lightweight editable name and wish |
| `src/styles.css` | Actual book cover, spine, page thickness, paper faces, gallery lighting, responsive styles |
| `tests/demo.spec.ts` | Real-browser evidence: closed cover, opening, 5 chapters, 5 poses, physical reverse turn, mobile and video |

## Geometry and page ordering

Book artboard: 1200×700, aspect 12:7. Each of its two physical pages is
50% of the open spread. Artwork stays authored on one continuous artboard
and is cropped into left and right **physical paper surfaces** at the spine.

**Next chapter, right-to-left turn**:
- Underlay: current left page + next right page.
- Turning leaf starts on the right, front = current right page.
- Turning leaf back = **next left page**, correctly readable when rotated to left.
- The physical leaf is anchored at x = 50% of book with
  `transform-origin: 0 50%` and rotates from 0 to -180 degrees.
- On completion stationary book becomes next left + next right.

**Previous chapter, left-to-right turn**:
- Underlay: previous left + current right.
- Turning leaf begins on left at -180 degrees, reverse = current left.
- The same leaf rotates to 0 and reveals previous right.
- On completion book becomes previous left + previous right.

**Cover**: front cover is a real right-hand leaf. The book shifts its
center 25% to center the closed portrait cover; its first opening
animates toward the full landscape open spread, without card flipping.

## Rules for 2.5D illustration

- Every interior chapter has 6 independently editable and replaceable SVGs:
  background, midground, lettering, characters, foreground, effects.
- The interior turning sheet is a **developable curved surface**, made from
  20 joined CSS strips with separately clipped front/back prints. Reverse-side
  strips sample the artwork in reverse order so lettering remains readable.
  Only each print face clips; no ancestor flattens the 3D surface. The hard
  cover uses the same binding/timeline with a rigid board.
- Stationary open book retains per-plane pointer parallax and ambient
  decoration movement within each physical page.
- No ancestor filter or isolation may flatten the turning-leaf backface
  structure. No doubled incoming page overlay.

## Validation/acceptance

- Real Playwright screenshots at 0, 25, 50, 75 and 100 percent turn,
  with one half-width turning leaf pinned at the center binding.
- Video of opening closed cover, next page, previous page.
- Five scene artboards load from original SVG files and display across
  two pages with readable titles (no mirrored letters).
- Reduced-motion, touch, keyboard and recipient/wish customization.
- Visual review is mandatory in addition to CI. The original reference
  work remains substantially more polished artistically.

## Out of scope

Back-end, payments, accounts, uploaded files, public sharing, AI-generated
customer image pipeline, actual page-curl shaders. The current leaf conserves length along a
segmented cylindrical surface; corner folds, elastic creases and physically
projected shadows remain outside this implementation.

## Integrated flexible paper

`Book.tsx` still owns the single physical leaf and cancellable GSAP timeline.
`paperGeometry.ts` integrates constant-length strip tangents; the first point
is the spine and the entire sheet stays above the underlays. A single 4000px
perspective replaces the old compounded cameras. Paper faces reuse `PageHalf`;
there is no parallel bitmap typography/texture renderer. At the beginning of
a turn, surviving static pages supply computed actor transforms and animation
times to the whole turning print. On landing both halves resume at the same
animation phase. Incoming images decode before the timeline runs. Reduced
motion settles before the next paint. See `docs/flexible-paper.md` for evidence.
