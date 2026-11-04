# Recorded turn and character repair

The baseline is the AWS letter build at `03a7d24`. At about 4.5 seconds in
the owner's desktop recording, several vertical slices of the moving right
leaf keep their cream paper color while both ink and artwork disappear.
The same defect recurs across chapters and directions. The owner's source
recording and extracted frames stay local.

## Comparisons and decisions

- **Moving print.** The baseline paints the cached masked art, native
  handwriting and other page content inside each transformed slice. The
  candidate paints one opaque print per face, cropped directly by each
  strip, so ink and illustration share the same draw. The flat endpoints
  still use native pages. Keep the direct print for review. Neither the
  baseline nor the candidate reproduced the reported hardware-specific
  dropout in the local Playwright setup.
- **Back turn.** The baseline runs the forward bend backward. The candidate
  mirrors the bend according to the side picked up. Reversing a held drag
  preserves the current leaf and bend direction. Keep for tactile review.
  The mirrored world coordinates, hinge continuity and sheet length are
  checked across 1,001 samples. No change to the cover mechanism.
- **GROW.** Advancing the illustration fade alone exposed the rabbit's
  ears but put dark foliage behind the ink. Reject that version. Keep the
  revised rabbit placement and a later fade, lift the foreground moth off
  the fox's head and give the fox and watering props a common motion pivot.
- **HELLO and DREAM.** Move the HELLO butterfly clear of the fox's face.
  Shorten the DREAM boat sails so both characters' eyes stay visible.
  The smaller sails still cross the gutter as part of one boat.

## Evidence

Matched settled spreads and 0/25/50/75/100% cover and interior poses were
captured using the production build, the same viewport and reduced motion.
Continuous browser video includes opening, all five chapters, backward turns
and a held drag across the spine that changes direction before release.
Desktop was 1835×921 at DPR 2 and phone emulation was 390×844 at DPR 3.
Local captures are in `test-results/recording-fix/`.

The Playwright print comparison checks actual artwork plus handwriting
against the native page with the existing mean 2/255 RGB budget, excluding
paper-edge lighting. It also checks that moving strips share the same
opaque bitmap per face without nested content. Grip tests cover held
reversal, opacity against the underlay and correct landing.

```sh
npm run lint
npm run build
npm run test:assets
npm run test:actors
STORYBOOK_TEST_PRODUCTION=1 STORYBOOK_TEST_BROWSER=webkit npm run test:e2e
STORYBOOK_TEST_PRODUCTION=1 STORYBOOK_TEST_BROWSER=chromium npm run test:e2e
```

The original desktop setup and physical iPhone Safari remain open for
verification. Leave the candidate separate from the AWS release until the
visual direction has been reviewed.

## HELLO silhouette, gutter occlusion and reverse release

Follow-up baseline: `233c20f`, the previous revision of PR #43. The HELLO
rabbit's outer ear path extended below the cheek. Redraw the ear bases to
terminate behind the head, remove the overlapping torso patch and align
the raised paw and scarf. Retain the original character pose, scene layout,
and SVG-to-actor registration.

The gutter used a positive 3D depth and painted in front of the projected
paper. Lower it beneath the paper only while an interior leaf is curved.
At a matched 50% pose in local WebKit, toggling the gutter changed the
covered five-pixel band by an average of 42.94 RGB levels before and 0.05
after. The exposed band kept its shadow. Keep this stacking correction
instead of hiding the whole gutter.

Borrow Grabfold 0.1.0's distinction between a positional release and a
velocity-driven release. This book measures the latest sustained direction
so a prior push does not outweigh a quick return. With the same 74% → 58%
movement and immediate release in each direction, the previous version
completed the turn and this version returned to its source chapter.
Pausing at 58% before release still completes the turn. Mouse, Chromium
touch simulation and WebKit cover the same gesture paths. Precise vertical
grab geometry remains outside this revision.

Matched screenshots and continuous browser videos are in
`test-results/spine-and-grip/`, including `before-after.png`,
`gesture-before-after.mp4` and `touch-candidate.mp4`.
