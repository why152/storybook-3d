# Roadmap — BOOK FIRST (2026-10-25)

The previous whole-card 3D rotation prototype is retired. Read
`AGENTS.md` for the hard product contract.

### Stage 1 — recognizable bound storybook
- Closed portrait cover, page edges, central binding.
- Two distinct stationary physical pages and one half-width leaf flipping
  around their joint. Correct front/back content and reversed navigation.
- Authored artwork split across a two-page spread without duplicate overlays.

### Stage 2 — five demo illustrated spreads
- HELLO, GROW, TOGETHER, DREAM and WISH.
- Each spread has six independent original SVG files on a common artboard.
- Content metadata in `src/data/story.ts`, renderer not hardcoded to chapters.

### Stage 3 — viewer-ready interaction
- Sequenced bookmark navigation turns each intermediate physical page.
- Accessible arrow and keyboard navigation, mobile swipes, reduced motion.
- Recipient and wish editor affects last page without redoing engine.

### Stage 4 — evidence and polish
- CI: lint, typecheck, Vite build, Playwright behavior.
- Authentic screenshots at 0/25/50/75/100% of a book leaf, all 5
  illustrated spreads, mobile cover and open book.
- Authentic browser video of opening + one next + one previous turn.
- Visual comparison to the inspiration site with explicit remaining gaps:
  the site is a craft benchmark, not a card geometry specification.
- Owner visual approval before merging Draft PR #9.

### Future, not part of demo

Character-specific pose animation, paper mesh bending, richer parallax
shader, content templates/admin UI, safe upload pipeline, deployment,
payments, customer accounts and shareable published books.
