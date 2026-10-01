'use strict';

const {spawnSync} = require('node:child_process');
const {version, repositoryUrl} = require('../src/lib/releaseFacts.cjs');
const {REQUIRED_RELEASE_ASSET_FILES, RELEASE_TAG_PATTERN_SOURCE} = require('../../scripts/lib/packaging-contract.js');

function assertPublishedRelease(release, expectedVersion) {
  if (!release || release.tag_name !== expectedVersion || release.draft !== false || release.prerelease !== false) {
    throw new Error(`Pages requires the public stable release ${expectedVersion}`);
  }
  if (!Array.isArray(release.assets)) throw new Error('Release assets are unavailable');
  for (const name of REQUIRED_RELEASE_ASSET_FILES) {
    const matches = release.assets.filter(asset => asset?.name === name);
    if (matches.length !== 1 || matches[0].state !== 'uploaded' || !Number.isSafeInteger(matches[0].size) || matches[0].size <= 0) {
      throw new Error(`Public release is missing a complete ${name} asset`);
    }
  }
}

function main() {
  if (process.argv.length > 2) throw new Error('This gate reads the documented version; no arguments are accepted');
  if (!new RegExp(RELEASE_TAG_PATTERN_SOURCE).test(version)) throw new Error('Invalid documented release version');
  const repository = new URL(repositoryUrl).pathname.replace(/^\//, '');
  const response = spawnSync('gh', ['api', `repos/${repository}/releases/tags/${version}`], {
    encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024,
  });
  // Every failed lookup blocks deployment. A prior successful build is not
  // evidence that its advertised download is public or complete now.
  if (response.error) throw response.error;
  if (response.status !== 0) throw new Error(`Release availability check failed: ${response.stderr.trim() || `exit ${response.status}`}`);
  assertPublishedRelease(JSON.parse(response.stdout), version);
  console.log(`Public release ${version} contains all required assets; Pages deployment may proceed.`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = {assertPublishedRelease};
