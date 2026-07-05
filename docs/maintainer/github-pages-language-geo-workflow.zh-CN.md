# GitHub Pages 语言与 GEO 工作流

语言: [English](./github-pages-language-geo-workflow.md) | **简体中文**

本文记录 `website/` 当前的公开文档站门禁。它与插件 runtime i18n、Slidev export 验收是三条不同轨道。

## 当前契约

文档站发布一个完整语言面和一个部分语言面：

1. 英文是完整 canonical 文档面，路径为 `https://jacobinwwey.github.io/obsidian-NotEMD/docs/...`。
2. 简体中文发布首页和已 review 的 critical path：intro、installation、quick start、configuration、provider overview、AI knowledge pillar 与 FAQ。
3. Docusaurus 仍可能生成未翻译 zh-CN fallback docs，但这些页面必须是 `noindex,follow`，必须从 zh-CN sitemap 排除，必须从 zh-CN sidebar/paginator 遍历中隐藏，也不能暴露 hreflang alternates。
4. 从未发布 zh-CN fallback route 切换语言时，必须进入真实 route：中文去 zh-CN root，英文去 canonical English。
5. `llms.txt` 必须声明同一语言边界，避免 answer engine 推断出不存在的完整多语言覆盖。
6. 任何公开 GEO / product-positioning 变更，都必须在同一次变更中同步 GitHub Pages 首页可见内容、首页 JSON-LD、`llms.txt` 与 build-audit 预期。只更新 maintainer notes 不算完成。

## 已落地门禁

阻断式门禁是：

```bash
cd website
npm run build
npm run audit:build
```

`npm run audit:build` 执行 `website/scripts/audit-build.cjs`。脚本同时检查 build 产物和源码契约点：

1. root 页面存在：`build/index.html` 与 `build/zh-CN/index.html`；
2. root 页面具有预期的 `lang`、canonical URL 与 WebPage JSON-LD URL；
3. 每个已发布 zh-CN source file 都存在，且每个 localized zh-CN doc file 都已声明在 `publishedLanguageScopeData.mjs`；
4. critical zh-CN doc paths 都已发布；
5. 已发布 zh-CN docs 不输出 `noindex,follow`；
6. 未发布 zh-CN fallback docs 输出 `noindex,follow`，且不输出 alternates；
7. 英文 docs 只有在 zh-CN translation 已发布时才暴露 zh-CN alternate；
8. 已发布 zh-CN docs 不链接到未发布 zh-CN fallback docs；
9. sitemap 包含 canonical 英文 docs，包含已发布 zh-CN docs，并排除未发布 zh-CN fallback docs；
10. `llms.txt` 记录当前语言范围；
11. provider docs 必须包含 setup、endpoint/auth、model discovery、troubleshooting 与 use-case sections；
12. `GEO_ROADMAP.md` 与 measurement logs 必须提到 2026-06-22 baseline evidence、2026-06-24 homepage sync evidence、Search Console、AI visibility 与 sitemap 证据。
13. 首页必须暴露 source-backed product facts、answer-engine source map、`llms.txt` link、当前 release version 与 partial zh-CN language boundary。

GitHub Pages workflow 会在上传 Pages artifact 前运行这个审计：

```text
.github/workflows/deploy-docs.yml
  -> npm run build
  -> npm run audit:build
  -> upload-pages-artifact
```

截至 2026-07-05，workflow 已固定到 Node 24 兼容的 action 主版本：`actions/checkout@v7`、`actions/setup-node@v6` 且 `node-version: 24`、`actions/upload-pages-artifact@v5` 与 `actions/deploy-pages@v5`。这能让 Pages gate 避开此前 deploy 重试时暴露的旧 Node 20 deprecation 路径。

deploy job 会对官方 `actions/deploy-pages@v5` 步骤最多重试三次，并在尝试之间短暂等待。这个 retry 只覆盖 GitHub Pages 服务端部署失败，例如 `Deployment failed, try again later.`。它不会掩盖 checkout、install、build、audit 或 artifact upload 失败，因为 deploy job 仍依赖已经完成的 `build` job，且 retry steps 只有在 Pages deploy action 本身失败后才会运行。

## Source Ownership

语言发布数据在：

```text
website/src/lib/publishedLanguageScopeData.mjs
```

运行时 helper 在：

```text
website/src/lib/publishedLanguageScope.js
website/src/lib/languageRoutePolicy.js
```

当前已发布 zh-CN doc paths：

```text
/docs/intro
/docs/getting-started/installation
/docs/getting-started/quick-start
/docs/getting-started/configuration
/docs/providers/overview
/docs/pillar-ai-knowledge
/docs/faq
```

这份 scope 被以下位置消费：

1. `website/docusaurus.config.js` 用于 sitemap 过滤；
2. `website/src/theme/DocItem/Layout/index.js` 用于 fallback doc 的 `noindex,follow`；
3. `website/src/theme/SiteMetadata/index.js` 用于 hreflang 与 Open Graph locale alternates；
4. `website/src/theme/NavbarItem/LocaleDropdownNavbarItem/index.js` 用于 locale switch target；
5. `website/src/theme/DocRoot/Layout/Sidebar/index.js` 用于 zh-CN sidebar 过滤；
6. `website/src/theme/DocItem/Paginator/index.js` 用于 zh-CN previous/next 过滤；
7. `website/src/pages/index.js`、`website/docusaurus.config.js` 与 `website/static/llms.txt` 用于公开入口、首页 JSON-LD、release version 与 answer-engine source map。

关键规则不是“新增一个翻译文件”。关键规则是“翻译文件和 scope data 必须同批发布”。缺任一边，audit 都应该失败。

同样还有一条 homepage 规则：不要只在一个位置修改公开 GEO 事实。如果 answer-engine framing、provider count、language scope、release version 或 canonical source routes 发生变化，首页文案、JSON-LD、`llms.txt` 与 `audit-build.cjs` 必须一起更新。

## Promotion Checklist

当一个 zh-CN doc 从 fallback 晋升为 published：

1. 在 `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/...` 下完成翻译。
2. 把 doc id、route path、source path 加入 `publishedLanguageScopeData.mjs`。
3. 确认该页面应该进入 zh-CN sidebar 和 paginator 遍历。
4. 如果该页面属于公开 AI retrieval map，同步更新 `website/static/llms.txt`。
5. 如果晋升页面改变首页 source map 或可见语言边界，同步更新 `website/src/pages/index.js`。
6. 执行 `npm --prefix website run build && npm --prefix website run audit:build`。
7. 部署后在 `docs/maintainer/github-pages-geo-measurement-log.zh-CN.md` 中记录 Search Console 与 AI visibility 观察。

## 为什么这样做

最容易犯的错，是把 Docusaurus locale fallback 当成 GEO 面积。这是错误假设。它会制造看似中文、实际英文的 URL，削弱 hreflang 真值，并把用户带进没有经过本地化 review 的路线。

更严格的 scope-data 模型有维护成本：每次晋升都要同时动翻译内容、数据、`llms.txt` 与 build proof。收益是 sitemap、robots、alternates、UI navigation 与 AI retrieval 会讲同一个事实。

## 当前最佳方向

1. 英文继续保持 canonical 且完整。
2. zh-CN 通过已 review 的 critical-path 页面增长，而不是通过 locale 数量增长。
3. 先保证 provider pages 具备操作价值，再考虑增加更多 provider landing pages。
4. Search Console 与 AI visibility 是部署后的 measurement，不是本地 build proof。
5. 不要给 Docusaurus theme components 增加新的泛化 wrapper。本次 theme overrides 可以接受，是因为它们承接了具体 policy：alternates、locale switching、sidebar filtering 与 paginator filtering。
