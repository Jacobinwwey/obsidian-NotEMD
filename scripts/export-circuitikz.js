#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

function printUsage() {
  console.log(`Notemd circuitikz export

Usage:
  node scripts/export-circuitikz.js --input <circuit-spec.json> --output <circuit.tex>

Example:
  node scripts/export-circuitikz.js --input cmos-inverter.json --output cmos-inverter.tex
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
      case '--output':
        args.output = argv[++index];
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

function assertRequiredArgs(args) {
  if (!args.input) {
    throw new Error('Missing required --input.');
  }
  if (!args.output) {
    throw new Error('Missing required --output.');
  }
}

function loadCircuitSpec(inputPath) {
  const source = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
  const spec = JSON.parse(source);
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    throw new Error('CircuitSpec JSON must be an object.');
  }
  return spec;
}

function ensureOutputDirectory(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function buildExporterBundle(repoRoot) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-circuitikz-exporter-'));
  const outfile = path.join(tempRoot, 'circuitikz-exporter.cjs');
  const entrySource = `
    import { exportCircuitSpecToCircuitikz } from './src/diagram/adapters/circuitikz/circuitikzExporter';

    export function exportCircuitikz(spec) {
      return exportCircuitSpecToCircuitikz(spec);
    }
  `;

  buildSync({
    stdin: {
      contents: entrySource,
      resolveDir: repoRoot,
      loader: 'ts',
      sourcefile: 'circuitikz-exporter.ts'
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
  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output);
  const spec = loadCircuitSpec(inputPath);
  const bundle = buildExporterBundle(repoRoot);

  try {
    const { exportCircuitikz } = require(bundle.outfile);
    const content = exportCircuitikz(spec);
    ensureOutputDirectory(outputPath);
    fs.writeFileSync(outputPath, content, 'utf8');

    return {
      circuitKind: spec.circuitKind,
      goldenReferenceId: spec.goldenReferenceId,
      inputPath,
      outputPath,
      componentCount: Array.isArray(spec.components) ? spec.components.length : 0,
      connectionCount: Array.isArray(spec.connections) ? spec.connections.length : 0
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
  parseArgs,
  run
};
