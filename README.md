# Storybook 3D

私人项目：**可定制的 3D 互动绘本 Demo**。目标是以原创插画、分层视差和 WebGL 翻页呈现逐页叙事体验，并验证未来用于个性化祝福定制的可复用性。

## 产品目标（Demo）

- 一套 3D 翻页引擎，可展示封面与至少 3 个故事页面，页面支持正反两面。
- 尽量贴近参考视频的交互语言：硬质页面围绕竖轴翻转、空间透视、图层视差、翻页后的局部动画、舞台式背景。
- 场景使用数据驱动配置；姓名、祝福文案及素材能够替换，而非硬编码。
- 支持桌面端和移动端基础浏览；在无法运行 WebGL 时有明确降级体验。
- 插画使用**原创**素材；参考作品只用来讨论视觉与交互，不拷贝其源码和受保护的美术素材。

## 非目标（首轮不做）

账号、订单、付费、数据库、完整可视化编辑器、AI 自动绘本生成、视频导出、生产环境商业部署。

## 技术初选

- Vite + React + TypeScript
- Three.js + React Three Fiber
- GSAP（协调翻页、镜头和场景时间轴）
- WebP/PNG 及 JSON/TypeScript 场景数据
- 后续如性能与视觉需要，再评估 Shader、纹理图集和 Rive

## 协作方式

- **ChatGPT**：视觉概念、插画与分层素材、需求拆分、验收与 Review。
- **Codex**：实现、调试、测试、提交分支及 Pull Request。
- **项目负责人**：本地验收实际浏览器效果，决定是否合并。
- **GitHub**：唯一的代码与工作项记录中心。

默认分支 `main` 保持可运行；每个任务独立开发并创建 PR，避免直接将实验性改动推送到主分支。

## 文档

- [技术架构](docs/architecture.md)
- [视觉与素材规范](docs/art-direction.md)
- [里程碑及验收标准](docs/roadmap.md)
- [Codex 协作约定](AGENTS.md)

## Run the prototype

Requires Node.js 22 or later and a browser with WebGL.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). Use the left/right arrow keys or the arrow buttons to flip pages. Edit the recipient name and final wish in the right-hand panel; canvas textures update from the shared typed scene data.

Checks:

```bash
npm run typecheck
npm run build
```

The demo uses original artwork procedurally drawn in `src/engine/textures.ts`. This is deliberate placeholder art, not a generated PNG layer kit. Refined art assets will replace it after visual approval.

## Implementation status

- **Implemented on feature branch**: real 3D leaf rotation, front/back textures, layered depth offsets, a four-page story, dynamic text fields, keyboard navigation and reduced-motion behavior.
- **Not yet visually verified**: cross-browser page occlusion, animation timings, page-turn fidelity and GPU performance.
- **Not implemented**: custom shader paper deformation, authentic page-shadow treatment, production order flows, assets upload and mobile device testing.

**Do not merge the prototype PR into `main` before build and browser QA.**

## 参考

- 用户提供的 3D 互动绘本视频为体验标杆；其可视设计和实现不视为开源素材。
- 原创 Demo 优先选择具有明显可分层元素的插画风格，以验证 2.5D/3D 空间效果。
