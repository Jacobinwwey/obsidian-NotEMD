#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const SUPPORTED_TARGETS = ['editable-html-svg', 'drawio', 'drawnix', 'svg', 'png', 'pdf'];
const DEFAULT_EXPORT_PPI = 300;
const MIN_EXPORT_PPI = 72;
const MAX_EXPORT_PPI = 600;
const METERS_PER_INCH = 0.0254;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function printUsage() {
  console.log(`Notemd diagram artifact export

Usage:
  node scripts/export-diagram-artifact.js --input <diagram-spec.json> --target <target> --output <artifact-path> [--preview-svg-output <svg-path>] [--preview-png-output <png-path>] [--preview-pdf-output <pdf-path>] [--ppi <72-600>]

Targets:
  editable-html-svg   Self-contained HTML with inline editable SVG annotations
  drawio              Uncompressed diagrams.net mxfile XML
  drawnix             Minimal .drawnix JSON subset
  svg                 Obsidian-viewable SVG generated from the same SemanticFigureModel
  png                 PNG generated from the same SemanticFigureModel
  pdf                 PDF generated from the same SemanticFigureModel

Example:
  node scripts/export-diagram-artifact.js --input spec.json --target drawio --output figure.drawio
  node scripts/export-diagram-artifact.js --input spec.json --target drawio --output figure.drawio --preview-svg-output figure.drawio.svg
  node scripts/export-diagram-artifact.js --input spec.json --target png --output figure.png --ppi 300
  node scripts/export-diagram-artifact.js --input spec.json --target pdf --output figure.pdf --ppi 300
`);
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case '--input':
        args.input = argv[++index];
        break;
      case '--target':
        args.target = argv[++index];
        break;
      case '--output':
        args.output = argv[++index];
        break;
      case '--preview-svg-output':
        args.previewSvgOutput = argv[++index];
        break;
      case '--preview-png-output':
        args.previewPngOutput = argv[++index];
        break;
      case '--preview-pdf-output':
        args.previewPdfOutput = argv[++index];
        break;
      case '--ppi':
        args.ppi = argv[++index];
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function normalizePpi(value) {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_EXPORT_PPI;
  }

  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_EXPORT_PPI;
  }

  return Math.max(MIN_EXPORT_PPI, Math.min(MAX_EXPORT_PPI, Math.round(parsed)));
}

function pngPixelsPerMeterFromPpi(value) {
  return Math.max(1, Math.round(normalizePpi(value) / METERS_PER_INCH));
}

function buildCrc32Table() {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

const PNG_CRC32_TABLE = buildCrc32Table();

function crc32Buffer(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = PNG_CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint32Buffer(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0, 0);
  return buffer;
}

function buildPngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  return Buffer.concat([
    uint32Buffer(data.byteLength),
    typeBuffer,
    data,
    uint32Buffer(crc32Buffer(crcInput))
  ]);
}

function buildPngPhysicalPixelDensityChunk(ppi) {
  const pixelsPerMeter = pngPixelsPerMeterFromPpi(ppi);
  const data = Buffer.alloc(9);
  data.writeUInt32BE(pixelsPerMeter, 0);
  data.writeUInt32BE(pixelsPerMeter, 4);
  data[8] = 1;
  return buildPngChunk('pHYs', data);
}

function applyPngPhysicalPixelDensityBuffer(input, ppi) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (bytes.byteLength < PNG_SIGNATURE.byteLength || !bytes.subarray(0, PNG_SIGNATURE.byteLength).equals(PNG_SIGNATURE)) {
    return bytes;
  }

  const densityChunk = buildPngPhysicalPixelDensityChunk(ppi);
  const chunks = [PNG_SIGNATURE];
  let offset = PNG_SIGNATURE.byteLength;
  let densityWritten = false;

  while (offset + 12 <= bytes.byteLength) {
    const length = bytes.readUInt32BE(offset);
    const typeOffset = offset + 4;
    const dataOffset = offset + 8;
    const chunkEnd = dataOffset + length + 4;
    if (chunkEnd > bytes.byteLength) {
      return bytes;
    }

    const type = bytes.toString('ascii', typeOffset, typeOffset + 4);
    if (type === 'pHYs') {
      if (!densityWritten) {
        chunks.push(densityChunk);
        densityWritten = true;
      }
    } else {
      if (type === 'IDAT' && !densityWritten) {
        chunks.push(densityChunk);
        densityWritten = true;
      }
      chunks.push(bytes.subarray(offset, chunkEnd));
    }

    offset = chunkEnd;
    if (type === 'IEND') {
      break;
    }
  }

  return densityWritten ? Buffer.concat(chunks) : bytes;
}

function writePngPhysicalPixelDensity(outputPath, ppi) {
  const png = fs.readFileSync(outputPath);
  fs.writeFileSync(outputPath, applyPngPhysicalPixelDensityBuffer(png, ppi));
}

function normalizeTarget(target) {
  if (target === 'draw.io') {
    return 'drawio';
  }
  if (target === 'editable-svg') {
    return 'editable-html-svg';
  }
  return target;
}

function assertRequiredArgs(args) {
  if (!args.input) {
    throw new Error('Missing required --input.');
  }
  if (!args.target) {
    throw new Error('Missing required --target.');
  }
  if (!args.output) {
    throw new Error('Missing required --output.');
  }
}

function assertSupportedTarget(target) {
  if (!SUPPORTED_TARGETS.includes(target)) {
    throw new Error(`Unsupported export target "${target}". Supported values: ${SUPPORTED_TARGETS.join(', ')}`);
  }
}

function loadDiagramSpec(inputPath) {
  const source = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(source);
}

function ensureOutputDirectory(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function parseSvgDimensions(svg) {
  const widthMatch = svg.match(/\bwidth="([^"]+)"/i);
  const heightMatch = svg.match(/\bheight="([^"]+)"/i);
  const parseLength = (value) => {
    const match = String(value || '').trim().match(/^([0-9]+(?:\.[0-9]+)?)/);
    return match ? Number(match[1]) : NaN;
  };
  const width = parseLength(widthMatch && widthMatch[1]);
  const height = parseLength(heightMatch && heightMatch[1]);
  if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
    return { width, height };
  }

  const viewBoxMatch = svg.match(/\bviewBox="([^"]+)"/i);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3]) && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }

  return { width: 1600, height: 900 };
}

function buildSvgRasterPage(svg, dimensions) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: ${dimensions.width}px;
      height: ${dimensions.height}px;
      overflow: hidden;
      background: #ffffff;
    }
    svg {
      display: block;
      width: ${dimensions.width}px;
      height: ${dimensions.height}px;
      background: #ffffff;
    }
  </style>
</head>
<body>${svg}</body>
</html>`;
}

async function renderSvgToImageFile(svg, outputPath, format, ppi) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (error) {
    throw new Error(`Playwright is required for ${format.toUpperCase()} export. Install dependencies before running this target. ${error instanceof Error ? error.message : String(error)}`);
  }

  const dimensions = parseSvgDimensions(svg);
  const scale = ppi / 96;
  const viewport = {
    width: Math.max(1, Math.ceil(dimensions.width)),
    height: Math.max(1, Math.ceil(dimensions.height))
  };
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: scale
    });
    const page = await context.newPage();
    await page.setContent(buildSvgRasterPage(svg, dimensions), { waitUntil: 'load' });

    if (format === 'png') {
      await page.screenshot({
        path: outputPath,
        fullPage: false,
        omitBackground: false
      });
      writePngPhysicalPixelDensity(outputPath, ppi);
      return {
        widthPx: Math.ceil(dimensions.width * scale),
        heightPx: Math.ceil(dimensions.height * scale)
      };
    }

    await page.pdf({
      path: outputPath,
      width: `${dimensions.width / 96}in`,
      height: `${dimensions.height / 96}in`,
      printBackground: true,
      preferCSSPageSize: false,
      pageRanges: '1'
    });
    return {
      widthPx: Math.ceil(dimensions.width * scale),
      heightPx: Math.ceil(dimensions.height * scale)
    };
  } finally {
    await browser.close();
  }
}

function buildExporterBundle(repoRoot) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-diagram-artifact-exporter-'));
  const outfile = path.join(tempRoot, 'diagram-artifact-exporter.cjs');
  const entrySource = `
    import { buildSemanticFigureModel } from './src/diagram/adapters/editableSvg/semanticFigureModel';
    import { exportSemanticFigureModelToDrawioXml, collectDrawioVisibleLabelMismatches } from './src/diagram/adapters/drawio/drawioExporter';
    import { exportSemanticFigureModelToDrawnixData, stringifyDrawnixExportedData, validateDrawnixExportedDataSubset } from './src/diagram/adapters/drawnix/drawnixExporter';
    import { EditableHtmlSvgRenderer, collectEditableSvgAnnotationGaps, renderSemanticFigureSvg } from './src/rendering/renderers/editableHtmlSvgRenderer';

    export async function exportDiagramArtifact(spec, target) {
      const model = buildSemanticFigureModel(spec);

      if (target === 'editable-html-svg') {
        const renderer = new EditableHtmlSvgRenderer();
        const artifact = await renderer.render(spec);
        const annotationGaps = collectEditableSvgAnnotationGaps(artifact.content);
        if (annotationGaps.length > 0) {
          throw new Error('Editable HTML/SVG annotation gaps: ' + annotationGaps.join('; '));
        }
        return {
          content: artifact.content,
          summary: {
            mimeType: artifact.mimeType,
            nodeCount: model.nodes.length,
            edgeCount: model.edges.length,
            annotationGapCount: annotationGaps.length
          }
        };
      }

      if (target === 'drawio') {
        const xml = exportSemanticFigureModelToDrawioXml(model);
        const labelMismatches = collectDrawioVisibleLabelMismatches(xml, model);
        if (labelMismatches.length > 0) {
          throw new Error('Draw.io visible label mismatches: ' + labelMismatches.join('; '));
        }
        return {
          content: xml,
          previewSvgContent: renderSemanticFigureSvg(model),
          summary: {
            mimeType: 'application/vnd.jgraph.mxfile',
            nodeCount: model.nodes.length,
            edgeCount: model.edges.length,
            labelMismatchCount: labelMismatches.length
          }
        };
      }

      if (target === 'drawnix') {
        const data = exportSemanticFigureModelToDrawnixData(model);
        const validationErrors = validateDrawnixExportedDataSubset(data);
        if (validationErrors.length > 0) {
          throw new Error('Drawnix subset validation failed: ' + validationErrors.join('; '));
        }
        return {
          content: stringifyDrawnixExportedData(data),
          previewSvgContent: renderSemanticFigureSvg(model),
          summary: {
            mimeType: 'application/json',
            nodeCount: model.nodes.length,
            edgeCount: model.edges.length,
            validationErrorCount: validationErrors.length
          }
        };
      }

      if (target === 'svg' || target === 'png' || target === 'pdf') {
        const svg = renderSemanticFigureSvg(model);
        return {
          content: svg,
          previewSvgContent: svg,
          summary: {
            mimeType: target === 'svg' ? 'image/svg+xml' : target === 'png' ? 'image/png' : 'application/pdf',
            nodeCount: model.nodes.length,
            edgeCount: model.edges.length
          }
        };
      }

      throw new Error('Unsupported export target in bundled exporter: ' + target);
    }
  `;

  buildSync({
    stdin: {
      contents: entrySource,
      resolveDir: repoRoot,
      loader: 'ts',
      sourcefile: 'diagram-artifact-exporter.ts'
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    logLevel: 'silent'
  });

  return {
    outfile,
    cleanup() {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  };
}

async function run(args, repoRoot = path.resolve(__dirname, '..')) {
  assertRequiredArgs(args);
  const target = normalizeTarget(args.target);
  assertSupportedTarget(target);

  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output);
  const previewSvgOutputPath = args.previewSvgOutput ? path.resolve(args.previewSvgOutput) : undefined;
  const previewPngOutputPath = args.previewPngOutput ? path.resolve(args.previewPngOutput) : undefined;
  const previewPdfOutputPath = args.previewPdfOutput ? path.resolve(args.previewPdfOutput) : undefined;
  const ppi = normalizePpi(args.ppi);
  const spec = loadDiagramSpec(inputPath);
  const bundle = buildExporterBundle(repoRoot);

  try {
    const { exportDiagramArtifact } = require(bundle.outfile);
    const artifact = await exportDiagramArtifact(spec, target);
    ensureOutputDirectory(outputPath);
    if (target === 'png' || target === 'pdf') {
      await renderSvgToImageFile(artifact.content, outputPath, target, ppi);
    } else {
      fs.writeFileSync(outputPath, artifact.content, 'utf8');
    }

    if (previewSvgOutputPath) {
      const previewSvgContent = artifact.previewSvgContent || (target === 'svg' ? artifact.content : undefined);
      if (!previewSvgContent) {
        throw new Error(`Target "${target}" does not provide a preview SVG artifact.`);
      }
      ensureOutputDirectory(previewSvgOutputPath);
      fs.writeFileSync(previewSvgOutputPath, previewSvgContent, 'utf8');
    }
    if (previewPngOutputPath) {
      const previewSvgContent = artifact.previewSvgContent || (target === 'svg' ? artifact.content : undefined);
      if (!previewSvgContent) {
        throw new Error(`Target "${target}" does not provide a preview SVG artifact for PNG export.`);
      }
      ensureOutputDirectory(previewPngOutputPath);
      await renderSvgToImageFile(previewSvgContent, previewPngOutputPath, 'png', ppi);
    }
    if (previewPdfOutputPath) {
      const previewSvgContent = artifact.previewSvgContent || (target === 'svg' ? artifact.content : undefined);
      if (!previewSvgContent) {
        throw new Error(`Target "${target}" does not provide a preview SVG artifact for PDF export.`);
      }
      ensureOutputDirectory(previewPdfOutputPath);
      await renderSvgToImageFile(previewSvgContent, previewPdfOutputPath, 'pdf', ppi);
    }

    return {
      target,
      inputPath,
      outputPath,
      ...(previewSvgOutputPath ? { previewSvgOutputPath } : {}),
      ...(previewPngOutputPath ? { previewPngOutputPath } : {}),
      ...(previewPdfOutputPath ? { previewPdfOutputPath } : {}),
      ...(target === 'png' || target === 'pdf' || previewPngOutputPath || previewPdfOutputPath ? { ppi } : {}),
      ...artifact.summary
    };
  } finally {
    bundle.cleanup();
  }
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      printUsage();
      return;
    }

    const result = await run(args);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  SUPPORTED_TARGETS,
  applyPngPhysicalPixelDensityBuffer,
  normalizePpi,
  normalizeTarget,
  pngPixelsPerMeterFromPpi,
  parseArgs,
  run
};
