# GitHub Pages 语言与 GEO 工作流

语言：**简体中文** | [English](./github-pages-language-geo-workflow.md)

这是 `website/` 的当前发布流程，复核日期为 2026-10-03。插件 UI 国际化与原生导出验收各有独立契约。[1.9.9 验收记录](./release-1.9.9-acceptance.zh-CN.md)记录执行状态；本流程不代表候选版已经发布。

## 发布契约

- 英文是完整 canonical 源文档，位于 `https://jacobinwwey.github.io/obsidian-NotEMD/docs/...`。
- `website/src/lib/publishedLocales.mjs` 中每种语言都必须具备完整 docs 路由集。1.9.9 包含 25 条 canonical 路由（保留 1.9.8 指南），因此准入要求 34 种语言共 850 篇文档。
- 本地化矩阵为 `zh-CN`、`zh-Hant`、`zh-TW`、`ja`、`fr`、`de`、`es`、`ko`、`it`、`pt`、`pt-BR`、`ru`、`ar`、`fa`、`hi`、`bn`、`nl`、`sv`、`fi`、`da`、`no`、`pl`、`tr`、`he`、`th`、`el`、`cs`、`hu`、`ro`、`uk`、`vi`、`id`、`ms`。新增语言或源路由须在同一变更补齐所有对应内容。
- 当前只有英文与 zh-CN 可索引。其他语言保留访问入口、明确发布标签和 `noindex,follow`，在获得独立准入证据前，不进入 sitemap 与可索引语言替代链接。AI 直接撰写不是母语者独立审核，也不会自动获得索引资格。
- 新人、用户、开发者和 Agent 均须可达完整任务指南；只有导航标签或占位页面不算完成。
- 候选版可以本地构建和审阅。匹配的公开、非预发布 GitHub Release 及四个必需资产存在之前，Pages 不得将其推广为可下载稳定版。

## 直接撰写与审核

当前政策由 Codex 直接撰写并审核译文。不得为撰写或验证调用 LM Studio、翻译 API、其他模型或旧翻译写入脚本（`generate-localized-docs.cjs`、`translate-site-core.cjs`、`translate-*.cjs --write`）。这不移除插件对 LM Studio provider 的支持。

1. 翻译前对照源码默认值、命令、数据流和输出行为核查英文指南。
2. 完整更新受影响指南的标题、描述、摘要、示例和可见导航。每种语言可独立阅读；代码块中的说明性文字也须翻译，同时保留可执行语法、标识符、URL 和精确输出标记。
3. 对照同一源修订审核译文，逐项检查前提、修改、取消、重试与预期产物。结构一致是必要条件，不证明语义准确。
4. 在 `website/i18n/source-review.json` 记录规范化源文和译文 SHA-256。源文或译文变化会使记录失效；只在实际复核后更新，禁止通过盲目重算哈希批准漂移。
5. 如实记录撰写归属。独立母语者审核是另一个事件，不能由 AI 校对或构建成功推断。
6. 同步首页、导航、页脚、FAQ metadata 和 README 摘要。缺字段的本地化首页混入英文默认文案属于发布阻断项。

工具可枚举、排版、哈希及渲染已经撰写的文字，也可从源表复制精确标识符和 URL，但不得通过外部服务生成译文。

## 事实归属

| 契约 | 归属 |
|---|---|
| 当前软件事实 | `website/src/lib/releaseFacts.cjs`，从仓库 package／manifest 元数据派生 |
| 语言可用性／索引 | `website/src/lib/publishedLocales.mjs`、`website/src/lib/localePublication.mjs` |
| 源指南／译文 | `website/docs/`、`website/i18n/<locale>/docusaurus-plugin-content-docs/current/` |
| 源文审核记录 | `website/i18n/source-review.json` |
| 共用路由范围 | `website/src/lib/publishedLanguageScopeData.mjs`、`website/src/lib/publishedLanguageScope.js`、`website/src/lib/languageRoutePolicy.js` |
| 首页／界面文案 | `website/src/lib/homeCopyCatalog.mjs`、`website/src/lib/siteLocaleCatalog.cjs`、各语言 JSON 消息 |
| 搜索 metadata | `website/src/theme/SiteMetadata/index.js` |
| 语言导航 | `website/src/theme/NavbarItem/LocaleDropdownNavbarItem/index.js` |
| 侧栏／翻页兼容 | `website/src/theme/DocRoot/Layout/Sidebar/index.js`、`website/src/theme/DocItem/Paginator/index.js` |
| 机器可读指南索引 | `website/plugins/documentation-map.cjs` 从发行与路由归属生成 canonical `website/build/llms.txt` |
| 构建／导航／版本准入 | `website/scripts/audit-build.cjs`、`website/scripts/audit-navigation.cjs`、`website/scripts/verify-published-release.cjs` |

完整路由集由 `website/docs/` 派生。主要入口包括 `/docs/intro`、`/docs/getting-started/quick-start`、`/docs/providers/overview`、`/docs/faq`、`/docs/developers/overview`、`/docs/agents/overview`、`/docs/releases/1.9.9`。保留已有公开 URL 和有用锚点。

## 本地验证

使用 Node 24，在 `website/` 安装依赖并执行：

```bash
npm ci
node node_modules/playwright/cli.js install --with-deps chromium
npm run build
npm run audit:build
node scripts/audit-navigation.cjs
```

准备新环境前，核对 lockfile 与 CI 中实际安装的浏览器包。插件测试另外需要根目录两个 Playwright 浏览器版本。

构建审计覆盖路由／标题／frontmatter 一致性、源文审核记录、所有指南的本地化摘要、FAQ 可见正文与 metadata 对应、首页受众／发行入口、版本、canonical、`lang`、JSON-LD、robots、sitemap 和语言政策。未解释的内部链接失败必须阻断交付。不得以固定营销口号代替契约，也不得放松检查以接纳不完整译文。

浏览器审计在 390／768／1440 px 下访问四类受众、当前升级指南、页脚 FAQ 与深色 provider 页面，每语言共 24 个页面场景。检查键盘访问、横向溢出、console／page 错误、严重／关键可访问性问题、透明表头文字及行内路径的实际字形顺序。所有门禁失败均须解决。手动复核代表性 CJK、RTL 截图与焦点顺序；自动报告不能代替视觉与交互审阅。

局部核验正式 URL 布局时，重复传入语言参数：

```bash
node node_modules/@docusaurus/core/bin/docusaurus.mjs build --locale en --locale fr
node scripts/audit-navigation.cjs --locales en,fr --report-dir .cache/french-navigation
```

当前 Docusaurus CLI 恰好只有一个 `--locale` 时会禁用自动语言 URL 前缀。仅改变 `--out-dir` 不能修复资产基址，可能导致 hydration 错误；在一个参数后以空格列出语言也可能被解释为站点目录。局部证据不能替代最终全语言构建。

## CI 与部署

`.github/workflows/deploy-docs.yml` 对 PR 运行只读验证，安装固定浏览器，执行构建／内容／导航检查并保留证据。Pages 写权限与 id-token 只属于 main 部署 job；PR 构建成功不会发布。

部署前 `verify-published-release.cjs` 核查当前 tag、公开稳定状态及已上传的非空 `main.js`、`manifest.json`、`styles.css`、`README.md`。查找、认证和网络错误均拒绝继续。此可用性门禁不能替代 publisher 的下载哈希验证。

通过唯一发布主体公开 Release，串行刷新编年史，然后显式触发 Pages。`GITHUB_TOKEN` 创建的事件不保证触发另一 workflow。记录验收 revision、Release／tag 身份、部署 run 与实际服务的源码 revision。关闭计划前核验线上版本、语言／受众路由、canonical／hreflang、robots、sitemap、llms 以及支持／安装链接。仓库 About 应指向 canonical Pages URL。

## 可发现性与证据

可见文案、JSON-LD 和 `llms.txt` 必须描述相同的实现、版本与语言边界。优先提供可执行任务答案、可检查示例、前提、稳定链接和带日期证据。不得编造排名、评分、背书或竞品优越性。

`llms.txt` 是人工整理的导航，不是排名机制。Google AI 功能不要求特别 AI 文件或 schema；项目能控制的技术工作仍是 canonical、索引资格、内链和真实正文。

在[测量记录](./github-pages-geo-measurement-log.zh-CN.md)中记录 Search Console 与 AI visibility，注明日期、URL／语言、工具及限制。Bing 引用次数不证明答案内部排序。无账号访问权限应记为**未测量**，而不是零流量。外部搜索／引用属于部署后观察，不会因本地构建通过而自动成为事实。

## 维护权衡

完整语言一致性具有真实审核成本。保持源页面聚焦，复用权威源码引用，避免增加相互竞争的手册。路由可用性、撰写审核与索引资格分别判断。保留现有具有明确政策职责的 Docusaurus override，不为改写检查名称而新增通用 theme 层。
