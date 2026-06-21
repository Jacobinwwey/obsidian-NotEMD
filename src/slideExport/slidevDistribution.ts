export const NOTEMD_SLIDEV_FORK_RELEASE_TAG = 'notemd-standalone-v52.16.0-1';
export const NOTEMD_SLIDEV_FORK_RELEASE_ASSET = 'slidev-cli-notemd-standalone-v52.16.0-1.tgz';
export const NOTEMD_SLIDEV_FORK_RELEASE_URL = `https://github.com/Jacobinwwey/slidev/releases/tag/${NOTEMD_SLIDEV_FORK_RELEASE_TAG}`;
export const NOTEMD_SLIDEV_FORK_TARBALL_URL = `https://github.com/Jacobinwwey/slidev/releases/download/${NOTEMD_SLIDEV_FORK_RELEASE_TAG}/${NOTEMD_SLIDEV_FORK_RELEASE_ASSET}`;
export const NOTEMD_SLIDEV_INSTALL_PACKAGES = [
	NOTEMD_SLIDEV_FORK_TARBALL_URL,
	'@slidev/theme-default',
];
export const NOTEMD_SLIDEV_INSTALL_COMMAND = `npm install -D ${NOTEMD_SLIDEV_INSTALL_PACKAGES.join(' ')}`;
