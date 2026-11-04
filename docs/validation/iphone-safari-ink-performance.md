# iPhone Safari ink and turn performance repair — 2026-11-04

User report: friends found desktop presentation acceptable; iPhone Safari
stutters during page turns and shows a translucent rectangular background
behind handwriting. Baseline: published PR #41, `6b08146`.

## Hypothesis and implementation

The approved RGB crops contain photographed paper. Their former CSS grayscale,
brightness, contrast and multiply group make the result depend on the browser's
blend backdrop inside transformed paper. Replace this with black RGBA ink:
alpha = 1 − the former CSS-filtered luminance. All 12 crops keep their original
pixel coordinates, dimensions and antialiased strokes; no drawing or tracing.
The script reads original approved RGB pixels from `6b08146`; private source
video and extraction maps remain outside this repository. Public assets total
127,379 bytes (previously 414,250 bytes). Private photo previews retain their
previous filter/blend styling via an explicit image format flag.

Repeated masks, vector lettering and art bands on each curved strip increase
paint work. For letter pages, capture the same frozen illustrated pose and its
CSS-authored gradient once into one image per face. The fade stops/ellipse center
are shared CSS variables, not separate scene metadata. Native handwriting,
paper finish, gutter, geometry and settled actor animations remain in the same
physical pages. Birthday pages retain the existing two-band/native-lettering
cache. Temporary object URLs still release at landing.

## Matched comparison and decisions

Use production builds, identical artwork, camera, five scenes and five poses
(0/25/50/75/100%) for the cover and GROW turn; reduced-motion stills and continuous
opening/forward/backward video. Desktop: 1440×900, DPR 1. Phone simulation:
390×844, DPR 3. Local macOS Playwright WebKit; **not a real iPhone benchmark**.

An initial development-server run did not load edited modules. Source-dependent
CSS comparison claims from that run are invalid and were withdrawn. The final
comparison uses an independent archived/build of the published commit and a
built candidate. Extra per-strip layer promotion was removed, with no valid
performance conclusion claimed for that abandoned attempt.

| Interior turn sample | Published phone median / p95 ms | Candidate phone median / p95 ms |
| --- | --- | --- |
| HELLO → GROW | 47 / 93 | 19 / 46 |
| GROW → TOGETHER | 45 / 80 | 17 / 52 |
| TOGETHER → GROW | 49 / 76 | 17 / 48 |
| GROW → HELLO | 57 / 83 | 17 / 49 |

Candidate preparation delay remains 240–475ms (baseline 234–455ms); this change
improves moving-page cadence, not a claim to eliminate initial preparation.
Phone curved-leaf images: 64 → 32; desktop: 104 → 52. Desktop median intervals
improved from 98–152ms to 17–29ms in this run. Browser timing varies with the
host; these are observations, not a 60 FPS guarantee.

**Keep for review:** transparent ink and one cached masked illustration per
letter face. **Still pending:** real iPhone reproduction/verification and owner
review. Automated WebKit did not reproduce the reported rectangular background;
the repair removes its live filter/blend dependency from published ink, but the
true device outcome must be checked after an approved release. Not merged or
deployed by this repair task.

## Evidence and reproduction

Browser screenshots and WebM are local review artifacts, not committed batches:

- `test-results/iphone-safari-repair/`: candidate production build, five scenes,
  phone reading zoom, cover and interior poses, desktop/phone continuous video.
- [Open source comparison](open-source-page-turn.md): source review, lab commands
  and timings for the same three interior spreads.

Run `node scripts/capture-safari-repair.mjs <output-directory>` with
`STORYBOOK_TEST_BASE_URL` pointing to a production preview. Default browser is
WebKit; `STORYBOOK_TEST_BROWSER=chromium` selects Chromium. Use
`node scripts/prepare-transparent-ink.mjs` to verify pixel parity against the
pinned source; `--write` explicitly regenerates the PNGs. The pinned Git revision
must be available locally for that optional asset verification script.

Regression coverage includes all 12 transparent ink assets at DPR 3, native vs
cached paint for all five gradients (including WISH's ellipse), book endpoints,
mobile magnification, reduced motion, physical forward/reverse/drag behavior,
customization and sharing. Full test results are recorded when complete.
