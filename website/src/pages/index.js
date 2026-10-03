import React from 'react';
import Link from '@docusaurus/Link';
import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {homeCopyOverrides} from '../lib/homeCopyCatalog.mjs';
import {selectHomepageCopy} from '../lib/homepageCopy.cjs';
import releaseFacts from '../lib/releaseFacts.cjs';
import styles from './index.module.css';

const copyByLocale = {
  en: {
    title: 'Notemd Documentation',
    description: 'Link, research and organize Obsidian notes with the model you choose.',
    eyebrow: 'Knowledge workflows for Obsidian',
    heading: 'Notemd',
    lead: 'Turn source notes into linked Markdown, concept notes, research summaries, translations and diagrams. Choose your model, inspect the output, and keep what you learn in your Vault.',
    primary: 'Start with one note',
    secondary: 'Release guide',
    faq: 'FAQ',
    audienceHeading: 'Choose your path',
    sections: [
      {title: 'Newcomers', body: 'Install Notemd, configure a provider and inspect your first output.', href: '/docs/getting-started/quick-start'},
      {title: 'User workflows', body: 'Choose note and folder tasks, output paths and recovery steps.', href: '/docs/features/workflows'},
      {title: 'Developers', body: 'Build, test and extend the existing provider and operation contracts.', href: '/docs/developers/overview'},
      {title: 'Agents', body: 'Discover supported commands, exported schemas and host requirements.', href: '/docs/agents/overview'},
    ],
    exampleHeading: 'A file you can inspect',
    sourceLabel: 'Source note',
    outputLabel: 'Example processed note',
    exampleSource: 'Machine learning uses neural networks to learn patterns.',
    exampleOutput: '[[Machine learning]] uses [[neural networks]] to learn patterns.',
    exampleNote: 'Illustrative output. Review the actual model result before reuse.',
    factHeading: 'At a glance',
    facts: [
      {label: 'Outputs', value: 'Markdown notes and inspectable artifacts'},
      {label: 'Model choice', value: 'Cloud, gateway or local server'},
      {label: 'Control', value: 'Explicit task scope and output paths'},
      {label: 'Release guide', value: '{version}'},
    ],
    releaseHeading: "Multiple diagrams, independent exports",
    releaseBody: "Select several chart types in one run and choose multiple output formats independently for each type. Unchecking a type retains its format preferences; leaving every type unchecked uses automatic analysis.",
    releaseLink: 'Read the upgrade guide',
    retrievalHeading: 'Reference and support',
    retrievalLead: 'Find provider setup, troubleshooting and a compact reading index for automated clients.',
    languageBoundary: 'The website has 34 locale routes; the plugin UI has 21 locales. English and Simplified Chinese are indexable. Other languages remain available with their publication status visible.',
    retrievalLinks: [
      {title: 'Provider setup', body: 'Match the endpoint, protocol and model to your task.', href: '/docs/providers/overview'},
      {title: 'Troubleshooting', body: 'Reproduce a failure with a small note and sanitized evidence.', href: '/docs/advanced/troubleshooting'},
      {title: 'Agent reading index', body: 'Canonical guides, source contracts and language boundaries in llms.txt.', href: '/llms.txt', kind: 'static'},
    ],
  },
  'zh-CN': {
    title: 'Notemd 文档',
    description: '选择自己的模型，为 Obsidian 笔记添加链接、开展研究并整理知识。',
    eyebrow: '面向 Obsidian 的知识工作流',
    heading: 'Notemd',
    lead: '把源笔记处理为带链接的 Markdown、概念笔记、研究摘要、译文和图表。选择模型，核对输出，将学到的内容保存在自己的 Vault 中。',
    primary: '从一篇笔记开始',
    secondary: '版本指南',
    faq: '常见问题',
    audienceHeading: '选择你的入口',
    sections: [
      {title: '新人入门', body: '安装 Notemd、配置 provider，并检查首个任务的输出。', href: '/docs/getting-started/quick-start'},
      {title: '用户工作流', body: '选择笔记或文件夹任务，确认输出路径与恢复步骤。', href: '/docs/features/workflows'},
      {title: '开发者', body: '构建、测试，并扩展现有 provider 和 operation 契约。', href: '/docs/developers/overview'},
      {title: 'Agent', body: '发现受支持命令、导出 schema 和宿主前置条件。', href: '/docs/agents/overview'},
    ],
    exampleHeading: '可直接检查的文件',
    sourceLabel: '源笔记',
    outputLabel: '处理后的笔记示例',
    exampleSource: '机器学习使用神经网络学习数据中的规律。',
    exampleOutput: '[[机器学习]]使用[[神经网络]]学习数据中的规律。',
    exampleNote: '此处为示意输出，实际模型结果应在使用前核对。',
    factHeading: '功能概览',
    facts: [
      {label: '输出', value: 'Markdown 笔记与可检查的产物'},
      {label: '模型选择', value: '云端、网关或本地服务'},
      {label: '操作控制', value: '明确的任务范围和输出路径'},
      {label: '版本指南', value: '{version}'},
    ],
    releaseHeading: "多种图表，独立导出",
    releaseBody: "一次勾选多种图表，每种类型独立选择多种输出格式。取消勾选仍保留该类型的格式偏好；全部取消则自动分析原文。",
    releaseLink: '阅读升级指南',
    retrievalHeading: '参考资料与支持',
    retrievalLead: '查阅 provider 设置、故障排查，以及供自动化客户端使用的精简阅读索引。',
    languageBoundary: '网站提供 34 个语言路由，插件 UI 支持 21 个 locale。英文与简体中文允许索引，其他语言保留可访问入口并明确显示发布状态。',
    retrievalLinks: [
      {title: 'Provider 设置', body: '为任务匹配正确的端点、协议和模型。', href: '/docs/providers/overview'},
      {title: '故障排查', body: '使用小型笔记与脱敏证据复现问题。', href: '/docs/advanced/troubleshooting'},
      {title: 'Agent 阅读索引', body: 'llms.txt 汇总标准指南、源码契约和语言边界。', href: '/llms.txt', kind: 'static'},
    ],
  },
};

export default function Home() {
  const {siteConfig, i18n} = useDocusaurusContext();
  const copy = selectHomepageCopy({...copyByLocale, ...homeCopyOverrides}, i18n.currentLocale);
  const pageUrl = new URL(siteConfig.baseUrl, siteConfig.url).toString();
  const canonicalBasePath = siteConfig.customFields.canonicalBasePath;
  const canonicalSiteUrl = new URL(canonicalBasePath, siteConfig.url).toString();
  const releaseGuide = `/docs/releases/${releaseFacts.version}`;

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
            isPartOf: {'@type': 'WebSite', '@id': `${canonicalSiteUrl}#website`, url: canonicalSiteUrl},
            mainEntity: {'@id': `${canonicalSiteUrl}#software`},
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
              <Link className="button button--primary button--lg" to="/docs/getting-started/quick-start">{copy.primary}</Link>
              <Link className="button button--secondary button--lg" to={releaseGuide}>{copy.secondary} · {releaseFacts.version}</Link>
            </div>
          </div>
          <figure className={styles.example}>
            <figcaption>{copy.exampleHeading}</figcaption>
            <span className={styles.exampleLabel}>{copy.sourceLabel}</span>
            <pre dir="auto"><code>{copy.exampleSource}</code></pre>
            <span className={styles.exampleLabel}>{copy.outputLabel}</span>
            <pre className={styles.exampleOutput} dir="auto"><code>{copy.exampleOutput}</code></pre>
            <p>{copy.exampleNote}</p>
          </figure>
        </section>

        <section className={styles.audienceSection} aria-labelledby="audience-guide-heading">
          <h2 id="audience-guide-heading">{copy.audienceHeading}</h2>
          <nav className={styles.sectionGrid} aria-labelledby="audience-guide-heading">
            {copy.sections.map(section => (
              <Link className={styles.sectionCard} key={section.href} to={section.href}>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
                <span className={styles.cardArrow} aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        </section>

        <section className={styles.factBand} aria-labelledby="notemd-facts-heading">
          <div className={styles.factBandInner}>
            <h2 id="notemd-facts-heading">{copy.factHeading}</h2>
            <dl className={styles.factGrid}>
              {copy.facts.map(fact => (
                <div className={styles.factItem} key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value.replace('{version}', releaseFacts.version)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={styles.releaseSection} aria-labelledby="release-guide-heading">
          <div>
            <p className={styles.eyebrow}>{releaseFacts.version}</p>
            <h2 id="release-guide-heading">{copy.releaseHeading}</h2>
            <p>{copy.releaseBody}</p>
          </div>
          <Link className="button button--secondary" to={releaseGuide}>{copy.releaseLink}</Link>
        </section>

        <section className={styles.retrievalSection} aria-labelledby="answer-engine-source-map-heading">
          <div className={styles.retrievalCopy}>
            <h2 id="answer-engine-source-map-heading">{copy.retrievalHeading}</h2>
            <p>{copy.retrievalLead}</p>
            <p className={styles.languageBoundary}>{copy.languageBoundary}</p>
          </div>
          <div className={styles.retrievalLinks}>
            {copy.retrievalLinks.map(source => (
              <Link className={styles.retrievalLink} key={source.href}
                {...(source.kind === 'static'
                  ? {href: `${canonicalBasePath}llms.txt`, autoAddBaseUrl: false, 'data-noBrokenLinkCheck': true}
                  : {to: source.href})}>
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
