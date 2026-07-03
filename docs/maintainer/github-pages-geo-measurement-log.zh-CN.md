# GitHub Pages GEO 测量记录

语言: [English](./github-pages-geo-measurement-log.md) | **简体中文**

这份记录把源码侧 GEO 证明与线上索引证明分开。`npm run audit:build` 能证明 route、sitemap、hreflang、fallback、provider doc 与 `llms.txt` 契约；它不能证明 Search Console 已收录，也不能证明 AI visibility 已提升。这两项必须等 GitHub Pages 部署并被抓取后再测。

## 2026-06-22 源码侧基线

| 证据 | 当前状态 | 负责人 |
|---|---|---|
| Build output | 等待本切片执行 `npm --prefix website run build` 验证 | 本地操作者 |
| Build audit | 等待本切片执行 `npm --prefix website run audit:build` 验证 | 本地操作者 |
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
| 源码侧解释 | 没发现当前远端 `main` 存在 Docusaurus build 或 `audit:build` 失败；只要改动 `website/**` 或 workflow 文件，Pages 仍由 workflow 门禁 | 本地操作者 |
| 下一步测量 | 本次收口部署后，在 Search Console 检查 root、zh-CN root、FAQ、provider overview、一个 provider detail 与一个未发布 zh-CN fallback | 外部手工检查 |

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
