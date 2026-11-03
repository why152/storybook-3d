# 五章来信完整版 — 2026-11-03

本轮从已发布的 PR #40 / `9e5fb60` 出发，沿已确认的 HELLO 方向完成其余四章。不更换原画、笔迹、唯一 Book 引擎或产品模式。用户明确授权轻量模型承担批量开发，使用 gpt-6-luna 完成四章版式、统一阅读与相应检查；主代理负责取舍、接缝调查、整体验收与发布。

## 变化与实际视觉取舍

- GROW、TOGETHER、DREAM、WISH 各自安排原迹位置与安静纸面；五章统一直接在书内放大手机左右页。旧图片列表组件及样式删除，原纸条边框/阴影规则也移除。
- 第一版 DREAM 将原角色淡化过度：**iterate**。调整渐变让上部字迹保持清楚、角色与月夜场景在下部恢复可见。原图文件未改。
- 连续录像暴露 GROW 的另一问题：兔子向上运动时头部进入渐变，被明显淡化。**iterate**：让渐变在角色上方结束，保留笔迹上部留白；静态截图通过不足以发现这项问题。
- WISH 保留舞台边缘、蛋糕、原角色与署名/日期。五章共 12 个获准公开的原信片段，读序不变；不宣称逐字收录整段视频。
- 旧 WebKit 浅色曲页存在细竖线。关闭阴影/颗粒/纸边、取消叠底等单项探针不足以解决。新对照显示：单独纸面改用 clip-path 合成裁切后，正面暗线明显消失；反面仍有光照边缘亮线，光照层向裁切外延伸 2px 后进一步改善。**keep**，不调整几何、段数或动画时长，不用整卡代替柔性页。非常斜的纸边仍可看到像素级采样轮廓，不宣称所有设备完全无痕。
- 截图对比使用相同原画、章节、视口、减少动态状态和姿态；仅比较裁切/光照规则。所有临时失败探针留在系统临时目录，不进入产品。

## 验证与证据

ESLint、TypeScript、Vite build、30 原 SVG / 14 角色检查通过。手机书内阅读和五章原迹的定向回归 Chromium/WebKit 各 6 项通过。完整本地回归 Chromium **96 通过 / 8 私有条件跳过**，WebKit **95 通过 / 9 跳过**（8 私有条件、1 CDP）。覆盖 320/390px 阅读、393px DPR3/横竖屏端点、拖动取消、键盘/触摸、减少动态、原角色与生日分享；原像素配准门槛保持不变。远端 CI 与发布以本 PR 和 Actions 最终记录为准。

证据目录 `test-results/complete-letter-book/`（不入 Git）：

- 两浏览器 × 桌面 1440×900 / 手机 390×844，五章静帧和每章左右页放大。
- 封面、HELLO→GROW、GROW→TOGETHER、TOGETHER→DREAM、DREAM→WISH，分别 0/25/50/75/100% 真实浏览器姿态。
- `*-open-forward-back-close.webm`：正常动画下从封面逐章前翻再逐章回翻合书；手机包含每章左右页阅读与还原，无剪辑拼装。
- `frame-times.json`：相同候选五章内容、旧裁切规则与新规则的本机串行测量。无录屏，390×844 / DPR1，每组四次内页翻动；包含准备延迟、帧间隔和闲置纹理回收。结果不代表 iPhone，不与参考站 FPS 比较。

复现：

```sh
COVER_REVIEW_URL=http://127.0.0.1:5178 \
COVER_REVIEW_STORY=letter COVER_REVIEW_FROM=cover,hello,grow,together,dream \
COVER_REVIEW_OUTPUT=test-results/complete-letter-book \
node scripts/capture-cover-review.mjs
STORYBOOK_TEST_BASE_URL=http://127.0.0.1:5178 npx playwright test
STORYBOOK_TEST_BASE_URL=http://127.0.0.1:5178 STORYBOOK_TEST_BROWSER=webkit npx playwright test
```

## 交付边界

本轮交付完整五章来信候选及经过验证的裁切修正。专业参考的插画细节、定制字形和角色精细表演仍更成熟，见 [当前参考差距](../reference-gap-analysis.md)。真实 iPhone Safari 手感和用户最后的视觉确认保留为独立待验收项，不能把浏览器通过写成全部认可。

公开范围仍仅为获准的 12 个 PNG。源视频、完整源帧和私有映射不入仓库、不进入部署包。已发布 `9e5fb60` 可回退；不部署 AWS。
