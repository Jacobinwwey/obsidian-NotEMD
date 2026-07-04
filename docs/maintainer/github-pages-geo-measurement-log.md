# GitHub Pages GEO Measurement Log

Language: **English** | [简体中文](./github-pages-geo-measurement-log.zh-CN.md)

This log separates source-side GEO proof from live indexing proof. `npm run audit:build` can prove route, sitemap, hreflang, fallback, provider-doc, and `llms.txt` contracts. It cannot prove Search Console indexing or AI visibility until the GitHub Pages build is deployed and crawled.

## 2026-06-22 Source-Side Baseline

| Evidence | Current state | Owner |
|---|---|---|
| Build output | Verified locally again on 2026-07-04 with `npm --prefix website run build` | Local operator |
| Build audit | Verified locally again on 2026-07-04 with `npm --prefix website run audit:build` | Local operator |
| Root sitemap | Must include canonical English docs and published zh-CN alternates only | `website/scripts/audit-build.cjs` |
| zh-CN sitemap | Must include zh-CN root plus published zh-CN docs; must exclude untranslated fallback docs | `website/scripts/audit-build.cjs` |
| `llms.txt` | Must list English canonical docs, published zh-CN docs, and the partial-language warning | `website/static/llms.txt` |
| Provider-page quality | Provider docs must expose setup, endpoint/auth, model discovery, troubleshooting, and use-case sections | `website/scripts/audit-build.cjs` |
| Search Console | Not locally verifiable; submit and inspect after deploy | External manual check |
| AI visibility | Not locally verifiable; retest after deploy and indexing window | External/manual or API-backed check |

## 2026-06-24 Homepage GEO Sync

| Evidence | Current state | Owner |
|---|---|---|
| Homepage source-backed facts | Must show write-first workflow model, provider surface, local-vault boundary, and current release | `website/src/pages/index.js` |
| Homepage answer-engine source map | Must link `llms.txt`, provider overview, and AI knowledge pillar from both root homepages | `website/src/pages/index.js` |
| Homepage JSON-LD | Must expose current `SoftwareApplication` version and WebPage main entity | `website/docusaurus.config.js`, `website/src/pages/index.js` |
| `llms.txt` homepage contract | Must mention the homepage GEO contract, release `1.9.3`, and the answer-engine source map | `website/static/llms.txt` |
| Build audit | Must reject missing homepage GEO text, stale version, missing `llms.txt` link, or missing 2026-06-24 homepage evidence | `website/scripts/audit-build.cjs` |
| Search Console | Not locally verifiable; inspect after the Pages workflow deploys this homepage update | External manual check |
| AI visibility | Not locally verifiable; retest after deploy and indexing window | External/manual or API-backed check |

## 2026-07-02 Remote Pages CI Triage

| Evidence | Current state | Owner |
|---|---|---|
| Historical failed run | Run `27451762938` failed in `actions/deploy-pages@v4` with `HttpError: Not Found` and the instruction to enable GitHub Pages | GitHub repository settings / Pages availability |
| Recent main deploys | Recent `Deploy Docusaurus to GitHub Pages` runs on `main`, including `28281641014`, completed successfully | GitHub Actions |
| Current baseline commit | `eb777ef` had no check-runs and no legacy statuses attached during triage | Local operator |
| Source-side interpretation | No current Docusaurus build or `audit:build` failure was found on remote `main`; Pages remains gated by the workflow when `website/**` or the workflow file changes | Local operator |
| Next measurement | After this closeout deploy, inspect root, zh-CN root, FAQ, provider overview, one provider detail, and one unpublished zh-CN fallback in Search Console | External manual check |

## 2026-07-04 Source-Side GEO Closure

This closure confirms the source-side GEO work is complete under the current repository-accessible evidence. The local build produced both English and zh-CN static output, and `website/scripts/audit-build.cjs` passed against the generated artifact. The gate covered root pages, canonical URLs, homepage JSON-LD, release metadata, `llms.txt`, sitemap language scope, published zh-CN translations, unpublished zh-CN fallback `noindex,follow`, hreflang alternates, provider-doc heading quality, and the measurement evidence references.

No new public GEO surface was added in this closure. That is intentional: the current risk is not lack of more pages, but route/schema/map drift. The correct closure action was to re-run and record the existing build-output gate, keep `llms.txt`, sitemap, homepage copy, JSON-LD, and language policy aligned, and leave Search Console / AI visibility as post-deploy measurement.

Current source-side result:

| Evidence | Result |
|---|---|
| `npm --prefix website run build` | Passed on 2026-07-04 |
| `npm --prefix website run audit:build` | Passed on 2026-07-04 with `website build audit passed` |
| Recent remote Pages runs | Latest visible `main` Pages workflow runs are green through run `28701182146` for commit `2b2e1cd`; earlier docs-only commits including `9efff59` and `40543eb` did not trigger a new website workflow because they did not change `website/**` |
| External measurement | Still not locally provable; Search Console and AI visibility checks remain manual/post-deploy evidence |

## 2026-07-04 Remote Pages Closure

The follow-up Pages workflow for commit `2b2e1cd` (`docs(geo): align bilingual closure evidence`) completed successfully as run `28701182146`, extending the previous green Pages baseline from run `28641376675`.

| Job | Result |
|---|---|
| `build` (`85119355773`) | Passed after checkout, Node setup, dependency install, Docusaurus build, `npm run audit:build`, and artifact upload |
| `deploy` (`85119467658`) | Passed and deployed the Pages artifact |

The only remaining GitHub-side annotation is the existing Node 20 deprecation notice for upstream actions being forced onto Node 24 by GitHub's runner policy. That annotation is not a Docusaurus build, audit, artifact upload, or deploy failure.

## Route Sample

Use this set for Search Console inspection and manual AI visibility prompts:

| Route | Expected source truth |
|---|---|
| `https://jacobinwwey.github.io/obsidian-NotEMD/` | Canonical English root |
| `https://jacobinwwey.github.io/obsidian-NotEMD/llms.txt` | Answer-engine source map linked from the homepage |
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
