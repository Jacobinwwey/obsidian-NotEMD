# NotEMD GEO Roadmap

**Created:** 2026-06-12
**Updated:** 2026-07-07
**Status:** Phase 1-8 shipped. The 2026-07-07 multilingual docs slice supersedes the old partial zh-CN boundary with full docs routes for every README/UI locale declared in `website/src/lib/publishedLocales.mjs`; Search Console plus AI visibility remain external post-deploy work.
**Scope:** Documentation-site GEO for AI search visibility, language truth, GitHub Pages reliability, and answer-engine retrieval quality. This does not cover plugin runtime i18n.

---

## Current Truth Snapshot

The website is a Docusaurus site under `website/`, deployed by `.github/workflows/deploy-docs.yml` on pushes to `main` that touch `website/**` or the workflow file. The workflow runs `npm ci`, `npm run build`, and `npm run audit:build` from the `website` working directory before uploading the Pages artifact.

The homepage is part of the GEO contract. Public GEO changes are incomplete if they only update maintainer notes, `llms.txt`, or schema without updating the visible GitHub Pages homepage.

The current public language surface is complete for every published documentation locale:

| Surface | Current state | Interpretation |
|---|---|---|
| English docs | Complete canonical docs under `website/docs/` | Primary crawl and answer source |
| Simplified Chinese | Full docs route set under `website/i18n/zh-CN/.../current/` | Public localized docs surface, aligned one-to-one with English routes |
| Traditional Chinese | Full docs route set under `website/i18n/zh-Hant/.../current/` | Public localized docs surface, aligned one-to-one with English routes |
| README/UI locale matrix | Full docs route sets for `zh-CN`, `zh-Hant`, `zh-TW`, `ja`, `fr`, `de`, `es`, `ko`, `it`, `pt`, `pt-BR`, `ru`, `ar`, `fa`, `hi`, `bn`, `nl`, `sv`, `fi`, `da`, `no`, `pl`, `tr`, `he`, `th`, `el`, `cs`, `hu`, `ro`, `uk`, `vi`, `id`, and `ms` | Public localized docs surfaces, aligned one-to-one with English routes |
| Fallback localized docs | Retired for the public docs route set | Public localized docs should not rely on English fallback pages or emit `noindex,follow` |
| Plugin UI i18n | Separate runtime feature | Do not treat runtime language support as website documentation coverage |
| Localized UI chrome (navbar, footer, sidebar labels, pagination) | Generated per public locale by `website/scripts/generate-localized-docs.cjs` plus Docusaurus i18n JSON | Visible docs navigation should not expose stale English category labels |

## 2026-07-07 Phase 8 Multilingual Docs Route Parity

### Finding

The previous GEO language policy was correct for a partial zh-CN release, but it became the wrong owner once the requirement changed to full multilingual docs. Keeping partial-scope fallback logic as the active contract would allow missing localized pages, stale English headings, incomplete sitemaps, and answer-engine claims that disagree with the visible GitHub Pages site.

### Fixes In This Slice

| Fix | Files | Result |
|---|---|---|
| Expand published locales | `website/src/lib/publishedLocales.mjs`, `website/docusaurus.config.js` | Public docs locales now include English plus every README/UI locale declared for documentation publishing |
| Generate localized docs | `website/scripts/generate-localized-docs.cjs`, `website/i18n/**` | Every source page under `website/docs/` has a localized counterpart in each public locale |
| Retire partial zh-CN scope | `website/src/lib/publishedLanguageScopeData.mjs`, `website/src/lib/languageRoutePolicy.js` | zh-CN scope now declares the full docs route set and locale-prefix parsing covers all public locales |
| Extend build audit | `website/scripts/audit-build.cjs` | Build audit checks localized source coverage, localized build output, sitemap entries, `llms.txt`, and non-`noindex` localized docs |
| Update GEO/runbook evidence | `website/README.md`, `website/static/llms.txt`, `docs/maintainer/github-pages-language-geo-workflow.*`, `docs/maintainer/github-pages-geo-measurement-log.*` | Maintainer docs now state the full multilingual docs boundary instead of the old partial-language boundary |

### Acceptance

| Requirement | Status | Evidence target |
|---|---|---|
| `/zh-CN/docs` aligns one-to-one with `/docs` | Implemented | `src/tests/websiteDocsContract.test.ts`, `npm --prefix website run audit:build` |
| Every README/UI documentation locale exposes the same docs routes | Implemented | `website/i18n/<locale>/docusaurus-plugin-content-docs/current/**`, `src/tests/websiteDocsContract.test.ts` |
| Visible zh-CN headings do not keep stale English labels | Implemented | stale-heading contract in `src/tests/websiteDocsContract.test.ts` |
| Full multilingual docs route boundary is represented in answer-engine metadata | Implemented | `website/static/llms.txt`, sitemap, hreflang, homepage copy |

### Remaining GEO Work

The remaining GEO work is external measurement, not another source-only route rewrite:

1. deploy the multilingual docs update through the Pages workflow;
2. submit or refresh `sitemap.xml` plus representative localized sitemaps in Search Console;
3. inspect root, zh-CN root, FAQ, provider overview, representative provider detail, and representative localized docs across the new locales;
4. rerun English, Chinese, Japanese, French, German, Spanish, Korean, and representative long-tail locale AI visibility prompts after the deployed Pages artifact is crawled.

## 2026-07-02 CI, Pages, CLI, And Slidev Closeout

### Finding

The remote `main` CI failure that needed investigation was historical, not a current failing source gate. The failed Pages run `27451762938` failed inside `actions/deploy-pages@v4` with `HttpError: Not Found` and the explicit instruction to enable GitHub Pages. Later `main` runs, including `28281641014`, completed successfully. Current `eb777ef` has no check-runs attached, and the legacy commit status API reports no statuses; that "pending" API state is therefore absence of legacy statuses, not a failed CI result.

This batch still treats Pages as a release gate. Touching `website/**` or `.github/workflows/deploy-docs.yml` must rerun `.github/workflows/deploy-docs.yml`, which performs `npm ci`, `npm run build`, and `npm run audit:build` from `website/` before deployment.

### Source-Side Closeout

| Area | Current truth | Status |
|---|---|---|
| Remote Pages CI | Historical failure was a Pages-enabled/settings 404; recent Pages deploys are green | Closed as source/build failure |
| GitHub Pages gate | Workflow still builds and audits generated output before upload | Active gate |
| GEO public site | Homepage, `llms.txt`, sitemap, hreflang, fallback noindex, provider-doc headings, and measurement evidence remain audit-backed | Active gate |
| CLI / maintainer automation | Cross-platform command resolution is now explicit and test-backed for maintainer helpers and release/repo-saga scripts | Closed for process-resolution bug class |
| Slidev environment probe | The Obsidian runtime command `notemd:probe-slide-export-environment` no longer relies on global Windows `shell: true`; Windows batch shims are resolved through an isolated quoted `cmd.exe /d /s /c call` path only when the resolved command is `.cmd` or `.bat` | Closed for Windows `spawn EINVAL` class |

### Remaining GEO Work

The remaining GEO work is external measurement, not another source-only route rewrite:

1. submit or refresh `sitemap.xml` and localized sitemaps in Search Console;
2. inspect root, zh-CN root, FAQ, provider overview, representative provider detail, and representative localized docs across public locales;
3. rerun English, Chinese, Japanese, French, German, Spanish, Korean, and representative long-tail locale AI visibility prompts after the deployed Pages artifact is crawled;
4. keep future locale expansion scoped to complete docs route sets declared and audited in the repository.

## 2026-06-26 Phase 7 zh-CN Content Parity & UI Alignment

### Finding

Phase 6 synchronized homepage GEO facts, but the zh-CN translated docs still had significant content gaps versus their English counterparts. Additionally, the zh-CN locale lacked *any* Docusaurus theme translations (`code.json`, `docusaurus.config.json`), so navbar labels, footer section titles, sidebar category labels, and pagination remained English on all zh-CN pages. The homepage JSON-LD `about` keywords and `isPartOf.name` were English-only even on the zh-CN homepage.

### Fixes In This Slice

| Fix | Files | Result |
|---|---|---|
| Add `code.json` theme UI translations | `website/i18n/zh-CN/code.json` | Navbar, footer, sidebar category, and pagination labels now render in Chinese on zh-CN pages |
| Add `docusaurus.config.json` config translations | `website/i18n/zh-CN/docusaurus.config.json` | Navbar item labels (Docs→文档, FAQ→常见问题, GitHub), footer section titles (Docs→文档, Community→社区, More→更多), and footer link labels translated for zh-CN |
| Fix FAQ — add 4 missing Q&A sections + `faqItems` frontmatter | `website/i18n/zh-CN/.../faq.mdx` | zh-CN FAQ now has all 12 Q&A sections matching EN, plus `faqItems` for FAQPage JSON-LD structured data |
| Fix pillar-ai-knowledge — add Backlinks, Key Settings tables, Language Support, Common Patterns | `website/i18n/zh-CN/.../pillar-ai-knowledge.mdx` | zh-CN pillar page now structurally matches EN with all subsections present |
| Fix configuration — add Configuration Profiles section | `website/i18n/zh-CN/.../configuration.mdx` | zh-CN config page now includes Export/Import settings (`notemd-config.json`) |
| Fix quick-start — add Explore All Features link | `website/i18n/zh-CN/.../quick-start.mdx` | zh-CN quick-start "下一步" now includes all navigation links |
| Fix providers/overview — add Available Tasks, error codes, reasoningEffort, expanded Next Steps | `website/i18n/zh-CN/.../providers/overview.mdx` | zh-CN provider page now matches EN technical detail |
| Fix intro — translate comparison table entries, add emoji checks, fix languageBoundary | `website/i18n/zh-CN/.../intro.mdx`, `website/src/pages/index.js` | zh-CN intro comparison table uses ✅/❌/⚠️; homepage `languageBoundary` no longer contains raw English words |
| Fix homepage JSON-LD locale conditioning | `website/src/pages/index.js` | `about` keywords and `isPartOf.name` are now locale-conditional (Chinese values on zh-CN pages) |

### Acceptance

| Requirement | Status | Evidence target |
|---|---|---|
| zh-CN FAQ content parity with EN | Implemented | All 12 Q&A sections present, `faqItems` frontmatter complete |
| zh-CN pillar page content parity with EN | Implemented | Backlinks, Key Settings tables, Language Support, Common Patterns all added |
| zh-CN config page includes Configuration Profiles | Implemented | Export/Import section present |
| zh-CN UI chrome fully translated | Implemented | `code.json` + `docusaurus.config.json` cover navbar, footer, sidebar, pagination |
| Homepage JSON-LD reflects locale | Implemented | `about` and `isPartOf.name` are conditional on `i18n.currentLocale` |
| Homepage `languageBoundary` uses proper Chinese | Implemented | "部分翻译，仅覆盖已审核的关键路径" replaces "partial" / "review" / "critical path" |
| All zh-CN retrievalLinks body text uses Chinese glosses | Implemented | "setup" → "安装设置", "endpoint/auth" → "端点与鉴权", "troubleshooting" → "故障排除", etc. |

### Remaining Known Gaps

| Gap | Significance | Best next action |
|---|---|---|
| 14 of 21 EN docs have no zh-CN translation (features, provider detail pages, advanced) | Medium — deliberate per GEO strategy; feature/advanced pages are not on the critical path | Keep zh-CN partial; promote pages only through scope data + audit |
| `SoftwareApplication` JSON-LD in `docusaurus.config.js` is English-only for all locales | Low-medium — global schema, not per-page | Later add locale-conditional headTags or move to per-page injection |
| `WebSite` JSON-LD in `docusaurus.config.js` description is English-only | Low-medium | Same as above — defer to locale-conditional headTags |

## 2026-06-24 Phase 6 Homepage Sync Gate

### Finding

The previous GEO work improved language scope, `llms.txt`, provider docs, and build-output checks, but the project homepage still looked like a generic documentation landing page. It did not visibly expose the same source-backed product facts, answer-engine source map, current release version, or partial zh-CN language boundary that the GEO documents described. The `SoftwareApplication` JSON-LD also still reported `1.9.2` after the `1.9.3` release.

### Fixes In This Slice

| Fix | Files | Result |
|---|---|---|
| Add homepage GEO surface | `website/src/pages/index.js`, `website/src/pages/index.module.css` | Root and zh-CN homepages now expose source-backed product facts, answer-engine source map links, current release, and the partial-language boundary |
| Sync structured data version | `website/docusaurus.config.js`, `website/src/pages/index.js` | SoftwareApplication JSON-LD and homepage WebPage JSON-LD report `1.9.3` through the Docusaurus config field |
| Sync AI retrieval map | `website/static/llms.txt` | `llms.txt` now names release `1.9.3`, links the homepage source map, and records the homepage GEO contract |
| Block future homepage drift | `website/scripts/audit-build.cjs` | Build audit now fails if homepage GEO text, `llms.txt` link, language boundary, release version, or 2026-06-24 homepage evidence is missing |
| Document the development constraint | `docs/maintainer/github-pages-language-geo-workflow.*`, `website/README.md`, measurement logs | Future GEO changes must update visible homepage content, JSON-LD, `llms.txt`, and audit expectations in the same change |

### Acceptance

| Requirement | Status | Evidence target |
|---|---|---|
| Homepage reflects GEO facts instead of only maintainer docs | Implemented | Built `index.html` and `zh-CN/index.html` contain source facts, answer-engine source map, and language boundary |
| Homepage links to AI retrieval map | Implemented | Built homepage links to `/obsidian-NotEMD/llms.txt` |
| JSON-LD release version is current | Implemented | Built homepage contains `softwareVersion: 1.9.3` |
| `llms.txt` and homepage stay aligned | Implemented | `npm run audit:build` checks both surfaces |
| External indexing claims remain separate | Preserved | Measurement logs still mark Search Console and AI visibility as post-deploy checks |

## 2026-06-22 Phase 5 Completion Slice

### Findings

| Finding | Evidence | Impact |
|---|---|---|
| Published zh-CN scope did not own every language signal | Scope was shared for sitemap/noindex, but alternates, locale dropdown, sidebar, paginator, and promotion source files were not all gated by the same data | A translated page could be promoted while UI and hreflang still leaked untranslated fallback routes |
| zh-CN promotion was not atomic | Translation files and scope metadata could drift because the build audit did not require every localized file to be declared | Future translated docs could be invisible to the scope gate or, worse, undeclared fallback pages could look published |
| Provider detail pages were still thin | Provider pages delegated most useful setup/auth/troubleshooting content to the overview page | Crawl quality and answer usefulness were weaker than the provider overview implied |
| Measurement chain was not explicit | The roadmap said to measure after deploy, but there was no maintainer log for Search Console, sitemap, AI visibility, and fallback evidence | Operators could not separate local build proof from external indexing proof |

### Fixes In This Slice

| Fix | Files | Result |
|---|---|---|
| Split source data from runtime helpers | `website/src/lib/publishedLanguageScopeData.mjs`, `website/src/lib/publishedLanguageScope.js` | Published zh-CN docs and critical paths have one auditable data owner |
| Add language route policy helpers | `website/src/lib/languageRoutePolicy.js` | Doc path extraction and zh-CN fallback decisions are centralized without adding a pass-through facade |
| Gate language metadata and navigation | `website/src/theme/SiteMetadata/index.js`, `website/src/theme/NavbarItem/LocaleDropdownNavbarItem/index.js`, `website/src/theme/DocRoot/Layout/Sidebar/index.js`, `website/src/theme/DocItem/Paginator/index.js` | Unpublished zh-CN fallback docs do not expose hreflang alternates, locale-switch targets, sidebar entries, or prev/next links |
| Promote zh-CN critical path | `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/**` | Homepage, intro, installation, quick start, configuration, provider overview, AI knowledge pillar, and FAQ are published zh-CN surfaces |
| Expand provider detail pages | `website/docs/providers/*.mdx` | Provider pages now carry setup, endpoint/auth, model discovery, troubleshooting, and use-case sections |
| Extend built-output audit | `website/scripts/audit-build.cjs` | Build audit checks source scope, localized files, alternates, fallback fences, sitemap, `llms.txt`, provider-page headings, and measurement evidence |
| Add measurement evidence log | `docs/maintainer/github-pages-geo-measurement-log.*` | Search Console, AI visibility, sitemap, route, and fallback checks have an explicit operator record |

### Acceptance

| Requirement | Status | Evidence target |
|---|---|---|
| Source scope owns promoted zh-CN docs | Implemented | `website/src/lib/publishedLanguageScopeData.mjs` |
| Critical zh-CN docs exist and are declared | Implemented | `website/scripts/audit-build.cjs` plus translation files |
| Unpublished zh-CN fallback pages are fenced | Implemented | Built HTML has `noindex,follow`, no alternates, no sitemap entries |
| English docs expose zh-CN alternates only when translation is published | Implemented | `website/src/theme/SiteMetadata/index.js` and build audit |
| Locale dropdown/sidebar/paginator avoid unpublished zh-CN docs | Implemented | Theme overrides plus build audit for published zh-CN links |
| Provider pages are no longer stubs | Implemented | Provider heading gate in `website/scripts/audit-build.cjs` |
| Search Console and AI visibility evidence is tracked | Implemented as maintainer log | External console/manual checks remain post-deploy |

## Prior Shipped Work

### Phase 1: Foundation

| Step | Status | Notes |
|---|---|---|
| Technical debt cleanup | Shipped | Historical baseline |
| Content depth | Shipped | High-value docs plus early placeholders |
| Pillar page architecture | Shipped | `docs/pillar-ai-knowledge.mdx` is the cluster anchor |
| E-E-A-T signals | Shipped | Person, citations, and publisher schema exist |
| Visibility monitoring baseline | Shipped | Baseline data exists under `geo-data/` |
| i18n pruning and noindex/robots direction | Shipped | Empty locale expansion was stopped |
| Competitive positioning | Shipped | Competitive keywords and positioning added |
| Mermaid rendering | Shipped | Mermaid theme enabled |

### Phase 2: Schema And Architecture

| Recommendation | Current code state | Status |
|---|---|---|
| Fix `datePublished` missing | Reads `frontMatter.datePublished`, falls back to `dateModified` | Shipped |
| Fix raw `dateModified` timestamp | Converts `metadata.lastUpdatedAt` to ISO | Shipped |
| Remove hardcoded doc page URL composition | Uses `siteConfig.url` and `siteConfig.baseUrl` through URL construction | Shipped |
| `about` type: `Thing` to `DefinedTerm` | Emits `DefinedTerm` with `inDefinedTermSet` | Shipped |
| Missing `.nojekyll` | `website/static/.nojekyll` exists | Shipped |
| FAQPage Schema | Swizzled doc layout emits FAQPage for `faq.mdx` | Shipped |
| Root WebPage Schema | Homepage emits localized WebPage JSON-LD | Shipped |

### Phase 3: Architecture Evolution

| Step | Description | Status |
|---|---|---|
| P3-1 | Remove empty/unsupported locales | Shipped |
| P3-2 | Expand provider stub pages | Shipped in Phase 5 |
| P3-3 | Sidebar reorder | Shipped |
| P3-4 | Apply for Algolia DocSearch | Deferred until indexing is stable |
| P3-5 | Add `position_in_response` to visibility tester | Shipped |
| P3-6 | Organization Schema `sameAs` | Shipped |
| P3-7 | Extend visibility test to Perplexity | Deferred, needs API key |
| P3-8 | Upgrade Docusaurus packages to `^3.10.1` | Shipped |

### Phase 4: Pages Reliability And Language Truth

| Requirement | Status | Evidence target |
|---|---|---|
| GitHub Pages root route exists | Shipped | `website/build/index.html` |
| zh-CN root route exists | Shipped | `website/build/zh-CN/index.html` |
| Deprecated Docusaurus markdown config removed | Shipped | No v4 deprecation warning in `npm run build` |
| Root broken markdown links removed | Shipped | No `/obsidian-NotEMD/` root broken-link warning in `npm run build` |
| Published language policy matches code | Shipped | README + roadmap state `en` plus partial `zh-CN` |
| Untranslated zh-CN fallback docs fenced | Shipped | Fallback docs emit `noindex,follow` |
| zh-CN homepage does not route users into fallback docs | Shipped, then narrowed by Phase 5 promotion | `npm run audit:build` rejects fallback links for unpublished docs |
| GitHub Pages deploy has built-output language/GEO gate | Shipped | `.github/workflows/deploy-docs.yml` runs `npm run audit:build` |
| AI retrieval entry point exists | Shipped | `website/build/llms.txt` |

## Better GEO Strategy

The effective strategy is truth-first and route-first, not locale-volume-first.

1. **Make canonical routes boring and stable.** Root, locale root, sitemap, robots, FAQ, intro, quick start, provider overview, and pillar pages must build without broken-link warnings.
2. **Publish only complete language surfaces.** Keep `en` canonical and keep every locale in `publishedLocales.mjs` route-complete before exposing it publicly. Do not count Docusaurus fallback pages as localized content.
3. **Let explicit scope files own language signals.** `publishedLocales.mjs` owns public locale metadata; `publishedLanguageScopeData.mjs` owns legacy zh-CN route compatibility. Sitemap, noindex, hreflang, locale dropdown, sidebar, paginator, homepage links, and `llms.txt` must follow those sources.
4. **Treat the homepage as a source surface.** Public GEO/product-positioning updates must appear on the GitHub Pages homepage when they affect how users or answer engines should describe Notemd.
5. **Use `llms.txt` as the compact answer-engine map.** It should point to canonical docs, state partial zh-CN coverage, and reject generated exports or stale issue text as primary sources.
6. **Prefer fewer provider pages with real operational content.** Thin pages dilute answer quality. Provider docs need setup, endpoint/auth, model discovery, troubleshooting, and use boundaries.
7. **Gate the built output, not only the source.** Docusaurus locale behavior mutates the final route graph. `npm run audit:build` must pass before Pages upload.
8. **Separate local proof from external proof.** Local build/audit can prove route truth; Search Console indexing and AI visibility require live post-deploy measurement.
9. **Keep zh-CN content parity with EN for all published pages.** A translated page that omits sections present in English is weaker than no translation. Content parity is now enforced by the Phase 7 alignment pass.

## Current Core Missing

| Missing item | Why it matters | Best next action |
|---|---|---|
| Live Search Console verification | Local build cannot prove Google has accepted canonical, sitemap, and language signals | Submit `sitemap.xml` and `zh-CN/sitemap.xml`, inspect root, zh-CN root, and representative docs |
| AI visibility retest after deployment | The old 0-citation baseline predates this route/content cleanup | Run EN and ZH prompts after Pages deploy, record exact prompts and citations |
| Post-deploy multilingual indexing verification | Source-side route parity is implemented, but local build cannot prove search engines have accepted every new localized route | Submit/inspect root and representative localized sitemaps after Pages deploy |
| `SoftwareApplication` JSON-LD locale conditioning | Global headTags in `docusaurus.config.js` cannot be locale-conditional | Later add locale-conditional wrapping or move to per-page injection via swizzled component |
| Automated provider content freshness | Heading gates prevent stubs, not stale provider facts | Later add source-backed checks against provider registry defaults, not public marketing pages |
| `llms.txt` drift protection beyond language scope | Current audit checks required route markers, not full semantic parity | Generate or snapshot route lists from Docusaurus metadata when docs volume grows |

## Risks And Mitigations

| Risk | Status | Mitigation |
|---|---|---|
| Site not indexed by Google | Open | Submit and inspect sitemap in Google Search Console after deploy |
| Empty or fallback i18n pages emit weak hreflang signals | Controlled | No alternates for unpublished zh-CN fallback docs; noindex and sitemap exclusion remain mandatory |
| Docusaurus theme override drift | Controlled, but real | Keep overrides small and policy-bearing; re-check after Docusaurus upgrades |
| zh-CN UI links users into fallback docs | Controlled | Homepage, locale dropdown, sidebar, and paginator now follow published scope |
| Provider page quality: thin provider pages dilute crawl budget | Controlled in source | Provider detail pages now carry required operational sections |
| Hand-maintained `llms.txt` can drift | Controlled | `npm run audit:build` checks published zh-CN routes and language-scope warnings |
| Search Console or AI visibility claims become stale | Open | Keep dated measurement logs; do not convert external checks into source-only assertions |
| Test/generated output entering main | Controlled | Keep `website/build`, `.docusaurus`, and generated exports ignored/uncommitted |
| zh-CN content parity degrades over time | Controlled | Phase 7 established the baseline; new sections added to EN must be translated in the same PR |

## Success Metrics

| Timeframe | Metric | Target | Current |
|---|---|---|---|
| Immediate | Docusaurus build | No root broken-link or deprecated markdown-hook warnings | Re-verify on Phase 7 deploy |
| Immediate | Build-output GEO audit | `npm run audit:build` passes | Re-verify on Phase 7 deploy |
| Immediate | README/UI locale docs route parity | Every published documentation locale has the full 21-page docs route set | Source-side aligned on 2026-07-07 |
| Immediate | Localized UI chrome | Navbar, footer, sidebar labels, pagination, and Docusaurus theme strings exist for every public docs locale | Generated i18n JSON deployed |
| Immediate | zh-CN FAQPage schema | `faqItems` frontmatter present for structured data | Implemented in Phase 7 |
| Immediate | Homepage JSON-LD locale conditioning | `about` keywords and `isPartOf.name` reflect current locale | Implemented in Phase 7 |
| Immediate | AI retrieval map | `llms.txt` lists canonical docs and all published documentation locale entrypoints | Covered by audit |
| Immediate | Homepage GEO sync | Homepage, JSON-LD, `llms.txt`, and audit share the same public facts | Covered by audit as of 2026-06-24 |
| Post-deploy | Search Console sitemap acceptance | Root and zh-CN sitemaps submitted and inspectable | Pending external console check |
| Post-deploy | First AI visibility signal | 1+ ChatGPT/Perplexity/GLM mention for target prompts | 0 baseline, pending retest |
| 1 month post-deploy | Citation rate | 5-10% for core keywords | Unknown |

## Measurement Cadence

| Date | Action |
|---|---|
| 2026-06-22 | Verify Phase 5 source-side build, audit, zh-CN scope, provider docs, measurement log, `llms.txt`, and sitemap contract |
| 2026-06-24 | Verify homepage GEO sync across visible homepage, JSON-LD, `llms.txt`, audit, and measurement logs |
| 2026-07-07 | Verify Phase 8 README/UI locale docs route parity, generated i18n chrome JSON, homepage/`llms.txt` language boundary, Docusaurus build, and build audit |
| After deploy | Submit sitemap and inspect canonical root, zh-CN root, FAQ, provider overview, and representative fallback pages in Search Console |
| 2026-07-01 | Retest AI visibility baseline in EN and ZH after the fixed Pages deployment |
| 2026-08-01 | Second retest; if citations remain 0, audit indexed pages and provider-page freshness |
| 2026-10-01 | First quarterly report via `geo_report_generator.py` after enough data points |
