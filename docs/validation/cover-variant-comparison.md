# Cover support comparison — 2026-11-04

The AWS baseline `8c88083` holds its book support on the right during the
entire cover motion. A jump in the lower edge and shadow is visible when
switching from the final opening pose to the settled HELLO spread. The
printed portions of the two spreads match in the fixed comparison.

The lab uses the same cover and HELLO illustration, viewport and camera.
It compares 0/25/50/75/90/98/99/100% and records continuous opening and
closing. Desktop is 1440×900 at DPR 1. Phone is 390×844 at DPR 3.

| Variant | Decision | What the browser showed |
| --- | --- | --- |
| AWS baseline | Keep as a reference | Early left side stays clean, but the support and shadow pop at the ends. |
| Late crossfade | Reject | Fixes the fully open sample. The closed-end mismatch remains and it temporarily uses two support/shadow layers. |
| Support follows the angle | Keep for review | Keeps the footprint on the right until the cover passes edge-on. The same support grows beneath the left as the cover opens and reaches the settled width. |

The angle variant exposed a second closed-end issue. The front face clipped
its cover's cast shadow. Allowing that shadow to extend outside the front
face, keeping the same cover corners, and aligning the front to its settled
plane fixed the observed differences. The cover image still clips within
its own surface. The away side remains culled and only the hardcover back
paints the left illustration until it lands.

In WebKit, the 10-CSS-pixel-high support sample's mean RGB error at the
open endpoint was 82.08/255 desktop and 53.12/255 phone on AWS. The chosen
build measures 0 on both. At the closed endpoint, error went from
87.15 and 38.20 to 0.009 and 0.001. These are comparisons of the cropped
support zone. They do not measure every pixel or physical-device timing.

Four adjacent chapter pairs were also photographed at 49/50/51/75% on
both viewports. All 32 poses showed one side per strip and two stationary
halves. A separate recording runs all four forward and four reverse turns
with a held midpoint and rapid reversal in desktop WebKit and Chromium
phone touch input. All 16 land on the intended spread. No phone hardware
was used for this comparison.

WISH has three separate still previews on the same art. The recommended
middle treatment reveals the cake and characters earlier and keeps the
curtain. The strongest treatment lightens the entire upper part and loses
part of the framing. These stills are art review only. The working candidate
preserves the current WISH layout.

Run the comparison with `node scripts/compare-cover-support.mjs <output>`.
The default URL is the AWS baseline. To verify the built candidate alone,
set `STORYBOOK_TEST_BASE_URL` to its local production preview and
`STORYBOOK_COVER_VARIANT=baseline`. Both modes write stills, videos and
endpoint scores. Curated comparisons are in `test-results/cover-variant-review/`.
