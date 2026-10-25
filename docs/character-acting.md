# P1 illustration acting — original characters become independent planes

**Purpose:** move from global whole-scene float to story-specific performances
while **preserving the physical bound book**.

## First experiment (HELLO and GROW)

We split the existing source `characters.svg` into separate, standalone
**registered transparent** SVGs at exactly 1200 × 700. Each chapter keeps
the original combined `characters.svg` unchanged for single-pass WebGL
experiments, reproducible base art and clean fallback.

| Chapter | New original sprite files | Separate motion |
|---|---|---|
| HELLO | `actors/rabbit.svg`, `actors/fox.svg` | Rabbit bobs/leans while greeting, fox answers later in a different rhythm |
| GROW | `actors/rabbit.svg`, `actors/fox.svg`, `actors/props.svg` | Rabbit reaches upward on the ladder; fox bows as watering can and particles tilt gently |

The `src/components/SceneArt.tsx` renderer places the real sprite assets
at the **same composition Z-plane** where one `characters.svg` used to be.
Source groups retain their original fills, shadows and brush effects;
assets are not approximate duplicated cut-outs or flattened moodboards.

`src/styles.css` uses **individual transform-origin coordinates** near
each original illustration's body. Rabbit, fox, and watering props follow
different unhurried keyframe timelines and periods rather than moving
together like one postcard.

### Engineering safety constraints

- While a leaf is physically flipping, all independently animated
  characters on its front/back face **stop moving relative to the paper**.
  The page is a coherent single physical surface during the turn.
- `prefers-reduced-motion: reduce` disables these actor motions.
- Existing five-scene assets and their SHA/content stay intact; the
  single-pass WebGL experiment still receives the same six layers.
- New optional actor assets are recorded in HELLO and GROW manifests,
  with file alignment verified by `npm run test:assets`.
- All other chapter scenes are byte-for-byte unchanged.

### Inspector for artists and AI agents

Use the existing original-art inspector with exactly the same scene artboard:

- `/art-inspector.html?scene=hello` — original combined `characters.svg`.
- `/art-inspector.html?scene=hello&actors=1` — registered rabbit and fox.
- `/art-inspector.html?scene=grow&actors=1` — rabbit, fox and watering props.

The checkbox toggles between source and separated modes. You can
individually hide each actor to inspect its actual transparency and
alignment. Preserve this tool for future automated image critique.

### QA acceptance

1. Stationary HELLO shows two independent image sources with different
   animation names/periods. GROW shows three independent original sprites.
2. The full original 1200×700 artboard remains perfectly aligned across
   both physical book pages. No disappearing props or mirrored artwork.
3. No actor animation runs inside turning pages, or for reduced-motion.
4. All usual desktop/mobile Playwright book tests remain green.
5. Real WebM captures **idle HELLO, the real half-width book flip, idle GROW**.
6. Artistically compare old/new still frames; motion adds story meaning
   without frantic bobbing. User visual approval still required.

### Honest limitations and next improvements

This version separates whole characters, not every paw, ear or eye.
It is an **acting foundation** rather than finished character animation.
An additional illustrator iteration should isolate raised paws, ears,
eyes and water droplets within each character's SVG to make real gestures
rather than subtle full-body leans. It should also refine painted shadows,
custom typography and narrative timing. Large rewrites remain welcome
if they beat this approach by real visual evidence.

Project tracking: [Storybook 3D Notion](https://app.notion.com/p/403d0befadbd81cbaba2e9061105d171).
