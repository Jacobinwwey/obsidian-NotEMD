# NotEMD GEO Phase 2 Roadmap

**Created:** 2026-06-12
**Status:** Active
**Scope:** Post-deployment GEO optimization, based on audit of Phase 1 deliverables vs actual code

---

## Phase 1 Audit: Claims vs Reality

| Claimed | Actual | Gap |
|---------|--------|-----|
| Swizzled component extracts frontmatter → rich TechArticle | Only injects url + publisher + mainEntityOfPage; frontmatter unread | Critical |
| TLDR component on every page | Only 4/18 pages | High |
| 10 locales i18n ready | zh-CN FAQ only; 8 locales empty | Medium |
| SearchAction in WebSite Schema | Points to `/search?q=` which 404s | High |
| Static assets (favicon, logo, social card) | `website/static/` missing; all assets 404 | High |

**Verdict:** Phase 1 laid infrastructure but left claims unfulfilled. Before building new, fix what's broken — empty Schema is worse than no Schema.

---

## Execution Order

### Step 1: Fix Technical Debt (blocking)

**1a. Swizzled Component —兑现 frontmatter → Schema**

File: `website/src/theme/DocItem/Layout/index.js`

Must read frontmatter and inject:
- `headline` from `title`
- `author` from frontmatter `author` (Person or Organization)
- `datePublished` / `dateModified` from Docusaurus metadata
- `about` from frontmatter `concepts` (Schema.org `Thing` array)
- `citation` from frontmatter `citations` (Schema.org `CreativeWork` array)
- `keywords` from frontmatter `keywords`

Without this, all 18 doc pages emit identical empty TechArticle shells — zero differentiation for AI crawlers.

**1b. Remove SearchAction Dead Link**

File: `website/docusaurus.config.js`

Delete the entire `potentialAction` block from WebSite Schema. Or: wire Algolia DocSearch (free tier for open source) and point SearchAction to real search.

Leaving a `potentialAction` pointing to a 404 is a negative trust signal.

**1c. Static Assets**

Create `website/static/img/` with:
- `favicon.ico`
- `logo.svg` (referenced in config)
- `logo.png`
- `notemd-social-card.jpg` (1200x630, for og:image)

Without these: config references break, `SoftwareApplication.image` 404s, `og:image` empty.

**1d. Remove GEO_OPTIMIZATION_REPORT.md from repo**

Done: `.gitignore` + `git rm --cached`. Internal report not for public.

---

### Step 2: Content Depth (highest GEO ROI)

Schema gets you structured; content gets you cited. 12/18 placeholder pages is the bottleneck.

**2a. Write 3 High-Value Pages (priority order):**

1. `concept-notes.mdx` — Notemd's core differentiator. AI engines answer "obsidian concept notes" queries; this page lets Notemd own that answer. 2000+ words, TLDR, architecture diagram, before/after examples.

2. `providers/overview.mdx` — 30+ LLM providers is a major selling point. Consolidate all provider info into one Pillar Page with a comparison table. This replaces 6 thin provider pages with 1 authoritative page.

3. `diagrams.mdx` — Visual features = Gemini's preference. Mermaid/Vega/Canvas/HTML generation workflow is unique to Notemd. Image-rich content with proper `ImageObject` alt descriptions.

**2b. Fill Remaining 9 Placeholders with Minimum Viable Content**

500-800 words each: TLDR + core workflow + config table + 1 concrete example. Sufficient for AI crawlers to determine the page has real content. Not publishing is worse than thin-but-useful.

**2c. Consolidate Provider Pages**

6 thin provider pages → 1 Pillar Page (`providers.mdx`) + optional deep dives. Thin pages = high bounce rate = AI signal decay. A single 30-provider comparison table is higher authority than 6 pages each saying "configure your API key."

---

### Step 3: Pillar Page Architecture

Current doc structure is flat (Docusaurus sidebar = linear navigation). GEO requires cluster topology with internal link authority.

**Pillar:** "Obsidian AI Knowledge Management Guide" (`website/docs/pillar-ai-knowledge.mdx`)
- 3000+ words covering the full workflow: LLM integration → wiki-links → concept notes → research → visualization
- Each section links to the corresponding detail doc as a cluster sub-page
- Every cluster sub-page links back to Pillar with a semantic intro line

**Cluster sub-pages (existing docs repurposed):**
- `wiki-links.mdx` → cluster for "knowledge linking"
- `concept-notes.mdx` → cluster for "concept extraction"
- `research.mdx` → cluster for "AI-assisted research"
- `diagrams.mdx` → cluster for "visual knowledge"
- `workflows.mdx` → cluster for "one-click automation"

**Implementation:** Add to each cluster page's TLDR:
```
This is part of the [Obsidian AI Knowledge Management Guide](/docs/pillar-ai-knowledge).
```

**Why:** BrightEdge data shows Pillar+cluster pages get 2.1x citation rate vs flat pages.

**Tradeoff:** Requires writing 1 original Pillar Page (~3000 words). But 1 Pillar + 5 internal-links >> 6 independent pages.

---

### Step 4: E-E-A-T Signals

Currently zero. Every doc is anonymous. AI engines downgrade anonymous content.

**4a. Person Schema for Jacobinwwey**

Inject via `docusaurus.config.js` headTags as a global `@graph` entry:
```json
{
  "@type": "Person",
  "@id": "https://jacobinwwey.github.io/obsidian-NotEMD/#person-jacobinwwey",
  "name": "Jacobinwwey",
  "url": "https://github.com/Jacobinwwey",
  "knowsAbout": ["Obsidian", "LLM Integration", "Knowledge Management", "TypeScript"],
  "sameAs": ["https://github.com/Jacobinwwey"]
}
```

**4b. Author Attribution on All Docs**

Add `author: jacobinwwey` to every doc frontmatter. Swizzled component (from Step 1a) reads it and injects `author` referencing `@id` of the Person Schema.

**4c. Citation Schema**

For external references (MinerU, Tavily, Obsidian API), add `citation` frontmatter. Swizzled component emits Schema.org `citation` → authority borrowing from cited sources.

---

### Step 5: Visibility Monitoring (Dual Engine)

**Baseline test immediately after deployment:**

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

**Monthly cadence:** Run both engines on 1st of each month.

**Script validation vs manual validation:** Scripts give numbers. Manual searches in ChatGPT/Perplexity/Gemini give context and tone — which matters for optimization direction.

---

### Step 6: geo-content-optimizer Gap Analysis

After deployment, run URL analysis on the 3 core pages:

```bash
# In Claude Code:
/geo-content-optimizer https://jacobinwwey.github.io/obsidian-NotEMD/docs/intro
/geo-content-optimizer https://jacobinwwey.github.io/obsidian-NotEMD/docs/wiki-links
/geo-content-optimizer https://jacobinwwey.github.io/obsidian-NotEMD/docs/faq
```

This compares your page content against what Google AI Overview actually says for relevant queries. Content gaps identified this way are 10x more precise than intuition-based writing.

---

### Step 7: Multilingual (Pruned)

Drop from 10 locales to 3 for now:

| Locale | Rationale |
|--------|-----------|
| EN | Default, global |
| zh-CN | Existing content, Chinese user base |
| ja | Japan is Obsidian's #2 market |

Remaining 7 locales: keep i18n config, do NOT translate. Empty locale > bad machine translation. Google penalizes low-quality translated content.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Docusaurus site not indexed by Google | All Schema is invisible | Verify with `site:jacobinwwey.github.io/obsidian-NotEMD` immediately post-deploy. Submit sitemap via Google Search Console. |
| CI/CD instability (4 build failures in Phase 1) | Delayed deployment = reduced crawl frequency | Pin all deps, add `npm ci` cache, add build smoke test in CI |
| VitePress + Docusaurus dual doc system | Duplicate content, confused crawlers | Add `noindex` meta to VitePress pages, or deprecate VitePress entirely |
| GitHub Pages sub-path weight | `obsidian-NotEMD/` < root domain in authority | Not P0. Consider custom domain (`notemd.dev`) in Phase 3 |
| Thin placeholder pages emit Schema | AI crawlers mark site as "low content density" | Fill all placeholders before building new features |

---

## Not Done (Deferred with Reason)

| Item | Why Deferred |
|------|-------------|
| BreadcrumbList Schema | Medium ROI; exists in nav already |
| 8-locale translation | Low ROI; bad translation = penalty |
| Custom domain | Infrastructure change, not content |
| Video/VTT captions | No video content exists yet |
| ImageObject Schema | Depends on having real images with proper alt |

---

## Success Metrics

| Timeframe | Metric | Target |
|-----------|--------|--------|
| 2 weeks | Docusaurus site indexed | Google `site:` returns results |
| 2 weeks | First AI citation | 1+ ChatGPT/Perplexity mention for "obsidian AI plugin" |
| 1 month | Citation rate (Perplexity) | 5-10% for core keywords |
| 1 month | All placeholders filled | 0 placeholder pages |
| 2 months | Pillar Page cluster indexed | Pillar Page + cluster pages all in Google index |
| 2 months | E-E-A-T Person Schema live | `jacobinwwey` resolves as author on all doc pages |
