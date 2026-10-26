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

## Verified checkpoint and remaining failures

Recovery checkpoint: `5462233`, [Draft PR #20](https://github.com/why152/storybook-3d/pull/20),
based on PR #19. Its [first CI](https://github.com/why152/storybook-3d/actions/runs/40337544617)
failed: Chromium 42 passed / 1 failed; WebKit 38 passed / 3 failed / 1 skipped.
The checkpoint's nested SVG resources produced large endpoint differences in
Linux CI. This is not a passing product baseline.

Subsequent local work embeds original SVG paths with namespaced gradients and
masks, keeps the original intrinsic art dimensions, and sizes/decodes mounted
print images before handoff. The actual shared print is compared to the original
frozen art at the same viewport coordinates, without resizing screenshots.
All four chapter pose / forward / reverse checks pass in Chromium and WebKit.

Latest focused production-preview checks:

| Engine | Result | Remaining failures |
| --- | --- | --- |
| Chromium | 10 passed / 2 failed | Mobile viewport endpoint 0 mean 4.89 (gate <3); full-book mobile 0 mean 4.74 (gate <2) |
| WebKit | 9 passed / 3 failed | Intermittent first-paint endpoint failure; mobile 0 mean 4.73 and mobile 1 mean 3.30 (gate <3) |

A previous WebKit-only strict endpoint run passed all four cases. The newer
failures above supersede any broad passing claim. Original gates remain intact.
One attempt was not executed while automatic approval review was temporarily
unavailable because of account quota; review recovered and actual tests resumed.
That interruption is historical, not the current blocker.

## Human-visible comparison and decision

[Evidence directory](validation/flexible-paper/svg-candidate/) contains original
full-resolution GROW screenshots for both variants and both viewports at
0/25/50/75/100%, five candidate cover poses, four real opening/forward/reverse/
closing WebMs, sampled video contacts, timings and exact source SHA256s.

- [Desktop matched poses](validation/flexible-paper/svg-candidate/desktop-matched-poses.png)
- [Mobile matched poses](validation/flexible-paper/svg-candidate/mobile-matched-poses.png)
- [Desktop flexible video](validation/flexible-paper/svg-candidate/webkit-desktop-flexible-opening-forward-back.webm)
- [Mobile flexible video](validation/flexible-paper/svg-candidate/webkit-mobile-flexible-opening-forward-back.webm)

Inspected 50% poses and video samples at 0.4-second intervals show a bound,
curved, readable half-leaf rather than a centered rotating spread. They also
show visible strip seams/lighting bands and square protruding outer print
corners. Initial document-loading blank frames remain in the untrimmed footage.
The inspected samples do not certify every intermediate frame or real Safari.

Local automated WebKit rAF intervals, covering the complete four-turn sequence
including preparation (not a GPU or real-phone benchmark):

| Viewport | Rigid p95 | SVG-strip candidate p95 |
| --- | --- | --- |
| 1280×720 | 26 ms | 109 ms |
| 390×844 | 21 ms | 42 ms |

Decision: **iterate the flexible book; reject this SVG-per-strip printing
configuration as a finished solution.** Keep the joined curve and actual pose
handoff. The next bounded experiment should test a single pre-rasterized print
per face through native image surfaces, using the same artwork, timestamps,
pixel gates and video. The earlier rejected PNG experiment used CSS backgrounds;
its result does not establish whether native image surfaces solve sampling.
Do not preserve two production engines or relax pixel thresholds. Require
better continuous appearance and measured frame intervals before keeping it.

Still required: resolve endpoint/first-paint mismatch and outer clipping;
remove seams and preparation stalls; complete both browser suites; verify
customization, reduced motion and resizing; obtain user and real-device visual
feedback. PR remains Draft. Main and AWS are unchanged; no deployment is claimed.
