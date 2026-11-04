# Held paper and AWS release verification — 2026-11-04

The release candidate builds on PR #42's transparent handwriting and cached
letter illustrations. It keeps the central binding, original five spreads and
front/back print registration. Grabfold's [pointer handler](https://github.com/javocsoft/grabfold/blob/d291f1172a38243c44cc1d4f1ce8912468a73123/src/book.ts)
uses the latest drag position at the next animation frame. Storybook now uses
that pattern with its existing spine geometry. No upstream code is bundled.

Seven reversals delivered before a refresh previously caused fourteen pose
writes, from the window and React handlers processing the same input. The new
regression check expects one write and verifies the last coordinate. The
coordinate scale is captured at contact, and releasing back near the starting
edge cancels even when the last delivered move had crossed the commit threshold.

`tests/letter-grip.spec.ts` sweeps 0/25/50/75/100% and back while holding one
leaf, reverses quickly again, then lands in both directions. It checks two
stationary pages, one turning leaf, one visible face per strip and no residual
transform at landing. A separate screenshot probe compares the paper pixels
with and without the underlay at two middle poses. A small probe cannot rule
out every possible transient seam, so screenshots and video are also reviewed.
Desktop uses browser mouse input. The Chromium phone profile uses its touch
input protocol. WebKit is exercised at the same phone viewport and DPR, and
with synthetic touch pointer tests. A physical iPhone is not available here.

Generate stills with `npx playwright test tests/letter-grip.spec.ts`. Repeat
with `STORYBOOK_GRIP_VIDEO=1` to record uninterrupted motion. Running stills
and video together at DPR 3 produced a scaled capture frame in Chromium, so
we used the same sequence in separate runs. Curated evidence is kept locally
in `test-results/aws-drag-review/`.

The approved AWS target uses the existing static site and an atomic release
link. The preceding verified release is `e964c93aa09d78d956db7e0ad6297e61796c5102`.
See [the AWS runbook](../AWS_DEPLOYMENT.md) for the release procedure.
