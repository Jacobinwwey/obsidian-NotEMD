# GitHub Pages 语言与 GEO 工作流

语言: [English](./github-pages-language-geo-workflow.md) | **简体中文**

本文记录 `website/` 当前的公开文档站门禁。它与插件 runtime i18n、Slidev export 验收是三条不同轨道。

## 当前契约

文档站现在发布一个 canonical 源语言面，并为 `website/src/lib/publishedLocales.mjs` 中声明的每个 README/UI locale 发布完整本地化文档路由集：

1. 英文仍是完整 canonical 文档面，路径为 `https://jacobinwwey.github.io/obsidian-NotEMD/docs/...`。
2. 当前公开本地化 docs 矩阵为 `zh-CN`、`zh-Hant`、`zh-TW`、`ja`、`fr`、`de`、`es`、`ko`、`it`、`pt`、`pt-BR`、`ru`、`ar`、`fa`、`hi`、`bn`、`nl`、`sv`、`fi`、`da`、`no`、`pl`、`tr`、`he`、`th`、`el`、`cs`、`hu`、`ro`、`uk`、`vi`、`id` 与 `ms`；每个 locale 都必须暴露与 `website/docs` 完全相同的 docs 路由集。
3. 只有当 `website/docs/` 下每个源页面都在 `website/i18n/<locale>/docusaurus-plugin-content-docs/current/` 下有本地化对应文件时，才能把该 locale 加入 `publishedLocales.mjs`。
4. 先前的部分 zh-CN fallback 策略对公开 docs 已经退役。构建后的本地化 docs 不应依赖英文 fallback 页面，也不应输出 `noindex,follow`。
5. `llms.txt`、sitemap 输出、hreflang metadata、首页语言边界与 build-audit 预期必须描述同一套完整多语言路由契约。
6. 任何公开 GEO / product-positioning 变更，都必须在同一次变更中同步 GitHub Pages 首页可见内容、首页 JSON-LD、`llms.txt` 与 build-audit 预期。只更新 maintainer notes 不算完成。

## 已落地门禁

阻断式门禁是：

```bash
cd website
npm run build
npm run audit:build
```

`npm run audit:build` 执行 `website/scripts/audit-build.cjs`。脚本同时检查 build 产物和源码契约点：

1. 英文和每个公开 locale 的 root 页面都存在；
2. root 页面具有预期的 `lang`、canonical URL，以及适用的 WebPage JSON-LD URL；
3. 每个英文源文档在 `publishedLocales.mjs` 声明的每个公开 locale 中都有本地化源文档；
4. `publishedLanguageScopeData.mjs` 为 zh-CN 兼容门禁声明完整 docs 路由集；
5. 每个支持 locale 的本地化 docs 都能构建，并且不输出 `noindex,follow`；
6. sitemap 输出包含 canonical 英文 docs 和每个本地化 docs 路由；
7. `llms.txt` 记录当前多语言路由集与本地化入口；
8. provider docs 必须包含 setup、endpoint/auth、model discovery、troubleshooting 与 use-case sections；
9. `GEO_ROADMAP.md` 与 measurement logs 必须提到基线证据、首页同步证据、Search Console、AI visibility 与 sitemap 证据；
10. 首页必须暴露 source-backed product facts、answer-engine source map、`llms.txt` link、当前 release version 与完整多语言 docs 边界。

GitHub Pages workflow 会在上传 Pages artifact 前运行这个审计：

```text
.github/workflows/deploy-docs.yml
  -> npm run build
  -> npm run audit:build
  -> upload-pages-artifact
```

截至 2026-07-05，workflow 已固定到 Node 24 兼容的 action 主版本：`actions/checkout@v7`、`actions/setup-node@v6` 且 `node-version: 24`、`actions/upload-pages-artifact@v5` 与 `actions/deploy-pages@v5`。deploy job 会对官方 `actions/deploy-pages@v5` 步骤最多重试三次，并在尝试之间短暂等待。这个 retry 只覆盖 GitHub Pages 服务端部署失败，不会掩盖 checkout、install、build、audit 或 artifact upload 失败。

## Source Ownership

完整 zh-CN 兼容 scope 在：

```text
website/src/lib/publishedLanguageScopeData.mjs
```

公开 locale 矩阵在：

```text
website/src/lib/publishedLocales.mjs
```

运行时 helper 在：

```text
website/src/lib/publishedLanguageScope.js
website/src/lib/languageRoutePolicy.js
```

本地化文档由以下脚本生成和补丁：

```text
website/scripts/generate-localized-docs.cjs
```

当前公开的本地化 docs 路由集就是 `website/docs/` 下的完整集合，包括：

```text
/docs/intro
/docs/getting-started/installation
/docs/getting-started/quick-start
/docs/getting-started/configuration
/docs/features/wiki-links
/docs/features/concept-notes
/docs/features/research
/docs/features/translation
/docs/features/diagrams
/docs/features/workflows
/docs/providers/overview
/docs/providers/openai
/docs/providers/anthropic
/docs/providers/google
/docs/providers/local
/docs/providers/china
/docs/advanced/custom-prompts
/docs/advanced/batch-processing
/docs/advanced/troubleshooting
/docs/pillar-ai-knowledge
/docs/faq
```

这份 scope 被以下位置消费：

1. `website/src/theme/DocItem/Layout/index.js` 用于遗留 zh-CN fallback 的 `noindex,follow` 围栏。在完整路由本地化后，它对公开 docs 应该是 no-op。
2. `website/src/theme/SiteMetadata/index.js` 用于 hreflang 与 Open Graph locale alternates。
3. `website/src/theme/NavbarItem/LocaleDropdownNavbarItem/index.js` 用于 locale switch target。
4. `website/src/theme/DocRoot/Layout/Sidebar/index.js` 用于 zh-CN sidebar filtering 兼容逻辑。
5. `website/src/theme/DocItem/Paginator/index.js` 用于 zh-CN previous/next filtering 兼容逻辑。
6. `website/src/pages/index.js`、`website/docusaurus.config.js` 与 `website/static/llms.txt` 用于公开入口、首页 JSON-LD、release version 与 answer-engine source map。

关键规则不再是“把一个 zh-CN 页面从 fallback 晋升为 published”。当前规则是“保持每个公开 locale 完整”。一旦源文档新增或删除，就必须在同一变更中更新每个 locale，并重新运行生成器与审计。

同样还有一条 homepage 规则：不要只在一个位置修改公开 GEO 事实。如果 answer-engine framing、provider count、language scope、release version 或 canonical source routes 发生变化，首页文案、JSON-LD、`llms.txt` 与 `audit-build.cjs` 必须一起更新。

## Locale 更新清单

新增或修改 docs 页面时：

1. 更新 `website/docs/...` 下的英文源页面。
2. 运行或更新 `website/scripts/generate-localized-docs.cjs`，确保每个支持 locale 都得到对应页面。
3. 先 review `zh-CN` 的可见标题、章节标题和正文漂移。`Notemd`、`LLM`、`Provider`、CLI flags、配置键、文件扩展名和代码标识符是 runtime contract，可按需要保留英文。
4. 对每个公开 locale 运行完整的 heading/frontmatter/placeholder 审计，然后人工抽查 zh-CN 以及代表性的非拉丁和 RTL locale（`ar`、`fa`、`he`），确认没有可见英文标题残留或方向敏感布局问题。
5. 如果 docs 路由集变化，同步更新 `website/src/lib/publishedLanguageScopeData.mjs`。
6. 如果页面影响公开 AI retrieval map，同步更新 `website/static/llms.txt`。
7. 如果页面改变首页 source map 或可见语言边界，同步更新 `website/src/pages/index.js`。
8. 执行 `npm --prefix website run build && npm --prefix website run audit:build`。
9. 部署后在 `docs/maintainer/github-pages-geo-measurement-log.zh-CN.md` 中记录 Search Console 与 AI visibility 观察。

## 为什么这样做

先前的部分 zh-CN 模型，比让 Docusaurus 在中文 URL 下发布英文 fallback 内容更安全；但当公开需求变成完整多语言 docs 后，它已经不是正确抽象。继续把 fallback fencing 当作主策略，会隐藏真实本地化页面，让 sitemap 真值复杂化，也会让 locale 扩展看起来始终未完成。

更严格的完整路由模型有维护成本：每次 docs 变化都要同步所有本地化源树和 build proof。收益是 sitemap、robots、alternates、UI navigation 与 AI retrieval 会讲同一个事实。

## 当前最佳方向

1. 英文继续保持 canonical 且完整。
2. 每次部署前，保持所有公开 locale 的 docs 路由集完整。
3. 使用 `generate-localized-docs.cjs` 保证可重复生成，但必须优先 review 可见 zh-CN 文本，并抽查代表性的 RTL/非拉丁输出，因为机器式泛化标题比明确本地化标题更差。
4. Search Console 与 AI visibility 是部署后的 measurement，不是本地 build proof。
5. 不要给 Docusaurus theme components 增加新的泛化 wrapper。现有 theme overrides 可以接受，只是因为它们承接了具体 policy：alternates、locale switching、sidebar filtering 与 paginator filtering。
