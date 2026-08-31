'use strict';

const fs = require('fs');
const path = require('path');

async function buildCatalogBundle(repoRoot) {
  const esbuild = require('esbuild');
  const cacheRoot = path.join(repoRoot, '.cache', 'diagram-examples');
  const outputPath = path.join(cacheRoot, 'catalog.cjs');
  fs.mkdirSync(cacheRoot, { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(repoRoot, 'scripts', 'diagram-examples-catalog-entry.ts')],
    outfile: outputPath,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node16',
    logLevel: 'silent'
  });
  return outputPath;
}

async function loadExecutableDiagramExampleSummaries(repoRoot) {
  const bundlePath = await buildCatalogBundle(repoRoot);
  delete require.cache[require.resolve(bundlePath)];
  const bundle = require(bundlePath);
  if (!bundle || typeof bundle.getExecutableDiagramExampleSummaries !== 'function') {
    throw new Error('Diagram example catalog bundle did not expose its summary function.');
  }
  const summaries = bundle.getExecutableDiagramExampleSummaries();
  if (!Array.isArray(summaries)) {
    throw new Error('Diagram example catalog bundle returned an invalid summary list.');
  }
  return summaries;
}

module.exports = {
  buildCatalogBundle,
  loadExecutableDiagramExampleSummaries
};
