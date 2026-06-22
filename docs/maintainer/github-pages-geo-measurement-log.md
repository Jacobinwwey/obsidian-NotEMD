# GitHub Pages GEO Measurement Log

Language: **English** | [简体中文](./github-pages-geo-measurement-log.zh-CN.md)

This log separates source-side GEO proof from live indexing proof. `npm run audit:build` can prove route, sitemap, hreflang, fallback, provider-doc, and `llms.txt` contracts. It cannot prove Search Console indexing or AI visibility until the GitHub Pages build is deployed and crawled.

## 2026-06-22 Source-Side Baseline

| Evidence | Current state | Owner |
|---|---|---|
| Build output | Pending this slice's verification with `npm --prefix website run build` | Local operator |
| Build audit | Pending this slice's verification with `npm --prefix website run audit:build` | Local operator |
| Root sitemap | Must include canonical English docs and published zh-CN alternates only | `website/scripts/audit-build.cjs` |
| zh-CN sitemap | Must include zh-CN root plus published zh-CN docs; must exclude untranslated fallback docs | `website/scripts/audit-build.cjs` |
| `llms.txt` | Must list English canonical docs, published zh-CN docs, and the partial-language warning | `website/static/llms.txt` |
| Provider-page quality | Provider docs must expose setup, endpoint/auth, model discovery, troubleshooting, and use-case sections | `website/scripts/audit-build.cjs` |
| Search Console | Not locally verifiable; submit and inspect after deploy | External manual check |
| AI visibility | Not locally verifiable; retest after deploy and indexing window | External/manual or API-backed check |

## Route Sample

Use this set for Search Console inspection and manual AI visibility prompts:

| Route | Expected source truth |
|---|---|
| `https://jacobinwwey.github.io/obsidian-NotEMD/` | Canonical English root |
| `https://jacobinwwey.github.io/obsidian-NotEMD/docs/intro` | English canonical doc with zh-CN alternate |
| `https://jacobinwwey.github.io/obsidian-NotEMD/docs/getting-started/quick-start` | English canonical doc with zh-CN alternate |
| `https://jacobinwwey.github.io/obsidian-NotEMD/docs/providers/overview` | English canonical doc with zh-CN alternate |
| `https://jacobinwwey.github.io/obsidian-NotEMD/docs/providers/openai` | English-only provider detail; no zh-CN alternate until translated |
| `https://jacobinwwey.github.io/obsidian-NotEMD/zh-CN/` | Published zh-CN root |
| `https://jacobinwwey.github.io/obsidian-NotEMD/zh-CN/docs/intro` | Published zh-CN doc |
| `https://jacobinwwey.github.io/obsidian-NotEMD/zh-CN/docs/providers/overview` | Published zh-CN doc |
| `https://jacobinwwey.github.io/obsidian-NotEMD/zh-CN/docs/providers/openai` | Generated fallback only; must be `noindex,follow`, absent from zh-CN sitemap, and absent from hreflang alternates |

## Search Console Checklist

Run after the deployed Pages artifact contains the 2026-06-22 build:

1. Submit or refresh `https://jacobinwwey.github.io/obsidian-NotEMD/sitemap.xml`.
2. Submit or refresh `https://jacobinwwey.github.io/obsidian-NotEMD/zh-CN/sitemap.xml`.
3. Inspect the root route, zh-CN root, `docs/intro`, `docs/providers/overview`, and `docs/faq`.
4. Inspect one unpublished zh-CN fallback such as `/zh-CN/docs/providers/openai`; expected result is not indexable because of `noindex,follow`.
5. Record canonical URL, crawl status, indexing status, and last crawl date.

## AI Visibility Checklist

Run after Search Console has accepted or crawled the updated sitemap:

| Prompt family | Expected signal |
|---|---|
| "What is Notemd for Obsidian?" | Mentions persistent AI knowledge workflows, wiki-links, concept notes, research, translation, diagrams, and local vault output |
| "How do I configure Notemd providers?" | Cites or reflects provider overview and provider detail pages |
| "Notemd 中文文档支持哪些页面?" | States zh-CN is partial and includes homepage, intro, installation, quick start, configuration, provider overview, AI knowledge pillar, and FAQ |
| "Can Notemd run local LLMs?" | Mentions Ollama/LMStudio and local-vault privacy |

Record engine, date, prompt, whether a citation appeared, cited URL, and whether the answer respected the partial zh-CN language scope.

## Decision Rule

Do not expand locales or add more GEO surfaces because AI visibility is still low. If citations remain absent after indexing, first check whether canonical docs are indexed, whether provider pages are too stale, and whether `llms.txt` still matches the route graph.
