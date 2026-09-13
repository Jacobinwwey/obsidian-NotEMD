import * as fs from 'fs';
import * as path from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { createRequire } from 'module';

const requireScript = createRequire(__filename);
const contract = requireScript('../../scripts/lib/packaging-contract.js');
const repoRoot = path.join(__dirname, '..', '..');
const publisherPath = 'scripts/release/publish-github-release.js';
const version = '1.9.8';

describe('GitHub release workflow', () => {
    test('uses the shared numeric tag, four assets and bilingual notes', () => {
        const publisher = requireScript(path.join(repoRoot, publisherPath));
        expect(publisher.REQUIRED_RELEASE_ASSETS).toEqual(contract.REQUIRED_RELEASE_ASSET_FILES);
        expect(publisher.OBSIDIAN_RELEASE_TAG_PATTERN.source).toBe(contract.RELEASE_TAG_PATTERN_SOURCE);
        const metadata = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
        expect(metadata.scripts['release:github']).toBe(`node ${publisherPath}`);
        for (const relative of Object.values(contract.resolveReleaseNotesRelativePaths(metadata.version))) {
            expect(fs.existsSync(path.join(repoRoot, relative as string))).toBe(true);
        }
    });

    test('serializes same-tag runs and prepares both locked Chromium revisions', () => {
        const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8');
        for (const required of [
            `- '${contract.RELEASE_WORKFLOW_TAG_TRIGGER_GLOB}'`, 'concurrency:', 'cancel-in-progress: false',
            'inputs.tag || github.ref_name', 'npx --no-install playwright install --with-deps chromium',
            'node node_modules/playwright-chromium/cli.js install chromium', 'npm ci',
            'npm test -- --runInBand', 'npm run audit:i18n-ui', 'npm run audit:render-host',
            'npm run release:github -- "$TAG_NAME"', 'needs: publish',
            'NOTEMD_RELEASE_WORKFLOW_SOURCE_BRANCH: main', 'NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH: main'
        ]) expect(workflow).toContain(required);
    });

    test('validates dispatch input as env data before writing GitHub outputs', () => {
        const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8');
        expect(workflow).toContain('REQUESTED_TAG: ${{ inputs.tag || github.ref_name }}');
        expect(workflow).not.toMatch(/TAG_NAME="\$\{\{\s*inputs\.tag/);
        const validation = workflow.indexOf('validate-release-tag.js "$REQUESTED_TAG"');
        expect(validation).toBeGreaterThan(-1);
        expect(validation).toBeLessThan(workflow.indexOf('tag_name=$REQUESTED_TAG'));
    });
});

describe('release publisher process boundary', () => {
    let fixture: string;
    let sourceCommit: string;
    let processEnv: NodeJS.ProcessEnv;
    const write = (relative: string, content: string) => {
        const target = path.join(fixture, relative);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content, 'utf8');
    };
    const git = (...args: string[]) => execFileSync('git', args, { cwd: fixture, encoding: 'utf8' }).trim();
    const remote = () => JSON.parse(fs.readFileSync(path.join(fixture, '.cache/remote.json'), 'utf8'));
    const saveRemote = (state: Record<string, unknown>) => write('.cache/remote.json', JSON.stringify(state));
    const calls = (): string[][] => {
        const filename = path.join(fixture, '.cache/gh-calls.jsonl');
        return fs.existsSync(filename) ? fs.readFileSync(filename, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : [];
    };
    const run = (...args: string[]) => spawnSync(process.execPath, [path.join(fixture, publisherPath), ...args], {
        cwd: fixture, encoding: 'utf8', env: processEnv, timeout: 20000
    });
    const mutations = () => calls().filter(args => args[0] === 'release' && ['create', 'upload', 'edit'].includes(args[1]));

    beforeEach(() => {
        const parent = path.join(repoRoot, '.cache/release-tests');
        fs.mkdirSync(parent, { recursive: true });
        fixture = fs.mkdtempSync(path.join(parent, 'candidate-'));
        for (const relative of [publisherPath, 'scripts/release/validate-release-tag.js', 'scripts/lib/packaging-contract.js', 'scripts/lib/cross-platform-command.js']) {
            write(relative, fs.readFileSync(path.join(repoRoot, relative), 'utf8'));
        }
        write('.gitignore', '.cache/\nmain.js\n');
        write('package.json', JSON.stringify({ version, scripts: { build: 'node fixture-build.cjs' } }));
        write('package-lock.json', JSON.stringify({ version, packages: { '': { version } } }));
        write('manifest.json', JSON.stringify({ id: 'notemd', version, minAppVersion: '0.15.0' }));
        write('versions.json', JSON.stringify({ [version]: '0.15.0' }));
        write('styles.css', '.notemd {}\n');
        write('README.md', '# Notemd\n');
        write(`docs/releases/${version}.md`, `# Notemd v${version}\n\nComplete English release notes.\n`);
        write(`docs/releases/${version}.zh-CN.md`, `# Notemd v${version}\n\n完整的中文发布说明。\n`);
        write('main.js', 'stale build\n');
        write('fixture-build.cjs', "const fs = require('fs'); fs.writeFileSync('main.js', 'fresh plugin'); fs.appendFileSync('.cache/builds', 'build\\n');\n");
        git('init', '-q');
        git('config', 'core.autocrlf', 'false');
        git('add', '.');
        git('-c', 'user.name=Release test', '-c', 'user.email=release-test@example.invalid', 'commit', '-qm', 'candidate');
        git('tag', version);
        sourceCommit = git('rev-parse', 'HEAD');
        saveRemote({ commit: sourceCommit, release: null, assets: {} });

        // Git, build and hashing are real; only the remote transport is substituted.
        write('.cache/bin/gh', `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
fs.appendFileSync('.cache/gh-calls.jsonl', JSON.stringify(args) + '\\n');
const remote = JSON.parse(fs.readFileSync('.cache/remote.json', 'utf8'));
const save = () => fs.writeFileSync('.cache/remote.json', JSON.stringify(remote));
const flag = name => args[args.indexOf(name) + 1];
if (args[0] === 'api') {
  if (process.env.FAKE_GH_ERROR) { console.error(process.env.FAKE_GH_ERROR); process.exit(1); }
  if (args[1].includes('/git/ref/tags/')) console.log(JSON.stringify({ object: { type: 'commit', sha: remote.commit } }));
  else if (args[1].includes('/releases/tags/')) {
    if (process.env.FAKE_GH_RELEASE_ERROR) { console.error(process.env.FAKE_GH_RELEASE_ERROR); process.exit(1); }
    if (!remote.release || (remote.release.draft && process.env.FAKE_GH_HIDE_DRAFT)) { console.error('gh: Not Found (HTTP 404)'); process.exit(1); }
    console.log(JSON.stringify({ ...remote.release, assets: Object.keys(remote.assets).map(name => ({ name, state: 'uploaded', size: Buffer.from(remote.assets[name], 'base64').length })) }));
  } else if (args[1].endsWith('/releases?per_page=100')) {
    console.log(JSON.stringify([remote.release ? [{ ...remote.release, assets: Object.keys(remote.assets).map(name => ({ name, state: 'uploaded', size: Buffer.from(remote.assets[name], 'base64').length })) }] : []]));
  } else throw new Error('Unexpected API ' + args[1]);
} else if (args[1] === 'create') {
  if (remote.release) process.exit(1);
  remote.release = { tag_name: args[2], draft: args.includes('--draft'), body: fs.readFileSync(flag('--notes-file'), 'utf8') };
  save();
} else if (args[1] === 'upload') {
  for (const filename of args.slice(3).filter(arg => !arg.startsWith('--'))) {
    if (process.env.FAKE_GH_UPLOAD_FAIL) { console.error('upload interrupted'); process.exit(1); }
    remote.assets[path.basename(filename)] = fs.readFileSync(filename).toString('base64');
  }
  save();
} else if (args[1] === 'download') {
  for (let i = 0; i < args.length; i++) if (args[i] === '--pattern') {
    const name = args[++i];
    if (!remote.assets[name]) process.exit(1);
    fs.writeFileSync(path.join(flag('--dir'), name), process.env.FAKE_GH_CORRUPT === name ? Buffer.from('corrupt') : Buffer.from(remote.assets[name], 'base64'));
  }
} else if (args[1] === 'edit') {
  if (args.includes('--draft=false')) remote.release.draft = false;
  save();
} else throw new Error('Unexpected gh ' + args.join(' '));
`);
        fs.chmodSync(path.join(fixture, '.cache/bin/gh'), 0o755);
        write('.cache/bin/gh.cmd', `@echo off\r\n"${process.execPath}" "${path.join(fixture, '.cache/bin/gh')}" %*\r\n`);
        const executablePath = `${path.join(fixture, '.cache/bin')}${path.delimiter}${process.env.Path || process.env.PATH || ''}`;
        processEnv = { ...process.env, PATH: executablePath, Path: executablePath };
    });
    afterEach(() => fs.rmSync(fixture, { recursive: true, force: true }));

    test('preview is offline and reports local identity without rebuilding', () => {
        processEnv.FAKE_GH_ERROR = 'network unavailable';
        const output = run(version, '--dry-run');
        expect(output.status).toBe(0);
        const preview = JSON.parse(output.stdout);
        expect(preview).toMatchObject({ tag: version, sourceCommit, remoteState: 'not queried' });
        expect(Object.keys(preview.assetSha256)).toEqual(contract.REQUIRED_RELEASE_ASSET_FILES);
        expect(calls()).toEqual([]);
        expect(fs.existsSync(path.join(fixture, '.cache/builds'))).toBe(false);
    });
    test.each([['--dryrun'], ['--dry-run', '--dry-run'], ['--unknown'], ['1.9.9'], ['--dry-run', 'extra']])('rejects extra arguments %j', (...extra: string[]) => {
        const output = run(version, ...extra);
        expect(output.status).toBe(1);
        expect(output.stderr).toMatch(/Unknown|Unexpected|Duplicate/);
        expect(calls()).toEqual([]);
    });
    test.each(['v1.9.8', '1.9.8\n', '1.9.8\nINJECT=1', '1.9.8;exit', '$(echo injected)'])('rejects invalid tag %s', tag => {
        expect(run(tag, '--dry-run').stderr).toContain('numeric x.x.x');
        expect(calls()).toEqual([]);
    });
    test('rejects missing tags', () => {
        expect(run('--dry-run').stderr).toContain('Usage:');
        expect(calls()).toEqual([]);
    });
    test.each(['package.json', 'manifest.json', 'package-lock.json', 'versions.json'])('rejects inconsistent version in %s', relative => {
        const metadata = JSON.parse(fs.readFileSync(path.join(fixture, relative), 'utf8'));
        if (relative === 'versions.json') metadata[version] = '9.0.0';
        else metadata.version = '1.9.7';
        write(relative, JSON.stringify(metadata));
        expect(run(version, '--dry-run').stderr).toMatch(/version|Version/);
        expect(calls()).toEqual([]);
    });
    test.each(['main.js', 'README.md', `docs/releases/${version}.md`, `docs/releases/${version}.zh-CN.md`])('rejects missing file %s', relative => {
        fs.unlinkSync(path.join(fixture, relative));
        expect(run(version, '--dry-run').stderr).toContain('Missing required release file');
        expect(calls()).toEqual([]);
    });
    test('rejects empty notes', () => {
        write(`docs/releases/${version}.zh-CN.md`, ' \n');
        expect(run(version, '--dry-run').stderr).toMatch(/empty|Empty/);
        expect(calls()).toEqual([]);
    });
    test('refuses dirty sources', () => {
        write('README.md', 'uncommitted');
        expect(run(version).stderr).toContain('clean');
        expect(mutations()).toEqual([]);
    });
    test('refuses unrelated worktrees with matching package version', () => {
        write('README.md', 'later revision');
        git('add', 'README.md');
        git('-c', 'user.name=Release test', '-c', 'user.email=release-test@example.invalid', 'commit', '-qm', 'later change');
        expect(run(version).stderr).toContain('tag');
        expect(mutations()).toEqual([]);
    });
    test('refuses remote tag divergence', () => {
        saveRemote({ ...remote(), commit: 'a'.repeat(40) });
        expect(run(version).stderr).toContain('remote tag');
        expect(mutations()).toEqual([]);
    });
    test.each(['gh: Bad credentials (HTTP 401)', 'gh: Forbidden (HTTP 403)', 'gh: Server Error (HTTP 500)', 'EOF'])('propagates remote error %s', message => {
        processEnv.FAKE_GH_ERROR = message;
        const output = run(version);
        expect(output.status).toBe(1);
        expect(output.stderr).toContain(message);
        expect(mutations()).toEqual([]);
    });
    test('rebuilds tagged sources, uploads draft, verifies downloaded bytes, then publishes', () => {
        const output = run(version);
        expect(output.stderr).toBe('');
        expect(output.status).toBe(0);
        expect(remote().release.draft).toBe(false);
        expect(remote().release.body).toContain('Complete English release notes.');
        expect(remote().release.body).toContain('完整的中文发布说明。');
        expect(remote().release.body).toContain(sourceCommit);
        expect(Buffer.from(remote().assets['main.js'], 'base64').toString()).toBe('fresh plugin');
        expect(Object.keys(remote().assets)).toEqual(contract.REQUIRED_RELEASE_ASSET_FILES);
        expect(calls().find(args => args[1] === 'create')).toEqual(expect.arrayContaining(['--draft', '--verify-tag']));
        expect(calls().findIndex(args => args[1] === 'download')).toBeLessThan(calls().findIndex(args => args.includes('--draft=false')));
        expect(fs.readFileSync(path.join(fixture, '.cache/builds'), 'utf8')).toBe('build\n');
    });
    test.each(['FAKE_GH_UPLOAD_FAIL', 'FAKE_GH_CORRUPT'])('retains failed draft and resumes the same candidate: %s', failure => {
        processEnv[failure] = failure === 'FAKE_GH_CORRUPT' ? 'main.js' : '1';
        expect(run(version).status).toBe(1);
        expect(remote().release.draft).toBe(true);
        expect(calls().some(args => args.includes('--draft=false'))).toBe(false);
        delete processEnv[failure];
        const resumed = run(version);
        expect(resumed.stderr).toBe('');
        expect(resumed.status).toBe(0);
        expect(remote().release.draft).toBe(false);
        expect(calls().filter(args => args[1] === 'create')).toHaveLength(1);
    });
    test('does not overwrite public assets on identical retries', () => {
        expect(run(version).status).toBe(0);
        write('.cache/gh-calls.jsonl', '');
        expect(run(version).status).toBe(0);
        expect(mutations()).toEqual([]);
    });
    test('refuses repair without matching provenance', () => {
        saveRemote({ ...remote(), release: { tag_name: version, draft: true, body: 'unrelated draft' } });
        expect(run(version).stderr).toContain('provenance');
        expect(mutations()).toEqual([]);
    });
    test('finds authenticated drafts when the by-tag endpoint only exposes published releases', () => {
        processEnv.FAKE_GH_HIDE_DRAFT = '1';
        const output = run(version);
        expect(output.stderr).toBe('');
        expect(output.status).toBe(0);
        expect(remote().release.draft).toBe(false);
        expect(calls().filter(args => args[1] === 'create')).toHaveLength(1);
    });
    test.each(['gh: Bad credentials (HTTP 401)', 'gh: Forbidden (HTTP 403)', 'gh: Server Error (HTTP 503)', 'EOF'])('does not mistake release lookup errors for absence: %s', message => {
        processEnv.FAKE_GH_RELEASE_ERROR = message;
        const output = run(version);
        expect(output.status).toBe(1);
        expect(output.stderr).toContain(message);
        expect(mutations()).toEqual([]);
    });
    test('repairs a missing public asset without replacing existing assets', () => {
        expect(run(version).status).toBe(0);
        const state = remote();
        delete state.assets['README.md'];
        saveRemote(state);
        write('.cache/gh-calls.jsonl', '');
        expect(run(version).status).toBe(0);
        expect(Object.keys(remote().assets)).toEqual(contract.REQUIRED_RELEASE_ASSET_FILES);
        expect(mutations()).toHaveLength(1);
        expect(mutations()[0][1]).toBe('upload');
        expect(mutations()[0]).not.toContain('--clobber');
        expect(mutations()[0]).toHaveLength(4);
    });
    test('refuses corrupted public assets without overwriting them', () => {
        expect(run(version).status).toBe(0);
        const state = remote();
        state.assets['main.js'] = Buffer.from('corrupt public bytes').toString('base64');
        saveRemote(state);
        write('.cache/gh-calls.jsonl', '');
        expect(run(version).stderr).toContain('hash mismatch');
        expect(mutations()).toEqual([]);
    });
    test('refuses concurrent local publishers and preserves their lock', () => {
        write(`.cache/.release-${version}.lock`, 'another publisher');
        expect(run(version).stderr).toContain('lock');
        expect(fs.readFileSync(path.join(fixture, `.cache/.release-${version}.lock`), 'utf8')).toBe('another publisher');
        expect(mutations()).toEqual([]);
    });
    test('the tag-validator rejects unexpected options', () => {
        const output = spawnSync(process.execPath, [path.join(fixture, 'scripts/release/validate-release-tag.js'), version, '--oops'], { encoding: 'utf8' });
        expect(output.status).toBe(1);
        expect(output.stderr).toMatch(/Usage|Unexpected/);
    });
});
