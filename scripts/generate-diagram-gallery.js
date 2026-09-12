#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
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

function verifyCommittedGallery(entries, archiveRoot) {
  const failures = [];
  const manifestPath = path.join(archiveRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error('Diagram gallery manifest.json is missing');
  const committed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const manifest = buildGalleryManifest(entries);
  // SVG execution remains deterministic. PNG hashes attest to the archived bytes,
  // not to pixel equivalence across browser/font/OS rasterizers.
  manifest.entries = manifest.entries.map((entry, index) => ({
    ...entry, pngSha256: committed.entries?.[index]?.pngSha256
  }));
  if (manifestText(committed) !== manifestText(manifest)) {
    failures.push('manifest.json is stale');
  }
  for (const [index, entry] of entries.entries()) {
    const svgPath = path.join(archiveRoot, `${entry.fixtureId}.svg`);
    const pngPath = path.join(archiveRoot, `${entry.fixtureId}.png`);
    // Git may check text assets out with CRLF on Windows; compare their canonical text.
    if (!fs.existsSync(svgPath) || fs.readFileSync(svgPath, 'utf8').replace(/\r\n/g, '\n') !== entry.svg.replace(/\r\n/g, '\n')) {
      failures.push(`${entry.fixtureId}.svg is stale`);
    }
    if (!fs.existsSync(pngPath) || !isPngBuffer(fs.readFileSync(pngPath))) {
      failures.push(`${entry.fixtureId}.png is missing or invalid`);
    } else {
      const expectedHash = manifest.entries[index].pngSha256;
      const actualHash = createHash('sha256').update(fs.readFileSync(pngPath)).digest('hex');
      if (!/^[a-f0-9]{64}$/.test(expectedHash ?? '') || actualHash !== expectedHash) {
        failures.push(`${entry.fixtureId}.png hash does not match its archived identity`);
      }
    }
  }
  const existingNames = fs.readdirSync(archiveRoot);
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
    verifyCommittedGallery(entries, outputRoot);
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

if (require.main === module) main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

module.exports = { verifyCommittedGallery };
