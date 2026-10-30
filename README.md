# Storybook 3D — A Little Story

**Work in progress · book-first baseline merged into main (PR #9) · ongoing AI-first quality upgrades**

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

Across **all five chapters**, the original combined `characters.svg`
stays intact, while stationary book pages render **14 independently
registered transparent character/prop SVG sprites** (rabbit, fox and
scene-specific objects) with restrained, story-specific choreography. Motion pauses during page turns and for reduced-motion
users. See `docs/character-acting.md`; this is early character acting, not
finished limb animation.


## Development

Node.js 22+.

```bash
npm ci
npm run dev
npm run test:assets
npm run test:actors
npm run lint
npm run typecheck
npm run build
npx playwright install chromium webkit
npm run test:e2e
STORYBOOK_TEST_BROWSER=webkit npm run test:e2e
```

Vite normally serves at http://localhost:5173.

Keyboard Left/Right, hand-drawn arrows, page progress dots and
touch swipes flip the book. Selecting a distant chapter turns through
each intervening leaf. CUSTOMIZE edits the final page's name and wish. The CUSTOMIZE drawer also creates a
shareable #gift= link: names and greetings survive refresh and reopening,
including non-ASCII text, without an account or backend. Recipients begin at
the portrait cover. A link encodes readable content, not encrypted/private
storage; anyone with it can decode the greeting. Share links rely on keeping
the hosting URL alive; they are not persistent database records.
See [docs/shareable-links.md](docs/shareable-links.md).

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

The deployed baseline uses rigid leaves. This local branch is developing
flexible interior paper in [Draft PR #20](https://github.com/why152/storybook-3d/pull/20);
it has not passed full browser and visual acceptance. See
[experiment results and remaining gates](docs/flexible-paper.md).
Illustration is original and still needs
professional art refinement, scene-specific character acting and
performance profiling. No back end, payments, accounts or customer
file uploads. **PR #9 was owner-approved and merged on 2026-10-25; artistic polish and future deployments still require separate validation.**

## Local clone, QA and cost-controlled Codex handoff

**Start with [docs/LOCAL_CLONE_AND_CODEX.md](docs/LOCAL_CLONE_AND_CODEX.md).**
It covers an exact local walkthrough, official book geometry, experimental
Shader Lab branches, evidence paths and strict user-approved premium-model
escalation rules.

```bash
nvm use 22
npm ci --no-audit --no-fund
npm run qa:browser:setup
npm run qa:local
```

After the full check, open `test-results/review.html` locally. This is an
offline, searchable index of actual Playwright screenshots and WebM recordings.
The additional `test-results/qa-readiness.json` and `.md` capture aligned
five-scene image decode, book-spine registration, overflow and **software
Chromium** animation-frame observations across desktop and mobile viewports.
Those values are *not* proof of real-phone GPU FPS or battery life.

To save time while iterating, `npm run qa:baseline` refreshes this
two-viewport/five-chapter audit and `npm run qa:gallery` rebuilds the review
index. New browser tests use Chrome's actual touch input, not just simulated
keyboard navigation. The expensive Codex model should only tackle a
reproducible high-impact issue after two truly attempted lower-cost fixes.

**Reproducibility:** `package-lock.json` is committed. Use `npm ci` to install
the locked dependency versions locally and in hosting builds.

## AWS preview deployment

The selected host is the existing Tokyo EC2 and its Caddy static file server.
See [deployment instructions](docs/AWS_DEPLOYMENT.md) for production browser
checks, independent releases, HTTPS and rollback.

## AI-first engineering and project tracking

This is an AI-led implementation. **Large refactors, wholesale replacement of
bad ideas and deletion of obsolete assets are explicitly welcome.** We favor
high-iteration experimentation and final visual quality over minimizing changed
lines. Each chosen version still needs test evidence and a reversible Git PR.
See `AGENTS.md` (authoritative).

Project plan and status: [Notion — Storybook 3D](https://app.notion.com/p/403d0befadbd81cbaba2e9061105d171), with a dedicated task database.
Mobile readers can read the full chapter text in a legible caption below the
small physical book; the double-page geometry remains unchanged.

### Bulk SVG actor maintenance (no premium model required)

The original `public/assets/*/characters.svg` remains the canonical
hand-authored artwork; the 14 separately registered actors are deliberately
reproducible extracts, not alternative copies of copyrighted images.

```bash
npm run test:actors   # CI: verify every actor preserves original SVG geometry
npm run art:actors    # explicit regeneration after canonical character edits
```

Only run the second command when you intend to **replace** all generated actor
sources from their canonical chapter art. Future custom limb art should first
update the authoring source or create a separate intentional motion layer.
The validator checks all five chapters, including the GROW props group.
