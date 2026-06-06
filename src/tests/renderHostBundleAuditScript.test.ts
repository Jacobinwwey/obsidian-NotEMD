import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
const packagingContract = require('../../scripts/lib/packaging-contract.js');

describe('render host bundle audit script', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const workflowPath = path.join(repoRoot, '.github', 'workflows', 'release.yml');
    const scriptRelativePath = path.posix.join('scripts', 'audit-render-host-bundle.js');
    const scriptPath = path.join(repoRoot, scriptRelativePath);

    test('registers a dedicated render-host audit in package scripts and release workflow', () => {
        expect(packageJson.scripts['audit:render-host']).toBe(`node ${scriptRelativePath}`);
        expect(fs.existsSync(scriptPath)).toBe(true);

        const workflow = fs.readFileSync(workflowPath, 'utf8');
        expect(workflow).toContain('npm run audit:render-host');
    });

    const maybeDescribeAuditScript = fs.existsSync(scriptPath) ? describe : describe.skip;

    maybeDescribeAuditScript('audit helper', () => {
        let auditRenderHostBundle: (projectRoot?: string) => string;
        let auditRenderHostBundleSource: (bundleSource: string, bundlePath?: string) => void;
        let REQUIRED_RENDER_HOST_MARKERS: string[];
        let DISALLOWED_RENDER_HOST_PATTERNS: RegExp[];
        let DISALLOWED_RENDER_HOST_OUTPUT_FILES: string[];
        let resolveBundlePath: (projectRoot?: string) => string;

        beforeAll(() => {
            ({
                REQUIRED_RENDER_HOST_MARKERS,
                DISALLOWED_RENDER_HOST_PATTERNS,
                DISALLOWED_RENDER_HOST_OUTPUT_FILES,
                auditRenderHostBundle,
                auditRenderHostBundleSource,
                resolveBundlePath
            } = require(scriptPath));
        });

        test('reuses the shared render-host packaging contract constants', () => {
            expect(REQUIRED_RENDER_HOST_MARKERS).toEqual(packagingContract.RENDER_HOST_AUDIT_MARKERS);
            expect(DISALLOWED_RENDER_HOST_PATTERNS).toEqual(packagingContract.RENDER_HOST_STANDALONE_REFERENCE_PATTERNS);
            expect(DISALLOWED_RENDER_HOST_OUTPUT_FILES).toEqual(packagingContract.RENDER_HOST_STANDALONE_OUTPUT_FILES);
            expect(resolveBundlePath('/tmp/notemd-root')).toBe(
                path.join('/tmp/notemd-root', packagingContract.MAIN_BUNDLE_OUTPUT_FILE)
            );
        });

        test('accepts self-contained srcdoc bundle markers', () => {
            expect(() => auditRenderHostBundleSource(`
                const htmlSrcdoc = "<!DOCTYPE html>";
                const title = "Notemd Render Host";
                const shell = "notemd-render-shell";
                const themeShim = "notemd-html-preview-theme-shim";
            `, '/tmp/main.js')).not.toThrow();
        });

        test('rejects bundles missing srcdoc render-host markers', () => {
            expect(() => auditRenderHostBundleSource(`
                const title = "Notemd Render Host";
                const shell = "notemd-render-shell";
            `, '/tmp/main.js')).toThrow('htmlSrcdoc');
        });

        test('rejects bundles that depend on external render-host asset paths', () => {
            expect(() => auditRenderHostBundleSource(`
                const htmlSrcdoc = "<!DOCTYPE html>";
                const title = "Notemd Render Host";
                const shell = "notemd-render-shell";
                const themeShim = "notemd-html-preview-theme-shim";
                const external = "render-host.mjs";
            `, '/tmp/main.js')).toThrow('render-host.mjs');
        });

        test('audits the built main.js bundle from disk', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-render-host-audit-'));
            try {
                fs.writeFileSync(path.join(tempRoot, 'main.js'), `
                    const htmlSrcdoc = "<!DOCTYPE html>";
                    const title = "Notemd Render Host";
                    const shell = "notemd-render-shell";
                    const themeShim = "notemd-html-preview-theme-shim";
                `, 'utf8');

                expect(auditRenderHostBundle(tempRoot)).toBe(path.join(tempRoot, 'main.js'));
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('rejects stray render-host output files outside the main bundle', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-render-host-audit-'));
            try {
                fs.writeFileSync(path.join(tempRoot, 'main.js'), `
                    const htmlSrcdoc = "<!DOCTYPE html>";
                    const title = "Notemd Render Host";
                    const shell = "notemd-render-shell";
                    const themeShim = "notemd-html-preview-theme-shim";
                `, 'utf8');
                fs.writeFileSync(path.join(tempRoot, 'render-host.mjs'), 'export {}', 'utf8');

                expect(() => auditRenderHostBundle(tempRoot)).toThrow('render-host.mjs');
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });
    });
});
