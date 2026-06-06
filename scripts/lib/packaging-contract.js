const MAIN_BUNDLE_OUTPUT_FILE = 'main.js';

const RENDER_HOST_RUNTIME_OUTPUT_FILE = 'render-host.mjs';

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

module.exports = {
    MAIN_BUNDLE_OUTPUT_FILE,
    REQUIRED_RELEASE_ASSET_FILES,
    RENDER_HOST_RUNTIME_OUTPUT_FILE,
    RENDER_HOST_AUDIT_MARKERS,
    RENDER_HOST_STANDALONE_OUTPUT_FILES
};
