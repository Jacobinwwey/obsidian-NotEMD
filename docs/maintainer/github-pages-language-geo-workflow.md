# GitHub Pages Language And GEO Workflow

Language: **English** | [简体中文](./github-pages-language-geo-workflow.zh-CN.md)

This workflow records the public documentation-site gate for `website/`. It is separate from runtime plugin i18n and from Slidev export acceptance.

## Current Contract

The website now publishes one canonical source surface and a complete localized documentation route set for every README/UI locale declared in `website/src/lib/publishedLocales.mjs`:

1. English remains the canonical complete documentation surface under `https://jacobinwwey.github.io/obsidian-NotEMD/docs/...`.
2. The public localized docs matrix is `zh-CN`, `zh-Hant`, `zh-TW`, `ja`, `fr`, `de`, `es`, `ko`, `it`, `pt`, `pt-BR`, `ru`, `ar`, `fa`, `hi`, `bn`, `nl`, `sv`, `fi`, `da`, `no`, `pl`, `tr`, `he`, `th`, `el`, `cs`, `hu`, `ro`, `uk`, `vi`, `id`, and `ms`; each locale must expose the same docs route set as `website/docs`.
3. A locale must not be added to `publishedLocales.mjs` unless every source page under `website/docs/` has a localized counterpart under `website/i18n/<locale>/docusaurus-plugin-content-docs/current/`.
4. The previous partial zh-CN fallback policy is retired for public docs. Built localized docs must not rely on English fallback pages and must not emit `noindex,follow`.
5. `llms.txt`, sitemap output, hreflang metadata, the homepage language boundary, and build-audit expectations must describe the same full-route multilingual contract.
6. Public GEO/product-positioning changes must update the visible GitHub Pages homepage, homepage JSON-LD, `llms.txt`, and build-audit expectations in the same change. Updating only maintainer notes is not enough.

## Implemented Gate

The blocking gate is:

```bash
cd website
npm run build
npm run audit:build
```

`npm run audit:build` executes `website/scripts/audit-build.cjs`. The script checks built output and source contract points:

1. root pages exist for English and every published locale;
2. root pages have the expected `lang`, canonical URL, and WebPage JSON-LD URL where applicable;
3. every English source doc has a matching localized source doc for every locale declared in `publishedLocales.mjs`;
4. `publishedLanguageScopeData.mjs` declares the full docs route set for zh-CN compatibility gates;
5. localized docs build for every supported locale and do not emit `noindex,follow`;
6. sitemap output includes canonical English docs and each localized docs route;
7. `llms.txt` records the current multilingual route set and localized entry points;
8. provider docs contain setup, endpoint/auth, model discovery, troubleshooting, and use-case sections;
9. `GEO_ROADMAP.md` and the measurement logs mention baseline evidence, homepage sync evidence, Search Console, AI visibility, and sitemap evidence;
10. the homepage exposes source-backed product facts, an answer-engine source map, the `llms.txt` link, the current release version, and the full multilingual docs boundary.

The GitHub Pages workflow runs this audit before uploading the Pages artifact:

```text
.github/workflows/deploy-docs.yml
  -> npm run build
  -> npm run audit:build
  -> upload-pages-artifact
```

As of 2026-07-05, the workflow is pinned to Node 24 compatible action major versions: `actions/checkout@v7`, `actions/setup-node@v6` with `node-version: 24`, `actions/upload-pages-artifact@v5`, and `actions/deploy-pages@v5`. The deploy job retries the official `actions/deploy-pages@v5` step up to three times with short waits between attempts. This retry only covers GitHub Pages service-side deployment failures and does not mask checkout, install, build, audit, or artifact upload failures.

## Source Ownership

The full zh-CN compatibility scope lives in:

```text
website/src/lib/publishedLanguageScopeData.mjs
```

The public locale matrix lives in:

```text
website/src/lib/publishedLocales.mjs
```

Runtime helpers live in:

```text
website/src/lib/publishedLanguageScope.js
website/src/lib/languageRoutePolicy.js
```

Localized docs are generated and patched by:

```text
website/scripts/generate-localized-docs.cjs
```

The currently published localized docs route set is the complete set under `website/docs/`, including:

```text
/docs/intro
/docs/getting-started/installation
/docs/getting-started/quick-start
/docs/getting-started/configuration
/docs/features/wiki-links
/docs/features/concept-notes
/docs/features/research
/docs/features/translation
/docs/features/diagrams
/docs/features/workflows
/docs/providers/overview
/docs/providers/openai
/docs/providers/anthropic
/docs/providers/google
/docs/providers/local
/docs/providers/china
/docs/advanced/custom-prompts
/docs/advanced/batch-processing
/docs/advanced/troubleshooting
/docs/pillar-ai-knowledge
/docs/faq
```

This scope is consumed by:

1. `website/src/theme/DocItem/Layout/index.js` for legacy zh-CN fallback `noindex,follow` fencing. With full-route localization this should be a no-op for public docs.
2. `website/src/theme/SiteMetadata/index.js` for hreflang and Open Graph locale alternates.
3. `website/src/theme/NavbarItem/LocaleDropdownNavbarItem/index.js` for locale-switch targets.
4. `website/src/theme/DocRoot/Layout/Sidebar/index.js` for zh-CN sidebar filtering compatibility.
5. `website/src/theme/DocItem/Paginator/index.js` for zh-CN previous/next filtering compatibility.
6. `website/src/pages/index.js`, `website/docusaurus.config.js`, and `website/static/llms.txt` for public entry points, homepage JSON-LD, release version, and the answer-engine source map.

The important rule is no longer "promote a zh-CN page from fallback." The current rule is "keep every public locale complete." If a source doc is added or removed, update every locale and rerun the generator and audit in the same change.

The parallel homepage rule is similar: do not change public GEO facts in only one place. If the answer-engine framing, provider count, language scope, release version, or canonical source routes change, update the homepage copy, JSON-LD, `llms.txt`, and `audit-build.cjs` together.

## Locale Update Checklist

When adding or changing a docs page:

1. Update the English source under `website/docs/...`.
2. Run or update `website/scripts/generate-localized-docs.cjs` so every supported locale receives the page.
3. Review `zh-CN` first for visible title, heading, and body drift. Product tokens such as `Notemd`, `LLM`, `Provider`, CLI flags, config keys, file extensions, and code identifiers may remain in English when they are runtime contracts.
4. Run the full locale heading/frontmatter/placeholder audit for every public locale, then manually inspect zh-CN plus representative non-Latin and RTL locales (`ar`, `fa`, `he`) for visible stale English headings or broken direction-sensitive layout.
5. Update `website/src/lib/publishedLanguageScopeData.mjs` if the docs route set changed.
6. Update `website/static/llms.txt` if the page changes the public AI retrieval map.
7. Update `website/src/pages/index.js` if the page changes the homepage source map or visible language boundary.
8. Run `npm --prefix website run build && npm --prefix website run audit:build`.
9. After deploy, update `docs/maintainer/github-pages-geo-measurement-log.md` with Search Console and AI visibility observations.

## Why This Shape

The previous partial zh-CN model was safer than letting Docusaurus publish English fallback content under Chinese URLs, but it became the wrong abstraction once the public requirement changed to full multilingual docs. Keeping fallback fencing as the main policy would now hide real localized pages, complicate sitemap truth, and make locale expansion look unfinished even when source files exist.

The stricter full-route model has a maintenance cost: every docs change touches all localized source trees and build proof. The payoff is that sitemap, robots, alternates, UI navigation, and AI retrieval all tell the same truth.

## Current Best Direction

1. Keep English canonical and complete.
2. Keep all public locale docs route sets complete before deploy.
3. Use `generate-localized-docs.cjs` for repeatability, but review visible zh-CN text and representative RTL/non-Latin output because machine-style generic headings are worse than explicit localized headings.
4. Treat Search Console and AI visibility as post-deploy measurement, not local build proof.
5. Avoid new generic wrappers around Docusaurus theme components. Existing theme overrides are acceptable only because they own concrete policy: alternates, locale switching, sidebar filtering, and paginator filtering.
