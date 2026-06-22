# Notemd Documentation

This directory contains the Docusaurus-based documentation site for Notemd.

## Architecture

- **Docusaurus 3.10.1** with GitHub Pages deployment
- **Automatic JSON-LD injection** via swizzled `DocItem/Layout`
- **Published locales**: English (`en`) complete, plus partial Simplified Chinese (`zh-CN`) critical path and FAQ
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

- root and zh-CN root pages exist;
- canonical and JSON-LD URLs match GitHub Pages routes;
- every localized zh-CN doc file is declared in `publishedLanguageScopeData.mjs`;
- published zh-CN docs are indexable and expose correct alternates;
- unpublished zh-CN fallback docs are `noindex,follow`, have no alternates, are excluded from zh-CN sitemap output, and are not linked from published zh-CN docs;
- English docs expose zh-CN alternates only for published translations;
- Provider docs contain setup, endpoint/auth, model discovery, troubleshooting, and use-case sections;
- `llms.txt` states the real language boundary;
- GEO measurement docs mention Search Console, AI visibility, and sitemap evidence.

## Deployment

The site auto-deploys to GitHub Pages on push to `main` via `.github/workflows/deploy-docs.yml`. The deployment workflow runs both `npm run build` and `npm run audit:build` before uploading the Pages artifact.

**Live URL**: https://jacobinwwey.github.io/obsidian-NotEMD/

## GEO Features

### 1. Global JSON-LD Schema

- `docusaurus.config.js`: WebSite + SoftwareApplication schema in `headTags`
- Automatically injected on all pages

### 2. Per-Page TechArticle Schema

- `src/theme/DocItem/Layout/index.js`: swizzled layout component
- Auto-generates TechArticle schema from frontmatter
- Adds `noindex,follow` for unpublished zh-CN fallback docs
- Supports author, keywords, concepts, citations

### 3. Language Signal Ownership

- `website/src/lib/publishedLanguageScopeData.mjs`: published zh-CN doc ids, route paths, source paths, homepage paths, and critical paths
- `website/src/lib/publishedLanguageScope.js`: runtime set helpers derived from the data file
- `website/src/lib/languageRoutePolicy.js`: route policy helpers for doc path extraction, zh-CN fallback decisions, canonical English targets, and zh-CN root fallback

### 4. Docusaurus Theme Policy Overrides

- `src/theme/SiteMetadata/index.js`: filters hreflang and Open Graph locale alternates for unpublished zh-CN fallback docs
- `src/theme/NavbarItem/LocaleDropdownNavbarItem/index.js`: avoids switching users into unpublished zh-CN fallback docs
- `src/theme/DocRoot/Layout/Sidebar/index.js`: filters zh-CN sidebar entries to published zh-CN docs
- `src/theme/DocItem/Paginator/index.js`: filters zh-CN previous/next targets to published zh-CN docs

These overrides are intentionally policy-bearing. Do not replace them with a generic wrapper layer unless the new abstraction owns the same invariant.

### 5. Root Homepage for GitHub Pages

- `src/pages/index.js`: real root route for `/obsidian-NotEMD/` and `/obsidian-NotEMD/zh-CN/`
- Prevents navbar/logo/footer root links from pointing to a missing page
- Routes readers and crawlers to Intro, Quick Start, FAQ, provider docs, and the AI knowledge pillar

### 6. AI Retrieval Entry Point

- `static/llms.txt`: high-signal canonical map for AI crawlers and answer engines
- Lists canonical docs, provider/runtime topics, published zh-CN docs, and the partial-language boundary
- Keeps GEO strategy focused on verified source pages instead of empty locale expansion

### 7. Build Output Language Gate

- `website/scripts/audit-build.cjs`: blocks Pages deployment when build output violates the language/GEO contract
- Checks real generated HTML, sitemaps, `llms.txt`, provider docs, source scope, and measurement evidence

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
2. Run `npm run write-translations -- --locale <locale>`.
3. Translate content in `i18n/<locale>/`.
4. Translate at least the homepage copy, FAQ, intro, installation, quick start, configuration, provider overview, and AI knowledge pillar before publishing the locale.
5. Add published docs to the locale's scope data and extend the build audit if the locale has a different policy.

## Language Publishing Policy

Do not add a locale to `i18n.locales` just because a translation folder exists. Docusaurus publishes fallback English docs under a locale path when docs are untranslated, which creates weak hreflang signals for search and AI crawlers.

Current zh-CN policy: the localized homepage, intro, installation, quick start, configuration, provider overview, AI knowledge pillar, and FAQ are published. Untranslated zh-CN doc fallbacks are excluded from sitemap output, marked `noindex,follow`, excluded from alternates, and hidden from zh-CN sidebar/paginator traversal. A locale should only become fully indexable after the remaining docs are translated and reviewed.

When promoting a zh-CN doc from fallback to published content, update `website/src/lib/publishedLanguageScopeData.mjs` in the same change as the translation and rerun:

```bash
npm run build
npm run audit:build
```

After deployment, record Search Console and AI visibility observations in `docs/maintainer/github-pages-geo-measurement-log.md`.

## License

MIT - Same as Notemd plugin
