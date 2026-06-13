# NotEMD GEO Roadmap

**Created:** 2026-06-12
**Updated:** 2026-06-13
**Status:** Phase 1 + Phase 2 + Phase 3 complete. Awaiting 2026-07-01 retest.
**Scope:** Post-deployment GEO optimization for AI search engine visibility

---

## Phase 1: Foundation (Complete)

| Step | Description | Status | Commit |
|------|-------------|--------|--------|
| 1 | Fix Technical Debt | Done | b683d12 |
| 2 | Content Depth (3 high-value + 9 placeholders) | Done | 7989940 |
| 3 | Pillar Page Architecture | Done | 7989940 |
| 4 | E-E-A-T Signals | Done | 7989940 |
| 5 | Visibility Monitoring Baseline | Done (0/9 EN, 0/4 ZH) | 1f10e4f |
| 6 | geo-content-optimizer Gap Analysis | Done (3 pages, 8 recs implemented) | da08abe |
| 7 | i18n Prune + VitePress noindex + robots.txt | Done | decce74 |
| 8 | Competitive Positioning + Competitor Keywords | Done | 04cb921 |
| 9 | Mermaid Diagram Rendering Fix | Done | 115cb87 |

### Phase 1 Audit: Claims vs Reality

| Claimed | Actual | Fix |
|---------|--------|-----|
| Swizzled component extracts frontmatter → rich TechArticle | Only injected url + publisher | Rewrote with useDoc() |
| TLDR component on every page | Only 4/18 pages | All 21 pages now have TLDR |
| 10 locales i18n ready | 8 locales empty | Pruned to 3: EN, zh-CN, ja |
| SearchAction in WebSite Schema | Points to 404 | Removed |
| Static assets | All 404 | Created favicon, logo, social card |
| Mermaid diagrams render | Plain text code blocks | Added @docusaurus/theme-mermaid + markdown.mermaid: true |

### Baseline Visibility (2026-06-13)

| Engine | Keywords | Cited | Data File |
|--------|----------|-------|-----------|
| GLM (EN) | 5 | 0 | `geo-data/geo_baseline_glm_2026-06.json` |
| GLM (ZH) | 4 | 0 | `geo-data/geo_baseline_glm_cn_2026-06.json` |

Next measurement date: **2026-07-01**

---

## Phase 2: Schema & Architecture Fixes (In Progress)

### Code Audit: Plans vs Implementation

| Recommendation | Source Plan | Current Code State | Delta |
|---|---|---|---|
| **Fix `datePublished` missing** | Analysis: `metadata.date` is undefined → field omitted | **Fixed**: Reads from `frontMatter.datePublished`, falls back to `dateModified` | Resolved |
| **Fix `dateModified` raw timestamp** | Analysis: `metadata.lastUpdatedAt` emits Unix epoch | **Fixed**: `new Date(metadata.lastUpdatedAt).toISOString()` | Resolved |
| **Fix hardcoded `siteUrl`** | Analysis: `'https://jacobinwwey.github.io'` hardcoded | **Fixed**: Uses `useDocusaurusContext().siteConfig.url` | Resolved |
| **`about` type: `Thing` → `DefinedTerm`** | Analysis: `Thing` is semantic vacuum | **Fixed**: Now emits `DefinedTerm` with `inDefinedTermSet` | Resolved |
| **Missing `.nojekyll`** | GitHub Pages requires it to prevent Jekyll processing | **Fixed**: Created `static/.nojekyll` | Resolved |
| **Redundant `favicon.ico`** | SVG favicon covers all modern browsers | **Fixed**: Deleted `favicon.ico` | Resolved |
| **CSS "GEO Optimization" overclaims** | Analysis: CSS has zero direct impact on AI crawlers | **Fixed**: Renamed 9 comments to accurate purpose (Readability, etc.) | Resolved |
| **3 pages missing `concepts`** | frontmatter audit: installation, quick-start, configuration | **Fixed**: Added concepts to all 3 | Resolved |
| **18 pages missing `citations`** | E-E-A-T signal: only 3/21 had citations | **Fixed**: Added 2 citations each to 15 pages (3 had existing + 3 just-fixed = 21/21) | Resolved |
| **2 pages use Organization author** | intro, faq used `@type: Organization` instead of Person @id | **Fixed**: Both now use Person @id | Resolved |
| **Add FAQPage Schema** | BrightEdge: 43% AI citations from FAQ Schema | **Fixed**: Swizzled component emits FAQPage for faq.mdx; 12 Q&A pairs | Resolved |

### Phase 2 Step Status

| Step | Description | Status |
|------|-------------|--------|
| P2-1 | Fix TechArticle Schema 3 bugs | Done |
| P2-2 | Add .nojekyll + remove favicon.ico | Done |
| P2-3 | Fix CSS comment overclaims | Done |
| P2-4 | Supplement missing frontmatter (concepts, citations, author) | Done |
| P2-5 | Add FAQPage Schema to FAQ page | Done |

---

## Phase 3: Architecture Evolution (Complete)

| Step | Description | Status |
|------|-------------|--------|
| P3-1 | Remove `ja` locale (0 translated pages → hreflang pollution) | Done |
| P3-2 | Consolidate or expand 5 provider stub pages | Deferred (needs content writing) |
| P3-3 | Sidebar reorder: Getting Started before pillar, FAQ last | Done |
| P3-4 | Apply for Algolia DocSearch | Deferred (after site indexed) |
| P3-5 | Add `position_in_response` to visibility_tester | Done |
| P3-6 | Organization Schema: add `sameAs` (GitHub, Discord) | Done |
| P3-7 | Extend visibility test to Perplexity engine | Deferred (needs API key) |
| P3-8 | Upgrade Docusaurus packages to ^3.10.1 (version consistency) | Done |

### Deferred (Explicitly NOT Doing)

| Item | Why |
|------|-----|
| `@docusaurus/plugin-ideal-image` | 6 static files, ROI too low |
| BreadcrumbList Schema | Docusaurus sidebar already provides nav hierarchy |
| English readability checker | Not a bottleneck; Chinese-only checker is sufficient |
| PWA / offline docs plugin | Documentation site doesn't need offline support |
| WebP/AVIF image formats | No pipeline support in Docusaurus; static assets too small to matter |
| kaTeX / math equation support | No math-heavy content |
| Custom 404 page | Default is acceptable |
| Blog / changelog section | Not a priority |
| Versioned documentation | Single version plugin, no need |

---

## Risks & Mitigations

| Risk | Status | Mitigation |
|------|--------|-----------|
| Site not indexed by Google | Open | Submit sitemap via Google Search Console post-deploy |
| Empty i18n locales emit wrong hreflang | **Fixed** | Removed ja locale; zh-CN has 1 translated page |
| Thin provider pages dilute crawl budget | Open | Phase 3: consolidate or expand |
| Mermaid 660KB bundle on non-diagram pages | Accepted | Docusaurus architecture limitation; gzip ~200KB |
| Correctness vs volume tradeoff in citations | **Fixed** | All citations point to real external authority sources |
| CSS comment overclaims create false causation narrative | **Fixed** | Renamed to accurate purpose descriptors |

---

## Success Metrics

| Timeframe | Metric | Target | Current |
|-----------|--------|--------|---------|
| 2 weeks | Docusaurus site indexed | Google `site:` returns results | Unknown |
| 2 weeks | First AI citation | 1+ ChatGPT/Perplexity mention | 0/9 |
| 1 month | Citation rate (GLM) | 5-10% for core keywords | 0% |
| 1 month | All pages with citations | 21/21 | **21/21 (fixed)** |
| 1 month | All pages with concepts | 21/21 | **21/21 (fixed)** |
| 2 months | Pillar Page cluster indexed | All in Google index | Unknown |
| 2 months | E-E-A-T Person Schema live | Person @id resolves as author | **19/21 → 21/21 (fixed)** |

---

## GEO Skill Capability Utilization

| Module | Capability | Used | Not Used | Priority |
|---|---|---|---|---|
| A1 | Organization Schema | WebSite + Person @graph + sameAs | — | Done |
| A2 | FAQPage Schema | Now emitting for faq.mdx | — | Done |
| A3 | Article Schema | TechArticle per page | `image` field (OG thumbnail) | P4 |
| A4 | Person/E-E-A-T | Person @id cross-reference (21/21) | `hasCredential` | P4 |
| A5 | Citation Schema | 21/21 pages now have citations | — | Done |
| A6 | BreadcrumbList | Not used | Full BreadcrumbList | Deferred |
| B | Readability Check | — | Chinese-only, not applicable to EN content | Deferred |
| C | Pillar Page Cluster | pillar-ai-knowledge exists | Cluster navigation HTML block | P4 |
| D1 | Visibility Test | GLM baseline + position metric | Perplexity engine | P4 |
| D2 | Quarterly Report | — | First report after 3 data points | Q3 2026 |
| E | Gap Analysis | 3 pages analyzed | Remaining 18 pages | P4 (after retest) |

---

## Measurement Cadence

| Date | Action |
|------|--------|
| 2026-07-01 | Retest GLM baseline (EN + ZH). Add `position_in_response` if P3-5 done. |
| 2026-07-01 | Check Google Search Console for indexing status |
| 2026-08-01 | Second retest. If cited > 0: expand to Perplexity. If still 0: audit indexed pages. |
| 2026-10-01 | First quarterly report via geo_report_generator.py (needs 3+ data points) |
