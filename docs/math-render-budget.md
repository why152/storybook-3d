# Mathematical rendering budget and falsifiable strip-count experiment

Status: **experimental, not approved**. This document records the mathematical
model, measured failure artifacts, and the decision criteria. Do not merge the
flexible-paper PR on mathematical plausibility alone.

## 1. Geometry is a constrained problem, not a CSS trial-and-error problem

Let u in [0,1] measure distance from the spine to the outer edge and
t in [0,1] measure progress through a right-to-left leaf turn.

- Global hinge angle: theta(t) = pi*t.
- Relative paper curvature: k(t) = 1.15*sin(pi*t).
- Local unit tangent: T(u,t) = (cos(k(t)*u), -sin(k(t)*u)).
- Developable centreline: r(u,t) = integral_0^u T(s,t) ds.
- The global rotation of that curve is -theta(t) about the fixed spine.

This model keeps the spine fixed and preserves local paper length
because |T|=1. The renderer approximates it with N connected tangent strips,
sampling each tangent at (i+0.5)/N. A separate test verifies continuity and
unit total paper length over 1,001 progress steps.

For a circular arc with total bend k, the local chord sagitta in CSS pixels
is approximately (and extremely close to the numerically observed maximum
global polygon deviation for this geometry):

    E(W,N,k) = W * (1 - cos(k/(2*N))) / k

where W is the flat leaf width in CSS pixels. At k=0 take the continuous
limit, E=0. The worst bend is 1.15 radians at the middle of the turn.

**Choose N by an error constraint, not a magic constant**:
N* = min { N >= 4 : E(W,N,1.15) <= pixel_budget }.
This is the minimum-strip solution **within the local curve-error model**,
not a proof of globally optimal rendering performance.

Selected examples (error budget 0.5 CSS px; sampled against the analytic
continuous curve as an independent numerical check):

| Leaf width W | Model-minimal N | Sagitta estimate |
| --- | ---: | ---: |
| 171px (representative phone half-page) | 8 | 0.384px |
| 360px | 11 | 0.428px |
| 514px (1280/1440 desktop constrained by height) | 13 | 0.437px |
| 550px (maximum book width 1100px) | 13 | 0.468px |

At W=550 and N=20 the geometric deviation is ~0.198px. Increasing N
beyond 20 is not a justified response to >2/255 screen-wide RGB screenshot
differences or a stalled browser: geometry error and compositor error are
different measurements. Pixel budgets need device-pixel-ratio and projected
perspective margin before formal production approval.

## 2. Separate invariant layout from time-dependent physics

In the original implementation, each of 20 strips held both copies of the
full illustration/HTML page. A real WebKit failure trace recorded roughly
315 IMG entries and 376 DIV entries during a turn. That makes the page's
DOM/compositor pressure scale as O(N * scene_complexity).

Older posePaper() set *constant* print widths and per-strip offsets every
animation frame. This was refactored so layoutPaper() executes once on mount
or resize, and posePaper() changes only tangent positions, face visibility,
and shading each frame. This is an optimization hypothesis, not proof of a
Safari fix. It uses cached leaf/strip references and a WeakMap to avoid
retaining detached DOM.

The experiment-specific `?scene=hello&segments=8` URL changes only strip
count; default remains 20. Compare default 20, 13 and diagnostic 8 under
matched viewport, source assets, turn input, and browser version.

## 3. Precise reproducible failures, no threshold fudging

Before these changes:
- GitHub PR #16 run 40210560086: Chromium 34 pass / 1 fail at 390px,
  progress=0, mean RGB 2.525 (retry 2.189), required <2. WebKit 7 failed
  navigation/actor/resize tests, one endpoint pixel comparison flaky.
- In the actual Chromium saved turning/settled frames, the left side was
  essentially unchanged: mean RGB error ~0.012 for x 0..67px, while the
  rightmost 68px had error ~5.09. This locates the mismatch in the turning
  print/compositing path; it is not proof of missing content.
- A failed WebKit Playwright trace still had a turning leaf after 15s;
  one captured leaf style was approximately rotateY(-9deg). The high-DOM
  CSS/3D workload is a plausible contributor, but root cause is not yet
  proven. No uncaught page exception was shown in the inspected trace.

Future acceptance gates:
1. Browser-independent length/spine/camera-facing normal tests pass.
2. Compare 8 vs 20 (and later 13) in WebKit using exactly the same inputs.
   If 8 succeeds where 20 fails, investigate a size-dependent compositor
   bottleneck; if both fail, isolate the renderer/animation-state problem.
3. Preserve the strict endpoint screen comparison and attach BOTH images
   and metrics when it fails. Don't silently raise thresholds.
4. Both Chromium/WebKit complete all navigation, reduced-motion, pose,
   customization and screenshot tests.
5. Real iPhone Safari (not Linux Playwright WebKit), actual continuous-motion
   video and product-owner artistic approval remain independent gates.

## 4. A better architecture remains on the table

If segment count reduction is not enough, use a single renderable front/back
paper texture with a mathematically defined curved mesh (WebGL2) or another
one-time rasterization strategy, instead of N copies of complete PageHalf DOM.
The moving leaf would then scale closer to O(N vertices + artwork source
complexity), rather than O(N * full DOM). Preserve original vector source,
the DOM accessibility copy on the static page, personal greeting and the
frozen character pose in the moving texture. Such integration requires an
honest rendered-text and color comparison, not merely a passing shader demo.

Background technical references, not claims that historic Safari bugs remain
current:
- Apple's documented warning that overflow:hidden flattens nested 3D:
  https://developer.apple.com/library/archive/documentation/InternetWeb/Conceptual/SafariVisualEffectsProgGuide/Using2Dand3DTransforms/Using2Dand3DTransforms.html
- WebKit historical backface/overflow issue:
  https://bugs.webkit.org/show_bug.cgi?id=79661
- MDN animation costs:
  https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate
