# GPU graphics research — AI-first experiment program (2026-10-25)

## Background and legally safe inspiration

Our source benchmark's authors publicly say they built a **small custom WebGL
parallax shader** to displace separate page elements in **one draw call**:
https://www.hellomonday.com/work/how-to-talk-to-white-kids-about-racism

This says *what* their effect achieves, not that we have their unpublished shader
source. We will write and measure our own code. Do not attempt to scrape their
binaries or duplicate their copyrighted illustration assets.

Potential solutions to **evaluate rather than blindly install**:

1. [StPageFlip](https://github.com/Nodlik/StPageFlip) /
   [React wrapper](https://github.com/Nodlik/react-pageflip) — permissive
   MIT page folding and mobile interaction. Older released packages, useful
   baseline for real paper-curl geometry and gestures, but they cannot replace
   our 2.5D illustration engine without extra integration.
2. [Three.js](https://threejs.org/docs/pages/ShaderMaterial) +
   [React Three Fiber](https://r3f.docs.pmnd.rs/) — lets us write a custom
   vertex shader for flexible curled paper and use existing light/material
   support. Three.js docs explain ShaderMaterial and onBeforeCompile hooks.
3. [PixiJS](https://pixijs.com/) — efficient 2D scene texture composition
   and custom displacement effects, but not an out-of-the-box physically
   curled bound book.
4. [animated-book-slider-threejs](https://github.com/pakagronglb/animated-book-slider-threejs) — MIT example,
   skinned page geometry and interactive 3D book; inspect ideas only before
   deciding on reuse.
5. [shiarauzo/book-flip](https://github.com/shiarauzo/book-flip) — well
   documented subdivided paper vertex bending with progress and bend uniforms.
   The surfaced repo listing does not clearly establish a reuse license;
   treat as implementation inspiration, not copyable source until verified.

## Track A — OUR own single-pass layered WebGL shader

**First actual implementation:** `public/labs/parallax-shader.html`.

This standalone lab reads our five chapters' existing *original* layered
SVGs. Each selected scene's six aligned 1200×700 artboards are rasterized
to a browser-local canvas atlas. GLSL ES 3.00 fragment shader fetches six
sections, applies depth-sensitive cursor parallax + slow per-layer nonlinear
motion, and alpha-composites into **one rectangle / one drawArrays call**.
A parallel CSS six-DOM-layer rendering acts as a visual control.

It is an actual original WebGL shader, not a fake CSS filter. The lab has no
external runtime dependencies and does not touch `Book.tsx`. For WebGL2
unavailable or lost context, the left CSS sample remains, with explicit
status. A minimum 300px atlas layer may be reduced based on GPU texture limit.

**Caveat:** this is *one call for illustration compositing*, not one call
for a whole rendered book or the browser frame. A six-sample GLSL shader is
not automatically faster or better than six optimised CSS layers, especially
when a mobile GPU is fragment-bound. Measure, don't guess.

Open `/labs/parallax-shader.html?scene=hello` after starting Vite. Change
scene and parallax strength, move cursor across either half, toggle idle.
Automated lab test saves a real browser screenshot and records whether the
headless runner actually supports WebGL2.

## Track B — OUR own paper bending vertex shader

**Not implemented yet**; explicit next prototype:

- Keep canonical `src/data/story.ts` and six-source SVG format.
- Create subdivided sheet mesh with hinged x=0 bound to the spine.
- Vertex shader uniform `uProgress` in [0,1] controls overall 0→180°
  rotation; `uCurl` controls temporary curvature peaking near midturn.
- Use separate front and back textures; preserve text orientation and
  two-sided normals. Paper thickness and shadows should remain stable
  across 0/25/50/75/100% and backward motion.
- Support reduced-motion snapping and WebGL-unavailable CSS book fallback.
- Test using real screenshots and video before integrating; no main-branch
  rearchitecture based solely on a pretty isolated demo.

A useful mathematical starting point, **not a finished verified page shader**:

```glsl
float theta = uProgress * 3.14159265;
float envelope = sin(theta); // zero bend in settled positions
float localCurl = uCurl * envelope * sin(uv.x * 3.14159265);
vec3 p = position;
p.z += localCurl;            // bowed sheet before global hinge rotation
vec3 turned = vec3(p.x*cos(theta) - p.z*sin(theta),
                  p.y, p.x*sin(theta) + p.z*cos(theta));
```

Production bending must recompute normals, avoid texture seams and paper
intersections, and correctly align paper stack ordering; a basic `sin`
displacement alone cannot deliver a convincing bend.

## Track C — AI-led experiment matrix

Run **multiple alternatives on separate branches**, each under the same
input assets/camera/capture rubric; do not keep five half-finished engines
bundled into production:

| Experiment | Objective | Evidence/decision |
| --- | --- | --- |
| A0 current CSS layers | baseline | reference desktop+390px captures |
| A1 own WebGL2 atlas parallax | compare depth and frame time | desktop/mobile GPU present + FPS/CPU/GPU where possible |
| A2 PixiJS filters | compare depth and ease of tooling | same scene/camera and minimum GPU hardware |
| B1 StPageFlip | flexible paper benchmark | screenshots 5 poses + gestures |
| B2 Three.js vertex-curl | physically more convincing paper | side-by-side 0/25/50/75/100, reverse, shader fallbacks |
| B3 skeletal/page mesh variant | weigh performance vs visual | same comparison contract |
| C1 combined geometry + illustration | final candidate | 5 chapter visual regression, mobile, memory, fps, accessibility |

**Keep or discard criterion:** actual visual quality, stable physical book
geometry, performance on representative phones, reliable QA and source
license. Lines changed are *not* a criterion; we have explicit owner
permission for major refactors and replacement.

## Release strategy

Always place GPU experiments under `/labs/` on an experiment branch first.
Do **not** merge an entire shader rendering engine into `main` without
an actual shader-rendered screenshot (headless GPU may not be available),
fallback, and output comparison. Record the decision in the project's
[Notion hub](https://app.notion.com/p/403d0befadbd81cbaba2e9061105d171).
