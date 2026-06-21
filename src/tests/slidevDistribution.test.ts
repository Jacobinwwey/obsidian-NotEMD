import {
	NOTEMD_SLIDEV_FORK_RELEASE_ASSET,
	NOTEMD_SLIDEV_FORK_RELEASE_TAG,
	NOTEMD_SLIDEV_FORK_RELEASE_URL,
	NOTEMD_SLIDEV_FORK_TARBALL_URL,
	NOTEMD_SLIDEV_INSTALL_COMMAND,
	NOTEMD_SLIDEV_INSTALL_PACKAGES,
} from '../slideExport/slidevDistribution';

describe('slidevDistribution', () => {
	test('uses a GitHub release tarball as the NoteMD Slidev install boundary', () => {
		expect(NOTEMD_SLIDEV_FORK_RELEASE_TAG).toMatch(/^notemd-standalone-v\d+\.\d+\.\d+-\d+$/);
		expect(NOTEMD_SLIDEV_FORK_RELEASE_ASSET).toBe(`slidev-cli-${NOTEMD_SLIDEV_FORK_RELEASE_TAG}.tgz`);
		expect(NOTEMD_SLIDEV_FORK_RELEASE_URL).toBe(`https://github.com/Jacobinwwey/slidev/releases/tag/${NOTEMD_SLIDEV_FORK_RELEASE_TAG}`);
		expect(NOTEMD_SLIDEV_FORK_TARBALL_URL).toBe(`https://github.com/Jacobinwwey/slidev/releases/download/${NOTEMD_SLIDEV_FORK_RELEASE_TAG}/${NOTEMD_SLIDEV_FORK_RELEASE_ASSET}`);
		expect(NOTEMD_SLIDEV_FORK_TARBALL_URL).toMatch(/\.tgz$/);
		expect(NOTEMD_SLIDEV_FORK_TARBALL_URL).not.toContain('/tree/');
		expect(NOTEMD_SLIDEV_FORK_TARBALL_URL).not.toContain('/blob/');
	});

	test('copies an npm command that installs the fork package and default theme', () => {
		expect(NOTEMD_SLIDEV_INSTALL_PACKAGES).toEqual([
			NOTEMD_SLIDEV_FORK_TARBALL_URL,
			'@slidev/theme-default',
		]);
		expect(NOTEMD_SLIDEV_INSTALL_COMMAND).toBe(`npm install -D ${NOTEMD_SLIDEV_FORK_TARBALL_URL} @slidev/theme-default`);
		expect(NOTEMD_SLIDEV_INSTALL_COMMAND).not.toContain('npm install -D @slidev/cli');
		expect(NOTEMD_SLIDEV_INSTALL_COMMAND).not.toContain('pnpm add -D @slidev/cli');
	});
});
