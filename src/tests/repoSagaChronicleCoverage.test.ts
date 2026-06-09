import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync, spawnSync } from 'child_process';

const ROOT_README_PATTERN = /^README(?:_([^.]+))?\.md$/i;

function readRootReadmes(repoRoot: string): Array<{ fileName: string; locale: string }> {
    return fs
        .readdirSync(repoRoot)
        .filter((entry) => ROOT_README_PATTERN.test(entry))
        .map((fileName) => ({
            fileName,
            locale: fileName.match(ROOT_README_PATTERN)?.[1] ?? 'en'
        }))
        .sort((left, right) => left.fileName.localeCompare(right.fileName));
}

function copyFileIntoTempRepo(repoRoot: string, tempRoot: string, relativePath: string): void {
    const sourcePath = path.join(repoRoot, relativePath);
    const targetPath = path.join(tempRoot, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
}

function writeFakeGit(tempRoot: string, body: string): { argsPath: string } {
    const argsPath = path.join(tempRoot, 'git-args.jsonl');
    const scriptPath = path.join(tempRoot, 'git');
    fs.writeFileSync(
        scriptPath,
        `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const argsPath = ${JSON.stringify(argsPath)};
const args = process.argv.slice(2);
fs.appendFileSync(argsPath, JSON.stringify({ cwd: process.cwd(), args }) + '\\n');
${body}
`,
        { encoding: 'utf8', mode: 0o755 }
    );
    return { argsPath };
}

describe('repo-saga chronicle coverage', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const scriptPath = path.join(repoRoot, 'scripts', 'repo-saga', 'update-quarterly-saga.mjs');
    const outputDir = path.join(repoRoot, 'docs', 'repo-saga');

    test('keeps a localized chronicle SVG for every root README locale', () => {
        const readmes = readRootReadmes(repoRoot);

        expect(readmes.length).toBeGreaterThan(1);
        expect(fs.existsSync(path.join(outputDir, 'notemd-development-history.svg'))).toBe(true);

        for (const readme of readmes) {
            const readmePath = path.join(repoRoot, readme.fileName);
            const svgRelativePath = `./docs/repo-saga/notemd-development-history.${readme.locale}.svg`;
            const svgAbsolutePath = path.join(outputDir, `notemd-development-history.${readme.locale}.svg`);
            const source = fs.readFileSync(readmePath, 'utf8');

            expect(source).toContain('<!-- repo-chronicle:start -->');
            expect(source).toContain('<!-- repo-chronicle:end -->');
            expect(source).toContain(svgRelativePath);
            expect(fs.existsSync(svgAbsolutePath)).toBe(true);
        }
    });

    test('sync script stays aligned with the upstream locale overlay and quarter granularity', () => {
        const source = fs.readFileSync(scriptPath, 'utf8');

        expect(source).toContain('packages/renderer/src/manual-locales.ts');
        expect(source).toContain('"feat/timeline-granularity"');
        expect(source).toContain('"feat-locale-i18n"');
        expect(source).toContain('"--granularity"');
        expect(source).toContain('"quarter"');
        expect(source).toContain('repoRoot.split(path.sep).join("/")');
        expect(source).toContain('recloneSourceRepo(source);');
        expect(source).toContain('assertWithinRepoSagaCacheRoot');
        expect(source).toContain('non-fast-forward or stale local state');
        expect(source).toContain('DEFAULT_REPO_SAGA_LOCK_FILENAME');
        expect(source).toContain('acquireRepoSagaExecutionLock');
        expect(source).toContain('releaseRepoSagaExecutionLock()');
        expect(source).toContain('let lastError = null;');
        expect(source).toContain('trying next fallback');
        expect(source).toContain('Could not execute repo-saga build command');
    });

    test('real repo-saga sync entrypoint respects the cached integration stamp in --sync-only mode', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-repo-saga-sync-only-'));
        const fakeGit = writeFakeGit(
            tempRoot,
            `switch (args[0]) {
case 'fetch':
case 'checkout':
case 'pull':
  process.exit(0);
case 'rev-parse':
  if (process.cwd().includes('timeline-granularity')) {
    process.stdout.write('gran123\\n');
  } else if (process.cwd().includes('locale-i18n')) {
    process.stdout.write('loca456\\n');
  } else {
    process.stdout.write('root000\\n');
  }
  process.exit(0);
default:
  process.stderr.write('Unexpected git command: ' + args.join(' '));
  process.exit(9);
}
`
        );

        try {
            for (const relativePath of [
                'scripts/repo-saga/update-quarterly-saga.mjs',
                'scripts/lib/package-manager-runtime.js',
                'scripts/lib/repo-saga-execution-lock.js',
                'scripts/lib/repo-saga-contributor-normalization.js'
            ]) {
                copyFileIntoTempRepo(repoRoot, tempRoot, relativePath);
            }

            const granularityRoot = path.join(tempRoot, '.cache', 'repo-saga-sources', 'timeline-granularity');
            const localeRoot = path.join(tempRoot, '.cache', 'repo-saga-sources', 'locale-i18n');
            fs.mkdirSync(path.join(granularityRoot, '.git'), { recursive: true });
            fs.mkdirSync(path.join(localeRoot, '.git'), { recursive: true });

            const upstreamCliDist = path.join(tempRoot, '.cache', 'repo-saga-upstream', 'packages', 'cli', 'dist');
            fs.mkdirSync(upstreamCliDist, { recursive: true });
            fs.writeFileSync(path.join(upstreamCliDist, 'index.js'), 'console.log("repo-saga cli");\n', 'utf8');

            const integrationStampPath = path.join(tempRoot, '.cache', 'repo-saga-upstream', '.notemd-repo-saga-integration.json');
            fs.mkdirSync(path.dirname(integrationStampPath), { recursive: true });
            fs.writeFileSync(
                integrationStampPath,
                JSON.stringify(
                    {
                        integrationVersion: 3,
                        sources: [
                            {
                                label: 'timeline-granularity',
                                branch: 'feat/timeline-granularity',
                                repoUrl: 'https://github.com/Jacobinwwey/repo-saga.git',
                                commit: 'gran123'
                            },
                            {
                                label: 'locale-i18n',
                                branch: 'feat-locale-i18n',
                                repoUrl: 'https://github.com/Jacobinwwey/repo-saga.git',
                                commit: 'loca456'
                            }
                        ]
                    },
                    null,
                    2
                ),
                'utf8'
            );

            const output = execFileSync(
                process.execPath,
                [path.join(tempRoot, 'scripts', 'repo-saga', 'update-quarterly-saga.mjs'), '--sync-only'],
                {
                    cwd: tempRoot,
                    encoding: 'utf8',
                    env: {
                        ...process.env,
                        PATH: `${tempRoot}:${process.env.PATH || ''}`
                    }
                }
            );

            expect(output).toContain('Synchronized repo-saga integration cache only.');
            expect(output).not.toContain('Prepared repo-saga integration cache');
            expect(fs.existsSync(path.join(tempRoot, '.cache', '.repo-saga-execution.lock'))).toBe(false);

            const calls = fs.readFileSync(fakeGit.argsPath, 'utf8')
                .trim()
                .split('\n')
                .map((line) => JSON.parse(line));
            expect(calls).toHaveLength(8);
            expect(calls.filter((call) => call.args[0] === 'fetch')).toHaveLength(2);
            expect(calls.filter((call) => call.args[0] === 'checkout')).toHaveLength(2);
            expect(calls.filter((call) => call.args[0] === 'pull')).toHaveLength(2);
            expect(calls.filter((call) => call.args[0] === 'rev-parse')).toHaveLength(2);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('real repo-saga sync entrypoint fails fast when another execution lock is active', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-repo-saga-lock-fail-'));

        try {
            copyFileIntoTempRepo(repoRoot, tempRoot, 'scripts/repo-saga/update-quarterly-saga.mjs');
            copyFileIntoTempRepo(repoRoot, tempRoot, 'scripts/lib/repo-saga-execution-lock.js');
            copyFileIntoTempRepo(repoRoot, tempRoot, 'scripts/lib/package-manager-runtime.js');
            copyFileIntoTempRepo(repoRoot, tempRoot, 'scripts/lib/repo-saga-contributor-normalization.js');

            const lockPath = path.join(tempRoot, '.cache', '.repo-saga-execution.lock');
            fs.mkdirSync(path.dirname(lockPath), { recursive: true });
            fs.writeFileSync(
                lockPath,
                JSON.stringify({ pid: process.pid, startedAt: '2026-06-09T00:00:00.000Z' }, null, 2),
                'utf8'
            );

            const result = spawnSync(
                process.execPath,
                [path.join(tempRoot, 'scripts', 'repo-saga', 'update-quarterly-saga.mjs'), '--sync-only'],
                {
                    cwd: tempRoot,
                    encoding: 'utf8'
                }
            );

            expect(result.status).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('must run serially');
            expect(result.stderr).toContain('.repo-saga-execution.lock');
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });
});
