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

## Closing checkpoint — 2026-10-28

This is a recoverable local-development checkpoint in [Draft PR #20](https://github.com/why152/storybook-3d/pull/20).
It is **not a release**, not merged into main, and not deployed to AWS.

### Kept implementation

- Thirteen connected half-leaf strips, shared binding and explicit front/back
  visibility. The cover keeps its rigid physical hinge.
- Per face, cache two transparent/opaque PNG bands around the **original native
  SVG lettering**. SceneArt uses its existing illustration slot, native HTML
  captions, paper grain and corner clipping. No source artwork was changed.
- Preserve actual actor/effect transforms and lettering origin. Decode printed
  resources and give them a display transaction over the retained outgoing
  spread before advancing the underpages. Revoke blob URLs on replacement,
  cancellation and unmount; settle both encoders before error cleanup.
- Reduced motion now disables CSS animations and transitions. The previous
  global 0.01 ms duration enabled unwanted transitions and kept effects looping.
- Pose previews start on their actual outgoing chapter instead of the cover.
  One paper-corner CSS variable governs settled and printed outer corners.

### Verification at closure

ESLint, TypeScript and the Vite production build passed. Full local production
preview suites were executed against the same immutable build:

| Browser | Result | Scope/remaining failure |
| --- | --- | --- |
| Chromium | 42 passed / 1 failed | Existing cover, five chapters, acting, keyboard/touch, customization, locking and standard endpoint checks pass. New 393×852 reverse endpoint after resizing fails: mean RGB 3.8553, required <2. |
| WebKit | 42 passed / 1 skipped | All executed checks pass, including expanded 393px, DPR 3 and resize pixel cases. Only Chromium-native CDP touch input is skipped. |

The expanded Chromium test stops at its first failing 393px/DPR 1 reverse case;
its later DPR 3 branch is therefore **not certified by that run**. All original
pixel limits remain unchanged: full-book mean RGB <2/255 and changed pixels <4%;
interior painted viewport mean <3/255. Before adding the expanded cases, the
standard Chromium suite passed 43/43. Do not substitute that older result for
the current 42/1 result.

Reproduce the remaining issue:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 5175 --strictPort
# In another terminal:
STORYBOOK_TEST_BASE_URL=http://127.0.0.1:5175 npm run test:e2e -- tests/flexible-paper.spec.ts -g 'endpoint print'
```

The test retains both reference/turning frames and metrics on failure. The
closing evidence directory includes that exact pair, so the next session can
start from a concrete failure instead of repeating exploratory checks.

### Visual evidence and limits

[Closing evidence](validation/flexible-paper/closing-banded/) contains matched
five-pose contacts, authentic opening/forward/reverse/closing videos, original
source hashes, benchmark data and the Chromium regression frames. Capture uses
the same original art, camera and viewport. Both variants' reduced-motion stills
are neutralized consistently; normal-motion recordings keep real acting.

The recorded rAF intervals include preparation and the complete four-turn
sequence. They describe local automated browser viewports, **not real-phone GPU
performance**. Whole-sequence rAF interval p95 (milliseconds):

| Browser / viewport | Rigid baseline | Flexible candidate |
| --- | ---: | ---: |
| Chromium desktop | 16.8 | 33.4 |
| Chromium mobile | 16.7 | 16.7 |
| WebKit desktop | 26 | 95 |
| WebKit mobile | 25 | 59 |

Sampled continuous-video frames show a bound book, a single turning leaf and
readable front/back artwork in both engines. The native-lettering/banded candidate improves correctness but
still has visible segmentation and insufficiently smooth WebKit motion. Keep
this as **iterate**, with user/real-device artistic acceptance outstanding.

### Pruned experiments and prior evidence

- Whole repeated page DOM and nested 3D variants could lose the WebKit midpoint.
- HTML snapshot reconstruction changed native paper/text and its dependency
  was removed. Full flattened PNG lettering sampled differently across engines.
- A complete SVG print per strip was too expensive; its historical comparison
  remains in [svg-candidate/](validation/flexible-paper/svg-candidate/).
- Full native paper containers with repeated shadows, viewport pixel-fitting,
  CSS-grid/used-width changes and composed reverse-projection attempts did not
  satisfy the expanded regression. They are not production alternatives here.
- The single flattened-PNG trial's WebKit p95 values (59 ms desktop / 30 ms
  mobile) are historical and do not describe the final banded/native-lettering
  configuration. Use the closing benchmark JSON for this checkpoint.

Previous checkpoints: `5462233` and `bc6c9bc`. Their CI and passing subsets do not
certify newer code. The prior `bc6c9bc` CI run is
[40341197492](https://github.com/why152/storybook-3d/actions/runs/40341197492).

### Next bounded work and synchronization policy

1. Fix the 393px Chromium reverse/resize print registration, preserving the
   original art and strict pixel gate. Then finish Chromium high-DPR validation.
2. Reduce visible strip seams and WebKit frame stalls; compare matched real
   footage before selecting a renderer. No backend or peripheral features.
3. Obtain local user/real-device visual review before final deployment.

The owner requested less frequent synchronization for a free account. Batch
GitHub and Notion updates at a verified milestone or the end of a work session.
This closing WIP commit skips cloud CI intentionally; local full-suite results
and known failures are recorded above. Run fresh dual-browser CI when a later
candidate is actually ready for integration. Never merge or deploy by treating
skipped CI as a passing check.
