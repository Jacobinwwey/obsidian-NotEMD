# GitHub Pages 语言与 GEO 工作流

语言: [English](./github-pages-language-geo-workflow.md) | **简体中文**

本文记录 `website/` 当前的公开文档站门禁。它与插件 runtime i18n、Slidev export 验收是三条不同轨道。

## 当前契约

文档站当前只发布一个完整语言面和一个部分语言面：

1. 英文是完整 canonical 文档面，路径为 `https://jacobinwwey.github.io/obsidian-NotEMD/docs/...`。
2. 简体中文当前只发布首页和 FAQ。
3. Docusaurus 仍可能生成未翻译的 zh-CN fallback docs，但这些页面必须标记 `noindex,follow`，并从 zh-CN sitemap 排除。
4. zh-CN 首页上指向未翻译文档的入口必须回到 canonical 英文 URL，不能进入 `/zh-CN/docs/...` fallback 页面。
5. `llms.txt` 必须声明同一语言边界，避免 answer engine 推断出不存在的完整多语言覆盖。

## 已落地门禁

阻断式门禁是：

```bash
cd website
npm run build
npm run audit:build
```

`npm run audit:build` 执行 `website/scripts/audit-build.cjs`。脚本审计的是 build 产物，而不只是源码：

1. root 页面存在：`build/index.html` 与 `build/zh-CN/index.html`；
2. root 页面具有预期的 `lang`、canonical URL 与 WebPage JSON-LD URL；
3. zh-CN 首页把未翻译 critical docs 链到 canonical 英文 URL；
4. zh-CN 首页把 FAQ 保持在 `/zh-CN/docs/faq`；
5. 未翻译 zh-CN docs 输出 `noindex,follow`；
6. 已发布 zh-CN FAQ 不输出 `noindex,follow`；
7. sitemap 包含 canonical 英文 docs，并排除未翻译 zh-CN docs；
8. `llms.txt` 记录语言范围。

GitHub Pages workflow 现在会在上传 Pages artifact 前运行这个审计：

```text
.github/workflows/deploy-docs.yml
  -> npm run build
  -> npm run audit:build
  -> upload-pages-artifact
```

## Source Ownership

语言发布范围由这一处共享：

```text
website/src/lib/publishedLanguageScope.js
```

当前值：

```text
publishedZhCnDocIds = faq
publishedZhCnDocPaths = /docs/faq
```

这个模块被三处消费：

1. `website/docusaurus.config.js` 用于 sitemap 过滤；
2. `website/src/theme/DocItem/Layout/index.js` 用于 fallback doc 的 `noindex,follow`；
3. `website/src/pages/index.js` 用于 zh-CN 首页路由。

这样可以避免旧问题：sitemap、noindex 与首页链接各自维护一份 “FAQ 例外”，后续很容易漂移。

从 zh-CN 页面渲染 canonical 英文链接时，应使用 canonical origin-relative path，并显式设置 `autoAddBaseUrl: false` 与 `data-noBrokenLinkCheck`。Docusaurus 的 broken-link 检查基于当前 locale route table，这类有意的跨 locale 链接不能被“修”回本地化 fallback 路由。最终路径是否正确由 `npm run audit:build` 负责验证。

## 之前错在哪里

此前 Pages 状态已经比旧 roadmap 好，但仍未闭环：

1. Docusaurus 会生成未翻译的 zh-CN fallback docs。
2. 这些 fallback docs 已经 noindex 且从 sitemap 排除，这保护了 crawler。
3. 但 zh-CN 首页、navbar 和 footer 仍会把用户送进 `/zh-CN/docs/intro` 这类 fallback 路由。
4. 部署 workflow 只跑 `npm run build`，没有阻断语言路由契约漂移。

所以 build 能通过，并不等于公开语言面可靠。`noindex` 不能替代 UI 入口的正确路由。

## 更好的 GEO 方向

更好的 GEO 策略仍然是 truth-first：

1. 在具体 zh-CN 页面翻译并 review 前，英文继续作为 canonical；
2. 只有在同批完成翻译时，才把对应 doc path 加入 `publishedLanguageScope.js`；
3. Pages deploy 前必须跑 `npm run audit:build`；
4. `llms.txt`、sitemap、首页链接与 noindex 行为必须保持一致；
5. 增加更多 locale 之前，先扩写或合并 thin provider pages。

不要把空 locale folder 或 fallback English 页面当成 GEO 面积。这会制造弱 hreflang 信号，也会损害用户信任。

## 下一步

1. 按顺序翻译并 review zh-CN critical path：intro、installation、quick-start、configuration、provider overview、AI knowledge pillar。
2. 每个页面从 fallback 晋升为已发布页面时，都必须更新 `publishedLanguageScope.js`，并执行 `npm --prefix website run build && npm --prefix website run audit:build`。
3. 语言路由门禁稳定后，再添加 provider-page quality audit；provider thinness 是内容质量问题，不是路由问题。
4. `website/build` 继续作为生成产物忽略，不提交到 main。
