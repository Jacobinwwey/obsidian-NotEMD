# NotEMD GEO Phase 2 Roadmap

**Created:** 2026-06-12
**Updated:** 2026-06-12
**Status:** Steps 1-7 complete
**Scope:** Post-deployment GEO optimization, based on audit of Phase 1 deliverables vs actual code

---

## Execution Status

| Step | Description | Status |
|------|-------------|--------|
| 1 | Fix Technical Debt | Done (commit b683d12) |
| 2 | Content Depth (3 high-value + 9 placeholders) | Done (commit 7989940) |
| 3 | Pillar Page Architecture | Done (commit 7989940) |
| 4 | E-E-A-T Signals | Done (commit 7989940) |
| 5 | Visibility Monitoring | Deferred (needs deployment first) |
| 6 | geo-content-optimizer Gap Analysis | Deferred (needs deployment first) |
| 7 | Multilingual Pruned to EN + zh-CN + ja | Done (this commit) |
| — | VitePress noindex | Done (this commit) |
| — | robots.txt + sitemap | Done (this commit) |

---

## Phase 1 Audit: Claims vs Reality

| Claimed | Actual | Gap | Fix |
|---------|--------|-----|-----|
| Swizzled component extracts frontmatter → rich TechArticle | Only injected url + publisher; frontmatter unread | Critical | Rewrote with useDoc(); extracts headline, author, datePublished, dateModified, about, citations, keywords |
| TLDR component on every page | Only 4/18 pages | High | All 18 pages now have TLDR with cluster backlinks |
| 10 locales i18n ready | zh-CN FAQ only; 8 locales empty | Medium | Pruned to 3: EN, zh-CN, ja |
| SearchAction in WebSite Schema | Points to `/search?q=` which 404s | High | Removed SearchAction; commented Algolia placeholder |
| Static assets (favicon, logo, social card) | `website/static/` missing; all assets 404 | High | Created favicon.svg/ico, logo.svg/png, notemd-social-card.jpg |

---

## What Each Commit Delivered

### Commit b683d12 — Step 1: Fix Technical Debt

**Swizzled component** (`website/src/theme/DocItem/Layout/index.js`):
- Added `useDoc()` to read frontmatter
- Emits complete TechArticle: headline, description, author, datePublished, dateModified, about, citations, keywords
- Fixed double-base-url bug in SSR permalink construction

**docusaurus.config.js:**
- Removed SearchAction dead link
- Merged WebSite + Person Schema into single @graph
- Commented out non-functional Algolia placeholder

**All 18 doc pages:**
- Added `author` frontmatter referencing Person @id for E-E-A-T

**Static assets:**
- Created `website/static/img/` with favicon, logo, social card

### Commit 7989940 — Steps 2-4: Content, Pillar Page, E-E-A-T

**3 High-Value Pages:**
- `concept-notes.mdx`: extraction pipeline, dedup 5-step algorithm, config table, filename rules
- `diagrams.mdx`: spec-first architecture, 8 intent types, rendering backends, preview/export, config
- `providers/overview.mdx`: 36-provider Pillar Page, per-task model strategy, transport/retry/caching

**9 Placeholder Pages filled:**
- research, translation, workflows (features)
- custom-prompts, batch-processing, troubleshooting (advanced)
- openai, anthropic, google, local, china (provider redirects → overview)

**Pillar Page:** `pillar-ai-knowledge.mdx` — 3000+ word guide, cluster backlinks in every feature/provider doc

**E-E-A-T Citations:** Added Citation Schema to intro, faq, pillar (Obsidian, Ollama, Tavily, Mermaid, Vega-Lite)

### This Commit — Steps 5-7 Pruning + VitePress noindex + robots.txt

- Pruned i18n from 10 → 3 locales (EN, zh-CN, ja)
- Added `noindex, nofollow` to VitePress config (prevents duplicate content confusion)
- Added `robots.txt` with sitemap reference

---

## Pending (Requires Deployment First)

### Step 5: Visibility Monitoring

After deployment, run baseline tests:

```bash
# International (Perplexity)
python ~/.claude/skills/geo-optimizer/scripts/visibility_tester.py \
  --brand "notemd" \
  --engine perplexity \
  --keywords "obsidian AI plugin" "obsidian knowledge base" "obsidian wiki links" \
  --history geo_baseline_intl_2026-06.json

# China (Kimi)
python ~/.claude/skills/geo-optimizer/scripts/visibility_tester.py \
  --brand "notemd" \
  --engine kimi \
  --keywords "obsidian AI插件" "obsidian知识库" "obsidian笔记插件" \
  --history geo_baseline_cn_2026-06.json
```

Monthly cadence on 1st of each month. Both scripts + manual checks in ChatGPT/Perplexity/Gemini.

### Step 6: geo-content-optimizer Gap Analysis

After deployment:

```
/geo-content-optimizer https://jacobinwwey.github.io/obsidian-NotEMD/docs/intro
/geo-content-optimizer https://jacobinwwey.github.io/obsidian-NotEMD/docs/wiki-links
/geo-content-optimizer https://jacobinwwey.github.io/obsidian-NotEMD/docs/faq
```

---

## Risks & Mitigations

| Risk | Status |
|------|--------|
| Docusaurus site not indexed by Google | Verify post-deploy with `site:jacobinwwey.github.io/obsidian-NotEMD`; submit sitemap via Google Search Console |
| VitePress + Docusaurus dual doc confusion | Fixed: VitePress now has `noindex, nofollow` |
| i18n broken links in pt/ko/es/etc. locales | Fixed: pruned to 3 locales |
| Thin placeholder pages emitting Schema | Fixed: all 18 pages now have real content |

---

## Success Metrics

| Timeframe | Metric | Target |
|-----------|--------|--------|
| 2 weeks | Docusaurus site indexed | Google `site:` returns results |
| 2 weeks | First AI citation | 1+ ChatGPT/Perplexity mention for "obsidian AI plugin" |
| 1 month | Citation rate (Perplexity) | 5-10% for core keywords |
| 1 month | All pages with real content | 0 placeholder pages (DONE) |
| 2 months | Pillar Page cluster indexed | Pillar + cluster pages all in Google index |
| 2 months | E-E-A-T Person Schema live | `jacobinwwey` resolves as author (DONE) |

---

## Deferred Items

| Item | Why Deferred |
|------|-------------|
| BreadcrumbList Schema | Medium ROI; nav hierarchy exists in Docusaurus sidebar |
| ja translation of FAQ | Notemd has no Japanese content yet; auto-translation = penalty risk |
| Custom domain | Infrastructure change, not content |
| Algolia DocSearch | Apply for free open-source tier after site is indexed |
