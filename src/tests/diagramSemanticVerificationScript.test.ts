import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('diagram semantic verification helper', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scriptRelativePath = path.posix.join('scripts', 'diagram-semantic-verification.js');
    const scriptPath = path.join(repoRoot, scriptRelativePath);
    const runbookPath = path.join(repoRoot, 'docs', 'maintainer', 'diagram-semantic-verification.md');
    const runbookZhPath = path.join(repoRoot, 'docs', 'maintainer', 'diagram-semantic-verification.zh-CN.md');
    const releaseWorkflowPath = path.join(repoRoot, 'docs', 'maintainer', 'release-workflow.md');
    const releaseWorkflowZhPath = path.join(repoRoot, 'docs', 'maintainer', 'release-workflow.zh-CN.md');

        test('registers a semantic verification helper script and references it in maintainer docs', () => {
        expect(packageJson.scripts['verify:diagram-semantics']).toBe(`node ${scriptRelativePath}`);
        expect(fs.existsSync(scriptPath)).toBe(true);

        const runbook = fs.readFileSync(runbookPath, 'utf8');
        const runbookZh = fs.readFileSync(runbookZhPath, 'utf8');
        const releaseWorkflow = fs.readFileSync(releaseWorkflowPath, 'utf8');
        const releaseWorkflowZh = fs.readFileSync(releaseWorkflowZhPath, 'utf8');

        expect(runbook).toContain('npm run verify:diagram-semantics');
        expect(runbookZh).toContain('npm run verify:diagram-semantics');
        expect(runbook).toContain('single-entry');
        expect(runbookZh).toContain('单入口');
        expect(releaseWorkflow).toContain('verify:diagram-semantics');
        expect(releaseWorkflowZh).toContain('verify:diagram-semantics');
        expect(releaseWorkflow).toContain('does not prove true heavy-runtime isolation');
        expect(releaseWorkflowZh).toContain('并不等于真正的重型运行时隔离已经完成');
    });

    const maybeDescribeHelper = fs.existsSync(scriptPath) ? describe : describe.skip;

    maybeDescribeHelper('helper module', () => {
        let resolveRequestedSurfaces: (surfaces?: string[]) => Array<{ id: string; label: string }>;
        let buildEnvironmentCheckCommands: (vaultName?: string) => string[];
        let buildSemanticVerificationTemplate: (args: {
            vaultName?: string;
            commit: string;
            version: string;
            surfaces: Array<{ id: string; label: string }>;
        }) => string;
        let writeSemanticVerificationTemplate: (template: string, outputPath?: string) => string | null;
        let parseArgs: (argv?: string[]) => {
            vault: string;
            commit: string;
            version: string;
            output: string;
            surfaces: string[];
            help: boolean;
        };

        beforeAll(() => {
            ({
                parseArgs,
                resolveRequestedSurfaces,
                buildEnvironmentCheckCommands,
                buildSemanticVerificationTemplate,
                writeSemanticVerificationTemplate
            } = require(scriptPath));
        });

        test('defaults to all semantic surfaces in canonical order', () => {
            expect(resolveRequestedSurfaces([])).toEqual([
                { id: 'mermaid', label: 'Mermaid' },
                { id: 'json-canvas', label: 'JSON Canvas' },
                { id: 'vega-lite', label: 'Vega-Lite' }
            ]);
        });

        test('normalizes surface aliases and de-duplicates repeats', () => {
            expect(resolveRequestedSurfaces(['VegaLite', 'mermaid', 'vega-lite', 'jsoncanvas'])).toEqual([
                { id: 'vega-lite', label: 'Vega-Lite' },
                { id: 'mermaid', label: 'Mermaid' },
                { id: 'json-canvas', label: 'JSON Canvas' }
            ]);
        });

        test('accumulates repeated surface flags and positional surface arguments', () => {
            expect(parseArgs([
                '--surface', 'mermaid',
                '--surfaces', 'vega-lite,jsoncanvas',
                'canvas'
            ])).toEqual({
                vault: '',
                commit: '',
                version: '',
                output: '',
                surfaces: ['mermaid', 'vega-lite', 'jsoncanvas', 'canvas'],
                help: false
            });
        });

        test('rejects missing option values instead of silently consuming the next flag', () => {
            expect(() => parseArgs(['--vault'])).toThrow('Missing value for --vault');
            expect(() => parseArgs(['--surface', '--commit', 'abc1234'])).toThrow('Missing value for --surface');
        });

        test('builds environment checks that stay vault-aware without hard-coded machine paths', () => {
            expect(buildEnvironmentCheckCommands('Research Vault')).toEqual([
                'obsidian help',
                'obsidian-cli help',
                'obsidian vaults verbose',
                'obsidian plugin id=notemd vault=\"Research Vault\"',
                'obsidian commands vault=\"Research Vault\" filter=notemd'
            ]);
        });

        test('builds a markdown template with repo gates, packaging-boundary guidance, and per-surface evidence sections', () => {
            const template = buildSemanticVerificationTemplate({
                vaultName: 'Research Vault',
                commit: 'abc1234',
                version: '1.8.5',
                surfaces: resolveRequestedSurfaces(['mermaid', 'vega-lite'])
            });

            expect(template).toContain('# Notemd Diagram Semantic Verification');
            expect(template).toContain('Vault: Research Vault');
            expect(template).toContain('Commit: abc1234');
            expect(template).toContain('Version: 1.8.5');
            expect(template).toContain('npm run build');
            expect(template).toContain('obsidian plugin id=notemd vault=\"Research Vault\"');
            expect(template).toContain('## Packaging Boundary');
            expect(template).toContain('`npm run audit:render-host` only proves the current self-contained `main.js` + inline `srcdoc` host contract');
            expect(template).toContain('true heavy-runtime isolation is still pending');
            expect(template).toContain('## Mermaid');
            expect(template).toContain('## Vega-Lite');
            expect(template).not.toContain('## JSON Canvas');
            expect(template).toContain('Result: PENDING');
            expect(template).toContain('Evidence:');
        });

        test('writes the generated template to an explicit output file', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-semantic-template-'));
            const outputPath = path.join(tempRoot, 'diagram-check.md');
            const template = 'semantic verification template\n';

            try {
                expect(writeSemanticVerificationTemplate(template, outputPath)).toBe(outputPath);
                expect(fs.readFileSync(outputPath, 'utf8')).toBe(template);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });
    });
});
