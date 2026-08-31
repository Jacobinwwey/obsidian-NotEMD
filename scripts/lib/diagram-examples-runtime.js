'use strict';

const path = require('path');

const MANIFEST_SCHEMA_VERSION = 1;
const MAX_DIAGNOSTIC_LENGTH = 500;
const STATUS_VALUES = new Set(['passed', 'failed', 'unavailable']);

function normalizeLogicalPath(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('Expected a non-empty path string.');
  }

  return value
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/$/, '');
}

function isPortableAbsolutePath(value) {
  return value.startsWith('/')
    || /^[A-Za-z]:\//.test(value)
    || value.startsWith('//');
}

function assertRelativePath(value, description) {
  const normalized = normalizeLogicalPath(value);
  if (isPortableAbsolutePath(normalized)) {
    throw new Error(`${description} is absolute or outside the dedicated diagram examples prefix.`);
  }

  const segments = normalized.split('/');
  if (segments.includes('..')) {
    throw new Error(`${description} is outside the dedicated diagram examples prefix.`);
  }
  return normalized;
}

function isWithinRoot(candidate, root) {
  const normalizedCandidate = normalizeLogicalPath(candidate);
  const normalizedRoot = normalizeLogicalPath(root);
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}/`);
}

function resolveSafeVaultPath(prefix, relativePath) {
  const normalizedPrefix = assertRelativePath(prefix, 'Vault prefix');
  const normalizedRelativePath = assertRelativePath(relativePath, 'Vault path');
  const resolved = path.posix.normalize(path.posix.join(normalizedPrefix, normalizedRelativePath));
  if (!isWithinRoot(resolved, normalizedPrefix)) {
    throw new Error('Vault path is outside the dedicated diagram examples prefix.');
  }
  return resolved;
}

function buildExamplePlans(summaries, outputRoot, vaultPrefix) {
  if (!Array.isArray(summaries)) {
    throw new Error('Diagram example summaries must be an array.');
  }

  const normalizedOutputRoot = assertRelativePath(outputRoot, 'Output root');
  const normalizedVaultPrefix = assertRelativePath(vaultPrefix, 'Vault prefix');
  const seenTypeIds = new Set();

  return summaries.map((summary, index) => {
    if (!summary || typeof summary !== 'object') {
      throw new Error(`Diagram example summary at index ${index} is invalid.`);
    }
    const typeId = assertRelativePath(summary.typeId, `Diagram type at index ${index}`);
    if (typeId.includes('/')) {
      throw new Error(`Diagram type "${typeId}" must be a single path segment.`);
    }
    if (seenTypeIds.has(typeId)) {
      throw new Error(`Duplicate diagram example type "${typeId}".`);
    }
    seenTypeIds.add(typeId);

    const directory = `${normalizedOutputRoot}/${typeId}`;
    const inputPath = resolveSafeVaultPath(normalizedVaultPrefix, `${typeId}.md`);
    const inputZhPath = resolveSafeVaultPath(normalizedVaultPrefix, `${typeId}.zh-CN.md`);
    return {
      ...summary,
      typeId,
      directory,
      inputPath,
      inputZhPath,
      outputInputPath: `${directory}/input.md`,
      outputInputZhPath: `${directory}/input.zh-CN.md`,
      outputDirectory: directory
    };
  });
}

const CHINESE_LABELS = {
  purpose: '用途',
  requestedType: '请求图表类型',
  requestedTarget: '请求渲染目标',
  sourceFacts: '源事实',
  readingCues: '阅读线索',
  evidenceNote: '这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。'
};

function renderExampleInput(summary, language) {
  if (!summary || typeof summary !== 'object') {
    throw new Error('Diagram example summary is required.');
  }
  if (language !== 'en' && language !== 'zh-CN') {
    throw new Error(`Unsupported diagram example language "${language}".`);
  }

  const facts = Array.isArray(summary.semanticFacts) ? summary.semanticFacts : [];
  const cues = Array.isArray(summary.readingCues) && summary.readingCues.length > 0
    ? summary.readingCues
    : [summary.selectionRationale || 'Confirm that the generated structure preserves the source relationships.'];
  const treeShapeNotes = summary.payloadKind === 'tree'
    ? language === 'en'
      ? [
        'Canonical response shape: `{ "nodes": [], "edges": [], "payload": { "kind": "tree", "nodes": [{ "id": "root", "label": "..." }, { "id": "child", "label": "...", "parentId": "root" }] } }`.',
        'Top-level nodes and edges must remain empty arrays.',
        'payload.kind must be `tree`; put every tree node under payload.nodes and give each non-root node a valid parentId.'
      ]
      : [
        'Canonical response shape：`{ "nodes": [], "edges": [], "payload": { "kind": "tree", "nodes": [{ "id": "root", "label": "..." }, { "id": "child", "label": "...", "parentId": "root" }] } }`。',
        '顶层 nodes 和 edges 必须保持为空数组。',
        'payload.kind 必须是 `tree`；所有树节点放在 payload.nodes 中，且每个非根节点都必须有有效的 parentId。'
      ]
    : [];
  const chineseFallbackCues = [
    summary.selectionRationaleZh || '确认生成结构保留源关系。',
    '检查视觉结构是否匹配声明的渲染目标。',
    facts[0] ? `优先检查这条证据：${facts[0]}` : '优先检查核心关系。'
  ];
  if (language === 'en') {
    return [
      `# ${summary.title}`,
      '',
      `Purpose: ${summary.selectionRationale || 'Exercise this executable diagram type.'}`,
      '',
      `Requested diagram type: \`${summary.typeId}\``,
      `Requested render target: \`${summary.target}\``,
      ...(summary.payloadKind ? [`Canonical payload kind: \`${summary.payloadKind}\``, `Semantic intent: \`${summary.sourceIntent}\``] : []),
      '',
      '## Source facts',
      '',
      ...treeShapeNotes.map(note => `- ${note}`),
      ...(treeShapeNotes.length > 0 ? [''] : []),
      ...(facts.length > 0 ? facts.map(fact => `- ${fact}`) : ['- Preserve the named entities and relationships from this scenario.']),
      '',
      '## Reading cues',
      '',
      ...cues.slice(0, 3).map(cue => `- ${cue}`),
      '',
      'This is an input example. The corresponding output is real-vault evidence with provider metadata recorded in `machine-test.json`.',
      ''
    ].join('\n');
  }

  const title = summary.titleZh || summary.title;
  return [
    `# ${title}`,
    '',
    `${CHINESE_LABELS.purpose}：${summary.selectionRationaleZh || summary.selectionRationale || '用于实测该可执行图表类型。'}`,
    '',
    `${CHINESE_LABELS.requestedType}：\`${summary.typeId}\``,
    `${CHINESE_LABELS.requestedTarget}：\`${summary.target}\``,
    ...(summary.payloadKind ? [`Canonical payload kind：\`${summary.payloadKind}\``, `语义 intent：\`${summary.sourceIntent}\``] : []),
    '',
    `## ${CHINESE_LABELS.sourceFacts}`,
    '',
    ...treeShapeNotes.map(note => `- ${note}`),
    ...(treeShapeNotes.length > 0 ? [''] : []),
    ...(facts.length > 0 ? facts.map(fact => `- ${fact}`) : ['- 保留场景中命名实体及其关系。']),
    '',
    `## ${CHINESE_LABELS.readingCues}`,
    '',
    ...cues.slice(0, 3).map((cue, index) => `- ${summary.readingCuesZh?.[index] || chineseFallbackCues[index] || cue}`),
    '',
    CHINESE_LABELS.evidenceNote,
    ''
  ].join('\n');
}

function buildManifestEntry(fields) {
  if (!fields || typeof fields !== 'object') {
    throw new Error('Manifest entry fields are required.');
  }
  const entry = {
    typeId: fields.typeId,
    fixtureId: fields.fixtureId,
    title: fields.title,
    intent: fields.intent,
    target: fields.target,
    inputPath: fields.inputPath,
    inputZhPath: fields.inputZhPath,
    artifactPath: fields.artifactPath ?? null,
    svgPath: fields.svgPath ?? null,
    pngPath: fields.pngPath ?? null,
    status: fields.status,
    providerId: fields.providerId ?? null,
    model: fields.model ?? null,
    generatedAt: fields.generatedAt ?? null,
    artifactSha256: fields.artifactSha256 ?? null,
    svgSha256: fields.svgSha256 ?? null,
    pngSha256: fields.pngSha256 ?? null,
    sourceNotePath: fields.sourceNotePath ?? null,
    diagnostic: fields.diagnostic ?? null
  };
  if (typeof entry.typeId !== 'string' || typeof entry.fixtureId !== 'string' || typeof entry.target !== 'string') {
    throw new Error('Manifest entry requires typeId, fixtureId, and target strings.');
  }
  if (!STATUS_VALUES.has(entry.status)) {
    throw new Error(`Manifest entry "${entry.typeId}" has an invalid status.`);
  }
  return entry;
}

function sanitizeDiagnostic(value) {
  const source = value instanceof Error ? value.message : String(value ?? 'Unknown error');
  let sanitized = source
    .replace(/((?:api[_-]?key|apikey|token|secret|authorization)(?:\s*[:=]\s*)?)[^\s&;,]+/gi, '$1[REDACTED]')
    .replace(/(^|[\s("'`])(?:[A-Za-z]:[\\/]|\\\\)[^\s"']+/g, '$1<absolute-path>')
    .replace(/(^|\s)\/(?!\/)(?:[^\s"']+)/g, '$1<absolute-path>');
  if (sanitized.length > MAX_DIAGNOSTIC_LENGTH) {
    sanitized = `${sanitized.slice(0, MAX_DIAGNOSTIC_LENGTH - 1)}…`;
  }
  return sanitized;
}

function collectCleanupPaths(paths, vaultPrefix) {
  if (!Array.isArray(paths)) {
    throw new Error('Cleanup paths must be an array.');
  }
  const normalizedPrefix = assertRelativePath(vaultPrefix, 'Vault prefix');
  const seen = new Set();
  const result = [];
  for (const candidate of paths) {
    const normalizedCandidate = assertRelativePath(candidate, 'Cleanup path');
    if (!isWithinRoot(normalizedCandidate, normalizedPrefix)) {
      throw new Error('Cleanup path is outside the dedicated diagram examples prefix.');
    }
    const safePath = normalizedCandidate;
    if (!seen.has(safePath)) {
      seen.add(safePath);
      result.push(safePath);
    }
  }
  return result;
}

function validateManifest(manifest, options) {
  const failures = [];
  const expectedTypeIds = Array.isArray(options?.expectedTypeIds) ? options.expectedTypeIds : [];
  const expectedCatalogEntries = Array.isArray(options?.expectedCatalogEntries) ? options.expectedCatalogEntries : [];
  const expectedCatalogByType = new Map(expectedCatalogEntries.map(entry => [entry?.typeId, entry]));
  const vaultPrefix = options?.vaultPrefix || 'notemd-real-diagram-examples';
  const outputRoot = normalizeLogicalPath(options?.outputRoot || 'docs/diagram-examples');
  const fileRecords = options?.fileRecords || {};

  if (!manifest || typeof manifest !== 'object') {
    return { ok: false, failures: ['manifest is not an object'] };
  }
  if (manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    failures.push(`manifest schemaVersion must be ${MANIFEST_SCHEMA_VERSION}`);
  }
  if (manifest.catalogSource !== 'src/diagram/diagramTypeCatalog.ts') {
    failures.push('manifest catalogSource is invalid');
  }
  if (manifest.expectedCount !== expectedTypeIds.length) {
    failures.push(`manifest expectedCount must be ${expectedTypeIds.length}`);
  }
  if (!Array.isArray(manifest.entries)) {
    return { ok: false, failures: [...failures, 'manifest entries is not an array'] };
  }

  const expectedSet = new Set(expectedTypeIds);
  const seen = new Set();
  for (const entry of manifest.entries) {
    const typeId = typeof entry?.typeId === 'string' ? entry.typeId : '<missing-type-id>';
    if (seen.has(typeId)) {
      failures.push(`duplicate manifest typeId "${typeId}"`);
    }
    seen.add(typeId);
    if (!expectedSet.has(typeId)) {
      failures.push(`unexpected manifest typeId "${typeId}"`);
    }
    const expectedCatalogEntry = expectedCatalogByType.get(typeId);
    if (expectedCatalogEntry) {
      for (const field of ['fixtureId', 'title', 'intent', 'target']) {
        if (entry?.[field] !== expectedCatalogEntry[field]) {
          failures.push(`${typeId} ${field} disagrees with catalog`);
        }
      }
      for (const field of ['inputPath', 'inputZhPath']) {
        if (entry?.[field] !== expectedCatalogEntry[field]) {
          failures.push(`${typeId} ${field} disagrees with catalog`);
        }
      }
    }
    if (entry?.status && !STATUS_VALUES.has(entry.status)) {
      failures.push(`${typeId} has invalid status`);
    }

    for (const field of ['inputPath', 'inputZhPath', 'artifactPath', 'svgPath', 'pngPath']) {
      const value = entry?.[field];
      if (value == null) {
        continue;
      }
      try {
        const normalized = assertRelativePath(value, `${typeId} ${field}`);
        if (!isWithinRoot(normalized, outputRoot)) {
          failures.push(`${typeId} ${field} escapes output root`);
        }
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
      const record = fileRecords[value] || fileRecords[normalizeLogicalPath(value)];
      if (!record || record.exists !== true) {
        failures.push(`${typeId} ${path.posix.basename(normalizeLogicalPath(value))} is missing`);
      } else {
        const hashField = field === 'artifactPath' ? 'artifactSha256' : field === 'svgPath' ? 'svgSha256' : field === 'pngPath' ? 'pngSha256' : null;
        if (hashField && entry[hashField] && record.sha256 && entry[hashField] !== record.sha256) {
          failures.push(`${typeId} ${path.posix.basename(normalizeLogicalPath(value))} hash is stale`);
        }
      }
    }

    if (entry?.sourceNotePath != null) {
      try {
        const normalizedSourceNotePath = assertRelativePath(entry.sourceNotePath, `${typeId} sourceNotePath`);
        if (!isWithinRoot(normalizedSourceNotePath, normalizeLogicalPath(vaultPrefix))) {
          failures.push(`${typeId} sourceNotePath is outside the dedicated Vault prefix.`);
        }
      } catch {
        failures.push(`${typeId} sourceNotePath is outside the dedicated Vault prefix.`);
      }
    }

    if (entry?.status === 'passed' && !entry.artifactPath && !entry.svgPath && !entry.pngPath) {
      failures.push(`${typeId} passed without an artifact or visual result`);
    }
  }

  for (const typeId of expectedTypeIds) {
    if (!seen.has(typeId)) {
      failures.push(`missing manifest typeId "${typeId}"`);
    }
  }
  return { ok: failures.length === 0, failures };
}

module.exports = {
  MANIFEST_SCHEMA_VERSION,
  MAX_DIAGNOSTIC_LENGTH,
  buildExamplePlans,
  buildManifestEntry,
  collectCleanupPaths,
  renderExampleInput,
  resolveSafeVaultPath,
  sanitizeDiagnostic,
  validateManifest
};
