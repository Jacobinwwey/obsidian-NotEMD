const {version, description} = require('../../../package.json');
const {minAppVersion} = require('../../../manifest.json');

const repositoryUrl = 'https://github.com/Jacobinwwey/obsidian-NotEMD';

module.exports = Object.freeze({
  version,
  description,
  minimumObsidianVersion: minAppVersion,
  repositoryUrl,
  releaseUrl: `${repositoryUrl}/releases/tag/${version}`,
  installUrl: 'obsidian://show-plugin?id=notemd',
});
