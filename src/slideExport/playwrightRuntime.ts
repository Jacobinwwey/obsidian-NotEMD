import { resolveSlidevCommand, safeRequire } from './platformUtils';

// Share the package identity and root order between the Node probe and installer.
export const PLAYWRIGHT_RESOLUTION_SCRIPT = [
	'const roots = process.argv.slice(1);',
	'const options = roots.length ? { paths: roots } : undefined;',
	'const packagePath = require.resolve("playwright-chromium/package.json", options);',
].join('\n');

export function slideExportRuntimeRoots(searchRoots: string[]): string[] {
	const path = safeRequire('path');
	const slidev = resolveSlidevCommand({ roots: searchRoots });
	// Slidev resolves from the deck/workspace first, then its own optional dependency.
	const cliRoot = slidev && path
		? path.dirname(slidev.command) : '';
	return [...new Set([...(searchRoots.length ? searchRoots : [process.cwd()]), cliRoot].filter(Boolean))];
}

export function loadSlideExportChromium(searchRoot: string): any | null {
	const nodeModule = safeRequire('module');
	const path = safeRequire('path');
	if (!nodeModule?.createRequire || !path) return null;
	try {
		const fromVault = nodeModule.createRequire(path.join(searchRoot, 'package.json'));
		const entry = fromVault.resolve('playwright-chromium', { paths: slideExportRuntimeRoots([searchRoot]) });
		return fromVault(entry);
	} catch {
		return null;
	}
}
