# Agent contract — physically paged 3D storybook

> **Owner correction (2026-10-25): THIS IS A BOOK, NOT A FLIP-CARD GALLERY.**
> This goal supersedes the prior "single editorial rotating art card" interpretation.
> All agents, Codex sessions and contributors must honor it before changing code.

## Product goal

Build a **beautiful, presentable, personalized 3D illustrated BOOK demo**.
The central object is a bound open book: a visible central spine/gutter,
**two distinct pages**, and one page physically flipping **from right to left**
(or left to right when going backward) around that shared spine.

A whole landscape image rotating about its own center is **NOT** an acceptable
substitute. It is the bug we are deliberately retiring.

The reference https://howtotalktowhitekidsaboutracism.com/ provides a standard
of editorial art, dramatic lettering, parallax and choreography, **not** permission
to copy assets and **not** a reason to replace book geometry with rotating cards.

## AI-first development policy — owner decision (2026-10-25)

**This codebase is primarily designed, written, revised and maintained by AI agents.**
We have no reason to preserve historical line counts or to protect obsolete
implementations just because earlier iterations took time.

1. **Quality and iteration volume win over minimizing the diff.** Generate
   many alternatives, evaluate them objectively, and keep the version that
   produces the best visible result. Don't optimize for fewer changed lines,
   smaller patches, or sentimental preservation of earlier AI output.
2. **Large refactors and deletions are explicitly allowed.** If the architecture
   has drifted from the product or the renderer cannot deliver the needed
   effect, replace it cleanly; remove abandoned code/graphics and update docs.
   You do not need separate owner permission merely because a justified
   refactor is large.
3. **Fast experimentation must produce tested outcomes.** Increased iteration
   throughput means more high-quality attempts and evidence, not accumulating
   duplicate engines, redundant files, brittle shortcuts or visual gimmicks.
   A major change still needs a reproducible visual regression baseline.
4. **One authoritative implementation per responsibility.** Data and product
   constraints have canonical sources. Do not maintain parallel card/flipbook
   implementations, contradictory guidance, or orphaned visual assets.
5. **Merge in coherent, reviewable milestones.** Stable tests on `main`;
   experiments happen on short-lived branches with genuine screenshot/video
   evidence and a clear rollback path. Do not force-merge unvalidated visual
   experiments simply to increase output.
6. **Goal hierarchy:** physical BOOK behavior and owner experience first;
   editorial craft, character animation, 2.5D depth, mobile usability and
   personalisation next; internal abstraction elegance and historical
   compatibility last. The original reference site is a **craft benchmark**,
   not a command to revert to a whole-card rotation.

## Repeatable AI experiment selection protocol

For every meaningful animation, shader, illustration or book-geometry idea:

1. **Write a falsifiable hypothesis.** State the visual defect and expected
   improvement; establish a static/continuous-motion **baseline** first.
2. **Compare matched conditions.** Reuse the *same original chapter artwork*,
   exact open-book viewport, chapter, camera, animation timestamps, 0/25/50/75/100
   turn poses, mobile sizes and reduced-motion conditions. Do not compare a
   flattering new demo against a deliberately unpolished old screenshot.
3. **Collect human-visible evidence.** Real browser stills and continuous WebM
   footage, pixel-registration/parity checks when extracting original art,
   explicit screenshot QA and frame-time/device measurements where possible.
   CI assertions alone cannot certify artistic improvement.
4. **Decide and prune.** Record **keep / iterate / reject** with rationale and
   source PR/CI in the dedicated Notion task. Merge a validated winner; reject
   experiments that only increase code or animation intensity. Delete outdated
   production implementations after migration. Draft lab PRs may remain
   separate until the user agrees to a visual direction.
5. **Preserve the bound book and accessibility.** No whole-spread card turns,
   drifting artwork during physical paper turns, unlicensed imitation,
   inaccessible reduced-motion behavior or unverifiable claims of GPU speed.

This is how “AI development wins through many attempts” becomes a
**disciplined visual selection process** rather than code accumulation.

## Model-cost discipline and escalation policy — owner decision (2026-10-25)

**Default: solve with the current available agent and ordinary tools first.**
This AI-developed project favors high-volume, inexpensive iterations: source
art, animation keyframes, script tooling, tests, cleanup, integration, small
shader experiments and documentation should be completed without reserving a
premium Codex reasoning model. A task being long or repetitive is *not*
a reason to escalate.

Escalate to a more capable, more expensive Codex model **only if all** are true:

1. The obstacle is material to the finished product (e.g. persistent sheet
   self-intersection, texture UV reversal, shader/scene synchronization,
   unexplained cross-browser 3D bug), **not** ordinary asset creation,
   copy editing, routine architecture or debugging.
2. This agent has made and recorded **multiple substantive attempts**:
   reproduce with a minimal failing case; inspect logs/visual frames;
   test at least two plausible fixes or distinct algorithmic approaches;
   validate failures against the real book geometry and requirements.
3. The attempts reveal an **actual unresolved blocker**, not merely a
   lack of polish or a problem better fixed by rewriting cheap source art.
4. A tightly scoped handoff is ready. Include problem statement, user-visible
   impact, exact failed approaches, links to branch/commit/CI/screenshots/video,
   relevant file paths, reproducible test command, mandatory constraints,
   and falsifiable acceptance criteria. Clearly separate observed evidence
   from untested ideas; identify a narrow target for the high-tier model.
5. The owner explicitly decides whether to spend higher-tier Codex quota.
   Never silently launch a premium model. Continue independent low-cost
   tasks while a hard blocker remains.

**Cost-avoidance principle:** Do not spend premium model capacity to generate
hundreds of SVGs, run routine tests, rename files, write ordinary React code,
or brute-force variants that can be tested autonomously. Allocate it to the
small number of bottlenecks that resist repeated evidence-based attempts.

If repeated cheap attempts succeed, keep the resolution and report it.
If an escalation is warranted, create/update a Notion task under the existing
Storybook 3D database with status **待验证** or **进行中**, clearly marked
"高阶 Codex 候选 — 未升级", and add a precise `docs/blockers/` handoff.
Do not present an unattempted challenge as premium-required.

## Hard visual and behavioral requirements

1. The closed book has a recognizable portrait **front cover**, spine and page edges.
   Opening it reveals a **landscape two-page spread**.
2. Every interior spread has an explicit **left page**, **right page**, central
   **gutter/spine**, page thickness/stack hints, and stable underlying pages.
3. Next: only the **right leaf** rotates around the **center binding** to the left.
   Previous reverses the exact same physical page motion.
   The turning leaf has distinct front/back artwork; typography may never mirror.
4. **No teleporting / ghosting**: at 0/25/50/75/100% of a turn, there must be one
   rotating leaf, correct page stacking, visible opposite page, and no leftover
   180-degree transform on the settled book. Opening/closing cover follows
   these same book-bound rules.
5. Target demo: **five original interior illustrated spreads** plus front cover:
   HELLO → GROW → TOGETHER → DREAM → WISH. Each is one two-page spread, not
   a single card. This is a demo; do not build a backend or storefront.
6. Art stays **original and layered**. The 1200×700 original SVG compositions
   can span an open spread and are sliced at the binding *only by the renderer*;
   maintain separate background, midground, lettering, characters, foreground,
   effects assets (six per chapter) where possible.
7. Preserve working name/message customization, arrows, keyboard and touch.
   Reduced-motion users should see an immediate coherent page state.
8. Treat footage of an authentic browser book turn and side-by-side poses as
   mandatory acceptance evidence; "build green" alone is not visual approval.

## Architecture rules

- Data: a single typed `src/data/story.ts` chapter model. No scene metadata
  duplicated in controls, components, and tests.
- Renderer: `src/components/Book.tsx` owns spine geometry, page halves,
  page flip animation and input lock; `src/components/SceneArt.tsx` owns asset
  planes and the cover. `src/App.tsx` stays thin (navigation + customization).
- CSS: keep only selectors actually used by the active book engine. Remove
  obsolete rotating-card classes, copied overlays, unused components, debug
  experiments and unnecessary dependencies.
- Keep React + TypeScript + CSS 3D + GSAP unless measured visual evidence
  justifies WebGL. Do not make an unnecessary shader rewrite in the demo.
- React elements for turning and settled leaves require distinct keys/identity
  so GSAP transforms cannot leak across states.
- Do not flatten a whole `preserve-3d` tree with ancestor filters or overflow;
  only clip individual page surface imagery where needed.

## Source-of-truth and workflow

1. Read this file, `README.md`, `docs/architecture.md`, `docs/roadmap.md`
   before implementing. If an older document calls the project a *flip-card*,
   this AGENTS contract wins.
2. PR #9 was owner-approved and merged to `main` on 2026-10-25 (merge SHA
   `eff4b60`). Create new targeted branches/PRs for ongoing cleanups and
   experiments. Keep `main` runnable and avoid unreviewed blind overwrites.
3. Original/appropriately licensed work only; do not copy reference artwork,
   code, protected fonts or third-party proprietary assets.
4. Run ESLint, TypeScript, Vite build and Playwright desktop + mobile checks.
   Export real screenshots and a video of **opening the cover** and a
   **forward/backward two-page book turn**, including 0/25/50/75/100% poses.
5. Report concrete observed defects and remaining artistic differences.
   Never present moodboards or static mockups as tested 3D output.
6. No real customer uploads, credentials, backend, payments or database.
   Keep accessibility, swipe/keyboard controls and reduced-motion support.
7. **Project record:** maintain [Notion Storybook 3D hub](https://app.notion.com/p/403d0befadbd81cbaba2e9061105d171)
   and its [quality task database](https://app.notion.com/p/01bcf51dc4b7483798422140f0e36af0)
   after meaningful verified changes. Track PR/commit/CI/video evidence; tasks
   remain `in progress` or `not started` until validation really succeeds.
   Do not silently rewrite unrelated Notion personal records.

## Definition of done for this reboot

- **The object is unmistakably a book.** Two page halves and central binding
  remain visible throughout turn; only one page flips around the spine.
- Five original interior spreads are browsable forward and backward, with cover.
- No mirrored backface, jumping layout, twin-page ghost, clipping shards or
  invisible settled page.
- The structure is small, typed, modular and not burdened with abandoned
  flip-card implementations.
- Authentic browser video and screenshots inspected; CI passing, user visual
  feedback still required for visual direction changes. Ordinary verified cleanup
  can merge when user explicitly requests continued integration.
