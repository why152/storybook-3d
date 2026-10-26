# Flexible paper in the physical book — local candidate

Hypothesis: the existing developable CSS curve can make the interior leaf look
like bending paper while preserving the original HTML typography and illustration.
Apply the verified pose/decode handoff and explicit camera-facing culling from
PR #19, and use 13 connected strips instead of PR #16's 20. At the maximum
550 CSS-pixel leaf width, the circular-curve model deviation is under 0.5 px;
this predicts geometry accuracy only, not compositor speed or image fidelity.

Baseline: `38fcd9d` rigid book. Same original source art, 1280×720 / 390×844
viewports, camera, chapters, turn timestamps, 0/25/50/75/100 poses, forward and
reverse continuous browser videos, customization and reduced-motion behavior.
Keep the hard cover rigid. Only interior leaves bend about the common binding.

Gate: joined constant-length geometry above the underlying pages; no mirrored
or missing print, stalled navigation, endpoint mismatch or pose reset. Preserve
the earlier flexible candidate's strict full-book endpoint image comparison
(mean RGB <2/255 and changed pixels <4%). Inspect Chromium and WebKit screenshots
and motion before choosing keep / iterate / reject. No AWS deployment this round.

## Current result — iterate, not accepted

The rigid baseline's continuity fixes are PR #19 / `38fcd9d`; its Chromium and
WebKit CI run `40300323083` succeeded. Those checks do not certify this branch.

The current interior leaf uses 13 joined strips and explicit projected
transforms to avoid WebKit's nested 3D clipping failure. Two shared SVG print
resources embed the original image planes with their frozen CSS matrices.
Each face crops a native SVG image; HTML text and paper finish remain native.
The cover continues to use its rigid, spine-bound hinge.

Observed experiment decisions:

- Reject full page DOM per strip: WebKit's midpoint can be invisible despite
  geometry assertions passing. Direct projection restored visible paper.
- Reject HTML snapshot reconstruction: it changed paper finish and text.
  The snapshot dependency was removed.
- Reject Canvas PNG as the print surface: mobile endpoint error was 4.67/255;
  2× sampling still measured 4.46/255 against the unchanged mean <2 gate.
- Reject SVG CSS backgrounds: mobile error was 2.55/255. Native SVG image
  elements instead passed the original strict full-book endpoint comparison
  at 1440×900 and 390×844, both front and back, in WebKit.
- Fix first-load measurement: WebKit could capture unstyled 1424×5759 source
  layout instead of the actual 550×642 page. Font loading is separated from
  local styles; print capture waits for styles and a layout frame, and hidden
  turning leaves are not measured before preparation.

Last executed browser check:
`STORYBOOK_TEST_BROWSER=webkit playwright test tests/flexible-paper.spec.ts`
against the local production preview: **3 passed**, including joined length,
geometry budget, and all four strict painted endpoint cases. Local report:
`/tmp/storybook-flexible/vector-img/`. Later cleanup removed unused background
properties and adjusted the continuity test to read the native SVG image;
the production build, lint, typecheck and original asset/actor checks passed.

The following browser continuity command was **not executed**: automatic
approval review could not complete because the account reached its usage
limit. No approval was bypassed. This is not evidence of a browser failure
or an unsafe command.

Still required before adoption: actual frozen print and forward/backward
handoff checks; Chromium and WebKit complete suites; midpoint paint/clip and
seam inspection; matched five-pose captures and continuous opening/forward/
reverse video; customization, reduced motion and resize verification; frame
timings; user visual review. No new commit, PR, merge or deployment is claimed.
