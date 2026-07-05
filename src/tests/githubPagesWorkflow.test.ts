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

    test('retries transient GitHub Pages deploy service failures without masking build failures', () => {
        expect(workflow).toContain('id: deployment_first');
        expect(workflow).toContain('id: deployment_second');
        expect(workflow).toContain('id: deployment');
        expect(workflow).toContain("if: steps.deployment_first.outcome == 'failure'");
        expect(workflow).toContain("if: steps.deployment_first.outcome == 'failure' && steps.deployment_second.outcome == 'failure'");
        expect(workflow).toContain('Wait before Pages deploy retry');
        expect(workflow).toContain('Final deploy to GitHub Pages');
        expect(workflow).toContain('needs: build');
    });
});
