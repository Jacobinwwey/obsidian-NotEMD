import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import Head from '@docusaurus/Head';
import {useDoc} from '@docusaurus/plugin-content-docs/client';

/**
 * Swizzled DocItem Layout component
 * Automatically injects JSON-LD TechArticle Schema for every documentation page
 * Reads frontmatter (author, keywords, concepts, citations) for rich Schema.
 */
export default function LayoutWrapper(props) {
  const {frontMatter, metadata} = useDoc();

  const siteUrl = 'https://jacobinwwey.github.io';
  const currentUrl = typeof window !== 'undefined'
    ? window.location.href
    : `${siteUrl}${metadata.permalink}`;

  const author = frontMatter.author || {'@type': 'Organization', name: 'Notemd Team'};

  const aboutEntries = (frontMatter.concepts || []).map((c) => ({
    '@type': 'Thing',
    name: c,
  }));

  const citationEntries = (frontMatter.citations || []).map((c) => ({
    '@type': 'CreativeWork',
    name: c.title || c,
    ...(c.url ? {url: c.url} : {}),
  }));

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: metadata.title,
    description: metadata.description,
    url: currentUrl,
    author,
    datePublished: metadata.date,
    dateModified: metadata.lastUpdatedAt || metadata.date,
    publisher: {
      '@type': 'Organization',
      name: 'Notemd',
      logo: {
        '@type': 'ImageObject',
        url: 'https://jacobinwwey.github.io/obsidian-NotEMD/img/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': currentUrl,
    },
    ...(aboutEntries.length > 0 ? {about: aboutEntries} : {}),
    ...(citationEntries.length > 0 ? {citation: citationEntries} : {}),
    ...(frontMatter.keywords ? {keywords: frontMatter.keywords} : {}),
  };

  return (
    <>
      <Head>
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Head>
      <Layout {...props} />
    </>
  );
}
