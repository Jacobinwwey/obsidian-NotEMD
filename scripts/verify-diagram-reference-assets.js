const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');
const catalogPath = path.join(repoRoot, 'src', 'diagram', 'diagramReferenceCatalog.json');
const sourceRoot = path.join(repoRoot, 'ref', 'diagram-design', 'docs', 'screenshots');
const bundledRoot = path.join(repoRoot, 'src', 'assets', 'diagramReference');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

function sha256(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function fail(message) {
    throw new Error(`[diagram-reference-assets] ${message}`);
}

if (!Array.isArray(catalog) || catalog.length !== 27) {
    fail(`expected 27 catalog entries, received ${Array.isArray(catalog) ? catalog.length : 'non-array'}`);
}

const ids = new Set();
const assetIds = new Set();
for (const entry of catalog) {
    if (!entry || typeof entry !== 'object') {
        fail('catalog contains a non-object entry');
    }
    if (typeof entry.id !== 'string' || ids.has(entry.id)) {
        fail(`duplicate or invalid reference id: ${entry.id}`);
    }
    if (typeof entry.previewAssetId !== 'string' || assetIds.has(entry.previewAssetId)) {
        fail(`duplicate or invalid preview asset id: ${entry.previewAssetId}`);
    }
    ids.add(entry.id);
    assetIds.add(entry.previewAssetId);

    const sourcePath = path.join(sourceRoot, entry.screenshotFileName);
    const bundledPath = path.join(bundledRoot, entry.screenshotFileName);
    if (!fs.existsSync(sourcePath)) {
        fail(`reference screenshot is missing: ${sourcePath}`);
    }
    if (!fs.existsSync(bundledPath)) {
        fail(`bundled screenshot is missing: ${bundledPath}`);
    }
    if (sha256(sourcePath) !== sha256(bundledPath)) {
        fail(`bundled screenshot is stale: ${entry.previewAssetId}`);
    }
}

const bundledFiles = fs.readdirSync(bundledRoot).filter(file => file.toLowerCase().endsWith('.png'));
if (bundledFiles.length !== catalog.length) {
    fail(`bundled screenshot count ${bundledFiles.length} does not match catalog count ${catalog.length}`);
}

console.log(`Verified ${catalog.length} diagram-design reference screenshots against the pinned source checkout.`);
