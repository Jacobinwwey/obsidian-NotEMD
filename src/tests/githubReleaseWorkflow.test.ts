import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('GitHub release workflow', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const releaseScriptRelativePath = path.join('scripts', 'release', 'publish-github-release.js');
    const releaseScriptPath = path.join(repoRoot, releaseScriptRelativePath);
    const releaseWorkflowPath = path.join(repoRoot, '.github', 'workflows', 'release.yml');

    test('exposes a checked-in GitHub release helper and notes for the current version', () => {
        expect(packageJson.scripts['release:github']).toBe(`node ${releaseScriptRelativePath}`);
        expect(fs.existsSync(releaseScriptPath)).toBe(true);

        const currentReleaseNotesPath = path.join(repoRoot, 'docs', 'releases', `${packageJson.version}.md`);
        const currentReleaseNotesZhPath = path.join(repoRoot, 'docs', 'releases', `${packageJson.version}.zh-CN.md`);
        expect(fs.existsSync(currentReleaseNotesPath)).toBe(true);
        expect(fs.existsSync(currentReleaseNotesZhPath)).toBe(true);
    });

    test('checks in a GitHub Actions workflow that reuses the release helper for tag and manual publishing', () => {
        expect(fs.existsSync(releaseWorkflowPath)).toBe(true);

        const workflow = fs.readFileSync(releaseWorkflowPath, 'utf8');

        expect(workflow).toContain('workflow_dispatch:');
        expect(workflow).toContain('push:');
        expect(workflow).toContain("- '*.*.*'");
        expect(workflow).not.toContain("- 'v*.*.*'");
        expect(workflow).not.toContain("- 'V*.*.*'");
        expect(workflow).toContain('contents: write');
        expect(workflow).toContain('npm ci');
        expect(workflow).toContain('npm run build');
        expect(workflow).toContain('npm test -- --runInBand');
        expect(workflow).toContain('npm run audit:i18n-ui');
        expect(workflow).toContain('npm run audit:render-host');
        expect(workflow).toContain('npm run release:github -- "$TAG_NAME"');
        expect(workflow).toContain('if [ "${{ github.event_name }}" = "workflow_dispatch" ]');
        expect(workflow).toContain('inputs.tag');
        expect(workflow).toContain("^[0-9]+\\.[0-9]+\\.[0-9]+$");
    });

    const maybeDescribeReleaseScript = fs.existsSync(releaseScriptPath) ? describe : describe.skip;

    maybeDescribeReleaseScript('publish-github-release helper', () => {
        let composeReleaseNotesFile: (args: {
            tag: string;
            englishNotesFile: string;
            chineseNotesFile: string;
        }) => string;
        let buildGhReleaseCommand: (args: {
            tag: string;
            title: string;
            notesFile: string;
            assets: string[];
            releaseExists: boolean;
        }) => string[];
        let resolveReleaseInputs: (repoRoot: string, tag: string) => {
            tag: string;
            title: string;
            englishNotesFile: string;
            chineseNotesFile: string;
            assets: string[];
        };

        beforeAll(() => {
            ({ buildGhReleaseCommand, composeReleaseNotesFile, resolveReleaseInputs } = require(releaseScriptPath));
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
                const englishNotesFile = writeFile(tempRoot, path.join('docs', 'releases', '1.8.2.md'));
                const chineseNotesFile = writeFile(tempRoot, path.join('docs', 'releases', '1.8.2.zh-CN.md'));

                const inputs = resolveReleaseInputs(tempRoot, '1.8.2');
                const notesFile = composeReleaseNotesFile(inputs);
                const command = buildGhReleaseCommand({ ...inputs, notesFile, releaseExists: false });

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
                        'docs/releases/1.8.2.md',
                        '',
                        '---',
                        '',
                        'docs/releases/1.8.2.zh-CN.md',
                        ''
                    ].join('\n')
                );
                expect(command).toContain('--notes-file');
                expect(command).toEqual([
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
                ]);
            } finally {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        });

        test('plans gh release upload with clobber when the release already exists', () => {
            const command = buildGhReleaseCommand({
                tag: '1.8.2',
                title: 'Notemd 1.8.2',
                notesFile: '/tmp/ignored.md',
                assets: ['/tmp/main.js', '/tmp/manifest.json', '/tmp/styles.css', '/tmp/README.md'],
                releaseExists: true
            });

            expect(command).toEqual([
                'release',
                'upload',
                '1.8.2',
                '/tmp/main.js',
                '/tmp/manifest.json',
                '/tmp/styles.css',
                '/tmp/README.md',
                '--clobber'
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
