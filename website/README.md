# Notemd Documentation

This directory contains the Docusaurus-based documentation site for Notemd.

## Architecture

- **Docusaurus 3.10.1** with GitHub Pages deployment
- **Automatic JSON-LD injection** via swizzled `DocItem/Layout`
- **Published locales**: English (`en`) plus full docs routes for Simplified Chinese (`zh-CN`), Traditional Chinese (`zh-Hant`), Japanese (`ja`), French (`fr`), German (`de`), Spanish (`es`), and Korean (`ko`)
- **AI-readable structure**: TLDR components, FAQPage Schema, TechArticle Schema, citations, concept metadata, and `llms.txt`

## Local Development

```bash
cd website
npm install
npm start
```

This starts a local development server at `http://localhost:3000`.

## Build

```bash
npm run build
npm run audit:build
```

The build generates static content into `build`. The audit checks the public contract that source review cannot prove by itself:

- root and localized root pages exist;
- canonical and JSON-LD URLs match GitHub Pages routes;
- homepage GEO text, `llms.txt` link, release version, and multilingual route boundary are present on localized homepages;
- every localized zh-CN doc file is declared in `publishedLanguageScopeData.mjs`;
- published localized docs are indexable and expose correct alternates;
- the old unpublished zh-CN fallback path is retired because the docs route set is now localized end-to-end;
- English docs expose locale alternates for the full published docs route set;
- Provider docs contain setup, endpoint/auth, model discovery, troubleshooting, and use-case sections;
- `llms.txt` states the real multilingual route boundary;
- GEO measurement docs mention Search Console, AI visibility, and sitemap evidence.

## Deployment

The site auto-deploys to GitHub Pages on push to `main` via `.github/workflows/deploy-docs.yml`. The deployment workflow runs both `npm run build` and `npm run audit:build` before uploading the Pages artifact.

**Live URL**: https://jacobinwwey.github.io/obsidian-NotEMD/

### 2026-07-02 Pages CI Triage

The historical remote failure investigated on 2026-07-02 was not a Docusaurus source failure. Run `27451762938` failed during `actions/deploy-pages@v4` with `HttpError: Not Found` and GitHub's instruction to enable Pages. Later `main` Pages deploys succeeded, so the active repository gate remains the build plus audit pair in this workflow.

When `website/**` or `.github/workflows/deploy-docs.yml` changes, treat the next Pages run as the source of truth and verify both jobs:

```bash
npm run build
npm run audit:build
```

## GEO Features

### 1. Global JSON-LD Schema

- `docusaurus.config.js`: WebSite + SoftwareApplication schema in `headTags`
- Automatically injected on all pages

### 2. Per-Page TechArticle Schema

- `src/theme/DocItem/Layout/index.js`: swizzled layout component
- Auto-generates TechArticle schema from frontmatter
- Keeps TechArticle metadata aligned across localized docs
- Supports author, keywords, concepts, citations

### 3. Language Signal Ownership

- `website/src/lib/publishedLanguageScopeData.mjs`: published zh-CN doc ids, route paths, source paths, homepage paths, and critical paths
- `website/src/lib/publishedLanguageScope.js`: runtime set helpers derived from the data file
- `website/src/lib/languageRoutePolicy.js`: route policy helpers for doc path extraction, locale-prefix stripping, canonical English targets, and zh-CN compatibility helpers

### 4. Docusaurus Theme Policy Overrides

- `src/theme/SiteMetadata/index.js`: owns hreflang and Open Graph locale alternate emission
- `src/theme/NavbarItem/LocaleDropdownNavbarItem/index.js`: keeps locale switching on same-domain routes
- `src/theme/DocRoot/Layout/Sidebar/index.js`: preserves the historical zh-CN published-doc filter, which is now full-route because every docs page is published
- `src/theme/DocItem/Paginator/index.js`: preserves the historical zh-CN previous/next filter, which is now full-route because every docs page is published

These overrides are intentionally policy-bearing. Do not replace them with a generic wrapper layer unless the new abstraction owns the same invariant.

### 5. Root Homepage for GitHub Pages

- `src/pages/index.js`: real root route for `/obsidian-NotEMD/` and `/obsidian-NotEMD/zh-CN/`
- Prevents navbar/logo/footer root links from pointing to a missing page
- Routes readers and crawlers to Intro, Quick Start, FAQ, provider docs, and the AI knowledge pillar
- Owns visible GEO facts that answer engines and humans should see first: write-first workflow model, provider surface, local-vault boundary, current release, answer-engine source map, and multilingual docs route boundary

### 6. AI Retrieval Entry Point

- `static/llms.txt`: high-signal canonical map for AI crawlers and answer engines
- Lists canonical docs, provider/runtime topics, localized docs entrypoints, and the multilingual route boundary
- Keeps GEO strategy focused on verified source pages while exposing localized docs routes for supported languages

### 7. Build Output Language Gate

- `website/scripts/audit-build.cjs`: blocks Pages deployment when build output violates the language/GEO contract
- Checks real generated HTML, homepage GEO copy, current release version, sitemaps, `llms.txt`, provider docs, source scope, and measurement evidence

### 8. FAQ with FAQPage Schema

- `docs/faq.mdx`: English FAQ
- `i18n/zh-CN/docusaurus-plugin-content-docs/current/faq.mdx`: Simplified Chinese FAQ
- The swizzled doc layout emits FAQPage schema for FAQ docs

## File Structure

```text
website/
├── docusaurus.config.js       # Global config, schema, sitemap filtering
├── sidebars.js                # Sidebar navigation
├── static/
│   ├── llms.txt               # AI crawler / answer-engine entry point
│   └── img/
├── scripts/
│   └── audit-build.cjs        # Built-output Pages language/GEO gate
├── docs/                      # English docs
│   ├── intro.mdx
│   ├── faq.mdx
│   └── providers/
├── i18n/
│   └── zh-CN/
│       └── docusaurus-plugin-content-docs/
│           └── current/       # Published zh-CN critical path plus FAQ
├── src/
│   ├── pages/
│   │   └── index.js           # Locale-aware root homepage
│   ├── lib/
│   │   ├── languageRoutePolicy.js
│   │   ├── publishedLanguageScope.js
│   │   └── publishedLanguageScopeData.mjs
│   ├── components/
│   │   └── TLDR/
│   ├── theme/
│   │   ├── DocItem/Layout/    # JSON-LD + fallback noindex
│   │   ├── DocItem/Paginator/ # zh-CN published-scope paginator
│   │   ├── DocRoot/Layout/Sidebar/
│   │   ├── NavbarItem/LocaleDropdownNavbarItem/
│   │   └── SiteMetadata/      # hreflang/Open Graph locale policy
│   └── css/
│       └── custom.css
└── package.json
```

## Frontmatter Options

```yaml
---
id: my-doc
title: Page Title
description: SEO description
keywords: [keyword1, keyword2]
author:
  '@type': Person
  name: Author Name
concepts: [concept1, concept2]
citations:
  - title: Reference Title
    url: https://example.com
---
```

## Adding New Languages

1. Add locale to `docusaurus.config.js` -> `i18n.locales`.
2. Run or update `node scripts/generate-localized-docs.cjs`.
3. Translate content in `i18n/<locale>/docusaurus-plugin-content-docs/current/`.
4. Translate navbar, footer, and docs sidebar messages under `i18n/<locale>/`.
5. Build and audit the site before publishing the locale.

## Language Publishing Policy

Do not add a locale to `i18n.locales` just because a translation folder exists. The supported policy is now full docs-route publication: every source page under `website/docs/` must have a localized counterpart before the locale appears in the public language dropdown.

Current policy: English remains the canonical source surface, and Simplified Chinese, Traditional Chinese, Japanese, French, German, Spanish, and Korean expose the complete docs route set. Provider names, CLI commands, configuration keys, file extensions, and package names intentionally remain stable across languages so users can match documentation to the plugin UI, CLI output, and logs.

`website/src/lib/publishedLanguageScopeData.mjs` still exists because older GEO gates and zh-CN theme overrides consume it, but it now declares the full docs route set rather than a partial-publishing allowlist. When adding or removing docs pages, update that data file and rerun:

```bash
npm run build
npm run audit:build
```

After deployment, record Search Console and AI visibility observations in `docs/maintainer/github-pages-geo-measurement-log.md`.

## Homepage GEO Sync Constraint

Public GEO or product-positioning changes are not complete unless they are visible on the project website. In the same change, update:

1. `website/src/pages/index.js` for visible homepage facts, source-map links, and language-boundary wording.
2. `website/docusaurus.config.js` for global JSON-LD and current release metadata.
3. `website/static/llms.txt` for answer-engine route mapping and the same language boundary.
4. `website/scripts/audit-build.cjs` so future builds fail when those surfaces drift.
5. `GEO_ROADMAP.md` and `docs/maintainer/github-pages-geo-measurement-log*.md` for dated source-side evidence and post-deploy measurement scope.

Do not ship a GEO update that only changes maintainer documentation. The homepage, `llms.txt`, sitemap/hreflang behavior, and JSON-LD must describe the same product and language truth before Pages deployment.

## License

MIT - Same as Notemd plugin
