#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const SUPPORTED_TARGETS = ['editable-html-svg', 'drawio', 'drawnix', 'svg'];

function printUsage() {
  console.log(`Notemd diagram artifact export

Usage:
  node scripts/export-diagram-artifact.js --input <diagram-spec.json> --target <target> --output <artifact-path> [--preview-svg-output <svg-path>]

Targets:
  editable-html-svg   Self-contained HTML with inline editable SVG annotations
  drawio              Uncompressed diagrams.net mxfile XML
  drawnix             Minimal .drawnix JSON subset
  svg                 Obsidian-viewable SVG generated from the same SemanticFigureModel

Example:
  node scripts/export-diagram-artifact.js --input spec.json --target drawio --output figure.drawio
  node scripts/export-diagram-artifact.js --input spec.json --target drawio --output figure.drawio --preview-svg-output figure.drawio.svg
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

      if (target === 'svg') {
        return {
          content: renderSemanticFigureSvg(model),
          previewSvgContent: renderSemanticFigureSvg(model),
          summary: {
            mimeType: 'image/svg+xml',
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
  const spec = loadDiagramSpec(inputPath);
  const bundle = buildExporterBundle(repoRoot);

  try {
    const { exportDiagramArtifact } = require(bundle.outfile);
    const artifact = await exportDiagramArtifact(spec, target);
    ensureOutputDirectory(outputPath);
    fs.writeFileSync(outputPath, artifact.content, 'utf8');
    if (previewSvgOutputPath) {
      const previewSvgContent = artifact.previewSvgContent || (target === 'svg' ? artifact.content : undefined);
      if (!previewSvgContent) {
        throw new Error(`Target "${target}" does not provide a preview SVG artifact.`);
      }
      ensureOutputDirectory(previewSvgOutputPath);
      fs.writeFileSync(previewSvgOutputPath, previewSvgContent, 'utf8');
    }

    return {
      target,
      inputPath,
      outputPath,
      ...(previewSvgOutputPath ? { previewSvgOutputPath } : {}),
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
  normalizeTarget,
  parseArgs,
  run
};
