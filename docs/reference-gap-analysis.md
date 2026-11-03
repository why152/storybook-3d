# 当前参考差距复核 — 2026-11-03

本轮重新查看了[参考项目实时网站](https://howtotalktowhitekidsaboutracism.com/)的封面、开篇双页和 EDUCATE 场景。此前提及的原始参考视频未在本次可定位的本地文件中找到，因此不声称重新逐帧比对了那段视频。下方 2026-10-25 报告仅作历史依据。

| 维度 | 本轮实际观察 | 当前来信绘本与差距 | 本次礼物范围 |
| --- | --- | --- | --- |
| 核心阅读 | 参考从封面进入分章节叙事 | 我们已有五章、中央装订、单张柔性纸页和真实来信选段 | 必须保留并通过整本验收 |
| 构图和字体 | 开篇留白克制；EDUCATE 巨型定制字形融入博物馆场景 | 我们的原画更简洁，真实笔迹成为视觉主线；不适合照搬巨型英文标题 | 本轮统一五章，保持字迹清楚和角色可见 |
| 插画工艺 | 参考人物、手绘纹理和场景细节更丰富 | 原兔子/狐狸一致且原创，但形状、材质和场景细节仍明显简单 | 后续美术提升，不为此重做已完成的礼物 |
| 角色与空间动作 | 参考场景有编排过的层次与动态 | 我们保留分层视差和独立角色轻动作，未达到精细的关节/表情表演 | 保持稳定，避免为了热闹遮住来信 |
| 手机阅读 | 未对参考做完整手机设备实测 | 我们有实际书页放大及双浏览器窗口测试；真实 iPhone Safari 手感未验证 | 真机验收明确保留 |
| 性能 | 没有参考站同设备帧时间基线 | 不比较 FPS，不从视觉印象推断更快 | 只报告自己实测条件与慢帧 |

**结论：** 功能链路接近本次私人礼物的完成边界；与专业参考的差距主要在美术工艺和动作细节。它们不是同一个“完成度百分比”。不以追平整个专业网站为交付前提，也不宣称已达到参考水准。

---

# Reference gap review — 2026-10-25

## Sources and scope

- Original live project: https://howtotalktowhitekidsaboutracism.com/
- Original author's case study: https://www.hellomonday.com/work/how-to-talk-to-white-kids-about-racism
- Secondary agency case study: https://www.dept.global/case/how-to-talk-to-white-kids-about-racism/
- Our baseline: `main` merge `eff4b60` from PR #9; five-chapter
  illustration book, React+CSS 3D+GSAP, real browser tests in
  https://github.com/why152/storybook-3d/actions/runs/40124556778.

**Important difference in intended output:** the reference site presents a
handcrafted editorial faux-2.5D flipbook; the user explicitly wants a
**physical two-page book with a hinged central spine**. The original site is a
benchmark for *craft*, not a mandate to clone its page geometry, copy its
educational content, or undo the approved book-first architecture.

## What the reference actually claims

The official agency case study explicitly describes a **custom WebGL parallax
shader** capable of displacing individual per-page illustrations in a
**single draw call**. It also credits professional UI/UX, concept,
illustration, copywriting and development work. The public site carries
a narrative around educating oneself, privilege, diversifying heroes,
friendships, responsibility, action and challenging intolerance, and includes
links to additional resources.

We do **not** possess the original unpublished code or a reliable performance
trace. Claims about their exact FPS, implementation classes, CMS, number of
internal layers per scene, or production workflow would be speculation.

## Gap matrix

| Category | Verified original | Our current demo | Gap | Priority |
| --- | --- | --- | --- | --- |
| Bound-book geometry | Faux-2.5D flipbook experience | Physical two-page spine and half-leaf turns | Intentionally **different** | Preserve |
| Illustration | Editorial artwork with bespoke characters/scenes | 5 original vector stories, 30 source SVG planes | Characters, detail and print texture less refined | P1 |
| Distinct typographic direction | Scene-specific illustrated display lettering | Distressed SVG words + accessible Chinese HTML copy | Better scene-specific letter silhouettes, balanced composition needed | P1 |
| Depth/parallax | WebGL shader displaces illustration elements | Mouse-controlled differential flat SVG plane offsets | Lacks nonlinear depth and per-object responsiveness | P2 |
| Character acting | Illustrations/scene movement integrated | Mostly decorative particle float | Needs independent gestures and story beats | P1 |
| Page dynamics | Hand-authored transitions | Hinge rigid half-sheet, GSAP | Introduce convincing paper bend / directional light if possible | P2 |
| Mobile readability | Responsive interactive project | Book works in Playwright; printed text extremely small on 390px devices | Make entire narrative readable outside miniature page | P0/P1 |
| Narrative | Structured educational progression and links | 5 linear birthday chapters + customizable last note | More varied per-chapter interactive moments | P2 |
| Performance | Single-draw-call shader stated; no public FPS | Multiple SVG planes per physical half and GSAP | Measure actual paint, layout and memory before adding shader | P2 |
| Product features | Purpose-built web experience | Customizable name/wish with basic drawer | Better preview UX, no deploy/share pipeline yet | P2 |

## Concrete next experiments and acceptance

1. **Baseline integrity (do now):** use a 5-scene `test:assets`
   validator in CI for manifest, SVG coordinate system and safety.
   Keep `main` on one book engine and one canonical data model.
2. **Readable mobile story (do now):** separate full-size 12–15px
   narration below the actual small two-page drawing. Book itself must
   retain its proportions; 390×844 real-browser screenshot/DOM test.
3. **Character acting:** each chapter's `characters.svg` currently
   combines rabbit and fox. Split to independent character/material
   sprites, animate motion paths, gestures and easing, and review
   a full real 8–12-second video. Preserve original copyright.
4. **Paper movement:** prototype subtle shape/hinge lighting under
   forward and reverse turn; don't reintroduce a whole landscape
   flip-card. Screenshot 0/25/50/75/100 and compare side-on continuity.
5. **Shader/parallax evaluation:** small isolated WebGL experiment
   only if a visible improvement survives real mobile FPS/CPU checks;
   keep fallback CSS page physics.
6. **Visual QA protocol:** evaluate artwork density, type, color,
   spine seam, border, character consistency and legibility; owner
   decides when to replace current illustrations wholesale.

### Release gates

- Typecheck, ESLint, asset contract, Vite production build and Playwright
  desktop/mobile all pass.
- Video from real Chromium shows **opening + next + previous**, with no
  clipped scene planes, phantom book cover or inherited transforms.
- Future "fidelity" estimates must state their rubric; don't invent
  a pseudo-scientific similarity percentage. A passing CI build is not
  sufficient for visual craft approval.
