/**
 * Standalone HTML Bundler for Slidev Presentations
 *
 * This script generates single-file HTML bundles from Slidev presentations
 * that work under file:// protocol (double-click to view).
 *
 * Key Features:
 * - Transforms ES modules to CommonJS semantics
 * - Custom module loader (no native import())
 * - Inlines all JavaScript and CSS
 * - Fixed export transformation for Vue components
 *
 * Bug Fix (2026-06-16):
 * - Corrected export {X as default} transformation
 * - Now generates: module.exports.default=module.exports=X
 * - Previous bug only set module.exports.default=X
 * - This fix ensures Vue components load correctly
 *
 * Usage:
 *   node test-bundle-FIXED.js
 *
 * Output:
 *   docs/dist/index-standalone.html (~727KB)
 *
 * See docs/STANDALONE_BUNDLE_FIX.md for details.
 */

const fs = require('fs').promises;
const path = require('path');

const BASE_DIR = 'docs/dist';

async function loadModulesRecursive(dir, modules, prefix = '.') {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = `${prefix}/${entry.name}`;

    if (entry.isDirectory()) {
      await loadModulesRecursive(fullPath, modules, relativePath);
    } else if (entry.name.endsWith('.js')) {
      const code = await fs.readFile(fullPath, 'utf-8');
      // Register with path relative to assets/ directory (strip ./assets/ prefix if present)
      modules.set(relativePath, { code, size: code.length });
    }
  }
}

function transformToCommonJS(code, modulePath) {
  // Transform ES6 imports to CommonJS
  code = code.replace(/import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']\s*;?/g,
    (match, imports, modPath) => {
      const varName = `__imp_${Math.random().toString(36).substr(2, 9)}`;
      let result = `const ${varName}=__require('${modPath}');`;
      imports.split(',').forEach(imp => {
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

  code = code.replace(/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*["']([^"']+)["']\s*;?/g,
    (m, name, p) => `const ${name}=__require('${p}').default||__require('${p}');`);

  code = code.replace(/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']\s*;?/g,
    (m, defName, namedImports, p) => {
      const varName = `__imp_${Math.random().toString(36).substr(2, 9)}`;
      let result = `const ${varName}=__require('${p}');const ${defName}=${varName}.default||${varName};`;
      namedImports.split(',').forEach(imp => {
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

  // For dynamic imports, resolve relative paths at transform time
  // Extract the directory of the current module for path resolution
  const moduleDir = modulePath.substring(0, modulePath.lastIndexOf('/')) || '.';

  code = code.replace(/import\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g,
    (m, q, importPath) => {
      let resolvedPath = importPath;

      // If it's a relative import, resolve it relative to the current module
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const parts = (moduleDir + '/' + importPath).split('/');
        const resolvedParts = [];
        for (const part of parts) {
          if (part === '..') {
            resolvedParts.pop();
          } else if (part !== '.' && part !== '') {
            resolvedParts.push(part);
          }
        }
        resolvedPath = './' + resolvedParts.join('/');
      }

      return `Promise.resolve(window.__require('${resolvedPath}'))`;
    });

  code = code.replace(/import\.meta\.url/g, '""');
  code = code.replace(/import\.meta\.glob\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g, '{}');

  // Transform exports
  code = code.replace(/export\s*\{([^}]+)\}\s*;?/g,
    (m, exports) => exports.split(',').map(e => {
      const parts = e.trim().split(/\s+as\s+/);
      if (parts.length === 2) {
        const exportName = parts[1].trim();
        const localName = parts[0].trim();
        // For default exports, also set module.exports directly
        if (exportName === 'default') {
          return `module.exports.default=module.exports=${localName};`;
        }
        return `module.exports.${exportName}=${localName};`;
      }
      return `module.exports.${parts[0].trim()}=${parts[0].trim()};`;
    }).join(''));

  code = code.replace(/export\s+default\s+/g, 'module.exports.default=module.exports=');

  code = code.replace(/export\s+(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
    (m, kw, name) => `${kw} ${name}=module.exports.${name}=`);

  code = code.replace(/export\s+(function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    (m, kw, name) => `${kw} ${name}`);

  // Remove modulepreload polyfill
  code = code.replace(
    /\(function\(\)\{let e=document\.createElement\(`link`\)\.relList[\s\S]*?fetch\(e\.href,n\)\}\}\)\(\);?/,
    ''
  );

  // Patch the CSS preload function to skip CSS files (they're inlined)
  // Look for patterns like: o.rel=r?`stylesheet`:qt and modify to always skip CSS
  code = code.replace(
    /(let\s+\w+=t\.endsWith\(["'`]\.css["'`]\);)/g,
    '$1if($1)return Promise.resolve();' // Skip CSS files immediately
  );

  // Also patch the preload function to not create link elements for CSS
  code = code.replace(
    /(if\s*\(n\)\s*for\s*\(let\s+n=e\.length-1;n>=0;n--\)\{let\s+i=e\[n\];if\(i\.href===t&&\(!r\|\|i\.rel===["'`]stylesheet["'`]\)\)return\})/g,
    'if(t.endsWith(".css"))return;$1'
  );

  // Instead of trying to match the complex P function with regex,
  // let's just simplify it by finding and replacing the entire function body
  // P function starts with ,P=function(e,t,n){ and we want to replace it with a simple version

  // Find the P function and replace it
  const pFunctionStart = ',P=function(e,t,n){';
  const pStartIdx = code.indexOf(pFunctionStart);

  if (pStartIdx !== -1) {
    // The P function is complex, ends with .catch(i)})},
    // Let's find it by looking for the next comma followed by a capital letter (next variable)
    const searchFrom = pStartIdx + pFunctionStart.length;
    const nextVarPattern = /},([A-Z][a-z]*=)/;
    const nextVarMatch = code.substring(searchFrom).match(nextVarPattern);

    if (nextVarMatch) {
      const pEndIdx = searchFrom + nextVarMatch.index + 1; // Include the }
      const before = code.substring(0, pStartIdx);
      const after = code.substring(pEndIdx);
      code = before + ',P=function(e,t,n){return Promise.resolve().then(e)}' + after;
    }
  }

  return code;
}

async function createStandaloneBundle() {
  console.log('📦 Creating standalone bundle...\n');

  // Load all modules
  const modules = new Map();
  await loadModulesRecursive(path.join(BASE_DIR, 'assets'), modules);

  console.log(`   Loaded ${modules.size} modules`);

  // Find entry module early
  const entryModule = Array.from(modules.keys()).find(p =>
    p.includes('/index-') && !p.includes('modules/')
  );

  if (!entryModule) {
    throw new Error('Entry module not found');
  }

  console.log(`   Entry module: ${entryModule}`);

  // Transform modules and build object
  const moduleCodeObject = {};
  for (const [modulePath, { code }] of modules.entries()) {
    let transformed = transformToCommonJS(code, modulePath);

    // For entry module, expose Xt as global
    if (modulePath === entryModule) {
      // Replace Xt=Array(n) with Xt=window.Xt=Array(n)
      transformed = transformed.replace(/([,;])Xt=Array\((\d+)\)/g, '$1Xt=window.Xt=Array($2)');
    }

    moduleCodeObject[modulePath] = transformed;
  }

  // JSON.stringify the ENTIRE object at once - this properly escapes everything
  let moduleCodeJSON = JSON.stringify(moduleCodeObject);

  // JSON.stringify should escape newlines as \n, but verify
  let lfCount = 0;
  for (let i = 0; i < moduleCodeJSON.length; i++) {
    if (moduleCodeJSON.charCodeAt(i) === 0x0a) lfCount++;
  }
  if (lfCount > 0) {
    console.log('  ⚠️  WARNING: Found', lfCount, 'actual LF characters in JSON! Fixing...');
    // This shouldn't happen with JSON.stringify, but if it does, fix it
    moduleCodeJSON = moduleCodeJSON.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }

  // Fix </script> tags in the JSON
  const safeModuleCodeJSON = moduleCodeJSON.replace(/<\/script>/gi, '<\\/script>');

  // Build the module system with the JSON object
  const moduleSystem =
'(function() {\n' +
'  "use strict";\n' +
'  // Stub CSS preloading since all CSS is inlined\n' +
'  window.__cssModules = new Set();\n' +
'  window.__cssPreload = function(href) {\n' +
'    // All CSS already inlined, no need to load\n' +
'    return Promise.resolve();\n' +
'  };\n' +
'  // Polyfill for URL resolution when base is empty (from import.meta.url)\n' +
'  var _origURL = window.URL;\n' +
'  window.URL = function(url, base) {\n' +
'    // If base is empty or undefined, use current location\n' +
'    if (!base || base === "") {\n' +
'      base = window.location.href;\n' +
'    }\n' +
'    return new _origURL(url, base);\n' +
'  };\n' +
'  window.URL.prototype = _origURL.prototype;\n' +
'  window.URL.createObjectURL = _origURL.createObjectURL;\n' +
'  window.URL.revokeObjectURL = _origURL.revokeObjectURL;\n' +
'  // Wrap localStorage/sessionStorage to handle security errors\n' +
'  (function() {\n' +
'    var _memStorage = {};\n' +
'    var _useMem = false;\n' +
'    var origLS = window.localStorage;\n' +
'    var safeLS = {\n' +
'      getItem: function(key) {\n' +
'        if (_useMem) return _memStorage[key] || null;\n' +
'        try { return origLS.getItem(key); }\n' +
'        catch(e) { _useMem = true; return _memStorage[key] || null; }\n' +
'      },\n' +
'      setItem: function(key, value) {\n' +
'        if (_useMem) { _memStorage[key] = String(value); return; }\n' +
'        try { origLS.setItem(key, value); }\n' +
'        catch(e) { _useMem = true; _memStorage[key] = String(value); }\n' +
'      },\n' +
'      removeItem: function(key) {\n' +
'        if (_useMem) { delete _memStorage[key]; return; }\n' +
'        try { origLS.removeItem(key); }\n' +
'        catch(e) { _useMem = true; delete _memStorage[key]; }\n' +
'      },\n' +
'      clear: function() {\n' +
'        if (_useMem) { _memStorage = {}; return; }\n' +
'        try { origLS.clear(); }\n' +
'        catch(e) { _useMem = true; _memStorage = {}; }\n' +
'      },\n' +
'      key: function(i) {\n' +
'        if (_useMem) return Object.keys(_memStorage)[i] || null;\n' +
'        try { return origLS.key(i); }\n' +
'        catch(e) { _useMem = true; return Object.keys(_memStorage)[i] || null; }\n' +
'      },\n' +
'      get length() {\n' +
'        if (_useMem) return Object.keys(_memStorage).length;\n' +
'        try { return origLS.length; }\n' +
'        catch(e) { _useMem = true; return Object.keys(_memStorage).length; }\n' +
'      }\n' +
'    };\n' +
'    try {\n' +
'      Object.defineProperty(window, "localStorage", {\n' +
'        get: function() { return safeLS; },\n' +
'        configurable: true\n' +
'      });\n' +
'    } catch(e) {\n' +
'      // If we cannot redefine, at least try to monkey-patch methods\n' +
'      try {\n' +
'        window.localStorage.getItem = safeLS.getItem;\n' +
'        window.localStorage.setItem = safeLS.setItem;\n' +
'      } catch(e2) {}\n' +
'    }\n' +
'  })();\n' +
'  var __moduleCode = ' + safeModuleCodeJSON + ';\n' +
'  var __moduleCache = {};\n' +
'  window.__require = function(modulePath) {\n' +
'    var resolved = modulePath;\n' +
'    if (!resolved.startsWith("./")) {\n' +
'      resolved = "./" + resolved;\n' +
'    }\n' +
'    if (__moduleCache[resolved]) {\n' +
'      return __moduleCache[resolved];\n' +
'    }\n' +
'    if (!__moduleCode[resolved]) {\n' +
'      console.error("[Module Loader] Module not found:", resolved);\n' +
'      throw new Error("Cannot find module: " + resolved);\n' +
'    }\n' +
'    var module = { exports: {} };\n' +
'    var exports = module.exports;\n' +
'    try {\n' +
'      var moduleDir = resolved.substring(0, resolved.lastIndexOf("/"));\n' +
'      var boundRequire = function(requestPath) {\n' +
'        if (requestPath.startsWith("./") || requestPath.startsWith("../")) {\n' +
'          var parts = (moduleDir + "/" + requestPath).split("/");\n' +
'          var resolvedParts = [];\n' +
'          for (var i = 0; i < parts.length; i++) {\n' +
'            var part = parts[i];\n' +
'            if (part === "..") {\n' +
'              resolvedParts.pop();\n' +
'            } else if (part !== "." && part !== "") {\n' +
'              resolvedParts.push(part);\n' +
'            }\n' +
'          }\n' +
'          return window.__require("./" + resolvedParts.join("/"));\n' +
'        }\n' +
'        return window.__require(requestPath);\n' +
'      };\n' +
'      var moduleFunction = new Function(\n' +
'        "__require",\n' +
'        "module",\n' +
'        "exports",\n' +
'        "require",\n' +
'        __moduleCode[resolved]\n' +
'      );\n' +
'      moduleFunction(boundRequire, module, exports, boundRequire);\n' +
'      \n' +
'      __moduleCache[resolved] = module.exports;\n' +
'      return module.exports;\n' +
'    }\n' +
'    catch (error) {\n' +
'      console.error("[Module Loader] Error loading:", resolved, error);\n' +
'      throw error;\n' +
'    }\n' +
'  };\n' +
'  window.__vite__mapDeps = function() { return []; };\n' +
'  window.__vitePreload = function(loader) {\n' +
'    return Promise.resolve().then(function() {\n' +
'      var result = typeof loader === "function" ? loader() : loader;\n' +
'      return result;\n' +
'    }).then(function(module) {\n' +
'      return module;\n' +
'    });\n' +
'  };\n' +
'  if (typeof window.P === "undefined") {\n' +
'    window.P = window.__vitePreload;\n' +
'  }\n' +
'  \n' +
'  window.__require("' + entryModule + '");\n' +
'})();';

  // DEBUG: Write moduleSystem to file
  await fs.writeFile('/tmp/moduleSystem.txt', moduleSystem);
  console.log('  Wrote moduleSystem to /tmp/moduleSystem.txt');

  // DEBUG: Count LF in moduleSystem's JSON part
  const msJsonStart = moduleSystem.indexOf(' = ') + 3;
  const msJsonEnd = moduleSystem.lastIndexOf(';\n  var __moduleCache');
  const msJson = moduleSystem.substring(msJsonStart, msJsonEnd);
  let msJsonLF = 0;
  for (let i = 0; i < msJson.length; i++) {
    if (msJson.charCodeAt(i) === 0x0a) msJsonLF++;
  }
  console.log('  moduleSystem JSON part LF:', msJsonLF, '(should be 0)');

  // Validate moduleSystem
  let msLF = 0;
  for (let i = 0; i < moduleSystem.length; i++) {
    if (moduleSystem.charCodeAt(i) === 0x0a) msLF++;
  }
  console.log('  Module system LF count:', msLF, '(expected: some for formatting)');

  // Check if JSON part has LF
  const jsonStart = moduleSystem.indexOf('{');
  const jsonEnd = moduleSystem.lastIndexOf('}') + 1;
  const jsonPart = moduleSystem.substring(jsonStart, jsonEnd);
  let jsonLF = 0;
  for (let i = 0; i < jsonPart.length; i++) {
    if (jsonPart.charCodeAt(i) === 0x0a) jsonLF++;
  }
  console.log('  JSON part LF count:', jsonLF, '(expected: 0)');
  if (jsonLF > 0) {
    console.log('  ⚠️  ERROR: JSON has actual newlines!');
  }

  // Load HTML
  let html = await fs.readFile(path.join(BASE_DIR, 'index.html'), 'utf-8');

  // Remove script tags
  html = html.replace(
    /<script[^>]*\bsrc\s*=\s*["']\.\/assets\/[^"']+["'][^>]*><\/script>/g,
    ''
  );
  html = html.replace(
    /<link[^>]*\brel\s*=\s*["']modulepreload["'][^>]*>/g,
    ''
  );

  console.log(`   Using entry module: ${entryModule}`);

  // Build init script using string concatenation
  const initScript =
'\n<script type="text/javascript">\n' +
moduleSystem + '\n\n' +
'(function() {\n' +
'  try {\n' +
'    console.log("[Bootstrap] Loading entry module: ' + entryModule + '");\n' +
'    var entryExports = window.__require("' + entryModule + '");\n' +
'    console.log("[Bootstrap] Entry module loaded successfully");\n' +
'  } catch (error) {\n' +
'    console.error("[Bootstrap] Failed:", error);\n' +
'    console.error("[Bootstrap] Stack:", error.stack);\n' +
'    document.body.innerHTML =\n' +
'      "<div style=\\"padding:2rem;font-family:monospace;color:#ff0000;\\">" +\n' +
'      "<h2>Failed to load Slidev presentation</h2>" +\n' +
'      "<p><strong>Error:</strong> " + error.message + "</p>" +\n' +
'      "<pre>" + error.stack + "</pre>" +\n' +
'      "<p>Check browser console for details.</p>" +\n' +
'      "</div>";\n' +
'  }\n' +
'})();\n' +
'</script>\n';

  // DEBUG: Check initScript
  const initScriptModuleCodeStart = initScript.indexOf('var __moduleCode = ') + 'var __moduleCode = '.length;
  const initScriptModuleCodeEnd = initScript.indexOf(';\n  var __moduleCache', initScriptModuleCodeStart);
  const initScriptModuleCode = initScript.substring(initScriptModuleCodeStart, initScriptModuleCodeEnd);

  let initScriptLF = 0;
  for (let i = 0; i < initScriptModuleCode.length; i++) {
    if (initScriptModuleCode.charCodeAt(i) === 0x0a) initScriptLF++;
  }
  console.log('  initScript moduleCode LF:', initScriptLF, '(should be 0)');

  // DEBUG: Write initScript to file
  await fs.writeFile('/tmp/initScript.txt', initScript);

  // CRITICAL: Escape $ characters in initScript for use in String.replace()
  // In replacement strings, $ has special meaning ($$ = literal $, $& = matched text, etc.)
  const escapedInitScript = initScript.replace(/\$/g, '$$$$'); // Each $ becomes $$$$

  // Insert script at end of body instead of head, so #app element exists when script runs
  html = html.replace('</body>', escapedInitScript + '\n</body>');

  // Inline CSS from <link> tags
  const cssMatches = [...html.matchAll(/<link[^>]*href="\.\/([^"]+\.css)"[^>]*>/g)];
  for (const match of cssMatches) {
    const cssPath = match[1];
    try {
      const css = await fs.readFile(path.join(BASE_DIR, cssPath), 'utf-8');
      html = html.replace(match[0], '<style>\n' + css + '\n</style>');
    } catch (error) {
      console.warn(`   Failed to inline CSS: ${cssPath}`);
    }
  }

  // Also inline CSS files referenced in module code (__vite__mapDeps)
  const cssFilesInModules = new Set();
  for (const [modulePath, { code }] of modules.entries()) {
    // Find CSS references in module code (typically in __vite__mapDeps arrays)
    const cssRefs = code.match(/[\"']\.\/([\w\/-]+\.css)[\"']/g);
    if (cssRefs) {
      for (const ref of cssRefs) {
        const cssFile = ref.slice(2, -1); // Remove quotes and ./
        cssFilesInModules.add(cssFile);
      }
    }
  }

  // Inline all CSS files found in modules
  let inlinedCssStyles = '';
  for (const cssFile of cssFilesInModules) {
    try {
      const cssPath = path.join(BASE_DIR, 'assets', cssFile);
      const css = await fs.readFile(cssPath, 'utf-8');
      inlinedCssStyles += `\n/* ${cssFile} */\n${css}\n`;
    } catch (error) {
      console.warn(`   Failed to inline referenced CSS: ${cssFile}`);
    }
  }

  if (inlinedCssStyles) {
    html = html.replace('</head>', `<style>${inlinedCssStyles}</style>\n</head>`);
    console.log(`   Inlined ${cssFilesInModules.size} CSS files from module references`);
  }

  // Add marker
  html = html.replace('<head>', '<head>\n  <meta name="slidev-bundle-mode" content="single-file-inline">');

  // DEBUG: Check HTML before writing
  const htmlScriptStart = html.indexOf('<script type="text/javascript">');
  const htmlScriptEnd = html.indexOf('</script>', htmlScriptStart);
  const htmlScript = html.substring(htmlScriptStart + '<script type="text/javascript">'.length, htmlScriptEnd);

  const htmlModuleCodeStart = htmlScript.indexOf('var __moduleCode = ') + 'var __moduleCode = '.length;
  const htmlModuleCodeEnd = htmlScript.indexOf(';\n  var __moduleCache', htmlModuleCodeStart);
  const htmlModuleCode = htmlScript.substring(htmlModuleCodeStart, htmlModuleCodeEnd);

  let htmlModuleLF = 0;
  for (let i = 0; i < htmlModuleCode.length; i++) {
    if (htmlModuleCode.charCodeAt(i) === 0x0a) htmlModuleLF++;
  }
  console.log('  HTML moduleCode LF before write:', htmlModuleLF, '(should be 0)');

  // Write output
  const outputPath = path.join(BASE_DIR, 'index-standalone.html');
  await fs.writeFile(outputPath, html);

  const stats = await fs.stat(outputPath);
  console.log(`\n✅ Created: ${outputPath}`);
  console.log(`📦 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\n🌐 Open in browser: file://${path.resolve(outputPath)}`);
}

createStandaloneBundle().catch(console.error);
