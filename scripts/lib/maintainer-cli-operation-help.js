const OPERATION_HELP = {
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
