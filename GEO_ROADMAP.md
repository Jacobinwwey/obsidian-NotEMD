# NotEMD GEO Roadmap

**Created:** 2026-06-12
**Updated:** 2026-06-17
**Status:** Phase 1-3 shipped; Phase 4 GitHub Pages reliability, language truth, and AI retrieval entry point complete in this batch.
**Scope:** Post-deployment GEO optimization for AI search engine visibility, documentation truth, and GitHub Pages reliability.

---

## Current Truth Snapshot

The website is a Docusaurus site under `website/`, deployed by `.github/workflows/deploy-docs.yml` on pushes to `main` that touch `website/**` or the workflow file. The workflow already uses `npm ci` and `npm run build` from the `website` working directory.

The current public language surface is deliberately narrow:

| Surface | Current state | Interpretation |
|---|---|---|
| English docs | Complete canonical docs under `website/docs/` | Primary crawl and answer source |
| Simplified Chinese | Localized homepage plus localized FAQ | Partial locale; untranslated doc fallbacks are noindex and excluded from sitemap |
| Other locales | Not published | Do not add empty locale folders to `i18n.locales` |
| Plugin UI i18n | Separate runtime feature | Do not confuse runtime UI language support with website documentation coverage |

## 2026-06-17 Pages / GEO Audit

### Findings

| Finding | Evidence | Impact |
|---|---|---|
| Missing GitHub Pages root routes | `npm run build` warned about links to `/obsidian-NotEMD/` and `/obsidian-NotEMD/zh-CN/` | Navbar/logo/footer root links pointed to missing generated pages |
| Deprecated markdown-link config | Docusaurus warned that top-level `siteConfig.onBrokenMarkdownLinks` is deprecated for v4 | Future Docusaurus upgrade risk |
| Stale website docs | `website/README.md` claimed Docusaurus 3.6.3 and 10 languages, while package/config use 3.10.1 and `['en', 'zh-CN']` | Operator and crawler strategy drift |
| Roadmap language drift | This file claimed both Phase 2 in progress and Phase 1-3 complete; it also referenced pruned language counts that no longer match config | Progress accounting drift |
| Hardcoded schema URLs | Some JSON-LD code encoded the GitHub Pages base path directly | Higher risk if `url` or `baseUrl` changes |
| zh-CN FAQ weaker metadata | Localized FAQ used Organization author and lacked citations | Lower schema consistency than English docs |
| zh-CN fallback docs in sitemap | Docusaurus generated zh-CN paths for untranslated docs | Weak language and hreflang signal |
| No AI retrieval index | No static `llms.txt` existed | Answer engines had no concise canonical map |

### Fixes Landed In This Batch

| Fix | Files | Result |
|---|---|---|
| Add locale-aware root homepage | `website/src/pages/index.js`, `website/src/pages/index.module.css` | `/obsidian-NotEMD/` and `/obsidian-NotEMD/zh-CN/` become real pages |
| Move Docusaurus markdown hook | `website/docusaurus.config.js` | Uses `markdown.hooks.onBrokenMarkdownLinks` instead of deprecated top-level config |
| Derive JSON-LD URLs from config | `website/docusaurus.config.js`, `website/src/theme/DocItem/Layout/index.js`, `website/src/pages/index.js` | Schema follows `url` + `baseUrl` instead of scattering path literals |
| Align zh-CN FAQ metadata | `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/faq.mdx` | Localized FAQ uses the canonical Person author and citations |
| Fence untranslated zh-CN docs | `website/docusaurus.config.js`, `website/src/theme/DocItem/Layout/index.js` | Only translated zh-CN FAQ stays in sitemap; fallback docs emit `noindex,follow` |
| Add AI retrieval entry point | `website/static/llms.txt` | Provides a compact canonical source map for AI crawlers and answer engines |
| Correct website operator docs | `website/README.md` | Documents real Docusaurus version, real locale policy, root homepage, and `llms.txt` |
| Rebaseline roadmap and progress docs | `GEO_ROADMAP.md`, current progress audit doc | Removes stale language and phase claims |

## Phase 1: Foundation (Shipped)

| Step | Description | Status | Notes |
|------|-------------|--------|-------|
| 1 | Fix technical debt | Done | Historical baseline |
| 2 | Content depth | Done | High-value docs plus placeholders were created earlier |
| 3 | Pillar page architecture | Done | `docs/pillar-ai-knowledge.mdx` remains the cluster anchor |
| 4 | E-E-A-T signals | Done | Person, citations, and publisher schema exist |
| 5 | Visibility monitoring baseline | Done | Baseline data exists under `geo-data/` |
| 6 | Gap analysis | Done | Earlier recommendations were implemented where still valid |
| 7 | i18n pruning + noindex / robots | Done | Empty language expansion was stopped |
| 8 | Competitive positioning | Done | Competitive keywords and positioning were added |
| 9 | Mermaid rendering | Done | Mermaid theme is enabled |

### Claims vs Reality Rebaseline

| Earlier claim | Current reality | Current action |
|---|---|---|
| 10 locales i18n ready | Only `en` and `zh-CN` are published; zh-CN is partial | Keep published locale list small until critical path pages are translated |
| Pruned to 3 locales: EN, zh-CN, ja | Current config publishes 2 locales: `en`, `zh-CN` | Do not mention `ja` as active or ready |
| Phase 1-3 complete with only July retest remaining | Pages root and language docs still had build-visible defects | Treat Pages reliability as Phase 4, now fixed and verified by build |
| SearchAction removed because it pointed to 404 | Correct historically | Continue avoiding schema features that point to missing routes |
| TLDR/schema work complete | Mostly true for docs pages | Homepage and `llms.txt` now cover the root/answer-engine entry point |

## Phase 2: Schema & Architecture Fixes (Shipped)

| Recommendation | Current code state | Status |
|---|---|---|
| Fix `datePublished` missing | Reads `frontMatter.datePublished`, falls back to `dateModified` | Done |
| Fix raw `dateModified` timestamp | Converts `metadata.lastUpdatedAt` to ISO | Done |
| Fix hardcoded doc page URL composition | Uses `siteConfig.url` and `siteConfig.baseUrl` through URL construction | Done |
| `about` type: `Thing` -> `DefinedTerm` | Emits `DefinedTerm` with `inDefinedTermSet` | Done |
| Missing `.nojekyll` | `website/static/.nojekyll` exists | Done |
| CSS "GEO Optimization" overclaims | Comments were narrowed; negative letter spacing also removed from custom CSS | Done |
| Missing concepts/citations/author metadata | English docs and zh-CN FAQ now align on author/citation pattern | Done |
| FAQPage Schema | Swizzled doc layout emits FAQPage for `faq.mdx` | Done |
| Root WebPage Schema | Homepage now emits localized WebPage JSON-LD | Done |

## Phase 3: Architecture Evolution (Shipped / Deferred)

| Step | Description | Status |
|------|-------------|--------|
| P3-1 | Remove empty/unsupported locales | Done |
| P3-2 | Consolidate or expand provider stub pages | Deferred, still needs content writing |
| P3-3 | Sidebar reorder | Done |
| P3-4 | Apply for Algolia DocSearch | Deferred until indexing is stable |
| P3-5 | Add `position_in_response` to visibility tester | Done |
| P3-6 | Organization Schema `sameAs` | Done |
| P3-7 | Extend visibility test to Perplexity | Deferred, needs API key |
| P3-8 | Upgrade Docusaurus packages to `^3.10.1` | Done |

## Phase 4: Pages Reliability + Language Truth (2026-06-17)

Phase 4 exists because the previous roadmap optimized schema/content while leaving deployment routes and language truth under-specified. GEO will not work if crawlers and answer engines hit missing root pages, stale language claims, or inconsistent canonical source maps.

### Phase 4 Acceptance

| Requirement | Status | Evidence target |
|---|---|---|
| GitHub Pages root route exists | Fixed | `website/build/index.html` |
| zh-CN root route exists | Fixed | `website/build/zh-CN/index.html` |
| Deprecated Docusaurus markdown config removed | Fixed | No v4 deprecation warning in `npm run build` |
| Root broken markdown links removed | Fixed | No `/obsidian-NotEMD/` root broken-link warning in `npm run build` |
| Published language policy matches code | Fixed | README + roadmap state `en` plus partial `zh-CN` |
| Untranslated zh-CN fallback docs fenced | Fixed | zh-CN sitemap keeps only root + FAQ; fallback docs emit `noindex,follow` |
| AI retrieval entry point exists | Fixed | `website/build/llms.txt` |
| Test files excluded from this commit | Required | Commit file list must not include `src/tests/**` |

## Better GEO Strategy

The next effective GEO strategy is truth-first and route-first, not locale-volume-first.

1. **Make canonical routes boring and stable.** Root, locale root, sitemap, robots, FAQ, intro, quick-start, provider overview, and pillar pages must all build without missing-link warnings.
2. **Publish only reviewed language surfaces.** Keep `en` complete and grow `zh-CN` by translating the critical path before adding any new locale.
3. **Use `llms.txt` as the compact answer-engine map.** It should point to canonical docs, explain language scope, and discourage answers based on generated exports or stale issue text.
4. **Keep schema accurate before making it richer.** Person, Organization, WebPage, TechArticle, FAQPage, citations, and concepts are useful only if URLs resolve and claims match source pages.
5. **Consolidate thin provider pages before adding more.** Stub-like provider pages dilute crawl quality; expand them with real setup, request semantics, and troubleshooting or merge them into stronger overview pages.
6. **Measure after deploy, then tune.** Re-run Google indexing checks and AI visibility tests only after the fixed Pages build is deployed.

### Critical Path Translation Plan

Before adding any locale beyond `zh-CN`, finish and review these zh-CN pages:

1. Homepage
2. FAQ
3. Introduction
4. Installation
5. Quick Start
6. Configuration
7. Provider overview
8. AI knowledge pillar

Until this set is translated, zh-CN should stay explicitly partial.

## Risks & Mitigations

| Risk | Status | Mitigation |
|------|--------|-----------|
| Site not indexed by Google | Open | Submit sitemap via Google Search Console after the fixed Pages deploy |
| Empty or fallback i18n pages emit weak hreflang signals | Controlled | Publish only `en` + partial `zh-CN`; noindex untranslated zh-CN fallbacks and exclude them from sitemap |
| GitHub Pages root route missing | Fixed | Root homepage now exists for default and zh-CN locale |
| Docusaurus v4 markdown config breakage | Fixed | Broken markdown hook moved under `markdown.hooks` |
| Untranslated zh-CN fallback docs dilute language quality | Controlled | Exclude fallback docs from sitemap and emit `noindex,follow` until translated |
| Thin provider pages dilute crawl budget | Open | Expand or consolidate provider pages before adding more |
| Mermaid bundle size on non-diagram pages | Accepted | Docusaurus/theme tradeoff; not the current GEO blocker |
| Hand-maintained `llms.txt` can drift | Open | Update it when canonical docs, language status, or provider docs change |
| Test or generated export files accidentally entering main | Controlled in this batch | Stage production/docs files only; leave tests and generated exports out of the commit |

## Success Metrics

| Timeframe | Metric | Target | Current |
|-----------|--------|--------|---------|
| Immediate | Docusaurus build | No root broken-link or deprecated markdown-hook warnings | Verified 2026-06-17 |
| Immediate | Root pages | `index.html` and `zh-CN/index.html` exist | Verified 2026-06-17 |
| Immediate | zh-CN fallback fence | Sitemap excludes untranslated docs; fallback docs noindex | Verified 2026-06-17 |
| Immediate | AI retrieval map | `llms.txt` exists in build output | Verified 2026-06-17 |
| 2 weeks post-deploy | Docusaurus site indexed | Google `site:` returns results | Unknown |
| 2 weeks post-deploy | First AI citation | 1+ ChatGPT/Perplexity/GLM mention | 0 baseline |
| 1 month post-deploy | Citation rate | 5-10% for core keywords | 0 baseline |
| 1 month post-deploy | zh-CN critical path | 8 pages translated/reviewed | Homepage + FAQ only |

## GEO Skill Capability Utilization

| Module | Capability | Used | Not Used | Priority |
|---|---|---|---|---|
| A1 | Organization Schema | WebSite + Person graph + sameAs | Richer credentials | P4/P5 |
| A2 | FAQPage Schema | FAQ docs | More localized FAQ variants | After translation |
| A3 | Article Schema | TechArticle per doc page | `image` field per article | P5 |
| A4 | Person/E-E-A-T | Person @id cross-reference | `hasCredential` | P5 |
| A5 | Citation Schema | Docs citations | Automated citation freshness audit | P5 |
| A6 | BreadcrumbList | Docusaurus navigation only | Full BreadcrumbList schema | Deferred |
| B | Readability Check | TLDR and docs structure | Full English readability gate | Deferred |
| C | Pillar Page Cluster | Pillar page exists | Stronger cluster navigation blocks | P5 |
| D1 | Visibility Test | GLM baseline + position metric | Perplexity engine | Needs API key |
| D2 | Quarterly Report | Planned | First report after 3 data points | Q3 2026 |
| E | AI retrieval pack | `llms.txt` | Generated `llms-full.txt` | Defer until content pipeline exists |

## Measurement Cadence

| Date | Action |
|------|--------|
| 2026-06-17 | Verify fixed website build, root pages, zh-CN root, and `llms.txt` output |
| After deploy | Submit sitemap and inspect canonical root/locale root in Search Console |
| 2026-07-01 | Retest GLM baseline in EN + ZH after the fixed Pages deployment |
| 2026-08-01 | Second retest. If citations remain 0, audit indexed pages and provider-page thinness |
| 2026-10-01 | First quarterly report via `geo_report_generator.py` after enough data points |
