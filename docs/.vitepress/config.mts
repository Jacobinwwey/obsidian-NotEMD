const planRewrites = {
    'superpowers/plans/2026-03-26-agents-and-provider-expansion.en.md':
        'superpowers/plans/2026-03-26-agents-and-provider-expansion.md',
    'superpowers/plans/2026-03-26-china-provider-expansion-round2.en.md':
        'superpowers/plans/2026-03-26-china-provider-expansion-round2.md',
    'superpowers/plans/2026-04-09-language-support-first-principles-multiphase.en.md':
        'superpowers/plans/2026-04-09-language-support-first-principles-multiphase.md',
    'superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.en.md':
        'superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.md'
} as const;

export default {
    title: 'NotEMD Docs',
    description: 'Repository documentation for obsidian-NotEMD',
    cleanUrls: true,
    rewrites: planRewrites,
    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Docs Hub', link: '/README' },
            { text: '文档中心', link: '/README.zh-CN' },
            { text: 'Plans', link: '/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap' },
            { text: 'Releases', link: '/releases/1.8.2' }
        ],
        sidebar: [
            {
                text: 'Overview',
                collapsed: false,
                items: [
                    { text: 'Local Home', link: '/' },
                    { text: 'Docs Hub (EN)', link: '/README' },
                    { text: 'Docs Hub (zh-CN)', link: '/README.zh-CN' }
                ]
            },
            {
                text: 'Releases',
                collapsed: false,
                items: [
                    { text: '1.8.0 (EN)', link: '/releases/1.8.0' },
                    { text: '1.8.0 (zh-CN)', link: '/releases/1.8.0.zh-CN' },
                    { text: '1.8.1 (EN)', link: '/releases/1.8.1' },
                    { text: '1.8.1 (zh-CN)', link: '/releases/1.8.1.zh-CN' },
                    { text: '1.8.2 (EN)', link: '/releases/1.8.2' },
                    { text: '1.8.2 (zh-CN)', link: '/releases/1.8.2.zh-CN' }
                ]
            },
            {
                text: 'Maintainer',
                collapsed: false,
                items: [
                    { text: 'Release Workflow (EN)', link: '/maintainer/release-workflow' },
                    { text: 'Release Workflow (zh-CN)', link: '/maintainer/release-workflow.zh-CN' }
                ]
            },
            {
                text: 'i18n',
                collapsed: false,
                items: [
                    { text: 'Language Hub (EN)', link: '/i18n/README' },
                    { text: 'Language Hub (zh)', link: '/i18n/README_zh' }
                ]
            },
            {
                text: 'Brainstorms',
                collapsed: false,
                items: [
                    {
                        text: 'Diagram Platform Phase 2 Requirements (EN)',
                        link: '/brainstorms/2026-04-14-diagram-platform-phase-2-requirements'
                    },
                    {
                        text: 'Diagram Platform Phase 2 Requirements (zh-CN)',
                        link: '/brainstorms/2026-04-14-diagram-platform-phase-2-requirements.zh-CN'
                    }
                ]
            },
            {
                text: 'Plans',
                collapsed: false,
                items: [
                    {
                        text: 'AGENTS And Provider Expansion (EN)',
                        link: '/superpowers/plans/2026-03-26-agents-and-provider-expansion'
                    },
                    {
                        text: 'AGENTS And Provider Expansion (zh-CN)',
                        link: '/superpowers/plans/2026-03-26-agents-and-provider-expansion.zh-CN'
                    },
                    {
                        text: 'China Provider Expansion Round 2 (EN)',
                        link: '/superpowers/plans/2026-03-26-china-provider-expansion-round2'
                    },
                    {
                        text: 'China Provider Expansion Round 2 (zh-CN)',
                        link: '/superpowers/plans/2026-03-26-china-provider-expansion-round2.zh-CN'
                    },
                    {
                        text: 'Language Support Multiphase (EN)',
                        link: '/superpowers/plans/2026-04-09-language-support-first-principles-multiphase'
                    },
                    {
                        text: 'Language Support Multiphase (zh-CN)',
                        link: '/superpowers/plans/2026-04-09-language-support-first-principles-multiphase.zh-CN'
                    },
                    {
                        text: 'Diagram Rendering Platform Roadmap (EN)',
                        link: '/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap'
                    },
                    {
                        text: 'Diagram Rendering Platform Roadmap (zh-CN)',
                        link: '/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN'
                    }
                ]
            },
            {
                text: 'Specs',
                collapsed: false,
                items: [
                    {
                        text: 'AGENTS And Provider Expansion Design (EN)',
                        link: '/superpowers/specs/2026-03-26-agents-and-provider-expansion-design'
                    },
                    {
                        text: 'AGENTS And Provider Expansion Design (zh-CN)',
                        link: '/superpowers/specs/2026-03-26-agents-and-provider-expansion-design.zh-CN'
                    },
                    {
                        text: 'China Provider Expansion Round 2 Design (EN)',
                        link: '/superpowers/specs/2026-03-26-china-provider-expansion-round2-design'
                    },
                    {
                        text: 'China Provider Expansion Round 2 Design (zh-CN)',
                        link: '/superpowers/specs/2026-03-26-china-provider-expansion-round2-design.zh-CN'
                    }
                ]
            },
            {
                text: 'Baselines',
                collapsed: false,
                items: [
                    { text: 'Baselines Hub (EN)', link: '/superpowers/baselines/README' },
                    { text: 'Baselines Hub (zh-CN)', link: '/superpowers/baselines/README.zh-CN' },
                    {
                        text: 'Language Support Baseline README (EN)',
                        link: '/superpowers/baselines/2026-04-09-language-support/README'
                    },
                    {
                        text: 'Language Support Baseline README (zh-CN)',
                        link: '/superpowers/baselines/2026-04-09-language-support/README.zh-CN'
                    },
                    {
                        text: 'Language Support Release Handoff (EN)',
                        link: '/superpowers/baselines/2026-04-09-language-support/release-handoff'
                    },
                    {
                        text: 'Language Support Release Handoff (zh-CN)',
                        link: '/superpowers/baselines/2026-04-09-language-support/release-handoff.zh-CN'
                    }
                ]
            }
        ],
        socialLinks: [{ icon: 'github', link: 'https://github.com/Jacobinwwey/obsidian-NotEMD' }]
    }
};
