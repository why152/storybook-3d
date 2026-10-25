# WebKit endpoint registration — next-session handoff

Owner requested wrap-up due to quota. Integrated CSS curve is implemented;
Chromium full suite passes 33 tests, but full WebKit endpoint screenshot
comparison fails. This is a validation blocker for merge, not proof of a
premium-model requirement. Current AI work was explicitly authorized.

Reproduce:

```sh
npm ci
npx playwright install webkit
STORYBOOK_BROWSER=webkit npx playwright test tests/flexible-paper.spec.ts --grep endpoint
```

Inspect `test-results/` trace/failure screenshot. The test captures each
0/100% turning sheet against the corresponding settled chapter at desktop
and mobile sizes. Its thresholds are mean RGB error <2/255 and <4% pixels
with any channel difference >20, allowing inspected antialiasing differences.
Determine whether WebKit differs only in rasterization or has a real mapping
error before modifying tolerance. Do not claim visual equality from DOM tests.

Relevant files: `Book.tsx`, `paperGeometry.ts`, `.paper-segment*` CSS, and
`tests/flexible-paper.spec.ts`. Current clipped strips reuse actual PageHalf
DOM with reversed backside strip offsets and compensated .75px overlaps.
Source artwork must remain unchanged. No whole-spread rotation, mirrored text,
missing print, or unreviewed main merge. Preserve one spine-bound leaf.

Prior fixes: removed compounded perspective; removed per-image 3D promotion
inside strips to stop raster tile delays; compensated clip overlaps; used
fractional computed CSS widths. Chromium validates endpoints after these fixes.
