/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    'pillar-ai-knowledge',
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
    'faq',
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/custom-prompts',
        'advanced/batch-processing',
        'advanced/troubleshooting',
      ],
    },
  ],
};

export default sidebars;
