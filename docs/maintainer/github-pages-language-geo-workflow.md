# GitHub Pages Language And GEO Workflow

Language: **English** | [简体中文](./github-pages-language-geo-workflow.zh-CN.md)

This is the current publication procedure for `website/`, reviewed on 2026-09-14. Plugin UI localization and native export acceptance have separate contracts. The [1.9.8 plan](../plans/2026-09-13-001-feat-1-9-8-release-docs-geo-plan.en.md) records implementation status; this procedure does not assert that a candidate is already published.

## Publication Contract

- English is the canonical complete source at `https://jacobinwwey.github.io/obsidian-NotEMD/docs/...`.
- Every locale declared in `website/src/lib/publishedLocales.mjs` must expose the full docs route set. The 1.9.8 candidate has 24 canonical routes, so admission requires 816 documents across 34 locales.
- The localized matrix is `zh-CN`, `zh-Hant`, `zh-TW`, `ja`, `fr`, `de`, `es`, `ko`, `it`, `pt`, `pt-BR`, `ru`, `ar`, `fa`, `hi`, `bn`, `nl`, `sv`, `fi`, `da`, `no`, `pl`, `tr`, `he`, `th`, `el`, `cs`, `hu`, `ro`, `uk`, `vi`, `id`, `ms`. Adding a locale or source route requires all counterparts in the same change.
- Only English and zh-CN are currently indexable. Other languages remain accessible with an explicit publication label and `noindex,follow`; omit them from sitemap and eligible search alternates until independently qualified. Direct AI authoring is not native-human review and does not automatically promote indexing.
- Newcomers, users, developers and Agents must each reach a complete task guide. A navigation label or placeholder is insufficient.
- A candidate version may be built and reviewed locally. Pages must not promote it as a downloadable stable release until the matching public, non-prerelease GitHub Release and all four required assets exist.

## Direct Authoring And Review

Codex writes and reviews translations directly under the current policy. Do not invoke LM Studio, translation APIs, another model or the legacy translation-writing scripts (`generate-localized-docs.cjs`, `translate-site-core.cjs`, `translate-*.cjs --write`) to author or validate them. This restriction does not remove LM Studio as a supported plugin provider.

1. Check the English guide against source defaults, commands, data handling and output behavior before translating.
2. Translate the complete affected guide and its title, description, summaries, examples and visible navigation. Keep each language independently readable. Translate instructional prose even inside code fences, while preserving executable syntax, identifiers, URLs and exact output markers.
3. Check the translation against the same source revision. Read through task prerequisites, mutations, cancellation, retry and expected output. Structural parity is necessary but does not establish semantic accuracy.
4. Record normalized source and authored-file SHA-256 values in `website/i18n/source-review.json`. A changed source or translation invalidates the receipt. Update it only after reviewing that change; never approve drift by blindly recomputing hashes.
5. Preserve honest authorship metadata. An independent native-speaker review is a separate event and must not be inferred from AI proofreading or a successful build.
6. Keep homepage, navbar, footer, FAQ metadata and README summaries aligned. English fallback merged into an incomplete localized homepage is a release blocker.

Tools may enumerate, format, hash and render already-authored text. They may copy exact identifiers and URLs from source tables. They must not generate translations through an external service.

## Source Ownership

| Contract | Owner |
|---|---|
| Current software facts | `website/src/lib/releaseFacts.cjs`, derived from repository package/manifest metadata |
| Locale availability / indexing | `website/src/lib/publishedLocales.mjs`, `website/src/lib/localePublication.mjs` |
| Canonical guides / translations | `website/docs/`, `website/i18n/<locale>/docusaurus-plugin-content-docs/current/` |
| Source-review receipts | `website/i18n/source-review.json` |
| Shared route scope | `website/src/lib/publishedLanguageScopeData.mjs`, `website/src/lib/publishedLanguageScope.js`, `website/src/lib/languageRoutePolicy.js` |
| Localized home / chrome | `website/src/lib/homeCopyCatalog.mjs`, `website/src/lib/siteLocaleCatalog.cjs`, locale JSON messages |
| Search metadata | `website/src/theme/SiteMetadata/index.js` |
| Locale navigation | `website/src/theme/NavbarItem/LocaleDropdownNavbarItem/index.js` |
| Sidebar / paginator compatibility | `website/src/theme/DocRoot/Layout/Sidebar/index.js`, `website/src/theme/DocItem/Paginator/index.js` |
| Machine-readable guide map | `website/plugins/documentation-map.cjs`, generating canonical `website/build/llms.txt` from release and route owners |
| Build / navigation / release admission | `website/scripts/audit-build.cjs`, `website/scripts/audit-navigation.cjs`, `website/scripts/verify-published-release.cjs` |

The complete route set is derived from `website/docs/`. Important entries include `/docs/intro`, `/docs/getting-started/quick-start`, `/docs/providers/overview`, `/docs/faq`, `/docs/developers/overview`, `/docs/agents/overview` and `/docs/releases/1.9.8`. Keep existing public routes and useful anchors stable.

## Local Verification

Use Node 24 and install dependencies under `website/`. Run from that directory:

```bash
npm ci
node node_modules/playwright/cli.js install --with-deps chromium
npm run build
npm run audit:build
node scripts/audit-navigation.cjs
```

Check the package lock and CI workflow for the installed browser package before preparing a new environment. Plugin tests separately require both root Playwright browser revisions.

The build audit checks route/heading/frontmatter parity, authored-source receipts, localized summaries across all guides, visible FAQ/metadata agreement, homepage audience/release links, version consistency, canonical URLs, `lang`, JSON-LD, robots, sitemap and language policy. Unexpected internal link failures must block delivery. Do not replace these checks with required marketing slogans or relax them to admit incomplete translations.

The browser audit exercises the four audience paths, the current upgrade guide, footer FAQ and dark provider page at 390/768/1440 px: 24 page scenarios per locale. It checks keyboard access, overflow, console/page errors, serious/critical accessibility findings, transparent table-header text and actual glyph order in inline paths. Resolve every gate failure. Inspect representative CJK and RTL screenshots and focus order manually; an automated report does not replace that review.

For a focused production-layout check, pass repeated locale flags:

```bash
node node_modules/@docusaurus/core/bin/docusaurus.mjs build --locale en --locale fr
node scripts/audit-navigation.cjs --locales en,fr --report-dir .cache/french-navigation
```

A build with exactly one `--locale` disables automatic locale URL prefixes in the installed Docusaurus CLI. Changing only `--out-dir` does not repair the asset base URL and can cause hydration failures. Space-separated locale values after one flag can be interpreted as the site directory. Focused evidence does not replace the final all-locale build.

## CI And Deployment

`.github/workflows/deploy-docs.yml` verifies pull requests with read-only permissions, the pinned browser, build/content gates, navigation checks and retained evidence. Pages write/id-token permissions belong only to the mainline deployment job. A green PR build does not publish.

Before deploying, `verify-published-release.cjs` checks the advertised tag, public stable state and uploaded nonempty `main.js`, `manifest.json`, `styles.css`, `README.md`. Lookup, authentication and network errors fail closed. This availability gate does not replace the publisher's downloaded-hash verification.

Publish through one release owner, refresh the chronicle serially, then explicitly dispatch Pages. Events created by `GITHUB_TOKEN` do not guarantee another workflow run. Record the accepted revision, release/tag identity, deployment run and served source revision. Verify live version, localized/audience routes, canonical/hreflang, robots, sitemap, llms and support/install links before closing the plan. Repository About should link to the canonical Pages URL.

## Discoverability And Evidence

Public wording, JSON-LD and `llms.txt` must describe the same implementation, current version and language boundaries. Prefer useful task answers, inspectable examples, explicit prerequisites, stable links and dated evidence. Do not claim fabricated rankings, ratings, testimonials or competitor superiority.

`llms.txt` is a curated navigation aid, not a ranking mechanism. Google AI features do not require special AI files or schema. Canonical, indexability, internal links and truthful visible content remain the technical work under project control.

Record Search Console and AI visibility observations in the [measurement log](./github-pages-geo-measurement-log.md), with date, URL/language, tool and limitations. Bing citation counts do not prove ranking within an answer. Missing account access means **not measured**, not zero traffic. External search/citation outcomes are post-deploy observations and do not become established facts because a local build passes.

## Maintenance Tradeoff

Full locale parity has a real review cost. Keep canonical pages focused and reuse authoritative source references; do not multiply competing manuals. Route availability, authoring review and search indexability remain separate decisions. Preserve existing policy-owning Docusaurus overrides, and add no generic theme layer merely to rename a check.
