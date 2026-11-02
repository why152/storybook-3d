# 封面对照证据归档

2026-11-02 的 main / PR #36 / 修正版匹配截图及连续录像，保存在不可变提交 [18c343d](https://github.com/why152/storybook-3d/tree/18c343d3a68bdc7820b5191771ef925cd78adead/docs/validation/cover-local) 和工作区外的本地归档中。

当前源代码树不再重复保存整套历史视频。现行浏览器检查继续生成实际截图录像到忽略的 `test-results/`，CI 将其作为评审产物保存。

需要重现对照时，用 `scripts/capture-cover-review.mjs` 捕获对应版本，再用 `scripts/build-cover-review.py` 汇总；默认产物也位于 `test-results/cover-review/`。
