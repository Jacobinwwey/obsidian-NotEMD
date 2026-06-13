import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import Head from '@docusaurus/Head';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function LayoutWrapper(props) {
  const {frontMatter, metadata} = useDoc();
  const {siteConfig} = useDocusaurusContext();

  const currentUrl = `${siteConfig.url}${metadata.permalink}`;

  const author = frontMatter.author || {'@id': 'https://jacobinwwey.github.io/obsidian-NotEMD/#person-jacobinwwey'};

  const aboutEntries = (frontMatter.concepts || []).map((c) => ({
    '@type': 'DefinedTerm',
    name: c,
    inDefinedTermSet: 'https://jacobinwwey.github.io/obsidian-NotEMD/#concepts',
  }));

  const citationEntries = (frontMatter.citations || []).map((c) => ({
    '@type': 'CreativeWork',
    name: c.title || c,
    ...(c.url ? {url: c.url} : {}),
  }));

  const dateModified = metadata.lastUpdatedAt
    ? new Date(metadata.lastUpdatedAt).toISOString()
    : undefined;

  const datePublished = frontMatter.datePublished || dateModified;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: metadata.title,
    description: metadata.description,
    url: currentUrl,
    author,
    ...(datePublished ? {datePublished} : {}),
    ...(dateModified ? {dateModified} : {}),
    publisher: {
      '@type': 'Organization',
      name: 'Notemd',
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/obsidian-NotEMD/img/logo.svg`,
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

  const schemas = [<script key="techArticle" type="application/ld+json">{JSON.stringify(articleSchema)}</script>];

  if (metadata.id === 'faq' && frontMatter.faqItems) {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: frontMatter.faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
    schemas.push(<script key="faqPage" type="application/ld+json">{JSON.stringify(faqSchema)}</script>);
  }

  return (
    <>
      <Head>{schemas}</Head>
      <Layout {...props} />
    </>
  );
}
