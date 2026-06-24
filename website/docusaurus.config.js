// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';
import {publishedZhCnDocPaths} from './src/lib/publishedLanguageScope.js';

const siteUrl = 'https://jacobinwwey.github.io';
const baseUrl = '/obsidian-NotEMD/';
const siteBaseUrl = `${siteUrl}${baseUrl}`;
const currentSoftwareVersion = '1.9.3';
const personId = `${siteBaseUrl}#person-jacobinwwey`;
const logoUrl = `${siteBaseUrl}img/logo.svg`;
const publishedZhCnDocUrls = new Set(
  Array.from(publishedZhCnDocPaths, (docPath) => `${siteBaseUrl}zh-CN${docPath}`),
);

function sitemapItemMatchesPublishedLanguageScope(item) {
  const itemUrl = item.url.replace(/\/$/, '');
  const zhCnDocsPrefix = `${siteBaseUrl}zh-CN/docs/`;
  return !itemUrl.startsWith(zhCnDocsPrefix) || publishedZhCnDocUrls.has(itemUrl);
}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Notemd',
  tagline: 'AI-Powered Knowledge Base Builder for Obsidian',
  favicon: 'img/favicon.svg',

  // Set the production url of your site here
  url: siteUrl,
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl,

  // GitHub pages deployment config.
  organizationName: 'Jacobinwwey',
  projectName: 'obsidian-NotEMD',
  customFields: {
    canonicalBasePath: baseUrl,
    softwareVersion: currentSoftwareVersion,
  },

  onBrokenLinks: 'warn',
  // Global JSON-LD Schema for entire site
  headTags: [
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "name": "Notemd Documentation",
            "url": siteBaseUrl,
            "description": "AI-powered Obsidian plugin documentation - wiki-links, concept notes, research, translation, and diagrams",
            "publisher": {
              "@type": "Organization",
              "name": "Notemd",
              "logo": {
                "@type": "ImageObject",
                "url": logoUrl
              },
              "sameAs": [
                "https://github.com/Jacobinwwey/obsidian-NotEMD",
                "https://discord.gg/qnGgsQ9W"
              ]
            }
          },
          {
            "@id": personId,
            "@type": "Person",
            "name": "Jacobinwwey",
            "url": "https://github.com/Jacobinwwey",
            "knowsAbout": ["Obsidian", "LLM Integration", "Knowledge Management", "TypeScript", "Markdown"],
            "sameAs": ["https://github.com/Jacobinwwey"]
          }
        ]
      }),
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Notemd",
        "alternateName": ["NotEMD", "obsidian-NotEMD"],
        "applicationCategory": "Productivity",
        "operatingSystem": ["Windows", "macOS", "Linux", "iOS", "Android"],
        "description": "AI-powered Obsidian plugin that enhances notes with wiki-links, concept notes, web research, translation, and diagram generation. Supports 30+ LLM providers.",
        "softwareVersion": currentSoftwareVersion,
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "author": {
          "@type": "Person",
          "name": "Jacobinwwey",
          "url": "https://github.com/Jacobinwwey"
        },
        "url": "https://github.com/Jacobinwwey/obsidian-NotEMD",
        "downloadUrl": "https://github.com/Jacobinwwey/obsidian-NotEMD/releases/latest",
        "installUrl": "obsidian://show-plugin?id=notemd",
        "programmingLanguage": "TypeScript",
        "license": "https://opensource.org/licenses/MIT",
        "codeRepository": "https://github.com/Jacobinwwey/obsidian-NotEMD"
      }),
    },
  ],

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-CN'],
    localeConfigs: {
      en: { label: 'English', direction: 'ltr', htmlLang: 'en-US' },
      'zh-CN': { label: '简体中文', direction: 'ltr', htmlLang: 'zh-CN' },
    },
  },

  themes: ['@docusaurus/theme-mermaid'],

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/Jacobinwwey/obsidian-NotEMD/tree/main/website/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
          createSitemapItems: async (params) => {
            const {defaultCreateSitemapItems, ...rest} = params;
            const items = await defaultCreateSitemapItems(rest);
            return items.filter(sitemapItemMatchesPublishedLanguageScope);
          },
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/notemd-social-card.jpg',
      navbar: {
        title: 'Notemd',
        logo: {
          alt: 'Notemd Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            to: '/docs/intro',
            position: 'left',
            label: 'Docs',
          },
          {
            to: '/docs/faq',
            label: 'FAQ',
            position: 'left',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/Jacobinwwey/obsidian-NotEMD',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/intro',
              },
              {
                label: 'FAQ',
                to: '/docs/faq',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.gg/qnGgsQ9W',
              },
              {
                label: 'GitHub Discussions',
                href: 'https://github.com/Jacobinwwey/obsidian-NotEMD/discussions',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/Jacobinwwey/obsidian-NotEMD',
              },
              {
                label: 'Sponsor',
                href: 'https://github.com/sponsors/Jacobinwwey',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Notemd. Built with Docusaurus. | <a href="https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/LICENSE">MIT License</a>`,
      },
      mermaid: {
        theme: { light: 'default', dark: 'dark' },
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
      /* algolia: configure when DocSearch approved (https://docusaurus.io/docs/search#using-algolia-docsearch)
      algolia: {
        appId: 'YOUR_APP_ID',
        apiKey: 'YOUR_SEARCH_API_KEY',
        indexName: 'notemd',
        contextualSearch: true,
      },
      */
    }),
};

export default config;
