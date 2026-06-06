const path = require('path');

const MAIN_BUNDLE_OUTPUT_FILE = 'main.js';

const RENDER_HOST_RUNTIME_OUTPUT_FILE = 'render-host.mjs';

const RELEASE_TAG_PATTERN_SOURCE = '^\\d+\\.\\d+\\.\\d+$';

const RELEASE_NOTES_DIRECTORY = 'docs/releases';

const RELEASE_NOTES_FILE_SUFFIXES = {
    english: '.md',
    simplifiedChinese: '.zh-CN.md'
};

const REQUIRED_RELEASE_ASSET_FILES = [
    MAIN_BUNDLE_OUTPUT_FILE,
    'manifest.json',
    'styles.css',
    'README.md'
];

const RENDER_HOST_AUDIT_MARKERS = [
    'htmlSrcdoc',
    'Notemd Render Host',
    'notemd-render-shell',
    'notemd-html-preview-theme-shim'
];

const RENDER_HOST_STANDALONE_OUTPUT_FILES = [
    RENDER_HOST_RUNTIME_OUTPUT_FILE,
    'render-host.html',
    'render-host.js',
    'rendering-webview/index.html'
];

function resolveReleaseNotesRelativePaths(tag) {
    return {
        english: path.posix.join(RELEASE_NOTES_DIRECTORY, `${tag}${RELEASE_NOTES_FILE_SUFFIXES.english}`),
        simplifiedChinese: path.posix.join(RELEASE_NOTES_DIRECTORY, `${tag}${RELEASE_NOTES_FILE_SUFFIXES.simplifiedChinese}`)
    };
}

module.exports = {
    MAIN_BUNDLE_OUTPUT_FILE,
    REQUIRED_RELEASE_ASSET_FILES,
    RELEASE_NOTES_DIRECTORY,
    RELEASE_NOTES_FILE_SUFFIXES,
    RELEASE_TAG_PATTERN_SOURCE,
    RENDER_HOST_RUNTIME_OUTPUT_FILE,
    RENDER_HOST_AUDIT_MARKERS,
    RENDER_HOST_STANDALONE_OUTPUT_FILES,
    resolveReleaseNotesRelativePaths
};
