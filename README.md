# Storybook 3D — 朋友的来信绘本

一个可分享、可定制的 3D 插画实体书 Demo。当前首发重点是：**把朋友的真实手写信融入原来的五章插画，让它成为一本能打开、能翻页、值得送给朋友的书。**

这是一本书：肖像封面打开后是左右双页与中央书脊，只有一张半宽纸页沿装订处柔性翻动。原参考站只作为美术和动作编排的工艺参考，资产不复制。

## 当前目标

- 保留 HELLO → GROW → TOGETHER → DREAM → WISH 五章原画、独立角色与场景动画。
- 真实 4569 笔迹保留原笔画，随纸页正反面一起翻动；手机能放大读清。
- 封面开合、正反翻、拖动取消、键盘、触摸和减少动态保持连贯。
- 用 GitHub Pages 提供一个可以直接分享的网页。保留已有生日定制和分享功能，先不增加更多产品模式。
- 不做后台、商店、支付、客户上传或新的渲染引擎。

`AGENTS.md` 是书本几何约束的权威来源；[本轮目标与验收边界](docs/product-direction.md) 定义来信优先的成品方向。Notion 顶部记录最新状态，旧报告只是历史证据。

## 主线与工作方式

`main` 已发布 [PR #40](https://github.com/why152/storybook-3d/pull/40)（`9e5fb60`）：封面修正、12 个获准公开的原迹、HELLO 排版与书内放大阅读。在线地址：[朋友的来信](https://why152.github.io/storybook-3d/?story=letter)。

当前收尾分支 `codex/complete-letter-book-20261103` 在已发布版本上统一另外四章、移除独立图片列表阅读，并修复曲页裁切细缝。历史实验不批量合并；原版可通过 Git 回退。项目根目录是唯一开发入口。

截图录像用于判断书本效果，CI 用于发现行为回归。发布只检查页面、素材可加载和实际翻页，不把逐文件哈希作为发布关卡。原稿提取时的源像素验证保留，用于避免切错笔画。

## 代码职责

| 文件 | 职责 |
|---|---|
| `src/data/story.ts` | 五章模型与路由 |
| `src/components/Book.tsx` | 书脊、静止页、翻动页、输入锁和动画 |
| `src/components/paperGeometry.ts` | 柔性纸面几何 |
| `src/components/paperPrint.ts` | 保留角色姿态的印刷快照 |
| `src/components/SceneArt.tsx` | 原画图层、封面与页面合成 |
| `src/components/Handwriting.tsx` | 同一物理页上的真实笔迹 |
| `src/App.tsx` | 导航和定制 |

只有一个书本渲染实现。五章共享物理书页与手机阅读方式，各章按原画安排笔迹与留白。headless WebKit 不代表真实 iPhone Safari；真机手感与用户最终视觉验收仍须明确记录。

## 本地运行与检查

Node 22；使用已提交的锁文件：

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm run build
npm run test:assets
npm run test:actors
npx playwright install chromium webkit
npm run test:e2e
STORYBOOK_TEST_BROWSER=webkit npm run test:e2e
```

- 手写信绘本：`/?story=letter`
- 已有生日绘本：`/`
- 指定章节：`/?story=letter&scene=grow`
- 翻页姿态：`/?story=letter&from=grow&pose=0.5`

原五章保留 30 个 SVG 图层和 14 个可复现的角色精灵。原视频、完整源帧和私有裁切映射在公开仓库外；公开代码只包含用户获准发布的 12 个片段。

## 记录

- [架构](docs/architecture.md)
- [当前路线](docs/roadmap.md)
- [真实笔迹验证](docs/validation/authentic-ink/README.md)
- [封面对照历史证据](https://github.com/why152/storybook-3d/tree/18c343d3a68bdc7820b5191771ef925cd78adead/docs/validation/cover-local)
- [Notion 当前状态](https://app.notion.com/p/403d0befadbd81cbaba2e9061105d171)
