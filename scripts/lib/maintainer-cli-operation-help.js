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
    optional: ['executionMode', 'requestedIntent', 'compatibilityMode', 'targetLanguage'],
    exampleInput: '{"sourcePath":"index.zh-CN.md","executionMode":"save-artifact","requestedIntent":"erDiagram","targetLanguage":"en"}'
  },
  'local-knowledge.inspect': {
    summary: 'Inspect task-scoped local knowledge retrieval inputs, paths, and context.',
    required: ['taskScope'],
    optional: ['sourcePath', 'currentFilePath', 'query', 'knowledgePaths', 'topK', 'slidingWindowSize', 'maxSnippetChars'],
    exampleInput: '{"taskScope":"diagramGeneration","sourcePath":"index.zh-CN.md","knowledgePaths":["maintainer","superpowers"],"topK":2,"slidingWindowSize":1}',
    additionalExamples: [
      '{"taskScope":"batchGenerateFromTitles","sourcePath":"index.zh-CN.md"}',
      '{"taskScope":"researchSummarize","query":"task-scoped retrieval behavior","knowledgePaths":["maintainer"]}'
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
