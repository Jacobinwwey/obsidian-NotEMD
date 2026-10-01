import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { getWelcomeReleaseNotes } from '../ui/welcomeReleaseNotes';

const requireScript = createRequire(__filename);

describe('release-facing version truth contract', () => {
    const root = path.join(__dirname, '../..');
    const readJson = (name: string) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
    const packageJson = readJson('package.json');
    const manifest = readJson('manifest.json');
    const lock = readJson('package-lock.json');
    const versions = readJson('versions.json');
    const currentVersion = packageJson.version;

    test('metadata, lockfile and release notes describe the same candidate', () => {
        expect(manifest.version).toBe(currentVersion);
        expect(lock.version).toBe(currentVersion);
        expect(lock.packages[''].version).toBe(currentVersion);
        expect(versions[currentVersion]).toBe(manifest.minAppVersion);
        for (const suffix of ['.md', '.zh-CN.md']) {
            const notes = fs.readFileSync(path.join(root, `docs/releases/${currentVersion}${suffix}`), 'utf8');
            expect(notes).toContain(`# Notemd v${currentVersion}`);
        }
        expect(fs.readFileSync(path.join(root, 'change.md'), 'utf8')).toContain(`## ${currentVersion}`);
    });

    test('every README has a readable current-version heading and footer', () => {
        const files = fs.readdirSync(root).filter(name => /^README(?:_[\w-]+)?\.md$/.test(name));
        expect(files).toHaveLength(31);
        for (const filename of files) {
            const content = fs.readFileSync(path.join(root, filename), 'utf8');
            const intro = content.split(/\r?\n/).slice(0, 80).join('\n');
            const heading = intro.match(/^\*\*[^*\r\n]+\*\*\s+(\d+\.\d+\.\d+)\s*$/m);
            expect({ filename, version: heading?.[1] }).toEqual({ filename, version: currentVersion });
            expect(intro).not.toMatch(/^\.\d+\.\d+$/m);
            expect(content).toContain(`*Notemd v${currentVersion}`);
        }
    });

    test('chronicle history has a real recorded version independent of the software version', () => {
        for (const filename of ['README.md', 'README_zh.md']) {
            const content = fs.readFileSync(path.join(root, filename), 'utf8');
            const chronicle = content.match(/<!-- repo-chronicle:start -->([\s\S]*?)<!-- repo-chronicle:end -->/);
            expect(chronicle).not.toBeNull();
            const recordedTag = chronicle![1].match(/`(\d+\.\d+\.\d+)`/)?.[1];
            expect(recordedTag).toBeDefined();
            expect(versions[recordedTag!]).toBeDefined();
            expect(chronicle![1]).toMatch(/\d{4}-\d{2}-\d{2}/);
        }
    });

    test('welcome digests expose current and prior releases without pinning marketing copy', () => {
        for (const locale of ['en', 'zh-CN', 'zh-TW']) {
            const entries = getWelcomeReleaseNotes(locale);
            expect(entries).toHaveLength(2);
            expect(entries[0].version).toBe(currentVersion);
            expect(entries[1].version).not.toBe(currentVersion);
            expect(entries[0].highlights.every(text => text.trim().length > 0)).toBe(true);
        }
    });

    test('website release facts are a projection of repository metadata', () => {
        const filename = path.join(root, 'website/src/lib/releaseFacts.cjs');
        expect(fs.existsSync(filename)).toBe(true);
        const facts = requireScript(filename);
        expect(facts.version).toBe(currentVersion);
        expect(facts.minimumObsidianVersion).toBe(manifest.minAppVersion);
        expect(facts.releaseUrl).toBe(`https://github.com/Jacobinwwey/obsidian-NotEMD/releases/tag/${currentVersion}`);
    });
});
