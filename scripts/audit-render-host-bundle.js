#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
    MAIN_BUNDLE_OUTPUT_FILE,
    RENDER_HOST_AUDIT_MARKERS,
    RENDER_HOST_STANDALONE_OUTPUT_FILES
} = require('./lib/packaging-contract.js');

const REQUIRED_RENDER_HOST_MARKERS = [...RENDER_HOST_AUDIT_MARKERS];

const DISALLOWED_RENDER_HOST_PATTERNS = [
    /rendering-webview\/index\.html/i,
    /src\/rendering\/webview\//i,
    /render-host\.(?:mjs|html|js)/i
];

const DISALLOWED_RENDER_HOST_OUTPUT_FILES = [...RENDER_HOST_STANDALONE_OUTPUT_FILES];

function resolveBundlePath(projectRoot = process.cwd()) {
    return path.join(projectRoot, MAIN_BUNDLE_OUTPUT_FILE);
}

function auditRenderHostBundleSource(bundleSource, bundlePath = MAIN_BUNDLE_OUTPUT_FILE) {
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

    for (const relativePath of DISALLOWED_RENDER_HOST_OUTPUT_FILES) {
        const candidatePath = path.join(projectRoot, relativePath);
        if (fs.existsSync(candidatePath)) {
            throw new Error(
                `Render host bundle audit failed for ${bundlePath}: unexpected standalone render-host output file "${relativePath}".`
            );
        }
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
    DISALLOWED_RENDER_HOST_OUTPUT_FILES,
    resolveBundlePath,
    auditRenderHostBundleSource,
    auditRenderHostBundle
};
