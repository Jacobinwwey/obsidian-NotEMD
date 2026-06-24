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
    factHeading: 'Source-backed product facts',
    facts: [
      {label: 'Workflow model', value: 'Write-first Obsidian automation, not a chat transcript'},
      {label: 'Provider surface', value: '36 cloud, gateway, China, and local LLM providers'},
      {label: 'Vault boundary', value: 'Outputs are written back into local Markdown files'},
      {label: 'Current release', value: 'Version 1.9.3 public docs and release assets'},
    ],
    retrievalHeading: 'Answer-engine source map',
    retrievalLead:
      'The public site now exposes the same canonical routes that llms.txt, sitemap, hreflang metadata, and JSON-LD describe. Use these pages as the source of truth for AI search and citation workflows.',
    languageBoundary: 'Language boundary: English is complete; Simplified Chinese is partial and scoped to reviewed critical paths.',
    retrievalLinks: [
      {
        title: 'llms.txt retrieval map',
        body: 'Compact route map for answer engines, canonical docs, provider topics, and the current language boundary.',
        href: '/llms.txt',
        kind: 'static',
      },
      {
        title: 'Provider configuration',
        body: 'Operational setup, endpoint/auth behavior, model discovery, troubleshooting, and use-case boundaries.',
        href: '/docs/providers/overview',
      },
      {
        title: 'AI knowledge workflow',
        body: 'The canonical pillar page for wiki-links, concept notes, research, translation, diagrams, and workflows.',
        href: '/docs/pillar-ai-knowledge',
      },
    ],
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
    primary: '阅读文档',
    secondary: '快速开始',
    faq: '常见问题',
    factHeading: '可索引的产品事实',
    facts: [
      {label: '工作流模型', value: '写入优先的 Obsidian 自动化，不是聊天记录'},
      {label: '模型提供商', value: '36 个云端、网关、中国与本地 LLM 提供商'},
      {label: 'Vault 边界', value: '结果写回本地 Markdown 文件'},
      {label: '当前版本', value: '1.9.3 公开文档与 release assets'},
    ],
    retrievalHeading: 'Answer engine 来源地图',
    retrievalLead:
      '项目网页现在公开展示与 llms.txt、sitemap、hreflang metadata 和 JSON-LD 一致的 canonical routes。AI search 与引用场景应以这些页面为真值来源。',
    languageBoundary: '语言边界：英文文档完整；简体中文是 partial，只覆盖已 review 的 critical path。',
    retrievalLinks: [
      {
        title: 'llms.txt 检索地图',
        body: '面向 answer engine 的紧凑 route map，包含 canonical docs、provider topics 与当前语言边界。',
        href: '/llms.txt',
        kind: 'static',
      },
      {
        title: 'Provider 配置',
        body: '覆盖 setup、endpoint/auth、model discovery、troubleshooting 与 use-case boundaries。',
        href: '/docs/providers/overview',
      },
      {
        title: 'AI 知识工作流',
        body: 'wiki 链接、概念笔记、研究、翻译、图表与 workflow 的 canonical pillar page。',
        href: '/docs/pillar-ai-knowledge',
      },
    ],
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
  const llmsHref = `${canonicalBasePath}llms.txt`;
  const softwareVersion = siteConfig.customFields?.softwareVersion || '1.9.3';
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
  const sourceLinkProps = (source) => {
    if (source.kind === 'static') {
      return {
        href: llmsHref,
        autoAddBaseUrl: false,
        'data-noBrokenLinkCheck': true,
      };
    }

    return docLinkProps(source.href);
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
            isPartOf: {
              '@type': 'WebSite',
              name: 'Notemd Documentation',
              url: pageUrl,
            },
            about: [
              'Obsidian AI plugin',
              'persistent knowledge workflows',
              'wiki-links',
              'concept notes',
              'LLM provider configuration',
              'local Markdown vault output',
            ],
            mainEntity: {
              '@type': 'SoftwareApplication',
              name: 'Notemd',
              softwareVersion,
              applicationCategory: 'ProductivityApplication',
              operatingSystem: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'],
            },
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
        <section className={styles.factBand} aria-labelledby="notemd-facts-heading">
          <div className={styles.factBandInner}>
            <h2 id="notemd-facts-heading">{copy.factHeading}</h2>
            <dl className={styles.factGrid}>
              {copy.facts.map((fact) => (
                <div className={styles.factItem} key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <section className={styles.sectionGrid} aria-label={copy.primary}>
          {copy.sections.map((section) => (
            <Link className={styles.sectionCard} key={section.href} {...docLinkProps(section.href)}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </Link>
          ))}
        </section>
        <section className={styles.retrievalSection} aria-labelledby="answer-engine-source-map-heading">
          <div className={styles.retrievalCopy}>
            <h2 id="answer-engine-source-map-heading">{copy.retrievalHeading}</h2>
            <p>{copy.retrievalLead}</p>
            <p className={styles.languageBoundary}>{copy.languageBoundary}</p>
          </div>
          <div className={styles.retrievalLinks}>
            {copy.retrievalLinks.map((source) => (
              <Link className={styles.retrievalLink} key={source.href} {...sourceLinkProps(source)}>
                <span>{source.title}</span>
                <small>{source.body}</small>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
