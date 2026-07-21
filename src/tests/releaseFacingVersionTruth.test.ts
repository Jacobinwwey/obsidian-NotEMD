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
    const currentVersion = packageJson.version;
    const releaseNotes = fs.readFileSync(path.join(repoRoot, 'docs', 'releases', `${currentVersion}.md`), 'utf8');
    const releaseNotesZh = fs.readFileSync(path.join(repoRoot, 'docs', 'releases', `${currentVersion}.zh-CN.md`), 'utf8');
    const changeLog = fs.readFileSync(path.join(repoRoot, 'change.md'), 'utf8');

    test('current shipped version stays synchronized across metadata, welcome digest, README family, and release notes', () => {
        expect(packageJson.version).toBe(currentVersion);
        expect(manifest.version).toBe(currentVersion);
        expect(versions[currentVersion]).toBe('0.15.0');

        expect(readme).toContain(`**Version:** ${currentVersion}`);
        expect(readme).toContain(`*Notemd v${currentVersion} -`);
        expect(readme).toContain(`_Last refreshed for release tag \`${currentVersion}\``);
        expect(readmeZh).toContain(`**版本:** ${currentVersion}`);
        expect(readmeZh).toContain(`*Notemd v${currentVersion} -`);
        expect(readmeZh).toContain(`发布 tag \`${currentVersion}\``);

        expect(releaseNotes).toContain(`# Notemd v${currentVersion}`);
        expect(releaseNotesZh).toContain(`# Notemd v${currentVersion}`);
        expect(changeLog).toContain(`## ${currentVersion}`);

        const welcomeNotesEn = getWelcomeReleaseNotes('en');
        const welcomeNotesZh = getWelcomeReleaseNotes('zh-CN');
        const welcomeNotesZhTw = getWelcomeReleaseNotes('zh-TW');

        expect(welcomeNotesEn[0]?.version).toBe(currentVersion);
        expect(welcomeNotesZh[0]?.version).toBe(currentVersion);
        expect(welcomeNotesZhTw[0]?.version).toBe(currentVersion);

        expect(welcomeNotesEn[0]?.highlights[0]).toContain('Diagram workflows');
        expect(welcomeNotesZh[0]?.highlights[0]).toContain('图表工作流');
        expect(welcomeNotesZhTw[0]?.highlights[0]).toContain('圖表工作流程');
    });
});
