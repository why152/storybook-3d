# Architecture — 3D storybook Demo

## Goal
Recreate the **perceived experience** of a layered illustrated 2.5D/3D flipbook, while independently implementing the rendering and using original artwork. The user values illustrated storytelling, animated page transitions and high-fidelity 3D rotation.

## High-level modules
- `src/engine/`: R3F scene, camera, lighting, page pivot, front/back materials, depth ordering, time-based transition state.
- `src/components/`: React UI for previous/next, loading states, fullscreen or help, accessible controls.
- `src/scenes/`: reusable illustrated scene renderer with background, character, decoration and foreground planes.
- `src/data/`: typed story definition, demo content and validation.
- `public/assets/`: optimized originals, plus placeholders while art is being prepared.

These paths are *proposed*, not yet present. The coding agent may adjust names and document departures.

## Core principle: separate content and rendering
Story definition example (illustrative TypeScript interface):

```ts
type LayerKind = 'image' | 'text' | 'particle';
type SceneLayer = {
  id: string;
  kind: LayerKind;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  asset?: string;
  text?: string;
  animation?: 'none' | 'float' | 'fade-in' | 'pop';
};
type StoryPage = {
  id: string;
  background: string;
  front: SceneLayer[];
  back?: SceneLayer[];
};
type Story = {
  id: string;
  title: string;
  pages: StoryPage[];
  variables: Record<string, string>;
};
```

Text substitution must be safely rendered as text, not injected HTML. Consider localization and overflow constraints.

## Rendering and sequencing
1. Use an orthographic or modest-perspective camera with a reference 16:9 artboard.
2. Each flipping leaf has a stable pivot at its binding edge. Treat front/back as different surfaces; reverse UV/mirroring correctly.
3. Manage animation as one transition with an explicit idle/turning state; prevent overlapping input. Support both directions.
4. Keep scene layers in the coordinate system of their parent page so elements rotate with the book.
5. Place illustration planes at controlled local depth to achieve parallax; clip/mask page overflow where needed.
6. Coordinate turn progress, camera transforms, shadow strength and arrival animations on one timeline.
7. Validate 0/25/50/75/100% poses against the supplied visual reference; screenshots are part of the acceptance review.
8. Page deformation is optional only after rotation, occlusion and dual-side behavior work. Do not overfit to physically realistic curled paper if the reference looks like rigid cards.

## Layered artwork contract
A page may use `background.webp`, `character.png`, `foreground.png`, and effects. Transparent elements share a known artboard size and coordinate origin. Avoid baked-in Chinese text; render customizable copy in-app. Include source/ownership metadata for production assets.

## Performance, UX and fallback
- Desktop first, phone portrait/landscape sanity checks.
- Progressive asset loading, lazy preload adjacent page assets, dispose resources when replaced.
- Pause or reduce unnecessary continuous rendering.
- Detect missing WebGL and show a readable static story.
- Keyboard and touch navigation, plus `prefers-reduced-motion`.

## Deliberately excluded now
Customer authentication, order CRUD, production database, payments, production media upload, public publishing, video export. Data definitions should leave a migration path to a future admin editor and published revisions.

## License policy
Use permissively licensed dependencies or separately licensed originals. Public GitHub source without explicit license is **not** approved for reuse. Do not copy original case-study artwork.
