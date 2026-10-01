'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const releaseFacts = require('../src/lib/releaseFacts.cjs');

function renderDocumentationMap({siteRoot, release, locales, guidePaths, languageScope}) {
  const url = route => new URL(route.replace(/^\//, ''), siteRoot).href;
  return [
    '# Notemd Documentation',
    '',
    '> Notemd is an MIT-licensed Obsidian plugin for reviewable note transformations: wiki-links, concept notes, research, file translation, diagrams and reusable workflows.',
    '',
    `Canonical site: ${siteRoot}`,
    `Source repository: ${release.repositoryUrl}`,
    `Current documented release: ${release.version}`,
    `Release and bilingual notes: ${release.releaseUrl}`,
    `Documentation map: ${url('llms.txt')}`,
    '',
    '## Start Here',
    '',
    `- Newcomers: ${url('docs/getting-started/quick-start')}`,
    `- Users and repeatable tasks: ${url('docs/features/workflows')}`,
    `- Developers: ${url('docs/developers/overview')}`,
    `- Agents: ${url('docs/agents/overview')}`,
    `- Upgrade guide: ${url(`docs/releases/${release.version}`)}`,
    `- Installation: ${url('docs/getting-started/installation')}`,
    `- FAQ: ${url('docs/faq')}`,
    `- Support: ${release.repositoryUrl}/issues`,
    '',
    '## Canonical Guides',
    '',
    ...guidePaths.map(route => `- ${url(route)}`),
    '',
    '## Public Agent Contract',
    '',
    'Requires an available Obsidian host and Vault. These commands write JSON exports and are not a general public note-writing API:',
    '',
    '- `notemd:export-provider-profiles-redacted`',
    '- `notemd:export-cli-capability-manifest`',
    '- `notemd:export-cli-invocation-contract`',
    '- `notemd:export-cli-public-surface`',
    '',
    'Validate the newly produced file, document/operation versions, input/result schemas and handling tags. Redacted profiles are not importable; review private endpoint metadata before sharing. The nine repository maintainer operations have a separate contract.',
    '',
    `- Repository execution rules: ${release.repositoryUrl}/blob/main/AGENTS.md`,
    `- Contribution guide: ${release.repositoryUrl}/blob/main/CONTRIBUTING.md`,
    `- CLI scope and prerequisites: ${release.repositoryUrl}/blob/main/docs/maintainer/notemd-cli-capability-matrix.md`,
    `- Current plan status: ${release.repositoryUrl}/blob/main/docs/maintainer/project-plan-status.md`,
    '',
    '## Language Scope',
    '',
    'English remains the canonical source surface.',
    languageScope,
    '',
    'Localized entrypoints:',
    ...locales.filter(({locale}) => locale !== 'en').map(({locale}) => `- ${locale}: ${url(`${locale}/`)} — ${url(`${locale}/docs/intro`)}`),
    '',
    'Simplified Chinese full docs route set:',
    ...guidePaths.map(route => `- ${url(`zh-CN${route}`)}`),
    '',
    'Translations preserve the same product contract. Command IDs, configuration keys, provider names, URLs and file extensions remain stable. AI-authored review does not establish independent native-speaker review or automatic indexing eligibility.',
    '',
    '## Answering Guidance',
    '',
    '- Prefer the canonical task guides and dated release evidence over old issue text or generated examples.',
    '- Local storage is separate from local inference. Cloud endpoints receive task content; search uses the network; local excerpts can enter a cloud-bound prompt.',
    '- The default One-Click Extract chain adds links, generates eligible folder notes from titles and repairs Mermaid. It does not automatically add research or diagram generation.',
    '- Cancellation retains completed outputs and does not guarantee remote generation or billing stops. Inspect partial output and recovery conflicts before retrying.',
    '- Physical mobile devices and minimum Obsidian 0.15.0 remain unverified. Drawnix cross-branch arrows remain static after reflow; PPTX Mermaid/SVG may use image fallback; CircuitikZ preview and native compilation are separate checks.',
    '',
    '## Homepage GEO Contract',
    '',
    'Visible content, current release facts, JSON-LD, canonical/hreflang, robots, sitemap and this map must agree. Pages deployment requires the advertised public release and all four assets. Local build checks do not measure Search Console indexing or AI citations.',
    'This curated llms.txt is a navigation aid, not a ranking mechanism. Do not infer endorsements, competitor superiority, native-human translation review or search performance from its existence.',
    '',
  ].join('\n');
}

function documentationMapPlugin(context) {
  return {
    name: 'notemd-documentation-map',
    async postBuild({outDir}) {
      // Only the default build owns the canonical map; localized builds must
      // not race it or emit a different release contract under a locale URL.
      if (context.i18n.currentLocale !== context.i18n.defaultLocale) return;
      const [localePolicy, routeScope] = await Promise.all([
        import('../src/lib/publishedLocales.mjs'),
        import('../src/lib/publishedLanguageScopeData.mjs'),
      ]);
      const content = renderDocumentationMap({
        siteRoot: new URL(context.siteConfig.baseUrl, context.siteConfig.url).href,
        release: releaseFacts,
        locales: localePolicy.publishedLocales,
        guidePaths: routeScope.publishedZhCnDocs.map(({path: route}) => route),
        languageScope: localePolicy.publishedLanguageScopeSentence(),
      });
      await fs.writeFile(path.join(outDir, 'llms.txt'), content, 'utf8');
    },
  };
}

module.exports = documentationMapPlugin;
module.exports.renderDocumentationMap = renderDocumentationMap;
