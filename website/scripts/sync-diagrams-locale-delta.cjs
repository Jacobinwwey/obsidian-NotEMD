#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');

const websiteRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(websiteRoot, 'docs');
const i18nRoot = path.join(websiteRoot, 'i18n');
const sourcePath = 'features/diagrams.mdx';
const endpoint = process.env.LM_STUDIO_ENDPOINT || 'http://100.80.17.113:301/v1/chat/completions';
const model = process.env.LM_STUDIO_MODEL || 'hy-mt2-7b';

const defaultOptions = {
  concurrency: 12,
  batchContextLimit: 28000,
  write: false,
  locales: [],
  skip: new Set(['zh-CN']),
  debugOutputDir: '',
};

const translationSystemPrompt = [
  'You are a documentation localization engineer.',
  'Translate every JSON string value into the target language.',
  'Return a single valid JSON object with exactly the same keys.',
  'Preserve Markdown, MDX, table pipes, list numbering, inline code, command names, file paths, option flags, URLs, product names, and technical identifiers exactly.',
  'Do not translate these tokens: Notemd, Obsidian, Mermaid, JSON Canvas, Vega-Lite, Draw.io, Drawnix, circuitikz, TikZJax, DiagramSpec, CircuitSpec, CircuitikzRenderer, SemanticFigureModel, RenderArtifact.diagnostics, RenderCache, SVG, PNG, PDF, HTML, CLI, CI, LLM, npm.',
  'Do not add explanations.',
].join(' ');

const englishDelta = {
  description:
    'Generate Mermaid, JSON Canvas, Vega-Lite, HTML, editable figure artifacts, Draw.io, Drawnix, and constrained circuitikz diagrams from your notes using a spec-first architecture',
  tldr:
    '**Notemd generates diagrams from your notes through a spec-first pipeline.** The LLM produces a renderer-agnostic `DiagramSpec` JSON, then dedicated adapters translate it into Mermaid, JSON Canvas, Vega-Lite, HTML, editable HTML/SVG, Draw.io, Drawnix, or constrained circuitikz output. Supports 9 intent types, automatic fallback chains, live preview with SVG/PNG/PDF export, semantic verification, and local-knowledge-augmented generation.',
  circuitTypeRow:
    '| `circuit` | circuitikz | none | Constrained circuit diagrams from validated `CircuitSpec` payloads |',
  circuitIntentRow:
    '| `circuit` | circuitikz, TikZJax, circuit, schematic, CMOS, NMOS, PMOS, MOSFET, VDD/GND, `vin`/`vout` | 0.78 |',
  renderTargetSentence:
    'Set **Preferred render target** to **Auto** for the planner default, or choose Mermaid, JSON Canvas, Vega-Lite, HTML, Editable HTML/SVG, Draw.io, Drawnix, or Circuitikz explicitly. These controls are regular diagram settings and sidebar controls rather than Developer mode diagnostics. The override applies only to artifact and preview commands. The standard **Summarise as Mermaid diagram** command remains pinned to Mermaid-compatible output so existing Markdown workflows do not silently switch formats.',
  separationParagraph:
    'This separation matters because a `flowchart` intent can now be rendered as Mermaid for Markdown notes, HTML for robust fallback, Editable HTML/SVG for downstream editing, or Draw.io/Drawnix source artifacts with SVG review companions. A `circuit` intent routes to Circuitikz and requires a validated `CircuitSpec`; it is not a request for arbitrary TikZ text.',
  outputDrawioRow:
    '| Draw.io | `.drawio` + `.drawio.svg` + `.drawio.md` | `{note}_diagram.drawio` plus review companions |',
  outputDrawnixRow:
    '| Drawnix | `.drawnix` + `.drawnix.svg` + `.drawnix.md` | `{note}_diagram.drawnix` plus review companions |',
  outputCircuitikzRow:
    '| Circuitikz | `.tex` + `.tex.svg` + `.tex.md` | `{note}_diagram.tex` plus review companions |',
  previewStep3: '3. Export as SVG, PNG, or PDF using the toolbar buttons',
  ppiParagraph:
    'PNG and PDF preview export use the configured preview PPI. The default is 300 PPI and values above 600 PPI are clamped to 600. SVG remains vector-sized. Source artifacts such as `.drawio`, `.drawnix`, and `.tex` can provide a `previewSvg` companion so Obsidian can display and export reviewable images without embedding diagrams.net, Drawnix, LaTeX, or TikZJax in the plugin runtime.',
  diagnosticsParagraph:
    'The preview modal also has an artifact diagnostics panel. Renderers and smoke checks can attach `RenderArtifact.diagnostics`; the modal shows a diagnostic summary with error/warning/info counts, then severity, diagnostic kind, message, and repair advice next to the preview. The same summary is shown in diagnostics-aware history entries, so repeated circuitikz smoke attempts can be compared without opening every entry. For artifacts that have source content but cannot be rendered inline or through the HTML iframe path, the modal now falls back to a source-only preview instead of forcing an empty iframe. This gives circuitikz compile/render smoke, SVG text-token checks, PNG blank-screenshot checks, path-only glyph overlap reports, and future overlap reports a visible UI surface without making TikZJax or LaTeX a hard plugin runtime dependency or pretending source text is a verified visual render.',
  drawioIntro:
    'The current implementation keeps third-party editor support at the artifact boundary while still exposing explicit render targets:',
  drawioContractRow:
    '| Draw.io | deterministic uncompressed `mxfile` XML from `SemanticFigureModel`, plus SVG/PNG/PDF review companions | none in plugin runtime or CI |',
  drawnixContractRow:
    '| Drawnix | minimal `.drawnix` JSON subset using `geometry` and `arrow-line` elements, plus SVG/PNG/PDF review companions | none in plugin runtime or CI |',
  prototypeIntro:
    'The prototype adds a constrained `CircuitSpec` boundary and deterministic exporter for six golden-reference families:',
  pipelineParagraph:
    'In the experimental diagram pipeline, this is now also reachable through `intent: "circuit"` and render target `circuitikz`. The generated `DiagramSpec` may embed `circuitSpec` only for circuit intent. `CircuitikzRenderer` writes the same deterministic `.tex` source and attaches an SVG preview companion derived from that validated circuit topology, enabling Obsidian preview plus SVG/PNG/PDF export. The companion is not a LaTeX/TikZJax compile result; real renderer evidence still belongs to the explicit smoke commands below.',
  layoutHintsParagraph:
    'For supported golden templates, `layoutHints.inputSide` and `layoutHints.outputSide` remain presentation-only controls. They can move deterministic input/output port placement, but they do not change the topology signature or allow a repair pass to rewire the circuit.',
  notGeneralTikzParagraph:
    'This is not a general TikZ generator. It does not accept arbitrary TikZ, compile LaTeX, call TikZJax, inspect screenshots in the plugin runtime, or run automated image-feedback repair. Those remain later gates.',
  progressCliRow:
    '| CLI support | `npm run diagram:export-artifact` exports editable HTML/SVG, Draw.io, Drawnix, Circuitikz, and SVG/PNG/PDF review evidence from one validated `DiagramSpec` | Add target-specific smoke fixtures when new targets ship |',
  progressCircuitRow:
    '| circuitikz | `DiagramSpec(intent: "circuit", circuitSpec) -> CircuitikzRenderer -> circuitikz` exports common-source, CMOS inverter, `cmos-buffer` / `cmos-buffer-v1`, `cmos-transmission-gate` / `cmos-transmission-gate-v1`, `cmos-nand2` / `cmos-nand2-v1`, and `cmos-nor2` / `cmos-nor2-v1` golden templates, exposes UI intent/render-target options without Developer mode, writes TeX plus SVG/PNG/PDF preview companions, validates topology before output, parses compile logs, can run explicit local renderers plus `--expected-artifact`, and keeps source-only fallback plus preview diagnostics visible through `RenderArtifact.diagnostics` and the preview modal | Add OCR-level label recognition for path-only visual text, precise pixel-level overlap checks, broader SVG path coverage where needed, automatic renderer installation/discovery only if it can remain optional, and automated topology-preserving repair execution |',
  configPreferredRenderTargetRow:
    '| `preferredDiagramRenderTarget` | `undefined` (auto) | Override artifact renderer, including Draw.io, Drawnix, and Circuitikz |',
  pngExportRow:
    '| PNG export | SVG -> Image -> Canvas / preview rasterizer at configured PPI -> PNG ArrayBuffer |',
  pdfExportRow: '| PDF export | SVG -> raster image at configured PPI -> single-page PDF |',
  semanticAuditRow:
    '| Semantic audit | Mermaid, JSON Canvas, Vega-Lite, editable HTML/SVG, Draw.io, Drawnix, and constrained circuitikz checked by `scripts/diagram-semantic-verification.js` plus renderer/CLI tests |',
};

const translationDelta = {
  ...englishDelta,
  diagnosticsParagraphPart1:
    'The preview modal also has an artifact diagnostics panel. Renderers and smoke checks can attach `RenderArtifact.diagnostics`; the modal shows a diagnostic summary with error/warning/info counts, then severity, diagnostic kind, message, and repair advice next to the preview.',
  diagnosticsParagraphPart2:
    'The same summary is shown in diagnostics-aware history entries, so repeated circuitikz smoke attempts can be compared without opening every entry.',
  diagnosticsParagraphPart3:
    'For artifacts that have source content but cannot be rendered inline or through the HTML iframe path, the modal now falls back to a source-only preview instead of forcing an empty iframe. This gives circuitikz compile/render smoke, SVG text-token checks, PNG blank-screenshot checks, path-only glyph overlap reports, and future overlap reports a visible UI surface without making TikZJax or LaTeX a hard plugin runtime dependency or pretending source text is a verified visual render.',
  progressCircuitCurrent:
    '`DiagramSpec(intent: "circuit", circuitSpec) -> CircuitikzRenderer -> circuitikz` exports common-source, CMOS inverter, `cmos-buffer` / `cmos-buffer-v1`, `cmos-transmission-gate` / `cmos-transmission-gate-v1`, `cmos-nand2` / `cmos-nand2-v1`, and `cmos-nor2` / `cmos-nor2-v1` golden templates, exposes UI intent/render-target options without Developer mode, writes TeX plus SVG/PNG/PDF preview companions, validates topology before output, parses compile logs, can run explicit local renderers plus `--expected-artifact`, and keeps source-only fallback plus preview diagnostics visible through `RenderArtifact.diagnostics` and the preview modal',
  progressCircuitNext:
    'Add OCR-level label recognition for path-only visual text, precise pixel-level overlap checks, broader SVG path coverage where needed, automatic renderer installation/discovery only if it can remain optional, and automated topology-preserving repair execution',
};
delete translationDelta.diagnosticsParagraph;
delete translationDelta.progressCircuitRow;

const markerTerms = [
  'Draw.io',
  'Drawnix',
  'circuitikz',
  'TikZJax',
  'DiagramSpec',
  'CircuitSpec',
  'CircuitikzRenderer',
  'RenderArtifact.diagnostics',
  'SemanticFigureModel',
  'SVG/PNG/PDF',
  'previewSvg',
  'scripts/diagram-semantic-verification.js',
  'preferredDiagramRenderTarget',
  'diagram:export-circuitikz',
  'cmos-inverter-v1',
  'cmos-nand2-v1',
  'cmos-nor2-v1',
  '--compile-log',
  '--diagnostics-output',
  '--compile-executable',
  '--compile-arg',
  '--expected-artifact',
  'compileExecution',
  'compileExecution.renderSmoke',
  'circuitikz.sty',
  '`.drawio` + `.drawio.svg` + `.drawio.md`',
  '`.drawnix` + `.drawnix.svg` + `.drawnix.md`',
  '`.tex` + `.tex.svg` + `.tex.md`',
];

const deltaKeyGroups = [
  [
    'description',
    'tldr',
    'circuitTypeRow',
    'circuitIntentRow',
    'renderTargetSentence',
    'separationParagraph',
    'outputDrawioRow',
    'outputDrawnixRow',
    'outputCircuitikzRow',
    'previewStep3',
    'ppiParagraph',
  ],
  ['diagnosticsParagraphPart1', 'diagnosticsParagraphPart2', 'diagnosticsParagraphPart3'],
  [
    'drawioIntro',
    'drawioContractRow',
    'drawnixContractRow',
    'prototypeIntro',
    'pipelineParagraph',
    'layoutHintsParagraph',
    'notGeneralTikzParagraph',
  ],
  ['progressCliRow', 'progressCircuitCurrent', 'progressCircuitNext'],
  ['configPreferredRenderTargetRow', 'pngExportRow', 'pdfExportRow', 'semanticAuditRow'],
];

function parseArgs(argv) {
  const options = {...defaultOptions, skip: new Set(defaultOptions.skip)};
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const readValue = () => {
      index += 1;
      if (index >= argv.length) {
        throw new Error(`${arg} requires a value`);
      }
      return argv[index];
    };

    if (arg === '--write') {
      options.write = true;
    } else if (arg === '--concurrency') {
      options.concurrency = Number(readValue());
      if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
        throw new Error('--concurrency must be a positive integer');
      }
    } else if (arg === '--batch-context-limit') {
      options.batchContextLimit = Number(readValue());
      if (!Number.isInteger(options.batchContextLimit) || options.batchContextLimit < 1000) {
        throw new Error('--batch-context-limit must be an integer >= 1000');
      }
    } else if (arg === '--locales') {
      options.locales = readValue().split(',').map((value) => value.trim()).filter(Boolean);
    } else if (arg === '--debug-output-dir') {
      options.debugOutputDir = path.resolve(readValue());
    } else if (arg === '--skip') {
      for (const locale of readValue().split(',').map((value) => value.trim()).filter(Boolean)) {
        options.skip.add(locale);
      }
    } else if (arg === '--include-zh-CN') {
      options.skip.delete('zh-CN');
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

async function loadPublishedLocales() {
  const moduleUrl = pathToFileURL(path.join(websiteRoot, 'src', 'lib', 'publishedLocales.mjs')).href;
  const {publishedDocumentationLocales} = await import(moduleUrl);
  return publishedDocumentationLocales;
}

function stripModelWrapper(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function parseJsonObject(text) {
  const stripped = stripModelWrapper(text);
  try {
    return JSON.parse(stripped);
  } catch {
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(stripped.slice(start, end + 1));
    }
    throw new Error(`Unable to parse model JSON: ${stripped.slice(0, 500)}`);
  }
}

function restoreMissingMarkers(sourceValue, translatedValue) {
  let output = translatedValue;
  for (const term of markerTerms) {
    if (sourceValue.includes(term) && !output.toLocaleLowerCase().includes(term.toLocaleLowerCase())) {
      if (/^\|.*\|\s*$/.test(output)) {
        output = output.replace(/\|\s*$/, `; ${term} |`);
      } else {
        output = `${output} ${term}`;
      }
    }
  }
  return output;
}

function countTablePipes(line) {
  return (line.match(/(?<!\\)\|/g) || []).length;
}

function normalizeTableRow(value, sourceValue) {
  const normalized = value.trim();
  if (!normalized.startsWith('|') || !normalized.endsWith('|')) {
    return sourceValue;
  }
  if (countTablePipes(normalized) !== countTablePipes(sourceValue)) {
    return sourceValue;
  }
  return normalized;
}

function subsetForKeys(keys) {
  return Object.fromEntries(keys.map((key) => [key, translationDelta[key]]));
}

function requestInputSize(locale, englishName, keys) {
  const subset = subsetForKeys(keys);
  const userContent = `Target language: ${englishName} (${locale})\n\nJSON:\n${JSON.stringify(subset, null, 2)}`;
  return translationSystemPrompt.length + userContent.length;
}

async function requestTranslatedSubset(locale, englishName, subset, maxTokens) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'system',
          content: translationSystemPrompt,
        },
        {
          role: 'user',
          content: `Target language: ${englishName} (${locale})\n\nJSON:\n${JSON.stringify(subset, null, 2)}`,
        },
      ],
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    const error = new Error(`${locale} LM Studio HTTP ${response.status}: ${body.slice(0, 500)}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  const parsed = JSON.parse(body);
  if (parsed?.choices?.[0]?.finish_reason === 'length') {
    const error = new Error(`${locale} LM Studio truncated translation output`);
    error.truncated = true;
    throw error;
  }

  try {
    return parseJsonObject(parsed?.choices?.[0]?.message?.content || '');
  } catch (error) {
    error.message = `${locale} JSON parse failed: ${error.message}`;
    error.parseFailed = true;
    throw error;
  }
}

async function translateDeltaKeys(locale, englishName, keys) {
  const subset = subsetForKeys(keys);
  try {
    return await requestTranslatedSubset(locale, englishName, subset, 2200);
  } catch (error) {
    const canSplit =
      keys.length > 1 &&
      (error.truncated ||
        error.parseFailed ||
        error.status === 400 ||
        /Context size has been exceeded/i.test(error.body || error.message));
    if (!canSplit) {
      throw error;
    }
    const midpoint = Math.ceil(keys.length / 2);
    const left = await translateDeltaKeys(locale, englishName, keys.slice(0, midpoint));
    const right = await translateDeltaKeys(locale, englishName, keys.slice(midpoint));
    return {...left, ...right};
  }
}

function finalizeTranslatedDelta(translated) {
  for (const key of Object.keys(translated)) {
    if (typeof translated[key] === 'string') {
      translated[key] = translated[key]
        .replace(/\s*\n+\s*/g, ' ')
        .trim()
        .replace(/^#{1,6}\s+/, '');
    }
  }

  if (
    translated.diagnosticsParagraphPart1 &&
    translated.diagnosticsParagraphPart2 &&
    translated.diagnosticsParagraphPart3
  ) {
    translated.diagnosticsParagraph = [
      translated.diagnosticsParagraphPart1,
      translated.diagnosticsParagraphPart2,
      translated.diagnosticsParagraphPart3,
    ].join(' ');
  }
  if (translated.progressCircuitCurrent && translated.progressCircuitNext) {
    const current = translated.progressCircuitCurrent.replace(/^\|+|\|+$/g, '').trim();
    const next = translated.progressCircuitNext.replace(/^\|+|\|+$/g, '').trim();
    translated.progressCircuitRow = `| circuitikz | ${current} | ${next} |`;
  }

  for (const [key, sourceValue] of Object.entries(englishDelta)) {
    if (typeof translated[key] !== 'string') {
      translated[key] = sourceValue;
    }
    translated[key] = restoreMissingMarkers(sourceValue, translated[key]).replace(/\r\n/g, '\n').trim();
    if (/^\|.*\|\s*$/.test(sourceValue)) {
      translated[key] = normalizeTableRow(translated[key], sourceValue);
    }
  }
  return translated;
}

function buildContextBatches(locales, keys, options) {
  const batches = [];
  let currentBatch = [];
  let currentSize = 0;

  for (const localeInfo of locales) {
    const estimatedSize = requestInputSize(localeInfo.locale, localeInfo.englishName, keys);
    if (
      currentBatch.length > 0 &&
      (currentBatch.length >= options.concurrency || currentSize + estimatedSize > options.batchContextLimit)
    ) {
      batches.push({items: currentBatch, estimatedSize: currentSize});
      currentBatch = [];
      currentSize = 0;
    }
    currentBatch.push(localeInfo);
    currentSize += estimatedSize;
  }

  if (currentBatch.length > 0) {
    batches.push({items: currentBatch, estimatedSize: currentSize});
  }

  return batches;
}

async function translateAllLocaleDeltas(selectedLocales, options) {
  const translatedByLocale = new Map(selectedLocales.map(({locale}) => [locale, {}]));

  for (let groupIndex = 0; groupIndex < deltaKeyGroups.length; groupIndex += 1) {
    const keys = deltaKeyGroups[groupIndex];
    const batches = buildContextBatches(selectedLocales, keys, options);
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      const batch = batches[batchIndex];
      const localeLabels = batch.items.map(({locale}) => locale).join(',');
      console.log(
        `[group ${groupIndex + 1}/${deltaKeyGroups.length} batch ${batchIndex + 1}/${batches.length}] ` +
          `locales=${localeLabels} estimatedChars=${batch.estimatedSize}`,
      );
      const results = await Promise.all(
        batch.items.map(async ({locale, englishName}) => {
          const translatedSubset = await translateDeltaKeys(locale, englishName, keys);
          return {locale, translatedSubset};
        }),
      );
      for (const {locale, translatedSubset} of results) {
        Object.assign(translatedByLocale.get(locale), translatedSubset);
      }
    }
  }

  for (const [locale, translated] of translatedByLocale) {
    translatedByLocale.set(locale, finalizeTranslatedDelta(translated));
  }
  return translatedByLocale;
}

function replaceFrontmatterDescription(content, value) {
  return content.replace(/^description:\s*.*$/m, `description: ${JSON.stringify(value)}`);
}

function replaceTldr(content, value) {
  return content.replace(/(<TLDR>\n)[\s\S]*?(\n<\/TLDR>)/, `$1${value}$2`);
}

function insertLineAfter(content, anchorPattern, newLine, existsPattern) {
  if (existsPattern.test(content)) {
    return content;
  }
  const lines = content.split('\n');
  const index = lines.findIndex((line) => anchorPattern.test(line));
  if (index === -1) {
    throw new Error(`Anchor not found for line insertion: ${anchorPattern}`);
  }
  lines.splice(index + 1, 0, newLine);
  return lines.join('\n');
}

function insertLineAfterOccurrence(content, anchorPattern, occurrenceIndex, newLine, existsPattern) {
  if (existsPattern.test(content)) {
    return content;
  }
  const lines = content.split('\n');
  let seen = 0;
  for (let index = 0; index < lines.length; index += 1) {
    if (!anchorPattern.test(lines[index])) {
      continue;
    }
    if (seen === occurrenceIndex) {
      lines.splice(index + 1, 0, newLine);
      return lines.join('\n');
    }
    seen += 1;
  }
  throw new Error(`Anchor occurrence ${occurrenceIndex} not found for line insertion: ${anchorPattern}`);
}

function replaceLine(content, linePattern, newLine) {
  const lines = content.split('\n');
  const index = lines.findIndex((line) => linePattern.test(line));
  if (index === -1) {
    throw new Error(`Line not found: ${linePattern}`);
  }
  lines[index] = newLine;
  return lines.join('\n');
}

function headingRanges(content) {
  const lines = content.split('\n');
  const headings = [];
  let inFence = false;
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    const match = lines[index].match(/^(#{1,6})\s+/);
    if (match) {
      headings.push({lineIndex: index, level: match[1].length});
    }
  }
  return headings.map((heading, index) => {
    const nextHeading = headings.find((candidate, candidateIndex) => {
      return candidateIndex > index && candidate.level <= heading.level;
    });
    return {
      start: heading.lineIndex,
      end: nextHeading ? nextHeading.lineIndex : lines.length,
    };
  });
}

function replaceParagraphInHeadingSection(content, headingOrdinal, pattern, replacement) {
  const lines = content.split('\n');
  const range = headingRanges(content)[headingOrdinal];
  if (!range) {
    throw new Error(`Heading ordinal not found: ${headingOrdinal}`);
  }
  const before = lines.slice(0, range.start + 1).join('\n');
  const sectionBody = lines.slice(range.start + 1, range.end).join('\n');
  const after = lines.slice(range.end).join('\n');
  const paragraphs = sectionBody.split(/\n{2,}/);
  const index = paragraphs.findIndex((paragraph) => pattern.test(paragraph));
  if (index === -1) {
    throw new Error(`Paragraph not found in heading section ${headingOrdinal}: ${pattern}`);
  }
  paragraphs[index] = replacement;
  return [before, paragraphs.join('\n\n'), after].filter((part) => part.length > 0).join('\n');
}

function dedupeRenderTargetParagraphs(content, headingOrdinal) {
  const lines = content.split('\n');
  const range = headingRanges(content)[headingOrdinal];
  if (!range) {
    throw new Error(`Heading ordinal not found: ${headingOrdinal}`);
  }
  const before = lines.slice(0, range.start + 1).join('\n');
  const sectionBody = lines.slice(range.start + 1, range.end).join('\n');
  const after = lines.slice(range.end).join('\n');
  const paragraphs = sectionBody.split(/\n{2,}/);
  const candidates = paragraphs
    .map((paragraph, index) => ({paragraph, index}))
    .filter(({paragraph}) => paragraph.includes('**Preferred render target**'));

  if (candidates.length <= 1) {
    return content;
  }

  const preferred =
    candidates.find(({paragraph}) => {
      return paragraph.includes('Draw.io') && paragraph.includes('Drawnix') && paragraph.includes('Circuitikz');
    }) ||
    candidates.reduce((longest, candidate) => {
      return candidate.paragraph.length > longest.paragraph.length ? candidate : longest;
    }, candidates[0]);

  const duplicateIndexes = new Set(
    candidates.filter(({index}) => index !== preferred.index).map(({index}) => index),
  );
  const deduped = paragraphs.filter((_, index) => !duplicateIndexes.has(index));
  return [before, deduped.join('\n\n'), after].filter((part) => part.length > 0).join('\n');
}

function replaceLineInHeadingSection(content, headingOrdinal, linePattern, replacement) {
  const lines = content.split('\n');
  const range = headingRanges(content)[headingOrdinal];
  if (!range) {
    throw new Error(`Heading ordinal not found: ${headingOrdinal}`);
  }
  for (let index = range.start + 1; index < range.end; index += 1) {
    if (linePattern.test(lines[index])) {
      lines[index] = replacement;
      return lines.join('\n');
    }
  }
  throw new Error(`Line not found in heading section ${headingOrdinal}: ${linePattern}`);
}

function upsertTableLineInHeadingSection(content, headingOrdinal, linePattern, replacement) {
  const lines = content.split('\n');
  const range = headingRanges(content)[headingOrdinal];
  if (!range) {
    throw new Error(`Heading ordinal not found: ${headingOrdinal}`);
  }

  let lastTableLine = -1;
  for (let index = range.start + 1; index < range.end; index += 1) {
    if (linePattern.test(lines[index])) {
      lines[index] = replacement;
      return lines.join('\n');
    }
    if (/^\|.*\|$/.test(lines[index])) {
      lastTableLine = index;
    }
  }

  if (lastTableLine === -1) {
    throw new Error(`Table not found in heading section ${headingOrdinal}`);
  }
  lines.splice(lastTableLine + 1, 0, replacement);
  return lines.join('\n');
}

function insertLineAfterInHeadingSection(content, headingOrdinal, anchorPattern, newLine, existsPattern) {
  if (existsPattern.test(content)) {
    return content;
  }
  const lines = content.split('\n');
  const range = headingRanges(content)[headingOrdinal];
  if (!range) {
    throw new Error(`Heading ordinal not found: ${headingOrdinal}`);
  }
  for (let index = range.start + 1; index < range.end; index += 1) {
    if (anchorPattern.test(lines[index])) {
      lines.splice(index + 1, 0, newLine);
      return lines.join('\n');
    }
  }
  throw new Error(`Anchor not found in heading section ${headingOrdinal}: ${anchorPattern}`);
}

function removeLines(content, linePattern) {
  return content
    .split('\n')
    .filter((line) => !linePattern.test(line))
    .join('\n');
}

function removeLinesOutsideHeadingSection(content, headingOrdinal, linePattern) {
  const lines = content.split('\n');
  const range = headingRanges(content)[headingOrdinal];
  if (!range) {
    throw new Error(`Heading ordinal not found: ${headingOrdinal}`);
  }
  return lines
    .filter((line, index) => {
      if (index > range.start && index < range.end) {
        return true;
      }
      return !linePattern.test(line);
    })
    .join('\n');
}

function removeLinesInHeadingSection(content, headingOrdinal, linePattern) {
  const lines = content.split('\n');
  const range = headingRanges(content)[headingOrdinal];
  if (!range) {
    throw new Error(`Heading ordinal not found: ${headingOrdinal}`);
  }
  return lines
    .filter((line, index) => {
      if (index > range.start && index < range.end) {
        return !linePattern.test(line);
      }
      return true;
    })
    .join('\n');
}

function dedupeLinesInHeadingSection(content, headingOrdinal, linePredicate) {
  const lines = content.split('\n');
  const range = headingRanges(content)[headingOrdinal];
  if (!range) {
    throw new Error(`Heading ordinal not found: ${headingOrdinal}`);
  }

  let seen = false;
  return lines
    .filter((line, index) => {
      if (index <= range.start || index >= range.end || !linePredicate(line)) {
        return true;
      }
      if (seen) {
        return false;
      }
      seen = true;
      return true;
    })
    .join('\n');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceLineAfter(content, anchorPattern, linePattern, newLine) {
  const lines = content.split('\n');
  const anchorIndex = lines.findIndex((line) => anchorPattern.test(line));
  if (anchorIndex === -1) {
    throw new Error(`Anchor not found for section line replacement: ${anchorPattern}`);
  }
  const index = lines.findIndex((line, lineIndex) => lineIndex > anchorIndex && linePattern.test(line));
  if (index === -1) {
    throw new Error(`Line not found after ${anchorPattern}: ${linePattern}`);
  }
  lines[index] = newLine;
  return lines.join('\n');
}

function replaceParagraphMatching(content, pattern, replacement) {
  const paragraphs = content.split(/\n{2,}/);
  const index = paragraphs.findIndex((paragraph) => pattern.test(paragraph));
  if (index === -1) {
    throw new Error(`Paragraph not found: ${pattern}`);
  }
  paragraphs[index] = replacement;
  return paragraphs.join('\n\n');
}

function insertParagraphBeforeMatch(content, pattern, replacement, existsPattern) {
  if (existsPattern.test(content)) {
    return content;
  }
  const paragraphs = content.split(/\n{2,}/);
  const index = paragraphs.findIndex((paragraph) => pattern.test(paragraph));
  if (index === -1) {
    throw new Error(`Paragraph anchor not found: ${pattern}`);
  }
  paragraphs.splice(index, 0, replacement);
  return paragraphs.join('\n\n');
}

function replaceFirstParagraphAfterLine(content, linePattern, replacement) {
  const lines = content.split('\n');
  const headingIndex = lines.findIndex((line) => linePattern.test(line));
  if (headingIndex === -1) {
    throw new Error(`Heading not found: ${linePattern}`);
  }

  let start = headingIndex + 1;
  while (start < lines.length && !lines[start].trim()) {
    start += 1;
  }
  let end = start;
  while (end < lines.length && lines[end].trim()) {
    end += 1;
  }
  lines.splice(start, end - start, replacement);
  return lines.join('\n');
}

function replaceParagraphAfterCircuitCommand(content, values) {
  const lines = content.split('\n');
  const commandIndex = lines.findIndex((line) =>
    line.includes('npm run diagram:export-circuitikz -- --input cmos-inverter.json --output cmos-inverter.tex'),
  );
  if (commandIndex === -1) {
    throw new Error('Circuit export command anchor not found');
  }

  let start = commandIndex + 1;
  while (start < lines.length && !lines[start].trim()) {
    start += 1;
  }
  if (lines[start]?.trim().startsWith('```')) {
    start += 1;
  }
  while (start < lines.length && !lines[start].trim()) {
    start += 1;
  }

  let end = start;
  while (end < lines.length && lines[end].trim()) {
    end += 1;
  }

  lines.splice(
    start,
    end - start,
    values.prototypeIntro,
    '',
    values.pipelineParagraph,
    '',
    values.layoutHintsParagraph,
  );
  return lines.join('\n');
}

function dedupeParagraphsMatching(content, paragraphPattern) {
  const paragraphs = content.split(/\n{2,}/);
  let seen = false;
  const deduped = paragraphs.filter((paragraph) => {
    if (!paragraphPattern.test(paragraph)) {
      return true;
    }
    if (seen) {
      return false;
    }
    seen = true;
    return true;
  });
  return deduped.join('\n\n');
}

function replaceParagraphBeforePreviewCircuit(content, replacement) {
  const paragraphs = content.split(/\n{2,}/);
  const index = paragraphs.findIndex((paragraph) =>
    paragraph.includes('`.tex`') &&
    paragraph.includes('`.tikz`') &&
    paragraph.includes('\\usepackage{circuitikz}'),
  );
  if (index <= 0) {
    throw new Error('Circuit preview paragraph anchor not found');
  }
  paragraphs[index - 1] = replacement;
  return paragraphs.join('\n\n');
}

function isPreviewPdfExportRow(line) {
  return line.startsWith('|') && line.includes('SVG') && line.includes('PDF');
}

function patchLocaleContent(content, values) {
  let patched = content.replace(/\r\n/g, '\n');
  patched = removeLines(patched, /^\| `circuit` \| circuitikz(, TikZJax)?.*\|/);
  patched = replaceFrontmatterDescription(patched, values.description);
  patched = replaceTldr(patched, values.tldr);
  patched = insertLineAfterOccurrence(
    patched,
    /^\| `dataChart` \|/,
    0,
    values.circuitTypeRow,
    /^\| `circuit` \| circuitikz \|/m,
  );
  patched = insertLineAfterOccurrence(
    patched,
    /^\| `canvasMap` \|/,
    1,
    values.circuitIntentRow,
    /^\| `circuit` \| circuitikz, TikZJax,/m,
  );
  patched = replaceParagraphInHeadingSection(
    patched,
    4,
    /Preferred render target|Cible de rendu|Renderziel|Objetivo de renderizado|렌더링 대상|レンダーターゲット|Editable HTML\/SVG|Mermaid[\s\S]*JSON Canvas[\s\S]*Vega-Lite[\s\S]*HTML/,
    values.renderTargetSentence,
  );
  patched = dedupeRenderTargetParagraphs(patched, 4);
  patched = replaceParagraphInHeadingSection(
    patched,
    4,
    /`flowchart`[\s\S]*Draw\.io[\s\S]*Drawnix/,
    values.separationParagraph,
  );
  patched = insertLineAfter(
    patched,
    /^\| .*HTML\/SVG.* \| `.html` \|/,
    [values.outputDrawioRow, values.outputDrawnixRow, values.outputCircuitikzRow].join('\n'),
    /`\.drawio` \+ `\.drawio\.svg` \+ `\.drawio\.md`/m,
  );

  patched = replaceLine(patched, /^3\.\s+.*SVG.*PNG.*$/m, values.previewStep3);
  patched = insertParagraphBeforeMatch(
    patched,
    /RenderArtifact\.diagnostics/,
    values.ppiParagraph,
    /preview PPI|configured preview PPI|600 PPI/,
  );
  patched = replaceParagraphMatching(patched, /RenderArtifact\.diagnostics/, values.diagnosticsParagraph);
  patched = replaceFirstParagraphAfterLine(patched, /^### .*Draw\.io.*Drawnix/, values.drawioIntro);
  patched = replaceLineAfter(patched, /^### .*Draw\.io.*Drawnix/, /^\| Draw\.io \|.*$/m, values.drawioContractRow);
  patched = replaceLineAfter(patched, /^### .*Draw\.io.*Drawnix/, /^\| Drawnix \|.*$/m, values.drawnixContractRow);
  patched = replaceParagraphAfterCircuitCommand(patched, values);
  patched = dedupeParagraphsMatching(
    patched,
    /CircuitikzRenderer[\s\S]*`intent:\s*"circuit"`[\s\S]*`circuitikz`|`intent:\s*"circuit"`[\s\S]*`circuitikz`[\s\S]*CircuitikzRenderer/,
  );
  patched = dedupeParagraphsMatching(
    patched,
    /`layoutHints\.inputSide`[\s\S]*`layoutHints\.outputSide`/,
  );
  patched = replaceParagraphBeforePreviewCircuit(patched, values.notGeneralTikzParagraph);
  patched = replaceLine(patched, /^\| .* \| .*`npm run diagram:export-artifact`.*$/m, values.progressCliRow);
  patched = replaceLine(patched, /^\| circuitikz \|.*$/m, values.progressCircuitRow);
  patched = insertLineAfterInHeadingSection(
    patched,
    20,
    /^\| `preferredDiagramIntent` \|/,
    values.configPreferredRenderTargetRow,
    /^\| `preferredDiagramRenderTarget` \|/m,
  );
  patched = replaceLineInHeadingSection(patched, 23, /^\| (?!.*PDF).*PNG.*\|$/m, values.pngExportRow);
  patched = insertLineAfterInHeadingSection(
    patched,
    23,
    new RegExp(`^${escapeRegExp(values.pngExportRow)}$`),
    values.pdfExportRow,
    /\| .*SVG.*PDF.*\|/m,
  );
  patched = dedupeLinesInHeadingSection(patched, 23, isPreviewPdfExportRow);
  patched = removeLinesInHeadingSection(
    patched,
    23,
    /^\| .*scripts\/diagram-semantic-verification\.js.* \|.*$/,
  );
  patched = upsertTableLineInHeadingSection(
    patched,
    23,
    /^\| .*?(Semantic audit|scripts\/diagram-semantic-verification\.js|renderer\/CLI).* \|$/m,
    values.semanticAuditRow,
  );
  patched = removeLinesOutsideHeadingSection(
    patched,
    23,
    /^\| .*scripts\/diagram-semantic-verification\.js.* \|$/,
  );
  return `${patched.replace(/\s+$/u, '')}\n`;
}

function markdownHeadingLevels(content) {
  const levels = [];
  let inFence = false;
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    const match = line.match(/^(#{1,6})\s+/);
    if (match) {
      levels.push(match[1].length);
    }
  }
  return levels;
}

function validateMarkdownTables(content, locale) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let tableBlock = [];

  const flushTableBlock = () => {
    if (tableBlock.length >= 2) {
      const expectedPipes = countTablePipes(tableBlock[1].text);
      for (const row of tableBlock) {
        const actualPipes = countTablePipes(row.text);
        if (actualPipes !== expectedPipes) {
          throw new Error(
            `${locale} markdown table column mismatch at line ${row.line}: expected ${expectedPipes} pipes, got ${actualPipes}`,
          );
        }
      }
    }
    tableBlock = [];
  };

  lines.forEach((line, index) => {
    if (line.startsWith('|') && !/\|\s*$/.test(line)) {
      throw new Error(`${locale} unterminated markdown table row at line ${index + 1}`);
    }
    if (/^\|.*\|\s*$/.test(line)) {
      tableBlock.push({line: index + 1, text: line});
      return;
    }
    flushTableBlock();
  });
  flushTableBlock();
}

function countLinesInHeadingSection(content, headingOrdinal, linePredicate) {
  const lines = content.split('\n');
  const range = headingRanges(content);
  const headingRange = range[headingOrdinal];
  if (!headingRange) {
    throw new Error(`Heading ordinal not found: ${headingOrdinal}`);
  }
  let count = 0;
  for (let index = headingRange.start + 1; index < headingRange.end; index += 1) {
    if (linePredicate(lines[index])) {
      count += 1;
    }
  }
  return count;
}

function countParagraphsMatching(content, paragraphPattern) {
  return content.split(/\n{2,}/).filter((paragraph) => paragraphPattern.test(paragraph)).length;
}

function validate(sourceContent, localizedContent, locale) {
  const sourceLevels = markdownHeadingLevels(sourceContent);
  const localizedLevels = markdownHeadingLevels(localizedContent);
  if (JSON.stringify(sourceLevels) !== JSON.stringify(localizedLevels)) {
    throw new Error(`${locale} heading levels do not mirror English`);
  }

  for (const term of markerTerms) {
    if (!localizedContent.includes(term)) {
      throw new Error(`${locale} missing marker ${term}`);
    }
  }

  if (/NMDPH|NMDSEGMENT|@@\d+@@/.test(localizedContent)) {
    throw new Error(`${locale} contains placeholder pollution`);
  }
  if (/[ \t]+$/m.test(localizedContent)) {
    throw new Error(`${locale} contains trailing whitespace`);
  }
  validateMarkdownTables(localizedContent, locale);
  const previewPdfRowCount = countLinesInHeadingSection(localizedContent, 23, isPreviewPdfExportRow);
  if (previewPdfRowCount !== 1) {
    throw new Error(`${locale} expected exactly one preview PDF export row, found ${previewPdfRowCount}`);
  }
  const circuitPipelineParagraphs = countParagraphsMatching(
    localizedContent,
    /CircuitikzRenderer[\s\S]*`intent:\s*"circuit"`[\s\S]*`circuitikz`|`intent:\s*"circuit"`[\s\S]*`circuitikz`[\s\S]*CircuitikzRenderer/,
  );
  if (circuitPipelineParagraphs !== 1) {
    throw new Error(`${locale} expected exactly one circuitikz pipeline paragraph, found ${circuitPipelineParagraphs}`);
  }
  const circuitLayoutParagraphs = countParagraphsMatching(
    localizedContent,
    /`layoutHints\.inputSide`[\s\S]*`layoutHints\.outputSide`/,
  );
  if (circuitLayoutParagraphs !== 1) {
    throw new Error(`${locale} expected exactly one circuitikz layout hints paragraph, found ${circuitLayoutParagraphs}`);
  }
}

async function main() {
  const options = parseArgs(process.argv);
  const publishedLocales = await loadPublishedLocales();
  const selectedLocales = publishedLocales
    .filter(({locale}) => !options.skip.has(locale))
    .filter(({locale}) => !options.locales.length || options.locales.includes(locale));
  if (!selectedLocales.length) {
    throw new Error('No locales selected');
  }

  const sourceContent = fs.readFileSync(path.join(docsRoot, sourcePath), 'utf8').replace(/\r\n/g, '\n');
  validate(sourceContent, sourceContent, 'source');
  console.log(
    JSON.stringify(
      {
        sourcePath,
        endpoint,
        model,
        write: options.write,
        concurrency: options.concurrency,
        batchContextLimit: options.batchContextLimit,
        locales: selectedLocales.map(({locale}) => locale),
      },
      null,
      2,
    ),
  );

  const translatedByLocale = await translateAllLocaleDeltas(selectedLocales, options);
  for (const {locale} of selectedLocales) {
    process.stdout.write(`[${locale}] patch locale source... `);
    const translatedDelta = translatedByLocale.get(locale);
    const targetPath = path.join(i18nRoot, locale, 'docusaurus-plugin-content-docs', 'current', sourcePath);
    const currentContent = fs.readFileSync(targetPath, 'utf8');
    const patchedContent = patchLocaleContent(currentContent, translatedDelta);
    try {
      validate(sourceContent, patchedContent, locale);
    } catch (error) {
      if (options.debugOutputDir) {
        fs.mkdirSync(options.debugOutputDir, {recursive: true});
        fs.writeFileSync(path.join(options.debugOutputDir, `${locale}-diagrams.mdx`), patchedContent, 'utf8');
      }
      throw error;
    }
    if (options.write) {
      fs.writeFileSync(targetPath, patchedContent, 'utf8');
    }
    console.log(options.write ? 'written' : 'validated');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
