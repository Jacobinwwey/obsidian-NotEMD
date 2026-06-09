import { execFileSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const { OPERATION_HELP } = require('../../scripts/lib/maintainer-cli-operation-help.js');
type MaintainerOperationHelp = Record<string, {
    summary: string;
    required: string[];
    optional: string[];
    exampleInput?: string;
    additionalExamples?: string[];
}>;

describe('invoke maintainer CLI operation script', () => {
    function writeFakeObsidianCli(
        tempRoot: string,
        options: {
            stdout?: string;
            stderr?: string;
            exitCode?: number;
        } = {}
    ) {
        const scriptPath = path.join(tempRoot, 'obsidian-cli');
        const argsPath = path.join(tempRoot, 'obsidian-cli-args.json');
        const scriptSource = `#!/usr/bin/env node
const fs = require('fs');
fs.writeFileSync(${JSON.stringify(argsPath)}, JSON.stringify(process.argv.slice(2), null, 2));
${options.stderr ? `process.stderr.write(${JSON.stringify(options.stderr)});\n` : ''}${options.stdout ? `process.stdout.write(${JSON.stringify(options.stdout)});\n` : ''}process.exit(${options.exitCode ?? 0});
`;
        fs.writeFileSync(scriptPath, scriptSource, { encoding: 'utf8', mode: 0o755 });
        return { scriptPath, argsPath };
    }

    test('prints a simplified maintainer help surface with core commands, inputs, and operation summaries', () => {
        const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'invoke-maintainer-cli-operation.js');
        const output = execFileSync(process.execPath, [scriptPath, '--help'], {
            encoding: 'utf8'
        });

        expect(output).toContain('Notemd maintainer CLI helper');
        expect(output).toContain('npm run cli:help');
        expect(output).toContain('npm run cli:invoke -- --vault <vault> --operation <operation-id> [--input-file <path> | --input-json');
        expect(output).toContain('Prefer --input-file for non-trivial payloads.');

        for (const [operationId, details] of Object.entries(OPERATION_HELP as MaintainerOperationHelp)) {
            expect(output).toContain(operationId);
            expect(output).toContain(details.summary);
            expect(output).toContain(`required: ${details.required.join(', ')}`);
            if (details.optional.length > 0) {
                expect(output).toContain(`optional: ${details.optional.join(', ')}`);
            }
            if (details.exampleInput) {
                expect(output).toContain(`example input: ${details.exampleInput}`);
            }
            for (const additionalExample of details.additionalExamples || []) {
                expect(output).toContain(additionalExample);
            }
        }

        expect(output).toContain('content.batch-generate-from-titles');
        expect(output).toContain('"includeSubfoldersMode":"exclude"');
        expect(output).toContain('local-knowledge.inspect');
        expect(output).toContain('"taskScope":"diagramGeneration"');
        expect(output).toContain('"taskScope":"batchGenerateFromTitles"');
        expect(output).toContain('"taskScope":"researchSummarize"');
        expect(output).toContain('"query":"chapter split TOC managed artifacts guarded reruns"');
        expect(output).toContain('"knowledgePaths":["chapter-split-toc.md","chapter-split-toc.zh-CN.md"]');
        expect(output).toContain('"query":"real-note query diversity beyond chapter split showcase"');
        expect(output).toContain('"knowledgePaths":["brainstorms","maintainer"]');
        expect(output).toContain('"query":"MiniSearch ragas RAGPerf execution chain maintainer-only offline evidence"');
        expect(output).toContain('"knowledgePaths":["brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.md"],"topK":2,"slidingWindowSize":1,"maxSnippetChars":640');
        expect(output).toContain('"query":"managed-artifact kpm markdown-toc active-file scoped stable block refs"');
        expect(output).toContain('"knowledgePaths":["brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.md"],"topK":2,"slidingWindowSize":1,"maxSnippetChars":640');
        expect(output).toContain('"sourcePath":"brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md"');
        expect(output).toContain('"query":"missing path coverage"');
        expect(output).toContain('"knowledgePaths":[]');
        expect(output).toContain('"query":"svg-only repo saga scope"');
        expect(output).toContain('"knowledgePaths":["repo-saga"]');
        expect(output).toContain('knowledgePaths');
        expect(output).toContain('npm run cli:invoke -- --vault docs --operation local-knowledge.inspect');
        expect(output).toContain('"sourcePath":"index.zh-CN.md"');
        expect(output).toContain('"knowledgePaths":["maintainer","superpowers"]');
        expect(output).toContain('Paths inside --input-json are vault-relative.');
        expect(output).toContain('research.summarize-topic');
        expect(output).toContain('"topic":"RAG quality audit"');
        expect(output).toContain('diagram.generate');
        expect(output).toContain('"requestedIntent":"erDiagram"');
        expect(output).toContain('Maintainer bridge only; not a public CLI surface.');
    });

    test('invokes obsidian-cli native eval and pretty-prints the parsed result', () => {
        const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'invoke-maintainer-cli-operation.js');
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-cli-invoke-success-'));
        const fakeCli = writeFakeObsidianCli(tempRoot, {
            stdout: 'Booting fake cli\n=> {"ok":true,"nested":{"count":2}}\n',
            exitCode: 0
        });

        try {
            const output = execFileSync(
                process.execPath,
                [
                    scriptPath,
                    '--vault', 'docs',
                    '--operation', 'provider.profile.export-redacted',
                    '--pretty'
                ],
                {
                    encoding: 'utf8',
                    env: {
                        ...process.env,
                        PATH: `${tempRoot}:${process.env.PATH || ''}`
                    }
                }
            );

            const argv = JSON.parse(fs.readFileSync(fakeCli.argsPath, 'utf8'));
            expect(argv[0]).toBe('native');
            expect(argv).toContain('vault=docs');
            expect(argv).toContain('eval');
            const codeArg = argv.find((value: string) => value.startsWith('code='));
            expect(codeArg).toContain('provider.profile.export-redacted');
            expect(output).toBe('{\n  "ok": true,\n  "nested": {\n    "count": 2\n  }\n}\n');
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('supports --input-file and custom plugin id through the real script entrypoint', () => {
        const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'invoke-maintainer-cli-operation.js');
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-cli-invoke-input-file-'));
        const fakeCli = writeFakeObsidianCli(tempRoot, {
            stdout: '=> {"status":"ok"}\n',
            exitCode: 0
        });
        const inputPath = path.join(tempRoot, 'request.json');
        fs.writeFileSync(
            inputPath,
            JSON.stringify({
                taskScope: 'researchSummarize',
                query: 'task-scoped retrieval behavior',
                knowledgePaths: ['maintainer']
            }),
            'utf8'
        );

        try {
            const output = execFileSync(
                process.execPath,
                [
                    scriptPath,
                    '--vault', 'docs',
                    '--plugin-id', 'custom-notemd',
                    '--operation', 'local-knowledge.inspect',
                    '--input-file', inputPath
                ],
                {
                    encoding: 'utf8',
                    env: {
                        ...process.env,
                        PATH: `${tempRoot}:${process.env.PATH || ''}`
                    }
                }
            );

            const argv = JSON.parse(fs.readFileSync(fakeCli.argsPath, 'utf8'));
            const codeArg = argv.find((value: string) => value.startsWith('code='));
            expect(codeArg).toContain('custom-notemd');
            expect(codeArg).toContain('local-knowledge.inspect');
            expect(codeArg).toContain('task-scoped retrieval behavior');
            expect(codeArg).toContain('maintainer');
            expect(output).toBe('{"status":"ok"}\n');
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('surfaces child-process stderr and exit code when obsidian-cli native eval fails', () => {
        const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'invoke-maintainer-cli-operation.js');
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-cli-invoke-fail-'));
        writeFakeObsidianCli(tempRoot, {
            stderr: 'fake obsidian-cli failure\n',
            exitCode: 7
        });

        try {
            const result = spawnSync(
                process.execPath,
                [
                    scriptPath,
                    '--vault', 'docs',
                    '--operation', 'provider.profile.export-redacted'
                ],
                {
                    encoding: 'utf8',
                    env: {
                        ...process.env,
                        PATH: `${tempRoot}:${process.env.PATH || ''}`
                    }
                }
            );

            expect(result.status).toBe(7);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('fake obsidian-cli failure');
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('fails fast when obsidian-cli output does not contain a parseable eval result line', () => {
        const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'invoke-maintainer-cli-operation.js');
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-cli-invoke-unparseable-'));
        writeFakeObsidianCli(tempRoot, {
            stdout: 'missing eval marker\n',
            exitCode: 0
        });

        try {
            const result = spawnSync(
                process.execPath,
                [
                    scriptPath,
                    '--vault', 'docs',
                    '--operation', 'provider.profile.export-redacted'
                ],
                {
                    encoding: 'utf8',
                    env: {
                        ...process.env,
                        PATH: `${tempRoot}:${process.env.PATH || ''}`
                    }
                }
            );

            expect(result.status).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('Could not parse eval output');
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('rejects conflicting --input-json and --input-file arguments before invoking obsidian-cli', () => {
        const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'invoke-maintainer-cli-operation.js');
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-cli-invoke-conflict-'));
        const fakeCli = writeFakeObsidianCli(tempRoot, {
            stdout: '=> {"unexpected":true}\n',
            exitCode: 0
        });
        const inputPath = path.join(tempRoot, 'request.json');
        fs.writeFileSync(inputPath, JSON.stringify({ sourcePath: 'index.zh-CN.md' }), 'utf8');

        try {
            const result = spawnSync(
                process.execPath,
                [
                    scriptPath,
                    '--vault', 'docs',
                    '--operation', 'content.split-note-by-chapters',
                    '--input-json', '{"sourcePath":"index.zh-CN.md"}',
                    '--input-file', inputPath
                ],
                {
                    encoding: 'utf8',
                    env: {
                        ...process.env,
                        PATH: `${tempRoot}:${process.env.PATH || ''}`
                    }
                }
            );

            expect(result.status).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('Use either --input-json or --input-file, not both.');
            expect(fs.existsSync(fakeCli.argsPath)).toBe(false);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });
});
