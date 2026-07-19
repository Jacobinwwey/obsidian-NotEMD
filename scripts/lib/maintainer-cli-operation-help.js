const OPERATION_HELP = {
  'content.batch-generate-from-titles': {
    summary: 'Batch generate from note titles in a folder.',
    required: ['folderPath'],
    optional: ['fileSelectionProfileId', 'fileSelectionProfileName', 'includeSubfoldersMode', 'fileFilterMode', 'fileFilterPattern', 'fileFilterTarget', 'fileFilterCaseSensitive', 'fileFilterInvert'],
    exampleInput: '{"folderPath":"docs","includeSubfoldersMode":"exclude","fileFilterMode":"regex","fileFilterPattern":"(^|/)index\\\\.(zh-CN|en)\\\\.md$","fileFilterTarget":"relativePath"}'
  },
  'content.split-note-by-chapters': {
    summary: 'Split one note into chapter files plus TOC/manifest.',
    required: ['sourcePath'],
    optional: ['splitHeadingLevel'],
    exampleInput: '{"sourcePath":"index.zh-CN.md","splitHeadingLevel":"h2"}'
  },
  'research.summarize-topic': {
    summary: 'Append a research summary to a note.',
    required: ['sourcePath'],
    optional: ['topic'],
    exampleInput: '{"sourcePath":"index.zh-CN.md","topic":"RAG quality audit"}'
  },
  'diagram.generate': {
    summary: 'Generate a saved diagram artifact or Mermaid output.',
    required: ['sourcePath'],
    optional: ['executionMode', 'requestedIntent', 'requestedRenderTarget', 'compatibilityMode', 'targetLanguage'],
    exampleInput: '{"sourcePath":"index.zh-CN.md","executionMode":"save-artifact","requestedIntent":"erDiagram","targetLanguage":"en"}',
    additionalExamples: ['{"sourcePath":"circuits/common-source.md","executionMode":"save-artifact","requestedIntent":"circuit","requestedRenderTarget":"circuitikz","compatibilityMode":"best-fit","targetLanguage":"en"}']
  },
  'local-knowledge.inspect': {
    summary: 'Inspect task-scoped local knowledge retrieval inputs, paths, and context.',
    required: ['taskScope'],
    optional: ['sourcePath', 'currentFilePath', 'query', 'knowledgePaths', 'topK', 'slidingWindowSize', 'maxSnippetChars'],
    exampleInput: '{"taskScope":"diagramGeneration","sourcePath":"index.zh-CN.md","knowledgePaths":["maintainer","superpowers"],"topK":2,"slidingWindowSize":1}',
    additionalExamples: [
      '{"taskScope":"batchGenerateFromTitles","sourcePath":"index.zh-CN.md"}',
      '{"taskScope":"researchSummarize","query":"task-scoped retrieval behavior","knowledgePaths":["maintainer"]}',
      '{"taskScope":"researchSummarize","query":"chapter split TOC managed artifacts guarded reruns","knowledgePaths":["chapter-split-toc.md","chapter-split-toc.zh-CN.md"]}',
      '{"taskScope":"researchSummarize","query":"real-note query diversity beyond chapter split showcase","knowledgePaths":["brainstorms","maintainer"],"topK":2,"slidingWindowSize":1}',
      '{"taskScope":"researchSummarize","query":"MiniSearch ragas RAGPerf execution chain maintainer-only offline evidence","knowledgePaths":["brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.md"],"topK":2,"slidingWindowSize":1,"maxSnippetChars":640}',
      '{"taskScope":"researchSummarize","query":"managed-artifact kpm markdown-toc active-file scoped stable block refs","knowledgePaths":["brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.md"],"topK":2,"slidingWindowSize":1,"maxSnippetChars":640}',
      '{"taskScope":"batchGenerateFromTitles","sourcePath":"brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md","knowledgePaths":["brainstorms","maintainer"],"topK":2,"slidingWindowSize":1}',
      '{"taskScope":"diagramGeneration","sourcePath":"index.zh-CN.md","knowledgePaths":["brainstorms","maintainer"],"topK":2,"slidingWindowSize":1}',
      '{"taskScope":"researchSummarize","query":"missing path coverage","knowledgePaths":[]}',
      '{"taskScope":"researchSummarize","query":"svg-only repo saga scope","knowledgePaths":["repo-saga"]}'
    ]
  },
  'provider.profile.export-redacted': {
    summary: 'Export provider profiles with API keys redacted.',
    required: [],
    optional: []
  },
  'cli.capability-manifest.export': {
    summary: 'Export the registry-backed CLI capability manifest.',
    required: [],
    optional: []
  },
  'cli.invocation-contract.export': {
    summary: 'Export the typed CLI invocation contract.',
    required: [],
    optional: []
  },
  'cli.public-surface.export': {
    summary: 'Export the bounded public-safe CLI surface.',
    required: [],
    optional: []
  }
};

module.exports = {
  OPERATION_HELP
};
