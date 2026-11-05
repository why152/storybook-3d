# 五跨页定制绘本交付

运营方排版并出包。封面与五个插画跨页共用现有实体书渲染器。每本绘本配置标题、副标题、署名、封面、十个单页的文字、选填照片与配乐。

## 从样册出包

```sh
npm ci
npm run book:build -- examples/books/afterglow/book.json
npm run book:build -- examples/books/stargazer/book.json
python3 -m http.server 5186 --bind 127.0.0.1 --directory build/books
```

- 《晚风来信》访问 `http://127.0.0.1:5186/afterglow/releases/v1/`，使用内置配乐。
- 《给追星的你》访问 `http://127.0.0.1:5186/stargazer/releases/v1/`，关闭配乐。

两个样册使用虚构人物与原创几何样图。样例输入在 `examples/books/`。制作新册时复制一个样例到工作区之外，在同一目录准备配置和素材，换成独立的 `id` 和初始 `version`。命令接收绝对路径。目录内的素材路径须相对于 `book.json`，文件可放在其子目录。

## 配置规格

| 字段 | 规则 |
| --- | --- |
| `id` / `version` | 小写字母、数字、单连字符，最长 48 字符 |
| `title` / `subtitle` / `author` | 分别最多 8 / 20 / 12 字符 |
| `cover` | 选填，建议 600×760 或同宽高比，省略时使用内置封面插画 |
| `spreads` | `hello`、`grow`、`together`、`dream`、`wish`，顺序固定 |
| 每个跨页 | `word` 导航标题最多 8 字符，`left` / `right` 各配置一页 |
| 每个单页 | `kicker` 最多 10 字符，`lines` 一到三行，每行最多 14 字符，`signature` 选填、最多 12 字符 |
| `photo` | 选填，填写 `{ "file": "keepsake.webp", "alt": "图片说明" }` |
| `music` | `"default"` 使用内置曲目，`"off"` 关闭，或填写下述自备曲目信息 |

封面及照片接受 PNG、JPEG、WebP，每个文件最多 2 MB。照片建议使用横图，封面建议在上部为标题留出深色区域。配乐自备时填写 `file`（MP3，最多 8 MB）、`title`、`author`、`source`（原始曲目 HTTPS 地址）、`license`（许可名称）、`licenseUrl`（HTTPS 地址），选填 `changes`（编辑说明）。配乐与照片在交付前应取得对应发布授权。交付包保留所用内置曲目的署名与编辑说明。

## 发布和回退

- 交付目录是 `build/books/<id>/releases/<version>/`。发布该目录中的文件，链接以 `/` 结尾。静态托管时可以放在任意路径前缀下。
- 每本书独立托管。只上传所选版本的目录，输入配置、其他书的目录、源码与原信笔迹均在交付目录之外。静态包的正文和图片能被链接访问者读取及下载。客户确有访问限制要求时，须先在托管层配置权限。
- 改稿提高 `version` 后出包。旧包保留，可重新发送旧链接。若使用固定链接，由托管方将这一本书的入口切回旧版目录。避免把生成过程直接指向线上目录。
- 每本发布前检查封面、五个跨页、手机左右页放大、正反翻及反悔落回、照片位置、文字可读性、配乐与署名。将版本链接、验收证据和回退版本记入项目任务。

## 复现浏览器验收

```sh
npm run test:e2e -- tests/commercial-template.spec.ts
STORYBOOK_TEST_BROWSER=webkit npm run test:e2e -- tests/commercial-template.spec.ts
```

上面的测试用临时配置重复出包，在独立路径核对两册与修订版。它验证版本拒绝覆盖、旧版重开、原信内容隔离、手机单页放大、全书往返、反悔落回，以及半翻时照片写入不透明纸面。测试截图在 `test-results/`。

若已按上文启动本地静态服务器，可以导出连续开封及正反翻录像，并保存封面与内页 0/25/50/75/100% 姿态。

```sh
STORYBOOK_TEST_BROWSER=webkit \
STORYBOOK_TEST_BASE_URL=http://127.0.0.1:5186/afterglow/releases/v1 \
STORYBOOK_CAPTURE_FROM=cover,hello,grow \
node scripts/capture-safari-repair.mjs test-results/commercial-final-webkit
```

《晚风来信》使用 WebKit，《给追星的你》使用 Chromium 导出桌面和 390×844 手机视口录像。已检查封面标题、五跨页文字与插画、书脊和半翻照片的位置。iPhone Safari 真机及公开交付仍待验收。

慢速网络验收包含开封前等待首张照片。后续翻页也会预先解码即将露出的固定页照片。
