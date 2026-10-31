# V2 visual evidence — first prototype
- Canonical user reference: the original ~30s video \`1.mp4\` (held privately by user; do NOT upload).
- V1 baseline: published GitHub Pages commit \`7bb9f5c\`, with browser-video and screenshots in workflow artifact from run 41028300300.
- V2 hypothesis: increase mobile book width without zero-size grid / 24px tap targets, add a fully original illustrated portrait cover, improve typography and warm gallery context.
- Tests introduced: 390×844 actual scene visibility, 48px arrow hit areas, cover SVG load, chapter navigation, no horizontal overflow. Existing 50 Chromium / 49 WebKit baseline checks still apply.
- This is **not G1 signoff**: HELLO and GROW illustration art direction still uses V1 SVGs, and physical paper motion was not reworked. User must review visual evidence before any merge.

## 2026-10-31 updated evidence protocol

Added `tests/v2-drag-evidence.spec.ts`: continuous desktop/WebKit frame-by-frame drag and reverse while pointer is still held; screenshot captures for 0/25/50/75/100 percent poses. Also added `tests/letter-story.spec.ts` for all five non-birthday 4569 scenes and attribution. Real-device Safari and owner aesthetic acceptance still required before claiming true paper realism.
