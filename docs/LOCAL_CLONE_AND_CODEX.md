# Clone locally — start here before spending premium Codex quota

This repository is **an AI-developed, original, five-chapter, bound 3D
illustrated book**, NOT a whole-spread rotating card. Read root `AGENTS.md`
and `docs/architecture.md` before touching the page renderer.

## 1. Reproduce the currently accepted project

Requires Node.js **22**, npm, Git and Chromium (Playwright downloads this).

```bash
git clone git@github.com:why152/storybook-3d.git
cd storybook-3d
nvm use 22                # if using nvm; otherwise select Node 22 manually
npm ci --no-audit --no-fund
npm run qa:browser:setup
npm run qa:local
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173. The output of `qa:local` contains:

- `test-results/review.html`: portable offline index of browser screenshots
  and screen recordings, searchable by filename.
- `test-results/qa-readiness.md`: 2 viewports × 5 chapters baseline table.
- `test-results/qa-readiness.json`: structured asset and DOM statistics.
- A real cover/forward/backward book-turn WebM and pose screenshots.
- Visual actor motion clips showing five story chapters.

**Dependencies:** the integrated flexible-paper branch commits `package-lock.json`;
use `npm ci` for the recorded dependency tree. Historical lab branches may
still require `npm install`.

Local quick checks:

```bash
npm run test:actors   # 14 transparent sprites exactly match source chapters
npm run test:assets   # all 5 chapter artboards aligned and locally referenced
npm run lint && npm run typecheck && npm run build
npm run qa:baseline   # refresh 10 still-frame/DOM baseline captures
npm run qa:gallery    # rebuild the offline gallery from test-results
```

## 2. Inspect the *physical* bound-book invariants

| What | Local URL | Verification |
|---|---|---|
| Front cover | `/` | Portrait cover with real binding |
| First chapter | `/?scene=hello` | Two independently cropped paper halves |
| Final chapter | `/?scene=wish` | Editable birthday message |
| One mid-turn pose | `/?pose=0.5&from=grow` | Half-width leaf hinges at CENTER book spine |
| Pose sequence | `/?pose=0&from=grow` to `/?pose=1&from=grow` | Front/back text not mirrored |
| Opening cover | `/?pose=0.5&from=cover` | Cover hinges, book unfolds, not full-card spin |
| Original vs actors | `/art-inspector.html?scene=wish&actors=1` | Same original 1200×700 art registration |

**Do not swap back to a spinning full landscape card.** The user explicitly
rejected that earlier interpretation. The goal remains a *paper book*.

## 3. Research branches — do NOT merge by default

The current owner-authorized AI is integrating flexible paper on
`codex/spine-bound-flexible-paper`; see `docs/flexible-paper.md`. The historical
WebGL experiments remain independent candidates.

The expensive-model task is **not** “rewrite everything with WebGL.”

| Work | PR / branch | Status |
|---|---|---|
| One-pass illustration parallax (original GLSL) | [PR #11](https://github.com/why152/storybook-3d/pull/11), `experiment/custom-webgl-parallax` | Experimental Draft; real shader compiles, no real-device performance approval |
| Curved paper vertex shader (two A/B candidates) | [PR #12](https://github.com/why152/storybook-3d/pull/12), `experiment/curved-page-webgl` | Experimental Draft; still needs correct integrated paper/UV/lighting/perf |
| Five-chapter registered character acting | [PR #13](https://github.com/why152/storybook-3d/pull/13) | Merged to `main`; original source retained |
| High-model quota and escalation rules | [PR #14](https://github.com/why152/storybook-3d/pull/14) | Merged to `main`; rules in AGENTS.md |

For lab evaluation, *without touching main*:

```bash
git fetch origin experiment/custom-webgl-parallax experiment/curved-page-webgl
git switch -c inspect-curved origin/experiment/curved-page-webgl
npm ci --no-audit --no-fund
npm run dev -- --host 127.0.0.1
# http://127.0.0.1:5173/labs/paper-curl.html
```

Other lab: switch to `experiment/custom-webgl-parallax` and open
`/labs/parallax-shader.html?scene=hello`.

The shaders are written by us and licensed art is original. The external
inspiration's *publicly described principles* are not its unpublished source.

## 4. Cost gate before handing a problem to a higher-tier model

**Use ordinary AI and scripts** for adding source art, splitting SVGs,
creating tests, polishing typography, CSS choreographies, validation,
reproducing failures or implementing normal React features. Do not put
hundreds of PNG/SVG generation or routine cleanups into the premium request.

Upgrade ONLY when a real impact remains unsolved after **two different
implemented and evaluated approaches**, with linked commits, failed test
case, screenshot/video, and a narrow acceptance criterion. Ask the owner
to approve the premium model invocation; don't launch it automatically.

The explicit handoff format is:
[docs/blockers/HANDOFF_TEMPLATE.md](blockers/HANDOFF_TEMPLATE.md).

**Current confirmed premium-required blockers: none.**
Candidate research problems below are NOT proven blockers yet:

- Improving sheet curl around the real spine without clipping/UV mirroring;
- Correctly compositing six independent 2.5D actors on curved front/back
  paper without drifting away from the paper or doubling textures;
- Matching custom parallax sophistication with acceptable real-phone power
  and frame-time; this requires *device evidence* before escalation.

All these can and should first be explored with ordinary iterations.

## 5. One compact briefing prompt for a premium Codex session

Copy only when there is an actual prepared blocker:

> Read `AGENTS.md`, `docs/architecture.md`, and the SINGLE prepared
> `docs/blockers/<problem>.md` file. Work on that *specific proven blocker*
> and its reproduction only. A physically bound two-page book with a center
> spine is mandatory; whole-card flip regressions are forbidden. You may
> rewrite code if required, but do not do ordinary SVG creation or unrelated
> refactoring. Review the two prior attempts and linked browser evidence,
> fix the root cause with targeted tests, and report the 0/25/50/75/100
> screenshots and a forward/reverse browser video. If not solvable, state
> precisely what evidence would distinguish the remaining hypotheses.

Before using this prompt, create a **filled** problem file from the
handoff template and have the owner approve. Otherwise stay with cheap AI.

## 6. Project management and decision provenance

[Notion project hub](https://app.notion.com/p/403d0befadbd81cbaba2e9061105d171) /
[task database](https://app.notion.com/p/01bcf51dc4b7483798422140f0e36af0).

Track “implemented,” “passed CI,” “visually approved,” and “on a real device”
as **separate** states. A lab screenshot does not establish production
performance. An unfinished shader candidate is not automatically a blocker.
