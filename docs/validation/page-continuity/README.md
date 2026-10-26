# Page-turn continuity candidate — 2026-10-26 JST

Local development candidate based on deployed rigid-book source via PR #18,
not flexible paper PR #16. **Not deployed.** The owner asked to inspect local
behavior before final publication; AWS was only read to confirm the existing
`e964c93` release and unchanged container start times.

## Observed defects and selected fixes

1. Removing idle animation at turn start resets printed characters to their
   neutral transform. Chromium and WebKit both reproduce this. Keep the actual
   animation hold time and copy its printed transform onto the moving leaf;
   synchronize newly settled halves before resuming motion.
2. CSS-only pause can be sampled one frame late in WebKit. The strict reverse
   handoff test caught this. Explicit animation hold times pass that regression.
3. WebKit paints reverse-face composited descendants through the front,
   producing mirrored next-chapter art at the 0% pose. Removing isolation,
   removing overflow, preserving 3D on faces, changing nested backface visibility
   and promoting the surface individually did not fix it. Explicitly cull the
   away-facing surface with the actual hinge angle. Keep the two distinct
   front/back surfaces and physical half-page hinge.
4. A newly mounted outgoing image can briefly show blank paper even with a
   cached URL. Retain the outgoing spread until the moving leaf's images
   decode, then decode the newly mounted underlay before starting the hinge.
   Input remains locked throughout this preparation and motion.

**Selection:** keep the continuity candidate for local owner review; reject
CSS-only pause and the face-isolation/overflow variants. This improves the
existing rigid renderer. It does not establish flexible paper, art approval,
real iPhone GPU performance, or absence of every device-specific flash.

## Matched browser evidence

`matched-poses.json` contains HELLO at CSS animation time 1250 ms for original
`0073f2d` and this candidate, same 1200×700 source artwork and camera, at desktop
1280×720 and mobile 390×844 in Chromium and WebKit. All four original cases
reset their printed pose; all four candidate cases retain it exactly.

The PNGs show rest and the first captured moving frame. The WebM files are
continuous actual browser recordings: cover opening, forward turn, backward
turn, then the fixed-pose probe. They include normal initial page loading and
the explicit second navigation to HELLO for that probe. No frames are fabricated.

`baseline-pixel-regression.json` proves the new image comparison catches the
old WebKit defect: the desktop and mobile 0% endpoints fail, with mean RGB
channel errors 23.30 and 21.49 against their settled spreads (threshold 3).
The 100% baseline endpoints already pass; they are not claimed as new fixes.
The candidate's four endpoint comparisons pass, including actual painted
orientation, without adding a PNG decoding dependency.

The full suite also saves cover and leaf 0/25/50/75/100 poses, all five chapters,
mobile screenshots, reduced motion, customization and continuous recordings.
CI separates Chromium and WebKit artifacts. Native CDP touch is tested only in
Chromium and explicitly skipped in WebKit; real iPhone touch remains pending.

## Reproduce

```bash
npm ci --no-audit --no-fund
npm run qa:browser:setup
npm run test:actors
npm run test:assets
npm run lint
npm run typecheck
npm run build
STORYBOOK_TEST_PRODUCTION=1 npm run test:e2e
STORYBOOK_TEST_PRODUCTION=1 STORYBOOK_TEST_BROWSER=webkit npm run test:e2e
npm run qa:gallery
```

To refresh matched recordings, serve `0073f2d` on port 5174 and the candidate
production build on port 5175, then:

```bash
npm run qa:continuity -- docs/validation/page-continuity
```

Override `STORYBOOK_BASELINE_URL` and `STORYBOOK_CANDIDATE_URL` when needed.
Keep temporary baseline source outside the production source tree.
