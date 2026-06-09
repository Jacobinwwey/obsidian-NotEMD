import * as fs from 'fs';
import * as path from 'path';

import { getWelcomeReleaseNotes } from '../ui/welcomeReleaseNotes';

describe('release-facing version truth contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'manifest.json'), 'utf8'));
    const versions = JSON.parse(fs.readFileSync(path.join(repoRoot, 'versions.json'), 'utf8'));
    const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
    const readmeZh = fs.readFileSync(path.join(repoRoot, 'README_zh.md'), 'utf8');
    const releaseNotes = fs.readFileSync(path.join(repoRoot, 'docs', 'releases', '1.9.2.md'), 'utf8');
    const releaseNotesZh = fs.readFileSync(path.join(repoRoot, 'docs', 'releases', '1.9.2.zh-CN.md'), 'utf8');
    const changeLog = fs.readFileSync(path.join(repoRoot, 'change.md'), 'utf8');

    test('current shipped version stays synchronized across metadata, welcome digest, README family, and release notes', () => {
        expect(packageJson.version).toBe('1.9.2');
        expect(manifest.version).toBe('1.9.2');
        expect(versions['1.9.2']).toBe('0.15.0');

        expect(readme).toContain('**Version:** 1.9.2');
        expect(readme).toContain('*Notemd v1.9.2 -');
        expect(readme).toContain('_Last refreshed for release tag `1.9.2`');
        expect(readmeZh).toContain('**版本:** 1.9.2');
        expect(readmeZh).toContain('*Notemd v1.9.2 -');
        expect(readmeZh).toContain('发布 tag `1.9.2`');

        expect(releaseNotes).toContain('# Notemd v1.9.2');
        expect(releaseNotesZh).toContain('# Notemd v1.9.2');
        expect(changeLog).toContain('## 1.9.2');

        const welcomeNotesEn = getWelcomeReleaseNotes('en');
        const welcomeNotesZh = getWelcomeReleaseNotes('zh-CN');
        const welcomeNotesZhTw = getWelcomeReleaseNotes('zh-TW');

        expect(welcomeNotesEn[0]?.version).toBe('1.9.2');
        expect(welcomeNotesZh[0]?.version).toBe('1.9.2');
        expect(welcomeNotesZhTw[0]?.version).toBe('1.9.2');

        expect(welcomeNotesEn[0]?.highlights[0]).toContain('Sidebar footer scrolling');
        expect(welcomeNotesZh[0]?.highlights[0]).toContain('Sidebar 底部滚动区');
        expect(welcomeNotesZhTw[0]?.highlights[0]).toContain('Sidebar 底部捲動區');
    });
});
