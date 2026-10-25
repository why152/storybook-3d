# Integrated flexible paper — hypothesis and evidence

Base: `deab92e`. Branch: `codex/spine-bound-flexible-paper`.

## Hypothesis

The rigid interior leaf collapses to an edge at midturn. A length-preserving
curved surface should retain a readable, rounded silhouette without moving
the binding, stretching the print, or losing personalized HTML typography.
Cover boards should remain rigid. Reduced motion should settle immediately.

## Candidates

1. Existing PR #12 polynomial WebGL bow: inspected source. It adds height
   without preserving arc length; its texture composer only includes SVGs,
   omitting actual HTML captions, personalized copy and actor state. Rejected
   as a direct production integration, not claimed to be an unsolvable problem.
2. Existing PR #12 cylindrical WebGL roll: preserves principal arc length,
   but has the same texture/DOM mismatch. Retain as an isolated research PR.
3. CSS developable strip surface: keep existing PageHalf typography/art,
   subdivide one physical leaf, map the reverse strips in reverse order,
   and integrate constant-length tangents. No separate texture-generation
   system, font rasterizer, or WebGL context. Candidate under validation.

## Invariants

For progress p, theta = pi*p, bend = 1.15*sin(theta). Each strip has
length 1/N and local tangent bend*(i+.5)/N. Integrating cos/sin positions
keeps neighboring strips joined and conserves paper length. World tangents
are -theta + local tangent, always within [-pi,0]. Thus the paper rises
above the stationary pages rather than passing through them. At p=0/1
the bend is zero; the surface exactly matches the original flat page.
The same p and same source pair define both forward and backward turns.

## Acceptance

- Same artwork, viewport, camera and 0/25/50/75/100 poses as baseline.
- Real cover + forward/reverse recordings; desktop and mobile stills.
- No exposed strip seams, mirrored back text, doubled leaf or layout jump.
- Full existing tests plus geometry, endpoint registration and resize checks.
- Measure browser frame timing with hardware/environment explicitly stated.
- User visual direction approval and real phone validation remain separate.

Results will be recorded after browser inspection, not inferred from build.

## Verified result and handoff

- Local Chromium: **33/33 passed**, including all five scenes, customization,
  actual CDP touch, actor source parity, forward/reverse video, endpoint pixel
  comparisons, resizing and zero intermediate paints under reduced motion.
- Local WebKit: initial **11/11 critical checks passed**; full-suite status is
  reported in the PR. GitHub CI now checks Chromium and WebKit separately.
- ESLint, TypeScript, Vite production build, 30-plane asset checks and 14-actor
  source checks passed. Dependencies are locked; CI uses `npm ci`.
- Geometric tests sample 1,001 progress values: fixed spine, joined edges,
  unit arc length and no penetration of stationary pages.
- Endpoint comparisons include 1440x900 and 390x844. Clipped 3D rasterization
  differs at antialiased edges: allowed mean error <2/255 and <4% pixels with
  a channel error >20; captures were inspected rather than asserting identity.
- Screenshots and actual WebM are committed in `docs/validation/flexible-paper/`.
  `book-turn-00..04.png` are final Chromium regression frames. The matched
  rigid frames use the SAME 4000px camera and viewport size. The original
  doubled-camera baseline is retained locally in `evidence/rigid-baseline/`.
- Reviewed 0/25/50/75/100 stills and a 4fps contact sheet of the full 8.52s
  recorded opening/forward/back/closing sequence. The actual video is retained
  for continuous playback and owner visual review; no missing/reversed print
  was observed in the inspected frames.

### Iterations and decision

Initial strip trial exposed compounded-perspective enlargement and visible
antialias cracks. Use one perspective, reserve vertical margin, compensate
symmetric 0.75px coverage without scaling the print, and shade continuously.
A second trial exposed delayed rasterization with hundreds of redundant
translated image layers. Removing per-image 3D promotion inside clipped paper
faces eliminated the missing-tile captures in subsequent checks. The actual
animation decodes incoming images before exposing them. Fractional widths
come from computed CSS width rather than rounded clientWidth.

**Decision: keep as a reviewable integrated candidate, not merge approval.**
It preserves original source art and DOM typography without a second texture
renderer. Actor transforms are frozen from their actual pose and both halves
resume at the same phase on landing. Reduced motion now settles before paint.

One local automated Chromium recording run measured candidate p95 frame
intervals of 16.8ms desktop and 16.7ms phone-sized; baseline was 33.4ms and
16.7ms respectively. These are single-run observations WITH video capture,
not a controlled speedup claim, real-phone GPU benchmark or FPS guarantee.
Raw environment-labeled numbers are committed alongside the footage.

### Remaining work

Owner visual review, physical phone/browser testing, artistic refinement,
corner folds and physically projected shadows. This approximation duplicates
clipped DOM only during a turn (20 strips); low-memory devices still need
measurement. No WebGL research PR has been merged or silently removed.

### Reproduce the paired evidence

Serve `deab92e` in a separate checkout on port 5174 with the locked dependencies;
serve this branch on port 5173. Then:

```sh
node scripts/capture-paper-evidence.mjs
node scripts/build-paper-review.mjs
node scripts/review-recording.mjs
```

Open `evidence/flexible-paper/review.html`. The capture script applies identical
camera/layout CSS to both versions and records two viewports, both cover and
interior 5-pose sets, real navigation videos and frame intervals. Set
`STORYBOOK_BROWSER=webkit` to capture that engine after installing it.

### Stop-point requested by owner

The owner requested immediate wrap-up and GitHub synchronization because of
remaining quota. Full WebKit regression exposed an endpoint pixel-comparison
failure after the initial critical checks passed. Keep the assertion and keep
this PR Draft: do not relax the test without examining the image difference.
The geometry, navigation and pose-preservation checks passed. This issue is
an explicit unfinished cross-engine validation item, not a claim that WebKit
is production-approved. Continue with the endpoint test and its failure image
before doing any additional visual work.
