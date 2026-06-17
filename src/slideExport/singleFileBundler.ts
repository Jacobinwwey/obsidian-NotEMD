/**
 * Single-file HTML bundler for Slidev exports
 *
 * Converts Slidev's ES module build into a standalone HTML file
 * that works under file:// protocol by implementing a custom
 * CommonJS-style module system.
 *
 * Technical approach:
 * 1. Parse all JavaScript chunks from build output
 * 2. Transform ES modules → CommonJS semantics
 * 3. Build custom require() system (no native import())
 * 4. Inline all JS/CSS into single HTML
 * 5. Handle Vue components, async imports, CSS modules
 */

import { App } from 'obsidian';
import { getVaultBasePath } from './platformUtils';
import * as path from 'path';

interface ModuleInfo {
	path: string;
	code: string;
	size: number;
}

interface BundleResult {
	htmlPath: string;
	size: number;
	moduleCount: number;
}

/**
 * Collect all JavaScript modules from assets directory
 */
async function collectModules(
	app: App,
	baseDir: string,
): Promise<Map<string, ModuleInfo>> {
	const modules = new Map<string, ModuleInfo>();
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root unavailable');

	async function scanDirectory(dirPath: string, prefix: string) {
		try {
			const entries = await app.vault.adapter.list(dirPath);

			for (const file of entries.files) {
				if (file.endsWith('.js')) {
					const code = await app.vault.adapter.read(file);
					const relativePath = file.substring(baseDir.length + 1);
					const normalizedPath = `./${relativePath}`;

					modules.set(normalizedPath, {
						path: normalizedPath,
						code,
						size: code.length,
					});
				}
			}

			for (const folder of entries.folders) {
				await scanDirectory(folder, prefix);
			}
		} catch (error) {
			// Ignore errors (directory might not exist)
		}
	}

	await scanDirectory(`${baseDir}/assets`, './assets');
	return modules;
}

/**
 * Transform ES module code to CommonJS-compatible
 */
function transformToCommonJS(code: string, modulePath: string): string {
	// 0. Disable Vite's modulepreload polyfill (causes fetch() calls)
	// Match: (function(){let e=document.createElement(`link`)...fetch(e.href,n)}})();
	code = code.replace(
		/\(function\(\)\{let e=document\.createElement\(`link`\)\.relList[\s\S]*?fetch\(e\.href,n\)\}\}\)\(\);?/,
		'// modulepreload polyfill disabled in standalone mode;'
	);

	// 1. Transform static imports: import {...} from "..."
	//    Match: import{...}from"..." or import ... from "..."
	code = code.replace(
		/import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']\s*;?/g,
		(match, imports, path) => {
			// Parse imported names and their aliases
			const importList = imports.split(',').map((imp: string) => {
				const parts = imp.trim().split(/\s+as\s+/);
				if (parts.length === 2) {
					return `${parts[1].trim()}:${parts[0].trim()}`; // alias:original
				}
				return parts[0].trim(); // same name
			});

			const varName = `__imp_${Math.random().toString(36).substr(2, 9)}`;
			let result = `const ${varName}=__require('${path}');`;

			// Destructure imports
			importList.forEach((imp: string) => {
				if (imp.includes(':')) {
					const [alias, original] = imp.split(':');
					result += `const ${alias}=${varName}.${original};`;
				} else {
					result += `const ${imp}=${varName}.${imp};`;
				}
			});

			return result;
		}
	);

	// 2. Transform default imports: import Name from "..."
	code = code.replace(
		/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*["']([^"']+)["']\s*;?/g,
		(match, name, path) => {
			return `const ${name}=__require('${path}').default||__require('${path}');`;
		}
	);

	// 3. Transform mixed imports: import Name, {...} from "..."
	code = code.replace(
		/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']\s*;?/g,
		(match, defaultName, namedImports, path) => {
			const varName = `__imp_${Math.random().toString(36).substr(2, 9)}`;
			let result = `const ${varName}=__require('${path}');`;
			result += `const ${defaultName}=${varName}.default||${varName};`;

			namedImports.split(',').forEach((imp: string) => {
				const parts = imp.trim().split(/\s+as\s+/);
				if (parts.length === 2) {
					result += `const ${parts[1].trim()}=${varName}.${parts[0].trim()};`;
				} else {
					const name = parts[0].trim();
					result += `const ${name}=${varName}.${name};`;
				}
			});

			return result;
		}
	);

	// 4. Replace dynamic import() with __require() calls
	code = code.replace(
		/import\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g,
		(match, quote, path) => {
			return `Promise.resolve(__require('${path}'))`;
		}
	);

	// 5. Replace import.meta.url with static path
	const moduleUrl = `file:///${modulePath}`;
	code = code.replace(/import\.meta\.url/g, JSON.stringify(moduleUrl));

	// 6. Replace import.meta.glob patterns (if any)
	code = code.replace(
		/import\.meta\.glob\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g,
		'{}' // Empty object - slides are loaded differently
	);

	// 7. Handle exports - convert to module.exports
	//    export { x, y } → module.exports.x = x; module.exports.y = y;
	code = code.replace(
		/export\s*\{([^}]+)\}\s*;?/g,
		(match, exports) => {
			return exports.split(',').map((exp: string) => {
				const parts = exp.trim().split(/\s+as\s+/);
				if (parts.length === 2) {
					return `module.exports.${parts[1].trim()}=${parts[0].trim()};`;
				}
				const name = parts[0].trim();
				return `module.exports.${name}=${name};`;
			}).join('');
		}
	);

	// 8. export default X → module.exports.default = X; module.exports = X;
	code = code.replace(
		/export\s+default\s+/g,
		'module.exports.default=module.exports='
	);

	// 9. export const/let/var → define then export
	code = code.replace(
		/export\s+(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
		(match, keyword, name) => {
			return `${keyword} ${name}=module.exports.${name}=`;
		}
	);

	// 10. export function/class
	code = code.replace(
		/export\s+(function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
		(match, keyword, name) => {
			return `${keyword} ${name}`;
		}
	);

	return code;
}

/**
 * Generate custom module system
 */
function generateModuleSystem(modules: Map<string, ModuleInfo>): string {
	const moduleEntries: string[] = [];

	for (const [modulePath, info] of modules.entries()) {
		const transformed = transformToCommonJS(info.code, modulePath);

		// Use JSON.stringify to properly escape all special characters
		// Then escape backticks which JSON.stringify doesn't handle
		const escaped = JSON.stringify(transformed).replace(/`/g, '\\`');

		moduleEntries.push(`    '${modulePath}': ${escaped}`);
	}

	return `
(function() {
  'use strict';

  // === Module Registry ===
  const __moduleCode = {
${moduleEntries.join(',\n')}
  };

  const __moduleCache = {};
  const __pendingModules = {};

  // === Custom Module Loader ===
  window.__require = function(modulePath) {
    // Normalize path
    let resolved = modulePath;
    if (!resolved.startsWith('./')) {
      resolved = './' + resolved;
    }

    // Return cached module
    if (__moduleCache[resolved]) {
      return __moduleCache[resolved];
    }

    // Check if module exists
    if (!__moduleCode[resolved]) {
      console.error('[Module Loader] Module not found:', resolved);
      console.error('[Module Loader] Available modules:', Object.keys(__moduleCode));
      throw new Error('Cannot find module: ' + resolved);
    }

    // Create module environment
    const module = { exports: {} };
    const exports = module.exports;

    // Execute module code
    try {
      // Create a bound version of __require that resolves paths relative to current module
      const moduleDir = resolved.substring(0, resolved.lastIndexOf('/'));
      const boundRequire = function(requestPath) {
        if (requestPath.startsWith('./') || requestPath.startsWith('../')) {
          // Resolve relative to the requesting module's directory
          const parts = (moduleDir + '/' + requestPath).split('/');
          const resolvedParts = [];
          for (const part of parts) {
            if (part === '..') {
              resolvedParts.pop();
            } else if (part !== '.' && part !== '') {
              resolvedParts.push(part);
            }
          }
          return window.__require('./' + resolvedParts.join('/'));
        }
        return window.__require(requestPath);
      };

      const moduleFunction = new Function(
        '__require',
        'module',
        'exports',
        'require',
        __moduleCode[resolved]
      );

      moduleFunction(boundRequire, module, exports, boundRequire);

      // Cache the result
      __moduleCache[resolved] = module.exports;

      return module.exports;
    } catch (error) {
      console.error('[Module Loader] Error loading module:', resolved);
      console.error('[Module Loader] Error details:', error);
      throw error;
    }
  };

  // === Dynamic Import Support ===
  // Override Vite's mapDeps function to prevent fetching
  window.__vite__mapDeps = function() { return []; };

  // Vite's preload helper: P(loader, deps, baseUrl)
  window.__vitePreload = function(loader, deps, baseUrl) {
    // In inline mode, just execute the loader
    // Dependencies are already embedded
    return Promise.resolve().then(() => {
      if (typeof loader === 'function') {
        return loader();
      }
      return loader;
    });
  };

  // Replace global P function (if exists)
  if (typeof window.P === 'undefined') {
    window.P = window.__vitePreload;
  }

  console.log('[Module Loader] Initialized with ${modules.size} modules');
  console.log('[Module Loader] Total size: ${
		(Array.from(modules.values()).reduce((sum, m) => sum + m.size, 0) / 1024 / 1024).toFixed(2)
	} MB');
})();
`;
}

/**
 * Inline all CSS files
 */
async function inlineCSS(
	app: App,
	html: string,
	baseDir: string,
): Promise<string> {
	const cssMatches = [...html.matchAll(/<link[^>]*href="\.\/([^"]+\.css)"[^>]*>/g)];

	for (const match of cssMatches) {
		const cssPath = match[1];
		const fullPath = `${baseDir}/${cssPath}`;

		try {
			const css = await app.vault.adapter.read(fullPath);

			// Replace link tag with style tag
			html = html.replace(
				match[0],
				`<style data-inline="${cssPath}">\n${css}\n</style>`
			);
		} catch (error) {
			console.warn(`Failed to inline CSS: ${cssPath}`, error);
		}
	}

	return html;
}

/**
 * Create single-file HTML bundle
 */
export async function createSingleFileHtml(
	app: App,
	htmlPath: string,
	onProgress?: (message: string) => void,
): Promise<BundleResult> {
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root unavailable');

	const baseDir = htmlPath.substring(0, htmlPath.lastIndexOf('/'));

	// Step 1: Collect all modules
	onProgress?.('Collecting JavaScript modules...');
	const modules = await collectModules(app, baseDir);
	console.log(`Collected ${modules.size} modules`);

	if (modules.size === 0) {
		throw new Error('No JavaScript modules found in build output');
	}

	// Step 2: Generate module system
	onProgress?.('Building custom module loader...');
	const moduleSystem = generateModuleSystem(modules);

	// Step 3: Load and transform HTML
	onProgress?.('Transforming HTML...');
	let html = await app.vault.adapter.read(htmlPath);

	// Step 4: Remove original script tags
	html = html.replace(
		/<script[^>]*\bsrc\s*=\s*["']\.\/assets\/[^"']+["'][^>]*><\/script>/g,
		''
	);

	// Also remove modulepreload links
	html = html.replace(
		/<link[^>]*\brel\s*=\s*["']modulepreload["'][^>]*>/g,
		''
	);

	// Step 5: Find entry point
	const entryModule = Array.from(modules.keys()).find(path =>
		path.includes('/index-') && !path.includes('modules/')
	);

	if (!entryModule) {
		throw new Error('Could not find entry module (index-*.js)');
	}

	// Step 6: Inject module system and entry point
	const initScript = `
<script type="text/javascript">
${moduleSystem}

// Bootstrap application
(function() {
  try {
    // Load entry module
    window.__require('${entryModule}');
  } catch (error) {
    console.error('[Bootstrap] Failed to load application:', error);
    document.body.innerHTML =
      '<div style="padding:2rem;font-family:monospace;color:#ff0000;">' +
      '<h2>Failed to load Slidev presentation</h2>' +
      '<p><strong>Error:</strong> ' + error.message + '</p>' +
      '<p>Check browser console for details.</p>' +
      '</div>';
  }
})();
</script>
`;

	html = html.replace('</head>', `${initScript}\n</head>`);

	// Step 7: Inline CSS
	onProgress?.('Inlining CSS files...');
	html = await inlineCSS(app, html, baseDir);

	// Step 8: Add inline mode marker
	html = html.replace(
		'<head>',
		'<head>\n  <meta name="slidev-bundle-mode" content="single-file-inline">'
	);

	// Step 9: Write output
	const outputPath = htmlPath.replace(/\.html$/, '-standalone.html');
	await app.vault.adapter.write(outputPath, html);

	const stat = await app.vault.adapter.stat(outputPath);

	onProgress?.('Single-file bundle created successfully');

	return {
		htmlPath: outputPath,
		size: stat?.size || html.length,
		moduleCount: modules.size,
	};
}

/**
 * Estimate bundle size before creating
 */
export async function estimateBundleSize(
	app: App,
	htmlPath: string,
): Promise<number> {
	const baseDir = htmlPath.substring(0, htmlPath.lastIndexOf('/'));
	const modules = await collectModules(app, baseDir);

	let totalSize = 0;

	// JS modules
	for (const module of modules.values()) {
		totalSize += module.size;
	}

	// HTML base
	const htmlStat = await app.vault.adapter.stat(htmlPath);
	if (htmlStat) totalSize += htmlStat.size;

	// CSS (estimate)
	totalSize += 100 * 1024; // ~100KB for CSS

	// Overhead for module system
	totalSize += 50 * 1024; // ~50KB overhead

	return totalSize;
}
