import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
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
        expect(workflow).toContain("- '*.*.*'");
        expect(workflow).not.toContain("- 'v*.*.*'");
        expect(workflow).not.toContain("- 'V*.*.*'");
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
