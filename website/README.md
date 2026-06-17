# Notemd Documentation

This directory contains the Docusaurus-based documentation site for Notemd.

## Architecture

- **Docusaurus 3.10.1** with GitHub Pages deployment
- **Automatic JSON-LD injection** via Swizzle (DocItem Layout)
- **Published locales**: English (`en`) plus a partial Simplified Chinese (`zh-CN`) FAQ/homepage surface
- **AI-readable structure**: TLDR components, FAQPage Schema, TechArticle Schema, citations, and concept metadata

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
```

Generates static content into the `build` directory.

## Deployment

The site auto-deploys to GitHub Pages on push to `main` branch (via `.github/workflows/deploy-docs.yml`).

**Live URL**: https://jacobinwwey.github.io/obsidian-NotEMD/

## GEO Features

### 1. Global JSON-LD Schema
- `docusaurus.config.js`: WebSite + SoftwareApplication Schema in headTags
- Automatically injected on all pages

### 2. Per-Page TechArticle Schema
- `src/theme/DocItem/Layout/index.js`: Swizzled layout component
- Auto-generates TechArticle Schema from frontmatter
- Supports author, keywords, concepts, citations

### 3. TLDR Component
- `src/components/TLDR/`: High-density summary component
- AI crawler optimization: first 200 characters prioritized
- Schema.org microdata for semantic extraction

### 4. Root Homepage for GitHub Pages
- `src/pages/index.js`: real root route for `/obsidian-NotEMD/` and `/obsidian-NotEMD/zh-CN/`
- Prevents navbar/logo/footer root links from pointing to a missing page
- Routes readers and crawlers to Intro, Quick Start, FAQ, provider docs, and the AI knowledge pillar

### 5. AI Retrieval Entry Point
- `static/llms.txt`: high-signal canonical map for AI crawlers and answer engines
- Lists canonical docs, provider/runtime topics, and the current language coverage boundary
- Keeps GEO strategy focused on verified source pages instead of empty locale expansion

### 6. FAQ with FAQPage Schema
- `docs/faq.mdx`: 12 Q&A pairs
- Simplified Chinese translation: `i18n/zh-CN/docusaurus-plugin-content-docs/current/faq.mdx`
- 43% of AI citations come from FAQ content (BrightEdge data)

## File Structure

```
website/
├── docusaurus.config.js       # Global config + Schema
├── sidebars.js                 # Sidebar navigation
├── static/
│   ├── llms.txt                # AI crawler / answer-engine entry point
│   └── img/
├── docs/                       # English docs
│   ├── intro.mdx
│   ├── faq.mdx
│   └── ...
├── i18n/                       # Translations
│   ├── zh-CN/
│   │   └── docusaurus-plugin-content-docs/
│   │       └── current/
│   │           └── faq.mdx
├── src/
│   ├── pages/
│   │   └── index.js           # Locale-aware root homepage
│   ├── components/
│   │   └── TLDR/              # TLDR component
│   ├── theme/
│   │   └── DocItem/Layout/    # Swizzled layout (auto JSON-LD)
│   └── css/
│       └── custom.css         # GEO-optimized styles
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
concepts: [concept1, concept2]   # Adds Schema.org "about"
citations:                       # Adds Schema.org "citation"
  - title: Reference Title
    url: https://example.com
---
```

## Adding New Languages

1. Add locale to `docusaurus.config.js` → `i18n.locales`
2. Run: `npm run write-translations -- --locale <locale>`
3. Translate content in `i18n/<locale>/`
4. Translate at least the homepage copy, FAQ, Intro, Installation, Quick Start, Configuration, and provider overview before publishing the locale
5. Create FAQ: `i18n/<locale>/docusaurus-plugin-content-docs/current/faq.mdx`

## Language Publishing Policy

Do not add a locale to `i18n.locales` just because a translation folder exists. Docusaurus publishes fallback English docs under a locale path when docs are untranslated, which creates weak hreflang signals for search and AI crawlers.

Current zh-CN policy: the localized homepage and FAQ are published, while untranslated zh-CN doc fallbacks are excluded from sitemap output and marked `noindex,follow` by the swizzled doc layout. A locale should only become fully indexable after the critical path pages are translated and reviewed.

## License

MIT - Same as Notemd plugin
