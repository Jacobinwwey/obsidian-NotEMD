#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  buildGalleryManifest,
  collectStaleGalleryAssetNames,
  isPngBuffer,
  renderGalleryAssets
} = require('./lib/diagram-gallery-runtime');

const repoRoot = path.resolve(__dirname, '..');
const cacheRoot = path.join(repoRoot, '.cache', 'diagram-gallery');
const outputRoot = path.join(repoRoot, 'docs', 'assets', 'diagrams');
const checkOnly = process.argv.slice(2).includes('--check');

function manifestText(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function assertOutputRoot() {
  const expected = path.resolve(repoRoot, 'docs', 'assets', 'diagrams');
  if (path.resolve(outputRoot) !== expected) {
    throw new Error(`Refusing to write diagram gallery outside ${expected}.`);
  }
}

function expectedAssetNames(manifest) {
  return new Set([
    'manifest.json',
    ...manifest.entries.flatMap(entry => [path.basename(entry.svgPath), path.basename(entry.pngPath)])
  ]);
}

function verifyCommittedGallery(entries, manifest) {
  const failures = [];
  const manifestPath = path.join(outputRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath) || fs.readFileSync(manifestPath, 'utf8') !== manifestText(manifest)) {
    failures.push('manifest.json is stale');
  }
  for (const entry of entries) {
    const svgPath = path.join(outputRoot, `${entry.fixtureId}.svg`);
    const pngPath = path.join(outputRoot, `${entry.fixtureId}.png`);
    if (!fs.existsSync(svgPath) || fs.readFileSync(svgPath, 'utf8') !== entry.svg) {
      failures.push(`${entry.fixtureId}.svg is stale`);
    }
    if (!fs.existsSync(pngPath) || !isPngBuffer(fs.readFileSync(pngPath))) {
      failures.push(`${entry.fixtureId}.png is missing or invalid`);
    }
  }
  const existingNames = fs.existsSync(outputRoot) ? fs.readdirSync(outputRoot) : [];
  const staleNames = collectStaleGalleryAssetNames(existingNames, expectedAssetNames(manifest));
  failures.push(...staleNames.map(name => `${name} is obsolete`));
  if (failures.length > 0) {
    throw new Error(`Diagram gallery check failed:\n- ${failures.join('\n- ')}\nRun npm run diagram:gallery.`);
  }
}

function writeGallery(entries, manifest) {
  assertOutputRoot();
  fs.mkdirSync(outputRoot, { recursive: true });
  const expectedNames = expectedAssetNames(manifest);
  const staleNames = collectStaleGalleryAssetNames(fs.readdirSync(outputRoot), expectedNames);
  for (const staleName of staleNames) {
    fs.unlinkSync(path.join(outputRoot, staleName));
  }
  for (const entry of entries) {
    if (!isPngBuffer(entry.png)) {
      throw new Error(`Gallery fixture "${entry.fixtureId}" produced an invalid PNG.`);
    }
    fs.writeFileSync(path.join(outputRoot, `${entry.fixtureId}.svg`), entry.svg, 'utf8');
    fs.writeFileSync(path.join(outputRoot, `${entry.fixtureId}.png`), entry.png);
  }
  fs.writeFileSync(path.join(outputRoot, 'manifest.json'), manifestText(manifest), 'utf8');
  return staleNames;
}

async function main() {
  const entries = await renderGalleryAssets(repoRoot, cacheRoot);
  const manifest = buildGalleryManifest(entries);
  let removed = [];
  if (checkOnly) {
    verifyCommittedGallery(entries, manifest);
  } else {
    removed = writeGallery(entries, manifest);
  }
  process.stdout.write(`${JSON.stringify({
    mode: checkOnly ? 'check' : 'generate',
    entryCount: entries.length,
    outputRoot,
    removed
  }, null, 2)}\n`);
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
