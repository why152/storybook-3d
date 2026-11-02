# HELLO 来信样章：2026-11-02

目标见 [product-direction.md](../product-direction.md)。技术基线 `fded90c` / PR #39 保留；本轮仅重排 HELLO，另四章尚未推广。没有合并或部署。

## 实现与观察

- 首章去掉纸条边框和阴影，原迹放在上部留白，原场景/兔子/狐狸保留在下方。巨型英文层降为淡底纹。原 30 SVG / 14 角色和 12 PNG 文件未改。
- 原迹在浏览器中做灰度、亮度和对比度纸色中和，并与页面正片叠底；只改变显示色调，不重绘笔画。原视频清晰度仍是上限。
- 手机放大同一 Book 的左页/右页。没有第二套阅读页面；放大时禁止抓页，前后翻/键盘导航先回到双页。Escape、退出手机宽度恢复全貌。首章取消独立原迹图片列表，其他四章尚沿用旧排版。
- 书脊、单张柔性半页、封面修正和原角色动画保留，生日定制/分享没有迁移或删除。

## 实测

Node 22：ESLint、TypeScript、Vite 构建、30 图层与 14 原角色检查通过。

完整本地浏览器回归：Chromium **96 通过 / 8 私有素材检查跳过**；WebKit **95 通过 / 9 跳过**（8 私有检查、1 CDP）。新增检查覆盖 320/390px 左右页放大、同一 Book 实例、读字拖动不翻页、缩放后前后翻、横屏恢复，以及 1440/390px 首章正反端点实际像素比较（原门槛 2，不放宽）。桌面和手机五章 12 原迹均正常加载。

独立录制 Chromium/WebKit × 桌面 1440×900 / 手机 390×844：封面和 HELLO→GROW 的五姿态、原始连续开书/前翻/回翻/合书；手机录像包含左右页放大和恢复全貌，四次录制未捕获 JS pageerror。已查看桌面、手机、曲页静帧及 WebKit 手机录像抽帧。

基线和候选使用同一章、原画、视口和 reduced-motion 静态姿态。桌面书本尺寸相同；手机书宽保持相同，页面位置按新阅读布局调整。连续录制启用正常动画。点击至落页约 1.34–1.76s，包含既有 1.28s 动画，**不代表帧率或性能提升**。

## 决策：keep for review / iterate

保留首章作为视觉评审候选，不把样章成功解释为整本完成。

旧 WebKit 曲页在 25% 等中间姿态有细竖向接缝，新浅色纸面更容易看见。基线同姿态可复现。临时对照关闭阴影、页边、颗粒、叠底、移除重叠或给条带加底色均未消除；未把无效试验并入源码。曲页接缝继续待修，真实 iPhone Safari 尚未验收。是否推广新视觉方向须看用户反馈。

## 复现与证据

```sh
npm run dev -- --host 127.0.0.1 --port 5178
COVER_REVIEW_URL=http://127.0.0.1:5178 \
COVER_REVIEW_STORY=letter COVER_REVIEW_FROM=cover,hello \
COVER_REVIEW_OUTPUT=test-results/letter-redesign/candidate \
node scripts/capture-cover-review.mjs
STORYBOOK_TEST_BASE_URL=http://127.0.0.1:5178 npx playwright test
STORYBOOK_TEST_BASE_URL=http://127.0.0.1:5178 STORYBOOK_TEST_BROWSER=webkit npx playwright test
```

交互样章：`/?story=letter&scene=hello`；从封面开始：`/?story=letter`。

本机完整对照页：`test-results/letter-redesign/review.html`。截图和连续 WebM 在同目录 `baseline/`、`candidate/`，均为忽略的浏览器产物，不重复提交大批二进制。基线源码可从原 PR #39 / `fded90c` 恢复。CI 新增的手机阅读截图进入常规 Actions artifact。
