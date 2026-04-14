import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('render host bundle audit script', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const workflowPath = path.join(repoRoot, '.github', 'workflows', 'release.yml');
    const scriptRelativePath = path.join('scripts', 'audit-render-host-bundle.js');
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

        beforeAll(() => {
            ({ auditRenderHostBundle, auditRenderHostBundleSource } = require(scriptPath));
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
                const external = "rendering-webview/index.html";
            `, '/tmp/main.js')).toThrow('rendering-webview/index.html');
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
    });
});
