import * as fs from 'fs';
import * as path from 'path';

describe('GitHub Pages workflow', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const workflowPath = path.join(repoRoot, '.github', 'workflows', 'deploy-docs.yml');
    const workflow = fs.readFileSync(workflowPath, 'utf8');

    test('uses Node 24 compatible action major versions for Pages deployment', () => {
        expect(workflow).toContain('actions/checkout@v7');
        expect(workflow).toContain('actions/setup-node@v6');
        expect(workflow).toContain('actions/upload-pages-artifact@v5');
        expect(workflow).toContain('actions/deploy-pages@v5');

        expect(workflow).not.toContain('actions/checkout@v4');
        expect(workflow).not.toContain('actions/setup-node@v4');
        expect(workflow).not.toContain('actions/upload-pages-artifact@v3');
        expect(workflow).not.toContain('actions/deploy-pages@v4');
    });
});
