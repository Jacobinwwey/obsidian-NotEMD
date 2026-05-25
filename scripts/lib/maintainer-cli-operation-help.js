const OPERATION_HELP = {
  'content.batch-generate-from-titles': {
    summary: 'Batch generate from note titles in a folder.',
    required: ['folderPath'],
    optional: ['fileSelectionProfileId', 'fileSelectionProfileName', 'includeSubfoldersMode', 'fileFilterMode', 'fileFilterPattern', 'fileFilterTarget', 'fileFilterCaseSensitive', 'fileFilterInvert']
  },
  'content.split-note-by-chapters': {
    summary: 'Split one note into chapter files plus TOC/manifest.',
    required: ['sourcePath'],
    optional: []
  },
  'research.summarize-topic': {
    summary: 'Append a research summary to a note.',
    required: ['sourcePath'],
    optional: ['topic']
  },
  'diagram.generate': {
    summary: 'Generate a saved diagram artifact or Mermaid output.',
    required: ['sourcePath'],
    optional: ['executionMode', 'requestedIntent', 'compatibilityMode', 'targetLanguage']
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
