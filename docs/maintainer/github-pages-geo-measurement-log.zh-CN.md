# GitHub Pages GEO 测量记录

语言: [English](./github-pages-geo-measurement-log.md) | **简体中文**

这份记录把源码侧 GEO 证明与线上索引证明分开。`npm run audit:build` 能证明 route、sitemap、hreflang、fallback、provider doc 与 `llms.txt` 契约；它不能证明 Search Console 已收录，也不能证明 AI visibility 已提升。这两项必须等 GitHub Pages 部署并被抓取后再测。

## 2026-06-22 源码侧基线

| 证据 | 当前状态 | 负责人 |
|---|---|---|
| Build output | 已于 2026-07-04 重新通过 `npm --prefix website run build` 本地验证 | 本地操作者 |
| Build audit | 已于 2026-07-04 重新通过 `npm --prefix website run audit:build` 本地验证 | 本地操作者 |
| Root sitemap | 必须只包含 canonical 英文 docs 与已发布 zh-CN alternate | `website/scripts/audit-build.cjs` |
| zh-CN sitemap | 必须包含 zh-CN root 与已发布 zh-CN docs；必须排除未翻译 fallback docs | `website/scripts/audit-build.cjs` |
| `llms.txt` | 必须列出英文 canonical docs、已发布 zh-CN docs 与 partial-language 警告 | `website/static/llms.txt` |
| Provider-page quality | Provider docs 必须包含 setup、endpoint/auth、model discovery、troubleshooting 与 use-case sections | `website/scripts/audit-build.cjs` |
| Search Console | 本地无法证明；部署后提交并检查 | 外部手工检查 |
| AI visibility | 本地无法证明；部署和索引窗口后再重测 | 外部手工或 API 检查 |

## 2026-06-24 Homepage GEO 同步

| 证据 | 当前状态 | 负责人 |
|---|---|---|
| Homepage source-backed facts | 必须展示 write-first workflow model、provider surface、local-vault boundary 与当前 release | `website/src/pages/index.js` |
| Homepage answer-engine source map | 必须在英文和中文 root homepage 链接 `llms.txt`、provider overview 与 AI knowledge pillar | `website/src/pages/index.js` |
| Homepage JSON-LD | 必须暴露当前 `SoftwareApplication` version 与 WebPage main entity | `website/docusaurus.config.js`, `website/src/pages/index.js` |
| `llms.txt` homepage contract | 必须说明 homepage GEO contract、release `1.9.3` 与 answer-engine source map | `website/static/llms.txt` |
| Build audit | 必须拒绝缺失 homepage GEO text、stale version、缺失 `llms.txt` link 或缺失 2026-06-24 homepage evidence 的构建 | `website/scripts/audit-build.cjs` |
| Search Console | 本地无法证明；等这次 homepage update 经 Pages workflow 部署后检查 | 外部手工检查 |
| AI visibility | 本地无法证明；部署和索引窗口后再重测 | 外部手工或 API 检查 |

## 2026-07-02 远端 Pages CI 排查

| 证据 | 当前状态 | 负责人 |
|---|---|---|
| 历史失败 run | `27451762938` 失败在 `actions/deploy-pages@v4`，报错为 `HttpError: Not Found`，并提示需要启用 GitHub Pages | GitHub repository settings / Pages availability |
| 近期 main 部署 | 最近的 `main` 上 `Deploy Docusaurus to GitHub Pages` runs 已成功，包括 `28281641014` | GitHub Actions |
| 当前基线 commit | 排查时 `eb777ef` 没有关联 check-runs，也没有 legacy statuses | 本地操作者 |

## 2026-07-05 Pages Action 加固

| 证据 | 当前状态 | 负责人 |
|---|---|---|
| 失败 deploy run | `28738168439` 已完成 website build、通过 `npm run audit:build`、上传 Pages artifact，然后在 `actions/deploy-pages@v4` 内部以 `Deployment failed, try again later.` 失败 | GitHub Pages deploy service / workflow action boundary |
| 失败重跑 | 对 `28738168439` 重跑 failed jobs 后，artifact 已被接受，但 deploy-only failure 复现 | GitHub Pages deploy service / workflow action boundary |
| Workflow 加固 | `.github/workflows/deploy-docs.yml` 现在使用 `actions/checkout@v7`、`actions/setup-node@v6` 且 `node-version: 24`、`actions/upload-pages-artifact@v5` 与 `actions/deploy-pages@v5` | Repository workflow |
| 2026-07-05 重复失败 | `28739659512` 与 `28739750578` 均通过 website build、`audit:build` 和 artifact upload，只在 Pages deploy service 中以 `Deployment failed, try again later.` 失败 | GitHub Pages deploy service / workflow action boundary |
| Deploy retry 加固 | `.github/workflows/deploy-docs.yml` 现在会对官方 `actions/deploy-pages@v5` 步骤最多重试三次，并在尝试之间等待；这不会掩盖 build 或 audit 失败 | Repository workflow |
| Contract test | `src/tests/githubPagesWorkflow.test.ts` 锁定 Pages workflow，避免回退到旧的 `checkout@v4`、`setup-node@v4`、`upload-pages-artifact@v3` 与 `deploy-pages@v4` 组合 | Jest |

## 2026-07-07 多语言文档扩展

| 证据 | 当前状态 | 负责人 |
|---|---|---|
| 语言策略 | 先前的部分 zh-CN fallback 边界已被完整 docs 路由发布策略取代，覆盖 `zh-CN`、`zh-Hant`、`ja`、`fr`、`de`、`es` 与 `ko` | `website/docusaurus.config.js`, `website/README.md` |
| 本地化源码覆盖 | `website/docs/` 下每个源页面在部署前都必须在每个公开 locale 下有本地化对应文件 | `website/scripts/generate-localized-docs.cjs`, `src/tests/websiteDocsContract.test.ts` |
| Build audit | `npm run audit:build` 必须验证本地化源码覆盖、构建产物、sitemap entries、`llms.txt` 入口，以及公开本地化 docs 不输出 `noindex,follow` | `website/scripts/audit-build.cjs` |
| Answer-engine map | `llms.txt` 现在声明英文仍是 canonical，同时完整公开 docs 路由集已覆盖简体中文、繁体中文、日语、法语、德语、西班牙语与韩语 | `website/static/llms.txt` |
| Search Console | 本地无法证明；多语言更新经 Pages workflow 部署后，应提交并检查代表性本地化 docs | 外部手工检查 |
| AI visibility | 本地无法证明；部署和索引窗口后再重测多语言 answer-engine visibility | 外部手工或 API 检查 |

## 2026-07-04 源码侧 GEO 收口

本次收口确认：在当前仓库可证明的证据范围内，GEO 源码侧工作已经完成。本地构建产出了英文与 zh-CN 两套静态页面，`website/scripts/audit-build.cjs` 已对生成产物通过审计。该门禁覆盖 root pages、canonical URLs、homepage JSON-LD、release metadata、`llms.txt`、sitemap 语言范围、已发布 zh-CN 翻译、未发布 zh-CN fallback 的 `noindex,follow`、hreflang alternates、provider docs heading quality，以及 measurement evidence references。

本次没有新增公开 GEO surface，这是刻意选择。当前主要风险不是页面数量不足，而是 route、schema、retrieval map 与语言策略漂移。正确的收口动作是重新运行并记录现有 build-output gate，保持 `llms.txt`、sitemap、homepage copy、JSON-LD 与 language policy 对齐，并继续把 Search Console / AI visibility 留作部署后的外部测量。

当前源码侧结果：

| 证据 | 结果 |
|---|---|
| `npm --prefix website run build` | 2026-07-04 通过 |
| `npm --prefix website run audit:build` | 2026-07-04 通过，输出 `website build audit passed` |
| 近期远端 Pages runs | 当前可见的最新 `main` Pages workflow 已绿色推进到 commit `2b2e1cd` 对应的 run `28701182146`；此前 docs-only commits，包括 `9efff59` 与 `40543eb`，没有触发新的 website workflow，因为它们没有改动 `website/**` |
| 外部测量 | 本地仍不能证明；Search Console 与 AI visibility 仍属于手工/部署后证据 |

## 2026-07-04 远端 Pages 收口

commit `2b2e1cd`（`docs(geo): align bilingual closure evidence`）触发的后续 Pages workflow 已成功完成，对应 run 为 `28701182146`，并延续了上一轮绿色 Pages 基线 run `28641376675`。

| Job | 结果 |
|---|---|
| `build`（`85119355773`） | 已通过，覆盖 checkout、Node setup、依赖安装、Docusaurus build、`npm run audit:build` 与 artifact upload |
| `deploy`（`85119467658`） | 已通过，并完成 Pages artifact 部署 |

当前剩余的 GitHub 侧 annotation 仍是既有 Node 20 deprecation notice：上游 actions 被 GitHub runner 策略强制跑在 Node 24 上。这不是 Docusaurus build、audit、artifact upload 或 deploy 失败。

## Route 样本

Search Console 检查和 AI visibility prompt 使用这一组：

| Route | 预期源码真值 |
|---|---|
| `https://jacobinwwey.github.io/obsidian-NotEMD/` | Canonical 英文 root |
| `https://jacobinwwey.github.io/obsidian-NotEMD/llms.txt` | 首页链接的 answer-engine source map |
| `https://jacobinwwey.github.io/obsidian-NotEMD/docs/intro` | 英文 canonical doc，带 zh-CN alternate |
| `https://jacobinwwey.github.io/obsidian-NotEMD/docs/getting-started/quick-start` | 英文 canonical doc，带 zh-CN alternate |
| `https://jacobinwwey.github.io/obsidian-NotEMD/docs/providers/overview` | 英文 canonical doc，带 zh-CN alternate |
| `https://jacobinwwey.github.io/obsidian-NotEMD/docs/providers/openai` | English-only provider detail；翻译前不应有 zh-CN alternate |
| `https://jacobinwwey.github.io/obsidian-NotEMD/zh-CN/` | 已发布 zh-CN root |
| `https://jacobinwwey.github.io/obsidian-NotEMD/zh-CN/docs/intro` | 已发布 zh-CN doc |
| `https://jacobinwwey.github.io/obsidian-NotEMD/zh-CN/docs/providers/overview` | 已发布 zh-CN doc |
| `https://jacobinwwey.github.io/obsidian-NotEMD/zh-CN/docs/providers/openai` | 仅为生成的 fallback；必须是 `noindex,follow`，不在 zh-CN sitemap 中，也不出现在 hreflang alternates 中 |

## Search Console Checklist

在部署产物包含 2026-06-22 build 之后执行：

1. 提交或刷新 `https://jacobinwwey.github.io/obsidian-NotEMD/sitemap.xml`。
2. 提交或刷新 `https://jacobinwwey.github.io/obsidian-NotEMD/zh-CN/sitemap.xml`。
3. 检查 root route、zh-CN root、`docs/intro`、`docs/providers/overview` 与 `docs/faq`。
4. 检查一个未发布 zh-CN fallback，例如 `/zh-CN/docs/providers/openai`；预期因为 `noindex,follow` 不可索引。
5. 记录 canonical URL、crawl status、indexing status 与 last crawl date。

## AI Visibility Checklist

Search Console 接受或抓取新 sitemap 后执行：

| Prompt family | 预期信号 |
|---|---|
| "What is Notemd for Obsidian?" | 提到 persistent AI knowledge workflows、wiki-links、concept notes、research、translation、diagrams 与 local vault output |
| "How do I configure Notemd providers?" | 引用或反映 provider overview 与 provider detail pages |
| "Notemd 中文文档支持哪些页面?" | 说明 zh-CN 是 partial，并列出 homepage、intro、installation、quick start、configuration、provider overview、AI knowledge pillar 与 FAQ |
| "Can Notemd run local LLMs?" | 提到 Ollama/LMStudio 与 local-vault privacy |

记录 engine、date、prompt、是否出现 citation、cited URL，以及回答是否尊重 partial zh-CN language scope。

## 决策规则

不要因为 AI visibility 仍低就盲目扩 locale 或增加 GEO surface。若索引后仍没有 citation，先检查 canonical docs 是否被收录、provider pages 是否过期、`llms.txt` 是否仍与 route graph 一致。
