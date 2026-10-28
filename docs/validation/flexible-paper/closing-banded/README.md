# Closing evidence — banded print / native lettering

Decision: **iterate**, not accepted for merge or deployment. See
[implementation, current validation and remaining work](../../../flexible-paper.md).

- `manifest.json`: exact source hashes, baseline, matched capture conditions.
- `verification.json`: current full-suite counts and limitations.
- `*-grow-poses.png`, `*-cover-poses.png`: matched rigid/flexible five-pose contacts.
- `*-flexible-grow-*.png`: full-resolution candidate interior poses.
- `*.webm`: untrimmed authentic browser opening, forward, backward and closing.
- `*-video-contact.png`: sampled candidate video frames, inspected at closure.
- `*-timings.json`: whole-sequence rAF intervals, including preparation.
- `chromium-393-regression/`: actual failing reference/turn frames and metrics.

Chromium: 42 passed / 1 failed (393px, DPR 1 reverse endpoint after resize;
later DPR 3 branch not reached). WebKit: 42 passed / 1 skipped (Chromium-native
CDP touch). Pixel gates remain unchanged. Automated mobile viewports do not
certify real-device performance. Closing commit intentionally skips cloud CI;
local results are evidence, not a passing remote CI check.
