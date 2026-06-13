import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import Head from '@docusaurus/Head';

/**
 * Swizzled DocItem Layout component
 * Automatically injects JSON-LD TechArticle Schema for every documentation page
 *
 * Note: In Docusaurus 3.x, we use a simpler approach by reading from window.location
 * and relying on frontmatter in the MDX files themselves.
 */
export default function LayoutWrapper(props) {
  // Simple schema that works for all doc pages
  const currentUrl = typeof window !== 'undefined'
    ? window.location.href
    : 'https://jacobinwwey.github.io/obsidian-NotEMD/';

  // Basic TechArticle Schema (page-specific details come from frontmatter in MDX)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    url: currentUrl,
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
