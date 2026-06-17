/**
 * Single-file HTML bundler for Slidev exports
 *
 * Strategy: Post-process Slidev build output to inline all JavaScript chunks
 * into a single HTML file that works under file:// protocol.
 *
 * Technical approach:
 * 1. Parse index.html, extract all <script src="./assets/*.js">
 * 2. Read all JavaScript chunks and their dependencies
 * 3. Analyze __vite__mapDeps to find dynamic import graph
 * 4. Build custom module loader that doesn't use import()
 * 5. Inline all JS as single <script type="module">
 * 6. Inline all CSS as <style> tags
 */

import { App } from 'obsidian';
import { getVaultBasePath } from './platformUtils';
import * as path from 'path';

interface ChunkInfo {
	path: string;
	code: string;
	dependencies: string[];
}

interface BundleResult {
	html: string;
	size: number;
	chunks: number;
}

/**
 * Extract __vite__mapDeps array from JavaScript code
 */
function extractViteMapDeps(code: string): string[] {
	const match = code.match(/__vite__mapDeps\s*=\s*\([^)]*\)\s*=>\s*[^;]*m\.f\s*\|\|\s*\(m\.f\s*=\s*\[([^\]]+)\]/);
	if (!match) return [];

	try {
		// Parse the deps array
		const depsStr = match[1].replace(/\s+/g, '');
		const deps = depsStr.match(/"[^"]+"/g) || [];
		return deps.map(d => d.slice(1, -1)); // Remove quotes
	} catch (error) {
		console.error('Failed to parse __vite__mapDeps:', error);
		return [];
	}
}

/**
 * Parse index.html and extract script/link references
 */
async function parseHtmlReferences(
	app: App,
	htmlPath: string,
): Promise<{ scripts: string[]; styles: string[] }> {
	const html = await app.vault.adapter.read(htmlPath);
	const scripts: string[] = [];
	const styles: string[] = [];

	// Extract <script src="...">
	const scriptMatches = html.matchAll(/<script[^>]*\ssrc="([^"]+)"[^>]*>/g);
	for (const match of scriptMatches) {
		scripts.push(match[1]);
	}

	// Extract <link rel="stylesheet" href="...">
	const linkMatches = html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g);
	for (const match of linkMatches) {
		styles.push(match[1]);
	}

	return { scripts, styles };
}

/**
 * Load all JavaScript chunks and analyze dependency graph
 */
async function loadChunks(
	app: App,
	baseDir: string,
	entryScripts: string[],
): Promise<Map<string, ChunkInfo>> {
	const chunks = new Map<string, ChunkInfo>();
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root unavailable');

	// Queue for BFS traversal
	const queue = [...entryScripts];
	const visited = new Set<string>();

	while (queue.length > 0) {
		const scriptPath = queue.shift()!;
		if (visited.has(scriptPath)) continue;
		visited.add(scriptPath);

		// Resolve absolute path
		const absPath = path.join(vaultRoot, baseDir, scriptPath);

		try {
			const code = await app.vault.adapter.read(absPath.replace(vaultRoot + '/', ''));

			// Extract dynamic dependencies
			const deps = extractViteMapDeps(code);

			chunks.set(scriptPath, {
				path: scriptPath,
				code,
				dependencies: deps,
			});

			// Add dependencies to queue
			for (const dep of deps) {
				if (!visited.has(dep)) {
					queue.push(dep);
				}
			}
		} catch (error) {
			console.error(`Failed to load chunk ${scriptPath}:`, error);
		}
	}

	return chunks;
}

/**
 * Build custom module system that replaces dynamic import()
 */
function buildModuleSystem(chunks: Map<string, ChunkInfo>): string {
	const moduleEntries: string[] = [];

	for (const [path, chunk] of chunks.entries()) {
		// Escape the module code
		const escaped = chunk.code
			.replace(/\\/g, '\\\\')
			.replace(/`/g, '\\`')
			.replace(/\${/g, '\\${');

		moduleEntries.push(`  '${path}': \`${escaped}\``);
	}

	// Build the module loader
	return `
(function() {
  'use strict';

  // Module registry
  const __modules = {
${moduleEntries.join(',\n')}
  };

  const __moduleCache = {};

  // Custom module loader
  window.__slidevModuleLoader = function(modulePath) {
    if (__moduleCache[modulePath]) {
      return __moduleCache[modulePath];
    }

    const moduleCode = __modules[modulePath];
    if (!moduleCode) {
      console.error('Module not found:', modulePath);
      return {};
    }

    // Create module scope
    const module = { exports: {} };
    const exports = module.exports;

    // Replace import() calls with our loader
    const transformedCode = moduleCode.replace(
      /import\\s*\\(\\s*["'\`]([^"'\`]+)["'\`]\\s*\\)/g,
      'window.__slidevModuleLoader("$1")'
    );

    // Execute module
    try {
      const func = new Function('module', 'exports', '__slidevModuleLoader', transformedCode);
      func(module, exports, window.__slidevModuleLoader);
    } catch (error) {
      console.error('Failed to load module:', modulePath, error);
    }

    __moduleCache[modulePath] = module.exports;
    return module.exports;
  };

  // Replace __vite__mapDeps with our loader
  window.__vite__mapDeps = function(indexes, manifest) {
    // This should not be called in inlined version
    console.warn('__vite__mapDeps called, but all modules are inlined');
    return indexes;
  };
})();
`;
}

/**
 * Create single-file HTML with all assets inlined
 */
export async function createSingleFileBundle(
	app: App,
	htmlPath: string,
): Promise<BundleResult> {
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root unavailable');

	// Parse HTML
	const baseDir = htmlPath.substring(0, htmlPath.lastIndexOf('/'));
	const { scripts, styles } = await parseHtmlReferences(app, htmlPath);

	console.log('Found scripts:', scripts);
	console.log('Found styles:', styles);

	// Load all chunks
	const chunks = await loadChunks(app, baseDir, scripts);
	console.log('Loaded chunks:', chunks.size);

	// Build module system
	const moduleSystem = buildModuleSystem(chunks);

	// Load original HTML
	let html = await app.vault.adapter.read(htmlPath);

	// Replace all <script src="..."> with inline module system
	html = html.replace(
		/<script[^>]*\ssrc="[^"]+"[^>]*><\/script>/g,
		''
	);

	// Inject module system before </body>
	html = html.replace(
		'</body>',
		`<script type="module">${moduleSystem}</script>\n</body>`
	);

	// Inline CSS
	for (const stylePath of styles) {
		const absPath = path.join(vaultRoot, baseDir, stylePath);
		try {
			const css = await app.vault.adapter.read(absPath.replace(vaultRoot + '/', ''));
			html = html.replace(
				new RegExp(`<link[^>]*href="${stylePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`),
				`<style>${css}</style>`
			);
		} catch (error) {
			console.error(`Failed to inline CSS ${stylePath}:`, error);
		}
	}

	return {
		html,
		size: html.length,
		chunks: chunks.size,
	};
}

/**
 * Test if bundling is feasible for current export
 */
export async function testBundleFeasibility(
	app: App,
	htmlPath: string,
): Promise<{ feasible: boolean; reason?: string; estimatedSize?: number }> {
	try {
		const baseDir = htmlPath.substring(0, htmlPath.lastIndexOf('/'));
		const { scripts } = await parseHtmlReferences(app, htmlPath);

		if (scripts.length === 0) {
			return { feasible: false, reason: 'No scripts found' };
		}

		// Estimate size
		const vaultRoot = getVaultBasePath(app);
		if (!vaultRoot) throw new Error('Vault root unavailable');

		let totalSize = 0;
		for (const script of scripts) {
			const absPath = path.join(vaultRoot, baseDir, script);
			try {
				const stat = await app.vault.adapter.stat(absPath.replace(vaultRoot + '/', ''));
				if (stat) totalSize += stat.size;
			} catch {
				// Ignore
			}
		}

		// Add HTML size
		const htmlStat = await app.vault.adapter.stat(htmlPath);
		if (htmlStat) totalSize += htmlStat.size;

		return {
			feasible: true,
			estimatedSize: totalSize,
		};
	} catch (error) {
		return {
			feasible: false,
			reason: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
