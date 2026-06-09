import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync, spawnSync } from 'child_process';
const packagingContract = require('../../scripts/lib/packaging-contract.js');

describe('GitHub release workflow', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const releaseScriptRelativePath = path.posix.join('scripts', 'release', 'publish-github-release.js');
    const releaseScriptPath = path.join(repoRoot, releaseScriptRelativePath);
    const validateTagScriptRelativePath = path.posix.join('scripts', 'release', 'validate-release-tag.js');
    const validateTagScriptPath = path.join(repoRoot, validateTagScriptRelativePath);
    const releaseWorkflowPath = path.join(repoRoot, '.github', 'workflows', 'release.yml');

    test('exposes a checked-in GitHub release helper and notes for the current version', () => {
        expect(packageJson.scripts['release:github']).toBe(`node ${releaseScriptRelativePath}`);
        expect(packageJson.scripts['chronicle:sync-repo-saga']).toBe('node scripts/repo-saga/update-quarterly-saga.mjs --sync-only');
        expect(packageJson.scripts['chronicle:update']).toBe('node scripts/repo-saga/update-quarterly-saga.mjs');
        expect(fs.existsSync(releaseScriptPath)).toBe(true);

        const currentReleaseNotesPath = path.join(repoRoot, 'docs', 'releases', `${packageJson.version}.md`);
        const currentReleaseNotesZhPath = path.join(repoRoot, 'docs', 'releases', `${packageJson.version}.zh-CN.md`);
        expect(fs.existsSync(currentReleaseNotesPath)).toBe(true);
        expect(fs.existsSync(currentReleaseNotesZhPath)).toBe(true);
    });

    test('checks in a GitHub Actions workflow that reuses the release helper for tag and manual publishing', () => {
        expect(fs.existsSync(releaseWorkflowPath)).toBe(true);
        expect(fs.existsSync(validateTagScriptPath)).toBe(true);

        const workflow = fs.readFileSync(releaseWorkflowPath, 'utf8');

        expect(workflow).toContain('workflow_dispatch:');
        expect(workflow).toContain('push:');
        expect(packagingContract.RELEASE_WORKFLOW_TAG_TRIGGER_GLOB).toBe('*.*.*');
        expect(packagingContract.RELEASE_WORKFLOW_DISALLOWED_TAG_TRIGGER_GLOBS).toEqual([
            'v*.*.*',
            'V*.*.*'
        ]);
        expect(workflow).toContain(`- '${packagingContract.RELEASE_WORKFLOW_TAG_TRIGGER_GLOB}'`);
        for (const disallowedTagTriggerGlob of packagingContract.RELEASE_WORKFLOW_DISALLOWED_TAG_TRIGGER_GLOBS) {
            expect(workflow).not.toContain(`- '${disallowedTagTriggerGlob}'`);
            expect(workflow).not.toContain(`- "${disallowedTagTriggerGlob}"`);
        }
        expect(workflow).toContain('contents: write');
        expect(workflow).toContain('actions/checkout@v6');
        expect(workflow).toContain('actions/setup-node@v6');
        expect(workflow).toContain('npm ci');
        expect(workflow).toContain('npm run build');
        expect(workflow).toContain('npm test -- --runInBand');
        expect(workflow).toContain('npm run audit:i18n-ui');
        expect(workflow).toContain('npm run audit:render-host');
        expect(workflow).toContain('npm run release:github -- "$TAG_NAME"');
        expect(workflow).toContain('node scripts/release/validate-release-tag.js "$TAG_NAME"');
        expect(workflow).toContain('if [ "${{ github.event_name }}" = "workflow_dispatch" ]');
        expect(workflow).toContain('inputs.tag');
        expect(workflow).toContain('refresh_chronicle:');
        expect(workflow).toContain('needs: publish');
        expect(packagingContract.RELEASE_WORKFLOW_SOURCE_BRANCH).toBe('main');
        expect(packagingContract.RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH).toBe('main');
        expect(workflow).toContain(`NOTEMD_RELEASE_WORKFLOW_SOURCE_BRANCH: ${packagingContract.RELEASE_WORKFLOW_SOURCE_BRANCH}`);
        expect(workflow).toContain(`NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH: ${packagingContract.RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH}`);
        expect(workflow).toContain('ref: ${{ env.NOTEMD_RELEASE_WORKFLOW_SOURCE_BRANCH }}');
        expect(workflow).toContain('ref: ${{ env.NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH }}');
        expect(workflow).toContain('node scripts/repo-saga/update-quarterly-saga.mjs --tag "$TAG_NAME"');
        expect(workflow).toContain('node scripts/release/commit-chronicle-refresh.js "$TAG_NAME" --target-branch "$NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH"');
    });

    function writeFakeGh(tempRoot: string, releaseViewExitCode: number) {
        const scriptPath = path.join(tempRoot, 'gh');
        const argsPath = path.join(tempRoot, 'gh-args.jsonl');
        const scriptSource = `#!/usr/bin/env node
const fs = require('fs');
const path = ${JSON.stringify(argsPath)};
const args = process.argv.slice(2);
fs.appendFileSync(path, JSON.stringify(args) + '\\n');
if (args[0] === 'release' && args[1] === 'view') {
  process.exit(${releaseViewExitCode});
}
process.exit(0);
`;
        fs.writeFileSync(scriptPath, scriptSource, { encoding: 'utf8', mode: 0o755 });
        return { scriptPath, argsPath };
    }

    test('real validate-release-tag entrypoint passes numeric tags and fails fast on invalid input', () => {
        const ok = spawnSync(process.execPath, [validateTagScriptPath, packageJson.version], {
            cwd: repoRoot,
            encoding: 'utf8'
        });
        expect(ok.status).toBe(0);
        expect(ok.stdout).toBe('');
        expect(ok.stderr).toBe('');

        const bad = spawnSync(process.execPath, [validateTagScriptPath, `v${packageJson.version}`], {
            cwd: repoRoot,
            encoding: 'utf8'
        });
        expect(bad.status).toBe(1);
        expect(bad.stdout).toBe('');
        expect(bad.stderr).toContain('numeric x.x.x tags');

        const missing = spawnSync(process.execPath, [validateTagScriptPath], {
            cwd: repoRoot,
            encoding: 'utf8'
        });
        expect(missing.status).toBe(1);
        expect(missing.stdout).toBe('');
        expect(missing.stderr).toContain('Usage: node scripts/release/validate-release-tag.js <tag>');
    });

    const maybeDescribeReleaseScript = fs.existsSync(releaseScriptPath) ? describe : describe.skip;

    maybeDescribeReleaseScript('publish-github-release helper', () => {
        let composeReleaseNotesFile: (args: {
            tag: string;
            englishNotesFile: string;
            chineseNotesFile: string;
        }) => string;
        let buildGhReleaseCommands: (args: {
            tag: string;
            title: string;
            notesFile: string;
            assets: string[];
            releaseExists: boolean;
        }) => string[][];
        let validateReleaseTagMain: (argv?: string[]) => number;
        let resolveReleaseInputs: (repoRoot: string, tag: string) => {
            tag: string;
            title: string;
            englishNotesFile: string;
            chineseNotesFile: string;
            assets: string[];
        };
        let REQUIRED_RELEASE_ASSETS: string[];
        let OBSIDIAN_RELEASE_TAG_PATTERN: RegExp;

        beforeAll(() => {
            ({
                OBSIDIAN_RELEASE_TAG_PATTERN,
                buildGhReleaseCommands,
                composeReleaseNotesFile,
                resolveReleaseInputs,
                REQUIRED_RELEASE_ASSETS
            } = require(releaseScriptPath));
            ({ main: validateReleaseTagMain } = require(validateTagScriptPath));
        });

        test('reuses the shared release asset and tag contracts', () => {
            expect(REQUIRED_RELEASE_ASSETS).toEqual(packagingContract.REQUIRED_RELEASE_ASSET_FILES);
            expect(OBSIDIAN_RELEASE_TAG_PATTERN.source).toBe(packagingContract.RELEASE_TAG_PATTERN_SOURCE);
        });

        test('reuses the checked-in tag-validation helper wrapper', () => {
            expect(validateReleaseTagMain(['1.9.2'])).toBe(0);
            expect(() => validateReleaseTagMain(['v1.9.2'])).toThrow('numeric x.x.x tags');
        });

        test('real release helper dry-run prints create commands and cleans up the temporary notes file', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-dry-run-create-'));
            const fakeGh = writeFakeGh(tempRoot, 1);

            try {
                const output = execFileSync(
                    process.execPath,
                    [releaseScriptPath, packageJson.version, '--dry-run'],
                    {
                        cwd: repoRoot,
                        encoding: 'utf8',
                        env: {
                            ...process.env,
                            PATH: `${tempRoot}:${process.env.PATH || ''}`
                        }
                    }
                );

                expect(output).toContain(`gh release create ${packageJson.version}`);
                expect(output).toContain('--verify-tag');
                expect(output).toContain(path.join(repoRoot, 'main.js'));
                expect(output).toContain(path.join(repoRoot, 'manifest.json'));
                expect(output).toContain(path.join(repoRoot, 'styles.css'));
                expect(output).toContain(path.join(repoRoot, 'README.md'));

                const ghCalls = fs.readFileSync(fakeGh.argsPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
                expect(ghCalls).toEqual([['release', 'view', packageJson.version]]);

                const notesFileMatch = output.match(/--notes-file\s+(\S+)/);
                expect(notesFileMatch).not.toBeNull();
                expect(fs.existsSync(notesFileMatch![1])).toBe(false);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('real release helper dry-run prints repair commands when the release already exists', () => {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-dry-run-repair-'));
            const fakeGh = writeFakeGh(tempRoot, 0);

            try {
                const output = execFileSync(
                    process.execPath,
                    [releaseScriptPath, packageJson.version, '--dry-run'],
                    {
                        cwd: repoRoot,
                        encoding: 'utf8',
                        env: {
                            ...process.env,
                            PATH: `${tempRoot}:${process.env.PATH || ''}`
                        }
                    }
                );

                expect(output).toContain(`gh release edit ${packageJson.version}`);
                expect(output).toContain(`gh release upload ${packageJson.version}`);
                expect(output).toContain('--clobber');

                const ghCalls = fs.readFileSync(fakeGh.argsPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
                expect(ghCalls).toEqual([['release', 'view', packageJson.version]]);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('real release helper fails fast on invalid or missing tag arguments before invoking GitHub', () => {
            const invalid = spawnSync(
                process.execPath,
                [releaseScriptPath, `v${packageJson.version}`, '--dry-run'],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );
            expect(invalid.status).toBe(1);
            expect(invalid.stdout).toBe('');
            expect(invalid.stderr).toContain('numeric x.x.x tags');

            const missing = spawnSync(
                process.execPath,
                [releaseScriptPath, '--dry-run'],
                {
                    cwd: repoRoot,
                    encoding: 'utf8'
                }
            );
            expect(missing.status).toBe(1);
            expect(missing.stdout).toBe('');
            expect(missing.stderr).toContain('Usage: node scripts/release/publish-github-release.js <tag> [--dry-run]');
        });

        function createTempRepoRoot(): string {
            const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-release-'));
            fs.mkdirSync(path.join(tempRoot, 'docs', 'releases'), { recursive: true });
            return tempRoot;
        }

        function writeFile(tempRoot: string, relativePath: string): string {
            const absolutePath = path.join(tempRoot, relativePath);
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
            fs.writeFileSync(absolutePath, `${relativePath}\n`, 'utf8');
            return absolutePath;
        }

        test('plans gh release create with required packaged assets and checked-in notes', () => {
            const tempRoot = createTempRepoRoot();
            try {
                writeFile(tempRoot, 'main.js');
                writeFile(tempRoot, 'manifest.json');
                writeFile(tempRoot, 'styles.css');
                writeFile(tempRoot, 'README.md');
                const releaseNotesRelativePaths = packagingContract.resolveReleaseNotesRelativePaths('1.8.2');
                const englishNotesRelativePath = releaseNotesRelativePaths.english;
                const chineseNotesRelativePath = releaseNotesRelativePaths.simplifiedChinese;
                const englishNotesFile = writeFile(tempRoot, englishNotesRelativePath);
                const chineseNotesFile = writeFile(tempRoot, chineseNotesRelativePath);

                const inputs = resolveReleaseInputs(tempRoot, '1.8.2');
                const notesFile = composeReleaseNotesFile(inputs);
                const commands = buildGhReleaseCommands({ ...inputs, notesFile, releaseExists: false });

                expect(inputs).toEqual({
                    tag: '1.8.2',
                    title: 'Notemd 1.8.2',
                    englishNotesFile,
                    chineseNotesFile,
                    assets: [
                        path.join(tempRoot, 'main.js'),
                        path.join(tempRoot, 'manifest.json'),
                        path.join(tempRoot, 'styles.css'),
                        path.join(tempRoot, 'README.md')
                    ]
                });
                expect(fs.readFileSync(notesFile, 'utf8')).toBe(
                    [
                        englishNotesRelativePath,
                        '',
                        '---',
                        '',
                        chineseNotesRelativePath,
                        ''
                    ].join('\n')
                );
                expect(commands).toEqual([[
                    'release',
                    'create',
                    '1.8.2',
                    path.join(tempRoot, 'main.js'),
                    path.join(tempRoot, 'manifest.json'),
                    path.join(tempRoot, 'styles.css'),
                    path.join(tempRoot, 'README.md'),
                    '--title',
                    'Notemd 1.8.2',
                    '--notes-file',
                    expect.any(String),
                    '--verify-tag'
                ]]);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('plans gh release repair by rewriting notes before uploading assets when the release already exists', () => {
            const commands = buildGhReleaseCommands({
                tag: '1.8.2',
                title: 'Notemd 1.8.2',
                notesFile: '/tmp/notes.md',
                assets: ['/tmp/main.js', '/tmp/manifest.json', '/tmp/styles.css', '/tmp/README.md'],
                releaseExists: true
            });

            expect(commands).toEqual([
                [
                    'release',
                    'edit',
                    '1.8.2',
                    '--title',
                    'Notemd 1.8.2',
                    '--notes-file',
                    '/tmp/notes.md'
                ],
                [
                    'release',
                    'upload',
                    '1.8.2',
                    '/tmp/main.js',
                    '/tmp/manifest.json',
                    '/tmp/styles.css',
                    '/tmp/README.md',
                    '--clobber'
                ]
            ]);
        });

        test('rejects missing packaged assets before invoking gh release', () => {
            const tempRoot = createTempRepoRoot();
            try {
                writeFile(tempRoot, 'main.js');
                writeFile(tempRoot, 'manifest.json');
                writeFile(tempRoot, 'styles.css');
                writeFile(tempRoot, path.join('docs', 'releases', '1.8.2.md'));
                writeFile(tempRoot, path.join('docs', 'releases', '1.8.2.zh-CN.md'));

                expect(() => resolveReleaseInputs(tempRoot, '1.8.2')).toThrow(
                    path.join(tempRoot, 'README.md')
                );
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('rejects non-numeric tags that Obsidian cannot publish correctly', () => {
            const tempRoot = createTempRepoRoot();
            try {
                writeFile(tempRoot, 'main.js');
                writeFile(tempRoot, 'manifest.json');
                writeFile(tempRoot, 'styles.css');
                writeFile(tempRoot, 'README.md');
                writeFile(tempRoot, path.join('docs', 'releases', 'v1.8.2.md'));
                writeFile(tempRoot, path.join('docs', 'releases', 'v1.8.2.zh-CN.md'));

                expect(() => resolveReleaseInputs(tempRoot, 'v1.8.2')).toThrow(
                    'numeric x.x.x tags'
                );
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });
    });
});
