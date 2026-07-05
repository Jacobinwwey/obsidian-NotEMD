#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

function printUsage() {
  console.log(`Notemd circuitikz export

Usage:
  node scripts/export-circuitikz.js --input <circuit-spec.json> --output <circuit.tex>
  node scripts/export-circuitikz.js --input <circuit-spec.json> --output <circuit.tex> --compile-log <latex.log> --diagnostics-output <diagnostics.json>
  node scripts/export-circuitikz.js --input <circuit-spec.json> --output <circuit.tex> --compile-executable <renderer> --compile-arg <arg>...

Example:
  node scripts/export-circuitikz.js --input cmos-inverter.json --output cmos-inverter.tex
  node scripts/export-circuitikz.js --input cmos-inverter.json --output cmos-inverter.tex --compile-log cmos-inverter.log --diagnostics-output cmos-inverter.diagnostics.json
  node scripts/export-circuitikz.js --input cmos-inverter.json --output cmos-inverter.tex --compile-executable pdflatex --compile-arg -interaction=nonstopmode --compile-arg -halt-on-error --compile-arg -output-directory={outputDir} --compile-arg {tex}
`);
}

function parseArgs(argv) {
  const args = { compileArgs: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case '--input':
        args.input = argv[++index];
        break;
      case '--output':
        args.output = argv[++index];
        break;
      case '--compile-log':
        args.compileLog = argv[++index];
        break;
      case '--diagnostics-output':
        args.diagnosticsOutput = argv[++index];
        break;
      case '--compile-executable':
        args.compileExecutable = argv[++index];
        break;
      case '--compile-arg':
        args.compileArgs.push(argv[++index]);
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
  if (args.compileLog && args.compileExecutable) {
    throw new Error('--compile-log and --compile-executable cannot be used together.');
  }
  if (args.compileArgs.length > 0 && !args.compileExecutable) {
    throw new Error('--compile-arg requires --compile-executable.');
  }
  if (args.diagnosticsOutput && !args.compileLog && !args.compileExecutable) {
    throw new Error('--diagnostics-output requires --compile-log or --compile-executable.');
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
    import { diagnoseCircuitikzCompileLog } from './src/diagram/adapters/circuitikz/circuitikzDiagnostics';
    import { runCircuitikzCompile } from './src/diagram/adapters/circuitikz/circuitikzCompileRunner';

    export function exportCircuitikz(spec) {
      return exportCircuitSpecToCircuitikz(spec);
    }

    export function diagnoseCompileLog(logText) {
      return diagnoseCircuitikzCompileLog(logText);
    }

    export function runCompile(request) {
      return runCircuitikzCompile(request);
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
  const compileLogPath = args.compileLog ? path.resolve(args.compileLog) : undefined;
  const diagnosticsOutputPath = args.diagnosticsOutput ? path.resolve(args.diagnosticsOutput) : undefined;
  const compileExecutable = args.compileExecutable;
  const spec = loadCircuitSpec(inputPath);
  const bundle = buildExporterBundle(repoRoot);

  try {
    const { diagnoseCompileLog, exportCircuitikz, runCompile } = require(bundle.outfile);
    const content = exportCircuitikz(spec);
    ensureOutputDirectory(outputPath);
    fs.writeFileSync(outputPath, content, 'utf8');

    const result = {
      circuitKind: spec.circuitKind,
      goldenReferenceId: spec.goldenReferenceId,
      inputPath,
      outputPath,
      componentCount: Array.isArray(spec.components) ? spec.components.length : 0,
      connectionCount: Array.isArray(spec.connections) ? spec.connections.length : 0
    };

    if (compileLogPath) {
      const compileLog = fs.readFileSync(compileLogPath, 'utf8').replace(/^\uFEFF/, '');
      result.compileLogPath = compileLogPath;
      result.compileDiagnostics = diagnoseCompileLog(compileLog);

      if (diagnosticsOutputPath) {
        ensureOutputDirectory(diagnosticsOutputPath);
        fs.writeFileSync(diagnosticsOutputPath, `${JSON.stringify(result.compileDiagnostics, null, 2)}\n`, 'utf8');
        result.diagnosticsOutputPath = diagnosticsOutputPath;
      }
    }

    if (compileExecutable) {
      result.compileExecution = runCompile({
        executable: compileExecutable,
        args: args.compileArgs,
        texPath: outputPath,
        outputDirectory: path.dirname(outputPath)
      });
      result.compileDiagnostics = result.compileExecution.diagnostics;

      if (diagnosticsOutputPath) {
        ensureOutputDirectory(diagnosticsOutputPath);
        fs.writeFileSync(diagnosticsOutputPath, `${JSON.stringify(result.compileDiagnostics, null, 2)}\n`, 'utf8');
        result.diagnosticsOutputPath = diagnosticsOutputPath;
      }
    }

    return result;
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
    if (result.compileDiagnostics && !result.compileDiagnostics.ok) {
      process.stderr.write(`${result.compileDiagnostics.summary}\n`);
      process.exitCode = 1;
    }
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
