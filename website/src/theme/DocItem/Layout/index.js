import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import Head from '@docusaurus/Head';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function LayoutWrapper(props) {
  const {frontMatter, metadata} = useDoc();
  const {siteConfig, i18n} = useDocusaurusContext();

  const siteBaseUrl = new URL(siteConfig.baseUrl, siteConfig.url).toString();
  const currentUrl = new URL(metadata.permalink, siteConfig.url).toString();
  const personId = new URL('#person-jacobinwwey', siteBaseUrl).toString();
  const conceptSetId = new URL('#concepts', siteBaseUrl).toString();
  const logoUrl = new URL('img/logo.svg', siteBaseUrl).toString();

  const author = frontMatter.author || {'@id': personId};

  const aboutEntries = (frontMatter.concepts || []).map((c) => ({
    '@type': 'DefinedTerm',
    name: c,
    inDefinedTermSet: conceptSetId,
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
  const untranslatedZhCnFallbackDoc = i18n.currentLocale === 'zh-CN' && metadata.id !== 'faq';

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
        url: logoUrl,
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
      <Head>
        {untranslatedZhCnFallbackDoc ? (
          <meta name="robots" content="noindex,follow" />
        ) : null}
        {schemas}
      </Head>
      <Layout {...props} />
    </>
  );
}
