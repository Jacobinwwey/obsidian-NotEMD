#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const { spawnSyncWithCommandResolution } = require('./lib/cross-platform-command.js');
const {
  MANIFEST_SCHEMA_VERSION,
  buildExamplePlans,
  buildManifestEntry,
  collectCleanupPaths,
  renderExampleInput,
  sanitizeDiagnostic,
  validateManifest
} = require('./lib/diagram-examples-runtime.js');
const { loadExecutableDiagramExampleSummaries } = require('./lib/diagram-examples-catalog.js');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_ROOT = 'docs/diagram-examples';
const DEFAULT_VAULT_ROOT = 'E:\\1Knowledge';
const DEFAULT_VAULT_PREFIX = 'notemd-real-diagram-examples';
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function normalizeLogicalPath(value) {
  return String(value).replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
}

function isWithinRoot(candidate, root) {
  const normalizedCandidate = normalizeLogicalPath(candidate);
  const normalizedRoot = normalizeLogicalPath(root);
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}/`);
}

function assertVaultPath(vaultPath, vaultPrefix) {
  const normalized = normalizeLogicalPath(vaultPath);
  const prefix = normalizeLogicalPath(vaultPrefix);
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized) || normalized.startsWith('//')
    || normalized.split('/').includes('..') || !isWithinRoot(normalized, prefix)) {
    throw new Error(`Vault path "${normalized}" is outside the dedicated diagram examples prefix.`);
  }
  return normalized;
}

function containsPortableAbsolutePath(value) {
  if (typeof value === 'string') {
    const normalized = value.replace(/\\/g, '/');
    return normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized) || normalized.startsWith('//');
  }
  if (Array.isArray(value)) return value.some(containsPortableAbsolutePath);
  if (value && typeof value === 'object') return Object.values(value).some(containsPortableAbsolutePath);
  return false;
}

function asBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (value instanceof ArrayBuffer) return Buffer.from(new Uint8Array(value));
  return Buffer.from(String(value ?? ''), 'utf8');
}

function asText(value) {
  return asBuffer(value).toString('utf8');
}

function renderChineseArtifactMarkdown(content, plan) {
  if (plan?.targetExtension !== '.md') return null;

  const title = String(plan.titleZh || plan.title || plan.typeId || 'Diagram example').trim();
  const previewNote = '> 使用 Notemd 的“预览图表”命令查看此图表。';
  const source = asText(content).replace(/\r\n/g, '\n').trimEnd();
  const lines = source.split('\n');
  const headingIndex = lines.findIndex(line => /^#\s+/.test(line));
  let previewNoteFound = false;

  if (headingIndex >= 0) {
    lines[headingIndex] = `# ${title}`;
  } else {
    lines.unshift(`# ${title}`, '', previewNote, '');
    previewNoteFound = true;
  }

  const localizedLines = lines.map(line => {
    if (line.trim() === '> Preview this chart using the "Preview diagram" command in Notemd.') {
      previewNoteFound = true;
      return previewNote;
    }
    return line;
  });

  if (headingIndex >= 0 && !previewNoteFound) {
    localizedLines.splice(headingIndex + 1, 0, '', previewNote);
  }

  return `${localizedLines.join('\n').replace(/\n+$/, '')}\n`;
}

function sha256(value) {
  return crypto.createHash('sha256').update(asBuffer(value)).digest('hex');
}

function isSvg(value) {
  return typeof value === 'string' && /<svg\b/i.test(value) && /<\/svg>/i.test(value);
}

function isPng(value) {
  const bytes = asBuffer(value);
  return bytes.length >= PNG_SIGNATURE.length && bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

function parseWrapperSourceArtifact(wrapperPath, wrapperContent) {
  const match = String(wrapperContent).match(/^Source artifact:\s*\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/mi);
  if (!match) return null;
  const link = normalizeLogicalPath(match[1]);
  const directory = path.posix.dirname(normalizeLogicalPath(wrapperPath));
  return normalizeLogicalPath(path.posix.join(directory, link));
}

function parseWrapperVisualLinks(wrapperPath, wrapperContent) {
  const directory = path.posix.dirname(normalizeLogicalPath(wrapperPath));
  const links = [];
  const expression = /!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let match;
  while ((match = expression.exec(String(wrapperContent))) !== null) {
    const link = normalizeLogicalPath(match[1]);
    if (/\.(?:svg|png)$/i.test(link)) {
      links.push(normalizeLogicalPath(path.posix.join(directory, link)));
    }
  }
  return links;
}

async function tryReadVaultFile(dependencies, vaultPath) {
  try {
    const content = await dependencies.readVaultFile(vaultPath);
    return content == null ? null : content;
  } catch {
    return null;
  }
}

async function resolveSavedArtifact(result, plan, dependencies, cleanupPaths) {
  const returnedPath = result?.outputPath || result?.followThrough?.outputPath;
  if (typeof returnedPath !== 'string' || returnedPath.trim().length === 0) {
    throw new Error('Diagram generation returned no saved output path.');
  }

  const wrapperPath = assertVaultPath(returnedPath, dependencies.vaultPrefix);
  cleanupPaths.push(wrapperPath);
  const wrapperContent = await dependencies.readVaultFile(wrapperPath);
  let artifactPath = wrapperPath;
  let artifactContent = wrapperContent;
  const linkedArtifact = parseWrapperSourceArtifact(wrapperPath, asText(wrapperContent));
  const linkedVisuals = parseWrapperVisualLinks(wrapperPath, asText(wrapperContent));
  if (linkedArtifact) {
    artifactPath = assertVaultPath(linkedArtifact, dependencies.vaultPrefix);
    cleanupPaths.push(artifactPath);
    artifactContent = await dependencies.readVaultFile(artifactPath);
  }

  const sourceDirectory = path.posix.dirname(normalizeLogicalPath(plan.inputPath));
  if (!isWithinRoot(artifactPath, sourceDirectory)) {
    throw new Error('Saved diagram artifact is not beside the temporary source note.');
  }

  return {
    artifactPath,
    artifactContent,
    wrapperPath: linkedArtifact ? wrapperPath : null,
    visualCandidates: [
      ...linkedVisuals,
      `${artifactPath}.svg`,
      `${artifactPath}.png`
    ].map(candidate => assertVaultPath(candidate, dependencies.vaultPrefix))
  };
}

async function registerGeneratedOutputPaths(result, dependencies, cleanupPaths) {
  const returnedPath = result?.outputPath || result?.followThrough?.outputPath;
  if (typeof returnedPath !== 'string' || returnedPath.trim().length === 0) return;

  const normalizedReturnedPath = assertVaultPath(returnedPath, dependencies.vaultPrefix);
  cleanupPaths.push(normalizedReturnedPath);
  cleanupPaths.push(`${normalizedReturnedPath}.svg`, `${normalizedReturnedPath}.png`);
  try {
    const wrapperContent = await dependencies.readVaultFile(normalizedReturnedPath);
    const linkedArtifact = parseWrapperSourceArtifact(normalizedReturnedPath, asText(wrapperContent));
    if (linkedArtifact) {
      cleanupPaths.push(assertVaultPath(linkedArtifact, dependencies.vaultPrefix));
      cleanupPaths.push(`${linkedArtifact}.svg`, `${linkedArtifact}.png`);
    }
    cleanupPaths.push(...parseWrapperVisualLinks(normalizedReturnedPath, asText(wrapperContent)));
  } catch {
    // The returned path is still registered; cleanup will safely ignore a missing file.
  }
}

function resolveCompanionCandidates(result, artifactPath, vaultPrefix) {
  const companions = result?.generation?.artifact?.companions;
  if (!Array.isArray(companions)) return [];
  const directory = path.posix.dirname(artifactPath);
  const target = result?.followThrough?.artifactTarget || result?.generation?.artifact?.target;
  const scope = target === 'drawnix' ? `${artifactPath}.assets` : directory;
  return companions.flatMap(companion => {
    if (!companion || typeof companion.path !== 'string') return [];
    const relative = normalizeLogicalPath(companion.path);
    return [assertVaultPath(path.posix.join(scope, relative), vaultPrefix)];
  });
}

function buildMachineTestRecord(entry, plan, result, cleanupCompleted, visualSource) {
  const outputPath = result?.outputPath || result?.followThrough?.outputPath || null;
  return {
    schemaVersion: 1,
    typeId: plan.typeId,
    fixtureId: plan.fixtureId,
    title: plan.title,
    requested: {
      typeId: plan.typeId,
      renderTarget: plan.target,
      compatibilityMode: 'best-fit',
      targetLanguage: 'en'
    },
    status: entry.status,
    sourceNotePath: plan.inputPath,
    outputPath: typeof outputPath === 'string' && !/^(?:[A-Za-z]:[\\/]|\\\\|\/)/.test(outputPath)
      ? normalizeLogicalPath(outputPath)
      : null,
    artifactPath: entry.artifactPath,
    svgPath: entry.svgPath,
    pngPath: entry.pngPath,
    providerId: entry.providerId,
    model: entry.model,
    generatedAt: entry.generatedAt,
    artifactSha256: entry.artifactSha256,
    svgSha256: entry.svgSha256,
    pngSha256: entry.pngSha256,
    visualSource: visualSource || null,
    cleanupCompleted,
    diagnostic: entry.diagnostic
  };
}

function renderExamplesReadme(summaries, entries, language) {
  const entriesByType = new Map(entries.map(entry => [entry.typeId, entry]));
  const chinese = language === 'zh-CN';
  const lines = chinese
    ? [
      '# 图表示例与实机证据',
      '',
      '语言：[English](./README.md) | **简体中文**',
      '',
      '这里的示例由运行中的 Notemd 插件和已配置 provider 实测生成。它们与 [静态 fixture gallery](../diagram-gallery.zh-CN.md) 分开：gallery 证明确定性预览覆盖，本目录记录真实 Vault 实测证据。',
      '',
      '- [机器可读 manifest](./manifest.json)',
      '- 输入笔记同时提供英文和简体中文版本。',
      '- `passed` 表示真实 provider 运行完成并复制了至少一个 Artifact/视觉结果。`failed` 和 `unavailable` 会保留为明确限制。',
      '- 运行结束后，生成器会清理专属临时 Vault 前缀；不会删除用户已有笔记。',
      '',
      '## 示例目录',
      ''
    ]
    : [
      '# Diagram Examples And Real-Vault Evidence',
      '',
      'Language: **English** | [简体中文](./README.zh-CN.md)',
      '',
      'These examples were generated through the running Notemd plugin with the configured provider. They are separate from the [static fixture gallery](../diagram-gallery.md): the gallery proves deterministic preview coverage, while this directory records real-vault evidence from each run.',
      '',
      '- [Machine-readable manifest](./manifest.json)',
      '- Every input is available in English and Simplified Chinese.',
      '- `passed` means the provider-backed run completed and copied at least one artifact or visual result. `failed` and `unavailable` remain explicit limitations.',
      '- The generator cleans its dedicated temporary Vault prefix after each run and never removes pre-existing user notes.',
      '',
      '## Example Directory',
      ''
    ];

  for (const summary of summaries) {
    const entry = entriesByType.get(summary.typeId);
    const status = entry?.status || 'unavailable';
    const title = chinese ? summary.titleZh || summary.title : summary.title;
    const inputLabel = chinese ? '中文输入' : 'English input';
    const inputPath = chinese ? 'input.zh-CN.md' : 'input.md';
    lines.push(`### [${title}](./${summary.typeId}/${inputPath})`);
    lines.push('');
    lines.push(chinese
      ? `- 类型：\`${summary.typeId}\`；target：\`${summary.target}\`；状态：\`${status}\``
      : `- Type: \`${summary.typeId}\`; target: \`${summary.target}\`; status: \`${status}\``);
    lines.push(`- [${inputLabel}](./${summary.typeId}/${inputPath})`);
    if (entry?.svgPath) lines.push(`- [${chinese ? 'SVG 结果' : 'SVG result'}](./${summary.typeId}/result.svg)`);
    if (entry?.pngPath) lines.push(`- ![${title}](./${summary.typeId}/result.png)`);
    if (entry?.diagnostic) lines.push(`- ${chinese ? '诊断' : 'Diagnostic'}: ${entry.diagnostic}`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

async function runSingleExample(plan, dependencies) {
  const generatedAt = dependencies.now();
  const vaultPrefix = dependencies.vaultPrefix || path.posix.dirname(normalizeLogicalPath(plan.inputPath));
  const cleanupPaths = [];
  let result = null;
  let artifactPath = null;
  let svgPath = null;
  let pngPath = null;
  let artifactSha256 = null;
  let svgSha256 = null;
  let pngSha256 = null;
  let visualSource = null;
  let status = 'failed';
  let diagnostic = null;
  let providerId = dependencies.providerSummary?.providerId ?? null;
  let model = dependencies.providerSummary?.model ?? null;

  try {
    const englishInput = renderExampleInput(plan, 'en');
    const chineseInput = renderExampleInput(plan, 'zh-CN');
    await dependencies.writeOutputFile(plan.outputInputPath, englishInput);
    await dependencies.writeOutputFile(plan.outputInputZhPath, chineseInput);
    await dependencies.createVaultFile(plan.inputPath, englishInput);
    cleanupPaths.push(plan.inputPath);

    const request = {
      sourcePath: plan.inputPath,
      executionMode: 'save-artifact',
      requestedTypeId: plan.typeId,
      requestedRenderTarget: plan.target,
      compatibilityMode: 'best-fit',
      targetLanguage: 'en'
    };
    result = await dependencies.invokeDiagramGenerate(request);
    if (!result || result.kind !== 'success') {
      throw new Error(result?.errorMessage || 'Diagram generation returned an unsuccessful result.');
    }

    await registerGeneratedOutputPaths(result, { ...dependencies, vaultPrefix }, cleanupPaths);

    const returnedTarget = result.followThrough?.artifactTarget || result.generation?.artifact?.target;
    if (returnedTarget !== plan.target) {
      throw new Error(`Generated target "${String(returnedTarget)}" does not match requested target "${plan.target}".`);
    }

    const saved = await resolveSavedArtifact(result, plan, { ...dependencies, vaultPrefix }, cleanupPaths);
    cleanupPaths.push(...resolveCompanionCandidates(result, saved.artifactPath, vaultPrefix));
    cleanupPaths.push(...saved.visualCandidates);
    artifactPath = `${plan.directory}/artifact${plan.targetExtension}`;
    const artifactBytes = asBuffer(saved.artifactContent);
    await dependencies.writeOutputFile(artifactPath, artifactBytes);
    const artifactChinese = renderChineseArtifactMarkdown(artifactBytes, plan);
    if (artifactChinese !== null) {
      await dependencies.writeOutputFile(`${plan.directory}/artifact.zh-CN.md`, artifactChinese);
    }
    artifactSha256 = sha256(artifactBytes);

    let svgContent = null;
    for (const candidate of saved.visualCandidates) {
      const content = await tryReadVaultFile(dependencies, candidate);
      if (isSvg(asText(content))) {
        svgContent = asText(content);
        visualSource = 'vault-companion';
        break;
      }
      if (isPng(content) && !pngPath) {
        pngPath = `${plan.directory}/result.png`;
        await dependencies.writeOutputFile(pngPath, asBuffer(content));
        pngSha256 = sha256(content);
        visualSource = 'vault-companion';
      }
    }

    if (!svgContent && dependencies.renderPreviewSvg && result.generation?.artifact) {
      svgContent = await dependencies.renderPreviewSvg(result.generation.artifact);
      if (svgContent) visualSource = 'operation-preview';
    }
    if (isSvg(svgContent)) {
      if (typeof dependencies.assertPreviewSvgPresentationSafety === 'function') {
        await dependencies.assertPreviewSvgPresentationSafety(svgContent, `Diagram example "${plan.fixtureId}"`);
      }
      svgPath = `${plan.directory}/result.svg`;
      await dependencies.writeOutputFile(svgPath, svgContent);
      svgSha256 = sha256(svgContent);
    }

    if (!pngPath && svgContent && dependencies.renderPreviewPng) {
      const png = await dependencies.renderPreviewPng(svgContent);
      if (!isPng(png)) {
        throw new Error('Preview PNG renderer returned an invalid PNG.');
      }
      pngPath = `${plan.directory}/result.png`;
      await dependencies.writeOutputFile(pngPath, asBuffer(png));
      pngSha256 = sha256(png);
    }

    status = 'passed';
  } catch (error) {
    status = error && error.unavailable ? 'unavailable' : 'failed';
    diagnostic = sanitizeDiagnostic(error);
  }

  let cleanupCompleted = true;
  let cleanupDiagnostic = null;
  try {
    const safePaths = collectCleanupPaths(cleanupPaths, vaultPrefix);
    for (const cleanupPath of [...new Set(safePaths)].reverse()) {
      await dependencies.deleteVaultFile(cleanupPath);
    }
  } catch (error) {
    cleanupCompleted = false;
    cleanupDiagnostic = sanitizeDiagnostic(error);
    if (status === 'passed') status = 'failed';
    diagnostic = diagnostic ? `${diagnostic}; cleanup: ${cleanupDiagnostic}` : `cleanup: ${cleanupDiagnostic}`;
  }

  const entry = buildManifestEntry({
    typeId: plan.typeId,
    fixtureId: plan.fixtureId,
    title: plan.title,
    intent: plan.sourceIntent,
    target: plan.target,
    inputPath: plan.outputInputPath,
    inputZhPath: plan.outputInputZhPath,
    artifactPath,
    svgPath,
    pngPath,
    status,
    providerId,
    model,
    generatedAt,
    artifactSha256,
    svgSha256,
    pngSha256,
    sourceNotePath: plan.inputPath,
    diagnostic
  });
  const machineTest = buildMachineTestRecord(entry, plan, result, cleanupCompleted, visualSource);
  await dependencies.writeOutputFile(`${plan.directory}/machine-test.json`, `${JSON.stringify(machineTest, null, 2)}\n`);
  if (typeof dependencies.onEntry === 'function') dependencies.onEntry(entry);
  return entry;
}

async function runExampleBatch(dependencies) {
  if (!dependencies || !Array.isArray(dependencies.plans)) {
    throw new Error('runExampleBatch requires a plans array.');
  }
  const entries = [];
  for (const plan of dependencies.plans) {
    entries.push(await runSingleExample(plan, dependencies));
  }
  return {
    ok: entries.every(entry => entry.status === 'passed'),
    entries
  };
}

function runCommand(command, args, options = {}) {
  const result = spawnSyncWithCommandResolution(command, args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
    ...options
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const error = new Error(String(result.stderr || result.stdout || `${command} failed with exit code ${result.status}`));
    error.status = result.status;
    throw error;
  }
  return result.stdout;
}

function createVaultPathResolver(vaultRoot, vaultPrefix) {
  const root = path.resolve(vaultRoot);
  const prefix = normalizeLogicalPath(vaultPrefix);
  return vaultPath => {
    const logical = assertVaultPath(vaultPath, prefix);
    const absolute = path.resolve(root, logical);
    const relative = path.relative(root, absolute);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Vault path "${logical}" resolves outside the configured Vault.`);
    }
    return { logical, absolute };
  };
}

function encodeObsidianContent(content) {
  return String(content).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n');
}

function readProviderSummary(vaultRoot) {
  try {
    const dataPath = path.join(vaultRoot, '.obsidian', 'plugins', 'notemd', 'data.json');
    const settings = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const providerId = settings.summarizeToMermaidProvider || settings.activeProvider || null;
    const providers = Array.isArray(settings.providers) ? settings.providers : [];
    const provider = providers.find(item => item && item.name === providerId);
    return {
      providerId: provider?.name || providerId,
      model: settings.summarizeToMermaidModel || provider?.model || null
    };
  } catch {
    return { providerId: null, model: null };
  }
}

async function createBrowserPreviewRenderer(repoRoot) {
  const esbuild = require('esbuild');
  const { chromium } = require('playwright');
  const cacheRoot = path.join(repoRoot, '.cache', 'diagram-examples');
  const bundlePath = path.join(cacheRoot, 'preview.cjs');
  fs.mkdirSync(cacheRoot, { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(repoRoot, 'scripts', 'diagram-examples-browser-entry.ts')],
    outfile: bundlePath,
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"' }
  });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  const pngPage = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ path: bundlePath });

  const renderPreviewSvg = artifact => page.evaluate(async value => {
    const runtime = window.__NOTEMD_DIAGRAM_EXAMPLES_PREVIEW__;
    if (!runtime || typeof runtime.render !== 'function') throw new Error('Diagram example preview runtime is unavailable.');
    return runtime.render(value);
  }, artifact);

  const assertPreviewSvgPresentationSafety = (svg, source) => page.evaluate(({ markup, label }) => {
    const runtime = window.__NOTEMD_DIAGRAM_EXAMPLES_PREVIEW__;
    if (!runtime || typeof runtime.assertPresentationSafety !== 'function') {
      throw new Error('Diagram example SVG presentation runtime is unavailable.');
    }
    runtime.assertPresentationSafety(markup, label);
  }, { markup: svg, label: source });

  const renderPreviewPng = async svg => {
    await pngPage.setContent(`<!doctype html><html><head><style>html,body{margin:0;width:960px;height:540px;overflow:hidden;background:#fff}svg{display:block;width:960px;height:540px;max-width:100%;max-height:100%}</style></head><body>${svg}</body></html>`, { waitUntil: 'load' });
    return pngPage.screenshot({ type: 'png', fullPage: false, animations: 'disabled' });
  };

  return {
    renderPreviewSvg,
    renderPreviewPng,
    assertPreviewSvgPresentationSafety,
    close: () => browser.close()
  };
}

function createProductionDependencies({ repoRoot, vaultRoot, vaultName, vaultPrefix, stagingRoot, previewRenderer }) {
  const resolveVaultPath = createVaultPathResolver(vaultRoot, vaultPrefix);
  const cliVaultName = vaultName || path.basename(path.resolve(vaultRoot));
  const writeOutputFile = async (logicalPath, content) => {
    const normalized = normalizeLogicalPath(logicalPath);
    const absolute = path.resolve(repoRoot, normalized);
    const relative = path.relative(path.resolve(repoRoot, DEFAULT_OUTPUT_ROOT), absolute);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Output path "${normalized}" escapes ${DEFAULT_OUTPUT_ROOT}.`);
    }
    await fsp.mkdir(path.dirname(absolute), { recursive: true });
    await fsp.writeFile(absolute, asBuffer(content));
  };

  return {
    vaultPrefix,
    providerSummary: readProviderSummary(vaultRoot),
    now: () => new Date().toISOString(),
    writeOutputFile,
    createVaultFile: async (vaultPath, content) => {
      const resolved = resolveVaultPath(vaultPath);
      await fsp.mkdir(path.dirname(resolved.absolute), { recursive: true });
      if (fs.existsSync(resolved.absolute)) {
        throw new Error(`Temporary Vault source already exists: ${resolved.logical}`);
      }
      runCommand('obsidian', [
        `vault=${cliVaultName}`,
        'create',
        `path=${resolved.logical}`,
        `content=${encodeObsidianContent(content)}`
      ], { timeout: 120000 });
    },
    invokeDiagramGenerate: async request => {
      const requestPath = path.join(stagingRoot, `${request.requestedTypeId}.request.json`);
      await fsp.writeFile(requestPath, `${JSON.stringify(request, null, 2)}\n`, 'utf8');
      try {
        const stdout = runCommand(process.execPath, [
          path.join(repoRoot, 'scripts', 'invoke-maintainer-cli-operation.js'),
          '--vault', vaultRoot,
          '--operation', 'diagram.generate',
          '--input-file', requestPath,
          '--pretty'
        ], { timeout: 10 * 60 * 1000 });
        return JSON.parse(stdout);
      } catch (error) {
        if (error && (error.code === 'ENOENT' || error.code === 'EINVAL')) error.unavailable = true;
        throw error;
      } finally {
        await fsp.rm(requestPath, { force: true });
      }
    },
    readVaultFile: async vaultPath => {
      const resolved = resolveVaultPath(vaultPath);
      return fsp.readFile(resolved.absolute);
    },
    deleteVaultFile: async vaultPath => {
      const resolved = resolveVaultPath(vaultPath);
      if (!fs.existsSync(resolved.absolute)) return;
      const stat = await fsp.stat(resolved.absolute);
      if (stat.isDirectory()) {
        if ((await fsp.readdir(resolved.absolute)).length === 0) await fsp.rmdir(resolved.absolute);
        return;
      }
      runCommand('obsidian', [
        `vault=${cliVaultName}`,
        'delete',
        `path=${resolved.logical}`,
        'permanent'
      ], { timeout: 120000 });
    },
    renderPreviewSvg: previewRenderer?.renderPreviewSvg,
    renderPreviewPng: previewRenderer?.renderPreviewPng,
    assertPreviewSvgPresentationSafety: previewRenderer?.assertPreviewSvgPresentationSafety
  };
}

async function checkCommittedExamples(repoRoot) {
  const summaries = await loadExecutableDiagramExampleSummaries(repoRoot);
  const expectedTypeIds = summaries.map(summary => summary.typeId);
  const outputRoot = path.join(repoRoot, DEFAULT_OUTPUT_ROOT);
  const manifestPath = path.join(outputRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error('docs/diagram-examples/manifest.json is missing.');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const expectedCatalogEntries = summaries.map(summary => ({
    typeId: summary.typeId,
    fixtureId: summary.fixtureId,
    title: summary.title,
    intent: summary.sourceIntent,
    target: summary.target,
    inputPath: `${DEFAULT_OUTPUT_ROOT}/${summary.typeId}/input.md`,
    inputZhPath: `${DEFAULT_OUTPUT_ROOT}/${summary.typeId}/input.zh-CN.md`
  }));
  const fileRecords = {};
  for (const entry of manifest.entries || []) {
    for (const field of ['inputPath', 'inputZhPath', 'artifactPath', 'svgPath', 'pngPath']) {
      const logicalPath = entry[field];
      if (!logicalPath) continue;
      const absolute = path.resolve(repoRoot, logicalPath);
      const record = { exists: fs.existsSync(absolute) };
      if (record.exists && fs.statSync(absolute).isFile()) record.sha256 = sha256(fs.readFileSync(absolute));
      fileRecords[logicalPath] = record;
    }
  }
  const validation = validateManifest(manifest, {
    expectedTypeIds,
    expectedCatalogEntries,
    vaultPrefix: DEFAULT_VAULT_PREFIX,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    fileRecords
  });
  const failures = [...validation.failures];
  for (const [name, requiredText] of [
    ['README.md', 'real-vault evidence'],
    ['README.zh-CN.md', '真实 Vault 实测证据']
  ]) {
    const readmePath = path.join(outputRoot, name);
    if (!fs.existsSync(readmePath)) {
      failures.push(`${name} is missing`);
      continue;
    }
    const content = fs.readFileSync(readmePath, 'utf8');
    if (!content.includes(requiredText)) failures.push(`${name} is missing its evidence description`);
    for (const typeId of expectedTypeIds) {
      if (!content.includes(`./${typeId}/`)) failures.push(`${name} is missing the ${typeId} link`);
    }
  }
  const expectedDirectories = new Set(expectedTypeIds);
  if (fs.existsSync(outputRoot)) {
    for (const name of fs.readdirSync(outputRoot, { withFileTypes: true })) {
      if (name.isDirectory() && !expectedDirectories.has(name.name)) failures.push(`${name.name} is an unexpected diagram example directory`);
    }
  }
  for (const entry of manifest.entries || []) {
    const machinePath = path.join(repoRoot, DEFAULT_OUTPUT_ROOT, entry.typeId, 'machine-test.json');
    if (!fs.existsSync(machinePath)) {
      failures.push(`${entry.typeId} machine-test.json is missing`);
      continue;
    }
    try {
      const machine = JSON.parse(fs.readFileSync(machinePath, 'utf8'));
      for (const field of [
        'typeId', 'fixtureId', 'title', 'status', 'sourceNotePath', 'artifactPath', 'svgPath', 'pngPath',
        'providerId', 'model', 'generatedAt', 'artifactSha256', 'svgSha256', 'pngSha256', 'diagnostic'
      ]) {
        if ((machine[field] ?? null) !== (entry[field] ?? null)) failures.push(`${entry.typeId} machine-test ${field} disagrees with manifest`);
      }
      const requested = machine.requested;
      if (!requested || requested.typeId !== entry.typeId || requested.renderTarget !== entry.target
        || requested.compatibilityMode !== 'best-fit' || requested.targetLanguage !== 'en') {
        failures.push(`${entry.typeId} machine-test requested contract disagrees with manifest`);
      }
      for (const field of ['sourceNotePath', 'outputPath']) {
        if (machine[field] == null) continue;
        try {
          assertVaultPath(machine[field], DEFAULT_VAULT_PREFIX);
        } catch {
          failures.push(`${entry.typeId} machine-test ${field} escapes the dedicated Vault prefix`);
        }
      }
      if (typeof machine.cleanupCompleted !== 'boolean') {
        failures.push(`${entry.typeId} machine-test cleanupCompleted must be boolean`);
      }
      if (entry.status === 'passed' && machine.cleanupCompleted !== true) {
        failures.push(`${entry.typeId} passed machine-test did not complete cleanup`);
      }
      if (entry.svgPath && typeof machine.visualSource !== 'string') {
        failures.push(`${entry.typeId} machine-test is missing visualSource for its SVG result`);
      }
      if (machine.schemaVersion !== 1) failures.push(`${entry.typeId} machine-test schemaVersion must be 1`);
      if (JSON.stringify(machine).match(/(?:api[_-]?key|apikey|authorization|token|secret)\s*[:=]\s*(?!\[REDACTED\]|null)/i)) failures.push(`${entry.typeId} machine-test contains unredacted secret-shaped data`);
      if (containsPortableAbsolutePath(machine)) failures.push(`${entry.typeId} machine-test contains an absolute path`);
    } catch (error) {
      failures.push(`${entry.typeId} machine-test is invalid: ${sanitizeDiagnostic(error)}`);
    }
  }
  if (failures.length > 0) throw new Error(`Diagram examples check failed:\n- ${failures.join('\n- ')}`);
  return { mode: 'check', entryCount: manifest.entries.length, outputRoot: DEFAULT_OUTPUT_ROOT };
}

function parseTypeFilter(argv) {
  const index = argv.indexOf('--types');
  if (index < 0) return null;
  const value = argv[index + 1];
  if (!value) throw new Error('--types requires a comma-separated catalog ID list.');
  const ids = value.split(',').map(id => id.trim()).filter(Boolean);
  if (ids.length === 0) throw new Error('--types requires at least one catalog ID.');
  return [...new Set(ids)];
}

function loadExistingManifest(repoRoot) {
  const manifestPath = path.join(repoRoot, DEFAULT_OUTPUT_ROOT, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

async function removeExistingExampleOutputs(repoRoot, entries) {
  const outputRoot = path.resolve(repoRoot, DEFAULT_OUTPUT_ROOT);
  for (const entry of entries) {
    for (const logicalPath of [entry?.artifactPath, entry?.svgPath, entry?.pngPath]) {
      if (typeof logicalPath !== 'string') continue;
      const absolutePath = path.resolve(repoRoot, logicalPath);
      const relativePath = path.relative(outputRoot, absolutePath);
      if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
        await fsp.rm(absolutePath, { force: true });
      }
    }
  }
}

async function generateCommittedExamples(repoRoot, vaultRoot, typeFilter = null) {
  const summaries = await loadExecutableDiagramExampleSummaries(repoRoot);
  const summaryByType = new Map(summaries.map(summary => [summary.typeId, summary]));
  const selectedSummaries = typeFilter
    ? typeFilter.map(typeId => {
      const summary = summaryByType.get(typeId);
      if (!summary) throw new Error(`Unknown executable diagram type "${typeId}".`);
      return summary;
    })
    : summaries;
  const existingManifest = typeFilter ? loadExistingManifest(repoRoot) : null;
  if (typeFilter && (!existingManifest || !Array.isArray(existingManifest.entries))) {
    throw new Error('A complete existing diagram examples manifest is required for --types retries. Run the full generator first.');
  }
  if (existingManifest) {
    await removeExistingExampleOutputs(repoRoot, existingManifest.entries.filter(entry => typeFilter.includes(entry.typeId)));
  }
  const runId = `run-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const vaultPrefix = `${DEFAULT_VAULT_PREFIX}/${runId}`;
  const plans = buildExamplePlans(selectedSummaries, DEFAULT_OUTPUT_ROOT, vaultPrefix);
  const stagingRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'notemd-diagram-examples-'));
  const previewRenderer = await createBrowserPreviewRenderer(repoRoot);
  try {
    const dependencies = createProductionDependencies({
      repoRoot,
      vaultRoot,
      vaultName: process.env.NOTEMD_DIAGRAM_EXAMPLES_VAULT_NAME || '1Knowledge',
      vaultPrefix,
      stagingRoot,
      previewRenderer
    });
    const batch = await runExampleBatch({ ...dependencies, plans });
    const previousEntries = new Map((existingManifest?.entries || []).map(entry => [entry.typeId, entry]));
    for (const entry of batch.entries) previousEntries.set(entry.typeId, entry);
    const mergedEntries = summaries.map(summary => previousEntries.get(summary.typeId)).filter(Boolean);
    if (mergedEntries.length !== summaries.length) {
      throw new Error('Diagram examples manifest merge lost one or more executable catalog types.');
    }
    const manifest = {
      schemaVersion: MANIFEST_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      catalogSource: 'src/diagram/diagramTypeCatalog.ts',
      expectedCount: summaries.length,
      entries: mergedEntries
    };
    await dependencies.writeOutputFile(`${DEFAULT_OUTPUT_ROOT}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
    await dependencies.writeOutputFile(
      `${DEFAULT_OUTPUT_ROOT}/README.md`,
      renderExamplesReadme(summaries, mergedEntries, 'en')
    );
    await dependencies.writeOutputFile(
      `${DEFAULT_OUTPUT_ROOT}/README.zh-CN.md`,
      renderExamplesReadme(summaries, mergedEntries, 'zh-CN')
    );
    return {
      ok: mergedEntries.every(entry => entry.status === 'passed'),
      entries: mergedEntries,
      attempted: batch.entries,
      manifest
    };
  } finally {
    await previewRenderer.close();
    await fsp.rm(stagingRoot, { recursive: true, force: true });
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const checkOnly = argv.includes('--check');
  const typeFilter = parseTypeFilter(argv);
  const vaultRoot = process.env.NOTEMD_DIAGRAM_EXAMPLES_VAULT || DEFAULT_VAULT_ROOT;
  const output = checkOnly
    ? await checkCommittedExamples(REPO_ROOT)
    : await generateCommittedExamples(REPO_ROOT, vaultRoot, typeFilter);
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (!checkOnly && !output.ok) process.exitCode = 1;
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  checkCommittedExamples,
  createProductionDependencies,
  parseWrapperSourceArtifact,
  renderChineseArtifactMarkdown,
  runExampleBatch,
  runSingleExample,
  sha256
};
