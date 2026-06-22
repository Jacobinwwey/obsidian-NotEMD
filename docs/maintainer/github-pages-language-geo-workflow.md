# GitHub Pages Language And GEO Workflow

Language: **English** | [简体中文](./github-pages-language-geo-workflow.zh-CN.md)

This workflow records the public documentation-site gate for `website/`. It is intentionally separate from runtime plugin i18n and from Slidev export acceptance.

## Current Contract

The website publishes one complete language surface and one partial language surface:

1. English is the canonical complete documentation surface under `https://jacobinwwey.github.io/obsidian-NotEMD/docs/...`.
2. Simplified Chinese publishes the homepage plus the reviewed critical path: intro, installation, quick start, configuration, provider overview, AI knowledge pillar, and FAQ.
3. Docusaurus may still generate untranslated zh-CN fallback docs, but those pages must be `noindex,follow`, excluded from the zh-CN sitemap, hidden from zh-CN sidebar/paginator traversal, and excluded from hreflang alternates.
4. Locale switching from an unpublished zh-CN fallback route must go to a real route: zh-CN root for Chinese, canonical English for English.
5. `llms.txt` must describe the same language boundary so answer engines do not infer full multilingual coverage.

## Implemented Gate

The blocking gate is:

```bash
cd website
npm run build
npm run audit:build
```

`npm run audit:build` executes `website/scripts/audit-build.cjs`. The script checks built output and source contract points:

1. root pages exist: `build/index.html` and `build/zh-CN/index.html`;
2. root pages have the expected `lang`, canonical URL, and WebPage JSON-LD URL;
3. every published zh-CN source file exists and every localized zh-CN doc file is declared in `publishedLanguageScopeData.mjs`;
4. critical zh-CN doc paths are published;
5. published zh-CN docs do not emit `noindex,follow`;
6. unpublished zh-CN fallback docs emit `noindex,follow` and do not emit alternates;
7. English docs expose zh-CN alternates only when the zh-CN translation is published;
8. published zh-CN docs do not link to unpublished zh-CN fallback docs;
9. sitemap output includes canonical English docs, includes published zh-CN docs, and excludes unpublished zh-CN fallback docs;
10. `llms.txt` records the current language scope;
11. provider docs contain setup, endpoint/auth, model discovery, troubleshooting, and use-case sections;
12. `GEO_ROADMAP.md` and the measurement logs mention 2026-06-22, Search Console, AI visibility, and sitemap evidence.

The GitHub Pages workflow runs this audit before uploading the Pages artifact:

```text
.github/workflows/deploy-docs.yml
  -> npm run build
  -> npm run audit:build
  -> upload-pages-artifact
```

## Source Ownership

The published language data lives in:

```text
website/src/lib/publishedLanguageScopeData.mjs
```

Runtime helpers live in:

```text
website/src/lib/publishedLanguageScope.js
website/src/lib/languageRoutePolicy.js
```

Current published zh-CN doc paths:

```text
/docs/intro
/docs/getting-started/installation
/docs/getting-started/quick-start
/docs/getting-started/configuration
/docs/providers/overview
/docs/pillar-ai-knowledge
/docs/faq
```

This scope is consumed by:

1. `website/docusaurus.config.js` for sitemap filtering;
2. `website/src/theme/DocItem/Layout/index.js` for fallback-doc `noindex,follow`;
3. `website/src/theme/SiteMetadata/index.js` for hreflang and Open Graph locale alternates;
4. `website/src/theme/NavbarItem/LocaleDropdownNavbarItem/index.js` for locale-switch targets;
5. `website/src/theme/DocRoot/Layout/Sidebar/index.js` for zh-CN sidebar filtering;
6. `website/src/theme/DocItem/Paginator/index.js` for zh-CN previous/next filtering;
7. `website/src/pages/index.js` and `website/static/llms.txt` for public entry points.

The important rule is not "add a translation file." The rule is "add the translation file and publish it through the scope data in the same change." If either side is missing, the audit should fail.

## Promotion Checklist

When promoting a zh-CN doc from fallback to published:

1. Translate the source file under `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/...`.
2. Add the doc id, route path, and source path to `publishedLanguageScopeData.mjs`.
3. Confirm the page should appear in zh-CN sidebar and paginator traversal.
4. Update `website/static/llms.txt` if the doc becomes part of the public AI retrieval map.
5. Run `npm --prefix website run build && npm --prefix website run audit:build`.
6. After deploy, update `docs/maintainer/github-pages-geo-measurement-log.md` with Search Console and AI visibility observations.

## Why This Shape

The tempting shortcut is to treat Docusaurus locale fallback as useful GEO surface area. That is wrong. It produces URLs that look Chinese but serve English content, weakens hreflang truth, and sends users into routes that were never reviewed as localized pages.

The stricter scope-data model has a maintenance cost: every promotion touches translation content, data, `llms.txt`, and build proof. The payoff is that sitemap, robots, alternates, UI navigation, and AI retrieval all tell the same truth.

## Current Best Direction

1. Keep English canonical and complete.
2. Grow zh-CN by reviewed critical-path pages, not by locale count.
3. Keep provider pages operationally useful before adding more provider landing pages.
4. Treat Search Console and AI visibility as post-deploy measurement, not local build proof.
5. Avoid new generic wrappers around Docusaurus theme components. Theme overrides are acceptable here only because they own concrete policy: alternates, locale switching, sidebar filtering, and paginator filtering.
