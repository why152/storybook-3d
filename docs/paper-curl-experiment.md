# Curved paper experiment — own WebGL2 vertex shader

**Status: isolated experiment, not production Book.tsx.** This paper-curl
experiment is a separate candidate, not a hidden second production engine.

## Product intent

The user's hard requirement remains a **bound physical book**: two visible
halves, central gutter and ONE half-width leaf turning around the binding.
A full-scene rotating card is not a substitute.

Comparison: `/labs/paper-curl.html?from=grow&pose=0.5`

- Left: existing rigid CSS3D physical leaf, identical artwork and direction.
- Right: newly handwritten WebGL2 subdivision shader, identical artwork.
- 5 pose snapshots (`0/25/50/75/100%`), continuous forward/backward
  animation recording, 0–100% paper flexibility and direct cursor drag.
- Choosing a chapter pair changes front = current RIGHT half, back = next
  LEFT half; stationary pages below are previous LEFT and next RIGHT.
- The shader is authored for this project from scratch, separate
  `curled-page.vert.glsl` and `curled-page.frag.glsl`. No dependency
  on Three.js or proprietary reference code.

## Geometry and shading

Paper mesh: 65×25 vertices, 64×24 quads, 3072 triangles, generated in JS
and submitted to WebGL2 using a single indexed geometry draw call.

`p ∈ [0,1]`: book leaf rotation angle `θ = π p` around the spine.
`u ∈ [0,1]`: position from spine to leaf edge.
`v ∈ [0,1]`: height position.
`c`: curve strength.

Curvature from the original vertex shader:

`bow(u,v,p) = c·0.92·sin(πp)·u^1.2·(1−0.32u)·(0.84+0.16cos((v−0.5)π))`

This displacement is zero at settled 0/100%, rises near midturn and has
a smooth envelope from the bound edge toward the free edge. The paper
then rotates around the fixed spine. The fragment shader uses
`gl_FrontFacing` and separately loaded front/back half-page textures,
flips the reverse texture's U-coordinate for readable text and applies
moving curvature-dependent highlights plus a small paper texture.

**Limitations:** this is an approximate bowed mesh, not a physically
simulated sheet with inertia, folds, collision, full normals and
shadowmaps. It may look more natural than a rigid leaf at oblique angles
but quality and mobile performance need real evidence. Two CSS underlays
and one WebGL draw call are still used; '1 draw call' means the curved
leaf mesh itself, not the entire browser frame.

## Original materials and licensing

All illustration textures come from this project's own six SVG assets
per chapter, rasterized to a front/back 600x700 texture without
exporting third-party assets. No copied shaders are included.

Related public approaches, for benchmarking only:
- [turngl (MIT)](https://github.com/oguzhanT/turngl): Three.js based
  subdivided page mesh and cylindrical flip (source ideas, not imported).
- [StPageFlip (MIT)](https://github.com/Nodlik/StPageFlip): HTML/canvas
  page flipping alternative.
- [shiarauzo/book-flip](https://github.com/shiarauzo/book-flip): independent
  R3F shader-based book bend; review before any code copying.
- [Three.js ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial).

## Quality gates before main integration

1. ESLint, TypeScript, build and all existing Book.tsx smoke tests pass
   unchanged. Shader lab separate in `public/labs`.
2. Actual Playwright browser must compile GLSL when WebGL2 exists and
   upload both original textures successfully. No shader compilation errors.
3. Bent sheet has measurable output change at 50% when curl strength
   changes. Five authentic pose screenshots and browser-recorded WebM
   of forward/backward turns.
4. Front/back text must remain readable with correct page stacking,
   page-turn direction and spine position. Paper must not disappear
   when edge-on; check multiple browser and mobile devices.
5. Record memory, FPS and other performance with representative
   hardware; no unsupported claims of performance improvement.
6. Only after visual review should we consider replacing production
   `Book.tsx` and adding real GPU fallback.
