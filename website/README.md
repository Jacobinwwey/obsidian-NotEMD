# Notemd Documentation Website

Docusaurus serves the public user, developer and Agent guides. The repository's VitePress site under `docs/` retains engineering procedures and dated evidence.

Current publication rules: [English](../docs/maintainer/github-pages-language-geo-workflow.md) · [简体中文](../docs/maintainer/github-pages-language-geo-workflow.zh-CN.md). Execution status: [1.9.8 plan](../docs/plans/2026-09-13-001-feat-1-9-8-release-docs-geo-plan.en.md). Local builds do not establish that the candidate has been published.

## Develop And Verify

Use Node 24, from `website/`:

```bash
npm ci
node node_modules/playwright/cli.js install --with-deps chromium
npm start
```

Before publication:

```bash
npm run build
npm run audit:build
npm run audit:navigation
```

The production build writes `build/`, including the generated `llms.txt`. Internal link failures are fatal. The audit reads real HTML, canonical/hreflang, robots, sitemap, JSON-LD, release facts and source-review receipts. The browser gate covers four audience journeys, the current upgrade guide, footer FAQ and dark provider page at three widths (24 scenarios per locale). It checks keyboard access, console/page errors, horizontal overflow, serious/critical accessibility findings, transparent table headers and inline path glyph order. Manual CJK/RTL and focus review still matters.

For a focused check with production locale prefixes:

```bash
node node_modules/@docusaurus/core/bin/docusaurus.mjs build --locale en --locale es
node scripts/audit-navigation.cjs --locales en,es --report-dir .cache/spanish-navigation
```

Exactly one `--locale` disables the automatic locale prefix in this Docusaurus CLI. Repeated flags are required; changing only `--out-dir` can produce wrong asset URLs and hydration errors. A focused build does not replace the final all-locale gate.

## Content And Locale Contract

The registry declares English plus full docs routes for Simplified Chinese (`zh-CN`) and 32 other localized route sets. The 1.9.8 candidate has 24 canonical guides; all 34 locales require 816 documents before deployment. Consult the plan for actual completion, not just directory presence.

Only English and zh-CN are currently indexable. Other languages remain reachable for review with `noindex,follow` and are excluded from sitemap and eligible search alternates. Website languages, plugin UI languages and a model's translation ability are separate contracts.

- Every source guide requires a complete localized counterpart, title, description, summary and navigable task path.
- Provider docs contain setup, endpoint/auth, model discovery, troubleshooting, and use-case sections.
- FAQ metadata must match the visible answers. Technical identifiers, URLs, configuration keys and file extensions remain stable.
- Homepages must expose newcomer, user, developer and Agent paths plus the current release guide. Missing localized fields must not silently fall back to English.
- `i18n/source-review.json` records reviewed source/translation hashes. A changed file requires actual review before refreshing its receipt.

Codex authors and reviews translations directly under the current policy. Do not invoke LM Studio, another model, translation APIs or legacy translation-writing scripts. Tools may format, validate and render authored text. Independent native-speaker review and indexing promotion require their own evidence; AI proofreading is not that evidence. This policy does not remove the plugin's local-provider support.

## Ownership

| Concern | Source |
|---|---|
| Version, description, release/install URLs | `src/lib/releaseFacts.cjs`, derived from root package/manifest metadata |
| Source guides / translated guides | `docs/`, `i18n/<locale>/docusaurus-plugin-content-docs/current/` |
| Locale registry / indexability | `src/lib/publishedLocales.mjs`, `src/lib/localePublication.mjs` |
| Legacy-compatible full route data | `website/src/lib/publishedLanguageScopeData.mjs`, consumed by `website/src/lib/publishedLanguageScope.js` and `src/lib/languageRoutePolicy.js` |
| Home / navigation copy | `src/pages/index.js`, `src/lib/homeCopyCatalog.mjs`, `src/lib/siteLocaleCatalog.cjs`, locale JSON |
| Global and article metadata | `docusaurus.config.js`, `src/theme/SiteMetadata/`, `src/theme/DocItem/Layout/` |
| Locale switching / sidebar / paginator | Policy-owning overrides under `src/theme/` |
| Machine-readable route map | `plugins/documentation-map.cjs` generates canonical `build/llms.txt` after the default-locale build |
| Content and navigation gates | `website/scripts/audit-build.cjs`, `scripts/audit-navigation.cjs` |
| Published-release admission | `scripts/verify-published-release.cjs` |

The map consumes the same release projection and locale/route owners as the site. Do not reintroduce a separately versioned static copy. Builds write generated output, not tracked source files. Existing theme overrides own real routing/metadata policy; do not add pass-through layers around them.

## Deployment

[Public site](https://jacobinwwey.github.io/obsidian-NotEMD/).

`.github/workflows/deploy-docs.yml` provides read-only PR verification and mainline Pages deployment. Only the deploy job has Pages write/id-token permissions. It requires a matching public stable Release with nonempty `main.js`, `manifest.json`, `styles.css`, `README.md`; lookup errors fail closed. Asset availability does not replace the release publisher's downloaded-hash check.

Publish once, refresh the chronicle serially, then explicitly dispatch Pages and verify its served revision. `GITHUB_TOKEN` events do not guarantee a second workflow run. Record actual release, tag, assets and deployment evidence before marking the plan complete.

## Discoverability

Keep visible answers, examples, structured data, release version, canonical URLs, sitemap and `llms.txt` consistent. The map is a navigation aid, not a ranking mechanism. Do not fabricate citations, ratings or comparative performance claims.

Search Console and AI visibility are external post-deploy observations, recorded in the [measurement log](../docs/maintainer/github-pages-geo-measurement-log.md). Missing console access means not measured. Historical Pages settings errors and earlier passing deployments do not establish the state of a new candidate.

## License

MIT, as for the plugin.
