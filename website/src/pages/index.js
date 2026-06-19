import React from 'react';
import Link from '@docusaurus/Link';
import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {isPublishedZhCnDocPath} from '../lib/publishedLanguageScope';
import styles from './index.module.css';

const copyByLocale = {
  en: {
    title: 'Notemd Documentation',
    description: 'AI-powered knowledge workflows for Obsidian notes.',
    eyebrow: 'Obsidian plugin documentation',
    heading: 'Notemd',
    lead: 'Build persistent knowledge from notes with wiki-links, concept notes, research summaries, translation, diagrams, and reusable one-click workflows.',
    primary: 'Read the docs',
    secondary: 'Quick start',
    faq: 'FAQ',
    sections: [
      {
        title: 'Start safely',
        body: 'Install the plugin, configure a local or cloud LLM provider, and run your first note-processing workflow.',
        href: '/docs/getting-started/quick-start',
      },
      {
        title: 'Choose providers',
        body: 'Compare OpenAI-compatible, Anthropic, Google, China-focused, gateway, and local model options.',
        href: '/docs/providers/overview',
      },
      {
        title: 'Build a knowledge base',
        body: 'Use structured wiki-linking, concept notes, research, translation, and diagram generation as a repeatable system.',
        href: '/docs/pillar-ai-knowledge',
      },
    ],
  },
  'zh-CN': {
    title: 'Notemd 文档',
    description: '面向 Obsidian 笔记的 AI 知识工作流。',
    eyebrow: 'Obsidian 插件文档',
    heading: 'Notemd',
    lead: '把笔记处理成可积累的知识资产：wiki 链接、概念笔记、研究总结、翻译、图表，以及可复用的一键工作流。',
    primary: '阅读英文文档',
    secondary: '英文快速开始',
    faq: '常见问题',
    sections: [
      {
        title: '先跑通基础配置',
        body: '安装插件，配置本地或云端 LLM 提供商，然后运行第一个笔记处理工作流。',
        href: '/docs/getting-started/quick-start',
      },
      {
        title: '选择模型提供商',
        body: '对比 OpenAI 兼容、Anthropic、Google、中国模型、网关和本地模型配置。',
        href: '/docs/providers/overview',
      },
      {
        title: '构建知识库',
        body: '把 wiki 链接、概念笔记、研究、翻译和图表生成组织成稳定的知识工作流。',
        href: '/docs/pillar-ai-knowledge',
      },
    ],
  },
};

export default function Home() {
  const {siteConfig, i18n} = useDocusaurusContext();
  const logoSrc = useBaseUrl('img/logo.svg');
  const copy = copyByLocale[i18n.currentLocale] || copyByLocale.en;
  const pageUrl = new URL(siteConfig.baseUrl, siteConfig.url).toString();
  const canonicalBasePath = siteConfig.customFields?.canonicalBasePath || siteConfig.baseUrl;
  const englishDocHref = (docPath) => `${canonicalBasePath}${docPath.replace(/^\//, '')}`;
  const docLinkProps = (docPath) => {
    if (i18n.currentLocale === 'zh-CN' && !isPublishedZhCnDocPath(docPath)) {
      return {
        href: englishDocHref(docPath),
        autoAddBaseUrl: false,
        'data-noBrokenLinkCheck': true,
      };
    }

    return {to: docPath};
  };

  return (
    <Layout title={copy.title} description={copy.description}>
      <Head>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: copy.title,
            description: copy.description,
            url: pageUrl,
            inLanguage: i18n.currentLocale,
          })}
        </script>
      </Head>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h1>{copy.heading}</h1>
            <p className={styles.lead}>{copy.lead}</p>
            <div className={styles.actions}>
              <Link className="button button--primary button--lg" {...docLinkProps('/docs/intro')}>
                {copy.primary}
              </Link>
              <Link
                className="button button--secondary button--lg"
                {...docLinkProps('/docs/getting-started/quick-start')}
              >
                {copy.secondary}
              </Link>
              <Link className="button button--outline button--lg" {...docLinkProps('/docs/faq')}>
                {copy.faq}
              </Link>
            </div>
          </div>
          <img className={styles.logo} src={logoSrc} alt="" />
        </section>
        <section className={styles.sectionGrid} aria-label={copy.primary}>
          {copy.sections.map((section) => (
            <Link className={styles.sectionCard} key={section.href} {...docLinkProps(section.href)}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </Link>
          ))}
        </section>
      </main>
    </Layout>
  );
}
