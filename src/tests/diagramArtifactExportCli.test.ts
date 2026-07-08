import { execFileSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DiagramSpec } from '../diagram/types';

function createSpec(): DiagramSpec {
    return {
        intent: 'flowchart',
        title: 'CLI Runtime Export',
        summary: 'Artifact export without Obsidian runtime.',
        nodes: [
            { id: 'client app', label: 'Client App', kind: 'actor' },
            { id: 'client-app', label: 'Client App Alias', kind: 'boundary' },
            { id: 'worker', label: 'Worker', kind: 'processor' }
        ],
        edges: [
            { from: 'client app', to: 'client-app', label: 'alias edge' },
            { from: 'client-app', to: 'worker', label: 'queue job', relation: 'async' }
        ],
        callouts: [
            { label: 'Boundary', detail: 'CLI export keeps labels visible.' }
        ]
    };
}

describe('diagram artifact export CLI', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const scriptPath = path.join(repoRoot, 'scripts', 'export-diagram-artifact.js');
    const englishRunbookPath = path.join(repoRoot, 'docs', 'maintainer', 'diagram-artifact-export-cli.md');
    const chineseRunbookPath = path.join(repoRoot, 'docs', 'maintainer', 'diagram-artifact-export-cli.zh-CN.md');

    test('is exposed through package scripts and bilingual maintainer runbooks', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const englishRunbook = fs.readFileSync(englishRunbookPath, 'utf8');
        const chineseRunbook = fs.readFileSync(chineseRunbookPath, 'utf8');

        expect(packageJson.scripts['diagram:export-artifact']).toBe('node scripts/export-diagram-artifact.js');

        for (const runbook of [englishRunbook, chineseRunbook]) {
            expect(runbook).toContain('npm run diagram:export-artifact');
            expect(runbook).toContain('scripts/export-diagram-artifact.js');
            expect(runbook).toContain('--input');
            expect(runbook).toContain('--target');
            expect(runbook).toContain('--output');
            expect(runbook).toContain('--preview-svg-output');
            expect(runbook).toContain('editable-html-svg');
            expect(runbook).toContain('drawio');
            expect(runbook).toContain('drawnix');
            expect(runbook).toContain('svg');
            expect(runbook).toContain('DiagramSpec');
            expect(runbook).toContain('SemanticFigureModel');
            expect(runbook).toContain('no Obsidian runtime');
            expect(runbook).toContain('UTF-8');
            expect(runbook).toContain('BOM');
        }
    });

    test('exports editable HTML/SVG, Draw.io XML, and Drawnix JSON from one DiagramSpec file', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-diagram-artifact-cli-'));
        const specPath = path.join(tempRoot, 'spec.json');
        const htmlPath = path.join(tempRoot, 'figure.html');
        const drawioPath = path.join(tempRoot, 'figure.drawio');
        const drawioSvgPath = path.join(tempRoot, 'figure.drawio.svg');
        const drawnixPath = path.join(tempRoot, 'figure.drawnix');
        const svgPath = path.join(tempRoot, 'figure.svg');
        fs.writeFileSync(specPath, JSON.stringify(createSpec(), null, 2), 'utf8');

        try {
            for (const [target, outputPath] of [
                ['editable-html-svg', htmlPath],
                ['drawio', drawioPath],
                ['drawnix', drawnixPath],
                ['svg', svgPath]
            ] as const) {
                const args = [
                    scriptPath,
                    '--input', specPath,
                    '--target', target,
                    '--output', outputPath
                ];
                if (target === 'drawio') {
                    args.push('--preview-svg-output', drawioSvgPath);
                }
                const stdout = execFileSync(process.execPath, args, {
                    cwd: repoRoot,
                    encoding: 'utf8'
                });

                const result = JSON.parse(stdout);
                expect(result).toEqual(expect.objectContaining({
                    target,
                    outputPath,
                    nodeCount: 3,
                    edgeCount: 2
                }));
            }

            const html = fs.readFileSync(htmlPath, 'utf8');
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('data-drawio-type="node"');
            expect(html).toContain('data-drawio-id="client-app"');
            expect(html).toContain('data-drawio-id="client-app-2"');
            expect(html).toContain('data-drawio-source="client-app"');
            expect(html).toContain('data-drawio-target="client-app-2"');

            const drawio = fs.readFileSync(drawioPath, 'utf8');
            expect(drawio).toContain('<mxfile');
            expect(drawio).toContain('id="client-app-2"');
            expect(drawio).toContain('value="Client App Alias"');
            expect(drawio).toContain('dashed=1;');
            expect(fs.readFileSync(drawioSvgPath, 'utf8')).toContain('<svg');
            expect(fs.readFileSync(drawioSvgPath, 'utf8')).toContain('data-drawio-type="node"');

            const drawnix = JSON.parse(fs.readFileSync(drawnixPath, 'utf8'));
            expect(drawnix).toMatchObject({
                type: 'drawnix',
                version: 1,
                source: 'web',
                viewport: { zoom: 1, offsetX: 0, offsetY: 0 }
            });
            expect(drawnix.elements).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: 'client-app', type: 'geometry' }),
                expect.objectContaining({ id: 'client-app-2', type: 'geometry' }),
                expect.objectContaining({
                    id: 'edge-2-client-app-2-to-worker',
                    type: 'arrow-line',
                    style: expect.objectContaining({ dashed: true })
                })
            ]));

            const svg = fs.readFileSync(svgPath, 'utf8');
            expect(svg).toContain('<svg');
            expect(svg).toContain('data-drawio-type="node"');
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    }, 30000);

    test('accepts UTF-8 BOM DiagramSpec files produced by Windows PowerShell', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-diagram-artifact-cli-bom-'));
        const specPath = path.join(tempRoot, 'spec.json');
        const outputPath = path.join(tempRoot, 'figure.drawio');
        fs.writeFileSync(specPath, `\uFEFF${JSON.stringify(createSpec(), null, 2)}`, 'utf8');

        try {
            const stdout = execFileSync(
                process.execPath,
                [
                    scriptPath,
                    '--input', specPath,
                    '--target', 'drawio',
                    '--output', outputPath
                ],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );

            const result = JSON.parse(stdout);
            expect(result).toEqual(expect.objectContaining({
                target: 'drawio',
                outputPath,
                nodeCount: 3,
                edgeCount: 2
            }));
            expect(fs.readFileSync(outputPath, 'utf8')).toContain('<mxfile');
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    }, 30000);

    test('fails before writing output for unsupported targets', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-diagram-artifact-cli-bad-target-'));
        const specPath = path.join(tempRoot, 'spec.json');
        const outputPath = path.join(tempRoot, 'figure.bad');
        fs.writeFileSync(specPath, JSON.stringify(createSpec()), 'utf8');

        try {
            const result = spawnSync(
                process.execPath,
                [
                    scriptPath,
                    '--input', specPath,
                    '--target', 'png',
                    '--output', outputPath
                ],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );

            expect(result.status).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('Unsupported export target "png"');
            expect(result.stderr).toContain('editable-html-svg, drawio, drawnix, svg');
            expect(fs.existsSync(outputPath)).toBe(false);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });
});
