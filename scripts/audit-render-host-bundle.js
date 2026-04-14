#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REQUIRED_RENDER_HOST_MARKERS = [
    'htmlSrcdoc',
    'Notemd Render Host',
    'notemd-render-shell',
    'notemd-html-preview-theme-shim'
];

const DISALLOWED_RENDER_HOST_PATTERNS = [
    /rendering-webview\/index\.html/i,
    /src\/rendering\/webview\//i,
    /render-host\.(?:html|js)/i
];

function resolveBundlePath(projectRoot = process.cwd()) {
    return path.join(projectRoot, 'main.js');
}

function auditRenderHostBundleSource(bundleSource, bundlePath = 'main.js') {
    for (const marker of REQUIRED_RENDER_HOST_MARKERS) {
        if (!bundleSource.includes(marker)) {
            throw new Error(`Render host bundle audit failed for ${bundlePath}: missing required marker "${marker}".`);
        }
    }

    for (const pattern of DISALLOWED_RENDER_HOST_PATTERNS) {
        const match = bundleSource.match(pattern);
        if (match) {
            throw new Error(
                `Render host bundle audit failed for ${bundlePath}: unexpected external render-host asset reference "${match[0]}".`
            );
        }
    }
}

function auditRenderHostBundle(projectRoot = process.cwd()) {
    const bundlePath = resolveBundlePath(projectRoot);
    if (!fs.existsSync(bundlePath)) {
        throw new Error(`Render host bundle audit failed: built bundle not found at ${bundlePath}. Run npm run build first.`);
    }

    const bundleSource = fs.readFileSync(bundlePath, 'utf8');
    auditRenderHostBundleSource(bundleSource, bundlePath);
    return bundlePath;
}

if (require.main === module) {
    const bundlePath = auditRenderHostBundle();
    console.log(`Render host bundle audit passed: ${bundlePath}`);
}

module.exports = {
    REQUIRED_RENDER_HOST_MARKERS,
    DISALLOWED_RENDER_HOST_PATTERNS,
    resolveBundlePath,
    auditRenderHostBundleSource,
    auditRenderHostBundle
};
