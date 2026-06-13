// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/configuration',
      ],
    },
    {
      type: 'category',
      label: 'Core Features',
      items: [
        'features/wiki-links',
        'features/concept-notes',
        'features/research',
        'features/translation',
        'features/diagrams',
        'features/workflows',
      ],
    },
    {
      type: 'category',
      label: 'LLM Providers',
      items: [
        'providers/overview',
        'providers/openai',
        'providers/anthropic',
        'providers/google',
        'providers/local',
        'providers/china',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/custom-prompts',
        'advanced/batch-processing',
        'advanced/troubleshooting',
      ],
    },
    'pillar-ai-knowledge',
    'faq',
  ],
};

export default sidebars;
