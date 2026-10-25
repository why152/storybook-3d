# Evidence-based premium Codex handoff — TEMPLATE ONLY

> **No blocker is currently approved for premium escalation.**
> Do not fill in a speculative issue or use this template to bypass cheap
> development attempts. The owner explicitly reserves costly high-reasoning
> models for the small number of stubborn, high-impact technical bottlenecks.

## 0. Decision gate

- [ ] Impacts the book's actual user experience or blocks a critical release.
- [ ] Reproduced with a minimal failing example (commands, browser, revision).
- [ ] Attempt A actually implemented and evaluated (not only proposed).
- [ ] Attempt B uses a **materially different** strategy and was evaluated.
- [ ] Relevant build/test logs, five-angle book poses and browser video
      examined; facts distinguish failures from subjective taste.
- [ ] No remaining ordinary asset rewrite, local refactor, open-source
      baseline or cheap additional experiment is likely to solve it quickly.
- [ ] Alternative work has continued while this issue is blocked.
- [ ] User explicitly approves high-tier Codex usage and its narrow scope.

If any item is unchecked, **keep attempting cheaply**; do not escalate.

## 1. One-sentence blocker

> [One narrow, falsifiable technical problem; NOT a broad demand such as
> "make all book animations look professional".]

**User-visible impact:** [Where in the physical book and at what animation
time/pose does the failure happen?]

**Must preserve:** five spreads, physical central binding/half-width leaf,
front/back readability, reduced-motion and mobile fallback, original assets,
no unlicensed reference-site code.

## 2. Minimal reproduction

- Repo/branch/commit: [link]
- Files involved: [exact list, no whole-repo dump]
- Test command or URL (e.g. `/?pose=0.5&from=grow`): [exact]
- Browser/device/build environment: [exact]
- Expected: [observable criterion]
- Actual: [observable difference]
- Evidence: [real screenshots at 0/25/50/75/100%, browser WebM, test logs]

## 3. Attempted and falsified fixes

| Approach | Exact code/commit | Measurement or frame evidence | Reason rejected |
| --- | --- | --- | --- |
| A | [link] | [results] | [actual failure] |
| B (different algorithm) | [link] | [results] | [actual failure] |
| C (optional) | [link] | [results] | [actual failure] |

Note: "I thought about it" is not an attempted fix.

## 4. Precision task for premium Codex

```text
You are investigating ONE proven blocker in the Storybook 3D bound-book
engine. Read AGENTS.md and docs/architecture.md first.

Blocker:
[one sentence]

Minimal failing reproduction:
[URL/command/files]

Observed evidence and two prior failed approaches:
[concise citations to actual commits, logs, screenshot frames]

Hard constraints:
- preserve two facing pages and a single half-width sheet hinging at
  the CENTRAL spine, not a rotating landscape card
- original five-scene art remains aligned 1200x700 with readable reverse
  faces and scene-specific characters
- physical forward/backward turns, mobile and reduced-motion remain usable
- unrelated feature work and bulk SVG generation are OUT OF SCOPE

Task: identify the root cause, implement the minimal coherent durable
fix (large rewrite permitted if justified), and add a regression case.
If no fix meets acceptance, state precisely why and what evidence would
distinguish remaining candidate algorithms.

Acceptance:
[one or two specific assertions, screenshot poses and video behavior]

Do not replace the entire project or work on routine ancillary tasks.
```

## 5. Review of high-tier output

- [ ] Reproduced previously failing case after fix.
- [ ] No regression in `npm run test:assets`, lint, TS, build, Playwright.
- [ ] Five-angle screenshots and continuous real-browser video inspected.
- [ ] User accepted visible improvement; PR integrated or discarded.
- [ ] Notion issue updated with **whether premium escalation paid off**.

The first options remain regular model iteration, targeted experiments,
and available MIT/open-source baselines. Model cost is not an excuse
to leave ordinary implementable work undone.
