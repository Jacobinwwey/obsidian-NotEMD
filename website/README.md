# Notemd Documentation

This directory contains the Docusaurus-based documentation site for Notemd.

## Architecture

- **Docusaurus 3.6.3** with GEO optimization
- **Automatic JSON-LD injection** via Swizzle (DocItem Layout)
- **Multilingual support**: 10 languages (en, zh-CN, ja, ko, es, fr, de, ru, ar, pt)
- **AI-optimized structure**: TLDR components, FAQ Schema, TechArticle Schema

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

### 4. FAQ with FAQPage Schema
- `docs/faq.mdx`: 12 Q&A pairs
- Multilingual: `i18n/{locale}/docusaurus-plugin-content-docs/current/faq.mdx`
- 43% of AI citations come from FAQ content (BrightEdge data)

## File Structure

```
website/
├── docusaurus.config.js       # Global config + Schema
├── sidebars.js                 # Sidebar navigation
├── docs/                       # English docs
│   ├── intro.mdx
│   ├── faq.mdx
│   └── ...
├── i18n/                       # Translations
│   ├── zh-CN/
│   │   └── docusaurus-plugin-content-docs/
│   │       └── current/
│   │           └── faq.mdx
│   └── ...
├── src/
│   ├── components/
│   │   └── TLDR/              # TLDR component
│   ├── theme/
│   │   └── DocItem/Layout/    # Swizzled layout (auto JSON-LD)
│   └── css/
│       └── custom.css         # GEO-optimized styles
└── static/
    └── img/
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
4. Create FAQ: `i18n/<locale>/docusaurus-plugin-content-docs/current/faq.mdx`

## License

MIT - Same as Notemd plugin
