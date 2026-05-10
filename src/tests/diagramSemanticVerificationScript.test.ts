import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function parseEsbuildFactsIndependently(source: string): { entryPoints: string[]; outfile: string } {
    const entryPointsMatch = source.match(/entryPoints\s*:\s*\[([\s\S]*?)\]/m);
    const entryPoints = entryPointsMatch
        ? Array.from(entryPointsMatch[1].matchAll(/["']([^"']+)["']/g), (match) => match[1])
        : [];
    const outfileMatch = source.match(/outfile\s*:\s*["']([^"']+)["']/m);
    return {
        entryPoints,
        outfile: outfileMatch ? outfileMatch[1] : ''
    };
}

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
        expect(runbook).toContain('derived from current `entryPoints` / `outfile` / `outdir` values in `esbuild.config.mjs`');
        expect(runbookZh).toContain('`esbuild.config.mjs`');
        expect(runbookZh).toContain('`entryPoints` / `outfile` / `outdir`');
        expect(releaseWorkflow).toContain('verify:diagram-semantics');
        expect(releaseWorkflowZh).toContain('verify:diagram-semantics');
        expect(releaseWorkflow).toContain('does not prove true heavy-runtime isolation');
        expect(releaseWorkflowZh).toContain('并不等于真正的重型运行时隔离已经完成');
    });

    const maybeDescribeHelper = fs.existsSync(scriptPath) ? describe : describe.skip;

    maybeDescribeHelper('helper module', () => {
        let resolveRequestedSurfaces: (surfaces?: string[]) => Array<{ id: string; label: string }>;
        let buildEnvironmentCheckCommands: (vaultName?: string) => string[];
        let resolvePackagingBoundaryFacts: (args?: { esbuildConfigPath?: string }) => {
            sourcePath: string;
            entryPoints: string[];
            outfile: string;
            outdir: string;
            outputTargetStatus: 'outfile' | 'outdir' | 'unknown' | 'ambiguous';
            resolvedFromConfig: boolean;
        };
        let buildPackagingBoundaryChecklistLines: (packagingFacts?: {
            sourcePath: string;
            entryPoints: string[];
            outfile: string;
            outdir: string;
            outputTargetStatus: 'outfile' | 'outdir' | 'unknown' | 'ambiguous';
            resolvedFromConfig: boolean;
        }) => string[];
        let resolveReleasePackagingContractFacts: (args?: { releaseHelperPath?: string }) => {
            sourcePath: string;
            requiredAssets: string[];
            releaseTagPattern: string;
            supportsReleaseModeSwitch: boolean;
            resolvedFromReleaseHelper: boolean;
        };
        let buildReleasePackagingContractChecklistLines: (releaseFacts?: {
            sourcePath: string;
            requiredAssets: string[];
            releaseTagPattern: string;
            supportsReleaseModeSwitch: boolean;
            resolvedFromReleaseHelper: boolean;
        }, workflowFacts?: {
            sourcePath: string;
            hasWorkflowDispatch: boolean;
            hasTagPushTrigger: boolean;
            rejectsVPrefixedTagTrigger: boolean;
            validatesNumericTagPattern: boolean;
            resolvedFromWorkflowFile: boolean;
        }) => string[];
        let resolveReleaseWorkflowTriggerFacts: (args?: { releaseWorkflowPath?: string }) => {
            sourcePath: string;
            hasWorkflowDispatch: boolean;
            hasTagPushTrigger: boolean;
            rejectsVPrefixedTagTrigger: boolean;
            validatesNumericTagPattern: boolean;
            resolvedFromWorkflowFile: boolean;
        };
        let resolveContractPromotionBoundaryFacts: (args?: {
            registryPath?: string;
            trackedOperationIds?: string[];
        }) => {
            sourcePath: string;
            operationFacts: Array<{
                operationId: string;
                automationLevel: string;
                requiredContext: string;
                sideEffectClass: string;
                resolved: boolean;
            }>;
            resolvedFromRegistry: boolean;
        };
        let buildContractPromotionBoundaryChecklistLines: (contractFacts?: {
            sourcePath: string;
            operationFacts: Array<{
                operationId: string;
                automationLevel: string;
                requiredContext: string;
                sideEffectClass: string;
                resolved: boolean;
            }>;
            resolvedFromRegistry: boolean;
        }) => string[];
        let buildSemanticVerificationTemplate: (args: {
            vaultName?: string;
            commit: string;
            version: string;
            surfaces: Array<{ id: string; label: string }>;
            packagingFacts?: {
                sourcePath: string;
                entryPoints: string[];
                outfile: string;
                outdir: string;
                outputTargetStatus: 'outfile' | 'outdir' | 'unknown' | 'ambiguous';
                resolvedFromConfig: boolean;
            };
            releasePackagingFacts?: {
                sourcePath: string;
                requiredAssets: string[];
                releaseTagPattern: string;
                supportsReleaseModeSwitch: boolean;
                resolvedFromReleaseHelper: boolean;
            };
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
                resolvePackagingBoundaryFacts,
                buildPackagingBoundaryChecklistLines,
                resolveReleasePackagingContractFacts,
                buildReleasePackagingContractChecklistLines,
                resolveReleaseWorkflowTriggerFacts,
                resolveContractPromotionBoundaryFacts,
                buildContractPromotionBoundaryChecklistLines,
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

        test('resolves packaging facts from esbuild config and falls back safely when parsing fails', () => {
            const factsFromRepo = resolvePackagingBoundaryFacts({
                esbuildConfigPath: path.join(repoRoot, 'esbuild.config.mjs')
            });
            expect(factsFromRepo.entryPoints).toContain('src/main.ts');
            expect(factsFromRepo.outfile).toBe('main.js');
            expect(factsFromRepo.outdir).toBe('');
            expect(factsFromRepo.outputTargetStatus).toBe('outfile');
            expect(factsFromRepo.resolvedFromConfig).toBe(true);

            const fallbackFacts = resolvePackagingBoundaryFacts({
                esbuildConfigPath: path.join(repoRoot, 'scripts', 'missing-esbuild.config.mjs')
            });
            expect(fallbackFacts.entryPoints).toEqual(['<unknown-entry>']);
            expect(fallbackFacts.outfile).toBe('<unknown-outfile>');
            expect(fallbackFacts.outdir).toBe('');
            expect(fallbackFacts.outputTargetStatus).toBe('unknown');
            expect(fallbackFacts.resolvedFromConfig).toBe(false);
        });

        test('supports object entryPoints plus outdir packaging configs', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-esbuild-shape-'));
            const configPath = path.join(tempRoot, 'esbuild.config.mjs');
            fs.writeFileSync(
                configPath,
                `import esbuild from "esbuild";
const context = await esbuild.context({
    entryPoints: {
        main: "src/main.ts",
        host: "src/rendering/host/bootstrap.ts"
    },
    outdir: "dist"
});
`,
                'utf8'
            );

            try {
                const facts = resolvePackagingBoundaryFacts({ esbuildConfigPath: configPath });
                expect(facts.entryPoints).toEqual(['src/main.ts', 'src/rendering/host/bootstrap.ts']);
                expect(facts.outfile).toBe('');
                expect(facts.outdir).toBe('dist');
                expect(facts.outputTargetStatus).toBe('outdir');
                expect(facts.resolvedFromConfig).toBe(true);

                const lines = buildPackagingBoundaryChecklistLines(facts);
                expect(lines[0]).toContain('entrypoint count');
                expect(lines[0]).toContain('src/main.ts');
                expect(lines[0]).toContain('src/rendering/host/bootstrap.ts');
                expect(lines[0]).toContain('dist/...');
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('supports backtick-quoted array entryPoints and outfile values', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-esbuild-backtick-array-'));
            const configPath = path.join(tempRoot, 'esbuild.config.mjs');
            fs.writeFileSync(
                configPath,
                `import esbuild from "esbuild";
const context = await esbuild.context({
    entryPoints: [\`src/main.ts\`, \`src/rendering/host/bootstrap.ts\`],
    outfile: \`main.js\`
});
`,
                'utf8'
            );

            try {
                const facts = resolvePackagingBoundaryFacts({ esbuildConfigPath: configPath });
                expect(facts.entryPoints).toEqual(['src/main.ts', 'src/rendering/host/bootstrap.ts']);
                expect(facts.outfile).toBe('main.js');
                expect(facts.outdir).toBe('');
                expect(facts.outputTargetStatus).toBe('outfile');
                expect(facts.resolvedFromConfig).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('supports backtick-quoted object entryPoints and outdir values', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-esbuild-backtick-object-'));
            const configPath = path.join(tempRoot, 'esbuild.config.mjs');
            fs.writeFileSync(
                configPath,
                `import esbuild from "esbuild";
const context = await esbuild.context({
    entryPoints: {
        main: \`src/main.ts\`
    },
    outdir: \`dist\`
});
`,
                'utf8'
            );

            try {
                const facts = resolvePackagingBoundaryFacts({ esbuildConfigPath: configPath });
                expect(facts.entryPoints).toEqual(['src/main.ts']);
                expect(facts.outfile).toBe('');
                expect(facts.outdir).toBe('dist');
                expect(facts.outputTargetStatus).toBe('outdir');
                expect(facts.resolvedFromConfig).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('prefers esbuild.context options instead of unrelated same-name keys in file', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-esbuild-context-scope-'));
            const configPath = path.join(tempRoot, 'esbuild.config.mjs');
            fs.writeFileSync(
                configPath,
                `const unrelated = {
    entryPoints: ["src/decoy.ts"],
    outfile: "decoy.js",
    outdir: "decoy-dist"
};
import esbuild from "esbuild";
const context = await esbuild.context({
    entryPoints: ["src/main.ts"],
    outfile: "main.js"
});
`,
                'utf8'
            );

            try {
                const facts = resolvePackagingBoundaryFacts({ esbuildConfigPath: configPath });
                expect(facts.entryPoints).toEqual(['src/main.ts']);
                expect(facts.outfile).toBe('main.js');
                expect(facts.outdir).toBe('');
                expect(facts.outputTargetStatus).toBe('outfile');
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('flags unresolved output targets when entry points parse but outfile/outdir are missing', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-esbuild-missing-output-'));
            const configPath = path.join(tempRoot, 'esbuild.config.mjs');
            fs.writeFileSync(
                configPath,
                `import esbuild from "esbuild";
const context = await esbuild.context({
    entryPoints: ["src/main.ts"]
});
`,
                'utf8'
            );

            try {
                const facts = resolvePackagingBoundaryFacts({ esbuildConfigPath: configPath });
                expect(facts.entryPoints).toEqual(['src/main.ts']);
                expect(facts.outfile).toBe('');
                expect(facts.outdir).toBe('');
                expect(facts.outputTargetStatus).toBe('unknown');
                expect(facts.resolvedFromConfig).toBe(true);

                const lines = buildPackagingBoundaryChecklistLines(facts);
                expect(lines[0]).toContain('<unknown-output>');
                expect(lines.some((line) => line.includes('output target was not resolved automatically'))).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('flags ambiguous output targets when both outfile and outdir are present', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-esbuild-ambiguous-output-'));
            const configPath = path.join(tempRoot, 'esbuild.config.mjs');
            fs.writeFileSync(
                configPath,
                `import esbuild from "esbuild";
const context = await esbuild.context({
    entryPoints: ["src/main.ts"],
    outfile: "main.js",
    outdir: "dist"
});
`,
                'utf8'
            );

            try {
                const facts = resolvePackagingBoundaryFacts({ esbuildConfigPath: configPath });
                expect(facts.entryPoints).toEqual(['src/main.ts']);
                expect(facts.outfile).toBe('main.js');
                expect(facts.outdir).toBe('dist');
                expect(facts.outputTargetStatus).toBe('ambiguous');
                expect(facts.resolvedFromConfig).toBe(true);

                const lines = buildPackagingBoundaryChecklistLines(facts);
                expect(lines[0]).toContain('outfile=main.js');
                expect(lines[0]).toContain('outdir=dist/...');
                expect(lines.some((line) => line.includes('both `outfile` and `outdir`'))).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('keeps packaging facts and checklist wording aligned with the current esbuild config shape', () => {
            const esbuildConfigPath = path.join(repoRoot, 'esbuild.config.mjs');
            const esbuildConfigSource = fs.readFileSync(esbuildConfigPath, 'utf8');
            const expectedFacts = parseEsbuildFactsIndependently(esbuildConfigSource);
            expect(expectedFacts.entryPoints.length).toBeGreaterThan(0);
            expect(expectedFacts.outfile).not.toBe('');

            const resolvedFacts = resolvePackagingBoundaryFacts({ esbuildConfigPath });
            expect(resolvedFacts.entryPoints).toEqual(expectedFacts.entryPoints);
            expect(resolvedFacts.outfile).toBe(expectedFacts.outfile);

            const lines = buildPackagingBoundaryChecklistLines(resolvedFacts);
            for (const entryPoint of expectedFacts.entryPoints) {
                expect(lines[0]).toContain(entryPoint);
            }
            expect(lines[0]).toContain(expectedFacts.outfile);

            const template = buildSemanticVerificationTemplate({
                vaultName: 'Research Vault',
                commit: 'def5678',
                version: '1.8.5',
                surfaces: resolveRequestedSurfaces(['mermaid']),
                packagingFacts: resolvedFacts
            });
            for (const entryPoint of expectedFacts.entryPoints) {
                expect(template).toContain(entryPoint);
            }
            expect(template).toContain(expectedFacts.outfile);
        });

        test('builds packaging-boundary checklist lines from resolved config facts', () => {
            const lines = buildPackagingBoundaryChecklistLines({
                sourcePath: path.join(repoRoot, 'esbuild.config.mjs'),
                entryPoints: ['src/main.ts'],
                outfile: 'main.js',
                outdir: '',
                outputTargetStatus: 'outfile',
                resolvedFromConfig: true
            });

            expect(lines[0]).toContain('single-entry');
            expect(lines[0]).toContain('`src/main.ts -> main.js`');
            expect(lines.some((line) => line.includes('`npm run audit:render-host` only proves the current self-contained `main.js` + inline `srcdoc` host contract'))).toBe(true);
            expect(lines.some((line) => line.includes('true heavy-runtime isolation is still pending'))).toBe(true);
        });

        test('keeps release packaging contract checklist aligned with release helper asset requirements', () => {
            const releaseHelperPath = path.join(repoRoot, 'scripts', 'release', 'publish-github-release.js');
            const releaseWorkflowPath = path.join(repoRoot, '.github', 'workflows', 'release.yml');
            const { REQUIRED_RELEASE_ASSETS } = require(releaseHelperPath) as { REQUIRED_RELEASE_ASSETS: string[] };

            const facts = resolveReleasePackagingContractFacts({ releaseHelperPath });
            const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath });
            expect(facts.requiredAssets).toEqual(REQUIRED_RELEASE_ASSETS);
            expect(facts.releaseTagPattern).toBe('^\\d+\\.\\d+\\.\\d+$');
            expect(facts.supportsReleaseModeSwitch).toBe(true);
            expect(facts.resolvedFromReleaseHelper).toBe(true);
            expect(workflowFacts.hasWorkflowDispatch).toBe(true);
            expect(workflowFacts.hasTagPushTrigger).toBe(true);
            expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(true);
            expect(workflowFacts.validatesNumericTagPattern).toBe(true);
            expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);

            const lines = buildReleasePackagingContractChecklistLines(facts, workflowFacts);
            for (const assetName of REQUIRED_RELEASE_ASSETS) {
                expect(lines[0]).toContain(`\`${assetName}\``);
            }
            expect(lines[1]).toContain('/^\\d+\\.\\d+\\.\\d+$/');
            expect(lines[2]).toContain('create path composes bilingual notes');
            expect(lines[2]).toContain('`--clobber`');
            expect(lines[3]).toContain('tag push (`*.*.*`) + `workflow_dispatch`');
            expect(lines[4]).toContain('numeric-tag regex guard present');
            expect(lines[5]).toContain('docs/releases/<tag>.md');
            expect(lines[5]).toContain('docs/releases/<tag>.zh-CN.md');
        });

        test('falls back to default release packaging/workflow contract wording when sources cannot be loaded', () => {
            const facts = resolveReleasePackagingContractFacts({
                releaseHelperPath: path.join(repoRoot, 'scripts', 'release', 'missing-release-helper.js')
            });
            const workflowFacts = resolveReleaseWorkflowTriggerFacts({
                releaseWorkflowPath: path.join(repoRoot, '.github', 'workflows', 'missing-release.yml')
            });
            expect(facts.requiredAssets).toEqual(['main.js', 'manifest.json', 'styles.css', 'README.md']);
            expect(facts.releaseTagPattern).toBe('^\\d+\\.\\d+\\.\\d+$');
            expect(facts.supportsReleaseModeSwitch).toBe(false);
            expect(facts.resolvedFromReleaseHelper).toBe(false);
            expect(workflowFacts.hasWorkflowDispatch).toBe(false);
            expect(workflowFacts.hasTagPushTrigger).toBe(false);
            expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
            expect(workflowFacts.validatesNumericTagPattern).toBe(false);
            expect(workflowFacts.resolvedFromWorkflowFile).toBe(false);

            const lines = buildReleasePackagingContractChecklistLines(facts, workflowFacts);
            expect(lines[0]).toContain('fallback default');
            expect(lines[0]).toContain('missing-release-helper.js');
            expect(lines[2]).toContain('fallback reminder');
            expect(lines[3]).toContain('fallback reminder');
            expect(lines[4]).toContain('tag-guard inspection incomplete');
        });

        test('parses release workflow trigger facts with mixed quote styles in tags list', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-mixed-tags-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `name: Release
on:
  push:
    tags:
      - "*.*.*"
      - 'release-*'
  workflow_dispatch:
jobs:
  publish:
    steps:
      - run: |
          if [[ ! "$TAG_NAME" =~ ^[0-9]+\\.[0-9]+\\.[0-9]+$ ]]; then
            exit 1
          fi
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(true);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(true);
                expect(workflowFacts.validatesNumericTagPattern).toBe(true);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('flags v-prefixed wildcard tag patterns in release workflow trigger facts', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-v-prefix-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  push:
    tags:
      - "v*.*.*"
  workflow_dispatch:
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('ignores tags blocks outside on.push when resolving release tag trigger facts', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-tag-scope-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  push:
    branches:
      - main
  workflow_dispatch:
jobs:
  build:
    strategy:
      matrix:
        tags:
          - "*.*.*"
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('parses inline on.push tags object syntax for release tag trigger facts', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-inline-push-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  push: { tags: ["*.*.*"], branches: [main] }
  workflow_dispatch:
jobs:
  publish:
    steps:
      - run: |
          if [[ ! "$TAG_NAME" =~ ^[0-9]+\\.[0-9]+\\.[0-9]+$ ]]; then
            exit 1
          fi
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(true);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(true);
                expect(workflowFacts.validatesNumericTagPattern).toBe(true);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('flags v-prefixed inline on.push tags object syntax as release trigger guard violation', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-inline-push-v-prefix-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  push: { tags: ['v*.*.*'], branches: [main] }
  workflow_dispatch:
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('parses inline top-level on object syntax for release tag trigger facts', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-inline-on-object-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on: { push: { tags: ["*.*.*"], branches: [main] }, workflow_dispatch: {} }
jobs:
  publish:
    steps:
      - run: |
          if [[ ! "$TAG_NAME" =~ ^[0-9]+\\.[0-9]+\\.[0-9]+$ ]]; then
            exit 1
          fi
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(true);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(true);
                expect(workflowFacts.validatesNumericTagPattern).toBe(true);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('parses multiline flow-style top-level on object syntax for release trigger facts', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-multiline-flow-on-object-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on: {
  push: { tags: ["*.*.*"] },
  workflow_dispatch: {}
}
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(true);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(true);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('parses multiline flow-style top-level on object syntax when opening line has trailing comment', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-multiline-flow-on-object-comment-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `'on': { # keep trigger map readable
  "push": { 'tags': ["*.*.*"] },
  workflow_dispatch: {}
}
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(true);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(true);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('ignores nested non-event keys in multiline flow-style top-level on object syntax', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-multiline-flow-on-object-nested-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on: {
  workflow_call: { inputs: { workflow_dispatch: {}, push: { tags: ["*.*.*"] } } }
}
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(false);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('flags v-prefixed inline top-level on object syntax as release trigger guard violation', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-inline-on-object-v-prefix-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on: { push: { tags: ['v*.*.*'], branches: [main] }, workflow_dispatch: {} }
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('parses on-sequence workflow_dispatch event syntax for release trigger facts', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-on-sequence-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  - push
  - workflow_dispatch
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('parses inline on event array syntax for workflow_dispatch detection', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-inline-on-array-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on: [push, "workflow_dispatch"]
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('parses inline on event array object items for release trigger facts', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-inline-on-array-objects-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on: [{ push: { tags: ["*.*.*"] } }, { workflow_dispatch: {} }]
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(true);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(true);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('ignores nested non-event keys inside inline on event array object items', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-inline-on-array-objects-nested-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on: [{ workflow_call: { inputs: { workflow_dispatch: {}, push: { tags: ["*.*.*"] } } } }]
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(false);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('parses on-sequence push mapping tags plus workflow_dispatch for release trigger facts', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-on-sequence-push-mapping-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  - push:
      tags:
        - "*.*.*"
  - workflow_dispatch
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(true);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(true);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('flags v-prefixed on-sequence push mapping tags as release trigger guard violation', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-on-sequence-push-mapping-v-prefix-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  - push:
      tags:
        - "v*.*.*"
  - workflow_dispatch
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('parses quoted on/push/tags/workflow_dispatch keys for release trigger facts', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-quoted-keys-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  'push':
    "tags":
      - "*.*.*"
  'workflow_dispatch':
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(true);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(true);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('flags v-prefixed wildcard with quoted on/push/tags keys as release trigger guard violation', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-quoted-keys-v-prefix-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  "push":
    'tags':
      - 'v*.*.*'
  "workflow_dispatch":
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('parses quoted top-level inline on object keys for release trigger facts', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-quoted-inline-on-object-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `'on': { 'push': { "tags": ["*.*.*"], branches: [main] }, "workflow_dispatch": {} }
jobs:
  publish:
    steps:
      - run: |
          if [[ ! "$TAG_NAME" =~ ^[0-9]+\\.[0-9]+\\.[0-9]+$ ]]; then
            exit 1
          fi
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(true);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(true);
                expect(workflowFacts.validatesNumericTagPattern).toBe(true);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('flags v-prefixed wildcard in quoted top-level inline on object keys as release trigger guard violation', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-quoted-inline-on-object-v-prefix-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `"on": { "push": { 'tags': ["v*.*.*"], branches: [main] }, 'workflow_dispatch': {} }
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('parses on-sequence workflow_dispatch mapping syntax for release trigger facts', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-on-sequence-dispatch-mapping-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  - push:
      tags:
        - "*.*.*"
  - workflow_dispatch: {}
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(true);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(true);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('parses quoted on-sequence workflow_dispatch mapping syntax for release trigger facts', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-on-sequence-dispatch-mapping-quoted-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  - push:
      tags:
        - "*.*.*"
  - 'workflow_dispatch': {}
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(true);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(true);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('parses on-sequence inline object event mapping syntax for release trigger facts', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-on-sequence-inline-object-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  - { push: { tags: ["*.*.*"] }, workflow_dispatch: {} }
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(true);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(true);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('ignores nested non-event keys in on-sequence inline object mappings', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-on-sequence-inline-object-nested-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  - { workflow_call: { inputs: { workflow_dispatch: {}, push: { tags: ["*.*.*"] } } } }
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(false);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('ignores nested workflow_dispatch keys under non-event on mappings', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-nested-dispatch-key-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  workflow_call:
    inputs:
      workflow_dispatch:
        description: not an event trigger
        required: false
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(false);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('ignores nested workflow_dispatch keys inside inline on object non-event mappings', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-inline-nested-dispatch-key-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on: { workflow_call: { inputs: { workflow_dispatch: { description: not-an-event } } } }
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(false);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('ignores nested push tags inside inline on object non-event mappings', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-inline-nested-push-tags-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on: { workflow_call: { inputs: { push: { tags: ["*.*.*"] } } } }
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(false);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('ignores nested tags blocks inside multiline push mappings when top-level push.tags is absent', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-block-push-nested-tags-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  push:
    branches:
      - main
    filters:
      tags:
        - "*.*.*"
  workflow_dispatch:
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('ignores nested list items inside multiline push tags block when direct push.tags list is absent', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-push-tags-nested-list-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on:
  push:
    tags:
      include:
        - "*.*.*"
  workflow_dispatch:
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('ignores nested tags keys inside inline push mapping when top-level push.tags is absent', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-workflow-inline-push-nested-tags-'));
            const workflowPath = path.join(tempRoot, 'release.yml');
            fs.writeFileSync(
                workflowPath,
                `on: { push: { branches: [main], filters: { tags: ["*.*.*"] } }, workflow_dispatch: {} }
jobs:
  publish:
    steps:
      - run: echo ready
`,
                'utf8'
            );

            try {
                const workflowFacts = resolveReleaseWorkflowTriggerFacts({ releaseWorkflowPath: workflowPath });
                expect(workflowFacts.hasWorkflowDispatch).toBe(true);
                expect(workflowFacts.hasTagPushTrigger).toBe(false);
                expect(workflowFacts.rejectsVPrefixedTagTrigger).toBe(false);
                expect(workflowFacts.validatesNumericTagPattern).toBe(false);
                expect(workflowFacts.resolvedFromWorkflowFile).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('resolves contract-promotion boundary facts for workflow/settings/export operation metadata', () => {
            const registryPath = path.join(repoRoot, 'src', 'operations', 'registry.ts');
            const facts = resolveContractPromotionBoundaryFacts({ registryPath });
            expect(facts.resolvedFromRegistry).toBe(true);

            const findOperation = (operationId: string) =>
                facts.operationFacts.find((candidate) => candidate.operationId === operationId);

            expect(findOperation('workflow.extract-and-generate')).toEqual(expect.objectContaining({
                operationId: 'workflow.extract-and-generate',
                automationLevel: 'requires-active-file',
                requiredContext: 'active-file',
                sideEffectClass: 'batch-write',
                resolved: true
            }));
            expect(findOperation('content.extract-original-text')).toEqual(expect.objectContaining({
                operationId: 'content.extract-original-text',
                automationLevel: 'requires-active-file',
                requiredContext: 'active-file',
                sideEffectClass: 'write-file',
                resolved: true
            }));
            expect(findOperation('editor.create-link-and-generate')).toEqual(expect.objectContaining({
                operationId: 'editor.create-link-and-generate',
                automationLevel: 'requires-selection',
                requiredContext: 'editor-selection',
                sideEffectClass: 'write-file',
                resolved: true
            }));
            expect(findOperation('file.process-add-links')).toEqual(expect.objectContaining({
                operationId: 'file.process-add-links',
                automationLevel: 'requires-active-file',
                requiredContext: 'active-file',
                sideEffectClass: 'write-file',
                resolved: true
            }));
            expect(findOperation('file.process-folder-add-links')).toEqual(expect.objectContaining({
                operationId: 'file.process-folder-add-links',
                automationLevel: 'interactive-ui',
                requiredContext: 'folder-selection',
                sideEffectClass: 'batch-write',
                resolved: true
            }));
            expect(findOperation('concept.extract-file')).toEqual(expect.objectContaining({
                operationId: 'concept.extract-file',
                automationLevel: 'requires-active-file',
                requiredContext: 'active-file',
                sideEffectClass: 'write-file',
                resolved: true
            }));
            expect(findOperation('concept.extract-folder')).toEqual(expect.objectContaining({
                operationId: 'concept.extract-folder',
                automationLevel: 'interactive-ui',
                requiredContext: 'folder-selection',
                sideEffectClass: 'batch-write',
                resolved: true
            }));
            expect(findOperation('provider.profile.export')).toEqual(expect.objectContaining({
                operationId: 'provider.profile.export',
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'write-file',
                resolved: true
            }));
            expect(findOperation('provider.profile.import')).toEqual(expect.objectContaining({
                operationId: 'provider.profile.import',
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'write-file',
                resolved: true
            }));
            expect(findOperation('cli.capability-manifest.export')).toEqual(expect.objectContaining({
                operationId: 'cli.capability-manifest.export',
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'write-file',
                resolved: true
            }));
            expect(findOperation('cli.invocation-contract.export')).toEqual(expect.objectContaining({
                operationId: 'cli.invocation-contract.export',
                automationLevel: 'safe',
                requiredContext: 'none',
                sideEffectClass: 'write-file',
                resolved: true
            }));

            const lines = buildContractPromotionBoundaryChecklistLines(facts);
            expect(lines[0]).toContain('contract-promotion boundary truth');
            expect(lines.join('\n')).toContain('workflow.extract-and-generate');
            expect(lines.join('\n')).toContain('automationLevel=requires-active-file');
            expect(lines.join('\n')).toContain('provider.profile.export');
            expect(lines.join('\n')).toContain('cli.invocation-contract.export');
        });

        test('supports mixed-quote operation metadata literals in registry contract parsing', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-registry-mixed-quotes-'));
            const registryPath = path.join(tempRoot, 'registry.ts');
            fs.writeFileSync(
                registryPath,
                `export const OPERATION_DEFINITIONS = [
    {
        id: "workflow.extract-and-generate",
        automationLevel: \`requires-active-file\`,
        requiredContext: 'active-file',
        sideEffectClass: "batch-write"
    },
    {
        id: \`provider.profile.export\`,
        automationLevel: "safe",
        requiredContext: \`none\`,
        sideEffectClass: 'write-file'
    }
];
`,
                'utf8'
            );

            try {
                const facts = resolveContractPromotionBoundaryFacts({
                    registryPath,
                    trackedOperationIds: ['workflow.extract-and-generate', 'provider.profile.export']
                });
                expect(facts.resolvedFromRegistry).toBe(true);
                expect(facts.operationFacts).toEqual([
                    {
                        operationId: 'workflow.extract-and-generate',
                        automationLevel: 'requires-active-file',
                        requiredContext: 'active-file',
                        sideEffectClass: 'batch-write',
                        resolved: true
                    },
                    {
                        operationId: 'provider.profile.export',
                        automationLevel: 'safe',
                        requiredContext: 'none',
                        sideEffectClass: 'write-file',
                        resolved: true
                    }
                ]);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('expands wildcard-tracked operation selectors against registry operation IDs', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-registry-wildcard-selectors-'));
            const registryPath = path.join(tempRoot, 'registry.ts');
            fs.writeFileSync(
                registryPath,
                `export const OPERATION_DEFINITIONS = [
    {
        id: 'file.process-add-links',
        automationLevel: 'requires-active-file',
        requiredContext: 'active-file',
        sideEffectClass: 'write-file'
    },
    {
        id: 'file.process-folder-add-links',
        automationLevel: 'interactive-ui',
        requiredContext: 'folder-selection',
        sideEffectClass: 'batch-write'
    },
    {
        id: 'file.process-future-mode',
        automationLevel: 'safe',
        requiredContext: 'none',
        sideEffectClass: 'read-only'
    },
    {
        id: 'concept.extract-file',
        automationLevel: 'requires-active-file',
        requiredContext: 'active-file',
        sideEffectClass: 'write-file'
    },
    {
        id: 'concept.extract-folder',
        automationLevel: 'interactive-ui',
        requiredContext: 'folder-selection',
        sideEffectClass: 'batch-write'
    },
    {
        id: 'translate.file',
        automationLevel: 'requires-active-file',
        requiredContext: 'active-file',
        sideEffectClass: 'write-file'
    }
];
`,
                'utf8'
            );

            try {
                const facts = resolveContractPromotionBoundaryFacts({
                    registryPath,
                    trackedOperationIds: ['file.process-*', 'concept.extract-*']
                });
                expect(facts.resolvedFromRegistry).toBe(true);
                expect(facts.operationFacts.map((operationFact) => operationFact.operationId)).toEqual([
                    'file.process-add-links',
                    'file.process-folder-add-links',
                    'file.process-future-mode',
                    'concept.extract-file',
                    'concept.extract-folder'
                ]);
                expect(facts.operationFacts.every((operationFact) => operationFact.resolved)).toBe(true);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('falls back to unresolved contract-promotion boundary facts when registry is missing', () => {
            const facts = resolveContractPromotionBoundaryFacts({
                registryPath: path.join(repoRoot, 'src', 'operations', 'missing-registry.ts')
            });
            expect(facts.resolvedFromRegistry).toBe(false);
            expect(facts.operationFacts.every((operationFact) => !operationFact.resolved)).toBe(true);

            const lines = buildContractPromotionBoundaryChecklistLines(facts);
            expect(lines[0]).toContain('fallback reminder');
            expect(lines.join('\n')).toContain('Resolve operation contract metadata');
            expect(lines.join('\n')).toContain('workflow.extract-and-generate');
        });

        test('uses default fallback IDs for wildcard selectors when registry file is missing', () => {
            const facts = resolveContractPromotionBoundaryFacts({
                registryPath: path.join(repoRoot, 'src', 'operations', 'missing-registry.ts'),
                trackedOperationIds: ['file.process-*', 'concept.extract-*']
            });
            expect(facts.resolvedFromRegistry).toBe(false);
            expect(facts.operationFacts.map((operationFact) => operationFact.operationId)).toEqual([
                'file.process-add-links',
                'file.process-folder-add-links',
                'concept.extract-file',
                'concept.extract-folder'
            ]);
            expect(facts.operationFacts.every((operationFact) => !operationFact.resolved)).toBe(true);
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
            expect(template).toContain('`src/main.ts -> main.js`');
            expect(template).toContain('`npm run audit:render-host` only proves the current self-contained `main.js` + inline `srcdoc` host contract');
            expect(template).toContain('true heavy-runtime isolation is still pending');
            expect(template).toContain('## Packaging Contract');
            expect(template).toContain('`main.js`');
            expect(template).toContain('`manifest.json`');
            expect(template).toContain('`styles.css`');
            expect(template).toContain('`README.md`');
            expect(template).toContain('/^\\d+\\.\\d+\\.\\d+$/');
            expect(template).toContain('create path composes bilingual notes');
            expect(template).toContain('`--clobber`');
            expect(template).toContain('tag push (`*.*.*`) + `workflow_dispatch`');
            expect(template).toContain('numeric-tag regex guard present');
            expect(template).toContain('docs/releases/<tag>.zh-CN.md');
            expect(template).toContain('## Contract Promotion Boundary');
            expect(template).toContain('workflow.extract-and-generate');
            expect(template).toContain('content.extract-original-text');
            expect(template).toContain('editor.create-link-and-generate');
            expect(template).toContain('file.process-add-links');
            expect(template).toContain('file.process-folder-add-links');
            expect(template).toContain('concept.extract-file');
            expect(template).toContain('concept.extract-folder');
            expect(template).toContain('provider.profile.export');
            expect(template).toContain('cli.capability-manifest.export');
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
