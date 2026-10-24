# Storybook 3D — A Little Story

**Work in progress · Draft PR #9 · user visual sign-off required**

An original, personalized **physical 3D illustrated storybook demo**.
This is a **book**, not a rotating card. A centered binding joins two
visible pages. Each page turn moves one **right-hand half-width paper leaf**
to the left; reverse navigation turns it back. A portrait cover opens
into a landscape two-page book.

The reference https://howtotalktowhitekidsaboutracism.com/ is an
inspiration for **editorial illustration and art direction**, not for
book physics, and its proprietary artwork is not included.

## Five illustrated chapter spreads

| Chapter | Story | Source art |
|---|---|---|
| HELLO | Meeting and greeting in a village | `public/assets/hello/` |
| GROW | Two friends nurturing new growth | `public/assets/grow/` |
| TOGETHER | Two friends at a warm seaside pier | `public/assets/together/` |
| DREAM | A night of shared stargazing and travel | `public/assets/dream/` |
| WISH | Birthday celebration with cake and gifts | `public/assets/wish/` |

Each interior spread uses **six independent original SVG image planes**
(30 source files total): background, midground, lettering, characters,
foreground and effects, all in a common 1200×700 coordinate system.
The renderer cuts the full-spread illustration into two physically
independent page halves at the binding without flattening source art.

## Development

Node.js 22+.

```bash
npm install
npm run dev
npm run test:assets
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Vite normally serves at http://localhost:5173.

Keyboard Left/Right, hand-drawn arrows, page progress dots and
touch swipes flip the book. Selecting a distant chapter turns through
each intervening leaf. CUSTOMIZE edits the final page's name and wish.

## Inspect

- Closed cover: `/`
- Open chapter: `/?scene=hello`, `/?scene=grow`,
  `/?scene=together`, `/?scene=dream`, `/?scene=wish`
- Physical turn keyframes: `/?pose=0&from=grow`,
  `/?pose=0.25&from=grow`, `/?pose=0.5&from=grow`,
  `/?pose=0.75&from=grow`, `/?pose=1&from=grow`
- Independent layer inspector:
  `/art-inspector.html?scene=hello` (works for all chapters)

Playwright uploads browser screenshots and the real recorded
cover/page-turn WebM to the GitHub Actions artifact, if tests pass.
Passing CI is not proof of artistic equivalence.

## Source

- `AGENTS.md`: **authoritative book-first goal and AI-first full-rewrite policy**
- `src/data/story.ts`: chapter data and routing
- `src/components/Book.tsx`: bound book and GSAP leaf mechanics
- `src/components/SceneArt.tsx`: original artwork, cover, page half
- `src/App.tsx`: accessible input and customization
- `src/styles.css`: open book and paper stage styling
- `docs/architecture.md`: physical page order explained
- `docs/reference-gap-analysis.md`: official source-backed craft comparison and ordered improvements

## Known limitations

Leaf is rigid paper with cover/pages and shadows, not a smoothly
deformable page curl. Illustration is original and still needs
professional art refinement, scene-specific character acting and
performance profiling. No back end, payments, accounts or customer
file uploads. **Draft PR #9 remains unmerged pending review.**

## AI-first engineering and project tracking

This is an AI-led implementation. **Large refactors, wholesale replacement of
bad ideas and deletion of obsolete assets are explicitly welcome.** We favor
high-iteration experimentation and final visual quality over minimizing changed
lines. Each chosen version still needs test evidence and a reversible Git PR.
See `AGENTS.md` (authoritative).

Project plan and status: [Notion — Storybook 3D](https://app.notion.com/p/403d0befadbd81cbaba2e9061105d171), with a dedicated task database.
Mobile readers can read the full chapter text in a legible caption below the
small physical book; the double-page geometry remains unchanged.
