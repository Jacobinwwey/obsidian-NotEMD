import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import Head from '@docusaurus/Head';
import {useDoc} from '@docusaurus/theme-common/internal';

/**
 * Swizzled DocItem Layout component
 * Automatically injects JSON-LD TechArticle Schema for every documentation page
 * based on frontmatter metadata
 */
export default function LayoutWrapper(props) {
  const {metadata, frontMatter} = useDoc();

  // Extract metadata
  const {
    title,
    description,
    permalink,
    editUrl,
    lastUpdatedAt,
    lastUpdatedBy,
  } = metadata;

  // Build author from frontmatter or default
  const author = frontMatter.author || {
    '@type': 'Organization',
    name: 'Notemd Team',
    url: 'https://github.com/Jacobinwwey',
  };

  // Build TechArticle Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description: description || title,
    url: `https://jacobinwwey.github.io/obsidian-NotEMD${permalink}`,
    datePublished: frontMatter.date || '2024-01-01',
    dateModified: lastUpdatedAt
      ? new Date(lastUpdatedAt * 1000).toISOString()
      : new Date().toISOString(),
    author: typeof author === 'string' ? {
      '@type': 'Person',
      name: author,
    } : author,
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
      '@id': `https://jacobinwwey.github.io/obsidian-NotEMD${permalink}`,
    },
  };

  // Add keywords if available
  if (frontMatter.keywords) {
    articleSchema.keywords = Array.isArray(frontMatter.keywords)
      ? frontMatter.keywords.join(', ')
      : frontMatter.keywords;
  }

  // Add about/mentions for key concepts
  if (frontMatter.concepts) {
    articleSchema.about = frontMatter.concepts.map(concept => ({
      '@type': 'Thing',
      name: concept,
    }));
  }

  // Add citation if references exist
  if (frontMatter.citations) {
    articleSchema.citation = frontMatter.citations.map(cite => ({
      '@type': 'CreativeWork',
      name: cite.title,
      url: cite.url,
    }));
  }

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
