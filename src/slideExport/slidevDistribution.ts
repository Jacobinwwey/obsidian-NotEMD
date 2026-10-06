export const NOTEMD_SLIDEV_FORK_RELEASE_TAG = 'notemd-standalone-v52.16.0-2';
export const NOTEMD_SLIDEV_FORK_RELEASE_ASSET = 'slidev-cli-notemd-standalone-v52.16.0-2.tgz';
export const NOTEMD_SLIDEV_UNSUPPORTED_RELEASE_TAG = 'notemd-standalone-v52.16.0-1';
// Offline installs must match the reviewed -2 archive, not an arbitrary local CLI package.
export const NOTEMD_SLIDEV_OFFLINE_ARCHIVE_INTEGRITY = 'sha512-pub8/2toQUQsGKwc46Eio/6ME3k4GgMnCplgEn8irSAEunjLE1Qp/UiW1t5Qv7gVnycgPJoR3dUI9P6T5IMt2g==';
export const NOTEMD_SLIDEV_FORK_RELEASE_URL = `https://github.com/Jacobinwwey/slidev/releases/tag/${NOTEMD_SLIDEV_FORK_RELEASE_TAG}`;
export const NOTEMD_SLIDEV_FORK_TARBALL_URL = `https://github.com/Jacobinwwey/slidev/releases/download/${NOTEMD_SLIDEV_FORK_RELEASE_TAG}/${NOTEMD_SLIDEV_FORK_RELEASE_ASSET}`;
export const NOTEMD_SLIDEV_INSTALL_PACKAGES = [
	NOTEMD_SLIDEV_FORK_TARBALL_URL,
	'@slidev/theme-default',
];
export const NOTEMD_SLIDEV_INSTALL_COMMAND = `npm install -D ${NOTEMD_SLIDEV_INSTALL_PACKAGES.join(' ')}`;
